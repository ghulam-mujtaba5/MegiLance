"""
@AI-HINT: Dispute Management API - Turso HTTP only (NO SQLite fallback)
Handles dispute creation, listing, admin assignment, and resolution.
"""
from typing import List, Optional
import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status, UploadFile, File

from app.db.turso_http import execute_query, to_str, parse_date
from app.core.security import get_current_active_user
from app.core.storage import save_file
from app.models import User
from app.schemas.dispute import (
    Dispute as DisputeSchema,
    DisputeCreate,
    DisputeUpdate,
    DisputeList
)

router = APIRouter()


def _row_to_dispute(row) -> dict:
    """Convert Turso row to dispute dict"""
    return {
        "id": int(row[0].get("value")) if row[0].get("type") != "null" else None,
        "contract_id": int(row[1].get("value")) if row[1].get("type") != "null" else None,
        "raised_by_id": int(row[2].get("value")) if row[2].get("type") != "null" else None,
        "dispute_type": to_str(row[3]),
        "description": to_str(row[4]),
        "status": to_str(row[5]) or "open",
        "assigned_to_id": int(row[6].get("value")) if row[6].get("type") != "null" else None,
        "resolution": to_str(row[7]),
        "created_at": parse_date(row[8]),
        "updated_at": parse_date(row[9])
    }


def _send_notification_turso(user_id: int, notification_type: str, title: str, 
                              content: str, data: dict, priority: str, action_url: str):
    """Send notification using Turso"""
    now = datetime.utcnow().isoformat()
    execute_query("""
        INSERT INTO notifications (user_id, notification_type, title, content, data, 
                                   priority, action_url, is_read, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
    """, [user_id, notification_type, title, content, json.dumps(data), priority, action_url, now])


@router.post("/disputes", response_model=DisputeSchema, status_code=status.HTTP_201_CREATED)
async def create_dispute(
    dispute_data: DisputeCreate,
    current_user: User = Depends(get_current_active_user)
):
    """Create a new dispute. Only contract parties can raise disputes."""
    # Get contract
    result = execute_query("SELECT id, client_id, freelancer_id FROM contracts WHERE id = ?", 
                          [dispute_data.contract_id])
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Contract not found")
    
    contract_row = result["rows"][0]
    client_id = int(contract_row[1].get("value"))
    freelancer_id = int(contract_row[2].get("value"))
    
    if current_user.id not in [client_id, freelancer_id]:
        raise HTTPException(status_code=403, detail="Only contract parties can raise disputes")
    
    # Create dispute
    now = datetime.utcnow().isoformat()
    dispute_type = dispute_data.dispute_type.value if hasattr(dispute_data.dispute_type, 'value') else dispute_data.dispute_type
    
    execute_query("""
        INSERT INTO disputes (contract_id, raised_by_id, dispute_type, description, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, 'open', ?, ?)
    """, [dispute_data.contract_id, current_user.id, dispute_type, dispute_data.description, now, now])
    
    # Update contract status to 'disputed'
    execute_query("UPDATE contracts SET status = 'disputed', updated_at = ? WHERE id = ?", [now, dispute_data.contract_id])
    
    # Get created dispute
    dispute_result = execute_query("""
        SELECT id, contract_id, raised_by_id, dispute_type, description, status, assigned_to_id, resolution, created_at, updated_at
        FROM disputes WHERE contract_id = ? AND raised_by_id = ? ORDER BY id DESC LIMIT 1
    """, [dispute_data.contract_id, current_user.id])
    
    if not dispute_result or not dispute_result.get("rows"):
        raise HTTPException(status_code=500, detail="Failed to retrieve created dispute")
    
    dispute = _row_to_dispute(dispute_result["rows"][0])
    
    # Notify other party
    other_party_id = freelancer_id if current_user.id == client_id else client_id
    _send_notification_turso(
        user_id=other_party_id,
        notification_type="dispute",
        title="New Dispute Raised",
        content=f"A dispute has been raised on contract #{dispute_data.contract_id}",
        data={"dispute_id": dispute["id"], "contract_id": dispute_data.contract_id},
        priority="high",
        action_url=f"/disputes/{dispute['id']}"
    )
    
    # Notify admins
    admin_result = execute_query("SELECT id FROM users WHERE user_type = 'Admin'", [])
    if admin_result and admin_result.get("rows"):
        for admin_row in admin_result["rows"]:
            admin_id = int(admin_row[0].get("value"))
            _send_notification_turso(
                user_id=admin_id,
                notification_type="admin_action",
                title="New Dispute Requires Attention",
                content=f"Dispute #{dispute['id']} raised on contract #{dispute_data.contract_id}",
                data={"dispute_id": dispute["id"], "contract_id": dispute_data.contract_id},
                priority="high",
                action_url=f"/admin/disputes/{dispute['id']}"
            )
    
    return dispute


