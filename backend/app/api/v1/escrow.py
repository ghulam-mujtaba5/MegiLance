# @AI-HINT: Escrow API endpoints - Turso HTTP only (NO SQLite fallback)
from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from datetime import datetime, timezone

from app.db.turso_http import execute_query, to_str, parse_date
from app.core.security import get_current_user
from app.models import User
from app.schemas.escrow import (
    EscrowCreate, EscrowUpdate, EscrowRead,
    EscrowRelease, EscrowRefund, EscrowBalance
)

router = APIRouter(prefix="/escrow", tags=["escrow"])


def _row_to_escrow(row) -> dict:
    """Convert Turso row to escrow dict"""
    return {
        "id": int(row[0].get("value")) if row[0].get("type") != "null" else None,
        "contract_id": int(row[1].get("value")) if row[1].get("type") != "null" else None,
        "client_id": int(row[2].get("value")) if row[2].get("type") != "null" else None,
        "amount": float(row[3].get("value")) if row[3].get("type") != "null" else 0.0,
        "released_amount": float(row[4].get("value")) if row[4].get("type") != "null" else 0.0,
        "status": to_str(row[5]) or "pending",
        "expires_at": parse_date(row[6]),
        "notes": to_str(row[7]),
        "created_at": parse_date(row[8]),
        "updated_at": parse_date(row[9])
    }


@router.post("/", response_model=EscrowRead, status_code=status.HTTP_201_CREATED)
async def create_escrow(
    escrow: EscrowCreate,
    current_user: User = Depends(get_current_user)
):
    """Fund escrow for a contract. Clients fund escrow to secure payment."""
    # Verify contract exists and user is the client
    result = execute_query("SELECT id, client_id FROM contracts WHERE id = ?", [escrow.contract_id])
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Contract not found")
    
    client_id = int(result["rows"][0][1].get("value"))
    if client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the contract client can fund escrow")
    
    # Check client balance
    user_result = execute_query("SELECT account_balance FROM users WHERE id = ?", [current_user.id])
    balance = 0.0
    if user_result and user_result.get("rows"):
        balance = float(user_result["rows"][0][0].get("value")) if user_result["rows"][0][0].get("type") != "null" else 0.0
    
    if balance < escrow.amount:
        raise HTTPException(status_code=400, detail=f"Insufficient balance. Available: ${balance:.2f}")
    
    # Create escrow
    now = datetime.now(timezone.utc).isoformat()
    expires_at = escrow.expires_at.isoformat() if escrow.expires_at else None
    
    execute_query("""
        INSERT INTO escrow (contract_id, client_id, amount, released_amount, status, expires_at, notes, created_at, updated_at)
        VALUES (?, ?, ?, 0.0, 'active', ?, ?, ?, ?)
    """, [escrow.contract_id, current_user.id, escrow.amount, expires_at, escrow.notes, now, now])
    
    # Deduct from client balance
    new_balance = balance - escrow.amount
    execute_query("UPDATE users SET account_balance = ? WHERE id = ?", [new_balance, current_user.id])
    
    # Get created escrow
    escrow_result = execute_query("""
        SELECT id, contract_id, client_id, amount, released_amount, status, expires_at, notes, created_at, updated_at
        FROM escrow WHERE contract_id = ? AND client_id = ? ORDER BY id DESC LIMIT 1
    """, [escrow.contract_id, current_user.id])
    
    if not escrow_result or not escrow_result.get("rows"):
        raise HTTPException(status_code=500, detail="Failed to retrieve created escrow")
    
    return _row_to_escrow(escrow_result["rows"][0])


@router.get("/", response_model=List[EscrowRead])
async def list_escrow(
    contract_id: Optional[int] = Query(None, description="Filter by contract"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user)
):
    """List escrow records. Clients see escrow they funded, freelancers see escrow for their contracts."""
    user_role = getattr(current_user, 'role', None) or getattr(current_user, 'user_type', 'client')
    if hasattr(user_role, 'value'):
        user_role = user_role.value
    user_role = str(user_role).lower()
    
    # Update expired escrow first
    now = datetime.now(timezone.utc).isoformat()
    execute_query("""
        UPDATE escrow SET status = 'expired' 
        WHERE status = 'active' AND expires_at IS NOT NULL AND expires_at < ?
    """, [now])
    
    # Build query based on role
    if user_role == "client":
        sql = """
            SELECT id, contract_id, client_id, amount, released_amount, status, expires_at, notes, created_at, updated_at
            FROM escrow WHERE client_id = ?
        """
        params = [current_user.id]
    elif user_role == "freelancer":
        # Get contracts where user is freelancer
        contracts_result = execute_query("SELECT id FROM contracts WHERE freelancer_id = ?", [current_user.id])
        contract_ids = []
        if contracts_result and contracts_result.get("rows"):
            contract_ids = [int(r[0].get("value")) for r in contracts_result["rows"]]
        
        if not contract_ids:
            return []
        
        placeholders = ",".join(["?" for _ in contract_ids])
        sql = f"""
            SELECT id, contract_id, client_id, amount, released_amount, status, expires_at, notes, created_at, updated_at
            FROM escrow WHERE contract_id IN ({placeholders})
        """
        params = contract_ids
    else:
        # Admin sees all
        sql = """
            SELECT id, contract_id, client_id, amount, released_amount, status, expires_at, notes, created_at, updated_at
            FROM escrow WHERE 1=1
        """
        params = []
    
    if contract_id:
        sql += " AND contract_id = ?"
        params.append(contract_id)
    if status_filter:
        sql += " AND status = ?"
        params.append(status_filter)
    
    sql += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])
    
    result = execute_query(sql, params)
    
    escrows = []
    if result and result.get("rows"):
        for row in result["rows"]:
            escrows.append(_row_to_escrow(row))
    
    return escrows


