# @AI-HINT: Analytics API endpoints for platform metrics and reporting - Turso HTTP only
# Provides REST API for analytics data access

from fastapi import APIRouter, Depends, Query, HTTPException
from typing import List
from datetime import datetime, timedelta, timezone

from app.db.turso_http import execute_query, to_str, parse_date
from app.core.security import get_current_user
from app.schemas.analytics_schemas import (
    TrendAnalysisRequest,
    DateRangeRequest,
    TopFreelancersRequest,
    RegistrationTrendResponse,
    ActiveUsersStatsResponse,
    LocationDistributionResponse,
    ProjectStatsResponse,
    CompletionRateResponse,
    CategoryPopularityResponse,
    RevenueStatsResponse,
    RevenueTrendResponse,
    TopFreelancerResponse,
    FreelancerSuccessRateResponse,
    TopClientResponse,
    PlatformHealthResponse,
    EngagementMetricsResponse,
    IntervalEnum,
    SortByEnum
)

router = APIRouter()


def require_admin(current_user = Depends(get_current_user)):
    """Check if user is admin"""
    user_type = current_user.get("user_type", "").lower()
    role = current_user.get("role", "").lower()
    if user_type != "admin" and role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


# ==================== User Analytics ====================

@router.get(
    "/users/registration-trends",
    response_model=List[RegistrationTrendResponse],
    summary="Get user registration trends"
)
async def get_registration_trends(
    start_date: datetime = Query(..., description="Start date for analysis"),
    end_date: datetime = Query(..., description="End date for analysis"),
    interval: IntervalEnum = Query(default=IntervalEnum.day, description="Aggregation interval"),
    current_user = Depends(require_admin)
):
    """Get user registration trends over a specified time period. Admin only."""
    # Use date function for grouping
    if interval.value == "day":
        date_format = "DATE(created_at)"
    elif interval.value == "week":
        date_format = "DATE(created_at, 'weekday 0', '-6 days')"
    else:  # month
        date_format = "DATE(created_at, 'start of month')"
    
    result = execute_query(
        f"""SELECT {date_format} as date,
            COUNT(*) as total,
            SUM(CASE WHEN LOWER(user_type) = 'client' THEN 1 ELSE 0 END) as clients,
            SUM(CASE WHEN LOWER(user_type) = 'freelancer' THEN 1 ELSE 0 END) as freelancers
           FROM users
           WHERE created_at >= ? AND created_at <= ?
           GROUP BY {date_format}
           ORDER BY date""",
        [start_date.isoformat(), end_date.isoformat()]
    )
    
    trends = []
    if result and result.get("rows"):
        for row in result["rows"]:
            trends.append({
                "date": to_str(row[0]),
                "total": row[1].get("value", 0) if row[1].get("type") != "null" else 0,
                "clients": row[2].get("value", 0) if row[2].get("type") != "null" else 0,
                "freelancers": row[3].get("value", 0) if row[3].get("type") != "null" else 0
            })
    
    return trends


@router.get(
    "/users/active-stats",
    response_model=ActiveUsersStatsResponse,
    summary="Get active user statistics"
)
async def get_active_user_stats(
    days: int = Query(default=30, ge=1, le=365, description="Number of days to look back"),
    current_user = Depends(require_admin)
):
    """Get active user statistics for the specified period. Admin only."""
    cutoff_date = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    
    # Total users
    total_result = execute_query("SELECT COUNT(*) FROM users", [])
    total_users = total_result["rows"][0][0].get("value", 0) if total_result and total_result.get("rows") else 0
    
    # Active users
    active_result = execute_query(
        "SELECT COUNT(*) FROM users WHERE last_login >= ?",
        [cutoff_date]
    )
    active_users = active_result["rows"][0][0].get("value", 0) if active_result and active_result.get("rows") else 0
    
    # Verified users
    verified_result = execute_query(
        "SELECT COUNT(*) FROM users WHERE email_verified = 1",
        []
    )
    verified_users = verified_result["rows"][0][0].get("value", 0) if verified_result and verified_result.get("rows") else 0
    
    # 2FA users
    twofa_result = execute_query(
        "SELECT COUNT(*) FROM users WHERE two_factor_enabled = 1",
        []
    )
    users_with_2fa = twofa_result["rows"][0][0].get("value", 0) if twofa_result and twofa_result.get("rows") else 0
    
    # User type breakdown
    types_result = execute_query(
        "SELECT user_type, COUNT(*) FROM users GROUP BY user_type",
        []
    )
    user_types = {}
    if types_result and types_result.get("rows"):
        for row in types_result["rows"]:
            user_type = to_str(row[0]) or "unknown"
            count = row[1].get("value", 0) if row[1].get("type") != "null" else 0
            user_types[user_type] = count
    
    return {
        "total_users": total_users,
        "active_users": active_users,
        "verified_users": verified_users,
        "users_with_2fa": users_with_2fa,
        "user_types": user_types,
        "period_days": days
    }


