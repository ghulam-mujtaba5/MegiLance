"""
@AI-HINT: Admin Dashboard API - System monitoring, analytics, and management
Uses Turso HTTP API directly - NO SQLite fallback
"""
import re
import logging
from typing import List, Optional
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.security import get_current_active_user
from app.db.turso_http import execute_query, to_str, parse_date
from app.models.user import User
from pydantic import BaseModel, Field, validator

router = APIRouter()
logger = logging.getLogger(__name__)

# ============ Constants for Validation ============

VALID_USER_TYPES = {'Admin', 'admin', 'Client', 'client', 'Freelancer', 'freelancer'}
VALID_PROJECT_STATUSES = {'open', 'in_progress', 'completed', 'cancelled', 'draft'}
VALID_PAYMENT_STATUSES = {'pending', 'completed', 'failed', 'refunded', 'cancelled'}
MAX_LIMIT = 200
MAX_SKIP = 10000
MAX_SEARCH_LENGTH = 100


def validate_user_type(user_type: Optional[str]) -> Optional[str]:
    """Validate user type parameter"""
    if user_type is None:
        return None
    user_type_lower = user_type.lower()
    valid_lower = {ut.lower() for ut in VALID_USER_TYPES}
    if user_type_lower not in valid_lower:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid user_type. Must be one of: Client, Freelancer, Admin"
        )
    return user_type


def validate_project_status(project_status: Optional[str]) -> Optional[str]:
    """Validate project status parameter"""
    if project_status is None:
        return None
    if project_status.lower() not in VALID_PROJECT_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Must be one of: {', '.join(VALID_PROJECT_STATUSES)}"
        )
    return project_status.lower()


def validate_payment_status(payment_status: Optional[str]) -> Optional[str]:
    """Validate payment status parameter"""
    if payment_status is None:
        return None
    if payment_status.lower() not in VALID_PAYMENT_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Must be one of: {', '.join(VALID_PAYMENT_STATUSES)}"
        )
    return payment_status.lower()


def sanitize_search(search: Optional[str]) -> Optional[str]:
    """Sanitize search input to prevent SQL injection"""
    if search is None:
        return None
    # Remove potentially dangerous characters
    sanitized = re.sub(r'[;\'"\\/\x00]', '', search)
    # Limit length
    return sanitized[:MAX_SEARCH_LENGTH]


# ============ Schemas ============

class SystemStats(BaseModel):
    """Overall system statistics"""
    total_users: int
    total_clients: int
    total_freelancers: int
    total_projects: int
    total_contracts: int
    total_revenue: float
    active_projects: int
    pending_proposals: int
    
class UserActivity(BaseModel):
    """User activity metrics"""
    daily_active_users: int
    weekly_active_users: int
    monthly_active_users: int
    new_users_today: int
    new_users_this_week: int
    new_users_this_month: int
    
class ProjectMetrics(BaseModel):
    """Project-related metrics"""
    open_projects: int
    in_progress_projects: int
    completed_projects: int
    cancelled_projects: int
    avg_project_value: float
    total_project_value: float
    
class FinancialMetrics(BaseModel):
    """Financial analytics"""
    total_revenue: float
    revenue_this_month: float
    revenue_this_week: float
    pending_payments: float
    completed_payments: float
    platform_fees_collected: float
    
class TopFreelancer(BaseModel):
    """Top performing freelancer"""
    id: int
    name: str
    email: str
    total_earnings: float
    completed_projects: int
    average_rating: Optional[float]
    
class TopClient(BaseModel):
    """Top spending client"""
    id: int
    name: str
    email: str
    total_spent: float
    active_projects: int
    completed_projects: int
    
class RecentActivity(BaseModel):
    """Recent platform activity"""
    type: str
    description: str
    timestamp: datetime
    user_name: str
    amount: Optional[float]

class PlatformReviewStats(BaseModel):
    """Platform-wide review statistics"""
    overall_rating: float
    total_reviews: int
    positive_reviews: int
    neutral_reviews: int
    negative_reviews: int
    recent_reviews: List[dict]

class FraudAlert(BaseModel):
    """Fraud alert details"""
    id: int
    user_id: int
    user_name: str
    risk_score: float
    reason: str
    created_at: datetime
    status: str


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


