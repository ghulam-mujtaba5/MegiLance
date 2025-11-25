"""
@AI-HINT: Client and Freelancer portal endpoints - dashboards, projects, proposals
Uses Turso HTTP API directly - NO SQLite fallback
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional
from datetime import datetime
import json

from app.core.security import get_current_active_user
from app.db.turso_http import execute_query, to_str, parse_date
from app.models.user import User
from pydantic import BaseModel

router = APIRouter()


# ============ Pydantic Schemas ============

class ClientDashboardStats(BaseModel):
    total_projects: int
    active_projects: int
    completed_projects: int
    total_spent: float
    active_freelancers: int
    pending_proposals: int

class FreelancerDashboardStats(BaseModel):
    total_earnings: float
    active_projects: int
    completed_projects: int
    pending_proposals: int
    success_rate: float
    average_rating: Optional[float]


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


# ============ Helper Functions ============

async def get_client_user(current_user: User = Depends(get_current_active_user)):
    """Verify that current user is a client"""
    user_type = _safe_str(current_user.user_type)
    if user_type not in ['Client', 'client']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Client access required"
        )
    return current_user

async def get_freelancer_user(current_user: User = Depends(get_current_active_user)):
    """Verify that current user is a freelancer"""
    user_type = _safe_str(current_user.user_type)
    if user_type not in ['Freelancer', 'freelancer']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Freelancer access required"
        )
    return current_user


# ============ CLIENT PORTAL ENDPOINTS ============

@router.get("/client/dashboard/stats", response_model=ClientDashboardStats)
async def get_client_dashboard_stats(client: User = Depends(get_client_user)):
    """Get client dashboard statistics"""
    total_projects = 0
    active_projects = 0
    completed_projects = 0
    total_spent = 0.0
    active_freelancers = 0
    pending_proposals = 0
    
    result = execute_query(
        "SELECT COUNT(*) FROM projects WHERE client_id = ?", [client.id]
    )
    if result and result.get("rows"):
        total_projects = int(_get_val(result["rows"][0], 0) or 0)
    
    result = execute_query(
        "SELECT COUNT(*) FROM projects WHERE client_id = ? AND status IN ('open', 'in_progress')",
        [client.id]
    )
    if result and result.get("rows"):
        active_projects = int(_get_val(result["rows"][0], 0) or 0)
    
    result = execute_query(
        "SELECT COUNT(*) FROM projects WHERE client_id = ? AND status = 'completed'",
        [client.id]
    )
    if result and result.get("rows"):
        completed_projects = int(_get_val(result["rows"][0], 0) or 0)
    
    result = execute_query(
        "SELECT COALESCE(SUM(amount), 0) FROM payments WHERE from_user_id = ? AND status = 'completed'",
        [client.id]
    )
    if result and result.get("rows"):
        total_spent = float(_get_val(result["rows"][0], 0) or 0)
    
    result = execute_query(
        "SELECT COUNT(DISTINCT freelancer_id) FROM contracts WHERE client_id = ? AND status IN ('active', 'in_progress')",
        [client.id]
    )
    if result and result.get("rows"):
        active_freelancers = int(_get_val(result["rows"][0], 0) or 0)
    
    result = execute_query(
        """SELECT COUNT(*) FROM proposals pr
           JOIN projects p ON pr.project_id = p.id
           WHERE p.client_id = ? AND pr.status = 'submitted'""",
        [client.id]
    )
    if result and result.get("rows"):
        pending_proposals = int(_get_val(result["rows"][0], 0) or 0)
    
    return ClientDashboardStats(
        total_projects=total_projects,
        active_projects=active_projects,
        completed_projects=completed_projects,
        total_spent=total_spent,
        active_freelancers=active_freelancers,
        pending_proposals=pending_proposals
    )


@router.get("/client/projects")
async def get_client_projects(
    status: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    client: User = Depends(get_client_user)
):
    """Get client's projects"""
    where_sql = "WHERE client_id = ?"
    params = [client.id]
    
    if status:
        where_sql += " AND status = ?"
        params.append(status)
    
    # Get total
    count_result = execute_query(f"SELECT COUNT(*) FROM projects {where_sql}", params)
    total = 0
    if count_result and count_result.get("rows"):
        total = int(_get_val(count_result["rows"][0], 0) or 0)
    
    # Get projects
    params.extend([limit, skip])
    result = execute_query(
        f"""SELECT id, title, description, status, budget_min, budget_max, created_at, updated_at
            FROM projects {where_sql}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?""",
        params
    )
    
    projects = []
    if result and result.get("rows"):
        for row in result["rows"]:
            projects.append({
                "id": int(_get_val(row, 0) or 0),
                "title": _safe_str(_get_val(row, 1)),
                "description": _safe_str(_get_val(row, 2)),
                "status": _safe_str(_get_val(row, 3)),
                "budget_min": float(_get_val(row, 4) or 0),
                "budget_max": float(_get_val(row, 5) or 0),
                "created_at": parse_date(_get_val(row, 6)),
                "updated_at": parse_date(_get_val(row, 7))
            })
    
    return {"total": total, "projects": projects}


