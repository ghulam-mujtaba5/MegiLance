# @AI-HINT: Achievement system API endpoints
"""
Achievement System API - Comprehensive achievement and milestone endpoints.

Features:
- Achievement discovery
- User progress tracking
- Leaderboards
- Certificates
- Showcase management
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

from app.db.session import get_db
from app.core.security import get_current_active_user
from app.services.achievement_system import (
    get_achievement_service,
    AchievementCategory
)

router = APIRouter(prefix="/achievements", tags=["achievements"])


# Request/Response Models
class ShowcaseSettingsRequest(BaseModel):
    featured_achievements: Optional[List[str]] = None
    show_on_profile: bool = True
    show_points: bool = True
    show_ranking: bool = True
    theme: str = "default"


# Achievement Discovery Endpoints
@router.get("/")
async def get_all_achievements(
    category: Optional[AchievementCategory] = None,
    include_hidden: bool = False,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """Get all available achievements."""
    service = get_achievement_service(db)
    achievements = await service.get_all_achievements(category, include_hidden)
    return {"achievements": achievements}


@router.get("/{achievement_id}")
async def get_achievement_details(
    achievement_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """Get detailed achievement information."""
    service = get_achievement_service(db)
    achievement = await service.get_achievement_details(achievement_id)
    
    if not achievement:
        raise HTTPException(status_code=404, detail="Achievement not found")
    
    return {"achievement": achievement}


# User Achievement Endpoints
@router.get("/user/me")
async def get_my_achievements(
    include_progress: bool = True,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """Get current user's achievements."""
    service = get_achievement_service(db)
    achievements = await service.get_user_achievements(current_user["id"], include_progress)
    return achievements


@router.get("/user/{user_id}")
async def get_user_achievements(
    user_id: int,
    include_progress: bool = False,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """Get another user's achievements (public view)."""
    service = get_achievement_service(db)
    achievements = await service.get_user_achievements(user_id, include_progress=False)
    return achievements


@router.get("/progress/{achievement_id}")
async def check_achievement_progress(
    achievement_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """Check progress on a specific achievement."""
    service = get_achievement_service(db)
    progress = await service.check_achievement_progress(current_user["id"], achievement_id)
    return progress


# Leaderboard Endpoints
@router.get("/leaderboard")
async def get_leaderboard(
    category: Optional[AchievementCategory] = None,
    period: str = "all_time",
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """Get achievement leaderboard."""
    service = get_achievement_service(db)
    leaderboard = await service.get_leaderboard(category, period, limit)
    return leaderboard


@router.get("/leaderboard/me")
async def get_my_ranking(
    category: Optional[AchievementCategory] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """Get current user's ranking."""
    service = get_achievement_service(db)
    ranking = await service.get_user_ranking(current_user["id"], category)
    return ranking


# Certificate Endpoints
@router.get("/certificates")
async def get_my_certificates(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """Get user's achievement certificates."""
    service = get_achievement_service(db)
    certificates = await service.get_certificates(current_user["id"])
    return {"certificates": certificates}


@router.post("/certificates/{achievement_id}")
async def generate_certificate(
    achievement_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """Generate a certificate for an achievement."""
    service = get_achievement_service(db)
    certificate = await service.generate_certificate(current_user["id"], achievement_id)
    return certificate


# Showcase Endpoints
@router.get("/showcase")
async def get_showcase_settings(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """Get user's achievement showcase settings."""
    service = get_achievement_service(db)
    settings = await service.get_showcase_settings(current_user["id"])
    return {"settings": settings}


@router.put("/showcase")
async def update_showcase_settings(
    request: ShowcaseSettingsRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """Update showcase settings."""
    service = get_achievement_service(db)
    result = await service.update_showcase_settings(current_user["id"], request.dict())
    return result


# Statistics Endpoint
@router.get("/stats")
async def get_achievement_stats(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """Get user's achievement statistics."""
    service = get_achievement_service(db)
    stats = await service.get_achievement_stats(current_user["id"])
    return {"stats": stats}
