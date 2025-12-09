# @AI-HINT: Enhanced wallet API with balance tracking, transaction history, and payout management
"""
Enhanced wallet management endpoints for the BILLION_DOLLAR_UPGRADE_PLAN
Includes: balances, transaction history, payouts, deposits, and analytics
"""

from typing import List, Optional
from datetime import datetime, timedelta
from decimal import Decimal
from enum import Enum

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field

from app.core.security import get_current_active_user
from app.models.user import User
from app.db.turso_http import execute_query

router = APIRouter()


# ==================== SCHEMAS ====================

class TransactionType(str, Enum):
    DEPOSIT = "deposit"
    WITHDRAWAL = "withdrawal"
    ESCROW_LOCK = "escrow_lock"
    ESCROW_RELEASE = "escrow_release"
    REFUND = "refund"
    BONUS = "bonus"
    FEE = "fee"
    MILESTONE_PAYMENT = "milestone_payment"


class TransactionStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class WalletBalance(BaseModel):
    available: float = Field(default=0.0, description="Available for withdrawal")
    pending: float = Field(default=0.0, description="Pending clearance")
    escrow: float = Field(default=0.0, description="Locked in escrow")
    total: float = Field(default=0.0, description="Total balance")
    currency: str = "USD"
    last_updated: str | None = None


class WalletTransaction(BaseModel):
    id: int
    type: str
    amount: float
    currency: str
    status: str
    description: str | None = None
    reference_id: str | None = None
    created_at: str
    completed_at: str | None = None


class WithdrawalRequest(BaseModel):
    amount: float = Field(..., gt=0, le=50000, description="Amount to withdraw")
    method: str = Field(..., pattern="^(bank_transfer|paypal|crypto|wise)$")
    destination: str = Field(..., min_length=5, max_length=200)
    currency: str = Field(default="USD", pattern="^(USD|EUR|GBP|USDC|USDT)$")


class DepositRequest(BaseModel):
    amount: float = Field(..., gt=0, le=100000)
    method: str = Field(..., pattern="^(card|bank_transfer|crypto)$")
    currency: str = Field(default="USD")


class PayoutSchedule(BaseModel):
    frequency: str = Field(..., pattern="^(instant|daily|weekly|monthly)$")
    minimum_amount: float = Field(default=100, ge=10)
    destination_type: str = Field(..., pattern="^(bank|paypal|crypto)$")
    destination_details: str


# ==================== HELPER FUNCTIONS ====================

def ensure_wallet_tables():
    """Create wallet tables if they don't exist"""
    execute_query("""
        CREATE TABLE IF NOT EXISTS wallet_balances (
            user_id INTEGER PRIMARY KEY,
            available REAL DEFAULT 0,
            pending REAL DEFAULT 0,
            escrow REAL DEFAULT 0,
            currency TEXT DEFAULT 'USD',
            updated_at TEXT
        )
    """)
    
    execute_query("""
        CREATE TABLE IF NOT EXISTS wallet_transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            type TEXT NOT NULL,
            amount REAL NOT NULL,
            currency TEXT DEFAULT 'USD',
            status TEXT DEFAULT 'pending',
            description TEXT,
            reference_id TEXT,
            metadata TEXT,
            created_at TEXT,
            completed_at TEXT
        )
    """)
    
    # Create performance indexes for wallet_transactions
    execute_query("""
        CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id 
        ON wallet_transactions(user_id)
    """)
    
    execute_query("""
        CREATE INDEX IF NOT EXISTS idx_wallet_transactions_status 
        ON wallet_transactions(status)
    """)
    
    execute_query("""
        CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_status 
        ON wallet_transactions(user_id, status)
    """)
    
    execute_query("""
        CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created 
        ON wallet_transactions(created_at DESC)
    """)
    
    execute_query("""
        CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_created 
        ON wallet_transactions(user_id, created_at DESC)
    """)
    
    execute_query("""
        CREATE TABLE IF NOT EXISTS payout_schedules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER UNIQUE NOT NULL,
            frequency TEXT DEFAULT 'weekly',
            minimum_amount REAL DEFAULT 100,
            destination_type TEXT,
            destination_details TEXT,
            is_active INTEGER DEFAULT 1,
            next_payout_at TEXT,
            created_at TEXT,
            updated_at TEXT
        )
    """)