@router.get("/balance", response_model=EscrowBalance)
async def get_escrow_balance(
    contract_id: int = Query(..., description="Contract ID for balance check"),
    current_user: User = Depends(get_current_user)
):
    """Check escrow balance for a contract."""
    # Verify contract access
    result = execute_query("SELECT client_id, freelancer_id FROM contracts WHERE id = ?", [contract_id])
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Contract not found")
    
    row = result["rows"][0]
    client_id = int(row[0].get("value"))
    freelancer_id = int(row[1].get("value"))
    
    user_role = getattr(current_user, 'role', None) or getattr(current_user, 'user_type', 'client')
    if hasattr(user_role, 'value'):
        user_role = user_role.value
    user_role = str(user_role).lower()
    
    if user_role == "client" and client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    elif user_role == "freelancer" and freelancer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Calculate balance
    escrow_result = execute_query("""
        SELECT amount, released_amount, status FROM escrow WHERE contract_id = ?
    """, [contract_id])
    
    total_funded = 0.0
    total_released = 0.0
    has_active = False
    
    if escrow_result and escrow_result.get("rows"):
        for row in escrow_result["rows"]:
            amount = float(row[0].get("value")) if row[0].get("type") != "null" else 0.0
            released = float(row[1].get("value")) if row[1].get("type") != "null" else 0.0
            status = to_str(row[2])
            
            if status in ["active", "released"]:
                total_funded += amount
            total_released += released
            if status == "active":
                has_active = True
    
    available_balance = total_funded - total_released
    overall_status = "active" if has_active else "none"
    
    return EscrowBalance(
        contract_id=contract_id,
        total_funded=round(total_funded, 2),
        total_released=round(total_released, 2),
        available_balance=round(available_balance, 2),
        status=overall_status
    )


@router.post("/{escrow_id}/release", response_model=EscrowRead)
async def release_escrow(
    escrow_id: int,
    release_data: EscrowRelease,
    current_user: User = Depends(get_current_user)
):
    """Release escrow funds to freelancer."""
    result = execute_query("""
        SELECT id, contract_id, client_id, amount, released_amount, status
        FROM escrow WHERE id = ?
    """, [escrow_id])
    
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Escrow not found")
    
    row = result["rows"][0]
    contract_id = int(row[1].get("value"))
    client_id = int(row[2].get("value"))
    amount = float(row[3].get("value")) if row[3].get("type") != "null" else 0.0
    released_amount = float(row[4].get("value")) if row[4].get("type") != "null" else 0.0
    escrow_status = to_str(row[5])
    
    if client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the client can release escrow")
    
    if escrow_status != "active":
        raise HTTPException(status_code=400, detail=f"Cannot release escrow with status: {escrow_status}")
    
    available = amount - released_amount
    if release_data.amount > available:
        raise HTTPException(status_code=400, detail=f"Insufficient escrow balance. Available: ${available:.2f}")
    
    # Get freelancer from contract
    contract_result = execute_query("SELECT freelancer_id FROM contracts WHERE id = ?", [contract_id])
    if not contract_result or not contract_result.get("rows"):
        raise HTTPException(status_code=404, detail="Contract not found")
    
    freelancer_id = int(contract_result["rows"][0][0].get("value"))
    
    # Get freelancer balance
    freelancer_result = execute_query("SELECT account_balance FROM users WHERE id = ?", [freelancer_id])
    freelancer_balance = 0.0
    if freelancer_result and freelancer_result.get("rows"):
        freelancer_balance = float(freelancer_result["rows"][0][0].get("value")) if freelancer_result["rows"][0][0].get("type") != "null" else 0.0
    
    # Transfer funds
    new_freelancer_balance = freelancer_balance + release_data.amount
    new_released_amount = released_amount + release_data.amount
    new_status = "released" if new_released_amount >= amount else "active"
    now = datetime.now(timezone.utc).isoformat()
    
    execute_query("UPDATE users SET account_balance = ? WHERE id = ?", [new_freelancer_balance, freelancer_id])
    execute_query("""
        UPDATE escrow SET released_amount = ?, status = ?, updated_at = ? WHERE id = ?
    """, [new_released_amount, new_status, now, escrow_id])
    
    # Return updated escrow
    return await get_escrow(escrow_id, current_user)