# ============ Dependency: Admin Only ============

async def get_admin_user(current_user: User = Depends(get_current_active_user)):
    """Verify that current user is an admin"""
    user_type = _safe_str(current_user.user_type)
    if user_type not in ['Admin', 'admin']:
        logger.warning(f"Non-admin user {current_user.id} attempted to access admin endpoint")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    logger.info(f"Admin user {current_user.id} accessing admin endpoint")
    return current_user


# ============ Dashboard Endpoints ============

@router.get("/admin/dashboard/overview", response_model=SystemStats)
@router.get("/admin/dashboard/stats", response_model=SystemStats)
async def get_system_stats(admin: User = Depends(get_admin_user)):
    """Get overall system statistics."""
    
    # Get counts using Turso
    total_users = 0
    total_clients = 0
    total_freelancers = 0
    total_projects = 0
    total_contracts = 0
    total_revenue = 0.0
    active_projects = 0
    pending_proposals = 0
    
    # Total users
    result = execute_query("SELECT COUNT(*) FROM users", [])
    if result and result.get("rows"):
        total_users = int(_get_val(result["rows"][0], 0) or 0)
    
    # Clients
    result = execute_query("SELECT COUNT(*) FROM users WHERE user_type = 'Client'", [])
    if result and result.get("rows"):
        total_clients = int(_get_val(result["rows"][0], 0) or 0)
    
    # Freelancers
    result = execute_query("SELECT COUNT(*) FROM users WHERE user_type = 'Freelancer'", [])
    if result and result.get("rows"):
        total_freelancers = int(_get_val(result["rows"][0], 0) or 0)
    
    # Projects
    result = execute_query("SELECT COUNT(*) FROM projects", [])
    if result and result.get("rows"):
        total_projects = int(_get_val(result["rows"][0], 0) or 0)
    
    # Contracts
    result = execute_query("SELECT COUNT(*) FROM contracts", [])
    if result and result.get("rows"):
        total_contracts = int(_get_val(result["rows"][0], 0) or 0)
    
    # Total revenue
    result = execute_query(
        "SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'completed'", []
    )
    if result and result.get("rows"):
        total_revenue = float(_get_val(result["rows"][0], 0) or 0)
    
    # Active projects
    result = execute_query(
        "SELECT COUNT(*) FROM projects WHERE status IN ('open', 'in_progress')", []
    )
    if result and result.get("rows"):
        active_projects = int(_get_val(result["rows"][0], 0) or 0)
    
    # Pending proposals
    result = execute_query(
        "SELECT COUNT(*) FROM proposals WHERE status = 'submitted'", []
    )
    if result and result.get("rows"):
        pending_proposals = int(_get_val(result["rows"][0], 0) or 0)
    
    return SystemStats(
        total_users=total_users,
        total_clients=total_clients,
        total_freelancers=total_freelancers,
        total_projects=total_projects,
        total_contracts=total_contracts,
        total_revenue=total_revenue,
        active_projects=active_projects,
        pending_proposals=pending_proposals
    )


@router.get("/admin/dashboard/user-activity", response_model=UserActivity)
async def get_user_activity(admin: User = Depends(get_admin_user)):
    """Get user activity metrics."""
    now = datetime.now(timezone.utc)
    today = now.replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    week_ago = (now - timedelta(days=7)).isoformat()
    month_ago = (now - timedelta(days=30)).isoformat()
    
    new_today = 0
    new_week = 0
    new_month = 0
    dau = 0
    wau = 0
    mau = 0
    
    result = execute_query(
        "SELECT COUNT(*) FROM users WHERE joined_at >= ?", [today]
    )
    if result and result.get("rows"):
        new_today = int(_get_val(result["rows"][0], 0) or 0)
    
    result = execute_query(
        "SELECT COUNT(*) FROM users WHERE joined_at >= ?", [week_ago]
    )
    if result and result.get("rows"):
        new_week = int(_get_val(result["rows"][0], 0) or 0)
    
    result = execute_query(
        "SELECT COUNT(*) FROM users WHERE joined_at >= ?", [month_ago]
    )
    if result and result.get("rows"):
        new_month = int(_get_val(result["rows"][0], 0) or 0)
    
    # Estimate DAU/WAU/MAU based on updated_at
    result = execute_query(
        "SELECT COUNT(*) FROM users WHERE updated_at >= ?", [today]
    )
    if result and result.get("rows"):
        dau = int(_get_val(result["rows"][0], 0) or 0)
    
    result = execute_query(
        "SELECT COUNT(*) FROM users WHERE updated_at >= ?", [week_ago]
    )
    if result and result.get("rows"):
        wau = int(_get_val(result["rows"][0], 0) or 0)
    
    result = execute_query(
        "SELECT COUNT(*) FROM users WHERE updated_at >= ?", [month_ago]
    )
    if result and result.get("rows"):
        mau = int(_get_val(result["rows"][0], 0) or 0)
    
    return UserActivity(
        daily_active_users=dau,
        weekly_active_users=wau,
        monthly_active_users=mau,
        new_users_today=new_today,
        new_users_this_week=new_week,
        new_users_this_month=new_month
    )