@router.get(
    "/users/location-distribution",
    response_model=List[LocationDistributionResponse],
    summary="Get user location distribution"
)
async def get_location_distribution(
    current_user = Depends(require_admin)
):
    """Get user distribution by location. Admin only."""
    result = execute_query(
        """SELECT location, COUNT(*) as count
           FROM users
           WHERE location IS NOT NULL AND location != ''
           GROUP BY location
           ORDER BY count DESC
           LIMIT 20""",
        []
    )
    
    locations = []
    if result and result.get("rows"):
        for row in result["rows"]:
            locations.append({
                "location": to_str(row[0]),
                "count": row[1].get("value", 0) if row[1].get("type") != "null" else 0
            })
    
    return locations


# ==================== Project Analytics ====================

@router.get(
    "/projects/stats",
    response_model=ProjectStatsResponse,
    summary="Get project statistics"
)
async def get_project_stats(
    current_user = Depends(require_admin)
):
    """Get overall project statistics. Admin only."""
    # Status counts
    status_result = execute_query(
        "SELECT status, COUNT(*) FROM projects GROUP BY status",
        []
    )
    status_breakdown = {}
    if status_result and status_result.get("rows"):
        for row in status_result["rows"]:
            status = to_str(row[0]) or "unknown"
            count = row[1].get("value", 0) if row[1].get("type") != "null" else 0
            status_breakdown[status] = count
    
    # Average budget
    avg_result = execute_query(
        "SELECT AVG((COALESCE(budget_min, 0) + COALESCE(budget_max, 0)) / 2) FROM projects",
        []
    )
    avg_budget = 0
    if avg_result and avg_result.get("rows"):
        val = avg_result["rows"][0][0]
        if val.get("type") != "null":
            avg_budget = float(val.get("value", 0))
    
    # Recent projects
    thirty_days_ago = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
    recent_result = execute_query(
        "SELECT COUNT(*) FROM projects WHERE created_at >= ?",
        [thirty_days_ago]
    )
    recent_projects = recent_result["rows"][0][0].get("value", 0) if recent_result and recent_result.get("rows") else 0
    
    # Average proposals per project
    avg_proposals_result = execute_query(
        """SELECT AVG(proposal_count) FROM (
            SELECT COUNT(*) as proposal_count FROM proposals GROUP BY project_id
        )""",
        []
    )
    avg_proposals = 0
    if avg_proposals_result and avg_proposals_result.get("rows"):
        val = avg_proposals_result["rows"][0][0]
        if val.get("type") != "null":
            avg_proposals = float(val.get("value", 0))
    
    return {
        "status_breakdown": status_breakdown,
        "average_budget": avg_budget,
        "projects_last_30_days": recent_projects,
        "average_proposals_per_project": avg_proposals
    }


@router.get(
    "/projects/completion-rate",
    response_model=CompletionRateResponse,
    summary="Get project completion rate"
)
async def get_completion_rate(
    current_user = Depends(require_admin)
):
    """Get project completion rate. Admin only."""
    result = execute_query(
        """SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
            SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
            SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
           FROM projects""",
        []
    )
    
    total = 0
    completed = 0
    in_progress = 0
    cancelled = 0
    
    if result and result.get("rows"):
        row = result["rows"][0]
        total = row[0].get("value", 0) if row[0].get("type") != "null" else 0
        completed = row[1].get("value", 0) if row[1].get("type") != "null" else 0
        in_progress = row[2].get("value", 0) if row[2].get("type") != "null" else 0
        cancelled = row[3].get("value", 0) if row[3].get("type") != "null" else 0
    
    completion_rate = (completed / total * 100) if total > 0 else 0
    
    return {
        "total_projects": total,
        "completed": completed,
        "in_progress": in_progress,
        "cancelled": cancelled,
        "completion_rate": round(completion_rate, 2)
    }


@router.get(
    "/projects/popular-categories",
    response_model=List[CategoryPopularityResponse],
    summary="Get popular project categories"
)
async def get_popular_categories(
    limit: int = Query(default=10, ge=1, le=50),
    current_user = Depends(require_admin)
):
    """Get most popular project categories. Admin only."""
    result = execute_query(
        """SELECT category, COUNT(*) as count
           FROM projects
           WHERE category IS NOT NULL AND category != ''
           GROUP BY category
           ORDER BY count DESC
           LIMIT ?""",
        [limit]
    )
    
    categories = []
    if result and result.get("rows"):
        for row in result["rows"]:
            categories.append({
                "category": to_str(row[0]),
                "count": row[1].get("value", 0) if row[1].get("type") != "null" else 0
            })
    
    return categories