@router.post("/{escrow_id}/refund", response_model=EscrowRead)
async def refund_escrow(
    escrow_id: int,
    refund_data: EscrowRefund,
    current_user: User = Depends(get_current_user)
):
    """Refund escrow to client. Admin or client can refund."""
    result = execute_query("""
        SELECT id, contract_id, client_id, amount, released_amount, status
        FROM escrow WHERE id = ?
    """, [escrow_id])
    
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Escrow not found")
    
    row = result["rows"][0]
    client_id = int(row[2].get("value"))
    amount = float(row[3].get("value")) if row[3].get("type") != "null" else 0.0
    released_amount = float(row[4].get("value")) if row[4].get("type") != "null" else 0.0
    escrow_status = to_str(row[5])
    
    user_role = getattr(current_user, 'role', None) or getattr(current_user, 'user_type', 'client')
    if hasattr(user_role, 'value'):
        user_role = user_role.value
    user_role = str(user_role).lower()
    
    if user_role != "admin" and client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if escrow_status not in ["active", "expired"]:
        raise HTTPException(status_code=400, detail=f"Cannot refund escrow with status: {escrow_status}")
    
    available = amount - released_amount
    if refund_data.amount > available:
        raise HTTPException(status_code=400, detail=f"Insufficient escrow balance for refund. Available: ${available:.2f}")
    
    # Get client balance
    client_result = execute_query("SELECT account_balance FROM users WHERE id = ?", [client_id])
    client_balance = 0.0
    if client_result and client_result.get("rows"):
        client_balance = float(client_result["rows"][0][0].get("value")) if client_result["rows"][0][0].get("type") != "null" else 0.0
    
    # Refund to client
    new_client_balance = client_balance + refund_data.amount
    new_released_amount = released_amount + refund_data.amount
    now = datetime.now(timezone.utc).isoformat()
    
    execute_query("UPDATE users SET account_balance = ? WHERE id = ?", [new_client_balance, client_id])
    execute_query("""
        UPDATE escrow SET released_amount = ?, status = 'refunded', updated_at = ? WHERE id = ?
    """, [new_released_amount, now, escrow_id])
    
    return await get_escrow(escrow_id, current_user)


@router.get("/{escrow_id}", response_model=EscrowRead)
async def get_escrow(
    escrow_id: int,
    current_user: User = Depends(get_current_user)
):
    """Get escrow details by ID"""
    result = execute_query("""
        SELECT id, contract_id, client_id, amount, released_amount, status, expires_at, notes, created_at, updated_at
        FROM escrow WHERE id = ?
    """, [escrow_id])
    
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Escrow not found")
    
    escrow = _row_to_escrow(result["rows"][0])
    
    # Verify access
    contract_result = execute_query("SELECT freelancer_id FROM contracts WHERE id = ?", [escrow["contract_id"]])
    freelancer_id = None
    if contract_result and contract_result.get("rows"):
        freelancer_id = int(contract_result["rows"][0][0].get("value"))
    
    user_role = getattr(current_user, 'role', None) or getattr(current_user, 'user_type', 'client')
    if hasattr(user_role, 'value'):
        user_role = user_role.value
    user_role = str(user_role).lower()
    
    if escrow["client_id"] != current_user.id and freelancer_id != current_user.id:
        if user_role != "admin":
            raise HTTPException(status_code=403, detail="Not authorized")
    
    return escrow


@router.patch("/{escrow_id}", response_model=EscrowRead)
async def update_escrow(
    escrow_id: int,
    update_data: EscrowUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update escrow details. Only client can update active escrow."""
    result = execute_query("""
        SELECT id, client_id, status FROM escrow WHERE id = ?
    """, [escrow_id])
    
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Escrow not found")
    
    row = result["rows"][0]
    client_id = int(row[1].get("value"))
    escrow_status = to_str(row[2])
    
    if client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if escrow_status != "active":
        raise HTTPException(status_code=400, detail="Only active escrow can be updated")
    
    # Build update query
    update_fields = []
    params = []
    update_dict = update_data.model_dump(exclude_unset=True)
    
    for field, value in update_dict.items():
        if field == "expires_at" and value:
            update_fields.append(f"{field} = ?")
            params.append(value.isoformat())
        else:
            update_fields.append(f"{field} = ?")
            params.append(value)
    
    if update_fields:
        update_fields.append("updated_at = ?")
        params.append(datetime.now(timezone.utc).isoformat())
        params.append(escrow_id)
        
        execute_query(f"UPDATE escrow SET {', '.join(update_fields)} WHERE id = ?", params)
    
    return await get_escrow(escrow_id, current_user)
