# @AI-HINT: Refunds API endpoints - Turso HTTP only (NO SQLite fallback)
from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional, Literal
from datetime import datetime, timezone

from app.db.turso_http import execute_query, to_str, parse_date
from app.core.security import get_current_user
from app.models import User
from app.schemas.refund import (
    RefundCreate, RefundUpdate, RefundRead,
    RefundApprove, RefundReject, RefundList
)

router = APIRouter(prefix="/refunds", tags=["refunds"])


def _row_to_refund(row) -> dict:
    """Convert Turso row to refund dict"""
    return {
        "id": int(row[0].get("value")) if row[0].get("type") != "null" else None,
        "payment_id": int(row[1].get("value")) if row[1].get("type") != "null" else None,
        "amount": float(row[2].get("value")) if row[2].get("type") != "null" else 0.0,
        "reason": to_str(row[3]),
        "requested_by": int(row[4].get("value")) if row[4].get("type") != "null" else None,
        "approved_by": int(row[5].get("value")) if row[5].get("type") != "null" else None,
        "status": to_str(row[6]) or "pending",
        "processed_at": parse_date(row[7]),
        "created_at": parse_date(row[8]),
        "updated_at": parse_date(row[9])
    }


@router.post("/", response_model=RefundRead, status_code=status.HTTP_201_CREATED)
async def create_refund(
    refund: RefundCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a refund request. Users can request refunds for payments they made."""
    # Verify payment exists
    result = execute_query("SELECT id, from_user_id, amount, status FROM payments WHERE id = ?", [refund.payment_id])
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Payment not found")
    
    row = result["rows"][0]
    from_user_id = int(row[1].get("value"))
    payment_amount = float(row[2].get("value")) if row[2].get("type") != "null" else 0.0
    payment_status = to_str(row[3])
    
    if from_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only request refunds for your own payments")
    
    if payment_status != "completed":
        raise HTTPException(status_code=400, detail="Can only refund completed payments")
    
    # Check if refund already exists
    existing = execute_query("""
        SELECT id FROM refunds WHERE payment_id = ? AND status IN ('pending', 'approved')
    """, [refund.payment_id])
    
    if existing and existing.get("rows"):
        raise HTTPException(status_code=400, detail="A refund request already exists for this payment")
    
    if refund.amount > payment_amount:
        raise HTTPException(status_code=400, detail=f"Refund amount cannot exceed payment amount (${payment_amount:.2f})")
    
    # Create refund
    now = datetime.now(timezone.utc).isoformat()
    execute_query("""
        INSERT INTO refunds (payment_id, amount, reason, requested_by, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, 'pending', ?, ?)
    """, [refund.payment_id, refund.amount, refund.reason, current_user.id, now, now])
    
    # Get created refund
    refund_result = execute_query("""
        SELECT id, payment_id, amount, reason, requested_by, approved_by, status, processed_at, created_at, updated_at
        FROM refunds WHERE payment_id = ? AND requested_by = ? ORDER BY id DESC LIMIT 1
    """, [refund.payment_id, current_user.id])
    
    if not refund_result or not refund_result.get("rows"):
        raise HTTPException(status_code=500, detail="Failed to retrieve created refund")
    
    return _row_to_refund(refund_result["rows"][0])


@router.get("/", response_model=RefundList)
async def list_refunds(
    status_filter: Optional[Literal["pending", "approved", "rejected", "processed"]] = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user)
):
    """List refunds. Users see refunds they requested, admins see all."""
    user_role = getattr(current_user, 'role', None) or getattr(current_user, 'user_type', 'client')
    if hasattr(user_role, 'value'):
        user_role = user_role.value
    user_role = str(user_role).lower()
    
    # Build query based on role
    if user_role != "admin":
        sql = """
            SELECT id, payment_id, amount, reason, requested_by, approved_by, status, processed_at, created_at, updated_at
            FROM refunds WHERE requested_by = ?
        """
        params = [current_user.id]
    else:
        sql = """
            SELECT id, payment_id, amount, reason, requested_by, approved_by, status, processed_at, created_at, updated_at
            FROM refunds WHERE 1=1
        """
        params = []
    
    if status_filter:
        sql += " AND status = ?"
        params.append(status_filter)
    
    # Get total count
    count_sql = sql.replace(
        "SELECT id, payment_id, amount, reason, requested_by, approved_by, status, processed_at, created_at, updated_at",
        "SELECT COUNT(*)"
    )
    count_result = execute_query(count_sql, params)
    total = 0
    if count_result and count_result.get("rows"):
        total = int(count_result["rows"][0][0].get("value"))
    
    # Paginate
    offset = (page - 1) * page_size
    sql += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
    params.extend([page_size, offset])
    
    result = execute_query(sql, params)
    
    refunds = []
    if result and result.get("rows"):
        for row in result["rows"]:
            refunds.append(_row_to_refund(row))
    
    return RefundList(
        refunds=refunds,
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/{refund_id}", response_model=RefundRead)
async def get_refund(
    refund_id: int,
    current_user: User = Depends(get_current_user)
):
    """Get a refund by ID"""
    result = execute_query("""
        SELECT id, payment_id, amount, reason, requested_by, approved_by, status, processed_at, created_at, updated_at
        FROM refunds WHERE id = ?
    """, [refund_id])
    
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Refund not found")
    
    refund = _row_to_refund(result["rows"][0])
    
    # Verify access
    user_role = getattr(current_user, 'role', None) or getattr(current_user, 'user_type', 'client')
    if hasattr(user_role, 'value'):
        user_role = user_role.value
    user_role = str(user_role).lower()
    
    if user_role != "admin" and refund["requested_by"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    return refund


@router.patch("/{refund_id}", response_model=RefundRead)
async def update_refund(
    refund_id: int,
    update_data: RefundUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update refund details. User can update their own pending refunds, admin can update any."""
    result = execute_query("""
        SELECT id, requested_by, status FROM refunds WHERE id = ?
    """, [refund_id])
    
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Refund not found")
    
    row = result["rows"][0]
    requested_by = int(row[1].get("value"))
    refund_status = to_str(row[2])
    
    user_role = getattr(current_user, 'role', None) or getattr(current_user, 'user_type', 'client')
    if hasattr(user_role, 'value'):
        user_role = user_role.value
    user_role = str(user_role).lower()
    
    if user_role != "admin":
        if requested_by != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
        if refund_status != "pending":
            raise HTTPException(status_code=400, detail="Can only update pending refund requests")
    
    # Build update query
    update_fields = []
    params = []
    update_dict = update_data.model_dump(exclude_unset=True)
    
    for field, value in update_dict.items():
        update_fields.append(f"{field} = ?")
        params.append(value)
    
    if update_fields:
        update_fields.append("updated_at = ?")
        params.append(datetime.now(timezone.utc).isoformat())
        params.append(refund_id)
        
        execute_query(f"UPDATE refunds SET {', '.join(update_fields)} WHERE id = ?", params)
    
    return await get_refund(refund_id, current_user)


@router.post("/{refund_id}/approve", response_model=RefundRead)
async def approve_refund(
    refund_id: int,
    approve_data: RefundApprove,
    current_user: User = Depends(get_current_user)
):
    """Approve a refund request. Admin only."""
    user_role = getattr(current_user, 'role', None) or getattr(current_user, 'user_type', 'client')
    if hasattr(user_role, 'value'):
        user_role = user_role.value
    user_role = str(user_role).lower()
    
    if user_role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = execute_query("SELECT id, status FROM refunds WHERE id = ?", [refund_id])
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Refund not found")
    
    refund_status = to_str(result["rows"][0][1])
    if refund_status != "pending":
        raise HTTPException(status_code=400, detail=f"Cannot approve refund with status: {refund_status}")
    
    now = datetime.now(timezone.utc).isoformat()
    execute_query("""
        UPDATE refunds SET status = 'approved', approved_by = ?, updated_at = ? WHERE id = ?
    """, [current_user.id, now, refund_id])
    
    return await get_refund(refund_id, current_user)


@router.post("/{refund_id}/reject", response_model=RefundRead)
async def reject_refund(
    refund_id: int,
    reject_data: RefundReject,
    current_user: User = Depends(get_current_user)
):
    """Reject a refund request. Admin only."""
    user_role = getattr(current_user, 'role', None) or getattr(current_user, 'user_type', 'client')
    if hasattr(user_role, 'value'):
        user_role = user_role.value
    user_role = str(user_role).lower()
    
    if user_role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = execute_query("SELECT id, status, reason FROM refunds WHERE id = ?", [refund_id])
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Refund not found")
    
    refund_status = to_str(result["rows"][0][1])
    current_reason = to_str(result["rows"][0][2]) or ""
    
    if refund_status != "pending":
        raise HTTPException(status_code=400, detail=f"Cannot reject refund with status: {refund_status}")
    
    new_reason = f"{current_reason}\n\nRejection reason: {reject_data.rejection_reason}"
    now = datetime.now(timezone.utc).isoformat()
    
    execute_query("""
        UPDATE refunds SET status = 'rejected', reason = ?, updated_at = ? WHERE id = ?
    """, [new_reason, now, refund_id])
    
    return await get_refund(refund_id, current_user)


@router.post("/{refund_id}/process", response_model=RefundRead)
async def process_refund(
    refund_id: int,
    current_user: User = Depends(get_current_user)
):
    """Process an approved refund. Admin only. Transfers money back to requester."""
    user_role = getattr(current_user, 'role', None) or getattr(current_user, 'user_type', 'client')
    if hasattr(user_role, 'value'):
        user_role = user_role.value
    user_role = str(user_role).lower()
    
    if user_role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = execute_query("""
        SELECT id, payment_id, amount, requested_by, status FROM refunds WHERE id = ?
    """, [refund_id])
    
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Refund not found")
    
    row = result["rows"][0]
    payment_id = int(row[1].get("value"))
    amount = float(row[2].get("value")) if row[2].get("type") != "null" else 0.0
    requested_by = int(row[3].get("value"))
    refund_status = to_str(row[4])
    
    if refund_status != "approved":
        raise HTTPException(status_code=400, detail="Can only process approved refunds")
    
    # Get requester balance
    user_result = execute_query("SELECT account_balance FROM users WHERE id = ?", [requested_by])
    requester_balance = 0.0
    if user_result and user_result.get("rows"):
        requester_balance = float(user_result["rows"][0][0].get("value")) if user_result["rows"][0][0].get("type") != "null" else 0.0
    
    # Process refund
    new_balance = requester_balance + amount
    now = datetime.now(timezone.utc).isoformat()
    
    execute_query("UPDATE users SET account_balance = ? WHERE id = ?", [new_balance, requested_by])
    execute_query("UPDATE payments SET status = 'refunded' WHERE id = ?", [payment_id])
    execute_query("""
        UPDATE refunds SET status = 'processed', processed_at = ?, updated_at = ? WHERE id = ?
    """, [now, now, refund_id])
    
    return await get_refund(refund_id, current_user)


@router.delete("/{refund_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_refund(
    refund_id: int,
    current_user: User = Depends(get_current_user)
):
    """Delete a refund request. User can delete their own pending refunds, admin can delete any."""
    result = execute_query("""
        SELECT id, requested_by, status FROM refunds WHERE id = ?
    """, [refund_id])
    
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Refund not found")
    
    row = result["rows"][0]
    requested_by = int(row[1].get("value"))
    refund_status = to_str(row[2])
    
    user_role = getattr(current_user, 'role', None) or getattr(current_user, 'user_type', 'client')
    if hasattr(user_role, 'value'):
        user_role = user_role.value
    user_role = str(user_role).lower()
    
    if user_role != "admin":
        if requested_by != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
        if refund_status != "pending":
            raise HTTPException(status_code=400, detail="Can only delete pending refund requests")
    
    execute_query("DELETE FROM refunds WHERE id = ?", [refund_id])