@router.get("/admin/dashboard/project-metrics", response_model=ProjectMetrics)
async def get_project_metrics(admin: User = Depends(get_admin_user)):
    """Get project-related metrics."""
    open_count = 0
    in_progress_count = 0
    completed_count = 0
    cancelled_count = 0
    avg_value = 0.0
    total_value = 0.0
    
    result = execute_query(
        "SELECT COUNT(*) FROM projects WHERE status = 'open'", []
    )
    if result and result.get("rows"):
        open_count = int(_get_val(result["rows"][0], 0) or 0)
    
    result = execute_query(
        "SELECT COUNT(*) FROM projects WHERE status = 'in_progress'", []
    )
    if result and result.get("rows"):
        in_progress_count = int(_get_val(result["rows"][0], 0) or 0)
    
    result = execute_query(
        "SELECT COUNT(*) FROM projects WHERE status = 'completed'", []
    )
    if result and result.get("rows"):
        completed_count = int(_get_val(result["rows"][0], 0) or 0)
    
    result = execute_query(
        "SELECT COUNT(*) FROM projects WHERE status = 'cancelled'", []
    )
    if result and result.get("rows"):
        cancelled_count = int(_get_val(result["rows"][0], 0) or 0)
    
    result = execute_query(
        "SELECT AVG((budget_min + budget_max) / 2), SUM((budget_min + budget_max) / 2) FROM projects", []
    )
    if result and result.get("rows"):
        avg_value = float(_get_val(result["rows"][0], 0) or 0)
        total_value = float(_get_val(result["rows"][0], 1) or 0)
    
    return ProjectMetrics(
        open_projects=open_count,
        in_progress_projects=in_progress_count,
        completed_projects=completed_count,
        cancelled_projects=cancelled_count,
        avg_project_value=avg_value,
        total_project_value=total_value
    )


@router.get("/admin/dashboard/financial-metrics", response_model=FinancialMetrics)
async def get_financial_metrics(admin: User = Depends(get_admin_user)):
    """Get financial analytics and revenue metrics."""
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0).isoformat()
    week_start = (now - timedelta(days=now.weekday())).isoformat()
    
    total_revenue = 0.0
    revenue_month = 0.0
    revenue_week = 0.0
    pending = 0.0
    completed = 0.0
    
    result = execute_query(
        "SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'completed'", []
    )
    if result and result.get("rows"):
        total_revenue = float(_get_val(result["rows"][0], 0) or 0)
    
    result = execute_query(
        "SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'completed' AND created_at >= ?",
        [month_start]
    )
    if result and result.get("rows"):
        revenue_month = float(_get_val(result["rows"][0], 0) or 0)
    
    result = execute_query(
        "SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'completed' AND created_at >= ?",
        [week_start]
    )
    if result and result.get("rows"):
        revenue_week = float(_get_val(result["rows"][0], 0) or 0)
    
    result = execute_query(
        "SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'pending'", []
    )
    if result and result.get("rows"):
        pending = float(_get_val(result["rows"][0], 0) or 0)
    
    completed = total_revenue
    platform_fees = completed * 0.125
    
    return FinancialMetrics(
        total_revenue=total_revenue,
        revenue_this_month=revenue_month,
        revenue_this_week=revenue_week,
        pending_payments=pending,
        completed_payments=completed,
        platform_fees_collected=platform_fees
    )


