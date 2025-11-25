"""
@AI-HINT: Payment tracking endpoints using Turso remote database ONLY
No local SQLite fallback - all queries go directly to Turso
"""

from typing import List, Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.security import get_current_active_user
from app.models.user import User
from app.schemas.payment import PaymentCreate, PaymentRead, PaymentUpdate
from app.db.turso_http import get_turso_http

router = APIRouter()


def _row_to_payment(row: list) -> dict:
    """Convert database row to payment dict"""
    columns = ["id", "contract_id", "from_user_id", "to_user_id", "amount", 
               "currency", "status", "payment_type", "tx_hash", "escrow_address",
               "description", "created_at", "updated_at", "completed_at"]
    
    payment = {}
    for i, col in enumerate(columns):
        if i < len(row):
            val = row[i]
            if col == "amount" and val is not None:
                payment[col] = float(val)
            else:
                payment[col] = val
        else:
            payment[col] = None
    return payment


@router.get("/", response_model=List[PaymentRead])
def list_payments(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    contract_id: Optional[str] = Query(None, description="Filter by contract"),
    payment_status: Optional[str] = Query(None, alias="status", description="Filter by payment status"),
    direction: Optional[str] = Query(None, description="incoming or outgoing"),
    current_user: User = Depends(get_current_active_user)
):
    """List payments for the authenticated user with optional filters."""
    try:
        turso = get_turso_http()
        
        sql = """SELECT id, contract_id, from_user_id, to_user_id, amount, 
                        currency, status, payment_type, tx_hash, escrow_address,
                        description, created_at, updated_at, completed_at 
                 FROM payments WHERE 1=1"""
        params = []
        
        # Restrict payments to user unless admin
        if current_user.role != "Admin" and current_user.user_type != "Admin":
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
            params.append(payment_status)
        
        sql += f" ORDER BY created_at DESC LIMIT {limit} OFFSET {skip}"
        
        result = turso.execute(sql, params)
        payments = [_row_to_payment(row) for row in result.get("rows", [])]
        return payments
        
    except Exception as e:
        print(f"[ERROR] list_payments: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database unavailable: {str(e)}"
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
                      currency, status, payment_type, tx_hash, escrow_address,
                      description, created_at, updated_at, completed_at 
               FROM payments WHERE id = ?""",
            [payment_id]
        )
        
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")
        
        payment = _row_to_payment(row)
        
        # Check access
        if current_user.role != "Admin":
            if payment["from_user_id"] != current_user.id and payment["to_user_id"] != current_user.id:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        
        return payment
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] get_payment: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database unavailable: {str(e)}"
        )


@router.post("/", response_model=PaymentRead, status_code=status.HTTP_201_CREATED)
def create_payment(
    payment: PaymentCreate,
    current_user: User = Depends(get_current_active_user)
):
    """Create a new payment record."""
    try:
        turso = get_turso_http()
        now = datetime.utcnow().isoformat()
        
        turso.execute(
            """INSERT INTO payments (contract_id, from_user_id, to_user_id, amount,
                                     currency, status, payment_type, description,
                                     created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            [payment.contract_id, current_user.id, payment.to_user_id, payment.amount,
             payment.currency or "USDC", "pending", payment.payment_type or "milestone",
             payment.description, now, now]
        )
        
        # Get created payment
        row = turso.fetch_one(
            """SELECT id, contract_id, from_user_id, to_user_id, amount, 
                      currency, status, payment_type, tx_hash, escrow_address,
                      description, created_at, updated_at, completed_at 
               FROM payments WHERE from_user_id = ? ORDER BY id DESC LIMIT 1""",
            [current_user.id]
        )
        
        return _row_to_payment(row)
        
    except Exception as e:
        print(f"[ERROR] create_payment: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database unavailable: {str(e)}"
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
        existing = turso.fetch_one("SELECT from_user_id FROM payments WHERE id = ?", [payment_id])
        if not existing:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")
        
        # Check authorization
        if current_user.role != "Admin" and existing[0] != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
        
        # Build update
        updates = []
        params = []
        update_data = payment_update.dict(exclude_unset=True)
        
        for key, value in update_data.items():
            updates.append(f"{key} = ?")
            params.append(value)
        
        if updates:
            updates.append("updated_at = ?")
            params.append(datetime.utcnow().isoformat())
            params.append(payment_id)
            
            turso.execute(f"UPDATE payments SET {', '.join(updates)} WHERE id = ?", params)
        
        # Return updated payment
        row = turso.fetch_one(
            """SELECT id, contract_id, from_user_id, to_user_id, amount, 
                      currency, status, payment_type, tx_hash, escrow_address,
                      description, created_at, updated_at, completed_at 
               FROM payments WHERE id = ?""",
            [payment_id]
        )
        return _row_to_payment(row)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] update_payment: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database unavailable: {str(e)}"
        )


@router.post("/{payment_id}/complete", response_model=PaymentRead)
def complete_payment(
    payment_id: int,
    tx_hash: Optional[str] = None,
    current_user: User = Depends(get_current_active_user)
):
    """Mark a payment as completed."""
    try:
        turso = get_turso_http()
        
        existing = turso.fetch_one("SELECT from_user_id, status FROM payments WHERE id = ?", [payment_id])
        if not existing:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")
        
        if current_user.role != "Admin" and existing[0] != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
        
        now = datetime.utcnow().isoformat()
        turso.execute(
            "UPDATE payments SET status = ?, completed_at = ?, tx_hash = ?, updated_at = ? WHERE id = ?",
            ["completed", now, tx_hash, now, payment_id]
        )
        
        row = turso.fetch_one(
            """SELECT id, contract_id, from_user_id, to_user_id, amount, 
                      currency, status, payment_type, tx_hash, escrow_address,
                      description, created_at, updated_at, completed_at 
               FROM payments WHERE id = ?""",
            [payment_id]
        )
        return _row_to_payment(row)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] complete_payment: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database unavailable: {str(e)}"
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
            "total_received": float(incoming[0]) if incoming else 0,
            "total_sent": float(outgoing[0]) if outgoing else 0,
            "pending_amount": float(pending[0]) if pending else 0
        }
        
    except Exception as e:
        print(f"[ERROR] get_payment_stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database unavailable: {str(e)}"
        )
