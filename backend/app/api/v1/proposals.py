# @AI-HINT: Proposals API - CRUD for freelancer proposals on projects
# Uses Turso HTTP API directly - NO SQLite fallback
# Enhanced with input validation and security measures

from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List, Optional
from datetime import datetime
import re

from app.core.security import get_current_active_user
from app.db.turso_http import execute_query, to_str, parse_date
from app.models.user import User
from app.schemas.proposal import ProposalCreate, ProposalRead, ProposalUpdate

router = APIRouter()

# === Input Validation Constants ===
MAX_COVER_LETTER_LENGTH = 5000
MAX_AVAILABILITY_LENGTH = 500
MAX_ATTACHMENTS_LENGTH = 2000
MAX_BID_AMOUNT = 1000000  # $1M max
MAX_HOURLY_RATE = 1000    # $1000/hr max
MAX_ESTIMATED_HOURS = 10000  # 10,000 hours max
VALID_PROPOSAL_STATUSES = {"draft", "submitted", "accepted", "rejected", "withdrawn"}


def _validate_proposal_input(proposal) -> None:
    """Validate proposal input fields"""
    if proposal.cover_letter and len(proposal.cover_letter) > MAX_COVER_LETTER_LENGTH:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cover letter exceeds maximum length of {MAX_COVER_LETTER_LENGTH} characters"
        )
    
    if proposal.availability and len(proposal.availability) > MAX_AVAILABILITY_LENGTH:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Availability exceeds maximum length of {MAX_AVAILABILITY_LENGTH} characters"
        )
    
    if proposal.attachments and len(proposal.attachments) > MAX_ATTACHMENTS_LENGTH:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Attachments field exceeds maximum length of {MAX_ATTACHMENTS_LENGTH} characters"
        )
    
    if proposal.bid_amount is not None:
        if proposal.bid_amount < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Bid amount cannot be negative"
            )
        if proposal.bid_amount > MAX_BID_AMOUNT:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Bid amount exceeds maximum of ${MAX_BID_AMOUNT:,}"
            )
    
    if proposal.hourly_rate is not None:
        if proposal.hourly_rate < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Hourly rate cannot be negative"
            )
        if proposal.hourly_rate > MAX_HOURLY_RATE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Hourly rate exceeds maximum of ${MAX_HOURLY_RATE}/hr"
            )
    
    if proposal.estimated_hours is not None:
        if proposal.estimated_hours < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Estimated hours cannot be negative"
            )
        if proposal.estimated_hours > MAX_ESTIMATED_HOURS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Estimated hours exceeds maximum of {MAX_ESTIMATED_HOURS:,} hours"
            )


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


def _proposal_from_row(row: list) -> dict:
    """Convert Turso row to proposal dict"""
    data = {
        "id": int(_get_val(row, 0) or 0),
        "project_id": int(_get_val(row, 1) or 0),
        "freelancer_id": int(_get_val(row, 2) or 0),
        "cover_letter": _safe_str(_get_val(row, 3)),
        "bid_amount": float(_get_val(row, 4) or 0),
        "estimated_hours": float(_get_val(row, 5) or 0),
        "hourly_rate": float(_get_val(row, 6) or 0),
        "availability": _safe_str(_get_val(row, 7)),
        "attachments": _safe_str(_get_val(row, 8)),
        "status": _safe_str(_get_val(row, 9)),
        "is_draft": bool(_get_val(row, 10)),
        "created_at": parse_date(_get_val(row, 11)),
        "updated_at": parse_date(_get_val(row, 12))
    }
    
    # Optional fields from joins
    if len(row) > 13:
        data["job_title"] = _safe_str(_get_val(row, 13))
    if len(row) > 14:
        data["client_name"] = _safe_str(_get_val(row, 14))
        
    return data


