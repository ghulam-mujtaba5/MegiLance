# @AI-HINT: Smart AI matching API endpoints - ML-powered freelancer-job matching
"""
AI Matching API Endpoints
=========================
Production-grade ML matching endpoints:
- Find freelancers for projects
- Find jobs for freelancers
- Matching insights and analytics
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from app.db.session import get_db
from app.core.security import get_current_user
from app.models.user import User, UserType
from app.services.smart_matching import get_matching_engine, reinitialize_engine

router = APIRouter()


# ============================================================================
# SCHEMAS
# ============================================================================

class MatchReason(BaseModel):
    """Match reason with icon and detail"""
    icon: str
    label: str
    detail: str


class MatchScores(BaseModel):
    """Detailed scoring breakdown"""
    skill_match: float = Field(..., ge=0, le=1)
    experience: float = Field(..., ge=0, le=1)
    rating: float = Field(..., ge=0, le=1)
    success_rate: float = Field(..., ge=0, le=1)
    response_time: float = Field(..., ge=0, le=1)
    budget_fit: float = Field(..., ge=0, le=1)
    collaborative: float = Field(..., ge=0, le=1)
    recency: float = Field(..., ge=0, le=1)


class FreelancerMatch(BaseModel):
    """Freelancer match result"""
    freelancer_id: int
    freelancer_name: str
    email: Optional[str] = None
    avatar_url: Optional[str] = None
    match_score: float = Field(..., ge=0, le=1)
    scores: MatchScores
    profile_data: dict = {}
    match_reasons: List[MatchReason] = []
    highlights: List[str] = []


class JobMatch(BaseModel):
    """Job match result for freelancer"""
    project_id: int
    title: str
    description: str
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    skills_required: List[str] = []
    match_score: float = Field(..., ge=0, le=1)
    skill_match: float = Field(..., ge=0, le=1)
    posted_days_ago: int
    client_id: Optional[int] = None


class MatchingResponse(BaseModel):
    """Response wrapper for matching results"""
    success: bool = True
    count: int
    matches: List[FreelancerMatch]


class JobMatchingResponse(BaseModel):
    """Response wrapper for job recommendations"""
    success: bool = True
    count: int
    recommendations: List[JobMatch]


# ============================================================================
# CLIENT ENDPOINTS - Find freelancers for projects
# ============================================================================

@router.get("/projects/{project_id}/matches", response_model=MatchingResponse)
async def find_freelancer_matches(
    project_id: int,
    limit: int = Query(default=20, ge=1, le=100),
    min_score: float = Query(default=0.25, ge=0, le=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Find best matching freelancers for a project
    
    Uses ML-powered matching with:
    - Semantic skill matching (TF-IDF)
    - Collaborative filtering
    - Multi-signal scoring (rating, experience, response time, etc.)
    
    Returns ranked list with detailed match reasons.
    """
    # Verify user is client or admin
    if current_user.user_type not in [UserType.CLIENT, UserType.ADMIN]:
        raise HTTPException(status_code=403, detail="Only clients can find freelancer matches")
    
    try:
        engine = get_matching_engine(db)
        matches = engine.find_matches(
            project_id=project_id,
            client_id=current_user.id,
            limit=limit,
            min_score=min_score
        )
        
        return MatchingResponse(
            success=True,
            count=len(matches),
            matches=matches
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Matching error: {str(e)}")


@router.get("/projects/{project_id}/top-matches")
async def get_top_matches(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get top 5 best matches for a project with simplified response
    
    Quick endpoint for showing top recommendations on project page.
    """
    try:
        engine = get_matching_engine(db)
        matches = engine.find_matches(
            project_id=project_id,
            client_id=current_user.id,
            limit=5,
            min_score=0.3
        )
        
        # Simplified response
        return {
            "success": True,
            "project_id": project_id,
            "top_matches": [
                {
                    "id": m["freelancer_id"],
                    "name": m["freelancer_name"],
                    "avatar": m.get("avatar_url"),
                    "score": int(m["match_score"] * 100),
                    "highlights": m.get("highlights", [])[:2],
                    "top_reason": m["match_reasons"][0] if m.get("match_reasons") else None
                }
                for m in matches
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# FREELANCER ENDPOINTS - Find jobs for freelancers
# ============================================================================

@router.get("/freelancer/job-recommendations", response_model=JobMatchingResponse)
async def get_job_recommendations(
    limit: int = Query(default=20, ge=1, le=100),
    min_score: float = Query(default=0.2, ge=0, le=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get personalized job recommendations for current freelancer
    
    Uses reverse matching to find projects that best match freelancer's skills.
    """
    if current_user.user_type != UserType.FREELANCER:
        raise HTTPException(status_code=403, detail="Only freelancers can get job recommendations")
    
    try:
        engine = get_matching_engine(db)
        jobs = engine.find_jobs_for_freelancer(
            freelancer_id=current_user.id,
            limit=limit,
            min_score=min_score
        )
        
        return JobMatchingResponse(
            success=True,
            count=len(jobs),
            recommendations=jobs
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recommendation error: {str(e)}")


@router.get("/freelancer/{freelancer_id}/recommended-jobs")
async def get_freelancer_recommendations(
    freelancer_id: int,
    limit: int = Query(default=10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get job recommendations for a specific freelancer
    
    Admin/self access only.
    """
    # Check access
    if current_user.user_type != UserType.ADMIN and current_user.id != freelancer_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    try:
        engine = get_matching_engine(db)
        jobs = engine.find_jobs_for_freelancer(
            freelancer_id=freelancer_id,
            limit=limit
        )
        
        return {
            "success": True,
            "freelancer_id": freelancer_id,
            "count": len(jobs),
            "recommendations": jobs
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# ADMIN ENDPOINTS
# ============================================================================

@router.post("/admin/matching/reinitialize")
async def reinitialize_matching_engine(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Reinitialize the matching engine
    
    Call after bulk data changes (import, mass updates, etc.)
    Admin only.
    """
    if current_user.user_type != UserType.ADMIN:
        raise HTTPException(status_code=403, detail="Admin only")
    
    try:
        engine = reinitialize_engine(db)
        vocab_size = len(engine.vectorizer.vocabulary)
        
        return {
            "success": True,
            "message": "Matching engine reinitialized",
            "vocabulary_size": vocab_size
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/admin/matching/stats")
async def get_matching_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get matching engine statistics
    
    Admin only - shows engine health and metrics.
    """
    if current_user.user_type != UserType.ADMIN:
        raise HTTPException(status_code=403, detail="Admin only")
    
    try:
        engine = get_matching_engine(db)
        
        return {
            "success": True,
            "stats": {
                "vocabulary_size": len(engine.vectorizer.vocabulary),
                "document_count": engine.vectorizer.document_count,
                "cache_entries": len(engine._cache),
                "cache_ttl_seconds": engine._cache_ttl
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# INSTANT MATCH (for project creation wizard)
# ============================================================================

@router.post("/instant-match")
async def instant_match(
    skills: List[str] = [],
    budget_min: Optional[float] = None,
    budget_max: Optional[float] = None,
    description: Optional[str] = None,
    limit: int = Query(default=5, ge=1, le=20),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get instant freelancer suggestions without creating a project
    
    Used in project creation wizard to show potential matches.
    """
    try:
        from app.models.project import Project
        
        # Create temporary in-memory project
        temp_project = Project(
            id=-1,  # Fake ID
            title=description[:100] if description else "Untitled",
            description=description or "",
            skills_required=skills,
            budget_min=budget_min,
            budget_max=budget_max,
            client_id=current_user.id
        )
        
        # Build query document
        query_doc = ' '.join([
            temp_project.description or '',
            ' '.join(skills)
        ])
        
        engine = get_matching_engine(db)
        
        # Find freelancers manually without saving project
        from app.models.user import User, UserType
        
        project_vector = engine.vectorizer.transform(query_doc)
        
        freelancers = db.query(User).filter(
            User.user_type == UserType.FREELANCER,
            User.is_active == True
        ).limit(100).all()
        
        matches = []
        for f in freelancers:
            profile = f.profile_data or {}
            f_doc = ' '.join([
                ' '.join(str(s) for s in profile.get('skills', [])),
                profile.get('bio', ''),
                profile.get('title', '')
            ])
            f_vector = engine.vectorizer.transform(f_doc)
            
            from app.services.smart_matching import cosine_similarity
            score = cosine_similarity(project_vector, f_vector)
            
            # Budget filter
            if budget_max:
                hourly_rate = profile.get('hourly_rate', 0)
                if hourly_rate and hourly_rate > budget_max * 1.5:
                    continue
            
            if score > 0.2:
                matches.append({
                    "id": f.id,
                    "name": f"{f.first_name} {f.last_name}",
                    "avatar": f.avatar_url,
                    "title": profile.get('title', 'Freelancer'),
                    "hourly_rate": profile.get('hourly_rate'),
                    "rating": profile.get('average_rating'),
                    "match_score": round(score * 100)
                })
        
        matches.sort(key=lambda x: x["match_score"], reverse=True)
        
        return {
            "success": True,
            "instant_matches": matches[:limit]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
