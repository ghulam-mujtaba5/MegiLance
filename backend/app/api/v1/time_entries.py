# @AI-HINT: Time Tracking API endpoints for work hour management - Turso HTTP only
from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from datetime import datetime
import json

from app.db.turso_http import execute_query, to_str, parse_date
from app.schemas.time_entry import (
    TimeEntryCreate, TimeEntryUpdate, TimeEntryRead, 
    TimeEntryStop, TimeEntrySummary, TimeEntrySubmit, TimeEntryReview
)
from app.core.security import get_current_user

router = APIRouter(prefix="/time-entries", tags=["time-tracking"])


def _send_notification_turso(user_id: int, notification_type: str, title: str, 
                              content: str, data: dict, priority: str, action_url: str):
    """Send notification using Turso"""
    now = datetime.utcnow().isoformat()
    execute_query("""
        INSERT INTO notifications (user_id, notification_type, title, content, data, 
                                   priority, action_url, is_read, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
    """, [user_id, notification_type, title, content, json.dumps(data), priority, action_url, now])


def row_to_time_entry(row: list) -> dict:
    """Convert a database row to a time entry dict"""
    return {
        "id": row[0].get("value") if row[0].get("type") != "null" else None,
        "user_id": row[1].get("value") if row[1].get("type") != "null" else None,
        "contract_id": row[2].get("value") if row[2].get("type") != "null" else None,
        "description": to_str(row[3]),
        "start_time": parse_date(row[4]),
        "end_time": parse_date(row[5]),
        "duration_minutes": row[6].get("value") if row[6].get("type") != "null" else None,
        "hourly_rate": float(row[7].get("value")) if row[7].get("type") != "null" else None,
        "amount": float(row[8].get("value")) if row[8].get("type") != "null" else None,
        "billable": bool(row[9].get("value")) if row[9].get("type") != "null" else True,
        "status": to_str(row[10]) or "draft",
        "created_at": parse_date(row[11]),
        "updated_at": parse_date(row[12])
    }


