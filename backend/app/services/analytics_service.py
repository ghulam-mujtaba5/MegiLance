# @AI-HINT: Analytics service for platform metrics and reporting
# Provides data aggregation for user, project, revenue, and performance analytics

from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from sqlalchemy import func, and_, or_, extract
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.project import Project
from app.models.payment import Payment
from app.models.proposal import Proposal
from app.models.contract import Contract
from app.models.review import Review
from app.models.message import Message
from app.models.notification import Notification
from app.models.time_entry import TimeEntry
from app.models.dispute import Dispute
from app.models.support_ticket import SupportTicket


class AnalyticsService:
    """Service for generating platform analytics and reports"""
    
    def __init__(self, db: Session):
        self.db = db
    
    # ==================== User Analytics ====================
    
    def get_user_registration_trends(
        self, 
        start_date: datetime, 
        end_date: datetime,
        interval: str = "day"  # day, week, month
    ) -> List[Dict[str, Any]]:
        """Get user registration trends over time"""
        
        if interval == "day":
            date_part = func.date(User.created_at)
        elif interval == "week":
            date_part = func.date_trunc('week', User.created_at)
        else:  # month
            date_part = func.date_trunc('month', User.created_at)
        
        results = self.db.query(
            date_part.label('date'),
            func.count(User.id).label('count'),
            func.sum(func.case((User.user_type == 'client', 1), else_=0)).label('clients'),
            func.sum(func.case((User.user_type == 'freelancer', 1), else_=0)).label('freelancers')
        ).filter(
            and_(
                User.created_at >= start_date,
                User.created_at <= end_date
            )
        ).group_by(date_part).order_by(date_part).all()
        
        return [
            {
                "date": r.date.isoformat() if hasattr(r.date, 'isoformat') else str(r.date),
                "total": r.count,
                "clients": r.clients,
                "freelancers": r.freelancers
            }
            for r in results
        ]
    
    def get_active_users_stats(self, days: int = 30) -> Dict[str, Any]:
        """Get active user statistics"""
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        # Total users
        total_users = self.db.query(func.count(User.id)).scalar()
        
        # Active users (logged in or had activity in last N days)
        active_users = self.db.query(func.count(User.id)).filter(
            User.last_login >= cutoff_date
        ).scalar()
        
        # Verified users
        verified_users = self.db.query(func.count(User.id)).filter(
            User.email_verified == True
        ).scalar()
        
        # Users with 2FA enabled
        users_with_2fa = self.db.query(func.count(User.id)).filter(
            User.two_factor_enabled == True
        ).scalar()
        
        # User type breakdown
        user_types = self.db.query(
            User.user_type,
            func.count(User.id).label('count')
        ).group_by(User.user_type).all()
        
        return {
            "total_users": total_users,
            "active_users": active_users,
            "verified_users": verified_users,
            "users_with_2fa": users_with_2fa,
            "user_types": {r.user_type: r.count for r in user_types},
            "period_days": days
        }
    
    def get_user_location_distribution(self) -> List[Dict[str, Any]]:
        """Get user distribution by location"""
        results = self.db.query(
            User.location,
            func.count(User.id).label('count')
        ).filter(
            User.location.isnot(None)
        ).group_by(User.location).order_by(func.count(User.id).desc()).limit(20).all()
        
        return [{"location": r.location, "count": r.count} for r in results]
    
    # ==================== Project Analytics ====================
    
    def get_project_stats(self) -> Dict[str, Any]:
        """Get overall project statistics"""
        
        # Total projects by status
        status_counts = self.db.query(
            Project.status,
            func.count(Project.id).label('count')
        ).group_by(Project.status).all()
        
        # Average project budget
        avg_budget = self.db.query(
            func.avg((Project.min_budget + Project.max_budget) / 2)
        ).scalar() or 0
        
        # Total projects posted in last 30 days
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_projects = self.db.query(func.count(Project.id)).filter(
            Project.created_at >= thirty_days_ago
        ).scalar()
        
        # Average proposals per project
        avg_proposals = self.db.query(
            func.avg(
                self.db.query(func.count(Proposal.id))
                .filter(Proposal.project_id == Project.id)
                .correlate(Project)
                .scalar_subquery()
            )
        ).scalar() or 0
        
        return {
            "status_breakdown": {r.status: r.count for r in status_counts},
            "average_budget": float(avg_budget),
            "projects_last_30_days": recent_projects,
            "average_proposals_per_project": float(avg_proposals)
        }
    
    def get_project_completion_rate(self) -> Dict[str, Any]:
        """Calculate project completion metrics"""
        
        total = self.db.query(func.count(Project.id)).scalar()
        completed = self.db.query(func.count(Project.id)).filter(
            Project.status == 'completed'
        ).scalar()
        in_progress = self.db.query(func.count(Project.id)).filter(
            Project.status == 'in_progress'
        ).scalar()
        cancelled = self.db.query(func.count(Project.id)).filter(
            Project.status == 'cancelled'
        ).scalar()
        
        completion_rate = (completed / total * 100) if total > 0 else 0
        
        return {
            "total_projects": total,
            "completed": completed,
            "in_progress": in_progress,
            "cancelled": cancelled,
            "completion_rate": round(completion_rate, 2)
        }
    
    def get_popular_project_categories(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get most popular project categories"""
        
        # Note: Requires category relationship on Project model
        results = self.db.query(
            Project.category,
            func.count(Project.id).label('count')
        ).filter(
            Project.category.isnot(None)
        ).group_by(Project.category).order_by(func.count(Project.id).desc()).limit(limit).all()
        
        return [{"category": r.category, "count": r.count} for r in results]
    
    # ==================== Revenue Analytics ====================
    
    def get_revenue_stats(self, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Get revenue statistics for date range"""
        
        # Total revenue
        total_revenue = self.db.query(
            func.sum(Payment.amount)
        ).filter(
            and_(
                Payment.created_at >= start_date,
                Payment.created_at <= end_date,
                Payment.status == 'completed'
            )
        ).scalar() or 0
        
        # Platform fees (assuming 10% fee)
        platform_fees = total_revenue * 0.10
        
        # Payment method breakdown
        payment_methods = self.db.query(
            Payment.payment_method,
            func.sum(Payment.amount).label('total')
        ).filter(
            and_(
                Payment.created_at >= start_date,
                Payment.created_at <= end_date,
                Payment.status == 'completed'
            )
        ).group_by(Payment.payment_method).all()
        
        # Number of transactions
        transaction_count = self.db.query(func.count(Payment.id)).filter(
            and_(
                Payment.created_at >= start_date,
                Payment.created_at <= end_date,
                Payment.status == 'completed'
            )
        ).scalar()
        
        # Average transaction value
        avg_transaction = total_revenue / transaction_count if transaction_count > 0 else 0
        
        return {
            "total_revenue": float(total_revenue),
            "platform_fees": float(platform_fees),
            "net_revenue": float(total_revenue - platform_fees),
            "transaction_count": transaction_count,
            "average_transaction": float(avg_transaction),
            "payment_methods": {r.payment_method: float(r.total) for r in payment_methods}
        }
    
    def get_revenue_trends(
        self, 
        start_date: datetime, 
        end_date: datetime,
        interval: str = "day"
    ) -> List[Dict[str, Any]]:
        """Get revenue trends over time"""
        
        if interval == "day":
            date_part = func.date(Payment.created_at)
        elif interval == "week":
            date_part = func.date_trunc('week', Payment.created_at)
        else:  # month
            date_part = func.date_trunc('month', Payment.created_at)
        
        results = self.db.query(
            date_part.label('date'),
            func.sum(Payment.amount).label('total'),
            func.count(Payment.id).label('count')
        ).filter(
            and_(
                Payment.created_at >= start_date,
                Payment.created_at <= end_date,
                Payment.status == 'completed'
            )
        ).group_by(date_part).order_by(date_part).all()
        
        return [
            {
                "date": r.date.isoformat() if hasattr(r.date, 'isoformat') else str(r.date),
                "revenue": float(r.total),
                "transactions": r.count
            }
            for r in results
        ]
    
    # ==================== Freelancer Analytics ====================
    
    def get_top_freelancers(
        self, 
        limit: int = 10,
        sort_by: str = "earnings"  # earnings, rating, projects
    ) -> List[Dict[str, Any]]:
        """Get top performing freelancers"""
        
        query = self.db.query(
            User.id,
            User.first_name,
            User.last_name,
            User.email,
            func.count(Contract.id).label('project_count'),
            func.sum(Payment.amount).label('total_earnings'),
            func.avg(Review.rating).label('avg_rating')
        ).join(
            Contract, Contract.freelancer_id == User.id
        ).outerjoin(
            Payment, Payment.to_user_id == User.id
        ).outerjoin(
            Review, Review.reviewee_id == User.id
        ).filter(
            User.user_type == 'freelancer'
        ).group_by(User.id, User.first_name, User.last_name, User.email)
        
        if sort_by == "earnings":
            query = query.order_by(func.sum(Payment.amount).desc())
        elif sort_by == "rating":
            query = query.order_by(func.avg(Review.rating).desc())
        else:  # projects
            query = query.order_by(func.count(Contract.id).desc())
        
        results = query.limit(limit).all()
        
        return [
            {
                "id": r.id,
                "name": f"{r.first_name} {r.last_name}",
                "email": r.email,
                "project_count": r.project_count,
                "total_earnings": float(r.total_earnings or 0),
                "average_rating": float(r.avg_rating or 0)
            }
            for r in results
        ]
    
    def get_freelancer_success_rate(self, freelancer_id: int) -> Dict[str, Any]:
        """Get success metrics for a specific freelancer"""
        
        # Proposals submitted
        proposals_submitted = self.db.query(func.count(Proposal.id)).filter(
            Proposal.freelancer_id == freelancer_id
        ).scalar()
        
        # Proposals accepted
        proposals_accepted = self.db.query(func.count(Proposal.id)).filter(
            and_(
                Proposal.freelancer_id == freelancer_id,
                Proposal.status == 'accepted'
            )
        ).scalar()
        
        # Projects completed
        projects_completed = self.db.query(func.count(Contract.id)).filter(
            and_(
                Contract.freelancer_id == freelancer_id,
                Contract.status == 'completed'
            )
        ).scalar()
        
        # Average rating
        avg_rating = self.db.query(func.avg(Review.rating)).filter(
            Review.reviewee_id == freelancer_id
        ).scalar() or 0
        
        # Total earnings
        total_earnings = self.db.query(func.sum(Payment.amount)).filter(
            and_(
                Payment.to_user_id == freelancer_id,
                Payment.status == 'completed'
            )
        ).scalar() or 0
        
        success_rate = (proposals_accepted / proposals_submitted * 100) if proposals_submitted > 0 else 0
        
        return {
            "proposals_submitted": proposals_submitted,
            "proposals_accepted": proposals_accepted,
            "success_rate": round(success_rate, 2),
            "projects_completed": projects_completed,
            "average_rating": float(avg_rating),
            "total_earnings": float(total_earnings)
        }
    
    # ==================== Client Analytics ====================
    
    def get_top_clients(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get top clients by spending"""
        
        results = self.db.query(
            User.id,
            User.first_name,
            User.last_name,
            User.email,
            func.count(Project.id).label('project_count'),
            func.sum(Payment.amount).label('total_spent')
        ).join(
            Project, Project.client_id == User.id
        ).outerjoin(
            Payment, Payment.from_user_id == User.id
        ).filter(
            User.user_type == 'client'
        ).group_by(
            User.id, User.first_name, User.last_name, User.email
        ).order_by(
            func.sum(Payment.amount).desc()
        ).limit(limit).all()
        
        return [
            {
                "id": r.id,
                "name": f"{r.first_name} {r.last_name}",
                "email": r.email,
                "project_count": r.project_count,
                "total_spent": float(r.total_spent or 0)
            }
            for r in results
        ]
    
    # ==================== Platform Health ====================
    
    def get_platform_health_metrics(self) -> Dict[str, Any]:
        """Get overall platform health indicators"""
        
        # Active disputes
        active_disputes = self.db.query(func.count(Dispute.id)).filter(
            Dispute.status.in_(['open', 'investigating'])
        ).scalar()
        
        # Pending support tickets
        pending_tickets = self.db.query(func.count(SupportTicket.id)).filter(
            SupportTicket.status == 'open'
        ).scalar()
        
        # Average response time (in hours)
        avg_response_time = self.db.query(
            func.avg(
                func.extract('epoch', Message.created_at - Message.created_at) / 3600
            )
        ).scalar() or 0
        
        # User satisfaction (average rating)
        user_satisfaction = self.db.query(func.avg(Review.rating)).scalar() or 0
        
        # Daily active users (last 24 hours)
        yesterday = datetime.utcnow() - timedelta(days=1)
        daily_active = self.db.query(func.count(User.id)).filter(
            User.last_login >= yesterday
        ).scalar()
        
        return {
            "active_disputes": active_disputes,
            "pending_support_tickets": pending_tickets,
            "average_response_time_hours": float(avg_response_time),
            "user_satisfaction_rating": float(user_satisfaction),
            "daily_active_users": daily_active
        }
    
    def get_engagement_metrics(self, days: int = 30) -> Dict[str, Any]:
        """Get user engagement metrics"""
        
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        # Messages sent
        messages_sent = self.db.query(func.count(Message.id)).filter(
            Message.created_at >= cutoff_date
        ).scalar()
        
        # Proposals submitted
        proposals_submitted = self.db.query(func.count(Proposal.id)).filter(
            Proposal.created_at >= cutoff_date
        ).scalar()
        
        # Projects posted
        projects_posted = self.db.query(func.count(Project.id)).filter(
            Project.created_at >= cutoff_date
        ).scalar()
        
        # Contracts created
        contracts_created = self.db.query(func.count(Contract.id)).filter(
            Contract.created_at >= cutoff_date
        ).scalar()
        
        # Reviews posted
        reviews_posted = self.db.query(func.count(Review.id)).filter(
            Review.created_at >= cutoff_date
        ).scalar()
        
        return {
            "period_days": days,
            "messages_sent": messages_sent,
            "proposals_submitted": proposals_submitted,
            "projects_posted": projects_posted,
            "contracts_created": contracts_created,
            "reviews_posted": reviews_posted
        }
