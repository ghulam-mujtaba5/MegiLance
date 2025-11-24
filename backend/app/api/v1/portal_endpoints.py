"""
Additional API endpoints for Client and Freelancer portals
These were missing and causing 404 errors
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, desc
from typing import List, Optional
from datetime import datetime, timedelta

from app.db.session import get_db
from app.core.security import get_current_active_user
from app.models import User, Project, Proposal, Contract, Payment
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


# ============ Helper Functions ============

async def get_client_user(current_user: User = Depends(get_current_active_user)):
    """Verify that current user is a client"""
    if current_user.user_type not in ['Client', 'client']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Client access required"
        )
    return current_user

async def get_freelancer_user(current_user: User = Depends(get_current_active_user)):
    """Verify that current user is a freelancer"""
    if current_user.user_type not in ['Freelancer', 'freelancer']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Freelancer access required"
        )
    return current_user


# ============ CLIENT PORTAL ENDPOINTS ============

@router.get("/client/dashboard/stats", response_model=ClientDashboardStats)
async def get_client_dashboard_stats(
    db: Session = Depends(get_db),
    client: User = Depends(get_client_user)
):
    """Get client dashboard statistics"""
    total_projects = db.query(func.count(Project.id)).filter(
        Project.client_id == client.id
    ).scalar()
    
    active_projects = db.query(func.count(Project.id)).filter(
        and_(
            Project.client_id == client.id,
            Project.status.in_(['open', 'in_progress'])
        )
    ).scalar()
    
    completed_projects = db.query(func.count(Project.id)).filter(
        and_(
            Project.client_id == client.id,
            Project.status == 'completed'
        )
    ).scalar()
    
    total_spent = db.query(func.coalesce(func.sum(Payment.amount), 0.0)).filter(
        and_(
            Payment.from_user_id == client.id,
            Payment.status == 'completed'
        )
    ).scalar()
    
    # Count unique freelancers hired
    active_freelancers = db.query(func.count(func.distinct(Contract.freelancer_id))).filter(
        and_(
            Contract.client_id == client.id,
            Contract.status.in_(['active', 'in_progress'])
        )
    ).scalar()
    
    # Count pending proposals
    pending_proposals = db.query(func.count(Proposal.id)).join(
        Project, Proposal.project_id == Project.id
    ).filter(
        and_(
            Project.client_id == client.id,
            Proposal.status == 'submitted'
        )
    ).scalar()
    
    return ClientDashboardStats(
        total_projects=total_projects or 0,
        active_projects=active_projects or 0,
        completed_projects=completed_projects or 0,
        total_spent=float(total_spent or 0.0),
        active_freelancers=active_freelancers or 0,
        pending_proposals=pending_proposals or 0
    )


@router.get("/client/projects")
async def get_client_projects(
    status: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    client: User = Depends(get_client_user)
):
    """Get client's projects"""
    query = db.query(Project).filter(Project.client_id == client.id)
    
    if status:
        query = query.filter(Project.status == status)
    
    total = query.count()
    projects = query.order_by(desc(Project.created_at)).offset(skip).limit(limit).all()
    
    return {
        "total": total,
        "projects": [
            {
                "id": p.id,
                "title": p.title,
                "description": p.description,
                "status": p.status,
                "budget_min": p.budget_min,
                "budget_max": p.budget_max,
                "created_at": p.created_at,
                "updated_at": p.updated_at
            }
            for p in projects
        ]
    }


