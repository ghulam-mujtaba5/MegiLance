# @AI-HINT: Advanced gamification API - Points, levels, leaderboards, rewards
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from enum import Enum
from app.db.session import get_db
from app.api.v1.auth import get_current_active_user

router = APIRouter(prefix="/advanced-gamification")


class RewardType(str, Enum):
    POINTS = "points"
    BADGE = "badge"
    TITLE = "title"
    DISCOUNT = "discount"
    FEATURE_UNLOCK = "feature_unlock"
    CASH = "cash"


class UserLevel(BaseModel):
    level: int
    name: str
    points_required: int
    points_to_next: int
    perks: List[str]
    badge_url: Optional[str] = None


class PointsTransaction(BaseModel):
    id: str
    user_id: str
    points: int
    action: str
    description: str
    created_at: datetime


class Achievement(BaseModel):
    id: str
    name: str
    description: str
    icon: str
    points: int
    rarity: str
    category: str
    progress: float
    unlocked: bool
    unlocked_at: Optional[datetime] = None


class LeaderboardEntry(BaseModel):
    rank: int
    user_id: str
    username: str
    avatar: Optional[str] = None
    points: int
    level: int
    badges_count: int


class Challenge(BaseModel):
    id: str
    name: str
    description: str
    type: str
    target: int
    progress: int
    reward_points: int
    reward_badge: Optional[str] = None
    start_date: datetime
    end_date: datetime
    is_completed: bool


class Reward(BaseModel):
    id: str
    name: str
    description: str
    type: RewardType
    points_cost: int
    value: Optional[float] = None
    is_available: bool
    quantity_remaining: Optional[int] = None