@router.get("/drafts", response_model=List[ProposalRead])
def list_draft_proposals(
    project_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_active_user)
):
    """Get all draft proposals for the current user"""
    where_sql = "WHERE p.freelancer_id = ? AND p.is_draft = 1"
    params = [current_user.id]
    
    if project_id:
        where_sql += " AND p.project_id = ?"
        params.append(project_id)
    
    # Join with projects to get title
    result = execute_query(
        f"""SELECT p.id, p.project_id, p.freelancer_id, p.cover_letter, p.bid_amount,
            p.estimated_hours, p.hourly_rate, p.availability, p.attachments, p.status,
            p.is_draft, p.created_at, p.updated_at,
            pr.title as job_title
            FROM proposals p
            LEFT JOIN projects pr ON p.project_id = pr.id
            {where_sql}""",
        params
    )
    
    drafts = []
    if result and result.get("rows"):
        for row in result["rows"]:
            drafts.append(_proposal_from_row(row))
    
    return drafts


@router.post("/draft", response_model=ProposalRead, status_code=status.HTTP_201_CREATED)
def create_draft_proposal(
    proposal: ProposalCreate,
    current_user: User = Depends(get_current_active_user)
):
    """Save a proposal as draft"""
    user_type = _safe_str(current_user.user_type)
    if not user_type or user_type.lower() != "freelancer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only freelancers can create proposals"
        )
    
    # Validate input
    _validate_proposal_input(proposal)
    
    # Check if project exists
    result = execute_query("SELECT id FROM projects WHERE id = ?", [proposal.project_id])
    if not result or not result.get("rows"):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    
    now = datetime.utcnow().isoformat()
    
    insert_result = execute_query(
        """INSERT INTO proposals (project_id, freelancer_id, cover_letter, bid_amount,
           estimated_hours, hourly_rate, availability, attachments, status, is_draft,
           created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        [
            proposal.project_id,
            current_user.id,
            proposal.cover_letter or "",
            proposal.bid_amount or 0,
            proposal.estimated_hours or 0,
            proposal.hourly_rate or 0,
            proposal.availability or "",
            proposal.attachments or "",
            "draft",
            1,
            now,
            now
        ]
    )
    
    if not insert_result:
        raise HTTPException(status_code=500, detail="Failed to create draft proposal")
    
    # Get created proposal
    result = execute_query(
        """SELECT id, project_id, freelancer_id, cover_letter, bid_amount,
           estimated_hours, hourly_rate, availability, attachments, status,
           is_draft, created_at, updated_at
           FROM proposals WHERE freelancer_id = ? AND project_id = ? AND is_draft = 1
           ORDER BY id DESC LIMIT 1""",
        [current_user.id, proposal.project_id]
    )
    
    if result and result.get("rows"):
        return _proposal_from_row(result["rows"][0])
    
    raise HTTPException(status_code=500, detail="Failed to retrieve draft proposal")


@router.get("/", response_model=List[ProposalRead])
def list_proposals(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    project_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user)
):
    """List proposals for current user"""
    user_type = _safe_str(current_user.user_type)
    
    if user_type and user_type.lower() == "freelancer":
        where_sql = "WHERE p.freelancer_id = ?"
        params = [current_user.id]
    else:
        # Get all project IDs for this client
        proj_result = execute_query(
            "SELECT id FROM projects WHERE client_id = ?",
            [current_user.id]
        )
        project_ids = []
        if proj_result and proj_result.get("rows"):
            project_ids = [int(_get_val(row, 0) or 0) for row in proj_result["rows"]]
        
        if not project_ids:
            return []
        
        placeholders = ",".join(["?" for _ in project_ids])
        where_sql = f"WHERE p.project_id IN ({placeholders})"
        params = project_ids
    
    if project_id:
        where_sql += " AND p.project_id = ?"
        params.append(project_id)
    
    if status:
        where_sql += " AND p.status = ?"
        params.append(status)
    
    params.extend([limit, skip])
    
    # Join with projects and users to get job title and client name
    result = execute_query(
        f"""SELECT p.id, p.project_id, p.freelancer_id, p.cover_letter, p.bid_amount,
            p.estimated_hours, p.hourly_rate, p.availability, p.attachments, p.status,
            p.is_draft, p.created_at, p.updated_at,
            pr.title as job_title, u.full_name as client_name
            FROM proposals p
            LEFT JOIN projects pr ON p.project_id = pr.id
            LEFT JOIN users u ON pr.client_id = u.id
            {where_sql}
            ORDER BY p.created_at DESC
            LIMIT ? OFFSET ?""",
        params
    )
    
    proposals = []
    if result and result.get("rows"):
        for row in result["rows"]:
            proposals.append(_proposal_from_row(row))
    
    return proposals


@router.get("/{proposal_id}", response_model=ProposalRead)
def get_proposal(
    proposal_id: int,
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific proposal"""
    # Join to get job title and client name
    result = execute_query(
        """SELECT p.id, p.project_id, p.freelancer_id, p.cover_letter, p.bid_amount,
           p.estimated_hours, p.hourly_rate, p.availability, p.attachments, p.status,
           p.is_draft, p.created_at, p.updated_at,
           pr.title as job_title, u.full_name as client_name
           FROM proposals p
           LEFT JOIN projects pr ON p.project_id = pr.id
           LEFT JOIN users u ON pr.client_id = u.id
           WHERE p.id = ?""",
        [proposal_id]
    )
    
    if not result or not result.get("rows"):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proposal not found")
    
    row = result["rows"][0]
    freelancer_id = int(_get_val(row, 2) or 0)
    project_id = int(_get_val(row, 1) or 0)
    
    is_proposal_owner = freelancer_id == current_user.id
    
    # Check if user is project owner
    proj_result = execute_query("SELECT client_id FROM projects WHERE id = ?", [project_id])
    is_project_owner = False
    if proj_result and proj_result.get("rows"):
        client_id = int(_get_val(proj_result["rows"][0], 0) or 0)
        is_project_owner = client_id == current_user.id
    
    if not is_proposal_owner and not is_project_owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this proposal"
        )
    
    return _proposal_from_row(row)


