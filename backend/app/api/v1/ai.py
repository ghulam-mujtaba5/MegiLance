"""AI Service API Endpoints"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from sqlalchemy.orm import Session
from decimal import Decimal

from app.core.security import get_current_active_user
from app.db.session import get_db
from app.models.user import User
from app.services.ai_service import ai_service
from app.schemas.ai import (
    FreelancerMatchRequest,
    PriceEstimateRequest,
    ProposalGenerateRequest,
    FraudCheckRequest
)

router = APIRouter()


@router.post("/match-freelancers")
async def match_freelancers(
    request: FreelancerMatchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """AI-powered freelancer matching for a job"""
    
    if current_user.user_type != "Client":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only clients can use freelancer matching"
        )
    
    matches = await ai_service.match_freelancers_to_job(
        job_description=request.job_description,
        required_skills=request.required_skills,
        budget=Decimal(str(request.budget)),
        db=db
    )
    
    return {est.required_skills,
            "budget": request.budget
        }
    }


@router.post("/estimate-price")
async def estimate_price(
    request: PriceEstimateRequest,
    current_user: User = Depends(get_current_active_user)
):
    """AI-powered project price estimation"""
    
    estimate = await ai_service.estimate_project_price(
        project_description=request.project_description,
        category=request.category,
        estimated_hours=request.estimated_hours,
        complexity=request.t ai_service.estimate_project_price(
        project_description=project_description,
        category=category,
        estimated_hours=estimated_hours,
        complexity=complexity
    )
    
    return estimate


@router.post("/generate-proposal")
async def generate_proposal(
    job_title: str,
    job_description: str,
    db: Session = Depends(get_db),
    request: ProposalGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """AI-powered proposal generation for freelancers"""
    
    if current_user.user_type != "Freelancer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only freelancers can use proposal generation"
        )
    
    # Get freelancer skills
    from app.models.user_skill import UserSkill
    user_skills = db.query(UserSkill).filter(
        UserSkill.user_id == current_user.id
    ).all()
    
    skill_names = [us.skill.name for us in user_skills if us.skill]
    
    proposal = await ai_service.generate_proposal(
        job_title=request.job_title,
        job_description=request.
    
    return proposal


@router.post("/fraud-check")
async def fraud_check(
    user_id: str,
    request: FraudCheckRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """AI-powered fraud detection (admin only)"""
    
    if current_user.user_type != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can access fraud detection"
        )
    
    result = await ai_service.detect_fraud(
        user_id=request.user_id,
        activity_type=request.activity_type,
        activity_data=request.
    )
    
    return result


@router.get("/health")
async def ai_health():
    """Check AI service health and configuration"""
    import os
    
    return {
        "status": "operational",
        "openai_configured": bool(os.getenv('OPENAI_API_KEY')),
        "features": [
            "freelancer_matching",
            "price_estimation",
            "proposal_generation",
            "fraud_detection"
        ]
    }