@router.get("/admin/dashboard/top-freelancers", response_model=List[TopFreelancer])
async def get_top_freelancers(
    limit: int = Query(10, ge=1, le=50),
    admin: User = Depends(get_admin_user)
):
    """Get top earning freelancers."""
    result = execute_query(
        """SELECT u.id, u.name, u.email, 
           COALESCE(SUM(p.amount), 0) as total_earnings,
           COUNT(DISTINCT c.id) as completed_projects
           FROM users u
           LEFT JOIN payments p ON p.to_user_id = u.id AND p.status = 'completed'
           LEFT JOIN contracts c ON c.freelancer_id = u.id
           WHERE u.user_type = 'Freelancer'
           GROUP BY u.id, u.name, u.email
           ORDER BY total_earnings DESC
           LIMIT ?""",
        [limit]
    )
    
    freelancers = []
    if result and result.get("rows"):
        for row in result["rows"]:
            user_id = int(_get_val(row, 0) or 0)
            name = _safe_str(_get_val(row, 1)) or "Unknown"
            email = _safe_str(_get_val(row, 2)) or ""
            total_earnings = float(_get_val(row, 3) or 0)
            completed_projects = int(_get_val(row, 4) or 0)
            
            # Get average rating
            avg_rating = None
            rating_result = execute_query(
                "SELECT AVG(rating) FROM reviews WHERE reviewee_id = ?",
                [user_id]
            )
            if rating_result and rating_result.get("rows"):
                rating_val = _get_val(rating_result["rows"][0], 0)
                if rating_val:
                    avg_rating = round(float(rating_val), 2)
            
            freelancers.append(TopFreelancer(
                id=user_id,
                name=name,
                email=email,
                total_earnings=total_earnings,
                completed_projects=completed_projects,
                average_rating=avg_rating
            ))
    
    return freelancers


@router.get("/admin/dashboard/top-clients", response_model=List[TopClient])
async def get_top_clients(
    limit: int = Query(10, ge=1, le=50),
    admin: User = Depends(get_admin_user)
):
    """Get top spending clients."""
    result = execute_query(
        """SELECT u.id, u.name, u.email,
           COALESCE(SUM(p.amount), 0) as total_spent
           FROM users u
           LEFT JOIN payments p ON p.from_user_id = u.id AND p.status = 'completed'
           WHERE u.user_type = 'Client'
           GROUP BY u.id, u.name, u.email
           ORDER BY total_spent DESC
           LIMIT ?""",
        [limit]
    )
    
    clients = []
    if result and result.get("rows"):
        for row in result["rows"]:
            user_id = int(_get_val(row, 0) or 0)
            name = _safe_str(_get_val(row, 1)) or "Unknown"
            email = _safe_str(_get_val(row, 2)) or ""
            total_spent = float(_get_val(row, 3) or 0)
            
            # Get project counts
            active_projects = 0
            completed_projects = 0
            
            proj_result = execute_query(
                "SELECT COUNT(*) FROM projects WHERE client_id = ? AND status IN ('open', 'in_progress')",
                [user_id]
            )
            if proj_result and proj_result.get("rows"):
                active_projects = int(_get_val(proj_result["rows"][0], 0) or 0)
            
            proj_result = execute_query(
                "SELECT COUNT(*) FROM projects WHERE client_id = ? AND status = 'completed'",
                [user_id]
            )
            if proj_result and proj_result.get("rows"):
                completed_projects = int(_get_val(proj_result["rows"][0], 0) or 0)
            
            clients.append(TopClient(
                id=user_id,
                name=name,
                email=email,
                total_spent=total_spent,
                active_projects=active_projects,
                completed_projects=completed_projects
            ))
    
    return clients


