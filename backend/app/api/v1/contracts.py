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

router = APIRouter()


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
        "total_amount": float(_get_val(row, 4) or 0),
        "status": _safe_str(_get_val(row, 5)),
        "start_date": parse_date(_get_val(row, 6)),
        "end_date": parse_date(_get_val(row, 7)),
        "description": _safe_str(_get_val(row, 8)),
        "milestones": _safe_str(_get_val(row, 9)),
        "terms": _safe_str(_get_val(row, 10)),
        "created_at": parse_date(_get_val(row, 11)),
        "updated_at": parse_date(_get_val(row, 12))
    }


@router.get("/", response_model=List[ContractRead])
def list_contracts(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    status: Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user)
):
    """List contracts for current user"""
    where_sql = "WHERE (client_id = ? OR freelancer_id = ?)"
    params = [current_user.id, current_user.id]
    
    if status:
        where_sql += " AND status = ?"
        params.append(status)
    
    params.extend([limit, skip])
    result = execute_query(
        f"""SELECT id, project_id, freelancer_id, client_id, total_amount, status,
            start_date, end_date, description, milestones, terms, created_at, updated_at
            FROM contracts {where_sql}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?""",
        params
    )
    
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
    
    # Check authorization
    if client_id != current_user.id and freelancer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this contract"
        )
    
    return _contract_from_row(row)


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
        "SELECT id, client_id FROM projects WHERE id = ?",
        [contract.project_id]
    )
    
    if not result or not result.get("rows"):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    
    project_client_id = int(_get_val(result["rows"][0], 1) or 0)
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
            contract.value or 0,
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
        "total_amount": contract.value or 0,
        "status": "active",
        "start_date": contract.start_date,
        "end_date": contract.end_date,
        "description": contract.description,
        "milestones": contract.milestones,
        "terms": contract.terms,
        "created_at": now,
        "updated_at": now
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
    
    # Check authorization
    if client_id != current_user.id and freelancer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this contract"
        )
    
    update_data = contract.model_dump(exclude_unset=True, exclude_none=True)
    
    if not update_data:
        return _contract_from_row(row)
    
    # Build update query
    set_parts = []
    values = []
    for key, value in update_data.items():
        if key == "value":
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
    
    # Fetch updated contract
    result = execute_query(
        """SELECT id, project_id, freelancer_id, client_id, total_amount, status,
           start_date, end_date, description, milestones, terms, created_at, updated_at
           FROM contracts WHERE id = ?""",
        [contract_id]
    )
    
    if result and result.get("rows"):
        return _contract_from_row(result["rows"][0])
    
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Failed to retrieve updated contract"
    )


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