@router.post("/client/projects", status_code=status.HTTP_201_CREATED)
async def create_client_project(
    title: str,
    description: str,
    budget: float,
    skills: list,
    client: User = Depends(get_client_user)
):
    """Create a new project"""
    now = datetime.utcnow().isoformat()
    
    result = execute_query(
        """INSERT INTO projects (title, description, client_id, budget_min, budget_max, 
           budget_type, status, skills, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        [
            title,
            description,
            client.id,
            budget * 0.8,
            budget,
            "fixed",
            "open",
            json.dumps(skills),
            now,
            now
        ]
    )
    
    if not result:
        raise HTTPException(status_code=500, detail="Failed to create project")
    
    # Get the created project
    get_result = execute_query(
        "SELECT id, title, status FROM projects WHERE client_id = ? ORDER BY id DESC LIMIT 1",
        [client.id]
    )
    
    project_id = 0
    if get_result and get_result.get("rows"):
        project_id = int(_get_val(get_result["rows"][0], 0) or 0)
    
    return {
        "id": project_id,
        "title": title,
        "status": "open",
        "message": "Project created successfully"
    }


@router.get("/client/proposals")
async def get_client_proposals(
    project_id: Optional[int] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    client: User = Depends(get_client_user)
):
    """Get proposals for client's projects"""
    where_sql = "WHERE p.client_id = ?"
    params = [client.id]
    
    if project_id:
        where_sql += " AND pr.project_id = ?"
        params.append(project_id)
    
    # Get total
    count_result = execute_query(
        f"""SELECT COUNT(*) FROM proposals pr
            JOIN projects p ON pr.project_id = p.id
            {where_sql}""",
        params
    )
    total = 0
    if count_result and count_result.get("rows"):
        total = int(_get_val(count_result["rows"][0], 0) or 0)
    
    # Get proposals
    params.extend([limit, skip])
    result = execute_query(
        f"""SELECT pr.id, pr.project_id, pr.freelancer_id, pr.status, 
            pr.estimated_hours, pr.hourly_rate, pr.created_at
            FROM proposals pr
            JOIN projects p ON pr.project_id = p.id
            {where_sql}
            ORDER BY pr.created_at DESC
            LIMIT ? OFFSET ?""",
        params
    )
    
    proposals = []
    if result and result.get("rows"):
        for row in result["rows"]:
            proposals.append({
                "id": int(_get_val(row, 0) or 0),
                "project_id": int(_get_val(row, 1) or 0),
                "freelancer_id": int(_get_val(row, 2) or 0),
                "status": _safe_str(_get_val(row, 3)),
                "estimated_hours": float(_get_val(row, 4) or 0),
                "hourly_rate": float(_get_val(row, 5) or 0),
                "created_at": parse_date(_get_val(row, 6))
            })
    
    return {"total": total, "proposals": proposals}


@router.get("/client/payments")
async def get_client_payments(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    client: User = Depends(get_client_user)
):
    """Get client's payment history"""
    # Get total
    count_result = execute_query(
        "SELECT COUNT(*) FROM payments WHERE from_user_id = ?",
        [client.id]
    )
    total = 0
    if count_result and count_result.get("rows"):
        total = int(_get_val(count_result["rows"][0], 0) or 0)
    
    # Get payments
    result = execute_query(
        """SELECT id, amount, status, payment_type, description, created_at
           FROM payments
           WHERE from_user_id = ?
           ORDER BY created_at DESC
           LIMIT ? OFFSET ?""",
        [client.id, limit, skip]
    )
    
    payments = []
    if result and result.get("rows"):
        for row in result["rows"]:
            payments.append({
                "id": int(_get_val(row, 0) or 0),
                "amount": float(_get_val(row, 1) or 0),
                "status": _safe_str(_get_val(row, 2)),
                "payment_type": _safe_str(_get_val(row, 3)),
                "description": _safe_str(_get_val(row, 4)),
                "created_at": parse_date(_get_val(row, 5))
            })
    
    return {"total": total, "payments": payments}


@router.get("/client/wallet")
async def get_client_wallet(client: User = Depends(get_client_user)):
    """Get client's wallet balance and transactions"""
    pending_payments = 0.0
    total_spent = 0.0
    
    result = execute_query(
        "SELECT COALESCE(SUM(amount), 0) FROM payments WHERE from_user_id = ? AND status = 'pending'",
        [client.id]
    )
    if result and result.get("rows"):
        pending_payments = float(_get_val(result["rows"][0], 0) or 0)
    
    result = execute_query(
        "SELECT COALESCE(SUM(amount), 0) FROM payments WHERE from_user_id = ? AND status = 'completed'",
        [client.id]
    )
    if result and result.get("rows"):
        total_spent = float(_get_val(result["rows"][0], 0) or 0)
    
    return {
        "balance": float(client.account_balance or 0.0) if hasattr(client, 'account_balance') else 0.0,
        "currency": "USD",
        "pending_payments": pending_payments,
        "total_spent": total_spent
    }


# ============ FREELANCER PORTAL ENDPOINTS ============

@router.get("/freelancer/dashboard/stats", response_model=FreelancerDashboardStats)
async def get_freelancer_dashboard_stats(freelancer: User = Depends(get_freelancer_user)):
    """Get freelancer dashboard statistics"""
    total_earnings = 0.0
    active_projects = 0
    completed_projects = 0
    pending_proposals = 0
    total_proposals = 0
    avg_rating = None
    
    result = execute_query(
        "SELECT COALESCE(SUM(amount), 0) FROM payments WHERE to_user_id = ? AND status = 'completed'",
        [freelancer.id]
    )
    if result and result.get("rows"):
        total_earnings = float(_get_val(result["rows"][0], 0) or 0)
    
    result = execute_query(
        "SELECT COUNT(*) FROM contracts WHERE freelancer_id = ? AND status IN ('active', 'in_progress')",
        [freelancer.id]
    )
    if result and result.get("rows"):
        active_projects = int(_get_val(result["rows"][0], 0) or 0)
    
    result = execute_query(
        "SELECT COUNT(*) FROM contracts WHERE freelancer_id = ? AND status = 'completed'",
        [freelancer.id]
    )
    if result and result.get("rows"):
        completed_projects = int(_get_val(result["rows"][0], 0) or 0)
    
    result = execute_query(
        "SELECT COUNT(*) FROM proposals WHERE freelancer_id = ? AND status = 'submitted'",
        [freelancer.id]
    )
    if result and result.get("rows"):
        pending_proposals = int(_get_val(result["rows"][0], 0) or 0)
    
    result = execute_query(
        "SELECT COUNT(*) FROM proposals WHERE freelancer_id = ?",
        [freelancer.id]
    )
    if result and result.get("rows"):
        total_proposals = int(_get_val(result["rows"][0], 0) or 0)
    
    success_rate = (completed_projects / total_proposals * 100) if total_proposals > 0 else 0.0
    
    # Get average rating
    result = execute_query(
        "SELECT AVG(rating) FROM reviews WHERE reviewee_id = ?",
        [freelancer.id]
    )
    if result and result.get("rows"):
        rating_val = _get_val(result["rows"][0], 0)
        if rating_val:
            avg_rating = round(float(rating_val), 2)
    
    return FreelancerDashboardStats(
        total_earnings=total_earnings,
        active_projects=active_projects,
        completed_projects=completed_projects,
        pending_proposals=pending_proposals,
        success_rate=round(success_rate, 2),
        average_rating=avg_rating
    )


@router.get("/freelancer/jobs")
async def get_freelancer_jobs(
    category: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    freelancer: User = Depends(get_freelancer_user)
):
    """Get available jobs for freelancer"""
    where_sql = "WHERE status = 'open'"
    params = []
    
    if category:
        where_sql += " AND category LIKE ?"
        params.append(f"%{category}%")
    
    # Get total
    count_result = execute_query(f"SELECT COUNT(*) FROM projects {where_sql}", params)
    total = 0
    if count_result and count_result.get("rows"):
        total = int(_get_val(count_result["rows"][0], 0) or 0)
    
    # Get jobs
    params.extend([limit, skip])
    result = execute_query(
        f"""SELECT id, title, description, budget_min, budget_max, created_at
            FROM projects {where_sql}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?""",
        params
    )
    
    jobs = []
    if result and result.get("rows"):
        for row in result["rows"]:
            jobs.append({
                "id": int(_get_val(row, 0) or 0),
                "title": _safe_str(_get_val(row, 1)),
                "description": _safe_str(_get_val(row, 2)),
                "budget_min": float(_get_val(row, 3) or 0),
                "budget_max": float(_get_val(row, 4) or 0),
                "created_at": parse_date(_get_val(row, 5))
            })
    
    return {"total": total, "jobs": jobs}


@router.get("/freelancer/projects")
async def get_freelancer_projects(
    status: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    freelancer: User = Depends(get_freelancer_user)
):
    """Get freelancer's active contracts/projects"""
    where_sql = "WHERE freelancer_id = ?"
    params = [freelancer.id]
    
    if status:
        where_sql += " AND status = ?"
        params.append(status)
    
    # Get total
    count_result = execute_query(f"SELECT COUNT(*) FROM contracts {where_sql}", params)
    total = 0
    if count_result and count_result.get("rows"):
        total = int(_get_val(count_result["rows"][0], 0) or 0)
    
    # Get contracts
    params.extend([limit, skip])
    result = execute_query(
        f"""SELECT id, project_id, status, start_date, end_date, total_amount, created_at
            FROM contracts {where_sql}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?""",
        params
    )
    
    projects = []
    if result and result.get("rows"):
        for row in result["rows"]:
            projects.append({
                "id": int(_get_val(row, 0) or 0),
                "project_id": int(_get_val(row, 1) or 0),
                "status": _safe_str(_get_val(row, 2)),
                "start_date": parse_date(_get_val(row, 3)),
                "end_date": parse_date(_get_val(row, 4)),
                "total_amount": float(_get_val(row, 5) or 0)
            })
    
    return {"total": total, "projects": projects}


@router.post("/freelancer/proposals", status_code=status.HTTP_201_CREATED)
async def submit_freelancer_proposal(
    project_id: int,
    cover_letter: str,
    bid_amount: float,
    delivery_time: int,
    freelancer: User = Depends(get_freelancer_user)
):
    """Submit a proposal for a project"""
    # Check if project exists
    result = execute_query("SELECT id FROM projects WHERE id = ?", [project_id])
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Check if already submitted proposal
    result = execute_query(
        "SELECT id FROM proposals WHERE project_id = ? AND freelancer_id = ?",
        [project_id, freelancer.id]
    )
    if result and result.get("rows"):
        raise HTTPException(status_code=400, detail="Proposal already submitted for this project")
    
    now = datetime.utcnow().isoformat()
    hourly_rate = bid_amount / delivery_time if delivery_time > 0 else float(freelancer.hourly_rate or 0)
    
    result = execute_query(
        """INSERT INTO proposals (project_id, freelancer_id, cover_letter, estimated_hours, 
           hourly_rate, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        [
            project_id,
            freelancer.id,
            cover_letter,
            delivery_time,
            hourly_rate,
            "submitted",
            now,
            now
        ]
    )
    
    if not result:
        raise HTTPException(status_code=500, detail="Failed to submit proposal")
    
    # Get created proposal
    get_result = execute_query(
        "SELECT id FROM proposals WHERE project_id = ? AND freelancer_id = ? ORDER BY id DESC LIMIT 1",
        [project_id, freelancer.id]
    )
    
    proposal_id = 0
    if get_result and get_result.get("rows"):
        proposal_id = int(_get_val(get_result["rows"][0], 0) or 0)
    
    return {
        "id": proposal_id,
        "project_id": project_id,
        "status": "submitted",
        "message": "Proposal submitted successfully"
    }


@router.get("/freelancer/portfolio")
async def get_freelancer_portfolio(freelancer: User = Depends(get_freelancer_user)):
    """Get freelancer's portfolio items"""
    result = execute_query(
        """SELECT id, title, description, image_url, project_url, created_at
           FROM portfolio_items
           WHERE freelancer_id = ?
           ORDER BY created_at DESC""",
        [freelancer.id]
    )
    
    items = []
    if result and result.get("rows"):
        for row in result["rows"]:
            items.append({
                "id": int(_get_val(row, 0) or 0),
                "title": _safe_str(_get_val(row, 1)),
                "description": _safe_str(_get_val(row, 2)),
                "image_url": _safe_str(_get_val(row, 3)),
                "project_url": _safe_str(_get_val(row, 4)),
                "created_at": parse_date(_get_val(row, 5))
            })
    
    return {"portfolio_items": items}


@router.get("/freelancer/skills")
async def get_freelancer_skills(freelancer: User = Depends(get_freelancer_user)):
    """Get freelancer's skills"""
    skills_data = []
    skills_str = _safe_str(freelancer.skills)
    if skills_str:
        try:
            skills_data = json.loads(skills_str)
        except json.JSONDecodeError:
            skills_data = [s.strip() for s in skills_str.split(",") if s.strip()]
    
    return {
        "skills": skills_data,
        "hourly_rate": float(freelancer.hourly_rate or 0.0) if hasattr(freelancer, 'hourly_rate') else 0.0
    }


@router.get("/freelancer/earnings")
async def get_freelancer_earnings(freelancer: User = Depends(get_freelancer_user)):
    """Get freelancer's earnings breakdown"""
    total_earnings = 0.0
    pending_earnings = 0.0
    
    result = execute_query(
        "SELECT COALESCE(SUM(amount), 0) FROM payments WHERE to_user_id = ? AND status = 'completed'",
        [freelancer.id]
    )
    if result and result.get("rows"):
        total_earnings = float(_get_val(result["rows"][0], 0) or 0)
    
    result = execute_query(
        "SELECT COALESCE(SUM(amount), 0) FROM payments WHERE to_user_id = ? AND status = 'pending'",
        [freelancer.id]
    )
    if result and result.get("rows"):
        pending_earnings = float(_get_val(result["rows"][0], 0) or 0)
    
    return {
        "total_earnings": total_earnings,
        "pending_earnings": pending_earnings,
        "available_balance": float(freelancer.account_balance or 0.0) if hasattr(freelancer, 'account_balance') else 0.0,
        "currency": "USD"
    }


@router.get("/freelancer/wallet")
async def get_freelancer_wallet(freelancer: User = Depends(get_freelancer_user)):
    """Get freelancer's wallet balance"""
    pending_earnings = 0.0
    total_earned = 0.0
    
    result = execute_query(
        "SELECT COALESCE(SUM(amount), 0) FROM payments WHERE to_user_id = ? AND status = 'pending'",
        [freelancer.id]
    )
    if result and result.get("rows"):
        pending_earnings = float(_get_val(result["rows"][0], 0) or 0)
    
    result = execute_query(
        "SELECT COALESCE(SUM(amount), 0) FROM payments WHERE to_user_id = ? AND status = 'completed'",
        [freelancer.id]
    )
    if result and result.get("rows"):
        total_earned = float(_get_val(result["rows"][0], 0) or 0)
    
    return {
        "balance": float(freelancer.account_balance or 0.0) if hasattr(freelancer, 'account_balance') else 0.0,
        "currency": "USD",
        "pending_earnings": pending_earnings,
        "total_earned": total_earned
    }


# ============ SHARED ENDPOINTS ============

@router.get("/freelancers")
async def list_freelancers(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200)
):
    """List all freelancers - public endpoint"""
    # Get total
    count_result = execute_query(
        "SELECT COUNT(*) FROM users WHERE user_type = 'Freelancer' AND is_active = 1", []
    )
    total = 0
    if count_result and count_result.get("rows"):
        total = int(_get_val(count_result["rows"][0], 0) or 0)
    
    # Get freelancers
    result = execute_query(
        """SELECT id, name, email, bio, hourly_rate, location, skills
           FROM users
           WHERE user_type = 'Freelancer' AND is_active = 1
           LIMIT ? OFFSET ?""",
        [limit, skip]
    )
    
    freelancers = []
    if result and result.get("rows"):
        for row in result["rows"]:
            freelancers.append({
                "id": int(_get_val(row, 0) or 0),
                "name": _safe_str(_get_val(row, 1)),
                "email": _safe_str(_get_val(row, 2)),
                "bio": _safe_str(_get_val(row, 3)),
                "hourly_rate": float(_get_val(row, 4) or 0),
                "location": _safe_str(_get_val(row, 5)),
                "skills": _safe_str(_get_val(row, 6))
            })
    
    return {"total": total, "freelancers": freelancers}
