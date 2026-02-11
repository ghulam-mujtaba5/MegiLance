"""
@AI-HINT: Payment tracking endpoints using Turso remote database ONLY
No local SQLite fallback - all queries go directly to Turso
"""

from typing import List, Optional
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.security import get_current_active_user
from app.models.user import User
from app.schemas.payment import PaymentCreate, PaymentRead, PaymentUpdate
from app.db.turso_http import get_turso_http
import logging

logger = logging.getLogger("megilance")

router = APIRouter()

# Validation constants
ALLOWED_PAYMENT_STATUSES = {"pending", "processing", "completed", "failed", "refunded", "cancelled"}
ALLOWED_CURRENCIES = {"USD", "USDT", "ETH", "BTC"}
ALLOWED_PAYMENT_TYPES = {"milestone", "full", "hourly", "escrow", "refund", "bonus"}
ALLOWED_DIRECTIONS = {"incoming", "outgoing"}
MAX_AMOUNT = Decimal("1000000")  # 1 million max per transaction
MIN_AMOUNT = Decimal("0.01")


def validate_amount(amount: float) -> Decimal:
    """Validate and convert payment amount."""
    try:
        decimal_amount = Decimal(str(amount))
        if decimal_amount < MIN_AMOUNT:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Amount must be at least {MIN_AMOUNT}"
            )
        if decimal_amount > MAX_AMOUNT:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Amount cannot exceed {MAX_AMOUNT}"
            )
        return decimal_amount
    except InvalidOperation:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid amount format"
        )


def _row_to_payment(row: list, columns: list = None) -> dict:
    """Convert database row to payment dict using column names"""
    if columns is None:
        columns = ["id", "contract_id", "from_user_id", "to_user_id", "amount", 
                   "currency", "status", "payment_type", "tx_hash", "escrow_address",
                   "description", "created_at", "updated_at", "completed_at"]
    
    # Build dict from column names
    raw = {}
    for i, col in enumerate(columns):
        raw[col] = row[i] if i < len(row) else None
    
    payment = {}
    for col in columns:
        val = raw.get(col)
        if col == "amount" and val is not None:
            payment[col] = round(float(val), 2)
        elif col == "tx_hash":
            payment["transaction_hash"] = val
            payment[col] = val
        else:
            payment[col] = val
            
    # Ensure required fields for Pydantic model
    if "currency" not in payment or payment["currency"] is None:
        payment["currency"] = "USD"
        
    return payment


@router.get("/", response_model=List[PaymentRead])
def list_payments(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=100, description="Max records to return"),
    contract_id: Optional[str] = Query(None, max_length=50, description="Filter by contract"),
    payment_status: Optional[str] = Query(None, alias="status", description="Filter by payment status"),
    direction: Optional[str] = Query(None, description="incoming or outgoing"),
    current_user: User = Depends(get_current_active_user)
):
    """List payments for the authenticated user with optional filters."""
    # Validate filter values
    if payment_status and payment_status.lower() not in ALLOWED_PAYMENT_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Allowed: {', '.join(ALLOWED_PAYMENT_STATUSES)}"
        )
    if direction and direction.lower() not in ALLOWED_DIRECTIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid direction. Allowed: {', '.join(ALLOWED_DIRECTIONS)}"
        )
    
    try:
        turso = get_turso_http()
        
        # Updated query to match actual schema
        # Schema has: blockchain_tx_hash, processed_at
        # Missing: currency, escrow_address
        sql = """SELECT id, contract_id, from_user_id, to_user_id, amount, 
                        'USD' as currency, status, payment_type, blockchain_tx_hash as tx_hash, NULL as escrow_address,
                        description, created_at, updated_at, processed_at as completed_at 
                 FROM payments WHERE 1=1"""
        params = []
        
        # Restrict payments to user unless admin
        if current_user.role != "admin" and current_user.user_type != "admin":
            if direction == "incoming":
                sql += " AND to_user_id = ?"
                params.append(current_user.id)
            elif direction == "outgoing":
                sql += " AND from_user_id = ?"
                params.append(current_user.id)
            else:
                sql += " AND (from_user_id = ? OR to_user_id = ?)"
                params.extend([current_user.id, current_user.id])
        
        if contract_id:
            sql += " AND contract_id = ?"
            params.append(contract_id)
        if payment_status:
            sql += " AND status = ?"
            params.append(payment_status.lower())
        
        sql += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
        params.extend([limit, skip])
        
        result = turso.execute(sql, params)
        columns = result.get("columns", [])
        payments = [_row_to_payment(row, columns) for row in result.get("rows", [])]
        return payments
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("list_payments failed: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database temporarily unavailable"
        )


