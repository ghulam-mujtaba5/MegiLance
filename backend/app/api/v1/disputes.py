"""
@AI-HINT: Dispute Management API - Turso HTTP only (NO SQLite fallback)
Handles dispute creation, listing, admin assignment, and resolution.
"""
from typing import List, Optional
import json
from fastapi import APIRouter, Depends, HTTPException, Query, status, UploadFile, File

from app.core.security import get_current_active_user
from app.core.storage import save_file
from app.models import User
from app.schemas.dispute import (
    Dispute as DisputeSchema,
    DisputeCreate,
    DisputeUpdate,
    DisputeList
)
from app.services import disputes_service

router = APIRouter()


@router.post("/disputes", response_model=DisputeSchema, status_code=status.HTTP_201_CREATED)
async def create_dispute(
    dispute_data: DisputeCreate,
    current_user: User = Depends(get_current_active_user)
):
    """Create a new dispute. Only contract parties can raise disputes."""
    contract = disputes_service.get_contract_parties(dispute_data.contract_id)
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")

    client_id = contract["client_id"]
    freelancer_id = contract["freelancer_id"]

    if current_user.id not in [client_id, freelancer_id]:
        raise HTTPException(status_code=403, detail="Only contract parties can raise disputes")

    dispute_type = dispute_data.dispute_type.value if hasattr(dispute_data.dispute_type, 'value') else dispute_data.dispute_type

    dispute = disputes_service.create_dispute(
        dispute_data.contract_id, current_user.id, dispute_type, dispute_data.description
    )
    if not dispute:
        raise HTTPException(status_code=500, detail="Failed to retrieve created dispute")

    # Notify other party
    other_party_id = freelancer_id if current_user.id == client_id else client_id
    disputes_service.send_notification(
        user_id=other_party_id,
        notification_type="dispute",
        title="New Dispute Raised",
        content=f"A dispute has been raised on contract #{dispute_data.contract_id}",
        data={"dispute_id": dispute["id"], "contract_id": dispute_data.contract_id},
        priority="high",
        action_url=f"/disputes/{dispute['id']}"
    )

    # Notify admins
    for admin_id in disputes_service.get_admin_user_ids():
        disputes_service.send_notification(
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

    data = disputes_service.list_disputes(
        user_type, current_user.id, contract_id, status_filter,
        dispute_type, raised_by_me, skip, limit
    )
    return DisputeList(total=data["total"], disputes=data["disputes"])


@router.get("/disputes/{dispute_id}", response_model=DisputeSchema)
async def get_dispute(
    dispute_id: int,
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific dispute. Only viewable by contract parties and admins."""
    dispute = disputes_service.get_dispute_by_id(dispute_id)
    if not dispute:
        raise HTTPException(status_code=404, detail="Dispute not found")

    user_type = getattr(current_user, 'user_type', None)
    if hasattr(user_type, 'value'):
        user_type = user_type.value
    user_type = str(user_type).lower() if user_type else 'client'

    if user_type != "admin":
        contract = disputes_service.get_contract_client_freelancer(dispute["contract_id"])
        if contract:
            if current_user.id not in [contract["client_id"], contract["freelancer_id"]]:
                raise HTTPException(status_code=403, detail="You don't have permission to view this dispute")

    return dispute


@router.patch("/disputes/{dispute_id}", response_model=DisputeSchema)
async def update_dispute(
    dispute_id: int,
    dispute_data: DisputeUpdate,
    current_user: User = Depends(get_current_active_user)
):
    """Update a dispute. Regular users can only update description, admins can update everything."""
    dispute_core = disputes_service.get_dispute_contract_id(dispute_id)
    if not dispute_core:
        raise HTTPException(status_code=404, detail="Dispute not found")

    contract_id = dispute_core["contract_id"]
    current_status = dispute_core["status"]

    contract = disputes_service.get_contract_client_freelancer(contract_id)
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")

    client_id = contract["client_id"]
    freelancer_id = contract["freelancer_id"]

    user_type = getattr(current_user, 'user_type', None)
    if hasattr(user_type, 'value'):
        user_type = user_type.value
    user_type = str(user_type).lower() if user_type else 'client'

    update_dict = dispute_data.model_dump(exclude_unset=True)

    if user_type == "admin":
        if "status" in update_dict and update_dict["status"] != current_status:
            new_status = update_dict["status"]
            if hasattr(new_status, 'value'):
                new_status = new_status.value
            for party_id in [client_id, freelancer_id]:
                disputes_service.send_notification(
                    user_id=party_id,
                    notification_type="dispute",
                    title="Dispute Status Updated",
                    content=f"Dispute #{dispute_id} status changed to {new_status}",
                    data={"dispute_id": dispute_id, "new_status": new_status},
                    priority="high",
                    action_url=f"/disputes/{dispute_id}"
                )
    elif current_user.id in [client_id, freelancer_id]:
        if set(update_dict.keys()) - {"description"}:
            raise HTTPException(status_code=403, detail="You can only update the description")
        if "description" not in update_dict:
            update_dict = {}
    else:
        raise HTTPException(status_code=403, detail="You don't have permission to update this dispute")

    if update_dict:
        disputes_service.update_dispute(dispute_id, update_dict)

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

    if not disputes_service.dispute_exists(dispute_id):
        raise HTTPException(status_code=404, detail="Dispute not found")

    admin_type = disputes_service.get_user_type(admin_id)
    if admin_type is None:
        raise HTTPException(status_code=404, detail="Admin user not found")
    if admin_type.lower() != "admin":
        raise HTTPException(status_code=400, detail="Can only assign to admin users")

    disputes_service.assign_dispute(dispute_id, admin_id)

    disputes_service.send_notification(
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

    dispute_core = disputes_service.get_dispute_contract_id(dispute_id)
    if not dispute_core:
        raise HTTPException(status_code=404, detail="Dispute not found")

    contract_id = dispute_core["contract_id"]

    disputes_service.resolve_dispute(dispute_id, resolution)

    if contract_status:
        valid_statuses = ["pending", "active", "completed", "cancelled", "disputed", "terminated", "refunded"]
        if contract_status not in valid_statuses:
            raise HTTPException(status_code=400, detail=f"Invalid contract status. Must be one of: {', '.join(valid_statuses)}")
        disputes_service.update_contract_status(contract_id, contract_status)

    contract = disputes_service.get_contract_client_freelancer(contract_id)
    if contract:
        for party_id in [contract["client_id"], contract["freelancer_id"]]:
            disputes_service.send_notification(
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
    evidence_data = disputes_service.get_dispute_evidence(dispute_id)
    if not evidence_data:
        raise HTTPException(status_code=404, detail="Dispute not found")

    contract_id = evidence_data["contract_id"]
    current_evidence_json = evidence_data["evidence_json"]

    user_type = getattr(current_user, 'user_type', None)
    if hasattr(user_type, 'value'):
        user_type = user_type.value
    user_type = str(user_type).lower() if user_type else 'client'

    if user_type != "admin":
        contract = disputes_service.get_contract_client_freelancer(contract_id)
        if not contract:
            raise HTTPException(status_code=404, detail="Contract not found")
        if current_user.id not in [contract["client_id"], contract["freelancer_id"]]:
            raise HTTPException(status_code=403, detail="You don't have permission to upload evidence for this dispute")

    file_content = await file.read()
    file_url = save_file(file_content, f"disputes/{dispute_id}/{file.filename}")

    evidence_list = []
    if current_evidence_json:
        try:
            evidence_list = json.loads(current_evidence_json)
            if not isinstance(evidence_list, list):
                evidence_list = []
        except json.JSONDecodeError:
            evidence_list = []

    evidence_list.append(file_url)
    disputes_service.update_dispute_evidence(dispute_id, json.dumps(evidence_list))

    return await get_dispute(dispute_id, current_user)