def get_or_create_balance(user_id: int) -> dict:
    """Get user's wallet balance, creating entry if needed"""
    result = execute_query(
        "SELECT available, pending, escrow, currency, updated_at FROM wallet_balances WHERE user_id = ?",
        [user_id]
    )
    
    if result and result.get("rows") and len(result["rows"]) > 0:
        row = result["rows"][0]
        def get_val(r, idx, default=0):
            cell = r[idx] if idx < len(r) else default
            if isinstance(cell, dict):
                return cell.get("value") if cell.get("type") != "null" else default
            return cell if cell is not None else default
        
        available = float(get_val(row, 0, 0))
        pending = float(get_val(row, 1, 0))
        escrow = float(get_val(row, 2, 0))
        
        return {
            "available": available,
            "pending": pending,
            "escrow": escrow,
            "total": available + pending + escrow,
            "currency": get_val(row, 3, "USD"),
            "last_updated": get_val(row, 4, None)
        }
    
    # Create new balance record
    now = datetime.utcnow().isoformat()
    execute_query(
        "INSERT INTO wallet_balances (user_id, available, pending, escrow, currency, updated_at) VALUES (?, 0, 0, 0, 'USD', ?)",
        [user_id, now]
    )
    return {"available": 0, "pending": 0, "escrow": 0, "total": 0, "currency": "USD", "last_updated": now}


# ==================== ENDPOINTS ====================

@router.get("/balance", response_model=WalletBalance)
async def get_wallet_balance(
    current_user: User = Depends(get_current_active_user)
):
    """Get current wallet balance with breakdown"""
    ensure_wallet_tables()
    balance = get_or_create_balance(current_user.id)
    return WalletBalance(**balance)


@router.get("/transactions", response_model=List[WalletTransaction])
async def get_transaction_history(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    type: Optional[str] = Query(None, description="Filter by transaction type"),
    status: Optional[str] = Query(None, description="Filter by status"),
    from_date: Optional[str] = Query(None, description="Start date (ISO format)"),
    to_date: Optional[str] = Query(None, description="End date (ISO format)"),
    current_user: User = Depends(get_current_active_user)
):
    """Get wallet transaction history with filters"""
    ensure_wallet_tables()
    
    sql = "SELECT id, type, amount, currency, status, description, reference_id, created_at, completed_at FROM wallet_transactions WHERE user_id = ?"
    params = [current_user.id]
    
    if type:
        sql += " AND type = ?"
        params.append(type)
    
    if status:
        sql += " AND status = ?"
        params.append(status)
    
    if from_date:
        sql += " AND created_at >= ?"
        params.append(from_date)
    
    if to_date:
        sql += " AND created_at <= ?"
        params.append(to_date)
    
    sql += f" ORDER BY created_at DESC LIMIT {limit} OFFSET {skip}"
    
    result = execute_query(sql, params)
    
    transactions = []
    if result and result.get("rows"):
        for row in result["rows"]:
            def get_val(r, idx, default=None):
                cell = r[idx] if idx < len(r) else default
                if isinstance(cell, dict):
                    return cell.get("value") if cell.get("type") != "null" else default
                return cell if cell is not None else default
            
            transactions.append(WalletTransaction(
                id=get_val(row, 0),
                type=get_val(row, 1, "unknown"),
                amount=float(get_val(row, 2, 0)),
                currency=get_val(row, 3, "USD"),
                status=get_val(row, 4, "pending"),
                description=get_val(row, 5),
                reference_id=get_val(row, 6),
                created_at=get_val(row, 7, ""),
                completed_at=get_val(row, 8)
            ))
    
    return transactions