@router.get("/{payment_id}", response_model=PaymentRead)
def get_payment(
    payment_id: int,
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific payment by ID."""
    try:
        turso = get_turso_http()
        row = turso.fetch_one(
            """SELECT id, contract_id, from_user_id, to_user_id, amount, 
                      'USD' as currency, status, payment_type, blockchain_tx_hash as tx_hash, NULL as escrow_address,
                      description, created_at, updated_at, processed_at as completed_at 
               FROM payments WHERE id = ?""",
            [payment_id]
        )
        
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")
        
        result = turso.execute(
            """SELECT id, contract_id, from_user_id, to_user_id, amount, 
                      'USD' as currency, status, payment_type, blockchain_tx_hash as tx_hash, NULL as escrow_address,
                      description, created_at, updated_at, processed_at as completed_at 
               FROM payments WHERE id = ?""",
            [payment_id]
        )
        rows = result.get("rows", [])
        if not rows:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")
        
        payment = _row_to_payment(rows[0], result.get("columns", []))
        
        # Check access
        if current_user.role != "admin":
            if payment["from_user_id"] != current_user.id and payment["to_user_id"] != current_user.id:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        
        return payment
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("get_payment failed: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database temporarily unavailable"
        )


def validate_payment_input(payment: PaymentCreate) -> None:
    """Validate payment creation input."""
    # Validate amount
    validate_amount(payment.amount)
    
    # Validate currency
    currency = (payment.currency or "USD").upper()
    if currency not in ALLOWED_CURRENCIES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid currency. Allowed: {', '.join(ALLOWED_CURRENCIES)}"
        )
    
    # Validate payment type
    payment_type = (payment.payment_type or "milestone").lower()
    if payment_type not in ALLOWED_PAYMENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid payment type. Allowed: {', '.join(ALLOWED_PAYMENT_TYPES)}"
        )
    
    # Validate description length
    if payment.description and len(payment.description) > 1000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Description cannot exceed 1000 characters"
        )


@router.post("/", response_model=PaymentRead, status_code=status.HTTP_201_CREATED)
def create_payment(
    payment: PaymentCreate,
    current_user: User = Depends(get_current_active_user)
):
    """Create a new payment record."""
    # Validate input
    validate_payment_input(payment)
    
    # Prevent self-payment
    if payment.to_user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot send payment to yourself"
        )
    
    try:
        turso = get_turso_http()
        
        # Verify recipient exists
        recipient = turso.fetch_one(
            "SELECT id, is_active FROM users WHERE id = ?",
            [payment.to_user_id]
        )
        if not recipient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Recipient user not found"
            )
        if not recipient[1]:  # is_active
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Recipient account is not active"
            )
        
        now = datetime.now(timezone.utc).isoformat()
        # currency = (payment.currency or "USD").upper() # Not stored in DB
        payment_type = (payment.payment_type or "milestone").lower()
        description = (payment.description or "")[:1000]  # Truncate to limit
        
        # Calculate platform fee from settings
        from app.core.config import get_settings
        settings = get_settings()
        fee_percent = settings.STRIPE_PLATFORM_FEE_PERCENT / 100.0
        platform_fee = round(float(payment.amount) * fee_percent, 2)
        freelancer_amount = round(float(payment.amount) - platform_fee, 2)
        
        # Insert with required fields
        turso.execute(
            """INSERT INTO payments (contract_id, from_user_id, to_user_id, amount,
                                     payment_type, payment_method, status, description,
                                     platform_fee, freelancer_amount,
                                     created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            [payment.contract_id, current_user.id, payment.to_user_id, payment.amount,
             payment_type, "crypto", "pending", description, 
             platform_fee, freelancer_amount,
             now, now]
        )
        
        # Get created payment
        row = turso.fetch_one(
            """SELECT id, contract_id, from_user_id, to_user_id, amount, 
                      'USD' as currency, status, payment_type, blockchain_tx_hash as tx_hash, NULL as escrow_address,
                      description, created_at, updated_at, processed_at as completed_at 
               FROM payments WHERE from_user_id = ? ORDER BY id DESC LIMIT 1""",
            [current_user.id]
        )
        
        return _row_to_payment(row)
        
    except Exception as e:
        logger.error("create_payment failed: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database temporarily unavailable"
        )


@router.put("/{payment_id}", response_model=PaymentRead)
def update_payment(
    payment_id: int,
    payment_update: PaymentUpdate,
    current_user: User = Depends(get_current_active_user)
):
    """Update a payment (admin or payment creator only)."""
    try:
        turso = get_turso_http()
        
        # Check payment exists
        existing = turso.fetch_one(
            "SELECT from_user_id, status FROM payments WHERE id = ?",
            [payment_id]
        )
        if not existing:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")
        
        # Check authorization
        if current_user.role != "admin" and existing[0] != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
        
        # Prevent modification of completed/refunded payments
        current_status = existing[1] if len(existing) > 1 else None
        if current_status in ("completed", "refunded"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot modify a {current_status} payment"
            )
        
        # Build update
        updates = []
        params = []
        update_data = payment_update.dict(exclude_unset=True)
        
        for key, value in update_data.items():
            # Validate status
            if key == "status" and value:
                if value.lower() not in ALLOWED_PAYMENT_STATUSES:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Invalid status. Allowed: {', '.join(ALLOWED_PAYMENT_STATUSES)}"
                    )
                value = value.lower()
            # Validate currency - Ignore as not in DB
            if key == "currency":
                continue
            # Validate payment_type
            if key == "payment_type" and value:
                if value.lower() not in ALLOWED_PAYMENT_TYPES:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Invalid payment type. Allowed: {', '.join(ALLOWED_PAYMENT_TYPES)}"
                    )
                value = value.lower()
            # Validate description length
            if key == "description" and value:
                value = value[:1000]
            # Validate amount
            if key == "amount" and value is not None:
                validate_amount(value)
            
            # Map keys to DB columns
            if key == "transaction_hash":
                updates.append("blockchain_tx_hash = ?")
                params.append(value)
            else:
                updates.append(f"{key} = ?")
                params.append(value)
        
        if updates:
            updates.append("updated_at = ?")
            params.append(datetime.now(timezone.utc).isoformat())
            params.append(payment_id)
            
            turso.execute(f"UPDATE payments SET {', '.join(updates)} WHERE id = ?", params)
        
        # Return updated payment
        row = turso.fetch_one(
            """SELECT id, contract_id, from_user_id, to_user_id, amount, 
                      'USD' as currency, status, payment_type, blockchain_tx_hash as tx_hash, NULL as escrow_address,
                      description, created_at, updated_at, processed_at as completed_at 
               FROM payments WHERE id = ?""",
            [payment_id]
        )
        return _row_to_payment(row)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("update_payment failed: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database temporarily unavailable"
        )


