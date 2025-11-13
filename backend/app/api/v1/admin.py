"""
@AI-HINT: Admin Dashboard API - System monitoring, analytics, and management
Provides endpoints for Super Admin to monitor platform health, user activity,
financial metrics, and perform administrative actions.
"""
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, desc, case

from app.db.session import get_db
from app.core.security import get_current_active_user
from app.models import User, Project, Proposal, Contract, Payment, Skill
from pydantic import BaseModel

router = APIRouter()


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
    type: str  # 'user_joined', 'project_posted', 'proposal_submitted', 'contract_created', 'payment_made'
    description: str
    timestamp: datetime
    user_name: str
    amount: Optional[float]


# ============ Dependency: Admin Only ============

async def get_admin_user(current_user: User = Depends(get_current_active_user)):
    """Verify that current user is an admin"""
    if current_user.user_type != 'Admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


# ============ Dashboard Endpoints ============

@router.get("/admin/dashboard/stats", response_model=SystemStats)
async def get_system_stats(
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """
    Get overall system statistics.
    
    **Admin only** - provides high-level metrics about platform usage.
    """
    total_users = db.query(func.count(User.id)).scalar()
    total_clients = db.query(func.count(User.id)).filter(User.user_type == 'Client').scalar()
    total_freelancers = db.query(func.count(User.id)).filter(User.user_type == 'Freelancer').scalar()
    total_projects = db.query(func.count(Project.id)).scalar()
    total_contracts = db.query(func.count(Contract.id)).scalar()
    
    total_revenue = db.query(func.coalesce(func.sum(Payment.amount), 0.0)).filter(
        Payment.status == 'completed'
    ).scalar()
    
    active_projects = db.query(func.count(Project.id)).filter(
        Project.status.in_(['open', 'in_progress'])
    ).scalar()
    
    pending_proposals = db.query(func.count(Proposal.id)).filter(
        Proposal.status == 'submitted'
    ).scalar()
    
    return SystemStats(
        total_users=total_users or 0,
        total_clients=total_clients or 0,
        total_freelancers=total_freelancers or 0,
        total_projects=total_projects or 0,
        total_contracts=total_contracts or 0,
        total_revenue=float(total_revenue or 0.0),
        active_projects=active_projects or 0,
        pending_proposals=pending_proposals or 0
    )


@router.get("/admin/dashboard/user-activity", response_model=UserActivity)
async def get_user_activity(
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """
    Get user activity metrics.
    
    Tracks daily/weekly/monthly active users and new user signups.
    """
    now = datetime.utcnow()
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_ago = now - timedelta(days=7)
    month_ago = now - timedelta(days=30)
    
    # New users
    new_today = db.query(func.count(User.id)).filter(User.joined_at >= today).scalar()
    new_week = db.query(func.count(User.id)).filter(User.joined_at >= week_ago).scalar()
    new_month = db.query(func.count(User.id)).filter(User.joined_at >= month_ago).scalar()
    
    # For DAU/WAU/MAU, we'd ideally track last_active_at
    # For now, estimate based on updated_at
    dau = db.query(func.count(User.id)).filter(User.updated_at >= today).scalar()
    wau = db.query(func.count(User.id)).filter(User.updated_at >= week_ago).scalar()
    mau = db.query(func.count(User.id)).filter(User.updated_at >= month_ago).scalar()
    
    return UserActivity(
        daily_active_users=dau or 0,
        weekly_active_users=wau or 0,
        monthly_active_users=mau or 0,
        new_users_today=new_today or 0,
        new_users_this_week=new_week or 0,
        new_users_this_month=new_month or 0
    )


@router.get("/admin/dashboard/project-metrics", response_model=ProjectMetrics)
async def get_project_metrics(
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """
    Get project-related metrics.
    
    Breakdown of projects by status and financial value.
    """
    open_count = db.query(func.count(Project.id)).filter(Project.status == 'open').scalar()
    in_progress_count = db.query(func.count(Project.id)).filter(Project.status == 'in_progress').scalar()
    completed_count = db.query(func.count(Project.id)).filter(Project.status == 'completed').scalar()
    cancelled_count = db.query(func.count(Project.id)).filter(Project.status == 'cancelled').scalar()
    
    # Calculate average and total project value
    avg_value = db.query(func.avg((Project.budget_min + Project.budget_max) / 2)).scalar()
    total_value = db.query(func.sum((Project.budget_min + Project.budget_max) / 2)).scalar()
    
    return ProjectMetrics(
        open_projects=open_count or 0,
        in_progress_projects=in_progress_count or 0,
        completed_projects=completed_count or 0,
        cancelled_projects=cancelled_count or 0,
        avg_project_value=float(avg_value or 0.0),
        total_project_value=float(total_value or 0.0)
    )


@router.get("/admin/dashboard/financial-metrics", response_model=FinancialMetrics)
async def get_financial_metrics(
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """
    Get financial analytics and revenue metrics.
    
    Platform revenue, pending payments, and fees collected.
    """
    now = datetime.utcnow()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    week_start = now - timedelta(days=now.weekday())
    
    total_revenue = db.query(func.coalesce(func.sum(Payment.amount), 0.0)).filter(
        Payment.status == 'completed'
    ).scalar()
    
    revenue_month = db.query(func.coalesce(func.sum(Payment.amount), 0.0)).filter(
        and_(Payment.status == 'completed', Payment.created_at >= month_start)
    ).scalar()
    
    revenue_week = db.query(func.coalesce(func.sum(Payment.amount), 0.0)).filter(
        and_(Payment.status == 'completed', Payment.created_at >= week_start)
    ).scalar()
    
    pending = db.query(func.coalesce(func.sum(Payment.amount), 0.0)).filter(
        Payment.status == 'pending'
    ).scalar()
    
    completed_amount = db.query(func.coalesce(func.sum(Payment.amount), 0.0)).filter(
        Payment.status == 'completed'
    ).scalar()
    
    # Platform fee is typically 10-15% - using 12.5% for calculation
    platform_fees = float(completed_amount or 0.0) * 0.125
    
    return FinancialMetrics(
        total_revenue=float(total_revenue or 0.0),
        revenue_this_month=float(revenue_month or 0.0),
        revenue_this_week=float(revenue_week or 0.0),
        pending_payments=float(pending or 0.0),
        completed_payments=float(completed_amount or 0.0),
        platform_fees_collected=platform_fees
    )


@router.get("/admin/dashboard/top-freelancers", response_model=List[TopFreelancer])
async def get_top_freelancers(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """
    Get top earning freelancers.
    
    Ranked by total earnings and completed projects.
    """
    # Query freelancers with their earnings
    freelancers = db.query(
        User.id,
        User.name,
        User.email,
        func.coalesce(func.sum(Payment.amount), 0.0).label('total_earnings'),
        func.count(Contract.id).label('completed_projects')
    ).join(
        Payment, Payment.to_user_id == User.id, isouter=True
    ).join(
        Contract, Contract.freelancer_id == User.id, isouter=True
    ).filter(
        User.user_type == 'Freelancer',
        or_(Payment.status == 'completed', Payment.status == None)
    ).group_by(
        User.id, User.name, User.email
    ).order_by(
        desc('total_earnings')
    ).limit(limit).all()
    
    return [
        TopFreelancer(
            id=f.id,
            name=f.name,
            email=f.email,
            total_earnings=float(f.total_earnings),
            completed_projects=f.completed_projects,
            average_rating=None  # TODO: Add rating system
        )
        for f in freelancers
    ]


@router.get("/admin/dashboard/top-clients", response_model=List[TopClient])
async def get_top_clients(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """
    Get top spending clients.
    
    Ranked by total spending and project activity.
    """
    clients = db.query(
        User.id,
        User.name,
        User.email,
        func.coalesce(func.sum(Payment.amount), 0.0).label('total_spent'),
        func.count(case((Project.status.in_(['open', 'in_progress']), Project.id))).label('active_projects'),
        func.count(case((Project.status == 'completed', Project.id))).label('completed_projects')
    ).join(
        Payment, Payment.from_user_id == User.id, isouter=True
    ).join(
        Project, Project.client_id == User.id, isouter=True
    ).filter(
        User.user_type == 'Client',
        or_(Payment.status == 'completed', Payment.status == None)
    ).group_by(
        User.id, User.name, User.email
    ).order_by(
        desc('total_spent')
    ).limit(10).all()
    
    return [
        TopClient(
            id=c.id,
            name=c.name,
            email=c.email,
            total_spent=float(c.total_spent),
            active_projects=c.active_projects or 0,
            completed_projects=c.completed_projects or 0
        )
        for c in clients
    ]


@router.get("/admin/dashboard/recent-activity", response_model=List[RecentActivity])
async def get_recent_activity(
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """
    Get recent platform activity feed.
    
    Shows latest user signups, projects, proposals, contracts, and payments.
    """
    activities = []
    
    # Recent users
    recent_users = db.query(User).order_by(desc(User.joined_at)).limit(5).all()
    for user in recent_users:
        activities.append({
            'type': 'user_joined',
            'description': f"{user.user_type} joined the platform",
            'timestamp': user.joined_at,
            'user_name': user.name,
            'amount': None
        })
    
    # Recent projects
    recent_projects = db.query(Project).join(User, Project.client_id == User.id).order_by(desc(Project.created_at)).limit(5).all()
    for project in recent_projects:
        client = db.query(User).filter(User.id == project.client_id).first()
        activities.append({
            'type': 'project_posted',
            'description': f"Posted: {project.title}",
            'timestamp': project.created_at,
            'user_name': client.name if client else "Unknown",
            'amount': project.budget_max
        })
    
    # Recent proposals
    recent_proposals = db.query(Proposal).join(User, Proposal.freelancer_id == User.id).order_by(desc(Proposal.created_at)).limit(5).all()
    for proposal in recent_proposals:
        freelancer = db.query(User).filter(User.id == proposal.freelancer_id).first()
        activities.append({
            'type': 'proposal_submitted',
            'description': f"Submitted proposal",
            'timestamp': proposal.created_at,
            'user_name': freelancer.name if freelancer else "Unknown",
            'amount': proposal.estimated_hours * proposal.hourly_rate if proposal.hourly_rate else None
        })
    
    # Recent payments
    recent_payments = db.query(Payment).join(User, Payment.to_user_id == User.id).order_by(desc(Payment.created_at)).limit(5).all()
    for payment in recent_payments:
        payee = db.query(User).filter(User.id == payment.to_user_id).first()
        activities.append({
            'type': 'payment_made',
            'description': f"Payment: {payment.description or payment.payment_type}",
            'timestamp': payment.created_at,
            'user_name': payee.name if payee else "Unknown",
            'amount': payment.amount
        })
    
    # Sort all activities by timestamp
    activities.sort(key=lambda x: x['timestamp'], reverse=True)
    
    return [RecentActivity(**activity) for activity in activities[:limit]]


@router.get("/admin/users/list")
async def list_all_users(
    user_type: Optional[str] = Query(None, description="Filter by user type: Client, Freelancer, Admin"),
    search: Optional[str] = Query(None, description="Search by name or email"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """
    List all users with filtering options.
    
    **Admin only** - for user management.
    """
    query = db.query(User)
    
    if user_type:
        query = query.filter(User.user_type == user_type)
    
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                User.name.ilike(search_pattern),
                User.email.ilike(search_pattern)
            )
        )
    
    total = query.count()
    users = query.offset(skip).limit(limit).all()
    
    return {
        "total": total,
        "users": [
            {
                "id": u.id,
                "email": u.email,
                "name": u.name,
                "user_type": u.user_type,
                "is_active": u.is_active,
                "joined_at": u.joined_at,
                "location": u.location,
                "hourly_rate": u.hourly_rate if u.user_type == 'Freelancer' else None
            }
            for u in users
        ]
    }


@router.post("/admin/users/{user_id}/toggle-status")
async def toggle_user_status(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """
    Activate or deactivate a user account.
    
    **Admin only** - for account moderation.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_active = not user.is_active
    db.commit()
    
    return {
        "success": True,
        "user_id": user_id,
        "is_active": user.is_active
    }
