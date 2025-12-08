# @AI-HINT: Basic gamification endpoints (points, badges, leaderboard)
"""
Gamification API endpoints for user engagement.

Provides:
- User points tracking
- Badge system
- Leaderboard rankings
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel

from app.db.session import get_db
from app.core.security import get_current_active_user
from app.models.user import User

router = APIRouter(prefix="/gamification", tags=["gamification"])


# Schemas
class PointsResponse(BaseModel):
    user_id: int
    points: int
    level: int
    next_level_points: int
    rank: Optional[int] = None


class BadgeResponse(BaseModel):
    id: str
    name: str
    description: str
    icon: str
    earned_at: Optional[str] = None


class LeaderboardEntry(BaseModel):
    rank: int
    user_id: int
    username: str
    avatar_url: Optional[str] = None
    points: int
    level: int
    badges_count: int


# Endpoints
@router.get("/points", response_model=PointsResponse)
async def get_user_points(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get current user's gamification points and level."""
    # Calculate level based on points (every 1000 points = 1 level)
    points = getattr(current_user, 'points', 0) or 0
    level = (points // 1000) + 1
    next_level_points = level * 1000
    
    return PointsResponse(
        user_id=current_user.id,
        points=points,
        level=level,
        next_level_points=next_level_points,
        rank=None  # Would calculate from leaderboard
    )


@router.get("/badges", response_model=List[BadgeResponse])
async def get_user_badges(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get current user's earned badges."""
    # Return sample badges - in production, fetch from database
    badges = [
        BadgeResponse(
            id="early_adopter",
            name="Early Adopter",
            description="Joined MegiLance in the first year",
            icon="🚀",
            earned_at="2024-01-15T10:30:00Z"
        ),
        BadgeResponse(
            id="verified",
            name="Verified Professional",
            description="Completed identity verification",
            icon="✓",
            earned_at="2024-01-20T14:00:00Z"
        )
    ]
    return badges


@router.get("/leaderboard", response_model=List[LeaderboardEntry])
async def get_leaderboard(
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """Get top users on the leaderboard."""
    # Sample leaderboard data
    leaderboard = [
        LeaderboardEntry(
            rank=1,
            user_id=1,
            username="top_freelancer",
            avatar_url=None,
            points=15420,
            level=16,
            badges_count=12
        ),
        LeaderboardEntry(
            rank=2,
            user_id=2,
            username="pro_developer",
            avatar_url=None,
            points=12350,
            level=13,
            badges_count=9
        ),
        LeaderboardEntry(
            rank=3,
            user_id=3,
            username="design_master",
            avatar_url=None,
            points=10200,
            level=11,
            badges_count=8
        )
    ]
    return leaderboard[:limit]


@router.post("/check-achievements")
async def check_achievements(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Check and award any new achievements for the user."""
    # In production, this would check various criteria and award badges
    return {
        "checked": True,
        "new_badges": [],
        "points_earned": 0,
        "message": "No new achievements at this time"
    }
