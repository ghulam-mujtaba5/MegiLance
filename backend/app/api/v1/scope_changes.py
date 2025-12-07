# @AI-HINT: Scope Change Request API - CRUD operations for contract scope modifications
"""
Scope Change Request API
Handles negotiation of scope changes within active contracts.
Enables clients and freelancers to propose budget/deadline/scope modifications.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List, Optional
from datetime import datetime
import json
import logging

from app.core.security import get_current_active_user
from app.db.turso_http import execute_query, to_str, parse_date
from app.models.user import User
from pydantic import BaseModel, Field

router = APIRouter()
logger = logging.getLogger(__name__)

# Pydantic Models
class ScopeChangeCreate(BaseModel):
    contract_id: int = Field(..., gt=0, description="Contract ID to request scope change for")
    title: str = Field(..., min_length=5, max_length=255, description="Brief title of the scope change")
    description: str = Field(..., min_length=10, max_length=5000, description="Detailed description of the change")
    reason: Optional[str] = Field(None, max_length=2000, description="Reason for the scope change")
    new_amount: Optional[float] = Field(None, ge=0, description="Proposed new contract amount")
    new_deadline: Optional[datetime] = Field(None, description="Proposed new deadline")


class ScopeChangeUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=5, max_length=255)
    description: Optional[str] = Field(None, min_length=10, max_length=5000)
    reason: Optional[str] = Field(None, max_length=2000)
    new_amount: Optional[float] = Field(None, ge=0)
    new_deadline: Optional[datetime] = None


class ScopeChangeResponse(BaseModel):
    id: int
    contract_id: int
    requested_by: int
    requester_name: Optional[str] = None
    title: str
    description: str
    reason: Optional[str] = None
    status: str
    old_amount: Optional[float] = None
    new_amount: Optional[float] = None
    old_deadline: Optional[datetime] = None
    new_deadline: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None


class ScopeChangeApproval(BaseModel):
    approval_notes: Optional[str] = Field(None, max_length=2000, description="Notes about the approval")


class ScopeChangeRejection(BaseModel):
    rejection_reason: str = Field(..., min_length=10, max_length=2000, description="Reason for rejection")


def _get_val(row: list, idx: int):
    """Extract value from database row"""
    if idx >= len(row):
        return None
    cell = row[idx]
    if isinstance(cell, dict):
        if cell.get("type") == "null":
            return None
        return cell.get("value")
    return cell


def _scope_change_from_row(row: list) -> dict:
    """Convert database row to scope change dict"""
    return {
        "id": int(_get_val(row, 0) or 0),
        "contract_id": int(_get_val(row, 1) or 0),
        "requested_by": int(_get_val(row, 2) or 0),
        "requester_name": _get_val(row, 3),
        "title": _get_val(row, 4) or "",
        "description": _get_val(row, 5) or "",
        "reason": _get_val(row, 6),
        "status": _get_val(row, 7) or "pending",
        "old_amount": float(_get_val(row, 8)) if _get_val(row, 8) else None,
        "new_amount": float(_get_val(row, 9)) if _get_val(row, 9) else None,
        "old_deadline": parse_date(_get_val(row, 10)),
        "new_deadline": parse_date(_get_val(row, 11)),
        "created_at": parse_date(_get_val(row, 12)) or datetime.utcnow(),
        "updated_at": parse_date(_get_val(row, 13)) or datetime.utcnow(),
        "resolved_at": parse_date(_get_val(row, 14))
    }


def _get_contract_parties(contract_id: int) -> tuple:
    """Get client_id and freelancer_id for a contract"""
    result = execute_query(
        "SELECT client_id, freelancer_id, total_amount, end_date, status FROM contracts WHERE id = ?",
        [contract_id]
    )
    if not result or not result.get("rows"):
        return None, None, None, None, None
    row = result["rows"][0]
    return (
        int(_get_val(row, 0) or 0),
        int(_get_val(row, 1) or 0),
        float(_get_val(row, 2)) if _get_val(row, 2) else None,
        parse_date(_get_val(row, 3)),
        _get_val(row, 4)
    )


def _send_notification(user_id: int, notification_type: str, title: str, 
                       content: str, data: dict, priority: str = "medium", action_url: str = ""):
    """Send notification to user"""
    now = datetime.utcnow().isoformat()
    try:
        execute_query("""
            INSERT INTO notifications (user_id, notification_type, title, content, data, 
                                       priority, action_url, is_read, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
        """, [user_id, notification_type, title, content, json.dumps(data), priority, action_url, now])
    except Exception as e:
        logger.warning(f"Failed to send notification: {e}")


@router.post("/", response_model=ScopeChangeResponse, status_code=status.HTTP_201_CREATED)
async def create_scope_change_request(
    scope_change: ScopeChangeCreate,
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new scope change request for a contract.
    
    Either party (client or freelancer) can request scope changes.
    The other party must approve or reject the request.
    """
    # Verify contract exists and get parties
    client_id, freelancer_id, current_amount, current_deadline, contract_status = _get_contract_parties(scope_change.contract_id)
    
    if client_id is None:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    # Check if user is part of the contract
    if current_user.id not in [client_id, freelancer_id]:
        raise HTTPException(status_code=403, detail="You are not a party to this contract")
    
    # Check contract status
    if contract_status not in ["pending", "active"]:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot request scope changes for a {contract_status} contract"
        )
    
    # Check for existing pending scope changes
    existing = execute_query(
        "SELECT id FROM scope_change_requests WHERE contract_id = ? AND status = 'pending'",
        [scope_change.contract_id]
    )
    if existing and existing.get("rows"):
        raise HTTPException(
            status_code=400,
            detail="There is already a pending scope change request for this contract"
        )
    
    now = datetime.utcnow().isoformat()
    
    # Insert scope change request
    result = execute_query("""
        INSERT INTO scope_change_requests (
            contract_id, requested_by, title, description, reason, status,
            old_amount, new_amount, old_deadline, new_deadline, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?)
    """, [
        scope_change.contract_id,
        current_user.id,
        scope_change.title,
        scope_change.description,
        scope_change.reason,
        current_amount,
        scope_change.new_amount,
        current_deadline.isoformat() if current_deadline else None,
        scope_change.new_deadline.isoformat() if scope_change.new_deadline else None,
        now,
        now
    ])
    
    if not result:
        raise HTTPException(status_code=500, detail="Failed to create scope change request")
    
    # Get created scope change
    created = execute_query("""
        SELECT scr.id, scr.contract_id, scr.requested_by, u.full_name,
               scr.title, scr.description, scr.reason, scr.status,
               scr.old_amount, scr.new_amount, scr.old_deadline, scr.new_deadline,
               scr.created_at, scr.updated_at, scr.resolved_at
        FROM scope_change_requests scr
        LEFT JOIN users u ON scr.requested_by = u.id
        WHERE scr.contract_id = ? 
        ORDER BY scr.id DESC LIMIT 1
    """, [scope_change.contract_id])
    
    if not created or not created.get("rows"):
        raise HTTPException(status_code=500, detail="Failed to retrieve created scope change")
    
    scope_change_data = _scope_change_from_row(created["rows"][0])
    
    # Notify the other party
    other_party = freelancer_id if current_user.id == client_id else client_id
    _send_notification(
        user_id=other_party,
        notification_type="scope_change",
        title="Scope Change Request",
        content=f"A scope change has been requested for contract #{scope_change.contract_id}: {scope_change.title}",
        data={"scope_change_id": scope_change_data["id"], "contract_id": scope_change.contract_id},
        priority="high",
        action_url=f"/contracts/{scope_change.contract_id}/scope-changes"
    )
    
    logger.info(f"Scope change request created by user {current_user.id} for contract {scope_change.contract_id}")
    
    return scope_change_data