# ==================== Revenue Analytics ====================

@router.get(
    "/revenue/stats",
    response_model=RevenueStatsResponse,
    summary="Get revenue statistics"
)
async def get_revenue_stats(
    start_date: datetime = Query(..., description="Start date"),
    end_date: datetime = Query(..., description="End date"),
    current_user = Depends(require_admin)
):
    """Get revenue statistics for a date range. Admin only."""
    result = execute_query(
        """SELECT 
            COALESCE(SUM(amount), 0) as total,
            COUNT(*) as count,
            payment_method
           FROM payments
           WHERE created_at >= ? AND created_at <= ? AND status = 'completed'
           GROUP BY payment_method""",
        [start_date.isoformat(), end_date.isoformat()]
    )
    
    total_revenue = 0
    transaction_count = 0
    payment_methods = {}
    
    if result and result.get("rows"):
        for row in result["rows"]:
            amount = float(row[0].get("value", 0)) if row[0].get("type") != "null" else 0
            count = row[1].get("value", 0) if row[1].get("type") != "null" else 0
            method = to_str(row[2]) or "unknown"
            
            total_revenue += amount
            transaction_count += count
            payment_methods[method] = amount
    
    platform_fees = total_revenue * 0.10
    avg_transaction = total_revenue / transaction_count if transaction_count > 0 else 0
    
    return {
        "total_revenue": total_revenue,
        "platform_fees": platform_fees,
        "net_revenue": total_revenue - platform_fees,
        "transaction_count": transaction_count,
        "average_transaction": avg_transaction,
        "payment_methods": payment_methods
    }


@router.get(
    "/revenue/trends",
    response_model=List[RevenueTrendResponse],
    summary="Get revenue trends"
)
async def get_revenue_trends(
    start_date: datetime = Query(..., description="Start date"),
    end_date: datetime = Query(..., description="End date"),
    interval: IntervalEnum = Query(default=IntervalEnum.day),
    current_user = Depends(require_admin)
):
    """Get revenue trends over time. Admin only."""
    if interval.value == "day":
        date_format = "DATE(created_at)"
    elif interval.value == "week":
        date_format = "DATE(created_at, 'weekday 0', '-6 days')"
    else:
        date_format = "DATE(created_at, 'start of month')"
    
    result = execute_query(
        f"""SELECT {date_format} as date,
            COALESCE(SUM(amount), 0) as total,
            COUNT(*) as count
           FROM payments
           WHERE created_at >= ? AND created_at <= ? AND status = 'completed'
           GROUP BY {date_format}
           ORDER BY date""",
        [start_date.isoformat(), end_date.isoformat()]
    )
    
    trends = []
    if result and result.get("rows"):
        for row in result["rows"]:
            trends.append({
                "date": to_str(row[0]),
                "revenue": float(row[1].get("value", 0)) if row[1].get("type") != "null" else 0,
                "transactions": row[2].get("value", 0) if row[2].get("type") != "null" else 0
            })
    
    return trends


# ==================== Freelancer Analytics ====================

@router.get(
    "/freelancers/top",
    response_model=List[TopFreelancerResponse],
    summary="Get top freelancers"
)
async def get_top_freelancers(
    limit: int = Query(default=10, ge=1, le=100),
    sort_by: SortByEnum = Query(default=SortByEnum.earnings),
    current_user = Depends(require_admin)
):
    """Get top performing freelancers. Admin only."""
    order_by = {
        "earnings": "total_earnings DESC",
        "rating": "avg_rating DESC",
        "projects": "project_count DESC"
    }.get(sort_by.value, "total_earnings DESC")
    
    result = execute_query(
        f"""SELECT 
            u.id, u.first_name, u.last_name, u.email,
            COUNT(DISTINCT c.id) as project_count,
            COALESCE(SUM(p.amount), 0) as total_earnings,
            COALESCE(AVG(r.rating), 0) as avg_rating
           FROM users u
           LEFT JOIN contracts c ON c.freelancer_id = u.id
           LEFT JOIN payments p ON p.to_user_id = u.id AND p.status = 'completed'
           LEFT JOIN reviews r ON r.reviewee_id = u.id
           WHERE LOWER(u.user_type) = 'freelancer'
           GROUP BY u.id, u.first_name, u.last_name, u.email
           ORDER BY {order_by}
           LIMIT ?""",
        [limit]
    )
    
    freelancers = []
    if result and result.get("rows"):
        for row in result["rows"]:
            first = to_str(row[1]) or ""
            last = to_str(row[2]) or ""
            freelancers.append({
                "id": row[0].get("value") if row[0].get("type") != "null" else None,
                "name": f"{first} {last}".strip(),
                "email": to_str(row[3]),
                "project_count": row[4].get("value", 0) if row[4].get("type") != "null" else 0,
                "total_earnings": float(row[5].get("value", 0)) if row[5].get("type") != "null" else 0,
                "average_rating": round(float(row[6].get("value", 0)), 2) if row[6].get("type") != "null" else 0
            })
    
    return freelancers


