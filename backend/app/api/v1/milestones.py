"""
@AI-HINT: Milestone Management API - Turso HTTP only (NO SQLite fallback)
Handles milestone CRUD, submissions, approvals, and payment integration.
"""
from typing import List, Optional
from datetime import datetime, timezone
import json
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.db.turso_http import execute_query, to_str, parse_date
from app.core.security import get_current_active_user
from app.models import User
from app.schemas.milestone import (
    Milestone as MilestoneSchema,
    MilestoneCreate,
    MilestoneUpdate,
    MilestoneSubmit,
    MilestoneApprove
)

router = APIRouter()


def _row_to_milestone(row) -> dict:
    """Convert Turso row to milestone dict"""
    return {
        "id": int(row[0].get("value")) if row[0].get("type") != "null" else None,
        "contract_id": int(row[1].get("value")) if row[1].get("type") != "null" else None,
        "title": to_str(row[2]),
        "description": to_str(row[3]),
        "amount": float(row[4].get("value")) if row[4].get("type") != "null" else 0.0,
        "due_date": parse_date(row[5]),
        "status": to_str(row[6]) or "pending",
        "deliverables": to_str(row[7]),
        "submission_notes": to_str(row[8]),
        "approval_notes": to_str(row[9]),
        "submitted_at": parse_date(row[10]),
        "approved_at": parse_date(row[11]),
        "created_at": parse_date(row[12]),
        "updated_at": parse_date(row[13])
    }


def _send_notification_turso(user_id: int, notification_type: str, title: str, 
                              content: str, data: dict, priority: str, action_url: str):
    """Send notification using Turso"""
    now = datetime.now(timezone.utc).isoformat()
    execute_query("""
        INSERT INTO notifications (user_id, notification_type, title, content, data, 
                                   priority, action_url, is_read, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
    """, [user_id, notification_type, title, content, json.dumps(data), priority, action_url, now])


@router.post("/milestones", response_model=MilestoneSchema, status_code=status.HTTP_201_CREATED)
async def create_milestone(
    milestone_data: MilestoneCreate,
    current_user: User = Depends(get_current_active_user)
):
    """Create a new milestone for a contract. Only the contract client can create milestones."""
    # Get contract
    result = execute_query("SELECT id, client_id, freelancer_id FROM contracts WHERE id = ?", 
                          [milestone_data.contract_id])
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Contract not found")
    
    contract_row = result["rows"][0]
    client_id = int(contract_row[1].get("value"))
    freelancer_id = int(contract_row[2].get("value"))
    
    if current_user.id != client_id:
        raise HTTPException(status_code=403, detail="Only the contract client can create milestones")
    
    # Create milestone
    now = datetime.now(timezone.utc).isoformat()
    due_date = milestone_data.due_date.isoformat() if milestone_data.due_date else None
    
    insert_result = execute_query("""
        INSERT INTO milestones (contract_id, title, description, amount, due_date, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)
    """, [milestone_data.contract_id, milestone_data.title, milestone_data.description,
          milestone_data.amount, due_date, now, now])
    
    if not insert_result:
        raise HTTPException(status_code=500, detail="Failed to create milestone")
    
    # Get created milestone
    milestone_result = execute_query("""
        SELECT id, contract_id, title, description, amount, due_date, status,
               deliverables, submission_notes, approval_notes, submitted_at, approved_at, created_at, updated_at
        FROM milestones WHERE contract_id = ? ORDER BY id DESC LIMIT 1
    """, [milestone_data.contract_id])
    
    if not milestone_result or not milestone_result.get("rows"):
        raise HTTPException(status_code=500, detail="Failed to retrieve created milestone")
    
    milestone = _row_to_milestone(milestone_result["rows"][0])
    
    # Notify freelancer
    _send_notification_turso(
        user_id=freelancer_id,
        notification_type="milestone",
        title="New Milestone Created",
        content=f"A new milestone has been created for contract #{milestone_data.contract_id}",
        data={"milestone_id": milestone["id"], "contract_id": milestone_data.contract_id},
        priority="medium",
        action_url=f"/contracts/{milestone_data.contract_id}/milestones"
    )
    
    return milestone


