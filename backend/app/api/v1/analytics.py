# @AI-HINT: Analytics API endpoints for platform metrics and reporting
# Provides REST API for analytics data access with caching

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta

from app.db.session import get_db
from app.core.security import get_current_user, require_admin
from app.services.analytics_service import AnalyticsService
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
from app.models.user import User
from app.core.rate_limit import api_rate_limit

router = APIRouter()


# ==================== User Analytics ====================

@router.get(
    "/users/registration-trends",
    response_model=List[RegistrationTrendResponse],
    summary="Get user registration trends",
    description="Retrieve user registration statistics over time with daily, weekly, or monthly aggregation"
)
@api_rate_limit()
async def get_registration_trends(
    start_date: datetime = Query(..., description="Start date for analysis"),
    end_date: datetime = Query(..., description="End date for analysis"),
    interval: IntervalEnum = Query(default=IntervalEnum.day, description="Aggregation interval"),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Get user registration trends over a specified time period.
    
    **Admin only** - Returns registration counts by user type.
    """
    analytics = AnalyticsService(db)
    return analytics.get_user_registration_trends(start_date, end_date, interval.value)


@router.get(
    "/users/active-stats",
    response_model=ActiveUsersStatsResponse,
    summary="Get active user statistics",
    description="Retrieve statistics about active, verified, and 2FA-enabled users"
)
@api_rate_limit()
async def get_active_user_stats(
    days: int = Query(default=30, ge=1, le=365, description="Number of days to look back"),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Get active user statistics for the specified period.
    
    **Admin only** - Returns user activity metrics.
    """
    analytics = AnalyticsService(db)
    return analytics.get_active_users_stats(days)


@router.get(
    "/users/location-distribution",
    response_model=List[LocationDistributionResponse],
    summary="Get user location distribution",
    description="Get user count by location (top 20)"
)
@api_rate_limit()
async def get_location_distribution(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Get user distribution by location.
    
    **Admin only** - Returns top 20 locations by user count.
    """
    analytics = AnalyticsService(db)
    return analytics.get_user_location_distribution()


# ==================== Project Analytics ====================

@router.get(
    "/projects/stats",
    response_model=ProjectStatsResponse,
    summary="Get project statistics",
    description="Get overall project statistics including status breakdown and averages"
)
@api_rate_limit()
async def get_project_stats(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Get overall project statistics.
    
    **Admin only** - Returns comprehensive project metrics.
    """
    analytics = AnalyticsService(db)
    return analytics.get_project_stats()


@router.get(
    "/projects/completion-rate",
    response_model=CompletionRateResponse,
    summary="Get project completion rate",
    description="Calculate project completion metrics"
)
@api_rate_limit()
async def get_completion_rate(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Get project completion rate and status breakdown.
    
    **Admin only** - Returns completion metrics.
    """
    analytics = AnalyticsService(db)
    return analytics.get_project_completion_rate()


@router.get(
    "/projects/popular-categories",
    response_model=List[CategoryPopularityResponse],
    summary="Get popular project categories",
    description="Get most popular project categories by project count"
)
@api_rate_limit()
async def get_popular_categories(
    limit: int = Query(default=10, ge=1, le=50, description="Number of categories to return"),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Get most popular project categories.
    
    **Admin only** - Returns top categories by project count.
    """
    analytics = AnalyticsService(db)
    return analytics.get_popular_project_categories(limit)


# ==================== Revenue Analytics ====================

@router.get(
    "/revenue/stats",
    response_model=RevenueStatsResponse,
    summary="Get revenue statistics",
    description="Get revenue statistics for specified date range"
)
@api_rate_limit()
async def get_revenue_stats(
    start_date: datetime = Query(..., description="Start date"),
    end_date: datetime = Query(..., description="End date"),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Get revenue statistics for a date range.
    
    **Admin only** - Returns total revenue, fees, and transaction metrics.
    """
    analytics = AnalyticsService(db)
    return analytics.get_revenue_stats(start_date, end_date)


@router.get(
    "/revenue/trends",
    response_model=List[RevenueTrendResponse],
    summary="Get revenue trends",
    description="Get revenue trends over time with daily, weekly, or monthly aggregation"
)
@api_rate_limit()
async def get_revenue_trends(
    start_date: datetime = Query(..., description="Start date"),
    end_date: datetime = Query(..., description="End date"),
    interval: IntervalEnum = Query(default=IntervalEnum.day, description="Aggregation interval"),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Get revenue trends over time.
    
    **Admin only** - Returns revenue trends by interval.
    """
    analytics = AnalyticsService(db)
    return analytics.get_revenue_trends(start_date, end_date, interval.value)


# ==================== Freelancer Analytics ====================

@router.get(
    "/freelancers/top",
    response_model=List[TopFreelancerResponse],
    summary="Get top freelancers",
    description="Get top performing freelancers ranked by earnings, rating, or project count"
)
@api_rate_limit()
async def get_top_freelancers(
    limit: int = Query(default=10, ge=1, le=100, description="Number of results"),
    sort_by: SortByEnum = Query(default=SortByEnum.earnings, description="Sort criteria"),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Get top performing freelancers.
    
    **Admin only** - Returns ranked list of freelancers.
    """
    analytics = AnalyticsService(db)
    return analytics.get_top_freelancers(limit, sort_by.value)


@router.get(
    "/freelancers/{freelancer_id}/success-rate",
    response_model=FreelancerSuccessRateResponse,
    summary="Get freelancer success metrics",
    description="Get success rate and performance metrics for a specific freelancer"
)
@api_rate_limit()
async def get_freelancer_success_rate(
    freelancer_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get success metrics for a specific freelancer.
    
    Accessible by the freelancer themselves or admin.
    """
    # Allow access to own stats or admin
    if current_user.id != freelancer_id and current_user.user_type != "admin":
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Access denied")
    
    analytics = AnalyticsService(db)
    return analytics.get_freelancer_success_rate(freelancer_id)


# ==================== Client Analytics ====================

@router.get(
    "/clients/top",
    response_model=List[TopClientResponse],
    summary="Get top clients",
    description="Get top clients by total spending"
)
@api_rate_limit()
async def get_top_clients(
    limit: int = Query(default=10, ge=1, le=100, description="Number of results"),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Get top clients by spending.
    
    **Admin only** - Returns ranked list of clients.
    """
    analytics = AnalyticsService(db)
    return analytics.get_top_clients(limit)


# ==================== Platform Health ====================

@router.get(
    "/platform/health",
    response_model=PlatformHealthResponse,
    summary="Get platform health metrics",
    description="Get overall platform health indicators"
)
@api_rate_limit()
async def get_platform_health(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Get platform health metrics.
    
    **Admin only** - Returns health indicators.
    """
    analytics = AnalyticsService(db)
    return analytics.get_platform_health_metrics()


@router.get(
    "/platform/engagement",
    response_model=EngagementMetricsResponse,
    summary="Get engagement metrics",
    description="Get user engagement statistics for specified period"
)
@api_rate_limit()
async def get_engagement_metrics(
    days: int = Query(default=30, ge=1, le=365, description="Number of days to look back"),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Get user engagement metrics.
    
    **Admin only** - Returns engagement statistics.
    """
    analytics = AnalyticsService(db)
    return analytics.get_engagement_metrics(days)


# ==================== Dashboard Summary ====================

@router.get(
    "/dashboard/summary",
    summary="Get dashboard summary",
    description="Get comprehensive dashboard summary with key metrics"
)
@api_rate_limit()
async def get_dashboard_summary(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Get comprehensive dashboard summary.
    
    **Admin only** - Returns all key metrics for admin dashboard.
    """
    analytics = AnalyticsService(db)
    
    # Calculate date ranges
    now = datetime.utcnow()
    thirty_days_ago = now - timedelta(days=30)
    
    return {
        "users": analytics.get_active_users_stats(30),
        "projects": analytics.get_project_stats(),
        "revenue": analytics.get_revenue_stats(thirty_days_ago, now),
        "health": analytics.get_platform_health_metrics(),
        "engagement": analytics.get_engagement_metrics(30)
    }
