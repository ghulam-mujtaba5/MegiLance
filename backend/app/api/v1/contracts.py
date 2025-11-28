# @AI-HINT: Contracts API - CRUD operations for contracts between clients and freelancers
# Uses Turso HTTP API directly - NO SQLite fallback

from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List, Optional
from datetime import datetime
import uuid
import re
import logging

from app.core.security import get_current_active_user
from app.db.turso_http import execute_query, to_str, parse_date
from app.models.user import User
from app.schemas.contract import ContractCreate, ContractRead, ContractUpdate
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

# Regex for HTML/script injection detection
HTML_PATTERN = re.compile(r'<[^>]+>', re.IGNORECASE)
SCRIPT_PATTERN = re.compile(r'(javascript:|on\w+=|<script)', re.IGNORECASE)


def sanitize_text(text: Optional[str], max_length: int = 1000) -> Optional[str]:
    """Sanitize text input to prevent XSS and limit length"""
    if text is None:
        return None
    text = text.strip()
    if len(text) > max_length:
        text = text[:max_length]
    # Remove potential script injections
    text = SCRIPT_PATTERN.sub('', text)
    return text


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


def _get_val(row: list, idx: int):
    """Extract value from Turso row"""
    if idx >= len(row):
        return None
    cell = row[idx]
    if cell.get("type") == "null":
        return None
    return cell.get("value")


def _safe_str(val):
    """Convert bytes to string if needed"""
    if val is None:
        return None
    if isinstance(val, bytes):
        return val.decode('utf-8')
    return str(val) if val else None


def _contract_from_row(row: list) -> dict:
    """Convert Turso row to contract dict"""
    return {
        "id": _safe_str(_get_val(row, 0)),
        "project_id": int(_get_val(row, 1) or 0),
        "freelancer_id": int(_get_val(row, 2) or 0),
        "client_id": int(_get_val(row, 3) or 0),
        "amount": float(_get_val(row, 4) or 0),
        "contract_amount": float(_get_val(row, 4) or 0),
        "status": _safe_str(_get_val(row, 5)),
        "start_date": parse_date(_get_val(row, 6)),
        "end_date": parse_date(_get_val(row, 7)),
        "description": _safe_str(_get_val(row, 8)),
        "milestones": _safe_str(_get_val(row, 9)),
        "terms": _safe_str(_get_val(row, 10)),
        "created_at": parse_date(_get_val(row, 11)),
        "updated_at": parse_date(_get_val(row, 12)),
        "job_title": _safe_str(_get_val(row, 13)),
        "client_name": _safe_str(_get_val(row, 14))
    }


@router.get("/", response_model=List[ContractRead])
def list_contracts(
    skip: int = Query(0, ge=0, le=10000),
    limit: int = Query(100, ge=1, le=100),
    status: Optional[str] = Query(None, pattern=r'^(pending|active|completed|cancelled|disputed)$'),
    current_user: User = Depends(get_current_active_user)
):
    """List contracts for current user"""
    where_sql = "WHERE (c.client_id = ? OR c.freelancer_id = ?)"
    params = [current_user.id, current_user.id]
    
    if status:
        if status.lower() not in VALID_CONTRACT_STATUSES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status. Must be one of: {', '.join(VALID_CONTRACT_STATUSES)}"
            )
        where_sql += " AND c.status = ?"
        params.append(status.lower())
    
    params.extend([limit, skip])
    
    query = f"""
        SELECT 
            c.id, c.project_id, c.freelancer_id, c.client_id, c.total_amount, c.status,
            c.start_date, c.end_date, c.description, c.milestones, c.terms, c.created_at, c.updated_at,
            p.title as job_title,
            u.full_name as client_name
        FROM contracts c
        LEFT JOIN projects p ON c.project_id = p.id
        LEFT JOIN users u ON c.client_id = u.id
        {where_sql}
        ORDER BY c.created_at DESC
        LIMIT ? OFFSET ?
    """
    
    result = execute_query(query, params)
    
    contracts = []
    if result and result.get("rows"):
        for row in result["rows"]:
            contracts.append(_contract_from_row(row))
    
    return contracts


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
    
    query = """
        SELECT 
            c.id, c.project_id, c.freelancer_id, c.client_id, c.total_amount, c.status,
            c.start_date, c.end_date, c.description, c.milestones, c.terms, c.created_at, c.updated_at,
            p.title as job_title,
            u.full_name as client_name
        FROM contracts c
        LEFT JOIN projects p ON c.project_id = p.id
        LEFT JOIN users u ON c.client_id = u.id
        WHERE c.id = ?
    """
    
    result = execute_query(query, [contract_id])
    
    if not result or not result.get("rows"):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contract not found")
    
    row = result["rows"][0]
    client_id = int(_get_val(row, 3) or 0)
    freelancer_id = int(_get_val(row, 2) or 0)
    
    # Check authorization
    if client_id != current_user.id and freelancer_id != current_user.id:
        logger.warning(f"Unauthorized access attempt to contract {contract_id} by user {current_user.id}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this contract"
        )
    
    return _contract_from_row(row)


