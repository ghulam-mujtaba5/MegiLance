from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db
from app.models.user import User
from app.models.project import Project
from app.models.payment import Payment
from app.schemas.project import ProjectRead
from app.schemas.payment import PaymentRead
from app.core.security import get_current_user

router = APIRouter()

# Fix the get_current_user dependency to properly extract the token from the Authorization header
def get_current_user_from_header(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    
    # Extract token from "Bearer <token>" format
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header format")
    
    token = authorization[7:]  # Remove "Bearer " prefix
    return get_current_user(token, db)

@router.get("/projects", response_model=List[dict])
def get_client_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_from_header)
):
    """
    Get client projects with transformed data structure for frontend
    """
    projects = db.query(Project).filter(Project.client_id == current_user.id).all()
    
    # Transform the data to match what the frontend expects
    transformed_projects = []
    for project in projects:
        # Map status values
        status_map = {
            "open": "Pending",
            "in_progress": "In Progress",
            "completed": "Completed",
            "cancelled": "Cancelled"
        }
        
        # Calculate budget and progress
        budget = project.budget_max or project.budget_min or 0
        progress = 0  # In a real implementation, this would be calculated based on milestones
        
        transformed_project = {
            "id": f"PROJ-{project.id:03d}",
            "title": project.title,
            "status": status_map.get(project.status, "Pending"),
            "progress": progress,
            "budget": budget,
            "paid": 0,  # In a real implementation, this would be calculated from payments
            "freelancers": [],  # In a real implementation, this would come from proposals/contracts
            "updatedAt": project.updated_at.isoformat() if project.updated_at else project.created_at.isoformat()
        }
        transformed_projects.append(transformed_project)
    
    return transformed_projects

@router.get("/payments", response_model=List[dict])
def get_client_payments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_from_header)
):
    """
    Get client payments with transformed data structure for frontend
    """
    # Get payments where the current user is the recipient or sender
    payments = db.query(Payment).filter(
        (Payment.to_user_id == current_user.id) | (Payment.from_user_id == current_user.id)
    ).all()
    
    # Transform the data to match what the frontend expects
    transformed_payments = []
    for payment in payments:
        # Determine payment type
        payment_type = "Payment" if payment.to_user_id == current_user.id else "Refund"
        
        transformed_payment = {
            "id": str(payment.id),
            "date": payment.created_at.isoformat(),
            "description": payment.description,
            "amount": str(payment.amount),
            "status": payment.status.capitalize() if payment.status else "Pending",
            "type": payment_type
        }
        transformed_payments.append(transformed_payment)
    
    return transformed_payments

@router.get("/freelancers", response_model=List[dict])
def get_client_freelancers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_from_header)
):
    """
    Get freelancers that have worked with the client
    """
    # In a real implementation, this would query freelancers who have contracts/proposals with the client
    # For now, return mock data
    return [
        {
            "id": "freelancer_1",
            "name": "Alice Johnson",
            "title": "Senior Full-Stack Developer",
            "rating": 4.8,
            "hourlyRate": "$75/hr",
            "skills": ["React", "Node.js", "Python"],
            "completedProjects": 24
        },
        {
            "id": "freelancer_2",
            "name": "Bob Smith",
            "title": "UI/UX Designer",
            "rating": 4.9,
            "hourlyRate": "$65/hr",
            "skills": ["Figma", "UI Design", "Prototyping"],
            "completedProjects": 18
        },
        {
            "id": "freelancer_3",
            "name": "Charlie Brown",
            "title": "DevOps Engineer",
            "rating": 4.7,
            "hourlyRate": "$80/hr",
            "skills": ["AWS", "Docker", "Kubernetes"],
            "completedProjects": 32
        }
    ]

@router.get("/reviews", response_model=List[dict])
def get_client_reviews(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_from_header)
):
    """
    Get reviews for the client
    """
    # In a real implementation, this would query reviews for the client
    # For now, return mock data
    return [
        {
            "id": "review_1",
            "projectTitle": "E-commerce Website",
            "freelancerName": "Alice Johnson",
            "rating": 5,
            "comment": "Excellent work! Delivered ahead of schedule and exceeded expectations.",
            "date": "2024-03-15"
        },
        {
            "id": "review_2",
            "projectTitle": "Mobile App Redesign",
            "freelancerName": "Bob Smith",
            "rating": 5,
            "comment": "Fantastic design work. Very responsive to feedback.",
            "date": "2024-02-28"
        },
        {
            "id": "review_3",
            "projectTitle": "Cloud Migration",
            "freelancerName": "Charlie Brown",
            "rating": 4,
            "comment": "Good technical skills, but communication could be improved.",
            "date": "2024-01-10"
        }
    ]

@router.post("/jobs")
def create_client_job(
    job_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_from_header)
):
    """
    Create a new job posting for the client
    """
    try:
        # Create a new project
        db_project = Project(
            title=job_data.get("title", ""),
            description=job_data.get("description", ""),
            category=job_data.get("category", ""),
            budget_type=job_data.get("budgetType", "Fixed"),
            budget_min=job_data.get("budget"),
            budget_max=job_data.get("budget"),
            experience_level="Intermediate",  # Default value
            estimated_duration=job_data.get("timeline", ""),
            skills=",".join(job_data.get("skills", [])),
            client_id=current_user.id,
            status="open"
        )
        db.add(db_project)
        db.commit()
        db.refresh(db_project)
        
        return {
            "id": f"job_{db_project.id}",
            "message": "Job submitted successfully."
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))