# @AI-HINT: Time Tracking API endpoints for work hour management
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from typing import List, Optional
from datetime import datetime, timedelta

from app.db.session import get_db
from app.models import TimeEntry, User, Contract
from app.schemas.time_entry import (
    TimeEntryCreate, TimeEntryUpdate, TimeEntryRead, 
    TimeEntryStop, TimeEntrySummary
)
from app.core.security import get_current_user

router = APIRouter(prefix="/time-entries", tags=["time-tracking"])

@router.post("/", response_model=TimeEntryRead, status_code=status.HTTP_201_CREATED)
async def create_time_entry(
    time_entry: TimeEntryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Start a new time entry (start timer)
    - Freelancers can track time on their contracts
    - Auto-sets start_time if not provided
    - Status defaults to 'draft'
    """
    # Verify contract exists and user is the freelancer
    contract = db.query(Contract).filter(Contract.id == time_entry.contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    if contract.freelancer_id != current_user.id:
        raise HTTPException(
            status_code=403, 
            detail="Only the contract freelancer can create time entries"
        )
    
    # Check for active time entry (no end_time)
    active_entry = db.query(TimeEntry).filter(
        and_(
            TimeEntry.user_id == current_user.id,
            TimeEntry.contract_id == time_entry.contract_id,
            TimeEntry.end_time.is_(None)
        )
    ).first()
    
    if active_entry:
        raise HTTPException(
            status_code=400, 
            detail="You have an active time entry. Stop it before starting a new one."
        )
    
    # Create time entry
    db_time_entry = TimeEntry(
        user_id=current_user.id,
        contract_id=time_entry.contract_id,
        description=time_entry.description,
        billable=time_entry.billable,
        hourly_rate=time_entry.hourly_rate or current_user.hourly_rate,
        start_time=time_entry.start_time or datetime.utcnow(),
        status=time_entry.status
    )
    
    db.add(db_time_entry)
    db.commit()
    db.refresh(db_time_entry)
    
    return db_time_entry

@router.put("/{time_entry_id}/stop", response_model=TimeEntryRead)
async def stop_time_entry(
    time_entry_id: int,
    stop_data: TimeEntryStop,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Stop a running time entry (stop timer)
    - Auto-calculates duration and amount
    - Sets end_time to current time if not provided
    """
    time_entry = db.query(TimeEntry).filter(TimeEntry.id == time_entry_id).first()
    if not time_entry:
        raise HTTPException(status_code=404, detail="Time entry not found")
    
    if time_entry.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if time_entry.end_time is not None:
        raise HTTPException(status_code=400, detail="Time entry already stopped")
    
    # Set end time
    end_time = stop_data.end_time or datetime.utcnow()
    time_entry.end_time = end_time
    
    # Calculate duration in minutes
    duration = (end_time - time_entry.start_time).total_seconds() / 60
    time_entry.duration_minutes = int(duration)
    
    # Calculate amount (duration_minutes / 60 * hourly_rate)
    if time_entry.billable and time_entry.hourly_rate:
        time_entry.amount = (duration / 60) * time_entry.hourly_rate
    
    db.commit()
    db.refresh(time_entry)
    
    return time_entry

@router.get("/", response_model=List[TimeEntryRead])
async def list_time_entries(
    contract_id: Optional[int] = Query(None, description="Filter by contract"),
    status: Optional[str] = Query(None, description="Filter by status"),
    start_date: Optional[datetime] = Query(None, description="Filter by start date (from)"),
    end_date: Optional[datetime] = Query(None, description="Filter by end date (to)"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List time entries with filters
    - Freelancers see only their own entries
    - Clients see entries for their contracts
    - Supports filtering by contract, status, date range
    """
    query = db.query(TimeEntry)
    
    # Filter by user (freelancers see their own)
    if current_user.role == "freelancer":
        query = query.filter(TimeEntry.user_id == current_user.id)
    elif current_user.role == "client":
        # Clients see entries from their contracts
        contract_ids = db.query(Contract.id).filter(Contract.client_id == current_user.id).all()
        contract_ids = [c[0] for c in contract_ids]
        query = query.filter(TimeEntry.contract_id.in_(contract_ids))
    
    # Apply filters
    if contract_id:
        query = query.filter(TimeEntry.contract_id == contract_id)
    if status:
        query = query.filter(TimeEntry.status == status)
    if start_date:
        query = query.filter(TimeEntry.start_time >= start_date)
    if end_date:
        query = query.filter(TimeEntry.start_time <= end_date)
    
    # Order by most recent first
    query = query.order_by(TimeEntry.start_time.desc())
    
    time_entries = query.offset(offset).limit(limit).all()
    return time_entries

@router.get("/summary", response_model=TimeEntrySummary)
async def get_time_summary(
    contract_id: int = Query(..., description="Contract ID for summary"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get time entry summary for a contract
    - Total hours worked
    - Total billable hours
    - Total amount earned
    - Number of entries
    """
    # Verify access to contract
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    if current_user.role == "freelancer" and contract.freelancer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    elif current_user.role == "client" and contract.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Calculate summary
    entries = db.query(TimeEntry).filter(
        TimeEntry.contract_id == contract_id
    ).all()
    
    total_minutes = sum(e.duration_minutes or 0 for e in entries)
    total_amount = sum(e.amount or 0 for e in entries)
    billable_minutes = sum(e.duration_minutes or 0 for e in entries if e.billable)
    billable_amount = sum(e.amount or 0 for e in entries if e.billable)
    
    return TimeEntrySummary(
        contract_id=contract_id,
        total_hours=round(total_minutes / 60, 2),
        total_amount=round(total_amount, 2),
        billable_hours=round(billable_minutes / 60, 2),
        billable_amount=round(billable_amount, 2),
        entry_count=len(entries)
    )

@router.get("/{time_entry_id}", response_model=TimeEntryRead)
async def get_time_entry(
    time_entry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a single time entry by ID"""
    time_entry = db.query(TimeEntry).filter(TimeEntry.id == time_entry_id).first()
    if not time_entry:
        raise HTTPException(status_code=404, detail="Time entry not found")
    
    # Verify access
    if time_entry.user_id != current_user.id:
        contract = db.query(Contract).filter(Contract.id == time_entry.contract_id).first()
        if not contract or contract.client_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
    
    return time_entry

@router.patch("/{time_entry_id}", response_model=TimeEntryRead)
async def update_time_entry(
    time_entry_id: int,
    update_data: TimeEntryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update a time entry
    - Only freelancer can update their own entries
    - Only 'draft' entries can be edited
    """
    time_entry = db.query(TimeEntry).filter(TimeEntry.id == time_entry_id).first()
    if not time_entry:
        raise HTTPException(status_code=404, detail="Time entry not found")
    
    if time_entry.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if time_entry.status != "draft":
        raise HTTPException(
            status_code=400, 
            detail="Only draft time entries can be edited"
        )
    
    # Update fields
    update_dict = update_data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(time_entry, field, value)
    
    # Recalculate if times changed
    if time_entry.end_time and time_entry.start_time:
        duration = (time_entry.end_time - time_entry.start_time).total_seconds() / 60
        time_entry.duration_minutes = int(duration)
        if time_entry.billable and time_entry.hourly_rate:
            time_entry.amount = (duration / 60) * time_entry.hourly_rate
    
    db.commit()
    db.refresh(time_entry)
    
    return time_entry

@router.delete("/{time_entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_time_entry(
    time_entry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a time entry
    - Only draft entries can be deleted
    - Only freelancer can delete their own entries
    """
    time_entry = db.query(TimeEntry).filter(TimeEntry.id == time_entry_id).first()
    if not time_entry:
        raise HTTPException(status_code=404, detail="Time entry not found")
    
    if time_entry.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if time_entry.status != "draft":
        raise HTTPException(
            status_code=400, 
            detail="Only draft time entries can be deleted"
        )
    
    db.delete(time_entry)
    db.commit()
    
    return None