@router.post("/{payment_id}/complete", response_model=PaymentRead)
def complete_payment(
    payment_id: int,
    tx_hash: Optional[str] = None,
    current_user: User = Depends(get_current_active_user)
):
    """Mark a payment as completed (admin only — prevents self-completion fraud)."""
    try:
        turso = get_turso_http()
        
        existing = turso.fetch_one("SELECT from_user_id, to_user_id, status FROM payments WHERE id = ?", [payment_id])
        if not existing:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")
        
        # Only admin can mark payments complete to prevent fraud
        if current_user.role != "admin" and current_user.user_type != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only administrators can mark payments as completed"
            )
        
        # Validate current status allows completion
        current_status = existing[2] if len(existing) > 2 else None
        if current_status not in ("pending", "processing"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot complete a payment with status '{current_status}'"
            )
        
        now = datetime.now(timezone.utc).isoformat()
        turso.execute(
            "UPDATE payments SET status = ?, processed_at = ?, blockchain_tx_hash = ?, updated_at = ? WHERE id = ?",
            ["completed", now, tx_hash, now, payment_id]
        )
        
        row = turso.fetch_one(
            """SELECT id, contract_id, from_user_id, to_user_id, amount, 
                      'USD' as currency, status, payment_type, blockchain_tx_hash as tx_hash, NULL as escrow_address,
                      description, created_at, updated_at, processed_at as completed_at 
               FROM payments WHERE id = ?""",
            [payment_id]
        )
        return _row_to_payment(row)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("complete_payment failed: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database temporarily unavailable"
        )


@router.get("/stats/summary")
def get_payment_stats(
    current_user: User = Depends(get_current_active_user)
):
    """Get payment statistics for the current user."""
    try:
        turso = get_turso_http()
        
        # Get totals
        incoming = turso.fetch_one(
            "SELECT COALESCE(SUM(amount), 0) FROM payments WHERE to_user_id = ? AND status = 'completed'",
            [current_user.id]
        )
        outgoing = turso.fetch_one(
            "SELECT COALESCE(SUM(amount), 0) FROM payments WHERE from_user_id = ? AND status = 'completed'",
            [current_user.id]
        )
        pending = turso.fetch_one(
            "SELECT COALESCE(SUM(amount), 0) FROM payments WHERE (from_user_id = ? OR to_user_id = ?) AND status = 'pending'",
            [current_user.id, current_user.id]
        )
        
        return {
            "total_received": round(float(incoming[0]), 2) if incoming else 0,
            "total_sent": round(float(outgoing[0]), 2) if outgoing else 0,
            "pending_amount": round(float(pending[0]), 2) if pending else 0
        }
        
    except Exception as e:
        logger.error("get_payment_stats failed: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database temporarily unavailable"
        )