@router.get("/", response_model=List[ScopeChangeResponse])
async def list_scope_change_requests(
    contract_id: Optional[int] = Query(None, description="Filter by contract ID"),
    status_filter: Optional[str] = Query(None, alias="status", pattern="^(pending|approved|rejected|cancelled)$"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_active_user)
):
    """
    List scope change requests.
    
    Returns scope changes for contracts where the user is a party.
    """
    sql = """
        SELECT scr.id, scr.contract_id, scr.requested_by, u.full_name,
               scr.title, scr.description, scr.reason, scr.status,
               scr.old_amount, scr.new_amount, scr.old_deadline, scr.new_deadline,
               scr.created_at, scr.updated_at, scr.resolved_at
        FROM scope_change_requests scr
        LEFT JOIN users u ON scr.requested_by = u.id
        LEFT JOIN contracts c ON scr.contract_id = c.id
        WHERE (c.client_id = ? OR c.freelancer_id = ?)
    """
    params = [current_user.id, current_user.id]
    
    if contract_id:
        sql += " AND scr.contract_id = ?"
        params.append(contract_id)
    
    if status_filter:
        sql += " AND scr.status = ?"
        params.append(status_filter)
    
    sql += " ORDER BY scr.created_at DESC LIMIT ? OFFSET ?"
    params.extend([limit, skip])
    
    result = execute_query(sql, params)
    
    scope_changes = []
    if result and result.get("rows"):
        for row in result["rows"]:
            scope_changes.append(_scope_change_from_row(row))
    
    return scope_changes


