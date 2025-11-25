# @AI-HINT: Contracts API - CRUD operations for contracts between clients and freelancers
# Uses Turso HTTP API directly - NO SQLite fallback

from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List, Optional
from datetime import datetime
import uuid

from app.core.security import get_current_active_user
from app.db.turso_http import execute_query, to_str, parse_date
from app.models.user import User
from app.schemas.contract import ContractCreate, ContractRead, ContractUpdate
from pydantic import BaseModel

router = APIRouter()


class DirectHireRequest(BaseModel):
    freelancer_id: int
    title: str
    description: str
    rate_type: str
    rate: float
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


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
        "amount": float(_get_val(row, 4) or 0), # Renamed to amount to match schema
        "contract_amount": float(_get_val(row, 4) or 0), # Alias for frontend compatibility if needed
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
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    status: Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user)
):
    """List contracts for current user"""
    where_sql = "WHERE (c.client_id = ? OR c.freelancer_id = ?)"
    params = [current_user.id, current_user.id]
    
    if status:
        where_sql += " AND c.status = ?"
        params.append(status)
    
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
    
    # Check if freelancer exists
    result = execute_query(
        "SELECT id, user_type FROM users WHERE id = ?",
        [hire_data.freelancer_id]
    )
    
    if not result or not result.get("rows"):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Freelancer not found")
    
    freelancer_type = _safe_str(_get_val(result["rows"][0], 1))
    if not freelancer_type or freelancer_type.lower() != "freelancer":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not a freelancer"
        )
        
    now = datetime.utcnow().isoformat()
    
    # 1. Create Project
    project_result = execute_query(
        """INSERT INTO projects (title, description, client_id, budget_min, budget_max, 
           budget_type, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        [
            hire_data.title,
            hire_data.description,
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
            hire_data.rate if hire_data.rate_type == 'Hourly' else 0,
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
            hire_data.description,
            now,
            now
        ]
    )
    
    if not insert_result:
        raise HTTPException(status_code=500, detail="Failed to create contract")
        
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
        "description": hire_data.description,
        "created_at": now,
        "updated_at": now,
        "job_title": hire_data.title,
        "client_name": current_user.full_name
    }


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
    
    # Check if freelancer exists
    result = execute_query(
        "SELECT id, user_type FROM users WHERE id = ?",
        [contract.freelancer_id]
    )
    
    if not result or not result.get("rows"):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Freelancer not found")
    
    freelancer_type = _safe_str(_get_val(result["rows"][0], 1))
    if not freelancer_type or freelancer_type.lower() != "freelancer":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not a freelancer"
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
    
    # Generate contract ID
    contract_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    
    insert_result = execute_query(
        """INSERT INTO contracts (id, project_id, freelancer_id, client_id, total_amount, 
           status, start_date, end_date, description, milestones, terms, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        [
            contract_id,
            contract.project_id,
            contract.freelancer_id,
            current_user.id,
            contract.amount, # Fixed: use amount instead of value
            "active",
            contract.start_date.isoformat() if contract.start_date else now,
            contract.end_date.isoformat() if contract.end_date else None,
            contract.description or "",
            contract.milestones or "",
            contract.terms or "",
            now,
            now
        ]
    )
    
    if not insert_result:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create contract"
        )
    
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
        "description": contract.description,
        "milestones": contract.milestones,
        "terms": contract.terms,
        "created_at": now,
        "updated_at": now,
        "job_title": project_title,
        "client_name": current_user.full_name
    }


@router.put("/{contract_id}", response_model=ContractRead)
def update_contract(
    contract_id: str,
    contract: ContractUpdate,
    current_user: User = Depends(get_current_active_user)
):
    """Update a contract"""
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
    project_id = int(_get_val(row, 1) or 0)
    
    # Check authorization
    if client_id != current_user.id and freelancer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this contract"
        )
    
    update_data = contract.model_dump(exclude_unset=True, exclude_none=True)
    
    if not update_data:
        # Just return existing with joins
        return get_contract(contract_id, current_user)
    
    # Build update query
    set_parts = []
    values = []
    for key, value in update_data.items():
        if key == "amount": # Fixed: use amount instead of value
            key = "total_amount"
        set_parts.append(f"{key} = ?")
        if isinstance(value, datetime):
            values.append(value.isoformat())
        else:
            values.append(value if value is not None else "")
    
    set_parts.append("updated_at = ?")
    values.append(datetime.utcnow().isoformat())
    values.append(contract_id)
    
    execute_query(
        f"UPDATE contracts SET {', '.join(set_parts)} WHERE id = ?",
        values
    )
    
    # Fetch updated contract with joins
    return get_contract(contract_id, current_user)


@router.delete("/{contract_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_contract(
    contract_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Delete a contract"""
    # Get contract
    result = execute_query(
        "SELECT id, client_id FROM contracts WHERE id = ?",
        [contract_id]
    )
    
    if not result or not result.get("rows"):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contract not found")
    
    client_id = int(_get_val(result["rows"][0], 1) or 0)
    
    # Only client can delete
    if client_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this contract"
        )
    
    execute_query("DELETE FROM contracts WHERE id = ?", [contract_id])
    return
