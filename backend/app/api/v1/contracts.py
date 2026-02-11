# @AI-HINT: Contracts API - CRUD operations for contracts between clients and freelancers
# Uses Turso HTTP API directly - NO SQLite fallback

from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List, Optional
from datetime import datetime, timezone
import uuid
import re
import logging

from app.core.security import get_current_active_user
from app.services import contracts_service
from app.models.user import User
from app.schemas.contract import ContractCreate, ContractRead, ContractUpdate
from app.api.v1.utils import sanitize_text, SCRIPT_PATTERN, HTML_PATTERN
from pydantic import BaseModel, Field, field_validator

router = APIRouter()
logger = logging.getLogger(__name__)

# Validation constants
MAX_TITLE_LENGTH = 200
MAX_DESCRIPTION_LENGTH = 10000
MAX_MILESTONES_LENGTH = 5000
MAX_TERMS_LENGTH = 10000
MIN_RATE = 0.01
MAX_RATE = 1000000  # $1M max rate
VALID_RATE_TYPES = {"hourly", "fixed", "monthly", "weekly"}
VALID_CONTRACT_STATUSES = {"pending", "active", "completed", "cancelled", "disputed"}


def validate_rate(rate: float, rate_type: str) -> None:
    """Validate rate value and type"""
    if rate < MIN_RATE or rate > MAX_RATE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Rate must be between {MIN_RATE} and {MAX_RATE}"
        )
    if rate_type.lower() not in VALID_RATE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Rate type must be one of: {', '.join(VALID_RATE_TYPES)}"
        )


class DirectHireRequest(BaseModel):
    freelancer_id: int = Field(..., gt=0)
    title: str = Field(..., min_length=3, max_length=MAX_TITLE_LENGTH)
    description: str = Field(..., min_length=10, max_length=MAX_DESCRIPTION_LENGTH)
    rate_type: str = Field(..., pattern=r'^(hourly|fixed|monthly|weekly|Hourly|Fixed|Monthly|Weekly)$')
    rate: float = Field(..., gt=0, le=MAX_RATE)
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    
    @field_validator('title', 'description')
    @classmethod
    def sanitize_fields(cls, v: str) -> str:
        if SCRIPT_PATTERN.search(v):
            raise ValueError("Invalid characters in input")
        return v.strip()
    
    @field_validator('end_date')
    @classmethod
    def validate_end_date(cls, v: Optional[datetime], info) -> Optional[datetime]:
        if v and info.data.get('start_date') and v < info.data['start_date']:
            raise ValueError("End date must be after start date")
        return v


@router.get("/", response_model=List[ContractRead])
def list_contracts(
    skip: int = Query(0, ge=0, le=10000),
    limit: int = Query(100, ge=1, le=100),
    status: Optional[str] = Query(None, pattern=r'^(pending|active|completed|cancelled|disputed)$'),
    current_user: User = Depends(get_current_active_user)
):
    """List contracts for current user"""
    if status:
        if status.lower() not in VALID_CONTRACT_STATUSES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status. Must be one of: {', '.join(VALID_CONTRACT_STATUSES)}"
            )
    
    return contracts_service.query_user_contracts(current_user.id, status, limit, skip)


