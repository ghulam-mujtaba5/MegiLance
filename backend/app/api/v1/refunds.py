# @AI-HINT: Refunds API endpoints for payment refund management
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Literal
from datetime import datetime

from app.db.session import get_db
from app.models import Refund, Payment, User
from app.schemas.refund import (
    RefundCreate, RefundUpdate, RefundRead,
    RefundApprove, RefundReject, RefundList
)
from app.core.security import get_current_user

router = APIRouter(prefix="/refunds", tags=["refunds"])

@router.post("/", response_model=RefundRead, status_code=status.HTTP_201_CREATED)
async def create_refund(
    refund: RefundCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a refund request
    - Users can request refunds for payments they made
    - Status defaults to 'pending'
    """
    # Verify payment exists
    payment = db.query(Payment).filter(Payment.id == refund.payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    # Verify user is the payer
    if payment.from_user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can only request refunds for your own payments"
        )
    
    # Check payment status
    if payment.status != "completed":
        raise HTTPException(
            status_code=400,
            detail="Can only refund completed payments"
        )
    
    # Check if refund already exists
    existing = db.query(Refund).filter(
        Refund.payment_id == refund.payment_id,
        Refund.status.in_(["pending", "approved"])
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400,
            detail="A refund request already exists for this payment"
        )
    
    # Verify refund amount
    if refund.amount > payment.amount:
        raise HTTPException(
            status_code=400,
            detail=f"Refund amount cannot exceed payment amount (${payment.amount:.2f})"
        )
    
    # Create refund
    db_refund = Refund(
        payment_id=refund.payment_id,
        amount=refund.amount,
        reason=refund.reason,
        requested_by=current_user.id,
        status="pending"
    )
    
    db.add(db_refund)
    db.commit()
    db.refresh(db_refund)
    
    return db_refund

@router.get("/", response_model=RefundList)
async def list_refunds(
    status: Optional[Literal["pending", "approved", "rejected", "processed"]] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List refunds
    - Users see refunds they requested
    - Admins see all refunds
    """
    query = db.query(Refund)
    
    # Filter by user role
    if current_user.role != "admin":
        query = query.filter(Refund.requested_by == current_user.id)
    
    # Apply filters
    if status:
        query = query.filter(Refund.status == status)
    
    # Get total count
    total = query.count()
    
    # Order by most recent first
    query = query.order_by(Refund.created_at.desc())
    
    # Paginate
    offset = (page - 1) * page_size
    refunds = query.offset(offset).limit(page_size).all()
    
    return RefundList(
        refunds=refunds,
        total=total,
        page=page,
        page_size=page_size
    )

@router.get("/{refund_id}", response_model=RefundRead)
async def get_refund(
    refund_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a refund by ID"""
    refund = db.query(Refund).filter(Refund.id == refund_id).first()
    if not refund:
        raise HTTPException(status_code=404, detail="Refund not found")
    
    # Verify access
    if current_user.role != "admin":
        if refund.requested_by != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
    
    return refund

@router.patch("/{refund_id}", response_model=RefundRead)
async def update_refund(
    refund_id: int,
    update_data: RefundUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update refund details
    - User can update their own pending refunds
    - Admin can update any refund
    """
    refund = db.query(Refund).filter(Refund.id == refund_id).first()
    if not refund:
        raise HTTPException(status_code=404, detail="Refund not found")
    
    # Verify access
    if current_user.role != "admin":
        if refund.requested_by != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
        if refund.status != "pending":
            raise HTTPException(
                status_code=400,
                detail="Can only update pending refund requests"
            )
    
    # Update fields
    update_dict = update_data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(refund, field, value)
    
    db.commit()
    db.refresh(refund)
    
    return refund

@router.post("/{refund_id}/approve", response_model=RefundRead)
async def approve_refund(
    refund_id: int,
    approve_data: RefundApprove,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Approve a refund request
    - Admin only
    - Changes status to 'approved'
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    refund = db.query(Refund).filter(Refund.id == refund_id).first()
    if not refund:
        raise HTTPException(status_code=404, detail="Refund not found")
    
    if refund.status != "pending":
        raise HTTPException(
            status_code=400,
            detail=f"Cannot approve refund with status: {refund.status}"
        )
    
    refund.status = "approved"
    refund.approved_by = current_user.id
    
    db.commit()
    db.refresh(refund)
    
    return refund

@router.post("/{refund_id}/reject", response_model=RefundRead)
async def reject_refund(
    refund_id: int,
    reject_data: RefundReject,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Reject a refund request
    - Admin only
    - Changes status to 'rejected'
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    refund = db.query(Refund).filter(Refund.id == refund_id).first()
    if not refund:
        raise HTTPException(status_code=404, detail="Refund not found")
    
    if refund.status != "pending":
        raise HTTPException(
            status_code=400,
            detail=f"Cannot reject refund with status: {refund.status}"
        )
    
    refund.status = "rejected"
    refund.reason = f"{refund.reason}\n\nRejection reason: {reject_data.rejection_reason}"
    
    db.commit()
    db.refresh(refund)
    
    return refund

@router.post("/{refund_id}/process", response_model=RefundRead)
async def process_refund(
    refund_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Process an approved refund
    - Admin only
    - Transfers money back to requester
    - Changes status to 'processed'
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    refund = db.query(Refund).filter(Refund.id == refund_id).first()
    if not refund:
        raise HTTPException(status_code=404, detail="Refund not found")
    
    if refund.status != "approved":
        raise HTTPException(
            status_code=400,
            detail="Can only process approved refunds"
        )
    
    # Get payment and users
    payment = db.query(Payment).filter(Payment.id == refund.payment_id).first()
    requester = db.query(User).filter(User.id == refund.requested_by).first()
    
    # Process refund - add money back to requester balance
    requester.account_balance += refund.amount
    
    # Update payment status
    payment.status = "refunded"
    
    # Update refund
    refund.status = "processed"
    refund.processed_at = datetime.utcnow()
    
    db.commit()
    db.refresh(refund)
    
    return refund

@router.delete("/{refund_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_refund(
    refund_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a refund request
    - User can delete their own pending refunds
    - Admin can delete any refund
    """
    refund = db.query(Refund).filter(Refund.id == refund_id).first()
    if not refund:
        raise HTTPException(status_code=404, detail="Refund not found")
    
    # Verify access
    if current_user.role != "admin":
        if refund.requested_by != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
        if refund.status != "pending":
            raise HTTPException(
                status_code=400,
                detail="Can only delete pending refund requests"
            )
    
    db.delete(refund)
    db.commit()
    
    return None