@router.get("/disputes", response_model=DisputeList)
async def list_disputes(
    contract_id: Optional[int] = Query(None, description="Filter by contract"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status"),
    dispute_type: Optional[str] = Query(None, description="Filter by type"),
    raised_by_me: bool = Query(False, description="Only disputes I raised"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: User = Depends(get_current_active_user)
):
    """List disputes with filtering. Regular users see only disputes they're involved in."""
    user_type = getattr(current_user, 'user_type', None)
    if hasattr(user_type, 'value'):
        user_type = user_type.value
    user_type = str(user_type).lower() if user_type else 'client'
    
    if user_type != "admin":
        # Get contracts user is involved in
        contracts_result = execute_query("""
            SELECT id FROM contracts WHERE client_id = ? OR freelancer_id = ?
        """, [current_user.id, current_user.id])
        
        contract_ids = []
        if contracts_result and contracts_result.get("rows"):
            contract_ids = [int(r[0].get("value")) for r in contracts_result["rows"]]
        
        if not contract_ids:
            return DisputeList(total=0, disputes=[])
        
        placeholders = ",".join(["?" for _ in contract_ids])
        sql = f"""
            SELECT id, contract_id, raised_by_id, dispute_type, description, status, assigned_to_id, resolution, created_at, updated_at
            FROM disputes WHERE contract_id IN ({placeholders})
        """
        params = contract_ids
    else:
        sql = """
            SELECT id, contract_id, raised_by_id, dispute_type, description, status, assigned_to_id, resolution, created_at, updated_at
            FROM disputes WHERE 1=1
        """
        params = []
    
    if contract_id:
        sql += " AND contract_id = ?"
        params.append(contract_id)
    if status_filter:
        sql += " AND status = ?"
        params.append(status_filter)
    if dispute_type:
        sql += " AND dispute_type = ?"
        params.append(dispute_type)
    if raised_by_me:
        sql += " AND raised_by_id = ?"
        params.append(current_user.id)
    
    # Get total count
    count_sql = sql.replace(
        "SELECT id, contract_id, raised_by_id, dispute_type, description, status, assigned_to_id, resolution, created_at, updated_at",
        "SELECT COUNT(*)"
    )
    count_result = execute_query(count_sql, params)
    total = 0
    if count_result and count_result.get("rows"):
        total = int(count_result["rows"][0][0].get("value"))
    
    sql += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
    params.extend([limit, skip])
    
    result = execute_query(sql, params)
    
    disputes = []
    if result and result.get("rows"):
        for row in result["rows"]:
            disputes.append(_row_to_dispute(row))
    
    return DisputeList(total=total, disputes=disputes)


@router.get("/disputes/{dispute_id}", response_model=DisputeSchema)
async def get_dispute(
    dispute_id: int,
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific dispute. Only viewable by contract parties and admins."""
    result = execute_query("""
        SELECT id, contract_id, raised_by_id, dispute_type, description, status, assigned_to_id, resolution, created_at, updated_at
        FROM disputes WHERE id = ?
    """, [dispute_id])
    
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Dispute not found")
    
    dispute = _row_to_dispute(result["rows"][0])
    
    user_type = getattr(current_user, 'user_type', None)
    if hasattr(user_type, 'value'):
        user_type = user_type.value
    user_type = str(user_type).lower() if user_type else 'client'
    
    if user_type != "admin":
        # Verify access
        contract_result = execute_query("SELECT client_id, freelancer_id FROM contracts WHERE id = ?", 
                                        [dispute["contract_id"]])
        if contract_result and contract_result.get("rows"):
            contract_row = contract_result["rows"][0]
            client_id = int(contract_row[0].get("value"))
            freelancer_id = int(contract_row[1].get("value"))
            
            if current_user.id not in [client_id, freelancer_id]:
                raise HTTPException(status_code=403, detail="You don't have permission to view this dispute")
    
    return dispute


@router.patch("/disputes/{dispute_id}", response_model=DisputeSchema)
async def update_dispute(
    dispute_id: int,
    dispute_data: DisputeUpdate,
    current_user: User = Depends(get_current_active_user)
):
    """Update a dispute. Regular users can only update description, admins can update everything."""
    result = execute_query("""
        SELECT id, contract_id, status FROM disputes WHERE id = ?
    """, [dispute_id])
    
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Dispute not found")
    
    row = result["rows"][0]
    contract_id = int(row[1].get("value"))
    current_status = to_str(row[2])
    
    # Get contract for access control
    contract_result = execute_query("SELECT client_id, freelancer_id FROM contracts WHERE id = ?", [contract_id])
    if not contract_result or not contract_result.get("rows"):
        raise HTTPException(status_code=404, detail="Contract not found")
    
    contract_row = contract_result["rows"][0]
    client_id = int(contract_row[0].get("value"))
    freelancer_id = int(contract_row[1].get("value"))
    
    user_type = getattr(current_user, 'user_type', None)
    if hasattr(user_type, 'value'):
        user_type = user_type.value
    user_type = str(user_type).lower() if user_type else 'client'
    
    update_dict = dispute_data.model_dump(exclude_unset=True)
    
    if user_type == "admin":
        # Admins can update everything
        # Send notifications on status changes
        if "status" in update_dict and update_dict["status"] != current_status:
            new_status = update_dict["status"]
            if hasattr(new_status, 'value'):
                new_status = new_status.value
            
            for party_id in [client_id, freelancer_id]:
                _send_notification_turso(
                    user_id=party_id,
                    notification_type="dispute",
                    title="Dispute Status Updated",
                    content=f"Dispute #{dispute_id} status changed to {new_status}",
                    data={"dispute_id": dispute_id, "new_status": new_status},
                    priority="high",
                    action_url=f"/disputes/{dispute_id}"
                )
    elif current_user.id in [client_id, freelancer_id]:
        # Contract parties can only update description
        if set(update_dict.keys()) - {"description"}:
            raise HTTPException(status_code=403, detail="You can only update the description")
        if "description" not in update_dict:
            update_dict = {}
    else:
        raise HTTPException(status_code=403, detail="You don't have permission to update this dispute")
    
    # Build update query
    if update_dict:
        update_fields = []
        params = []
        
        for field, value in update_dict.items():
            if hasattr(value, 'value'):
                value = value.value
            update_fields.append(f"{field} = ?")
            params.append(value)
        
        update_fields.append("updated_at = ?")
        params.append(datetime.utcnow().isoformat())
        params.append(dispute_id)
        
        execute_query(f"UPDATE disputes SET {', '.join(update_fields)} WHERE id = ?", params)
    
    return await get_dispute(dispute_id, current_user)


@router.post("/disputes/{dispute_id}/assign", response_model=DisputeSchema)
async def assign_dispute(
    dispute_id: int,
    admin_id: int,
    current_user: User = Depends(get_current_active_user)
):
    """Assign a dispute to an admin. Admin-only endpoint."""
    user_type = getattr(current_user, 'user_type', None)
    if hasattr(user_type, 'value'):
        user_type = user_type.value
    user_type = str(user_type).lower() if user_type else 'client'
    
    if user_type != "admin":
        raise HTTPException(status_code=403, detail="Only admins can assign disputes")
    
    # Verify dispute exists
    result = execute_query("SELECT id FROM disputes WHERE id = ?", [dispute_id])
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Dispute not found")
    
    # Verify admin user
    admin_result = execute_query("SELECT id, user_type FROM users WHERE id = ?", [admin_id])
    if not admin_result or not admin_result.get("rows"):
        raise HTTPException(status_code=404, detail="Admin user not found")
    
    admin_type = to_str(admin_result["rows"][0][1])
    if admin_type and admin_type.lower() != "admin":
        raise HTTPException(status_code=400, detail="Can only assign to admin users")
    
    # Assign
    now = datetime.utcnow().isoformat()
    execute_query("""
        UPDATE disputes SET assigned_to_id = ?, status = 'in_progress', updated_at = ? WHERE id = ?
    """, [admin_id, now, dispute_id])
    
    # Notify assigned admin
    _send_notification_turso(
        user_id=admin_id,
        notification_type="admin_action",
        title="Dispute Assigned to You",
        content=f"You have been assigned dispute #{dispute_id}",
        data={"dispute_id": dispute_id},
        priority="high",
        action_url=f"/admin/disputes/{dispute_id}"
    )
    
    return await get_dispute(dispute_id, current_user)


@router.post("/disputes/{dispute_id}/resolve", response_model=DisputeSchema)
async def resolve_dispute(
    dispute_id: int,
    resolution: str,
    contract_status: Optional[str] = Query(None, description="New status for the contract (e.g., active, terminated, completed)"),
    current_user: User = Depends(get_current_active_user)
):
    """Resolve a dispute. Admin-only endpoint."""
    user_type = getattr(current_user, 'user_type', None)
    if hasattr(user_type, 'value'):
        user_type = user_type.value
    user_type = str(user_type).lower() if user_type else 'client'
    
    if user_type != "admin":
        raise HTTPException(status_code=403, detail="Only admins can resolve disputes")
    
    # Get dispute
    result = execute_query("SELECT id, contract_id FROM disputes WHERE id = ?", [dispute_id])
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Dispute not found")
    
    contract_id = int(result["rows"][0][1].get("value"))
    
    # Resolve
    now = datetime.utcnow().isoformat()
    execute_query("""
        UPDATE disputes SET status = 'resolved', resolution = ?, updated_at = ? WHERE id = ?
    """, [resolution, now, dispute_id])
    
    # Update contract status if provided
    if contract_status:
        # Validate status
        valid_statuses = ["pending", "active", "completed", "cancelled", "disputed", "terminated", "refunded"]
        if contract_status not in valid_statuses:
             raise HTTPException(status_code=400, detail=f"Invalid contract status. Must be one of: {', '.join(valid_statuses)}")
        
        execute_query("UPDATE contracts SET status = ?, updated_at = ? WHERE id = ?", [contract_status, now, contract_id])
    
    # Get contract parties for notification
    contract_result = execute_query("SELECT client_id, freelancer_id FROM contracts WHERE id = ?", [contract_id])
    if contract_result and contract_result.get("rows"):
        contract_row = contract_result["rows"][0]
        client_id = int(contract_row[0].get("value"))
        freelancer_id = int(contract_row[1].get("value"))
        
        for party_id in [client_id, freelancer_id]:
            _send_notification_turso(
                user_id=party_id,
                notification_type="dispute",
                title="Dispute Resolved",
                content=f"Dispute #{dispute_id} has been resolved",
                data={"dispute_id": dispute_id, "resolution": resolution},
                priority="high",
                action_url=f"/disputes/{dispute_id}"
            )
    
    return await get_dispute(dispute_id, current_user)


@router.post("/disputes/{dispute_id}/evidence", response_model=DisputeSchema)
async def upload_evidence(
    dispute_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user)
):
    """Upload evidence for a dispute. Only contract parties and admins can upload."""
    # Get dispute
    result = execute_query("SELECT id, contract_id, evidence FROM disputes WHERE id = ?", [dispute_id])
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Dispute not found")
    
    row = result["rows"][0]
    contract_id = int(row[1].get("value"))
    current_evidence_json = to_str(row[2])
    
    # Check permissions
    user_type = getattr(current_user, 'user_type', None)
    if hasattr(user_type, 'value'):
        user_type = user_type.value
    user_type = str(user_type).lower() if user_type else 'client'
    
    if user_type != "admin":
        contract_result = execute_query("SELECT client_id, freelancer_id FROM contracts WHERE id = ?", [contract_id])
        if not contract_result or not contract_result.get("rows"):
            raise HTTPException(status_code=404, detail="Contract not found")
        
        contract_row = contract_result["rows"][0]
        client_id = int(contract_row[0].get("value"))
        freelancer_id = int(contract_row[1].get("value"))
        
        if current_user.id not in [client_id, freelancer_id]:
            raise HTTPException(status_code=403, detail="You don't have permission to upload evidence for this dispute")

    # Save file
    file_content = await file.read()
    file_url = save_file(file_content, f"disputes/{dispute_id}/{file.filename}")
    
    # Update evidence list
    evidence_list = []
    if current_evidence_json:
        try:
            evidence_list = json.loads(current_evidence_json)
            if not isinstance(evidence_list, list):
                evidence_list = []
        except json.JSONDecodeError:
            evidence_list = []
            
    evidence_list.append(file_url)
    new_evidence_json = json.dumps(evidence_list)
    
    now = datetime.utcnow().isoformat()
    execute_query("UPDATE disputes SET evidence = ?, updated_at = ? WHERE id = ?", 
                  [new_evidence_json, now, dispute_id])
    
    return await get_dispute(dispute_id, current_user)