@router.get("/{scope_change_id}", response_model=ScopeChangeResponse)
async def get_scope_change_request(
    scope_change_id: int,
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific scope change request."""
    result = execute_query("""
        SELECT scr.id, scr.contract_id, scr.requested_by, u.full_name,
               scr.title, scr.description, scr.reason, scr.status,
               scr.old_amount, scr.new_amount, scr.old_deadline, scr.new_deadline,
               scr.created_at, scr.updated_at, scr.resolved_at
        FROM scope_change_requests scr
        LEFT JOIN users u ON scr.requested_by = u.id
        WHERE scr.id = ?
    """, [scope_change_id])
    
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Scope change request not found")
    
    scope_change = _scope_change_from_row(result["rows"][0])
    
    # Verify user has access
    client_id, freelancer_id, _, _, _ = _get_contract_parties(scope_change["contract_id"])
    if current_user.id not in [client_id, freelancer_id]:
        raise HTTPException(status_code=403, detail="You are not a party to this contract")
    
    return scope_change


@router.patch("/{scope_change_id}", response_model=ScopeChangeResponse)
async def update_scope_change_request(
    scope_change_id: int,
    update_data: ScopeChangeUpdate,
    current_user: User = Depends(get_current_active_user)
):
    """
    Update a pending scope change request.
    
    Only the requester can update, and only if still pending.
    """
    # Get existing scope change
    result = execute_query(
        "SELECT contract_id, requested_by, status FROM scope_change_requests WHERE id = ?",
        [scope_change_id]
    )
    
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Scope change request not found")
    
    row = result["rows"][0]
    contract_id = int(_get_val(row, 0) or 0)
    requested_by = int(_get_val(row, 1) or 0)
    current_status = _get_val(row, 2)
    
    if current_user.id != requested_by:
        raise HTTPException(status_code=403, detail="Only the requester can update this scope change")
    
    if current_status != "pending":
        raise HTTPException(status_code=400, detail=f"Cannot update a {current_status} scope change request")
    
    # Build update query
    update_fields = []
    params = []
    data = update_data.model_dump(exclude_unset=True)
    
    for field, value in data.items():
        if value is not None:
            update_fields.append(f"{field} = ?")
            if isinstance(value, datetime):
                params.append(value.isoformat())
            else:
                params.append(value)
    
    if update_fields:
        update_fields.append("updated_at = ?")
        params.append(datetime.utcnow().isoformat())
        params.append(scope_change_id)
        
        execute_query(
            f"UPDATE scope_change_requests SET {', '.join(update_fields)} WHERE id = ?",
            params
        )
    
    return await get_scope_change_request(scope_change_id, current_user)


@router.post("/{scope_change_id}/approve", response_model=ScopeChangeResponse)
async def approve_scope_change(
    scope_change_id: int,
    approval: ScopeChangeApproval = None,
    current_user: User = Depends(get_current_active_user)
):
    """
    Approve a scope change request.
    
    Only the other party (not the requester) can approve.
    Approval automatically updates the contract with new values.
    """
    # Get scope change
    result = execute_query("""
        SELECT contract_id, requested_by, status, new_amount, new_deadline
        FROM scope_change_requests WHERE id = ?
    """, [scope_change_id])
    
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Scope change request not found")
    
    row = result["rows"][0]
    contract_id = int(_get_val(row, 0) or 0)
    requested_by = int(_get_val(row, 1) or 0)
    current_status = _get_val(row, 2)
    new_amount = float(_get_val(row, 3)) if _get_val(row, 3) else None
    new_deadline = parse_date(_get_val(row, 4))
    
    if current_status != "pending":
        raise HTTPException(status_code=400, detail=f"Cannot approve a {current_status} scope change")
    
    # Get contract parties
    client_id, freelancer_id, _, _, _ = _get_contract_parties(contract_id)
    
    if current_user.id not in [client_id, freelancer_id]:
        raise HTTPException(status_code=403, detail="You are not a party to this contract")
    
    if current_user.id == requested_by:
        raise HTTPException(status_code=400, detail="You cannot approve your own scope change request")
    
    now = datetime.utcnow().isoformat()
    
    # Update scope change status
    execute_query("""
        UPDATE scope_change_requests 
        SET status = 'approved', resolved_at = ?, updated_at = ?
        WHERE id = ?
    """, [now, now, scope_change_id])
    
    # Update contract with new values
    contract_updates = ["updated_at = ?"]
    contract_params = [now]
    
    if new_amount is not None:
        contract_updates.append("total_amount = ?")
        contract_params.append(new_amount)
    
    if new_deadline is not None:
        contract_updates.append("end_date = ?")
        contract_params.append(new_deadline.isoformat())
    
    contract_params.append(contract_id)
    
    execute_query(
        f"UPDATE contracts SET {', '.join(contract_updates)} WHERE id = ?",
        contract_params
    )
    
    # Notify requester
    _send_notification(
        user_id=requested_by,
        notification_type="scope_change",
        title="Scope Change Approved",
        content=f"Your scope change request for contract #{contract_id} has been approved",
        data={"scope_change_id": scope_change_id, "contract_id": contract_id},
        priority="high",
        action_url=f"/contracts/{contract_id}"
    )
    
    logger.info(f"Scope change {scope_change_id} approved by user {current_user.id}")
    
    return await get_scope_change_request(scope_change_id, current_user)


@router.post("/{scope_change_id}/reject", response_model=ScopeChangeResponse)
async def reject_scope_change(
    scope_change_id: int,
    rejection: ScopeChangeRejection,
    current_user: User = Depends(get_current_active_user)
):
    """
    Reject a scope change request.
    
    Only the other party (not the requester) can reject.
    """
    # Get scope change
    result = execute_query(
        "SELECT contract_id, requested_by, status FROM scope_change_requests WHERE id = ?",
        [scope_change_id]
    )
    
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Scope change request not found")
    
    row = result["rows"][0]
    contract_id = int(_get_val(row, 0) or 0)
    requested_by = int(_get_val(row, 1) or 0)
    current_status = _get_val(row, 2)
    
    if current_status != "pending":
        raise HTTPException(status_code=400, detail=f"Cannot reject a {current_status} scope change")
    
    # Get contract parties
    client_id, freelancer_id, _, _, _ = _get_contract_parties(contract_id)
    
    if current_user.id not in [client_id, freelancer_id]:
        raise HTTPException(status_code=403, detail="You are not a party to this contract")
    
    if current_user.id == requested_by:
        raise HTTPException(status_code=400, detail="You cannot reject your own scope change request")
    
    now = datetime.utcnow().isoformat()
    
    # Update scope change status
    execute_query("""
        UPDATE scope_change_requests 
        SET status = 'rejected', reason = COALESCE(reason, '') || ' [Rejected: ' || ? || ']', 
            resolved_at = ?, updated_at = ?
        WHERE id = ?
    """, [rejection.rejection_reason, now, now, scope_change_id])
    
    # Notify requester
    _send_notification(
        user_id=requested_by,
        notification_type="scope_change",
        title="Scope Change Rejected",
        content=f"Your scope change request for contract #{contract_id} has been rejected: {rejection.rejection_reason}",
        data={"scope_change_id": scope_change_id, "contract_id": contract_id},
        priority="medium",
        action_url=f"/contracts/{contract_id}/scope-changes"
    )
    
    logger.info(f"Scope change {scope_change_id} rejected by user {current_user.id}")
    
    return await get_scope_change_request(scope_change_id, current_user)


@router.post("/{scope_change_id}/cancel", response_model=ScopeChangeResponse)
async def cancel_scope_change(
    scope_change_id: int,
    current_user: User = Depends(get_current_active_user)
):
    """
    Cancel a scope change request.
    
    Only the requester can cancel their own pending request.
    """
    # Get scope change
    result = execute_query(
        "SELECT contract_id, requested_by, status FROM scope_change_requests WHERE id = ?",
        [scope_change_id]
    )
    
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Scope change request not found")
    
    row = result["rows"][0]
    contract_id = int(_get_val(row, 0) or 0)
    requested_by = int(_get_val(row, 1) or 0)
    current_status = _get_val(row, 2)
    
    if current_user.id != requested_by:
        raise HTTPException(status_code=403, detail="Only the requester can cancel this scope change")
    
    if current_status != "pending":
        raise HTTPException(status_code=400, detail=f"Cannot cancel a {current_status} scope change")
    
    now = datetime.utcnow().isoformat()
    
    execute_query("""
        UPDATE scope_change_requests 
        SET status = 'cancelled', resolved_at = ?, updated_at = ?
        WHERE id = ?
    """, [now, now, scope_change_id])
    
    logger.info(f"Scope change {scope_change_id} cancelled by user {current_user.id}")
    
    return await get_scope_change_request(scope_change_id, current_user)


@router.get("/contract/{contract_id}/history", response_model=List[ScopeChangeResponse])
async def get_scope_change_history(
    contract_id: int,
    current_user: User = Depends(get_current_active_user)
):
    """
    Get complete scope change history for a contract.
    
    Returns all scope changes (pending, approved, rejected, cancelled) for the contract.
    """
    # Verify user has access
    client_id, freelancer_id, _, _, _ = _get_contract_parties(contract_id)
    
    if client_id is None:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    if current_user.id not in [client_id, freelancer_id]:
        raise HTTPException(status_code=403, detail="You are not a party to this contract")
    
    result = execute_query("""
        SELECT scr.id, scr.contract_id, scr.requested_by, u.full_name,
               scr.title, scr.description, scr.reason, scr.status,
               scr.old_amount, scr.new_amount, scr.old_deadline, scr.new_deadline,
               scr.created_at, scr.updated_at, scr.resolved_at
        FROM scope_change_requests scr
        LEFT JOIN users u ON scr.requested_by = u.id
        WHERE scr.contract_id = ?
        ORDER BY scr.created_at DESC
    """, [contract_id])
    
    scope_changes = []
    if result and result.get("rows"):
        for row in result["rows"]:
            scope_changes.append(_scope_change_from_row(row))
    
    return scope_changes