@router.get("/milestones", response_model=List[MilestoneSchema])
async def list_milestones(
    contract_id: int = Query(..., description="Contract ID (required)"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: User = Depends(get_current_active_user)
):
    """List milestones for a contract. Only contract parties can view milestones."""
    # Get contract
    result = execute_query("SELECT id, client_id, freelancer_id FROM contracts WHERE id = ?", [contract_id])
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Contract not found")
    
    contract_row = result["rows"][0]
    client_id = int(contract_row[1].get("value"))
    freelancer_id = int(contract_row[2].get("value"))
    
    if current_user.id not in [client_id, freelancer_id]:
        raise HTTPException(status_code=403, detail="You don't have permission to view these milestones")
    
    # Build query
    sql = """
        SELECT id, contract_id, title, description, amount, due_date, status,
               deliverables, submission_notes, approval_notes, submitted_at, approved_at, created_at, updated_at
        FROM milestones WHERE contract_id = ?
    """
    params = [contract_id]
    
    if status_filter:
        sql += " AND status = ?"
        params.append(status_filter)
    
    sql += " ORDER BY due_date ASC LIMIT ? OFFSET ?"
    params.extend([limit, skip])
    
    milestones_result = execute_query(sql, params)
    
    milestones = []
    if milestones_result and milestones_result.get("rows"):
        for row in milestones_result["rows"]:
            milestones.append(_row_to_milestone(row))
    
    return milestones


@router.get("/milestones/{milestone_id}", response_model=MilestoneSchema)
async def get_milestone(
    milestone_id: int,
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific milestone. Only contract parties can view."""
    result = execute_query("""
        SELECT id, contract_id, title, description, amount, due_date, status,
               deliverables, submission_notes, approval_notes, submitted_at, approved_at, created_at, updated_at
        FROM milestones WHERE id = ?
    """, [milestone_id])
    
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Milestone not found")
    
    milestone = _row_to_milestone(result["rows"][0])
    
    # Get contract for access control
    contract_result = execute_query("SELECT client_id, freelancer_id FROM contracts WHERE id = ?", 
                                   [milestone["contract_id"]])
    if contract_result and contract_result.get("rows"):
        contract_row = contract_result["rows"][0]
        client_id = int(contract_row[0].get("value"))
        freelancer_id = int(contract_row[1].get("value"))
        
        if current_user.id not in [client_id, freelancer_id]:
            raise HTTPException(status_code=403, detail="You don't have permission to view this milestone")
    
    return milestone


@router.patch("/milestones/{milestone_id}", response_model=MilestoneSchema)
async def update_milestone(
    milestone_id: int,
    milestone_data: MilestoneUpdate,
    current_user: User = Depends(get_current_active_user)
):
    """Update a milestone. Only the client can update milestones that aren't submitted yet."""
    # Get milestone
    result = execute_query("""
        SELECT id, contract_id, status FROM milestones WHERE id = ?
    """, [milestone_id])
    
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Milestone not found")
    
    row = result["rows"][0]
    contract_id = int(row[1].get("value"))
    current_status = to_str(row[2])
    
    # Get contract
    contract_result = execute_query("SELECT client_id FROM contracts WHERE id = ?", [contract_id])
    if not contract_result or not contract_result.get("rows"):
        raise HTTPException(status_code=404, detail="Contract not found")
    
    client_id = int(contract_result["rows"][0][0].get("value"))
    
    if current_user.id != client_id:
        raise HTTPException(status_code=403, detail="Only the contract client can update milestones")
    
    if current_status in ["submitted", "approved"]:
        raise HTTPException(status_code=400, detail="Cannot update submitted or approved milestones")
    
    # Build update query
    update_fields = []
    params = []
    update_data = milestone_data.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        if field == "due_date" and value:
            update_fields.append(f"{field} = ?")
            params.append(value.isoformat())
        else:
            update_fields.append(f"{field} = ?")
            params.append(value)
    
    if update_fields:
        update_fields.append("updated_at = ?")
        params.append(datetime.now(timezone.utc).isoformat())
        params.append(milestone_id)
        
        execute_query(f"UPDATE milestones SET {', '.join(update_fields)} WHERE id = ?", params)
    
    # Return updated milestone
    return await get_milestone(milestone_id, current_user)


@router.post("/milestones/{milestone_id}/submit", response_model=MilestoneSchema)
async def submit_milestone(
    milestone_id: int,
    submission_data: MilestoneSubmit,
    current_user: User = Depends(get_current_active_user)
):
    """Submit a milestone for approval (freelancer action)."""
    # Get milestone
    result = execute_query("""
        SELECT id, contract_id, status FROM milestones WHERE id = ?
    """, [milestone_id])
    
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Milestone not found")
    
    row = result["rows"][0]
    contract_id = int(row[1].get("value"))
    current_status = to_str(row[2])
    
    # Get contract
    contract_result = execute_query("SELECT client_id, freelancer_id FROM contracts WHERE id = ?", [contract_id])
    if not contract_result or not contract_result.get("rows"):
        raise HTTPException(status_code=404, detail="Contract not found")
    
    contract_row = contract_result["rows"][0]
    client_id = int(contract_row[0].get("value"))
    freelancer_id = int(contract_row[1].get("value"))
    
    if current_user.id != freelancer_id:
        raise HTTPException(status_code=403, detail="Only the freelancer can submit milestones")
    
    if current_status != "pending":
        raise HTTPException(status_code=400, detail=f"Milestone is {current_status}, cannot submit")
    
    # Update milestone
    now = datetime.now(timezone.utc).isoformat()
    execute_query("""
        UPDATE milestones SET status = 'submitted', deliverables = ?, submission_notes = ?, 
                              submitted_at = ?, updated_at = ?
        WHERE id = ?
    """, [submission_data.deliverables, submission_data.submission_notes, now, now, milestone_id])
    
    # Notify client
    _send_notification_turso(
        user_id=client_id,
        notification_type="milestone",
        title="Milestone Submitted for Review",
        content=f"Milestone #{milestone_id} has been submitted for your review",
        data={"milestone_id": milestone_id, "contract_id": contract_id},
        priority="high",
        action_url=f"/milestones/{milestone_id}"
    )
    
    return await get_milestone(milestone_id, current_user)


@router.post("/milestones/{milestone_id}/approve", response_model=MilestoneSchema)
async def approve_milestone(
    milestone_id: int,
    approval_data: MilestoneApprove,
    current_user: User = Depends(get_current_active_user)
):
    """Approve a milestone (client action). Triggers payment creation."""
    # Get milestone
    result = execute_query("""
        SELECT id, contract_id, status, amount, title FROM milestones WHERE id = ?
    """, [milestone_id])
    
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Milestone not found")
    
    row = result["rows"][0]
    contract_id = int(row[1].get("value"))
    current_status = to_str(row[2])
    amount = float(row[3].get("value")) if row[3].get("type") != "null" else 0.0
    title = to_str(row[4])
    
    # Get contract
    contract_result = execute_query("SELECT client_id, freelancer_id FROM contracts WHERE id = ?", [contract_id])
    if not contract_result or not contract_result.get("rows"):
        raise HTTPException(status_code=404, detail="Contract not found")
    
    contract_row = contract_result["rows"][0]
    client_id = int(contract_row[0].get("value"))
    freelancer_id = int(contract_row[1].get("value"))
    
    if current_user.id != client_id:
        raise HTTPException(status_code=403, detail="Only the contract client can approve milestones")
    
    if current_status != "submitted":
        raise HTTPException(status_code=400, detail=f"Milestone is {current_status}, must be submitted to approve")
    
    # Calculate payment amounts
    platform_fee_percentage = 0.10
    platform_fee = amount * platform_fee_percentage
    freelancer_amount = amount - platform_fee
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Update milestone
    execute_query("""
        UPDATE milestones SET status = 'approved', approval_notes = ?, approved_at = ?, updated_at = ?
        WHERE id = ?
    """, [approval_data.approval_notes, now, now, milestone_id])
    
    # Create payment record
    execute_query("""
        INSERT INTO payments (contract_id, milestone_id, from_user_id, to_user_id, amount, 
                             platform_fee, freelancer_amount, payment_type, payment_method, 
                             status, description, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'milestone', 'escrow', 'pending', ?, ?, ?)
    """, [contract_id, milestone_id, client_id, freelancer_id, amount, platform_fee, 
          freelancer_amount, f"Payment for milestone: {title}", now, now])
    
    # Get created payment ID
    payment_result = execute_query("""
        SELECT id FROM payments WHERE milestone_id = ? ORDER BY id DESC LIMIT 1
    """, [milestone_id])
    
    payment_id = None
    if payment_result and payment_result.get("rows"):
        payment_id = int(payment_result["rows"][0][0].get("value"))
        
    # Create Invoice
    invoice_number = f"INV-{contract_id}-{milestone_id}-{int(datetime.now(timezone.utc).timestamp())}"
    items = json.dumps([{"description": f"Milestone: {title}", "amount": amount}])
    
    execute_query("""
        INSERT INTO invoices (invoice_number, contract_id, from_user_id, to_user_id, 
                              subtotal, total, status, payment_id, items, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, 'paid', ?, ?, ?, ?)
    """, [invoice_number, contract_id, freelancer_id, client_id, 
          amount, amount, payment_id, items, now, now])
    
    # Notify freelancer
    _send_notification_turso(
        user_id=freelancer_id,
        notification_type="payment",
        title="Milestone Approved - Payment Processing",
        content=f"Milestone #{milestone_id} approved. Payment of ${freelancer_amount:.2f} is being processed.",
        data={"milestone_id": milestone_id, "payment_id": payment_id, "amount": float(freelancer_amount)},
        priority="high",
        action_url=f"/payments/{payment_id}" if payment_id else f"/milestones/{milestone_id}"
    )
    
    return await get_milestone(milestone_id, current_user)


@router.post("/milestones/{milestone_id}/reject", response_model=MilestoneSchema)
async def reject_milestone(
    milestone_id: int,
    rejection_notes: str,
    current_user: User = Depends(get_current_active_user)
):
    """Reject a milestone submission (client action). Returns milestone to PENDING status."""
    # Get milestone
    result = execute_query("""
        SELECT id, contract_id, status FROM milestones WHERE id = ?
    """, [milestone_id])
    
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Milestone not found")
    
    row = result["rows"][0]
    contract_id = int(row[1].get("value"))
    current_status = to_str(row[2])
    
    # Get contract
    contract_result = execute_query("SELECT client_id, freelancer_id FROM contracts WHERE id = ?", [contract_id])
    if not contract_result or not contract_result.get("rows"):
        raise HTTPException(status_code=404, detail="Contract not found")
    
    contract_row = contract_result["rows"][0]
    client_id = int(contract_row[0].get("value"))
    freelancer_id = int(contract_row[1].get("value"))
    
    if current_user.id != client_id:
        raise HTTPException(status_code=403, detail="Only the contract client can reject milestones")
    
    if current_status != "submitted":
        raise HTTPException(status_code=400, detail=f"Milestone is {current_status}, must be submitted to reject")
    
    # Update milestone
    now = datetime.now(timezone.utc).isoformat()
    execute_query("""
        UPDATE milestones SET status = 'pending', approval_notes = ?, submitted_at = NULL, updated_at = ?
        WHERE id = ?
    """, [rejection_notes, now, milestone_id])
    
    # Notify freelancer
    _send_notification_turso(
        user_id=freelancer_id,
        notification_type="milestone",
        title="Milestone Needs Revision",
        content=f"Milestone #{milestone_id} needs revision. Check feedback from client.",
        data={"milestone_id": milestone_id, "contract_id": contract_id},
        priority="high",
        action_url=f"/milestones/{milestone_id}"
    )
    
    return await get_milestone(milestone_id, current_user)


@router.delete("/milestones/{milestone_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_milestone(
    milestone_id: int,
    current_user: User = Depends(get_current_active_user)
):
    """Delete a milestone. Only client can delete, and only if not yet submitted."""
    # Get milestone
    result = execute_query("""
        SELECT id, contract_id, status FROM milestones WHERE id = ?
    """, [milestone_id])
    
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Milestone not found")
    
    row = result["rows"][0]
    contract_id = int(row[1].get("value"))
    current_status = to_str(row[2])
    
    # Get contract
    contract_result = execute_query("SELECT client_id FROM contracts WHERE id = ?", [contract_id])
    if not contract_result or not contract_result.get("rows"):
        raise HTTPException(status_code=404, detail="Contract not found")
    
    client_id = int(contract_result["rows"][0][0].get("value"))
    
    if current_user.id != client_id:
        raise HTTPException(status_code=403, detail="Only the contract client can delete milestones")
    
    if current_status in ["submitted", "approved"]:
        raise HTTPException(status_code=400, detail="Cannot delete submitted or approved milestones")
    
    execute_query("DELETE FROM milestones WHERE id = ?", [milestone_id])