@router.get(
    "/freelancers/{freelancer_id}/success-rate",
    response_model=FreelancerSuccessRateResponse,
    summary="Get freelancer success metrics"
)
async def get_freelancer_success_rate(
    freelancer_id: int,
    current_user = Depends(get_current_user)
):
    """Get success metrics for a specific freelancer. Accessible by freelancer or admin."""
    user_type = current_user.get("user_type", "").lower()
    role = current_user.get("role", "").lower()
    
    if current_user["id"] != freelancer_id and user_type != "admin" and role != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Proposals
    proposals_result = execute_query(
        """SELECT 
            COUNT(*) as submitted,
            SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted
           FROM proposals WHERE freelancer_id = ?""",
        [freelancer_id]
    )
    
    submitted = 0
    accepted = 0
    if proposals_result and proposals_result.get("rows"):
        row = proposals_result["rows"][0]
        submitted = row[0].get("value", 0) if row[0].get("type") != "null" else 0
        accepted = row[1].get("value", 0) if row[1].get("type") != "null" else 0
    
    # Completed projects
    completed_result = execute_query(
        "SELECT COUNT(*) FROM contracts WHERE freelancer_id = ? AND status = 'completed'",
        [freelancer_id]
    )
    completed = completed_result["rows"][0][0].get("value", 0) if completed_result and completed_result.get("rows") else 0
    
    # Average rating
    rating_result = execute_query(
        "SELECT AVG(rating) FROM reviews WHERE reviewee_id = ?",
        [freelancer_id]
    )
    avg_rating = 0
    if rating_result and rating_result.get("rows"):
        val = rating_result["rows"][0][0]
        if val.get("type") != "null":
            avg_rating = float(val.get("value", 0))
    
    # Total earnings
    earnings_result = execute_query(
        "SELECT COALESCE(SUM(amount), 0) FROM payments WHERE to_user_id = ? AND status = 'completed'",
        [freelancer_id]
    )
    total_earnings = 0
    if earnings_result and earnings_result.get("rows"):
        val = earnings_result["rows"][0][0]
        if val.get("type") != "null":
            total_earnings = float(val.get("value", 0))
    
    success_rate = (accepted / submitted * 100) if submitted > 0 else 0
    
    return {
        "proposals_submitted": submitted,
        "proposals_accepted": accepted,
        "success_rate": round(success_rate, 2),
        "projects_completed": completed,
        "average_rating": round(avg_rating, 2),
        "total_earnings": total_earnings
    }


# ==================== Client Analytics ====================

@router.get(
    "/clients/top",
    response_model=List[TopClientResponse],
    summary="Get top clients"
)
async def get_top_clients(
    limit: int = Query(default=10, ge=1, le=100),
    current_user = Depends(require_admin)
):
    """Get top clients by spending. Admin only."""
    result = execute_query(
        """SELECT 
            u.id, u.first_name, u.last_name, u.email,
            COUNT(DISTINCT pr.id) as project_count,
            COALESCE(SUM(p.amount), 0) as total_spent
           FROM users u
           LEFT JOIN projects pr ON pr.client_id = u.id
           LEFT JOIN payments p ON p.from_user_id = u.id AND p.status = 'completed'
           WHERE LOWER(u.user_type) = 'client'
           GROUP BY u.id, u.first_name, u.last_name, u.email
           ORDER BY total_spent DESC
           LIMIT ?""",
        [limit]
    )
    
    clients = []
    if result and result.get("rows"):
        for row in result["rows"]:
            first = to_str(row[1]) or ""
            last = to_str(row[2]) or ""
            clients.append({
                "id": row[0].get("value") if row[0].get("type") != "null" else None,
                "name": f"{first} {last}".strip(),
                "email": to_str(row[3]),
                "project_count": row[4].get("value", 0) if row[4].get("type") != "null" else 0,
                "total_spent": float(row[5].get("value", 0)) if row[5].get("type") != "null" else 0
            })
    
    return clients