@router.post("/", response_model=TimeEntryRead, status_code=status.HTTP_201_CREATED)
async def create_time_entry(
    time_entry: TimeEntryCreate,
    current_user = Depends(get_current_user)
):
    """
    Start a new time entry (start timer)
    - Freelancers can track time on their contracts
    - Auto-sets start_time if not provided
    - Status defaults to 'draft'
    """
    # Verify contract exists and user is the freelancer
    contract_result = execute_query(
        "SELECT id, freelancer_id FROM contracts WHERE id = ?",
        [time_entry.contract_id]
    )
    
    if not contract_result or not contract_result.get("rows"):
        raise HTTPException(status_code=404, detail="Contract not found")
    
    contract_row = contract_result["rows"][0]
    freelancer_id = contract_row[1].get("value") if contract_row[1].get("type") != "null" else None
    
    if freelancer_id != current_user["id"]:
        raise HTTPException(
            status_code=403, 
            detail="Only the contract freelancer can create time entries"
        )
    
    # Check for active time entry (no end_time)
    active_result = execute_query(
        """SELECT id FROM time_entries 
           WHERE user_id = ? AND contract_id = ? AND end_time IS NULL""",
        [current_user["id"], time_entry.contract_id]
    )
    
    if active_result and active_result.get("rows"):
        raise HTTPException(
            status_code=400, 
            detail="You have an active time entry. Stop it before starting a new one."
        )
    
    # Get user's hourly rate if not provided
    hourly_rate = time_entry.hourly_rate
    if not hourly_rate:
        user_result = execute_query(
            "SELECT hourly_rate FROM users WHERE id = ?",
            [current_user["id"]]
        )
        if user_result and user_result.get("rows"):
            hourly_rate = user_result["rows"][0][0].get("value") if user_result["rows"][0][0].get("type") != "null" else None
    
    now = datetime.utcnow().isoformat()
    start_time = time_entry.start_time.isoformat() if time_entry.start_time else now
    
    result = execute_query(
        """INSERT INTO time_entries (user_id, contract_id, description, start_time, hourly_rate, billable, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        [
            current_user["id"],
            time_entry.contract_id,
            time_entry.description,
            start_time,
            hourly_rate,
            1 if time_entry.billable else 0,
            time_entry.status or "draft",
            now,
            now
        ]
    )
    
    if not result:
        raise HTTPException(status_code=500, detail="Failed to create time entry")
    
    entry_id = result.get("last_insert_rowid")
    
    # Fetch created entry
    fetch_result = execute_query(
        """SELECT id, user_id, contract_id, description, start_time, end_time, duration_minutes, hourly_rate, amount, billable, status, created_at, updated_at
           FROM time_entries WHERE id = ?""",
        [entry_id]
    )
    
    if not fetch_result or not fetch_result.get("rows"):
        raise HTTPException(status_code=500, detail="Failed to retrieve created time entry")
    
    return row_to_time_entry(fetch_result["rows"][0])


@router.put("/{time_entry_id}/stop", response_model=TimeEntryRead)
async def stop_time_entry(
    time_entry_id: int,
    stop_data: TimeEntryStop,
    current_user = Depends(get_current_user)
):
    """
    Stop a running time entry (stop timer)
    - Auto-calculates duration and amount
    - Sets end_time to current time if not provided
    """
    result = execute_query(
        """SELECT id, user_id, contract_id, description, start_time, end_time, duration_minutes, hourly_rate, amount, billable, status, created_at, updated_at
           FROM time_entries WHERE id = ?""",
        [time_entry_id]
    )
    
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Time entry not found")
    
    entry = row_to_time_entry(result["rows"][0])
    
    if entry["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if entry["end_time"] is not None:
        raise HTTPException(status_code=400, detail="Time entry already stopped")
    
    # Set end time
    end_time = stop_data.end_time if stop_data.end_time else datetime.utcnow()
    end_time_str = end_time.isoformat()
    
    # Calculate duration in minutes
    start_time = entry["start_time"]
    if isinstance(start_time, str):
        start_time = datetime.fromisoformat(start_time.replace("Z", "+00:00").replace("+00:00", ""))
    
    duration_seconds = (end_time - start_time).total_seconds()
    duration_minutes = int(duration_seconds / 60)
    
    # Calculate amount
    amount = None
    if entry["billable"] and entry["hourly_rate"]:
        amount = (duration_minutes / 60) * entry["hourly_rate"]
    
    execute_query(
        """UPDATE time_entries SET end_time = ?, duration_minutes = ?, amount = ?, updated_at = ?
           WHERE id = ?""",
        [end_time_str, duration_minutes, amount, datetime.utcnow().isoformat(), time_entry_id]
    )
    
    # Fetch updated entry
    updated_result = execute_query(
        """SELECT id, user_id, contract_id, description, start_time, end_time, duration_minutes, hourly_rate, amount, billable, status, created_at, updated_at
           FROM time_entries WHERE id = ?""",
        [time_entry_id]
    )
    
    return row_to_time_entry(updated_result["rows"][0])


@router.get("/", response_model=List[TimeEntryRead])
async def list_time_entries(
    contract_id: Optional[int] = Query(None, description="Filter by contract"),
    entry_status: Optional[str] = Query(None, alias="status", description="Filter by status"),
    start_date: Optional[datetime] = Query(None, description="Filter by start date (from)"),
    end_date: Optional[datetime] = Query(None, description="Filter by end date (to)"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user = Depends(get_current_user)
):
    """
    List time entries with filters
    - Freelancers see only their own entries
    - Clients see entries for their contracts
    - Supports filtering by contract, status, date range
    """
    user_type = current_user.get("user_type", "").lower() or current_user.get("role", "").lower()
    
    conditions = []
    params = []
    
    if user_type == "freelancer":
        conditions.append("te.user_id = ?")
        params.append(current_user["id"])
    elif user_type == "client":
        # Get client's contracts
        contracts_result = execute_query(
            "SELECT id FROM contracts WHERE client_id = ?",
            [current_user["id"]]
        )
        if contracts_result and contracts_result.get("rows"):
            contract_ids = [r[0].get("value") for r in contracts_result["rows"]]
            if contract_ids:
                placeholders = ",".join(["?" for _ in contract_ids])
                conditions.append(f"te.contract_id IN ({placeholders})")
                params.extend(contract_ids)
            else:
                return []  # No contracts, no entries
        else:
            return []
    
    if contract_id:
        conditions.append("te.contract_id = ?")
        params.append(contract_id)
    if entry_status:
        conditions.append("te.status = ?")
        params.append(entry_status)
    if start_date:
        conditions.append("te.start_time >= ?")
        params.append(start_date.isoformat())
    if end_date:
        conditions.append("te.start_time <= ?")
        params.append(end_date.isoformat())
    
    where_clause = " AND ".join(conditions) if conditions else "1=1"
    params.extend([limit, offset])
    
    result = execute_query(
        f"""SELECT te.id, te.user_id, te.contract_id, te.description, te.start_time, te.end_time, te.duration_minutes, te.hourly_rate, te.amount, te.billable, te.status, te.created_at, te.updated_at
            FROM time_entries te
            WHERE {where_clause}
            ORDER BY te.start_time DESC
            LIMIT ? OFFSET ?""",
        params
    )
    
    if not result or not result.get("rows"):
        return []
    
    return [row_to_time_entry(row) for row in result["rows"]]


@router.get("/summary", response_model=TimeEntrySummary)
async def get_time_summary(
    contract_id: int = Query(..., description="Contract ID for summary"),
    current_user = Depends(get_current_user)
):
    """
    Get time entry summary for a contract
    - Total hours worked
    - Total billable hours
    - Total amount earned
    - Number of entries
    """
    # Verify access to contract
    contract_result = execute_query(
        "SELECT id, client_id, freelancer_id FROM contracts WHERE id = ?",
        [contract_id]
    )
    
    if not contract_result or not contract_result.get("rows"):
        raise HTTPException(status_code=404, detail="Contract not found")
    
    contract_row = contract_result["rows"][0]
    client_id = contract_row[1].get("value") if contract_row[1].get("type") != "null" else None
    freelancer_id = contract_row[2].get("value") if contract_row[2].get("type") != "null" else None
    
    user_type = current_user.get("user_type", "").lower() or current_user.get("role", "").lower()
    
    if user_type == "freelancer" and freelancer_id != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    elif user_type == "client" and client_id != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Calculate summary using aggregation
    result = execute_query(
        """SELECT 
            COUNT(*) as entry_count,
            COALESCE(SUM(duration_minutes), 0) as total_minutes,
            COALESCE(SUM(amount), 0) as total_amount,
            COALESCE(SUM(CASE WHEN billable = 1 THEN duration_minutes ELSE 0 END), 0) as billable_minutes,
            COALESCE(SUM(CASE WHEN billable = 1 THEN amount ELSE 0 END), 0) as billable_amount
           FROM time_entries WHERE contract_id = ?""",
        [contract_id]
    )
    
    if not result or not result.get("rows"):
        return TimeEntrySummary(
            contract_id=contract_id,
            total_hours=0,
            total_amount=0,
            billable_hours=0,
            billable_amount=0,
            entry_count=0
        )
    
    row = result["rows"][0]
    entry_count = row[0].get("value", 0) if row[0].get("type") != "null" else 0
    total_minutes = row[1].get("value", 0) if row[1].get("type") != "null" else 0
    total_amount = float(row[2].get("value", 0)) if row[2].get("type") != "null" else 0
    billable_minutes = row[3].get("value", 0) if row[3].get("type") != "null" else 0
    billable_amount = float(row[4].get("value", 0)) if row[4].get("type") != "null" else 0
    
    return TimeEntrySummary(
        contract_id=contract_id,
        total_hours=round(total_minutes / 60, 2),
        total_amount=round(total_amount, 2),
        billable_hours=round(billable_minutes / 60, 2),
        billable_amount=round(billable_amount, 2),
        entry_count=entry_count
    )


@router.get("/{time_entry_id}", response_model=TimeEntryRead)
async def get_time_entry(
    time_entry_id: int,
    current_user = Depends(get_current_user)
):
    """Get a single time entry by ID"""
    result = execute_query(
        """SELECT id, user_id, contract_id, description, start_time, end_time, duration_minutes, hourly_rate, amount, billable, status, created_at, updated_at
           FROM time_entries WHERE id = ?""",
        [time_entry_id]
    )
    
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Time entry not found")
    
    entry = row_to_time_entry(result["rows"][0])
    
    # Verify access
    if entry["user_id"] != current_user["id"]:
        # Check if user is client of the contract
        contract_result = execute_query(
            "SELECT client_id FROM contracts WHERE id = ?",
            [entry["contract_id"]]
        )
        if not contract_result or not contract_result.get("rows"):
            raise HTTPException(status_code=403, detail="Not authorized")
        
        client_id = contract_result["rows"][0][0].get("value") if contract_result["rows"][0][0].get("type") != "null" else None
        if client_id != current_user["id"]:
            raise HTTPException(status_code=403, detail="Not authorized")
    
    return entry


@router.patch("/{time_entry_id}", response_model=TimeEntryRead)
async def update_time_entry(
    time_entry_id: int,
    update_data: TimeEntryUpdate,
    current_user = Depends(get_current_user)
):
    """
    Update a time entry
    - Only freelancer can update their own entries
    - Only 'draft' entries can be edited
    """
    result = execute_query(
        """SELECT id, user_id, contract_id, description, start_time, end_time, duration_minutes, hourly_rate, amount, billable, status, created_at, updated_at
           FROM time_entries WHERE id = ?""",
        [time_entry_id]
    )
    
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Time entry not found")
    
    entry = row_to_time_entry(result["rows"][0])
    
    if entry["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if entry["status"] != "draft":
        raise HTTPException(
            status_code=400, 
            detail="Only draft time entries can be edited"
        )
    
    # Build update
    update_dict = update_data.model_dump(exclude_unset=True)
    if not update_dict:
        return entry
    
    # Handle datetime fields
    for key in ["start_time", "end_time"]:
        if key in update_dict and update_dict[key]:
            update_dict[key] = update_dict[key].isoformat()
    
    set_parts = []
    params = []
    for field, value in update_dict.items():
        set_parts.append(f"{field} = ?")
        params.append(value)
    
    set_parts.append("updated_at = ?")
    params.append(datetime.utcnow().isoformat())
    params.append(time_entry_id)
    
    execute_query(
        f"UPDATE time_entries SET {', '.join(set_parts)} WHERE id = ?",
        params
    )
    
    # Recalculate if times changed
    fetch_result = execute_query(
        """SELECT id, user_id, contract_id, description, start_time, end_time, duration_minutes, hourly_rate, amount, billable, status, created_at, updated_at
           FROM time_entries WHERE id = ?""",
        [time_entry_id]
    )
    
    updated_entry = row_to_time_entry(fetch_result["rows"][0])
    
    # Recalculate duration and amount if both times are set
    if updated_entry["start_time"] and updated_entry["end_time"]:
        start = updated_entry["start_time"]
        end = updated_entry["end_time"]
        if isinstance(start, str):
            start = datetime.fromisoformat(start.replace("Z", "+00:00").replace("+00:00", ""))
        if isinstance(end, str):
            end = datetime.fromisoformat(end.replace("Z", "+00:00").replace("+00:00", ""))
        
        duration_minutes = int((end - start).total_seconds() / 60)
        amount = None
        if updated_entry["billable"] and updated_entry["hourly_rate"]:
            amount = (duration_minutes / 60) * updated_entry["hourly_rate"]
        
        execute_query(
            "UPDATE time_entries SET duration_minutes = ?, amount = ? WHERE id = ?",
            [duration_minutes, amount, time_entry_id]
        )
        
        # Fetch again
        final_result = execute_query(
            """SELECT id, user_id, contract_id, description, start_time, end_time, duration_minutes, hourly_rate, amount, billable, status, created_at, updated_at
               FROM time_entries WHERE id = ?""",
            [time_entry_id]
        )
        return row_to_time_entry(final_result["rows"][0])
    
    return updated_entry


@router.delete("/{time_entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_time_entry(
    time_entry_id: int,
    current_user = Depends(get_current_user)
):
    """
    Delete a time entry
    - Only draft entries can be deleted
    - Only freelancer can delete their own entries
    """
    result = execute_query(
        "SELECT id, user_id, status FROM time_entries WHERE id = ?",
        [time_entry_id]
    )
    
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Time entry not found")
    
    row = result["rows"][0]
    user_id = row[1].get("value") if row[1].get("type") != "null" else None
    status_val = to_str(row[2]) or "draft"
    
    if user_id != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if status_val != "draft":
        raise HTTPException(
            status_code=400, 
            detail="Only draft time entries can be deleted"
        )
    
    execute_query("DELETE FROM time_entries WHERE id = ?", [time_entry_id])
    
    return None


@router.post("/submit", status_code=status.HTTP_200_OK)
async def submit_time_entries(
    submission: TimeEntrySubmit,
    current_user = Depends(get_current_user)
):
    """
    Submit time entries for approval
    - Only freelancer can submit their own entries
    - Only 'draft' entries can be submitted
    - Entries must belong to the same contract (optional validation, but good practice)
    """
    if not submission.time_entry_ids:
        raise HTTPException(status_code=400, detail="No time entries provided")
    
    # Verify ownership and status
    placeholders = ",".join(["?" for _ in submission.time_entry_ids])
    query = f"""
        SELECT id, user_id, contract_id, status 
        FROM time_entries 
        WHERE id IN ({placeholders})
    """
    
    result = execute_query(query, submission.time_entry_ids)
    
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Time entries not found")
    
    rows = result["rows"]
    if len(rows) != len(submission.time_entry_ids):
        raise HTTPException(status_code=400, detail="Some time entries were not found")
    
    contract_ids = set()
    
    for row in rows:
        entry_id = row[0].get("value")
        user_id = row[1].get("value")
        contract_id = row[2].get("value")
        status_val = to_str(row[3])
        
        if user_id != current_user["id"]:
            raise HTTPException(status_code=403, detail=f"Not authorized for entry {entry_id}")
        
        if status_val != "draft":
            raise HTTPException(status_code=400, detail=f"Entry {entry_id} is not in draft status")
            
        contract_ids.add(contract_id)
    
    # Update status to submitted
    now = datetime.utcnow().isoformat()
    execute_query(
        f"UPDATE time_entries SET status = 'submitted', updated_at = ? WHERE id IN ({placeholders})",
        [now] + submission.time_entry_ids
    )
    
    # Notify client(s)
    for contract_id in contract_ids:
        contract_res = execute_query("SELECT client_id FROM contracts WHERE id = ?", [contract_id])
        if contract_res and contract_res.get("rows"):
            client_id = contract_res["rows"][0][0].get("value")
            _send_notification_turso(
                user_id=client_id,
                notification_type="timesheet",
                title="Timesheet Submitted",
                content=f"Freelancer submitted {len(rows)} time entries for review",
                data={"contract_id": contract_id, "count": len(rows)},
                priority="high",
                action_url=f"/contracts/{contract_id}/timesheet"
            )
            
    return {"message": f"Submitted {len(rows)} time entries"}


@router.post("/approve", status_code=status.HTTP_200_OK)
async def approve_time_entries(
    review: TimeEntryReview,
    current_user = Depends(get_current_user)
):
    """
    Approve time entries and generate invoice
    - Only client can approve
    - Only 'submitted' entries can be approved
    - Generates an invoice for the total amount
    """
    if not review.time_entry_ids:
        raise HTTPException(status_code=400, detail="No time entries provided")
        
    placeholders = ",".join(["?" for _ in review.time_entry_ids])
    query = f"""
        SELECT id, contract_id, status, amount, user_id
        FROM time_entries 
        WHERE id IN ({placeholders})
    """
    
    result = execute_query(query, review.time_entry_ids)
    
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Time entries not found")
        
    rows = result["rows"]
    contract_ids = set()
    total_amount = 0.0
    freelancer_id = None
    
    for row in rows:
        contract_id = row[1].get("value")
        status_val = to_str(row[2])
        amount = float(row[3].get("value")) if row[3].get("type") != "null" else 0.0
        f_id = row[4].get("value")
        
        if freelancer_id is None:
            freelancer_id = f_id
        elif freelancer_id != f_id:
             raise HTTPException(status_code=400, detail="Cannot approve entries from different freelancers at once")
        
        if status_val != "submitted":
            raise HTTPException(status_code=400, detail=f"Entry {row[0].get('value')} is not submitted")
            
        contract_ids.add(contract_id)
        total_amount += amount
        
    if len(contract_ids) > 1:
        raise HTTPException(status_code=400, detail="Cannot approve entries from multiple contracts at once")
        
    contract_id = list(contract_ids)[0]
    
    # Verify client ownership
    contract_res = execute_query("SELECT client_id FROM contracts WHERE id = ?", [contract_id])
    if not contract_res or not contract_res.get("rows"):
        raise HTTPException(status_code=404, detail="Contract not found")
        
    client_id = contract_res["rows"][0][0].get("value")
    if client_id != current_user["id"]:
        raise HTTPException(status_code=403, detail="Only contract client can approve time entries")
        
    # Update status
    now = datetime.utcnow().isoformat()
    execute_query(
        f"UPDATE time_entries SET status = 'approved', updated_at = ? WHERE id IN ({placeholders})",
        [now] + review.time_entry_ids
    )
    
    # Create Invoice
    if total_amount > 0:
        invoice_number = f"INV-HR-{contract_id}-{int(datetime.utcnow().timestamp())}"
        
        items_list = []
        for row in rows:
            items_list.append({
                "description": f"Time Entry #{row[0].get('value')}",
                "amount": float(row[3].get("value")) if row[3].get("type") != "null" else 0.0
            })
        items_json = json.dumps(items_list)
        
        # Create invoice record
        execute_query("""
            INSERT INTO invoices (invoice_number, contract_id, from_user_id, to_user_id, 
                                  subtotal, total, status, items, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, 'due', ?, ?, ?)
        """, [invoice_number, contract_id, freelancer_id, client_id, 
              total_amount, total_amount, items_json, now, now])
              
        # Notify freelancer
        _send_notification_turso(
            user_id=freelancer_id,
            notification_type="invoice",
            title="Time Entries Approved",
            content=f"Client approved {len(rows)} time entries. Invoice {invoice_number} generated.",
            data={"contract_id": contract_id, "amount": total_amount, "invoice_number": invoice_number},
            priority="high",
            action_url=f"/contracts/{contract_id}/invoices"
        )
        
    return {"message": f"Approved {len(rows)} entries", "invoice_amount": total_amount}


@router.post("/reject", status_code=status.HTTP_200_OK)
async def reject_time_entries(
    review: TimeEntryReview,
    current_user = Depends(get_current_user)
):
    """
    Reject time entries
    - Only client can reject
    - Returns entries to 'rejected' status (or 'draft'?) -> usually rejected so they can be fixed or deleted
    """
    if not review.time_entry_ids:
        raise HTTPException(status_code=400, detail="No time entries provided")
    
    if not review.rejection_reason:
        raise HTTPException(status_code=400, detail="Rejection reason is required")
        
    placeholders = ",".join(["?" for _ in review.time_entry_ids])
    query = f"""
        SELECT id, contract_id, status, user_id
        FROM time_entries 
        WHERE id IN ({placeholders})
    """
    
    result = execute_query(query, review.time_entry_ids)
    
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Time entries not found")
        
    rows = result["rows"]
    contract_ids = set()
    freelancer_id = None
    
    for row in rows:
        contract_id = row[1].get("value")
        status_val = to_str(row[2])
        f_id = row[3].get("value")
        
        if freelancer_id is None:
            freelancer_id = f_id
        
        if status_val != "submitted":
            raise HTTPException(status_code=400, detail=f"Entry {row[0].get('value')} is not submitted")
            
        contract_ids.add(contract_id)
        
    if len(contract_ids) > 1:
        raise HTTPException(status_code=400, detail="Cannot reject entries from multiple contracts at once")
        
    contract_id = list(contract_ids)[0]
    
    # Verify client ownership
    contract_res = execute_query("SELECT client_id FROM contracts WHERE id = ?", [contract_id])
    if not contract_res or not contract_res.get("rows"):
        raise HTTPException(status_code=404, detail="Contract not found")
        
    client_id = contract_res["rows"][0][0].get("value")
    if client_id != current_user["id"]:
        raise HTTPException(status_code=403, detail="Only contract client can reject time entries")
        
    # Update status
    now = datetime.utcnow().isoformat()
    execute_query(
        f"UPDATE time_entries SET status = 'rejected', updated_at = ? WHERE id IN ({placeholders})",
        [now] + review.time_entry_ids
    )
    
    # Notify freelancer
    _send_notification_turso(
        user_id=freelancer_id,
        notification_type="timesheet",
        title="Time Entries Rejected",
        content=f"Client rejected {len(rows)} time entries: {review.rejection_reason}",
        data={"contract_id": contract_id, "reason": review.rejection_reason},
        priority="high",
        action_url=f"/contracts/{contract_id}/timesheet"
    )
    
    return {"message": f"Rejected {len(rows)} entries"}

