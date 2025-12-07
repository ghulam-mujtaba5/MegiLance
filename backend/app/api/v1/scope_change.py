from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Any
from app.db.session import get_db
from app.services.scope_change_service import ScopeChangeService
from app.schemas.scope_change import ScopeChangeCreate, ScopeChangeResponse, ScopeChangeStatus
from app.core.security import get_current_user
# from app.models.user import User

router = APIRouter()

@router.post("/", response_model=ScopeChangeResponse, status_code=status.HTTP_201_CREATED)
def create_scope_change_request(
    request: ScopeChangeCreate,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user)
):
    """
    Create a new scope change request for a contract.
    """
    return ScopeChangeService.create_request(db, request, current_user.id)

@router.get("/{request_id}", response_model=ScopeChangeResponse)
def get_scope_change_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user)
):
    """
    Get details of a specific scope change request.
    """
    request = ScopeChangeService.get_request(db, request_id)
    # Check if user is part of the contract
    contract = request.contract
    if contract.client_id != current_user.id and contract.freelancer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this request")
    return request

@router.get("/contract/{contract_id}", response_model=List[ScopeChangeResponse])
def get_contract_scope_changes(
    contract_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user)
):
    """
    List all scope change requests for a specific contract.
    """
    # Verify access to contract (could be moved to service but good here for early exit)
    # For now, service will return list, but we should check auth.
    # Assuming service doesn't check auth for list, we rely on the fact that if they can't see the contract, they shouldn't see changes.
    # Ideally we fetch contract first to check auth.
    from app.models.contract import Contract
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    if contract.client_id != current_user.id and contract.freelancer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    return ScopeChangeService.get_by_contract(db, contract_id, skip, limit)

@router.post("/{request_id}/approve", response_model=ScopeChangeResponse)
def approve_scope_change(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user)
):
    """
    Approve a scope change request. Must be done by the other party.
    """
    return ScopeChangeService.update_status(db, request_id, ScopeChangeStatus.APPROVED, current_user.id)

@router.post("/{request_id}/reject", response_model=ScopeChangeResponse)
def reject_scope_change(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user)
):
    """
    Reject a scope change request.
    """
    return ScopeChangeService.update_status(db, request_id, ScopeChangeStatus.REJECTED, current_user.id)

@router.post("/{request_id}/cancel", response_model=ScopeChangeResponse)
def cancel_scope_change(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user)
):
    """
    Cancel a scope change request. Must be done by the requester.
    """
    return ScopeChangeService.update_status(db, request_id, ScopeChangeStatus.CANCELLED, current_user.id)