@router.post("/direct", response_model=ContractRead, status_code=status.HTTP_201_CREATED)
def create_direct_contract(
    hire_data: DirectHireRequest,
    current_user: User = Depends(get_current_active_user)
):
    """Create a direct hire contract (creates project -> proposal -> contract)"""
    user_type = _safe_str(current_user.user_type)
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
    result = execute_query(
        "SELECT id, user_type, is_active FROM users WHERE id = ?",
        [hire_data.freelancer_id]
    )
    
    if not result or not result.get("rows"):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Freelancer not found")
    
    freelancer_row = result["rows"][0]
    freelancer_type = _safe_str(_get_val(freelancer_row, 1))
    is_active = _get_val(freelancer_row, 2)
    
    if not freelancer_type or freelancer_type.lower() != "freelancer":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not a freelancer"
        )
    
    if not is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Freelancer account is not active"
        )
    
    # Sanitize inputs
    title = sanitize_text(hire_data.title, MAX_TITLE_LENGTH)
    description = sanitize_text(hire_data.description, MAX_DESCRIPTION_LENGTH)
    
    now = datetime.utcnow().isoformat()
    
    try:
        # 1. Create Project
        project_result = execute_query(
            """INSERT INTO projects (title, description, client_id, budget_min, budget_max, 
               budget_type, status, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            [
                title,
                description,
                current_user.id,
                hire_data.rate,
                hire_data.rate,
                hire_data.rate_type.lower(),
                "in_progress",
                now,
                now
            ]
        )
        
        if not project_result:
            raise HTTPException(status_code=500, detail="Failed to create project")
            
        project_id = project_result.get("last_insert_rowid")
        
        # 2. Create Proposal (Accepted)
        proposal_result = execute_query(
            """INSERT INTO proposals (project_id, freelancer_id, cover_letter, estimated_hours, 
               hourly_rate, status, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            [
                project_id,
                hire_data.freelancer_id,
                "Direct Hire",
                0,
                hire_data.rate if hire_data.rate_type.lower() == 'hourly' else 0,
                "accepted",
                now,
                now
            ]
        )
        
        if not proposal_result:
            raise HTTPException(status_code=500, detail="Failed to create proposal")
            
        # 3. Create Contract
        contract_id = str(uuid.uuid4())
        
        insert_result = execute_query(
            """INSERT INTO contracts (id, project_id, freelancer_id, client_id, total_amount, 
               status, start_date, end_date, description, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            [
                contract_id,
                project_id,
                hire_data.freelancer_id,
                current_user.id,
                hire_data.rate,
                "active",
                hire_data.start_date.isoformat() if hire_data.start_date else now,
                hire_data.end_date.isoformat() if hire_data.end_date else None,
                description,
                now,
                now
            ]
        )
        
        if not insert_result:
            raise HTTPException(status_code=500, detail="Failed to create contract")
        
        logger.info(f"Direct contract {contract_id} created by client {current_user.id} for freelancer {hire_data.freelancer_id}")
            
        return {
            "id": contract_id,
            "project_id": project_id,
            "freelancer_id": hire_data.freelancer_id,
            "client_id": current_user.id,
            "amount": hire_data.rate,
            "contract_amount": hire_data.rate,
            "status": "active",
            "start_date": hire_data.start_date,
            "end_date": hire_data.end_date,
            "description": description,
            "created_at": now,
            "updated_at": now,
            "job_title": title,
            "client_name": current_user.full_name
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
    user_type = _safe_str(current_user.user_type)
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
    result = execute_query(
        "SELECT id, client_id, title FROM projects WHERE id = ?",
        [contract.project_id]
    )
    
    if not result or not result.get("rows"):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    
    project_row = result["rows"][0]
    project_client_id = int(_get_val(project_row, 1) or 0)
    project_title = _safe_str(_get_val(project_row, 2))
    
    if project_client_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create contract for this project"
        )
    
    # Check if freelancer exists and is active
    result = execute_query(
        "SELECT id, user_type, is_active FROM users WHERE id = ?",
        [contract.freelancer_id]
    )
    
    if not result or not result.get("rows"):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Freelancer not found")
    
    freelancer_row = result["rows"][0]
    freelancer_type = _safe_str(_get_val(freelancer_row, 1))
    is_active = _get_val(freelancer_row, 2)
    
    if not freelancer_type or freelancer_type.lower() != "freelancer":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not a freelancer"
        )
    
    if not is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Freelancer account is not active"
        )
    
    # Check if proposal exists and is accepted
    result = execute_query(
        "SELECT id, status FROM proposals WHERE project_id = ? AND freelancer_id = ?",
        [contract.project_id, contract.freelancer_id]
    )
    
    if not result or not result.get("rows"):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proposal not found")
    
    proposal_status = _safe_str(_get_val(result["rows"][0], 1))
    if proposal_status != "accepted":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Proposal is not accepted"
        )
    
    # Check for existing active contract
    result = execute_query(
        """SELECT id FROM contracts 
           WHERE project_id = ? AND freelancer_id = ? AND status IN ('pending', 'active')""",
        [contract.project_id, contract.freelancer_id]
    )
    
    if result and result.get("rows"):
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
    now = datetime.utcnow().isoformat()
    
    try:
        insert_result = execute_query(
            """INSERT INTO contracts (id, project_id, freelancer_id, client_id, total_amount, 
               status, start_date, end_date, description, milestones, terms, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            [
                contract_id,
                contract.project_id,
                contract.freelancer_id,
                current_user.id,
                contract.amount,
                "active",
                contract.start_date.isoformat() if contract.start_date else now,
                contract.end_date.isoformat() if contract.end_date else None,
                description,
                milestones,
                terms,
                now,
                now
            ]
        )
        
        if not insert_result:
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
            "status": "active",
            "start_date": contract.start_date,
            "end_date": contract.end_date,
            "description": description,
            "milestones": milestones,
            "terms": terms,
            "created_at": now,
            "updated_at": now,
            "job_title": project_title,
            "client_name": current_user.full_name
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
    result = execute_query(
        """SELECT id, project_id, freelancer_id, client_id, total_amount, status,
           start_date, end_date, description, milestones, terms, created_at, updated_at
           FROM contracts WHERE id = ?""",
        [contract_id]
    )
    
    if not result or not result.get("rows"):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contract not found")
    
    row = result["rows"][0]
    client_id = int(_get_val(row, 3) or 0)
    freelancer_id = int(_get_val(row, 2) or 0)
    current_status = _safe_str(_get_val(row, 5))
    
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
    values.append(datetime.utcnow().isoformat())
    values.append(contract_id)
    
    try:
        execute_query(
            f"UPDATE contracts SET {', '.join(set_parts)} WHERE id = ?",
            values
        )
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
    result = execute_query(
        "SELECT id, client_id, status FROM contracts WHERE id = ?",
        [contract_id]
    )
    
    if not result or not result.get("rows"):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contract not found")
    
    row = result["rows"][0]
    client_id = int(_get_val(row, 1) or 0)
    current_status = _safe_str(_get_val(row, 2))
    
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
        execute_query(
            "UPDATE contracts SET status = 'cancelled', updated_at = ? WHERE id = ?",
            [datetime.utcnow().isoformat(), contract_id]
        )
        logger.info(f"Contract {contract_id} cancelled by client {current_user.id}")
    except Exception as e:
        logger.error(f"Failed to cancel contract {contract_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to cancel contract"
        )
    
    return