@router.post("/client/projects", status_code=status.HTTP_201_CREATED)
async def create_client_project(
    title: str,
    description: str,
    budget: float,
    skills: List[str],
    db: Session = Depends(get_db),
    client: User = Depends(get_client_user)
):
    """Create a new project"""
    import json
    
    new_project = Project(
        title=title,
        description=description,
        client_id=client.id,
        budget_min=budget * 0.8,  # 80% of budget
        budget_max=budget,
        budget_type="fixed",
        status="open",
        skills=json.dumps(skills),
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    
    return {
        "id": new_project.id,
        "title": new_project.title,
        "status": new_project.status,
        "message": "Project created successfully"
    }


@router.get("/client/proposals")
async def get_client_proposals(
    project_id: Optional[int] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    client: User = Depends(get_client_user)
):
    """Get proposals for client's projects"""
    query = db.query(Proposal).join(
        Project, Proposal.project_id == Project.id
    ).filter(Project.client_id == client.id)
    
    if project_id:
        query = query.filter(Proposal.project_id == project_id)
    
    total = query.count()
    proposals = query.order_by(desc(Proposal.created_at)).offset(skip).limit(limit).all()
    
    return {
        "total": total,
        "proposals": [
            {
                "id": p.id,
                "project_id": p.project_id,
                "freelancer_id": p.freelancer_id,
                "status": p.status,
                "estimated_hours": p.estimated_hours,
                "hourly_rate": p.hourly_rate,
                "created_at": p.created_at
            }
            for p in proposals
        ]
    }


@router.get("/client/payments")
async def get_client_payments(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    client: User = Depends(get_client_user)
):
    """Get client's payment history"""
    query = db.query(Payment).filter(Payment.from_user_id == client.id)
    
    total = query.count()
    payments = query.order_by(desc(Payment.created_at)).offset(skip).limit(limit).all()
    
    return {
        "total": total,
        "payments": [
            {
                "id": p.id,
                "amount": float(p.amount),
                "status": p.status,
                "payment_type": p.payment_type,
                "description": p.description,
                "created_at": p.created_at
            }
            for p in payments
        ]
    }


@router.get("/client/wallet")
async def get_client_wallet(
    db: Session = Depends(get_db),
    client: User = Depends(get_client_user)
):
    """Get client's wallet balance and transactions"""
    # Calculate from pending payments
    pending_payments = float(
        db.query(func.coalesce(func.sum(Payment.amount), 0.0)).filter(
            and_(
                Payment.from_user_id == client.id, 
                Payment.status == 'pending'
            )
        ).scalar() or 0.0
    )
    
    return {
        "balance": float(client.account_balance or 0.0),
        "currency": "USD",
        "pending_payments": pending_payments,
        "total_spent": float(
            db.query(func.coalesce(func.sum(Payment.amount), 0.0)).filter(
                and_(Payment.from_user_id == client.id, Payment.status == 'completed')
            ).scalar() or 0.0
        )
    }


# ============ FREELANCER PORTAL ENDPOINTS ============

@router.get("/freelancer/dashboard/stats", response_model=FreelancerDashboardStats)
async def get_freelancer_dashboard_stats(
    db: Session = Depends(get_db),
    freelancer: User = Depends(get_freelancer_user)
):
    """Get freelancer dashboard statistics"""
    total_earnings = db.query(func.coalesce(func.sum(Payment.amount), 0.0)).filter(
        and_(
            Payment.to_user_id == freelancer.id,
            Payment.status == 'completed'
        )
    ).scalar()
    
    active_projects = db.query(func.count(Contract.id)).filter(
        and_(
            Contract.freelancer_id == freelancer.id,
            Contract.status.in_(['active', 'in_progress'])
        )
    ).scalar()
    
    completed_projects = db.query(func.count(Contract.id)).filter(
        and_(
            Contract.freelancer_id == freelancer.id,
            Contract.status == 'completed'
        )
    ).scalar()
    
    pending_proposals = db.query(func.count(Proposal.id)).filter(
        and_(
            Proposal.freelancer_id == freelancer.id,
            Proposal.status == 'submitted'
        )
    ).scalar()
    
    total_proposals = db.query(func.count(Proposal.id)).filter(
        Proposal.freelancer_id == freelancer.id
    ).scalar()
    
    success_rate = (completed_projects / total_proposals * 100) if total_proposals > 0 else 0.0
    
    # Calculate average rating
    from app.models.review import Review
    avg_rating = db.query(func.avg(Review.rating)).filter(
        Review.reviewee_id == freelancer.id
    ).scalar()
    
    return FreelancerDashboardStats(
        total_earnings=float(total_earnings or 0.0),
        active_projects=active_projects or 0,
        completed_projects=completed_projects or 0,
        pending_proposals=pending_proposals or 0,
        success_rate=round(success_rate, 2),
        average_rating=round(float(avg_rating), 2) if avg_rating else None
    )


@router.get("/freelancer/jobs")
async def get_freelancer_jobs(
    category: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    freelancer: User = Depends(get_freelancer_user)
):
    """Get available jobs for freelancer"""
    query = db.query(Project).filter(Project.status == 'open')
    
    if category:
        query = query.filter(Project.category.ilike(f"%{category}%"))
    
    total = query.count()
    jobs = query.order_by(desc(Project.created_at)).offset(skip).limit(limit).all()
    
    return {
        "total": total,
        "jobs": [
            {
                "id": j.id,
                "title": j.title,
                "description": j.description,
                "budget_min": j.budget_min,
                "budget_max": j.budget_max,
                "created_at": j.created_at
            }
            for j in jobs
        ]
    }


@router.get("/freelancer/projects")
async def get_freelancer_projects(
    status: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    freelancer: User = Depends(get_freelancer_user)
):
    """Get freelancer's active contracts/projects"""
    query = db.query(Contract).filter(Contract.freelancer_id == freelancer.id)
    
    if status:
        query = query.filter(Contract.status == status)
    
    total = query.count()
    contracts = query.order_by(desc(Contract.created_at)).offset(skip).limit(limit).all()
    
    return {
        "total": total,
        "projects": [
            {
                "id": c.id,
                "project_id": c.project_id,
                "status": c.status,
                "start_date": c.start_date,
                "end_date": c.end_date,
                "total_amount": c.total_amount
            }
            for c in contracts
        ]
    }


@router.post("/freelancer/proposals", status_code=status.HTTP_201_CREATED)
async def submit_freelancer_proposal(
    project_id: int,
    cover_letter: str,
    bid_amount: float,
    delivery_time: int,
    db: Session = Depends(get_db),
    freelancer: User = Depends(get_freelancer_user)
):
    """Submit a proposal for a project"""
    # Check if project exists
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Check if already submitted proposal
    existing = db.query(Proposal).filter(
        and_(
            Proposal.project_id == project_id,
            Proposal.freelancer_id == freelancer.id
        )
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Proposal already submitted for this project")
    
    new_proposal = Proposal(
        project_id=project_id,
        freelancer_id=freelancer.id,
        cover_letter=cover_letter,
        estimated_hours=delivery_time,
        hourly_rate=bid_amount / delivery_time if delivery_time > 0 else freelancer.hourly_rate,
        status="submitted",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    db.add(new_proposal)
    db.commit()
    db.refresh(new_proposal)
    
    return {
        "id": new_proposal.id,
        "project_id": new_proposal.project_id,
        "status": new_proposal.status,
        "message": "Proposal submitted successfully"
    }


@router.get("/freelancer/portfolio")
async def get_freelancer_portfolio(
    db: Session = Depends(get_db),
    freelancer: User = Depends(get_freelancer_user)
):
    """Get freelancer's portfolio items"""
    from app.models.portfolio import PortfolioItem
    
    items = db.query(PortfolioItem).filter(
        PortfolioItem.freelancer_id == freelancer.id
    ).order_by(desc(PortfolioItem.created_at)).all()
    
    return {
        "portfolio_items": [
            {
                "id": item.id,
                "title": item.title,
                "description": item.description,
                "image_url": item.image_url,
                "project_url": item.project_url,
                "created_at": item.created_at
            }
            for item in items
        ]
    }


@router.get("/freelancer/skills")
async def get_freelancer_skills(
    db: Session = Depends(get_db),
    freelancer: User = Depends(get_freelancer_user)
):
    """Get freelancer's skills"""
    import json
    
    skills_data = json.loads(freelancer.skills) if freelancer.skills else []
    
    return {
        "skills": skills_data,
        "hourly_rate": float(freelancer.hourly_rate or 0.0)
    }


@router.get("/freelancer/earnings")
async def get_freelancer_earnings(
    db: Session = Depends(get_db),
    freelancer: User = Depends(get_freelancer_user)
):
    """Get freelancer's earnings breakdown"""
    total_earnings = db.query(func.coalesce(func.sum(Payment.amount), 0.0)).filter(
        and_(
            Payment.to_user_id == freelancer.id,
            Payment.status == 'completed'
        )
    ).scalar()
    
    pending_earnings = db.query(func.coalesce(func.sum(Payment.amount), 0.0)).filter(
        and_(
            Payment.to_user_id == freelancer.id,
            Payment.status == 'pending'
        )
    ).scalar()
    
    return {
        "total_earnings": float(total_earnings or 0.0),
        "pending_earnings": float(pending_earnings or 0.0),
        "available_balance": float(freelancer.account_balance or 0.0),
        "currency": "USD"
    }


@router.get("/freelancer/wallet")
async def get_freelancer_wallet(
    db: Session = Depends(get_db),
    freelancer: User = Depends(get_freelancer_user)
):
    """Get freelancer's wallet balance"""
    return {
        "balance": float(freelancer.account_balance or 0.0),
        "currency": "USD",
        "pending_earnings": float(
            db.query(func.coalesce(func.sum(Payment.amount), 0.0)).filter(
                and_(Payment.to_user_id == freelancer.id, Payment.status == 'pending')
            ).scalar() or 0.0
        ),
        "total_earned": float(
            db.query(func.coalesce(func.sum(Payment.amount), 0.0)).filter(
                and_(Payment.to_user_id == freelancer.id, Payment.status == 'completed')
            ).scalar() or 0.0
        )
    }


# ============ SHARED ENDPOINTS ============

@router.get("/freelancers")
async def list_freelancers(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    """List all freelancers - public endpoint"""
    query = db.query(User).filter(
        and_(
            User.user_type == 'Freelancer',
            User.is_active == True
        )
    )
    
    total = query.count()
    freelancers = query.offset(skip).limit(limit).all()
    
    return {
        "total": total,
        "freelancers": [
            {
                "id": f.id,
                "name": f.name,
                "email": f.email,
                "bio": f.bio,
                "hourly_rate": float(f.hourly_rate or 0.0),
                "location": f.location,
                "skills": f.skills
            }
            for f in freelancers
        ]
    }
