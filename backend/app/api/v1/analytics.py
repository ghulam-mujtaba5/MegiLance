# @AI-HINT: Analytics API endpoints - delegates to analytics_service for all data access
from fastapi import APIRouter, Depends, Query, HTTPException
from typing import List
from datetime import datetime, timedelta, timezone

from app.core.security import get_current_user
from app.services import analytics_service
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
    return analytics_service.get_registration_trends(
        start_date.isoformat(), end_date.isoformat(), interval.value
    )


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
    return analytics_service.get_active_user_stats(days)


@router.get(
    "/users/location-distribution",
    response_model=List[LocationDistributionResponse],
    summary="Get user location distribution"
)
async def get_location_distribution(
    current_user = Depends(require_admin)
):
    """Get user distribution by location. Admin only."""
    return analytics_service.get_location_distribution()


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
    return analytics_service.get_project_stats()


@router.get(
    "/projects/completion-rate",
    response_model=CompletionRateResponse,
    summary="Get project completion rate"
)
async def get_completion_rate(
    current_user = Depends(require_admin)
):
    """Get project completion rate. Admin only."""
    return analytics_service.get_completion_rate()


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
    return analytics_service.get_popular_categories(limit)


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
    return analytics_service.get_revenue_stats(
        start_date.isoformat(), end_date.isoformat()
    )


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
    return analytics_service.get_revenue_trends(
        start_date.isoformat(), end_date.isoformat(), interval.value
    )


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
    return analytics_service.get_top_freelancers(limit, sort_by.value)


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
    
    return analytics_service.get_freelancer_success_rate(freelancer_id)


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
    return analytics_service.get_top_clients(limit)


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
    return analytics_service.get_platform_health()


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
    return analytics_service.get_engagement_metrics(days)


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
    
    return {
        "users": analytics_service.get_active_user_stats(30),
        "projects": analytics_service.get_project_stats(),
        "revenue": analytics_service.get_revenue_stats(
            thirty_days_ago.isoformat(), now.isoformat()
        ),
        "health": analytics_service.get_platform_health(),
        "engagement": analytics_service.get_engagement_metrics(30)
    }
