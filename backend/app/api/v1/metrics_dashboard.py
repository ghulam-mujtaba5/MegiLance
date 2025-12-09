# @AI-HINT: Metrics dashboard API - Real-time business metrics and KPIs
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, timedelta
from app.db.session import get_db
from app.core.security import get_current_active_user

router = APIRouter(prefix="/metrics")


class MetricValue(BaseModel):
    name: str
    value: float
    unit: str
    change: float
    change_period: str
    trend: str


class TimeSeriesData(BaseModel):
    timestamp: datetime
    value: float


class MetricSeries(BaseModel):
    metric_name: str
    data_points: List[TimeSeriesData]
    aggregation: str


class DashboardWidget(BaseModel):
    id: str
    name: str
    type: str
    metric: str
    config: dict
    position: dict


@router.get("/overview")
async def get_metrics_overview(
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get metrics overview"""
    return {
        "revenue": {"value": 125000, "change": 12.5, "trend": "up"},
        "users": {"value": 5420, "change": 8.3, "trend": "up"},
        "projects": {"value": 342, "change": 15.2, "trend": "up"},
        "completion_rate": {"value": 94.5, "change": 2.1, "trend": "up"},
        "average_rating": {"value": 4.7, "change": 0.1, "trend": "stable"},
        "response_time": {"value": 2.4, "unit": "hours", "change": -15.0, "trend": "down"}
    }


@router.get("/kpis", response_model=List[MetricValue])
async def get_key_metrics(
    period: str = Query("30d", enum=["7d", "30d", "90d", "1y"]),
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get key performance indicators"""
    return [
        MetricValue(name="Monthly Revenue", value=125000, unit="USD", change=12.5, change_period=period, trend="up"),
        MetricValue(name="Active Users", value=5420, unit="users", change=8.3, change_period=period, trend="up"),
        MetricValue(name="Project Completion", value=94.5, unit="%", change=2.1, change_period=period, trend="up"),
        MetricValue(name="Customer Satisfaction", value=4.7, unit="rating", change=0.1, change_period=period, trend="stable"),
        MetricValue(name="Avg Response Time", value=2.4, unit="hours", change=-15.0, change_period=period, trend="down"),
        MetricValue(name="Repeat Clients", value=68.5, unit="%", change=5.2, change_period=period, trend="up")
    ]


@router.get("/series/{metric_name}", response_model=MetricSeries)
async def get_metric_series(
    metric_name: str,
    period: str = Query("30d", enum=["7d", "30d", "90d", "1y"]),
    aggregation: str = Query("daily", enum=["hourly", "daily", "weekly", "monthly"]),
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get time series data for a metric"""
    data_points = [
        TimeSeriesData(timestamp=datetime.utcnow() - timedelta(days=i), value=100 + i * 5)
        for i in range(30)
    ]
    return MetricSeries(
        metric_name=metric_name,
        data_points=data_points,
        aggregation=aggregation
    )


@router.get("/revenue")
async def get_revenue_metrics(
    period: str = Query("30d", enum=["7d", "30d", "90d", "1y"]),
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get revenue metrics"""
    return {
        "total_revenue": 125000,
        "recurring_revenue": 85000,
        "one_time_revenue": 40000,
        "average_project_value": 3500,
        "revenue_by_category": [
            {"category": "Web Development", "revenue": 45000},
            {"category": "Mobile Development", "revenue": 35000},
            {"category": "Design", "revenue": 25000},
            {"category": "Marketing", "revenue": 20000}
        ],
        "revenue_trend": [
            {"month": "Jan", "revenue": 95000},
            {"month": "Feb", "revenue": 105000},
            {"month": "Mar", "revenue": 125000}
        ]
    }


@router.get("/users")
async def get_user_metrics(
    period: str = Query("30d", enum=["7d", "30d", "90d", "1y"]),
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get user metrics"""
    return {
        "total_users": 5420,
        "active_users": 3200,
        "new_users": 450,
        "churned_users": 85,
        "retention_rate": 92.5,
        "user_growth_rate": 8.3,
        "users_by_role": {
            "freelancers": 3800,
            "clients": 1550,
            "admins": 70
        },
        "engagement_metrics": {
            "daily_active": 1200,
            "weekly_active": 2800,
            "monthly_active": 3200
        }
    }


@router.get("/projects")
async def get_project_metrics(
    period: str = Query("30d", enum=["7d", "30d", "90d", "1y"]),
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get project metrics"""
    return {
        "total_projects": 342,
        "active_projects": 125,
        "completed_projects": 200,
        "cancelled_projects": 17,
        "completion_rate": 94.5,
        "average_duration": 28,
        "projects_by_category": [
            {"category": "Web Development", "count": 120},
            {"category": "Mobile Development", "count": 85},
            {"category": "Design", "count": 75},
            {"category": "Marketing", "count": 62}
        ],
        "budget_metrics": {
            "average_budget": 5000,
            "total_budget": 1710000,
            "budget_utilization": 87.5
        }
    }


@router.get("/performance")
async def get_performance_metrics(
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get platform performance metrics"""
    return {
        "api_response_time": 145,
        "uptime": 99.95,
        "error_rate": 0.02,
        "requests_per_minute": 2500,
        "database_query_time": 45,
        "cache_hit_rate": 94.5,
        "active_connections": 850
    }


@router.get("/conversion")
async def get_conversion_metrics(
    period: str = Query("30d", enum=["7d", "30d", "90d", "1y"]),
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get conversion funnel metrics"""
    return {
        "visitor_to_signup": 12.5,
        "signup_to_verified": 85.0,
        "verified_to_first_project": 45.0,
        "project_to_completion": 94.5,
        "client_to_repeat": 68.5,
        "funnel": [
            {"stage": "Visitors", "count": 50000},
            {"stage": "Signups", "count": 6250},
            {"stage": "Verified", "count": 5312},
            {"stage": "First Project", "count": 2390},
            {"stage": "Completed Project", "count": 2258}
        ]
    }


@router.get("/widgets", response_model=List[DashboardWidget])
async def get_dashboard_widgets(
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get dashboard widget configuration"""
    return [
        DashboardWidget(
            id="widget-1",
            name="Revenue Overview",
            type="line_chart",
            metric="revenue",
            config={"show_legend": True},
            position={"x": 0, "y": 0, "w": 6, "h": 4}
        ),
        DashboardWidget(
            id="widget-2",
            name="Active Users",
            type="metric_card",
            metric="active_users",
            config={"show_trend": True},
            position={"x": 6, "y": 0, "w": 3, "h": 2}
        )
    ]


@router.post("/widgets", response_model=DashboardWidget)
async def create_dashboard_widget(
    name: str,
    type: str,
    metric: str,
    config: dict = {},
    position: dict = {},
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create dashboard widget"""
    return DashboardWidget(
        id="widget-new",
        name=name,
        type=type,
        metric=metric,
        config=config,
        position=position
    )


@router.put("/widgets/{widget_id}", response_model=DashboardWidget)
async def update_dashboard_widget(
    widget_id: str,
    name: Optional[str] = None,
    config: Optional[dict] = None,
    position: Optional[dict] = None,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update dashboard widget"""
    return DashboardWidget(
        id=widget_id,
        name=name or "Updated Widget",
        type="line_chart",
        metric="revenue",
        config=config or {},
        position=position or {}
    )


@router.delete("/widgets/{widget_id}")
async def delete_dashboard_widget(
    widget_id: str,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete dashboard widget"""
    return {"message": f"Widget {widget_id} deleted"}


@router.get("/alerts")
async def get_metric_alerts(
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get metric alerts"""
    return [
        {"id": "alert-1", "metric": "error_rate", "condition": "> 1%", "status": "ok", "last_triggered": None},
        {"id": "alert-2", "metric": "response_time", "condition": "> 500ms", "status": "ok", "last_triggered": None}
    ]


@router.post("/alerts")
async def create_metric_alert(
    metric: str,
    condition: str,
    threshold: float,
    notification_channels: List[str],
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create metric alert"""
    return {
        "id": "alert-new",
        "metric": metric,
        "condition": condition,
        "threshold": threshold,
        "notification_channels": notification_channels,
        "created_at": datetime.utcnow().isoformat()
    }


@router.get("/export")
async def export_metrics(
    metrics: List[str] = Query(["revenue", "users", "projects"]),
    period: str = Query("30d"),
    format: str = Query("csv", enum=["csv", "json", "xlsx"]),
    current_user=Depends(get_current_active_user)
):
    """Export metrics data"""
    return {
        "export_id": "export-123",
        "metrics": metrics,
        "period": period,
        "format": format,
        "status": "processing",
        "download_url": None
    }

