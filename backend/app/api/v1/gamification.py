# @AI-HINT: Gamification API endpoints for points, badges, achievements
"""
Gamification API - Points, badges, achievements endpoints.

Features:
- View user gamification profile
- Check badges and achievements
- View leaderboards
- Track activity streaks
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from app.db.session import get_db
from app.core.security import get_current_active_user
from app.models.user import User
from app.services.gamification import GamificationService, BadgeType

router = APIRouter()


# API Endpoints
@router.get("/profile")
async def get_gamification_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get user's gamification profile."""
    service = GamificationService(db)
    
    profile = await service.get_user_profile(current_user.id)
    
    return profile


@router.get("/profile/{user_id}")
async def get_user_gamification_profile(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get another user's gamification profile."""
    service = GamificationService(db)
    
    profile = await service.get_user_profile(user_id)
    
    return profile


@router.get("/badges")
async def get_all_badges(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all available badges with earned status."""
    service = GamificationService(db)
    
    badges = await service.get_available_badges(current_user.id)
    
    # Group by tier
    by_tier = {"bronze": [], "silver": [], "gold": [], "platinum": []}
    for badge in badges:
        tier = badge.get("tier", "bronze")
        if tier in by_tier:
            by_tier[tier].append(badge)
    
    earned = [b for b in badges if b.get("earned")]
    
    return {
        "badges": badges,
        "by_tier": by_tier,
        "total": len(badges),
        "earned": len(earned),
        "progress": f"{len(earned)}/{len(badges)}"
    }


@router.get("/badges/{badge_type}")
async def get_badge_info(
    badge_type: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get information about a specific badge."""
    service = GamificationService(db)
    
    badges = await service.get_available_badges(current_user.id)
    
    badge = next((b for b in badges if b["badge"] == badge_type), None)
    
    if not badge:
        raise HTTPException(status_code=404, detail="Badge not found")
    
    return badge


@router.get("/leaderboard")
async def get_leaderboard(
    category: str = "all",
    period: str = "all_time",
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get leaderboard."""
    if limit > 100:
        limit = 100
    
    service = GamificationService(db)
    
    leaderboard = await service.get_leaderboard(
        category=category,
        period=period,
        limit=limit
    )
    
    # Add current user's rank
    user_rank = await service.get_user_rank(current_user.id)
    leaderboard["your_rank"] = user_rank
    
    return leaderboard


@router.get("/rank")
async def get_my_rank(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get current user's rank."""
    service = GamificationService(db)
    
    rank = await service.get_user_rank(current_user.id)
    
    return rank


@router.get("/streak")
async def get_my_streak(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get current user's activity streak."""
    service = GamificationService(db)
    
    profile = await service.get_user_profile(current_user.id)
    
    return {
        "user_id": current_user.id,
        "streak": profile.get("streak", {"current": 0, "longest": 0})
    }


@router.post("/streak/check-in")
async def check_in(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Daily check-in to maintain streak."""
    service = GamificationService(db)
    
    streak = await service.update_streak(current_user.id, "login")
    
    # Award daily points
    points = await service.award_points(
        user_id=current_user.id,
        action="login",
        reason="Daily check-in"
    )
    
    return {
        "streak": streak,
        "points": points
    }


@router.get("/levels")
async def get_level_info(
    db: Session = Depends(get_db)
):
    """Get information about all levels."""
    from app.services.gamification import LEVEL_THRESHOLDS
    
    levels = []
    for i, threshold in enumerate(LEVEL_THRESHOLDS):
        level = i + 1
        service = GamificationService(db)
        
        levels.append({
            "level": level,
            "name": service._get_level_name(level),
            "points_required": threshold,
            "next_level_points": LEVEL_THRESHOLDS[i + 1] if i + 1 < len(LEVEL_THRESHOLDS) else None
        })
    
    return {"levels": levels}


@router.get("/activity")
async def get_activity_log(
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get user's recent activity log."""
    service = GamificationService(db)
    
    # Filter activity log for current user
    activities = [
        a for a in service._activity_log
        if a.get("user_id") == current_user.id
    ]
    
    # Sort by timestamp descending
    activities.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
    
    return {
        "activities": activities[:limit],
        "total": len(activities)
    }


# Admin endpoints for awarding points/badges
@router.post("/admin/award-points")
async def admin_award_points(
    user_id: int,
    points: int,
    reason: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Award points to a user (admin only)."""
    if not hasattr(current_user, 'role') or current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    service = GamificationService(db)
    
    # Custom points award
    service._user_points[user_id] += points
    
    return {
        "user_id": user_id,
        "points_awarded": points,
        "reason": reason,
        "new_total": service._user_points[user_id]
    }


@router.post("/admin/award-badge")
async def admin_award_badge(
    user_id: int,
    badge_type: str,
    reason: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Award a badge to a user (admin only)."""
    if not hasattr(current_user, 'role') or current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        badge = BadgeType(badge_type)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid badge type: {badge_type}"
        )
    
    service = GamificationService(db)
    
    result = await service.award_badge(user_id, badge, reason)
    
    if not result:
        raise HTTPException(
            status_code=400,
            detail="Badge already earned or invalid"
        )
    
    return result
