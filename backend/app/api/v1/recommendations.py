# @AI-HINT: API endpoints for recommendation engine - personalized content suggestions
"""
Recommendation Engine API - AI-powered personalized recommendations.

Endpoints for:
- Project recommendations for freelancers
- Freelancer recommendations for clients
- Similar items
- Trending content
- User preferences
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel

from app.db.session import get_db
from app.core.security import get_current_active_user
from app.models.user import User
from app.services.recommendation_engine import get_recommendation_engine

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


# Request/Response Models
class TrackViewRequest(BaseModel):
    project_id: int
    duration_seconds: Optional[int] = None


class TrackApplicationRequest(BaseModel):
    project_id: int


class TrackHireRequest(BaseModel):
    freelancer_id: int
    project_id: int


class RegisterProjectRequest(BaseModel):
    project_id: int
    title: str
    category: Optional[str] = None
    skills: Optional[List[str]] = None
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    experience_level: Optional[str] = None


class RegisterFreelancerRequest(BaseModel):
    freelancer_id: int
    name: str
    title: Optional[str] = None
    skills: Optional[List[str]] = None
    hourly_rate: Optional[float] = None
    rating: Optional[float] = None
    experience_years: Optional[int] = None
    completed_projects: Optional[int] = None


class FreelancerRecommendationRequest(BaseModel):
    project_skills: Optional[List[str]] = None
    limit: int = 10


# Tracking Endpoints
@router.post("/track/view")
async def track_view(
    request: TrackViewRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Track user viewing a project."""
    engine = get_recommendation_engine(db)
    
    await engine.track_view(
        user_id=current_user.id,
        project_id=request.project_id,
        duration_seconds=request.duration_seconds
    )
    
    return {"status": "tracked"}


@router.post("/track/application")
async def track_application(
    request: TrackApplicationRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Track user applying to a project."""
    engine = get_recommendation_engine(db)
    
    await engine.track_application(
        user_id=current_user.id,
        project_id=request.project_id
    )
    
    return {"status": "tracked"}


@router.post("/track/hire")
async def track_hire(
    request: TrackHireRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Track client hiring a freelancer."""
    engine = get_recommendation_engine(db)
    
    await engine.track_hire(
        client_id=current_user.id,
        freelancer_id=request.freelancer_id,
        project_id=request.project_id
    )
    
    return {"status": "tracked"}


# Registration Endpoints (for seeding the recommendation engine)
@router.post("/register/project")
async def register_project(
    request: RegisterProjectRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Register project features for recommendations."""
    engine = get_recommendation_engine(db)
    
    await engine.register_project(
        project_id=request.project_id,
        features=request.model_dump()
    )
    
    return {"status": "registered"}


@router.post("/register/freelancer")
async def register_freelancer(
    request: RegisterFreelancerRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Register freelancer features for recommendations."""
    engine = get_recommendation_engine(db)
    
    await engine.register_freelancer(
        freelancer_id=request.freelancer_id,
        features=request.model_dump()
    )
    
    return {"status": "registered"}


# Recommendation Endpoints
@router.get("/projects")
async def get_project_recommendations(
    limit: int = 10,
    exclude_applied: bool = True,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get personalized project recommendations for a freelancer."""
    engine = get_recommendation_engine(db)
    
    recommendations = await engine.get_project_recommendations(
        user_id=current_user.id,
        limit=limit,
        exclude_applied=exclude_applied
    )
    
    return {
        "recommendations": recommendations,
        "count": len(recommendations)
    }


@router.post("/freelancers")
async def get_freelancer_recommendations(
    request: Optional[FreelancerRecommendationRequest] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get freelancer recommendations for a client."""
    engine = get_recommendation_engine(db)
    
    project_skills = request.project_skills if request else None
    limit = request.limit if request else 10
    
    recommendations = await engine.get_freelancer_recommendations(
        client_id=current_user.id,
        project_skills=project_skills,
        limit=limit
    )
    
    return {
        "recommendations": recommendations,
        "count": len(recommendations)
    }


@router.get("/projects/{project_id}/similar")
async def get_similar_projects(
    project_id: int,
    limit: int = 5,
    db: Session = Depends(get_db)
):
    """Get projects similar to a given project."""
    engine = get_recommendation_engine(db)
    
    similar = await engine.get_similar_projects(
        project_id=project_id,
        limit=limit
    )
    
    return {
        "project_id": project_id,
        "similar_projects": similar,
        "count": len(similar)
    }


@router.get("/trending")
async def get_trending_projects(
    hours: int = 24,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """Get trending projects."""
    engine = get_recommendation_engine(db)
    
    trending = await engine.get_trending_projects(
        hours=hours,
        limit=limit
    )
    
    return {
        "period_hours": hours,
        "trending_projects": trending,
        "count": len(trending)
    }


@router.get("/preferences")
async def get_user_preferences(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get learned user preferences."""
    engine = get_recommendation_engine(db)
    
    preferences = await engine.get_user_preferences(current_user.id)
    
    return preferences