@router.get("/admin/dashboard/recent-activity", response_model=List[RecentActivity])
async def get_recent_activity(
    limit: int = Query(20, ge=1, le=100),
    admin: User = Depends(get_admin_user)
):
    """Get recent platform activity feed."""
    activities = []
    
    # Recent users
    result = execute_query(
        "SELECT id, name, user_type, joined_at FROM users ORDER BY joined_at DESC LIMIT 5", []
    )
    if result and result.get("rows"):
        for row in result["rows"]:
            name = _safe_str(_get_val(row, 1)) or "Unknown"
            user_type = _safe_str(_get_val(row, 2)) or "User"
            joined_at = parse_date(_get_val(row, 3)) or datetime.now(timezone.utc)
            activities.append({
                'type': 'user_joined',
                'description': f"{user_type} joined the platform",
                'timestamp': joined_at,
                'user_name': name,
                'amount': None
            })
    
    # Recent projects
    result = execute_query(
        """SELECT p.id, p.title, p.budget_max, p.created_at, u.name
           FROM projects p
           LEFT JOIN users u ON u.id = p.client_id
           ORDER BY p.created_at DESC LIMIT 5""", []
    )
    if result and result.get("rows"):
        for row in result["rows"]:
            title = _safe_str(_get_val(row, 1)) or "Project"
            budget = float(_get_val(row, 2) or 0)
            created_at = parse_date(_get_val(row, 3)) or datetime.now(timezone.utc)
            client_name = _safe_str(_get_val(row, 4)) or "Unknown"
            activities.append({
                'type': 'project_posted',
                'description': f"Posted: {title}",
                'timestamp': created_at,
                'user_name': client_name,
                'amount': budget
            })
    
    # Recent proposals
    result = execute_query(
        """SELECT pr.id, pr.estimated_hours, pr.hourly_rate, pr.created_at, u.name
           FROM proposals pr
           LEFT JOIN users u ON u.id = pr.freelancer_id
           ORDER BY pr.created_at DESC LIMIT 5""", []
    )
    if result and result.get("rows"):
        for row in result["rows"]:
            hours = float(_get_val(row, 1) or 0)
            rate = float(_get_val(row, 2) or 0)
            created_at = parse_date(_get_val(row, 3)) or datetime.now(timezone.utc)
            freelancer_name = _safe_str(_get_val(row, 4)) or "Unknown"
            amount = hours * rate if rate else None
            activities.append({
                'type': 'proposal_submitted',
                'description': "Submitted proposal",
                'timestamp': created_at,
                'user_name': freelancer_name,
                'amount': amount
            })
    
    # Recent payments
    result = execute_query(
        """SELECT pay.id, pay.amount, pay.payment_type, pay.description, pay.created_at, u.name
           FROM payments pay
           LEFT JOIN users u ON u.id = pay.to_user_id
           ORDER BY pay.created_at DESC LIMIT 5""", []
    )
    if result and result.get("rows"):
        for row in result["rows"]:
            amount = float(_get_val(row, 1) or 0)
            payment_type = _safe_str(_get_val(row, 2)) or ""
            description = _safe_str(_get_val(row, 3)) or payment_type
            created_at = parse_date(_get_val(row, 4)) or datetime.now(timezone.utc)
            payee_name = _safe_str(_get_val(row, 5)) or "Unknown"
            activities.append({
                'type': 'payment_made',
                'description': f"Payment: {description}",
                'timestamp': created_at,
                'user_name': payee_name,
                'amount': amount
            })
    
    # Sort all activities by timestamp
    activities.sort(key=lambda x: x['timestamp'], reverse=True)
    
    return [RecentActivity(**activity) for activity in activities[:limit]]