@router.post("/withdraw")
async def request_withdrawal(
    request: WithdrawalRequest,
    current_user: User = Depends(get_current_active_user)
):
    """Request a withdrawal from available balance"""
    ensure_wallet_tables()
    
    # Check available balance
    balance = get_or_create_balance(current_user.id)
    if balance["available"] < request.amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient available balance. Available: ${balance['available']:.2f}"
        )
    
    # Minimum withdrawal
    if request.amount < 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Minimum withdrawal amount is $10"
        )
    
    now = datetime.utcnow().isoformat()
    reference_id = f"WD-{current_user.id}-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
    
    # Deduct from available, add to pending
    execute_query(
        "UPDATE wallet_balances SET available = available - ?, pending = pending + ?, updated_at = ? WHERE user_id = ?",
        [request.amount, request.amount, now, current_user.id]
    )
    
    # Create transaction record
    execute_query("""
        INSERT INTO wallet_transactions (user_id, type, amount, currency, status, description, reference_id, metadata, created_at)
        VALUES (?, 'withdrawal', ?, ?, 'processing', ?, ?, ?, ?)
    """, [
        current_user.id,
        request.amount,
        request.currency,
        f"Withdrawal to {request.method}",
        reference_id,
        f'{{"method": "{request.method}", "destination": "{request.destination}"}}',
        now
    ])
    
    # Calculate estimated arrival
    estimated_days = {
        "bank_transfer": 3,
        "paypal": 1,
        "crypto": 0,  # instant
        "wise": 1
    }
    eta = datetime.utcnow() + timedelta(days=estimated_days.get(request.method, 3))
    
    return {
        "message": "Withdrawal request submitted",
        "reference_id": reference_id,
        "amount": request.amount,
        "currency": request.currency,
        "method": request.method,
        "status": "processing",
        "estimated_arrival": eta.isoformat()
    }


@router.post("/deposit")
async def initiate_deposit(
    request: DepositRequest,
    current_user: User = Depends(get_current_active_user)
):
    """Initiate a deposit to wallet"""
    ensure_wallet_tables()
    
    now = datetime.utcnow().isoformat()
    reference_id = f"DEP-{current_user.id}-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
    
    # Create pending transaction
    execute_query("""
        INSERT INTO wallet_transactions (user_id, type, amount, currency, status, description, reference_id, metadata, created_at)
        VALUES (?, 'deposit', ?, ?, 'pending', ?, ?, ?, ?)
    """, [
        current_user.id,
        request.amount,
        request.currency,
        f"Deposit via {request.method}",
        reference_id,
        f'{{"method": "{request.method}"}}',
        now
    ])
    
    # Generate payment details based on method
    payment_details = {}
    if request.method == "card":
        payment_details = {
            "type": "stripe_checkout",
            "checkout_url": f"https://checkout.stripe.com/pay/{reference_id}",  # Mock
            "expires_at": (datetime.utcnow() + timedelta(hours=1)).isoformat()
        }
    elif request.method == "crypto":
        payment_details = {
            "type": "crypto_address",
            "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bE1e",  # Mock
            "network": "Ethereum",
            "amount_crypto": request.amount / 2500,  # Mock ETH conversion
            "expires_at": (datetime.utcnow() + timedelta(hours=24)).isoformat()
        }
    else:
        payment_details = {
            "type": "bank_transfer",
            "bank_name": "MegiLance Trust Bank",
            "account_number": "****4521",
            "routing_number": "021000021",
            "reference": reference_id
        }
    
    return {
        "message": "Deposit initiated",
        "reference_id": reference_id,
        "amount": request.amount,
        "currency": request.currency,
        "method": request.method,
        "status": "pending",
        "payment_details": payment_details
    }


@router.get("/analytics")
async def get_wallet_analytics(
    period: str = Query("30d", pattern="^(7d|30d|90d|1y|all)$"),
    current_user: User = Depends(get_current_active_user)
):
    """Get wallet analytics and insights"""
    ensure_wallet_tables()
    
    # Calculate date range
    period_days = {"7d": 7, "30d": 30, "90d": 90, "1y": 365, "all": 3650}
    start_date = (datetime.utcnow() - timedelta(days=period_days.get(period, 30))).isoformat()
    
    # Get income
    income_result = execute_query("""
        SELECT COALESCE(SUM(amount), 0) FROM wallet_transactions 
        WHERE user_id = ? AND type IN ('deposit', 'escrow_release', 'milestone_payment', 'bonus')
        AND status = 'completed' AND created_at >= ?
    """, [current_user.id, start_date])
    
    total_income = 0
    if income_result and income_result.get("rows"):
        row = income_result["rows"][0]
        val = row[0]
        if isinstance(val, dict):
            total_income = float(val.get("value", 0) or 0)
        else:
            total_income = float(val or 0)
    
    # Get expenses (withdrawals, fees)
    expense_result = execute_query("""
        SELECT COALESCE(SUM(amount), 0) FROM wallet_transactions 
        WHERE user_id = ? AND type IN ('withdrawal', 'fee', 'escrow_lock')
        AND status = 'completed' AND created_at >= ?
    """, [current_user.id, start_date])
    
    total_expenses = 0
    if expense_result and expense_result.get("rows"):
        row = expense_result["rows"][0]
        val = row[0]
        if isinstance(val, dict):
            total_expenses = float(val.get("value", 0) or 0)
        else:
            total_expenses = float(val or 0)
    
    # Get transaction count
    count_result = execute_query("""
        SELECT COUNT(*) FROM wallet_transactions 
        WHERE user_id = ? AND created_at >= ?
    """, [current_user.id, start_date])
    
    transaction_count = 0
    if count_result and count_result.get("rows"):
        row = count_result["rows"][0]
        val = row[0]
        if isinstance(val, dict):
            transaction_count = int(val.get("value", 0) or 0)
        else:
            transaction_count = int(val or 0)
    
    # Get current balance
    balance = get_or_create_balance(current_user.id)
    
    return {
        "period": period,
        "total_income": total_income,
        "total_expenses": total_expenses,
        "net_flow": total_income - total_expenses,
        "transaction_count": transaction_count,
        "current_balance": balance,
        "insights": [
            {"type": "tip", "message": "Set up automatic payouts to reduce withdrawal fees"},
            {"type": "stat", "message": f"You've earned ${total_income:.2f} in the last {period}"}
        ] if total_income > 0 else []
    }