@router.post("/", response_model=ProposalRead, status_code=status.HTTP_201_CREATED)
def create_proposal(
    proposal: ProposalCreate,
    current_user: User = Depends(get_current_active_user)
):
    """Create a new proposal"""
    user_type = _safe_str(current_user.user_type)
    if not user_type or user_type.lower() != "freelancer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only freelancers can submit proposals"
        )
    
    # Validate input
    _validate_proposal_input(proposal)
    
    # Validate cover letter is not empty for submission
    if not proposal.cover_letter or len(proposal.cover_letter.strip()) < 50:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cover letter must be at least 50 characters"
        )
    
    # Check if project exists and is open
    result = execute_query("SELECT id, status FROM projects WHERE id = ?", [proposal.project_id])
    if not result or not result.get("rows"):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    
    project_status = _safe_str(_get_val(result["rows"][0], 1))
    if project_status != "open":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Project is not open for proposals"
        )
    
    # Check if already submitted
    result = execute_query(
        "SELECT id FROM proposals WHERE project_id = ? AND freelancer_id = ? AND is_draft = 0",
        [proposal.project_id, current_user.id]
    )
    if result and result.get("rows"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already submitted a proposal for this project"
        )
    
    now = datetime.utcnow().isoformat()
    bid_amount = proposal.bid_amount or (proposal.estimated_hours * proposal.hourly_rate)
    
    insert_result = execute_query(
        """INSERT INTO proposals (project_id, freelancer_id, cover_letter, bid_amount,
           estimated_hours, hourly_rate, availability, attachments, status, is_draft,
           created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        [
            proposal.project_id,
            current_user.id,
            proposal.cover_letter or "",
            bid_amount,
            proposal.estimated_hours or 0,
            proposal.hourly_rate or 0,
            proposal.availability or "",
            proposal.attachments or "",
            "submitted",
            0,
            now,
            now
        ]
    )
    
    if not insert_result:
        raise HTTPException(status_code=500, detail="Failed to create proposal")
    
    # Get created proposal
    result = execute_query(
        """SELECT id, project_id, freelancer_id, cover_letter, bid_amount,
           estimated_hours, hourly_rate, availability, attachments, status,
           is_draft, created_at, updated_at
           FROM proposals WHERE freelancer_id = ? AND project_id = ? AND is_draft = 0
           ORDER BY id DESC LIMIT 1""",
        [current_user.id, proposal.project_id]
    )
    
    if result and result.get("rows"):
        return _proposal_from_row(result["rows"][0])
    
    raise HTTPException(status_code=500, detail="Failed to retrieve created proposal")


@router.put("/{proposal_id}", response_model=ProposalRead)
def update_proposal(
    proposal_id: int,
    proposal: ProposalUpdate,
    current_user: User = Depends(get_current_active_user)
):
    """Update a proposal"""
    # Get existing proposal
    result = execute_query(
        """SELECT id, project_id, freelancer_id, cover_letter, bid_amount,
           estimated_hours, hourly_rate, availability, attachments, status,
           is_draft, created_at, updated_at
           FROM proposals WHERE id = ?""",
        [proposal_id]
    )
    
    if not result or not result.get("rows"):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proposal not found")
    
    row = result["rows"][0]
    freelancer_id = int(_get_val(row, 2) or 0)
    prop_status = _safe_str(_get_val(row, 9))
    
    if freelancer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this proposal"
        )
    
    if prop_status != "submitted":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot update proposal that is not in submitted status"
        )
    
    update_data = proposal.model_dump(exclude_unset=True, exclude_none=True)
    
    if not update_data:
        return _proposal_from_row(row)
    
    # Build update query
    set_parts = []
    values = []
    for key, value in update_data.items():
        set_parts.append(f"{key} = ?")
        values.append(value if value is not None else "")
    
    set_parts.append("updated_at = ?")
    values.append(datetime.utcnow().isoformat())
    values.append(proposal_id)
    
    execute_query(
        f"UPDATE proposals SET {', '.join(set_parts)} WHERE id = ?",
        values
    )
    
    # Fetch updated proposal
    result = execute_query(
        """SELECT id, project_id, freelancer_id, cover_letter, bid_amount,
           estimated_hours, hourly_rate, availability, attachments, status,
           is_draft, created_at, updated_at
           FROM proposals WHERE id = ?""",
        [proposal_id]
    )
    
    if result and result.get("rows"):
        return _proposal_from_row(result["rows"][0])
    
    raise HTTPException(status_code=500, detail="Failed to retrieve updated proposal")


@router.delete("/{proposal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_proposal(
    proposal_id: int,
    current_user: User = Depends(get_current_active_user)
):
    """Delete a proposal"""
    result = execute_query(
        "SELECT id, freelancer_id, status FROM proposals WHERE id = ?",
        [proposal_id]
    )
    
    if not result or not result.get("rows"):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proposal not found")
    
    freelancer_id = int(_get_val(result["rows"][0], 1) or 0)
    prop_status = _safe_str(_get_val(result["rows"][0], 2))
    
    if freelancer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this proposal"
        )
    
    if prop_status != "submitted":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete proposal that is not in submitted status"
        )
    
    execute_query("DELETE FROM proposals WHERE id = ?", [proposal_id])
    return


@router.post("/{proposal_id}/accept", response_model=ProposalRead)
def accept_proposal(
    proposal_id: int,
    current_user: User = Depends(get_current_active_user)
):
    """Client accepts a proposal"""
    result = execute_query(
        """SELECT id, project_id, freelancer_id, cover_letter, bid_amount,
           estimated_hours, hourly_rate, availability, attachments, status,
           is_draft, created_at, updated_at
           FROM proposals WHERE id = ?""",
        [proposal_id]
    )
    
    if not result or not result.get("rows"):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proposal not found")
    
    row = result["rows"][0]
    project_id = int(_get_val(row, 1) or 0)
    prop_status = _safe_str(_get_val(row, 9))
    
    # Check if user is project owner
    proj_result = execute_query("SELECT client_id FROM projects WHERE id = ?", [project_id])
    if not proj_result or not proj_result.get("rows"):
        raise HTTPException(status_code=404, detail="Project not found")
    
    client_id = int(_get_val(proj_result["rows"][0], 0) or 0)
    if client_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the project owner can accept proposals"
        )
    
    if prop_status != "submitted":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Proposal is not in submitted status"
        )
    
    now = datetime.utcnow().isoformat()
    
    # Accept proposal
    execute_query(
        "UPDATE proposals SET status = ?, updated_at = ? WHERE id = ?",
        ["accepted", now, proposal_id]
    )
    
    # Update project status
    execute_query(
        "UPDATE projects SET status = ?, updated_at = ? WHERE id = ?",
        ["in_progress", now, project_id]
    )
    
    # Reject other proposals
    execute_query(
        "UPDATE proposals SET status = ?, updated_at = ? WHERE project_id = ? AND id != ? AND status = ?",
        ["rejected", now, project_id, proposal_id, "submitted"]
    )
    
    # Return updated proposal
    result = execute_query(
        """SELECT id, project_id, freelancer_id, cover_letter, bid_amount,
           estimated_hours, hourly_rate, availability, attachments, status,
           is_draft, created_at, updated_at
           FROM proposals WHERE id = ?""",
        [proposal_id]
    )
    
    if result and result.get("rows"):
        return _proposal_from_row(result["rows"][0])
    
    raise HTTPException(status_code=500, detail="Failed to retrieve updated proposal")


@router.post("/{proposal_id}/reject", response_model=ProposalRead)
def reject_proposal(
    proposal_id: int,
    current_user: User = Depends(get_current_active_user)
):
    """Client rejects a proposal"""
    result = execute_query(
        """SELECT id, project_id, freelancer_id, cover_letter, bid_amount,
           estimated_hours, hourly_rate, availability, attachments, status,
           is_draft, created_at, updated_at
           FROM proposals WHERE id = ?""",
        [proposal_id]
    )
    
    if not result or not result.get("rows"):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proposal not found")
    
    row = result["rows"][0]
    project_id = int(_get_val(row, 1) or 0)
    prop_status = _safe_str(_get_val(row, 9))
    
    # Check if user is project owner
    proj_result = execute_query("SELECT client_id FROM projects WHERE id = ?", [project_id])
    if not proj_result or not proj_result.get("rows"):
        raise HTTPException(status_code=404, detail="Project not found")
    
    client_id = int(_get_val(proj_result["rows"][0], 0) or 0)
    if client_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the project owner can reject proposals"
        )
    
    if prop_status != "submitted":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Proposal is not in submitted status"
        )
    
    now = datetime.utcnow().isoformat()
    
    # Reject proposal
    execute_query(
        "UPDATE proposals SET status = ?, updated_at = ? WHERE id = ?",
        ["rejected", now, proposal_id]
    )
    
    # Return updated proposal
    result = execute_query(
        """SELECT id, project_id, freelancer_id, cover_letter, bid_amount,
           estimated_hours, hourly_rate, availability, attachments, status,
           is_draft, created_at, updated_at
           FROM proposals WHERE id = ?""",
        [proposal_id]
    )
    
    if result and result.get("rows"):
        return _proposal_from_row(result["rows"][0])
    
    raise HTTPException(status_code=500, detail="Failed to retrieve updated proposal")