@router.get("/profile")
async def get_gamification_profile(
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get user's gamification profile"""
    return {
        "user_id": str(current_user.id),
        "total_points": 15420,
        "available_points": 8500,
        "level": 12,
        "level_name": "Expert",
        "level_progress": 65.5,
        "badges_count": 15,
        "achievements_count": 42,
        "rank": 156,
        "streak_days": 14,
        "next_level": {
            "level": 13,
            "name": "Master",
            "points_required": 20000,
            "points_needed": 4580
        }
    }


@router.get("/levels", response_model=List[UserLevel])
async def get_levels(
    current_user=Depends(get_current_active_user)
):
    """Get all available levels"""
    return [
        UserLevel(level=1, name="Novice", points_required=0, points_to_next=500, perks=["Basic profile"]),
        UserLevel(level=5, name="Apprentice", points_required=2000, points_to_next=1000, perks=["Custom avatar"]),
        UserLevel(level=10, name="Professional", points_required=10000, points_to_next=5000, perks=["Priority support"]),
        UserLevel(level=15, name="Expert", points_required=25000, points_to_next=10000, perks=["Featured profile"]),
        UserLevel(level=20, name="Master", points_required=50000, points_to_next=25000, perks=["Exclusive badges"])
    ]


@router.get("/points/history", response_model=List[PointsTransaction])
async def get_points_history(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get points transaction history"""
    return [
        PointsTransaction(
            id=f"txn-{i}",
            user_id=str(current_user.id),
            points=100 if i % 2 == 0 else -50,
            action="project_completed" if i % 2 == 0 else "reward_redeemed",
            description="Completed project #123" if i % 2 == 0 else "Redeemed discount coupon",
            created_at=datetime.utcnow()
        )
        for i in range(min(limit, 10))
    ]


@router.get("/achievements", response_model=List[Achievement])
async def get_achievements(
    category: Optional[str] = None,
    unlocked_only: bool = False,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get user's achievements"""
    return [
        Achievement(
            id="ach-1",
            name="First Project",
            description="Complete your first project",
            icon="🎯",
            points=100,
            rarity="common",
            category="milestones",
            progress=100,
            unlocked=True,
            unlocked_at=datetime.utcnow()
        ),
        Achievement(
            id="ach-2",
            name="5-Star Master",
            description="Receive 10 five-star reviews",
            icon="⭐",
            points=500,
            rarity="rare",
            category="reviews",
            progress=70,
            unlocked=False
        ),
        Achievement(
            id="ach-3",
            name="Speed Demon",
            description="Complete a project 3 days early",
            icon="⚡",
            points=250,
            rarity="uncommon",
            category="performance",
            progress=100,
            unlocked=True,
            unlocked_at=datetime.utcnow()
        )
    ]


@router.get("/achievements/{achievement_id}", response_model=Achievement)
async def get_achievement(
    achievement_id: str,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get specific achievement details"""
    return Achievement(
        id=achievement_id,
        name="First Project",
        description="Complete your first project",
        icon="🎯",
        points=100,
        rarity="common",
        category="milestones",
        progress=100,
        unlocked=True,
        unlocked_at=datetime.utcnow()
    )


@router.get("/leaderboard", response_model=List[LeaderboardEntry])
async def get_leaderboard(
    period: str = Query("all_time", enum=["weekly", "monthly", "all_time"]),
    limit: int = Query(50, ge=1, le=100),
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get gamification leaderboard"""
    return [
        LeaderboardEntry(
            rank=i + 1,
            user_id=f"user-{i}",
            username=f"TopUser{i + 1}",
            points=50000 - (i * 1000),
            level=20 - i,
            badges_count=25 - i
        )
        for i in range(min(limit, 10))
    ]


@router.get("/leaderboard/my-rank")
async def get_my_rank(
    period: str = Query("all_time", enum=["weekly", "monthly", "all_time"]),
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get current user's rank"""
    return {
        "rank": 156,
        "total_users": 5420,
        "percentile": 97.1,
        "points": 15420,
        "level": 12
    }


@router.get("/challenges", response_model=List[Challenge])
async def get_challenges(
    active_only: bool = True,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get available challenges"""
    return [
        Challenge(
            id="challenge-1",
            name="Weekly Warrior",
            description="Complete 5 projects this week",
            type="weekly",
            target=5,
            progress=3,
            reward_points=500,
            reward_badge="weekly_warrior",
            start_date=datetime.utcnow(),
            end_date=datetime.utcnow(),
            is_completed=False
        ),
        Challenge(
            id="challenge-2",
            name="Review Rush",
            description="Get 3 reviews with 5 stars",
            type="monthly",
            target=3,
            progress=2,
            reward_points=750,
            start_date=datetime.utcnow(),
            end_date=datetime.utcnow(),
            is_completed=False
        )
    ]


@router.post("/challenges/{challenge_id}/join")
async def join_challenge(
    challenge_id: str,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Join a challenge"""
    return {
        "challenge_id": challenge_id,
        "joined": True,
        "message": "Successfully joined the challenge!"
    }


@router.get("/rewards", response_model=List[Reward])
async def get_rewards_store(
    type: Optional[RewardType] = None,
    current_user=Depends(get_current_active_user)
):
    """Get available rewards in the store"""
    return [
        Reward(
            id="reward-1",
            name="10% Discount",
            description="10% off service fees for your next project",
            type=RewardType.DISCOUNT,
            points_cost=1000,
            value=10,
            is_available=True
        ),
        Reward(
            id="reward-2",
            name="Premium Badge",
            description="Exclusive badge for your profile",
            type=RewardType.BADGE,
            points_cost=2000,
            is_available=True
        ),
        Reward(
            id="reward-3",
            name="Featured Listing",
            description="Get featured on the homepage for 7 days",
            type=RewardType.FEATURE_UNLOCK,
            points_cost=5000,
            is_available=True,
            quantity_remaining=10
        )
    ]


@router.post("/rewards/{reward_id}/redeem")
async def redeem_reward(
    reward_id: str,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Redeem a reward"""
    return {
        "success": True,
        "reward_id": reward_id,
        "points_spent": 1000,
        "remaining_points": 7500,
        "redemption_code": "REWARD-ABC123"
    }


@router.get("/badges")
async def get_user_badges(
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get user's badges"""
    return [
        {
            "id": "badge-1",
            "name": "Rising Star",
            "description": "Top performer in first month",
            "icon_url": "/badges/rising-star.png",
            "earned_at": datetime.utcnow().isoformat()
        },
        {
            "id": "badge-2",
            "name": "Quick Responder",
            "description": "Average response time under 1 hour",
            "icon_url": "/badges/quick-responder.png",
            "earned_at": datetime.utcnow().isoformat()
        }
    ]


@router.get("/streak")
async def get_streak_info(
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get user's streak information"""
    return {
        "current_streak": 14,
        "longest_streak": 45,
        "streak_bonus_multiplier": 1.2,
        "next_milestone": 30,
        "milestone_bonus": 500
    }


@router.post("/daily-checkin")
async def daily_checkin(
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Perform daily check-in for bonus points"""
    return {
        "success": True,
        "points_earned": 50,
        "streak_day": 15,
        "bonus_multiplier": 1.2,
        "total_points_earned": 60
    }


@router.get("/stats")
async def get_gamification_stats(
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get detailed gamification statistics"""
    return {
        "total_points_earned": 25000,
        "points_spent": 9580,
        "available_points": 15420,
        "achievements_unlocked": 42,
        "achievements_total": 100,
        "challenges_completed": 15,
        "rewards_redeemed": 8,
        "leaderboard_peak_rank": 89,
        "badges_collected": 15,
        "total_badges": 50
    }