@router.get("/{contract_id}", response_model=ContractRead)
def get_contract(
    contract_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific contract"""
    # Validate contract_id format (UUID)
    try:
        uuid.UUID(contract_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid contract ID format"
        )
    
    raw_row = contracts_service.fetch_contract_with_joins(contract_id)
    
    if not raw_row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contract not found")
    
    client_id, freelancer_id = contracts_service.get_contract_parties(raw_row)
    
    # Check authorization
    if client_id != current_user.id and freelancer_id != current_user.id:
        logger.warning(f"Unauthorized access attempt to contract {contract_id} by user {current_user.id}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this contract"
        )
    
    return contracts_service.contract_from_row(raw_row)


@router.post("/direct", response_model=ContractRead, status_code=status.HTTP_201_CREATED)
def create_direct_contract(
    hire_data: DirectHireRequest,
    current_user: User = Depends(get_current_active_user)
):
    """Create a direct hire contract (creates project -> proposal -> contract)"""
    user_type = contracts_service._safe_str(current_user.user_type)
    if not user_type or user_type.lower() != "client":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only clients can create contracts"
        )
    
    # Prevent self-hiring
    if hire_data.freelancer_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot hire yourself"
        )
    
    # Validate rate
    validate_rate(hire_data.rate, hire_data.rate_type)
    
    # Check if freelancer exists
    freelancer_data = contracts_service.fetch_user_for_contract(hire_data.freelancer_id)
    
    if not freelancer_data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Freelancer not found")
    
    if not freelancer_data["user_type"] or freelancer_data["user_type"].lower() != "freelancer":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not a freelancer"
        )
    
    if not freelancer_data["is_active"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Freelancer account is not active"
        )
    
    # Sanitize inputs
    title = sanitize_text(hire_data.title, MAX_TITLE_LENGTH)
    description = sanitize_text(hire_data.description, MAX_DESCRIPTION_LENGTH)
    
    now = datetime.now(timezone.utc).isoformat()
    
    try:
        # 1. Create Project
        project_id = contracts_service.insert_project(
            title, description, current_user.id, hire_data.rate,
            hire_data.rate_type.lower(), now
        )
        
        if not project_id:
            raise HTTPException(status_code=500, detail="Failed to create project")
        
        # 2. Create Proposal (Accepted)
        proposal_ok = contracts_service.insert_proposal(
            project_id, hire_data.freelancer_id, hire_data.rate,
            hire_data.rate_type.lower(), now
        )
        
        if not proposal_ok:
            raise HTTPException(status_code=500, detail="Failed to create proposal")
            
        # 3. Create Contract
        
        # Determine contract type and fields
        contract_type = "fixed"
        hourly_rate = None
        retainer_amount = None
        retainer_frequency = None
        
        rt = hire_data.rate_type.lower()
        if rt == "hourly":
            contract_type = "hourly"
            hourly_rate = hire_data.rate
        elif rt in ["monthly", "weekly"]:
            contract_type = "retainer"
            retainer_amount = hire_data.rate
            retainer_frequency = rt
        
        contract_id = contracts_service.insert_contract([
                project_id,
                hire_data.freelancer_id,
                current_user.id,
                hire_data.rate,
                contract_type,
                "USD",
                hourly_rate,
                retainer_amount,
                retainer_frequency,
                hire_data.rate,  # contract_amount
                hire_data.rate * 0.1,  # platform_fee 10%
                "active",
                hire_data.start_date.isoformat() if hire_data.start_date else now,
                hire_data.end_date.isoformat() if hire_data.end_date else None,
                description,
                now,
                now
            ])
        
        if not contract_id:
            raise HTTPException(status_code=500, detail="Failed to create contract")
        
        logger.info(f"Direct contract {contract_id} created by client {current_user.id} for freelancer {hire_data.freelancer_id}")
            
        return {
            "id": contract_id,
            "project_id": project_id,
            "freelancer_id": hire_data.freelancer_id,
            "client_id": current_user.id,
            "amount": hire_data.rate,
            "contract_amount": hire_data.rate,
            "contract_type": contract_type,
            "currency": "USD",
            "hourly_rate": hourly_rate,
            "retainer_amount": retainer_amount,
            "retainer_frequency": retainer_frequency,
            "status": "active",
            "start_date": hire_data.start_date,
            "end_date": hire_data.end_date,
            "description": description,
            "created_at": now,
            "updated_at": now,
            "job_title": title,
            "client_name": getattr(current_user, 'name', None)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create direct contract: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create contract"
        )


@router.post("/", response_model=ContractRead, status_code=status.HTTP_201_CREATED)
def create_contract(
    contract: ContractCreate,
    current_user: User = Depends(get_current_active_user)
):
    """Create a new contract"""
    user_type = contracts_service._safe_str(current_user.user_type)
    if not user_type or user_type.lower() != "client":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only clients can create contracts"
        )
    
    # Prevent self-contracting
    if contract.freelancer_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot create contract with yourself"
        )
    
    # Validate amount
    if contract.amount < MIN_RATE or contract.amount > MAX_RATE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Amount must be between {MIN_RATE} and {MAX_RATE}"
        )
    
    # Check if project exists and belongs to client
    project_data = contracts_service.fetch_project_for_contract(contract.project_id)
    
    if not project_data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    
    if project_data["client_id"] != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create contract for this project"
        )
    
    project_title = project_data["title"]
    
    # Check if freelancer exists and is active
    freelancer_data = contracts_service.fetch_user_for_contract(contract.freelancer_id)
    
    if not freelancer_data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Freelancer not found")
    
    if not freelancer_data["user_type"] or freelancer_data["user_type"].lower() != "freelancer":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not a freelancer"
        )
    
    if not freelancer_data["is_active"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Freelancer account is not active"
        )
    
    # Check if proposal exists and is accepted
    proposal_status = contracts_service.fetch_proposal_status(contract.project_id, contract.freelancer_id)
    
    if proposal_status is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proposal not found")
    
    if proposal_status != "accepted":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Proposal is not accepted"
        )
    
    # Check for existing active contract
    if contracts_service.has_active_contract(contract.project_id, contract.freelancer_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An active contract already exists for this project and freelancer"
        )
    
    # Sanitize text inputs
    description = sanitize_text(contract.description, MAX_DESCRIPTION_LENGTH) if contract.description else ""
    milestones = sanitize_text(contract.milestones, MAX_MILESTONES_LENGTH) if contract.milestones else ""
    terms = sanitize_text(contract.terms, MAX_TERMS_LENGTH) if contract.terms else ""
    
    # Generate contract ID
    contract_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    try:
        insert_ok = contracts_service.insert_contract_full([
                contract.project_id,
                contract.freelancer_id,
                current_user.id,
                contract.amount,
                contract.contract_type.value,
                contract.currency,
                contract.hourly_rate,
                contract.retainer_amount,
                contract.retainer_frequency,
                contract.amount,  # contract_amount
                contract.amount * 0.1,  # platform_fee 10%
                "active",
                contract.start_date.isoformat() if contract.start_date else now,
                contract.end_date.isoformat() if contract.end_date else None,
                description,
                milestones,
                terms,
                now,
                now
            ])
        
        if not insert_ok:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create contract"
            )
        
        logger.info(f"Contract {contract_id} created by client {current_user.id} for project {contract.project_id}")
        
        # Return created contract
        return {
            "id": contract_id,
            "project_id": contract.project_id,
            "freelancer_id": contract.freelancer_id,
            "client_id": current_user.id,
            "amount": contract.amount,
            "contract_amount": contract.amount,
            "contract_type": contract.contract_type,
            "currency": contract.currency,
            "hourly_rate": contract.hourly_rate,
            "retainer_amount": contract.retainer_amount,
            "retainer_frequency": contract.retainer_frequency,
            "status": "active",
            "start_date": contract.start_date,
            "end_date": contract.end_date,
            "description": description,
            "milestones": milestones,
            "terms": terms,
            "created_at": now,
            "updated_at": now,
            "job_title": project_title,
            "client_name": getattr(current_user, 'name', None)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create contract: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create contract"
        )


@router.put("/{contract_id}", response_model=ContractRead)
def update_contract(
    contract_id: str,
    contract: ContractUpdate,
    current_user: User = Depends(get_current_active_user)
):
    """Update a contract"""
    # Validate contract_id format (UUID)
    try:
        uuid.UUID(contract_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid contract ID format"
        )
    
    # Get existing contract
    existing = contracts_service.fetch_contract_for_update(contract_id)
    
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contract not found")
    
    client_id = existing["client_id"]
    freelancer_id = existing["freelancer_id"]
    current_status = existing["status"]
    
    # Check authorization
    if client_id != current_user.id and freelancer_id != current_user.id:
        logger.warning(f"Unauthorized update attempt on contract {contract_id} by user {current_user.id}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this contract"
        )
    
    # Check if contract can be updated (not completed or cancelled)
    if current_status in ('completed', 'cancelled'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot update a {current_status} contract"
        )
    
    update_data = contract.model_dump(exclude_unset=True, exclude_none=True)
    
    if not update_data:
        # Just return existing with joins
        return get_contract(contract_id, current_user)
    
    # Validate status change if included
    if 'status' in update_data:
        new_status = update_data['status'].lower()
        if new_status not in VALID_CONTRACT_STATUSES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status. Must be one of: {', '.join(VALID_CONTRACT_STATUSES)}"
            )
        update_data['status'] = new_status
    
    # Validate amount if included
    if 'amount' in update_data:
        if update_data['amount'] < MIN_RATE or update_data['amount'] > MAX_RATE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Amount must be between {MIN_RATE} and {MAX_RATE}"
            )
    
    # Build update query
    set_parts = []
    values = []
    for key, value in update_data.items():
        if key == "amount":
            key = "total_amount"
        # Sanitize text fields
        if key in ('description', 'milestones', 'terms') and value:
            max_len = MAX_DESCRIPTION_LENGTH if key == 'description' else (MAX_MILESTONES_LENGTH if key == 'milestones' else MAX_TERMS_LENGTH)
            value = sanitize_text(value, max_len)
        set_parts.append(f"{key} = ?")
        if isinstance(value, datetime):
            values.append(value.isoformat())
        else:
            values.append(value if value is not None else "")
    
    set_parts.append("updated_at = ?")
    values.append(datetime.now(timezone.utc).isoformat())
    values.append(contract_id)
    
    try:
        contracts_service.update_contract_fields(contract_id, set_parts, values)
        logger.info(f"Contract {contract_id} updated by user {current_user.id}")
    except Exception as e:
        logger.error(f"Failed to update contract {contract_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update contract"
        )
    
    # Fetch updated contract with joins
    return get_contract(contract_id, current_user)


@router.delete("/{contract_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_contract(
    contract_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Delete a contract (soft delete by setting status to cancelled)"""
    # Validate contract_id format (UUID)
    try:
        uuid.UUID(contract_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid contract ID format"
        )
    
    # Get contract
    contract_data = contracts_service.fetch_contract_status(contract_id)
    
    if not contract_data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contract not found")
    
    client_id = contract_data["client_id"]
    current_status = contract_data["status"]
    
    # Only client can delete
    if client_id != current_user.id:
        logger.warning(f"Unauthorized delete attempt on contract {contract_id} by user {current_user.id}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this contract"
        )
    
    # Check if already completed/cancelled
    if current_status in ('completed', 'cancelled'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete a {current_status} contract"
        )
    
    # Soft delete - set status to cancelled
    try:
        contracts_service.cancel_contract(contract_id, datetime.now(timezone.utc).isoformat())
        logger.info(f"Contract {contract_id} cancelled by client {current_user.id}")
    except Exception as e:
        logger.error(f"Failed to cancel contract {contract_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to cancel contract"
        )
    
    return
