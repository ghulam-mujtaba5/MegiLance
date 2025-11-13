# @AI-HINT: Escrow API endpoints for secure payment holding
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional
from datetime import datetime, timedelta

from app.db.session import get_db
from app.models import Escrow, User, Contract, Payment
from app.schemas.escrow import (
    EscrowCreate, EscrowUpdate, EscrowRead,
    EscrowRelease, EscrowRefund, EscrowBalance
)
from app.core.security import get_current_user

router = APIRouter(prefix="/escrow", tags=["escrow"])

@router.post("/", response_model=EscrowRead, status_code=status.HTTP_201_CREATED)
async def create_escrow(
    escrow: EscrowCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Fund escrow for a contract
    - Clients fund escrow to secure payment
    - Escrow holds funds until work completion
    - Auto-expires if expiration date set
    """
    # Verify contract exists and user is the client
    contract = db.query(Contract).filter(Contract.id == escrow.contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    if contract.client_id != current_user.id:
        raise HTTPException(
            status_code=403, 
            detail="Only the contract client can fund escrow"
        )
    
    # Check client balance
    if current_user.account_balance < escrow.amount:
        raise HTTPException(
            status_code=400, 
            detail=f"Insufficient balance. Available: ${current_user.account_balance:.2f}"
        )
    
    # Create escrow
    db_escrow = Escrow(
        contract_id=escrow.contract_id,
        client_id=current_user.id,
        amount=escrow.amount,
        status="pending",
        released_amount=0.0,
        expires_at=escrow.expires_at,
        notes=escrow.notes
    )
    
    # Deduct from client balance
    current_user.account_balance -= escrow.amount
    
    db.add(db_escrow)
    db.commit()
    db.refresh(db_escrow)
    
    # Activate escrow
    db_escrow.status = "active"
    db.commit()
    db.refresh(db_escrow)
    
    return db_escrow

@router.get("/", response_model=List[EscrowRead])
async def list_escrow(
    contract_id: Optional[int] = Query(None, description="Filter by contract"),
    status: Optional[str] = Query(None, description="Filter by status"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List escrow records
    - Clients see escrow they funded
    - Freelancers see escrow for their contracts
    """
    query = db.query(Escrow)
    
    # Filter by user role
    if current_user.role == "client":
        query = query.filter(Escrow.client_id == current_user.id)
    elif current_user.role == "freelancer":
        # Get contracts where user is freelancer
        contract_ids = db.query(Contract.id).filter(
            Contract.freelancer_id == current_user.id
        ).all()
        contract_ids = [c[0] for c in contract_ids]
        query = query.filter(Escrow.contract_id.in_(contract_ids))
    
    # Apply filters
    if contract_id:
        query = query.filter(Escrow.contract_id == contract_id)
    if status:
        query = query.filter(Escrow.status == status)
    
    # Check for expired escrow
    now = datetime.utcnow()
    expired_escrow = query.filter(
        and_(
            Escrow.status == "active",
            Escrow.expires_at.isnot(None),
            Escrow.expires_at < now
        )
    ).all()
    
    # Update status to expired
    for esc in expired_escrow:
        esc.status = "expired"
    db.commit()
    
    # Order by most recent first
    query = query.order_by(Escrow.created_at.desc())
    
    escrow_records = query.offset(offset).limit(limit).all()
    return escrow_records

@router.get("/balance", response_model=EscrowBalance)
async def get_escrow_balance(
    contract_id: int = Query(..., description="Contract ID for balance check"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Check escrow balance for a contract
    - Shows total funded, released, and available balance
    """
    # Verify contract access
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    if current_user.role == "client" and contract.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    elif current_user.role == "freelancer" and contract.freelancer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Calculate balance
    escrow_records = db.query(Escrow).filter(
        Escrow.contract_id == contract_id
    ).all()
    
    total_funded = sum(e.amount for e in escrow_records if e.status in ["active", "released"])
    total_released = sum(e.released_amount for e in escrow_records)
    available_balance = total_funded - total_released
    
    # Determine overall status
    active_escrow = [e for e in escrow_records if e.status == "active"]
    overall_status = "active" if active_escrow else "none"
    
    return EscrowBalance(
        contract_id=contract_id,
        total_funded=round(total_funded, 2),
        total_released=round(total_released, 2),
        available_balance=round(available_balance, 2),
        status=overall_status
    )

@router.post("/{escrow_id}/release", response_model=EscrowRead)
async def release_escrow(
    escrow_id: int,
    release_data: EscrowRelease,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Release escrow funds to freelancer
    - Clients can release full or partial amount
    - Funds transferred to freelancer balance
    """
    escrow = db.query(Escrow).filter(Escrow.id == escrow_id).first()
    if not escrow:
        raise HTTPException(status_code=404, detail="Escrow not found")
    
    if escrow.client_id != current_user.id:
        raise HTTPException(
            status_code=403, 
            detail="Only the client can release escrow"
        )
    
    if escrow.status != "active":
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot release escrow with status: {escrow.status}"
        )
    
    # Check available balance
    available = escrow.amount - escrow.released_amount
    if release_data.amount > available:
        raise HTTPException(
            status_code=400, 
            detail=f"Insufficient escrow balance. Available: ${available:.2f}"
        )
    
    # Get contract to find freelancer
    contract = db.query(Contract).filter(Contract.id == escrow.contract_id).first()
    freelancer = db.query(User).filter(User.id == contract.freelancer_id).first()
    
    # Transfer funds to freelancer
    freelancer.account_balance += release_data.amount
    escrow.released_amount += release_data.amount
    
    # If fully released, mark as released
    if escrow.released_amount >= escrow.amount:
        escrow.status = "released"
    
    db.commit()
    db.refresh(escrow)
    
    return escrow

@router.post("/{escrow_id}/refund", response_model=EscrowRead)
async def refund_escrow(
    escrow_id: int,
    refund_data: EscrowRefund,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Refund escrow to client
    - Admin or client can refund
    - Requires valid reason
    - Returns funds to client balance
    """
    escrow = db.query(Escrow).filter(Escrow.id == escrow_id).first()
    if not escrow:
        raise HTTPException(status_code=404, detail="Escrow not found")
    
    # Only client or admin can refund
    if current_user.role not in ["admin"] and escrow.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if escrow.status not in ["active", "expired"]:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot refund escrow with status: {escrow.status}"
        )
    
    # Check available balance for refund
    available = escrow.amount - escrow.released_amount
    if refund_data.amount > available:
        raise HTTPException(
            status_code=400, 
            detail=f"Insufficient escrow balance for refund. Available: ${available:.2f}"
        )
    
    # Get client
    client = db.query(User).filter(User.id == escrow.client_id).first()
    
    # Refund to client
    client.account_balance += refund_data.amount
    escrow.released_amount += refund_data.amount  # Track as released (refunded)
    escrow.status = "refunded"
    
    db.commit()
    db.refresh(escrow)
    
    return escrow

@router.get("/{escrow_id}", response_model=EscrowRead)
async def get_escrow(
    escrow_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get escrow details by ID"""
    escrow = db.query(Escrow).filter(Escrow.id == escrow_id).first()
    if not escrow:
        raise HTTPException(status_code=404, detail="Escrow not found")
    
    # Verify access
    contract = db.query(Contract).filter(Contract.id == escrow.contract_id).first()
    if escrow.client_id != current_user.id and contract.freelancer_id != current_user.id:
        if current_user.role != "admin":
            raise HTTPException(status_code=403, detail="Not authorized")
    
    return escrow

@router.patch("/{escrow_id}", response_model=EscrowRead)
async def update_escrow(
    escrow_id: int,
    update_data: EscrowUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update escrow details
    - Only client can update
    - Only active escrow can be updated
    """
    escrow = db.query(Escrow).filter(Escrow.id == escrow_id).first()
    if not escrow:
        raise HTTPException(status_code=404, detail="Escrow not found")
    
    if escrow.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if escrow.status != "active":
        raise HTTPException(
            status_code=400, 
            detail="Only active escrow can be updated"
        )
    
    # Update fields
    update_dict = update_data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(escrow, field, value)
    
    db.commit()
    db.refresh(escrow)
    
    return escrow
