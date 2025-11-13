# @AI-HINT: Support Tickets API endpoints for customer support
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Optional, Literal
from datetime import datetime

from app.db.session import get_db
from app.models import SupportTicket, User
from app.schemas.support_ticket import (
    SupportTicketCreate, SupportTicketUpdate, SupportTicketRead,
    SupportTicketAssign, SupportTicketResolve, SupportTicketList
)
from app.core.security import get_current_user

router = APIRouter(prefix="/support-tickets", tags=["support"])

@router.post("/", response_model=SupportTicketRead, status_code=status.HTTP_201_CREATED)
async def create_support_ticket(
    ticket: SupportTicketCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new support ticket
    - Any authenticated user can create tickets
    - Status defaults to 'open'
    """
    db_ticket = SupportTicket(
        user_id=current_user.id,
        subject=ticket.subject,
        description=ticket.description,
        category=ticket.category,
        priority=ticket.priority,
        status="open",
        attachments=ticket.attachments
    )
    
    db.add(db_ticket)
    db.commit()
    db.refresh(db_ticket)
    
    return db_ticket

@router.get("/", response_model=SupportTicketList)
async def list_support_tickets(
    status: Optional[Literal["open", "in_progress", "resolved", "closed"]] = Query(None),
    category: Optional[Literal["billing", "technical", "account", "other"]] = Query(None),
    priority: Optional[Literal["low", "medium", "high", "urgent"]] = Query(None),
    assigned_to_me: bool = Query(False, description="Show tickets assigned to me (admin only)"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List support tickets
    - Users see only their own tickets
    - Admins see all tickets or assigned tickets
    """
    query = db.query(SupportTicket)
    
    # Filter by user role
    if current_user.role == "admin":
        if assigned_to_me:
            query = query.filter(SupportTicket.assigned_to == current_user.id)
        # Admins see all if not filtered
    else:
        # Regular users see only their tickets
        query = query.filter(SupportTicket.user_id == current_user.id)
    
    # Apply filters
    if status:
        query = query.filter(SupportTicket.status == status)
    if category:
        query = query.filter(SupportTicket.category == category)
    if priority:
        query = query.filter(SupportTicket.priority == priority)
    
    # Get total count
    total = query.count()
    
    # Order by priority and creation date
    priority_order = {"urgent": 0, "high": 1, "medium": 2, "low": 3}
    query = query.order_by(SupportTicket.created_at.desc())
    
    # Paginate
    offset = (page - 1) * page_size
    tickets = query.offset(offset).limit(page_size).all()
    
    return SupportTicketList(
        tickets=tickets,
        total=total,
        page=page,
        page_size=page_size
    )

@router.get("/{ticket_id}", response_model=SupportTicketRead)
async def get_support_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a support ticket by ID"""
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Verify access
    if current_user.role != "admin":
        if ticket.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
    
    return ticket

@router.patch("/{ticket_id}", response_model=SupportTicketRead)
async def update_support_ticket(
    ticket_id: int,
    update_data: SupportTicketUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update a support ticket
    - Users can update their own open tickets
    - Admins can update any ticket
    """
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Verify access
    if current_user.role != "admin":
        if ticket.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
        if ticket.status not in ["open", "in_progress"]:
            raise HTTPException(
                status_code=400,
                detail="Cannot update resolved or closed tickets"
            )
    
    # Update fields
    update_dict = update_data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(ticket, field, value)
    
    db.commit()
    db.refresh(ticket)
    
    return ticket

@router.post("/{ticket_id}/assign", response_model=SupportTicketRead)
async def assign_support_ticket(
    ticket_id: int,
    assign_data: SupportTicketAssign,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Assign ticket to support agent
    - Admin only
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Verify assignee exists and is admin
    assignee = db.query(User).filter(User.id == assign_data.assigned_to).first()
    if not assignee:
        raise HTTPException(status_code=404, detail="Assignee not found")
    
    if assignee.role != "admin":
        raise HTTPException(status_code=400, detail="Can only assign to admin users")
    
    ticket.assigned_to = assign_data.assigned_to
    ticket.status = "in_progress"
    
    db.commit()
    db.refresh(ticket)
    
    return ticket

@router.post("/{ticket_id}/resolve", response_model=SupportTicketRead)
async def resolve_support_ticket(
    ticket_id: int,
    resolve_data: SupportTicketResolve,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Resolve a support ticket
    - Admin or assigned agent can resolve
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    ticket.status = "resolved"
    # Could add resolution field to model to store resolve_data.resolution
    
    db.commit()
    db.refresh(ticket)
    
    return ticket

@router.post("/{ticket_id}/close", response_model=SupportTicketRead)
async def close_support_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Close a support ticket
    - Ticket creator or admin can close
    """
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Verify access
    if current_user.role != "admin" and ticket.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if ticket.status == "closed":
        raise HTTPException(status_code=400, detail="Ticket already closed")
    
    ticket.status = "closed"
    
    db.commit()
    db.refresh(ticket)
    
    return ticket

@router.delete("/{ticket_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_support_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a support ticket
    - Admin only
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    db.delete(ticket)
    db.commit()
    
    return None