@router.get("/admin/users/list")
async def list_all_users(
    user_type: Optional[str] = Query(None, description="Filter by user type: Client, Freelancer, Admin"),
    search: Optional[str] = Query(None, max_length=MAX_SEARCH_LENGTH, description="Search by name or email"),
    skip: int = Query(0, ge=0, le=MAX_SKIP, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=MAX_LIMIT, description="Maximum number of records to return"),
    admin: User = Depends(get_admin_user)
):
    """List all users with filtering options."""
    # Validate inputs
    validated_user_type = validate_user_type(user_type)
    sanitized_search = sanitize_search(search)
    
    where_clauses = []
    params = []
    
    if validated_user_type:
        where_clauses.append("user_type = ?")
        params.append(validated_user_type)
    
    if sanitized_search:
        where_clauses.append("(name LIKE ? OR email LIKE ?)")
        params.append(f"%{sanitized_search}%")
        params.append(f"%{sanitized_search}%")
    
    where_sql = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ""
    
    # Get total
    count_result = execute_query(f"SELECT COUNT(*) FROM users {where_sql}", params)
    total = 0
    if count_result and count_result.get("rows"):
        total = int(_get_val(count_result["rows"][0], 0) or 0)
    
    # Get users
    params.extend([limit, skip])
    result = execute_query(
        f"""SELECT id, email, name, user_type, is_active, joined_at, location, hourly_rate
            FROM users {where_sql}
            ORDER BY joined_at DESC
            LIMIT ? OFFSET ?""",
        params
    )
    
    users = []
    if result and result.get("rows"):
        for row in result["rows"]:
            user_type_val = _safe_str(_get_val(row, 3))
            users.append({
                "id": int(_get_val(row, 0) or 0),
                "email": _safe_str(_get_val(row, 1)),
                "name": _safe_str(_get_val(row, 2)),
                "user_type": user_type_val,
                "is_active": bool(_get_val(row, 4)),
                "joined_at": parse_date(_get_val(row, 5)),
                "location": _safe_str(_get_val(row, 6)),
                "hourly_rate": float(_get_val(row, 7) or 0) if user_type_val == 'Freelancer' else None
            })
    
    return {"total": total, "users": users}


@router.post("/admin/users/{user_id}/toggle-status")
async def toggle_user_status(
    user_id: int,
    admin: User = Depends(get_admin_user)
):
    """Activate or deactivate a user account."""
    # Validate user_id
    if user_id <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user ID")
    
    # Prevent admin from deactivating themselves
    if user_id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot toggle your own account status"
        )
    
    # Get current status
    result = execute_query(
        "SELECT is_active, user_type FROM users WHERE id = ?", [user_id]
    )
    
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="User not found")
    
    current_status = bool(_get_val(result["rows"][0], 0))
    target_user_type = _safe_str(_get_val(result["rows"][0], 1))
    
    # Prevent deactivating other admins (security measure)
    if target_user_type in ['Admin', 'admin'] and current_status:
        logger.warning(f"Admin {admin.id} attempted to deactivate admin user {user_id}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot deactivate admin accounts via this endpoint"
        )
    
    new_status = 0 if current_status else 1
    
    # Update status
    update_result = execute_query(
        "UPDATE users SET is_active = ?, updated_at = ? WHERE id = ?",
        [new_status, datetime.now(timezone.utc).isoformat(), user_id]
    )
    
    if not update_result:
        raise HTTPException(status_code=500, detail="Failed to update user status")
    
    logger.info(f"Admin {admin.id} toggled user {user_id} status to {'active' if new_status else 'inactive'}")
    
    return {
        "success": True,
        "user_id": user_id,
        "is_active": bool(new_status)
    }


@router.get("/admin/users")
async def get_admin_users(
    role: Optional[str] = Query(None, description="Filter by role: Client, Freelancer, Admin"),
    search: Optional[str] = Query(None, max_length=MAX_SEARCH_LENGTH),
    skip: int = Query(0, ge=0, le=MAX_SKIP),
    limit: int = Query(50, ge=1, le=MAX_LIMIT),
    admin: User = Depends(get_admin_user)
):
    """List all users - Admin endpoint"""
    return await list_all_users(user_type=role, search=search, skip=skip, limit=limit, admin=admin)