# ==================== Platform Health ====================

@router.get(
    "/platform/health",
    response_model=PlatformHealthResponse,
    summary="Get platform health metrics"
)
async def get_platform_health(
    current_user = Depends(require_admin)
):
    """Get platform health metrics. Admin only."""
    # Active disputes
    disputes_result = execute_query(
        "SELECT COUNT(*) FROM disputes WHERE status IN ('open', 'investigating')",
        []
    )
    active_disputes = disputes_result["rows"][0][0].get("value", 0) if disputes_result and disputes_result.get("rows") else 0
    
    # Pending tickets
    tickets_result = execute_query(
        "SELECT COUNT(*) FROM support_tickets WHERE status = 'open'",
        []
    )
    pending_tickets = tickets_result["rows"][0][0].get("value", 0) if tickets_result and tickets_result.get("rows") else 0
    
    # User satisfaction
    satisfaction_result = execute_query(
        "SELECT AVG(rating) FROM reviews",
        []
    )
    user_satisfaction = 0
    if satisfaction_result and satisfaction_result.get("rows"):
        val = satisfaction_result["rows"][0][0]
        if val.get("type") != "null":
            user_satisfaction = float(val.get("value", 0))
    
    # Daily active users
    yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
    dau_result = execute_query(
        "SELECT COUNT(*) FROM users WHERE last_login >= ?",
        [yesterday]
    )
    daily_active = dau_result["rows"][0][0].get("value", 0) if dau_result and dau_result.get("rows") else 0
    
    return {
        "active_disputes": active_disputes,
        "pending_support_tickets": pending_tickets,
        "average_response_time_hours": 0,  # Would need message tracking
        "user_satisfaction_rating": round(user_satisfaction, 2),
        "daily_active_users": daily_active
    }


@router.get(
    "/platform/engagement",
    response_model=EngagementMetricsResponse,
    summary="Get engagement metrics"
)
async def get_engagement_metrics(
    days: int = Query(default=30, ge=1, le=365),
    current_user = Depends(require_admin)
):
    """Get user engagement metrics. Admin only."""
    cutoff_date = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    
    # Messages
    messages_result = execute_query(
        "SELECT COUNT(*) FROM messages WHERE created_at >= ?",
        [cutoff_date]
    )
    messages = messages_result["rows"][0][0].get("value", 0) if messages_result and messages_result.get("rows") else 0
    
    # Proposals
    proposals_result = execute_query(
        "SELECT COUNT(*) FROM proposals WHERE created_at >= ?",
        [cutoff_date]
    )
    proposals = proposals_result["rows"][0][0].get("value", 0) if proposals_result and proposals_result.get("rows") else 0
    
    # Projects
    projects_result = execute_query(
        "SELECT COUNT(*) FROM projects WHERE created_at >= ?",
        [cutoff_date]
    )
    projects = projects_result["rows"][0][0].get("value", 0) if projects_result and projects_result.get("rows") else 0
    
    # Contracts
    contracts_result = execute_query(
        "SELECT COUNT(*) FROM contracts WHERE created_at >= ?",
        [cutoff_date]
    )
    contracts = contracts_result["rows"][0][0].get("value", 0) if contracts_result and contracts_result.get("rows") else 0
    
    # Reviews
    reviews_result = execute_query(
        "SELECT COUNT(*) FROM reviews WHERE created_at >= ?",
        [cutoff_date]
    )
    reviews = reviews_result["rows"][0][0].get("value", 0) if reviews_result and reviews_result.get("rows") else 0
    
    return {
        "period_days": days,
        "messages_sent": messages,
        "proposals_submitted": proposals,
        "projects_posted": projects,
        "contracts_created": contracts,
        "reviews_posted": reviews
    }


# ==================== Dashboard Summary ====================

@router.get(
    "/dashboard/summary",
    summary="Get dashboard summary"
)
async def get_dashboard_summary(
    current_user = Depends(require_admin)
):
    """Get comprehensive dashboard summary. Admin only."""
    now = datetime.now(timezone.utc)
    thirty_days_ago = now - timedelta(days=30)
    
    # Get all metrics
    users_stats = await get_active_user_stats(30, current_user)
    project_stats = await get_project_stats(current_user)
    revenue_stats = await get_revenue_stats(thirty_days_ago, now, current_user)
    health_stats = await get_platform_health(current_user)
    engagement_stats = await get_engagement_metrics(30, current_user)
    
    return {
        "users": users_stats,
        "projects": project_stats,
        "revenue": revenue_stats,
        "health": health_stats,
        "engagement": engagement_stats
    }
