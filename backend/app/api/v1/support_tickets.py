# @AI-HINT: Support Tickets API endpoints for customer support - Turso HTTP only
from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional, Literal
from datetime import datetime

from app.db.turso_http import execute_query, to_str, parse_date
from app.schemas.support_ticket import (
    SupportTicketCreate, SupportTicketUpdate, SupportTicketRead,
    SupportTicketAssign, SupportTicketResolve, SupportTicketList
)
from app.core.security import get_current_user

router = APIRouter(prefix="/support-tickets", tags=["support"])


def row_to_ticket(row: list) -> dict:
    """Convert a database row to a support ticket dict"""
    return {
        "id": row[0].get("value") if row[0].get("type") != "null" else None,
        "user_id": row[1].get("value") if row[1].get("type") != "null" else None,
        "subject": to_str(row[2]),
        "description": to_str(row[3]),
        "category": to_str(row[4]),
        "priority": to_str(row[5]),
        "status": to_str(row[6]),
        "assigned_to": row[7].get("value") if row[7].get("type") != "null" else None,
        "attachments": to_str(row[8]),
        "created_at": parse_date(row[9]),
        "updated_at": parse_date(row[10])
    }


@router.post("/", response_model=SupportTicketRead, status_code=status.HTTP_201_CREATED)
async def create_support_ticket(
    ticket: SupportTicketCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Create a new support ticket
    - Any authenticated user can create tickets
    - Status defaults to 'open'
    """
    now = datetime.utcnow().isoformat()
    
    result = execute_query(
        """INSERT INTO support_tickets (user_id, subject, description, category, priority, status, attachments, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, 'open', ?, ?, ?)""",
        [
            current_user["id"],
            ticket.subject,
            ticket.description,
            ticket.category,
            ticket.priority or "medium",
            ticket.attachments,
            now,
            now
        ]
    )
    
    if not result:
        raise HTTPException(status_code=500, detail="Failed to create support ticket")
    
    ticket_id = result.get("last_insert_rowid")
    
    # Fetch the created ticket
    fetch_result = execute_query(
        """SELECT id, user_id, subject, description, category, priority, status, assigned_to, attachments, created_at, updated_at
           FROM support_tickets WHERE id = ?""",
        [ticket_id]
    )
    
    if not fetch_result or not fetch_result.get("rows"):
        raise HTTPException(status_code=500, detail="Failed to retrieve created ticket")
    
    return row_to_ticket(fetch_result["rows"][0])


@router.get("/", response_model=SupportTicketList)
async def list_support_tickets(
    ticket_status: Optional[Literal["open", "in_progress", "resolved", "closed"]] = Query(None, alias="status"),
    category: Optional[Literal["billing", "technical", "account", "other"]] = Query(None),
    priority: Optional[Literal["low", "medium", "high", "urgent"]] = Query(None),
    assigned_to_me: bool = Query(False, description="Show tickets assigned to me (admin only)"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user)
):
    """
    List support tickets
    - Users see only their own tickets
    - Admins see all tickets or assigned tickets
    """
    is_admin = current_user.get("role", "").lower() == "admin" or current_user.get("user_type", "").lower() == "admin"
    
    # Build WHERE clause
    conditions = []
    params = []
    
    if is_admin:
        if assigned_to_me:
            conditions.append("assigned_to = ?")
            params.append(current_user["id"])
    else:
        conditions.append("user_id = ?")
        params.append(current_user["id"])
    
    if ticket_status:
        conditions.append("status = ?")
        params.append(ticket_status)
    if category:
        conditions.append("category = ?")
        params.append(category)
    if priority:
        conditions.append("priority = ?")
        params.append(priority)
    
    where_clause = " AND ".join(conditions) if conditions else "1=1"
    
    # Get total count
    count_result = execute_query(
        f"SELECT COUNT(*) FROM support_tickets WHERE {where_clause}",
        params
    )
    total = count_result["rows"][0][0].get("value", 0) if count_result and count_result.get("rows") else 0
    
    # Get paginated tickets
    offset = (page - 1) * page_size
    list_params = params + [page_size, offset]
    
    result = execute_query(
        f"""SELECT id, user_id, subject, description, category, priority, status, assigned_to, attachments, created_at, updated_at
            FROM support_tickets WHERE {where_clause}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?""",
        list_params
    )
    
    tickets = []
    if result and result.get("rows"):
        tickets = [row_to_ticket(row) for row in result["rows"]]
    
    return SupportTicketList(
        tickets=tickets,
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/{ticket_id}", response_model=SupportTicketRead)
async def get_support_ticket(
    ticket_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Get a support ticket by ID"""
    result = execute_query(
        """SELECT id, user_id, subject, description, category, priority, status, assigned_to, attachments, created_at, updated_at
           FROM support_tickets WHERE id = ?""",
        [ticket_id]
    )
    
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    ticket = row_to_ticket(result["rows"][0])
    is_admin = current_user.get("role", "").lower() == "admin" or current_user.get("user_type", "").lower() == "admin"
    
    if not is_admin and ticket["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    return ticket


@router.patch("/{ticket_id}", response_model=SupportTicketRead)
async def update_support_ticket(
    ticket_id: int,
    update_data: SupportTicketUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Update a support ticket
    - Users can update their own open tickets
    - Admins can update any ticket
    """
    # Get existing ticket
    result = execute_query(
        """SELECT id, user_id, subject, description, category, priority, status, assigned_to, attachments, created_at, updated_at
           FROM support_tickets WHERE id = ?""",
        [ticket_id]
    )
    
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    ticket = row_to_ticket(result["rows"][0])
    is_admin = current_user.get("role", "").lower() == "admin" or current_user.get("user_type", "").lower() == "admin"
    
    if not is_admin:
        if ticket["user_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Not authorized")
        if ticket["status"] not in ["open", "in_progress"]:
            raise HTTPException(status_code=400, detail="Cannot update resolved or closed tickets")
    
    # Build update
    update_dict = update_data.model_dump(exclude_unset=True)
    if not update_dict:
        return ticket
    
    set_parts = []
    params = []
    for field, value in update_dict.items():
        set_parts.append(f"{field} = ?")
        params.append(value)
    
    set_parts.append("updated_at = ?")
    params.append(datetime.utcnow().isoformat())
    params.append(ticket_id)
    
    execute_query(
        f"UPDATE support_tickets SET {', '.join(set_parts)} WHERE id = ?",
        params
    )
    
    # Fetch updated ticket
    updated_result = execute_query(
        """SELECT id, user_id, subject, description, category, priority, status, assigned_to, attachments, created_at, updated_at
           FROM support_tickets WHERE id = ?""",
        [ticket_id]
    )
    
    return row_to_ticket(updated_result["rows"][0])


@router.post("/{ticket_id}/assign", response_model=SupportTicketRead)
async def assign_support_ticket(
    ticket_id: int,
    assign_data: SupportTicketAssign,
    current_user: dict = Depends(get_current_user)
):
    """
    Assign ticket to support agent
    - Admin only
    """
    is_admin = current_user.get("role", "").lower() == "admin" or current_user.get("user_type", "").lower() == "admin"
    if not is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Check ticket exists
    result = execute_query(
        "SELECT id FROM support_tickets WHERE id = ?",
        [ticket_id]
    )
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Verify assignee exists and is admin
    assignee_result = execute_query(
        "SELECT id, user_type, role FROM users WHERE id = ?",
        [assign_data.assigned_to]
    )
    if not assignee_result or not assignee_result.get("rows"):
        raise HTTPException(status_code=404, detail="Assignee not found")
    
    assignee_row = assignee_result["rows"][0]
    assignee_type = to_str(assignee_row[1]).lower() if assignee_row[1].get("type") != "null" else ""
    assignee_role = to_str(assignee_row[2]).lower() if assignee_row[2].get("type") != "null" else ""
    
    if assignee_type != "admin" and assignee_role != "admin":
        raise HTTPException(status_code=400, detail="Can only assign to admin users")
    
    # Update ticket
    execute_query(
        "UPDATE support_tickets SET assigned_to = ?, status = 'in_progress', updated_at = ? WHERE id = ?",
        [assign_data.assigned_to, datetime.utcnow().isoformat(), ticket_id]
    )
    
    # Fetch updated ticket
    updated_result = execute_query(
        """SELECT id, user_id, subject, description, category, priority, status, assigned_to, attachments, created_at, updated_at
           FROM support_tickets WHERE id = ?""",
        [ticket_id]
    )
    
    return row_to_ticket(updated_result["rows"][0])


@router.post("/{ticket_id}/resolve", response_model=SupportTicketRead)
async def resolve_support_ticket(
    ticket_id: int,
    resolve_data: SupportTicketResolve,
    current_user: dict = Depends(get_current_user)
):
    """
    Resolve a support ticket
    - Admin or assigned agent can resolve
    """
    is_admin = current_user.get("role", "").lower() == "admin" or current_user.get("user_type", "").lower() == "admin"
    if not is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Check ticket exists
    result = execute_query(
        "SELECT id FROM support_tickets WHERE id = ?",
        [ticket_id]
    )
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Update ticket
    execute_query(
        "UPDATE support_tickets SET status = 'resolved', updated_at = ? WHERE id = ?",
        [datetime.utcnow().isoformat(), ticket_id]
    )
    
    # Fetch updated ticket
    updated_result = execute_query(
        """SELECT id, user_id, subject, description, category, priority, status, assigned_to, attachments, created_at, updated_at
           FROM support_tickets WHERE id = ?""",
        [ticket_id]
    )
    
    return row_to_ticket(updated_result["rows"][0])


@router.post("/{ticket_id}/close", response_model=SupportTicketRead)
async def close_support_ticket(
    ticket_id: int,
    current_user: dict = Depends(get_current_user)
):
    """
    Close a support ticket
    - Ticket creator or admin can close
    """
    # Get ticket
    result = execute_query(
        """SELECT id, user_id, subject, description, category, priority, status, assigned_to, attachments, created_at, updated_at
           FROM support_tickets WHERE id = ?""",
        [ticket_id]
    )
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    ticket = row_to_ticket(result["rows"][0])
    is_admin = current_user.get("role", "").lower() == "admin" or current_user.get("user_type", "").lower() == "admin"
    
    if not is_admin and ticket["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if ticket["status"] == "closed":
        raise HTTPException(status_code=400, detail="Ticket already closed")
    
    # Update ticket
    execute_query(
        "UPDATE support_tickets SET status = 'closed', updated_at = ? WHERE id = ?",
        [datetime.utcnow().isoformat(), ticket_id]
    )
    
    # Fetch updated ticket
    updated_result = execute_query(
        """SELECT id, user_id, subject, description, category, priority, status, assigned_to, attachments, created_at, updated_at
           FROM support_tickets WHERE id = ?""",
        [ticket_id]
    )
    
    return row_to_ticket(updated_result["rows"][0])


@router.delete("/{ticket_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_support_ticket(
    ticket_id: int,
    current_user: dict = Depends(get_current_user)
):
    """
    Delete a support ticket
    - Admin only
    """
    is_admin = current_user.get("role", "").lower() == "admin" or current_user.get("user_type", "").lower() == "admin"
    if not is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Check ticket exists
    result = execute_query(
        "SELECT id FROM support_tickets WHERE id = ?",
        [ticket_id]
    )
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    execute_query("DELETE FROM support_tickets WHERE id = ?", [ticket_id])
    
    return None