@router.get("/payout-schedule")
async def get_payout_schedule(
    current_user: User = Depends(get_current_active_user)
):
    """Get user's automatic payout schedule"""
    ensure_wallet_tables()
    
    result = execute_query("""
        SELECT frequency, minimum_amount, destination_type, destination_details, is_active, next_payout_at
        FROM payout_schedules WHERE user_id = ?
    """, [current_user.id])
    
    if result and result.get("rows") and len(result["rows"]) > 0:
        row = result["rows"][0]
        def get_val(r, idx, default=None):
            cell = r[idx] if idx < len(r) else default
            if isinstance(cell, dict):
                return cell.get("value") if cell.get("type") != "null" else default
            return cell if cell is not None else default
        
        return {
            "is_configured": True,
            "frequency": get_val(row, 0, "weekly"),
            "minimum_amount": float(get_val(row, 1, 100)),
            "destination_type": get_val(row, 2),
            "destination_details": get_val(row, 3),
            "is_active": bool(get_val(row, 4, 1)),
            "next_payout_at": get_val(row, 5)
        }
    
    return {
        "is_configured": False,
        "message": "No automatic payout schedule configured"
    }


@router.post("/payout-schedule")
async def set_payout_schedule(
    schedule: PayoutSchedule,
    current_user: User = Depends(get_current_active_user)
):
    """Configure automatic payout schedule"""
    ensure_wallet_tables()
    
    now = datetime.utcnow().isoformat()
    
    # Calculate next payout date
    next_payout_days = {"instant": 0, "daily": 1, "weekly": 7, "monthly": 30}
    next_payout = (datetime.utcnow() + timedelta(days=next_payout_days.get(schedule.frequency, 7))).isoformat()
    
    # Upsert schedule
    execute_query("""
        INSERT INTO payout_schedules (user_id, frequency, minimum_amount, destination_type, destination_details, is_active, next_payout_at, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
            frequency = excluded.frequency,
            minimum_amount = excluded.minimum_amount,
            destination_type = excluded.destination_type,
            destination_details = excluded.destination_details,
            is_active = 1,
            next_payout_at = excluded.next_payout_at,
            updated_at = excluded.updated_at
    """, [
        current_user.id,
        schedule.frequency,
        schedule.minimum_amount,
        schedule.destination_type,
        schedule.destination_details,
        next_payout,
        now,
        now
    ])
    
    return {
        "message": "Payout schedule configured",
        "frequency": schedule.frequency,
        "minimum_amount": schedule.minimum_amount,
        "destination_type": schedule.destination_type,
        "next_payout_at": next_payout,
        "is_active": True
    }


@router.delete("/payout-schedule")
async def disable_payout_schedule(
    current_user: User = Depends(get_current_active_user)
):
    """Disable automatic payouts"""
    ensure_wallet_tables()
    
    execute_query(
        "UPDATE payout_schedules SET is_active = 0, updated_at = ? WHERE user_id = ?",
        [datetime.utcnow().isoformat(), current_user.id]
    )
    
    return {"message": "Automatic payouts disabled"}
