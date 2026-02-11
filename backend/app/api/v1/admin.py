"""
@AI-HINT: Admin Dashboard API - System monitoring, analytics, and management
Uses service layer for all DB operations
"""
import re
import logging
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.security import get_current_active_user
from app.models.user import User
from app.services import admin_service
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
            detail="Invalid user_type. Must be one of: Client, Freelancer, Admin"
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
    sanitized = re.sub(r'[;\'"\\/\x00]', '', search)
    return sanitized[:MAX_SEARCH_LENGTH]


def _safe_str(val):
    """Convert bytes to string if needed"""
    from app.api.v1.utils import safe_str
    return safe_str(val)


# ============ Schemas ============

class SystemStats(BaseModel):
    total_users: int
    total_clients: int
    total_freelancers: int
    total_projects: int
    total_contracts: int
    total_revenue: float
    active_projects: int
    pending_proposals: int

class UserActivity(BaseModel):
    daily_active_users: int
    weekly_active_users: int
    monthly_active_users: int
    new_users_today: int
    new_users_this_week: int
    new_users_this_month: int

class ProjectMetrics(BaseModel):
    open_projects: int
    in_progress_projects: int
    completed_projects: int
    cancelled_projects: int
    avg_project_value: float
    total_project_value: float

class FinancialMetrics(BaseModel):
    total_revenue: float
    revenue_this_month: float
    revenue_this_week: float
    pending_payments: float
    completed_payments: float
    platform_fees_collected: float

class TopFreelancer(BaseModel):
    id: int
    name: str
    email: str
    total_earnings: float
    completed_projects: int
    average_rating: Optional[float]

class TopClient(BaseModel):
    id: int
    name: str
    email: str
    total_spent: float
    active_projects: int
    completed_projects: int

class RecentActivity(BaseModel):
    type: str
    description: str
    timestamp: datetime
    user_name: str
    amount: Optional[float]

class PlatformReviewStats(BaseModel):
    overall_rating: float
    total_reviews: int
    positive_reviews: int
    neutral_reviews: int
    negative_reviews: int
    recent_reviews: List[dict]

class FraudAlert(BaseModel):
    id: int
    user_id: int
    user_name: str
    risk_score: float
    reason: str
    created_at: datetime
    status: str


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
    data = admin_service.get_system_stats()
    return SystemStats(**data)


@router.get("/admin/dashboard/user-activity", response_model=UserActivity)
async def get_user_activity(admin: User = Depends(get_admin_user)):
    """Get user activity metrics."""
    data = admin_service.get_user_activity_metrics()
    return UserActivity(**data)


@router.get("/admin/dashboard/project-metrics", response_model=ProjectMetrics)
async def get_project_metrics(admin: User = Depends(get_admin_user)):
    """Get project-related metrics."""
    data = admin_service.get_project_metrics()
    return ProjectMetrics(**data)


@router.get("/admin/dashboard/financial-metrics", response_model=FinancialMetrics)
async def get_financial_metrics(admin: User = Depends(get_admin_user)):
    """Get financial analytics and revenue metrics."""
    data = admin_service.get_financial_metrics()
    return FinancialMetrics(**data)


@router.get("/admin/dashboard/top-freelancers", response_model=List[TopFreelancer])
async def get_top_freelancers(
    limit: int = Query(10, ge=1, le=50),
    admin: User = Depends(get_admin_user)
):
    """Get top earning freelancers."""
    data = admin_service.get_top_freelancers(limit)
    return [TopFreelancer(**f) for f in data]


@router.get("/admin/dashboard/top-clients", response_model=List[TopClient])
async def get_top_clients(
    limit: int = Query(10, ge=1, le=50),
    admin: User = Depends(get_admin_user)
):
    """Get top spending clients."""
    data = admin_service.get_top_clients(limit)
    return [TopClient(**c) for c in data]


@router.get("/admin/dashboard/recent-activity", response_model=List[RecentActivity])
async def get_recent_activity(
    limit: int = Query(20, ge=1, le=100),
    admin: User = Depends(get_admin_user)
):
    """Get recent platform activity feed."""
    data = admin_service.get_recent_platform_activity(limit)
    return [RecentActivity(**a) for a in data]


@router.get("/admin/users/list")
async def list_all_users(
    user_type: Optional[str] = Query(None, description="Filter by user type: Client, Freelancer, Admin"),
    search: Optional[str] = Query(None, max_length=MAX_SEARCH_LENGTH, description="Search by name or email"),
    skip: int = Query(0, ge=0, le=MAX_SKIP, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=MAX_LIMIT, description="Maximum number of records to return"),
    admin: User = Depends(get_admin_user)
):
    """List all users with filtering options."""
    validated_user_type = validate_user_type(user_type)
    sanitized_search = sanitize_search(search)
    return admin_service.list_users(validated_user_type, sanitized_search, limit, skip)


@router.post("/admin/users/{user_id}/toggle-status")
async def toggle_user_status(
    user_id: int,
    admin: User = Depends(get_admin_user)
):
    """Activate or deactivate a user account."""
    if user_id <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user ID")

    if user_id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot toggle your own account status"
        )

    user_info = admin_service.get_user_status(user_id)
    if not user_info:
        raise HTTPException(status_code=404, detail="User not found")

    current_status = user_info["is_active"]
    target_user_type = user_info["user_type"]

    if target_user_type in ['Admin', 'admin'] and current_status:
        logger.warning(f"Admin {admin.id} attempted to deactivate admin user {user_id}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot deactivate admin accounts via this endpoint"
        )

    new_status = 0 if current_status else 1

    success = admin_service.toggle_user_active(user_id, new_status)
    if not success:
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
    validated_status = validate_project_status(status)
    return admin_service.get_admin_projects(validated_status, limit, skip)


@router.get("/admin/payments")
async def get_admin_payments(
    status: Optional[str] = Query(None, description="Filter by status: pending, completed, failed, refunded"),
    skip: int = Query(0, ge=0, le=MAX_SKIP),
    limit: int = Query(50, ge=1, le=MAX_LIMIT),
    admin: User = Depends(get_admin_user)
):
    """Get all payments with admin access"""
    validated_status = validate_payment_status(status)
    return admin_service.get_admin_payments(validated_status, limit, skip)


@router.get("/admin/analytics/overview")
async def get_analytics_overview(admin: User = Depends(get_admin_user)):
    """Get platform analytics overview"""
    return admin_service.get_analytics_overview_data()


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
    stats = admin_service.get_review_stats()
    recent = admin_service.get_recent_reviews(5)
    return PlatformReviewStats(**stats, recent_reviews=recent)

@router.get("/admin/dashboard/fraud", response_model=List[FraudAlert])
async def get_fraud_alerts(
    limit: int = Query(10, ge=1, le=50),
    admin: User = Depends(get_admin_user)
):
    """Get fraud alerts."""
    return []