@router.get("/admin/projects")
async def get_admin_projects(
    status: Optional[str] = Query(None, description="Filter by status: open, in_progress, completed, cancelled"),
    skip: int = Query(0, ge=0, le=MAX_SKIP),
    limit: int = Query(50, ge=1, le=MAX_LIMIT),
    admin: User = Depends(get_admin_user)
):
    """Get all projects with admin access"""
    # Validate status
    validated_status = validate_project_status(status)
    
    where_sql = "WHERE status = ?" if validated_status else ""
    params = [validated_status] if validated_status else []
    
    # Get total
    count_result = execute_query(f"SELECT COUNT(*) FROM projects {where_sql}", params)
    total = 0
    if count_result and count_result.get("rows"):
        total = int(_get_val(count_result["rows"][0], 0) or 0)
    
    # Get projects
    params.extend([limit, skip])
    result = execute_query(
        f"""SELECT id, title, description, status, budget_min, budget_max, client_id, created_at, updated_at
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
                "client_id": int(_get_val(row, 6) or 0),
                "created_at": parse_date(_get_val(row, 7)),
                "updated_at": parse_date(_get_val(row, 8))
            })
    
    return {"total": total, "projects": projects}


@router.get("/admin/payments")
async def get_admin_payments(
    status: Optional[str] = Query(None, description="Filter by status: pending, completed, failed, refunded"),
    skip: int = Query(0, ge=0, le=MAX_SKIP),
    limit: int = Query(50, ge=1, le=MAX_LIMIT),
    admin: User = Depends(get_admin_user)
):
    """Get all payments with admin access"""
    # Validate status
    validated_status = validate_payment_status(status)
    
    where_sql = "WHERE status = ?" if validated_status else ""
    params = [validated_status] if validated_status else []
    
    # Get total
    count_result = execute_query(f"SELECT COUNT(*) FROM payments {where_sql}", params)
    total = 0
    if count_result and count_result.get("rows"):
        total = int(_get_val(count_result["rows"][0], 0) or 0)
    
    # Get payments
    params.extend([limit, skip])
    result = execute_query(
        f"""SELECT id, amount, status, payment_type, from_user_id, to_user_id, description, created_at
            FROM payments {where_sql}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?""",
        params
    )
    
    payments = []
    if result and result.get("rows"):
        for row in result["rows"]:
            payments.append({
                "id": int(_get_val(row, 0) or 0),
                "amount": float(_get_val(row, 1) or 0),
                "status": _safe_str(_get_val(row, 2)),
                "payment_type": _safe_str(_get_val(row, 3)),
                "from_user_id": int(_get_val(row, 4) or 0),
                "to_user_id": int(_get_val(row, 5) or 0),
                "description": _safe_str(_get_val(row, 6)),
                "created_at": parse_date(_get_val(row, 7))
            })
    
    return {"total": total, "payments": payments}


@router.get("/admin/analytics/overview")
async def get_analytics_overview(admin: User = Depends(get_admin_user)):
    """Get platform analytics overview"""
    users_total = 0
    users_active = 0
    users_clients = 0
    users_freelancers = 0
    projects_total = 0
    projects_open = 0
    projects_in_progress = 0
    projects_completed = 0
    revenue_total = 0.0
    revenue_pending = 0.0
    
    result = execute_query("SELECT COUNT(*) FROM users", [])
    if result and result.get("rows"):
        users_total = int(_get_val(result["rows"][0], 0) or 0)
    
    result = execute_query("SELECT COUNT(*) FROM users WHERE is_active = 1", [])
    if result and result.get("rows"):
        users_active = int(_get_val(result["rows"][0], 0) or 0)
    
    result = execute_query("SELECT COUNT(*) FROM users WHERE user_type = 'Client'", [])
    if result and result.get("rows"):
        users_clients = int(_get_val(result["rows"][0], 0) or 0)
    
    result = execute_query("SELECT COUNT(*) FROM users WHERE user_type = 'Freelancer'", [])
    if result and result.get("rows"):
        users_freelancers = int(_get_val(result["rows"][0], 0) or 0)
    
    result = execute_query("SELECT COUNT(*) FROM projects", [])
    if result and result.get("rows"):
        projects_total = int(_get_val(result["rows"][0], 0) or 0)
    
    result = execute_query("SELECT COUNT(*) FROM projects WHERE status = 'open'", [])
    if result and result.get("rows"):
        projects_open = int(_get_val(result["rows"][0], 0) or 0)
    
    result = execute_query("SELECT COUNT(*) FROM projects WHERE status = 'in_progress'", [])
    if result and result.get("rows"):
        projects_in_progress = int(_get_val(result["rows"][0], 0) or 0)
    
    result = execute_query("SELECT COUNT(*) FROM projects WHERE status = 'completed'", [])
    if result and result.get("rows"):
        projects_completed = int(_get_val(result["rows"][0], 0) or 0)
    
    result = execute_query(
        "SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'completed'", []
    )
    if result and result.get("rows"):
        revenue_total = float(_get_val(result["rows"][0], 0) or 0)
    
    result = execute_query(
        "SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'pending'", []
    )
    if result and result.get("rows"):
        revenue_pending = float(_get_val(result["rows"][0], 0) or 0)
    
    return {
        "users": {
            "total": users_total,
            "active": users_active,
            "clients": users_clients,
            "freelancers": users_freelancers
        },
        "projects": {
            "total": projects_total,
            "open": projects_open,
            "in_progress": projects_in_progress,
            "completed": projects_completed
        },
        "revenue": {
            "total": revenue_total,
            "pending": revenue_pending
        }
    }


@router.get("/admin/support/tickets")
async def get_support_tickets(
    status: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    admin: User = Depends(get_admin_user)
):
    """Get support tickets"""
    return {
        "total": 0,
        "tickets": [],
        "message": "Support ticket system not yet implemented"
    }


@router.get("/admin/ai/usage")
async def get_ai_usage(admin: User = Depends(get_admin_user)):
    """Get AI usage statistics"""
    return {
        "total_requests": 0,
        "chatbot_queries": 0,
        "fraud_checks": 0,
        "price_estimates": 0,
        "message": "AI usage tracking not yet implemented"
    }


@router.get("/admin/settings")
async def get_platform_settings(admin: User = Depends(get_admin_user)):
    """Get platform settings"""
    return {
        "platform": {
            "name": "MegiLance",
            "version": "1.0.0",
            "maintenance_mode": False
        },
        "fees": {
            "platform_fee_percentage": 12.5,
            "payment_processing_fee": 2.9
        },
        "features": {
            "ai_enabled": True,
            "blockchain_enabled": True,
            "escrow_enabled": True
        }
    }

@router.get("/admin/dashboard/reviews", response_model=PlatformReviewStats)
async def get_platform_review_stats(admin: User = Depends(get_admin_user)):
    """Get platform-wide review statistics."""
    overall_rating = 0.0
    total_reviews = 0
    positive_reviews = 0
    neutral_reviews = 0
    negative_reviews = 0
    recent_reviews = []
    
    # Overall stats
    result = execute_query(
        """SELECT 
           COUNT(*), 
           AVG(rating),
           SUM(CASE WHEN rating >= 4 THEN 1 ELSE 0 END),
           SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END),
           SUM(CASE WHEN rating <= 2 THEN 1 ELSE 0 END)
           FROM reviews""", []
    )
    
    if result and result.get("rows"):
        row = result["rows"][0]
        total_reviews = int(_get_val(row, 0) or 0)
        overall_rating = float(_get_val(row, 1) or 0)
        positive_reviews = int(_get_val(row, 2) or 0)
        neutral_reviews = int(_get_val(row, 3) or 0)
        negative_reviews = int(_get_val(row, 4) or 0)
    
    # Recent reviews
    result = execute_query(
        """SELECT r.id, r.rating, r.comment, r.created_at, u.name
           FROM reviews r
           LEFT JOIN users u ON u.id = r.reviewer_id
           ORDER BY r.created_at DESC LIMIT 5""", []
    )
    
    if result and result.get("rows"):
        for row in result["rows"]:
            recent_reviews.append({
                "id": int(_get_val(row, 0) or 0),
                "rating": float(_get_val(row, 1) or 0),
                "comment": _safe_str(_get_val(row, 2)),
                "created_at": parse_date(_get_val(row, 3)),
                "reviewer_name": _safe_str(_get_val(row, 4)) or "Unknown"
            })
            
    return PlatformReviewStats(
        overall_rating=round(overall_rating, 2),
        total_reviews=total_reviews,
        positive_reviews=positive_reviews,
        neutral_reviews=neutral_reviews,
        negative_reviews=negative_reviews,
        recent_reviews=recent_reviews
    )

@router.get("/admin/dashboard/fraud", response_model=List[FraudAlert])
async def get_fraud_alerts(
    limit: int = Query(10, ge=1, le=50),
    admin: User = Depends(get_admin_user)
):
    """Get fraud alerts."""
    # Since we don't have a dedicated fraud table yet, we'll return an empty list
    # or check disputes for potential fraud
    
    alerts = []
    
    # Check disputes marked as 'fraud' or similar if applicable
    # For now, returning empty list to satisfy the contract
    
    return alerts

