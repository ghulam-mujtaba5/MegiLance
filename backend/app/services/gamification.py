# @AI-HINT: Gamification service for user engagement
"""
Gamification Service - Points, badges, and achievements.

Features:
- Points system
- Badge/achievement system
- Leaderboards
- Level progression
- Streak tracking
- Rewards/perks
"""

import logging
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from enum import Enum
from collections import defaultdict

logger = logging.getLogger(__name__)


class BadgeType(str, Enum):
    """Badge/achievement types."""
    # Profile badges
    PROFILE_COMPLETE = "profile_complete"
    VERIFIED_USER = "verified_user"
    PREMIUM_MEMBER = "premium_member"
    
    # Activity badges
    FIRST_PROJECT = "first_project"
    FIRST_PROPOSAL = "first_proposal"
    FIRST_CONTRACT = "first_contract"
    FIRST_REVIEW = "first_review"
    
    # Milestone badges
    PROJECTS_10 = "projects_10"
    PROJECTS_50 = "projects_50"
    PROJECTS_100 = "projects_100"
    EARNINGS_1K = "earnings_1k"
    EARNINGS_10K = "earnings_10k"
    EARNINGS_100K = "earnings_100k"
    
    # Quality badges
    FIVE_STAR = "five_star"
    TOP_RATED = "top_rated"
    RISING_STAR = "rising_star"
    EXPERT = "expert"
    
    # Engagement badges
    ACTIVE_7_DAYS = "active_7_days"
    ACTIVE_30_DAYS = "active_30_days"
    ACTIVE_365_DAYS = "active_365_days"
    QUICK_RESPONDER = "quick_responder"
    
    # Special badges
    EARLY_ADOPTER = "early_adopter"
    BETA_TESTER = "beta_tester"
    COMMUNITY_HELPER = "community_helper"
    REFERRAL_CHAMPION = "referral_champion"


# Badge definitions
BADGE_DEFINITIONS = {
    BadgeType.PROFILE_COMPLETE: {
        "name": "Profile Master",
        "description": "Completed 100% of your profile",
        "icon": "🎯",
        "points": 100,
        "tier": "bronze"
    },
    BadgeType.VERIFIED_USER: {
        "name": "Verified",
        "description": "Verified your identity",
        "icon": "✅",
        "points": 200,
        "tier": "silver"
    },
    BadgeType.FIRST_PROJECT: {
        "name": "Project Starter",
        "description": "Posted your first project",
        "icon": "🚀",
        "points": 50,
        "tier": "bronze"
    },
    BadgeType.FIRST_PROPOSAL: {
        "name": "Go-Getter",
        "description": "Submitted your first proposal",
        "icon": "📝",
        "points": 50,
        "tier": "bronze"
    },
    BadgeType.FIRST_CONTRACT: {
        "name": "Deal Maker",
        "description": "Completed your first contract",
        "icon": "🤝",
        "points": 100,
        "tier": "bronze"
    },
    BadgeType.PROJECTS_10: {
        "name": "Rising Professional",
        "description": "Completed 10 projects",
        "icon": "📈",
        "points": 300,
        "tier": "silver"
    },
    BadgeType.PROJECTS_50: {
        "name": "Seasoned Pro",
        "description": "Completed 50 projects",
        "icon": "🏆",
        "points": 1000,
        "tier": "gold"
    },
    BadgeType.PROJECTS_100: {
        "name": "Elite Freelancer",
        "description": "Completed 100 projects",
        "icon": "👑",
        "points": 2500,
        "tier": "platinum"
    },
    BadgeType.EARNINGS_1K: {
        "name": "$1K Club",
        "description": "Earned $1,000 on the platform",
        "icon": "💵",
        "points": 200,
        "tier": "bronze"
    },
    BadgeType.EARNINGS_10K: {
        "name": "$10K Club",
        "description": "Earned $10,000 on the platform",
        "icon": "💰",
        "points": 500,
        "tier": "silver"
    },
    BadgeType.EARNINGS_100K: {
        "name": "$100K Club",
        "description": "Earned $100,000 on the platform",
        "icon": "🏅",
        "points": 2000,
        "tier": "gold"
    },
    BadgeType.FIVE_STAR: {
        "name": "Five Star",
        "description": "Maintained 5.0 rating on 5+ reviews",
        "icon": "⭐",
        "points": 300,
        "tier": "silver"
    },
    BadgeType.TOP_RATED: {
        "name": "Top Rated",
        "description": "In the top 10% of freelancers",
        "icon": "🌟",
        "points": 1000,
        "tier": "gold"
    },
    BadgeType.ACTIVE_7_DAYS: {
        "name": "Weekly Warrior",
        "description": "Active for 7 consecutive days",
        "icon": "📅",
        "points": 50,
        "tier": "bronze"
    },
    BadgeType.ACTIVE_30_DAYS: {
        "name": "Monthly Maven",
        "description": "Active for 30 consecutive days",
        "icon": "📆",
        "points": 200,
        "tier": "silver"
    },
    BadgeType.QUICK_RESPONDER: {
        "name": "Quick Responder",
        "description": "Average response time under 1 hour",
        "icon": "⚡",
        "points": 150,
        "tier": "bronze"
    },
    BadgeType.EARLY_ADOPTER: {
        "name": "Early Adopter",
        "description": "Joined during beta period",
        "icon": "🌱",
        "points": 500,
        "tier": "gold"
    },
    BadgeType.COMMUNITY_HELPER: {
        "name": "Community Helper",
        "description": "Helped 10 users in forums",
        "icon": "🤗",
        "points": 300,
        "tier": "silver"
    },
    BadgeType.REFERRAL_CHAMPION: {
        "name": "Referral Champion",
        "description": "Referred 10 active users",
        "icon": "📣",
        "points": 500,
        "tier": "gold"
    }
}

# Points for actions
ACTION_POINTS = {
    "login": 1,
    "profile_update": 5,
    "project_posted": 10,
    "proposal_submitted": 5,
    "proposal_accepted": 20,
    "contract_completed": 50,
    "review_given": 10,
    "review_received": 15,
    "message_sent": 1,
    "file_uploaded": 2,
    "milestone_completed": 25,
    "dispute_resolved": 30,
    "skill_verified": 20,
    "referral_signup": 100,
    "referral_conversion": 200
}

# Level thresholds
LEVEL_THRESHOLDS = [
    0,      # Level 1
    100,    # Level 2
    300,    # Level 3
    600,    # Level 4
    1000,   # Level 5
    1500,   # Level 6
    2200,   # Level 7
    3000,   # Level 8
    4000,   # Level 9
    5500,   # Level 10
    7500,   # Level 11
    10000,  # Level 12
    15000,  # Level 13
    20000,  # Level 14
    30000,  # Level 15
    50000,  # Level 16
    75000,  # Level 17
    100000, # Level 18
    150000, # Level 19
    250000  # Level 20
]


class GamificationService:
    """
    Gamification service for user engagement.
    
    Manages points, badges, achievements, and leaderboards.
    """
    
    def __init__(self, db: Session):
        self.db = db
        # In-memory storage (would be in DB in production)
        self._user_points: Dict[int, int] = defaultdict(int)
        self._user_badges: Dict[int, List[str]] = defaultdict(list)
        self._user_streaks: Dict[int, Dict[str, Any]] = {}
        self._activity_log: List[Dict[str, Any]] = []
    
    async def award_points(
        self,
        user_id: int,
        action: str,
        multiplier: float = 1.0,
        reason: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Award points to a user.
        
        Args:
            user_id: User ID
            action: Action type
            multiplier: Point multiplier
            reason: Optional reason
            
        Returns:
            Points awarded info
        """
        base_points = ACTION_POINTS.get(action, 1)
        points = int(base_points * multiplier)
        
        old_points = self._user_points[user_id]
        new_points = old_points + points
        self._user_points[user_id] = new_points
        
        old_level = self._get_level_for_points(old_points)
        new_level = self._get_level_for_points(new_points)
        
        # Log activity
        self._activity_log.append({
            "user_id": user_id,
            "action": action,
            "points": points,
            "reason": reason,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        result = {
            "user_id": user_id,
            "action": action,
            "points_awarded": points,
            "total_points": new_points,
            "level": new_level
        }
        
        # Check level up
        if new_level > old_level:
            result["level_up"] = True
            result["old_level"] = old_level
            result["new_level"] = new_level
            
            logger.info(f"User {user_id} leveled up to {new_level}")
        
        # Check for badge triggers
        badges_earned = await self._check_badge_triggers(user_id, action, new_points)
        if badges_earned:
            result["badges_earned"] = badges_earned
        
        return result
    
    async def award_badge(
        self,
        user_id: int,
        badge_type: BadgeType,
        reason: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """Award a badge to a user."""
        # Check if already has badge
        if badge_type.value in self._user_badges[user_id]:
            return None
        
        badge_def = BADGE_DEFINITIONS.get(badge_type)
        if not badge_def:
            return None
        
        # Award badge
        self._user_badges[user_id].append(badge_type.value)
        
        # Award bonus points
        bonus_points = badge_def["points"]
        self._user_points[user_id] += bonus_points
        
        logger.info(f"User {user_id} earned badge: {badge_type.value}")
        
        return {
            "badge": badge_type.value,
            "name": badge_def["name"],
            "description": badge_def["description"],
            "icon": badge_def["icon"],
            "tier": badge_def["tier"],
            "bonus_points": bonus_points,
            "earned_at": datetime.utcnow().isoformat(),
            "reason": reason
        }
    
    async def get_user_profile(
        self,
        user_id: int
    ) -> Dict[str, Any]:
        """Get user's gamification profile."""
        points = self._user_points[user_id]
        level = self._get_level_for_points(points)
        badges = self._user_badges[user_id]
        
        # Calculate progress to next level
        current_threshold = LEVEL_THRESHOLDS[level - 1] if level > 0 else 0
        next_threshold = LEVEL_THRESHOLDS[level] if level < len(LEVEL_THRESHOLDS) else float('inf')
        progress = (points - current_threshold) / (next_threshold - current_threshold) if next_threshold > current_threshold else 1.0
        
        # Get badge details
        badge_details = []
        for badge_value in badges:
            try:
                badge_type = BadgeType(badge_value)
                badge_def = BADGE_DEFINITIONS.get(badge_type, {})
                badge_details.append({
                    "badge": badge_value,
                    **badge_def
                })
            except ValueError:
                pass
        
        # Get streak info
        streak = self._user_streaks.get(user_id, {"current": 0, "longest": 0})
        
        return {
            "user_id": user_id,
            "points": points,
            "level": level,
            "level_name": self._get_level_name(level),
            "progress_to_next_level": round(progress * 100, 1),
            "points_to_next_level": max(0, next_threshold - points),
            "badges": badge_details,
            "badge_count": len(badges),
            "streak": streak
        }
    
    async def get_leaderboard(
        self,
        category: str = "all",
        period: str = "all_time",
        limit: int = 50
    ) -> Dict[str, Any]:
        """Get leaderboard."""
        # Sort users by points
        sorted_users = sorted(
            self._user_points.items(),
            key=lambda x: x[1],
            reverse=True
        )[:limit]
        
        leaderboard = []
        for rank, (user_id, points) in enumerate(sorted_users, 1):
            level = self._get_level_for_points(points)
            badges = len(self._user_badges[user_id])
            
            leaderboard.append({
                "rank": rank,
                "user_id": user_id,
                "points": points,
                "level": level,
                "level_name": self._get_level_name(level),
                "badge_count": badges
            })
        
        return {
            "category": category,
            "period": period,
            "leaderboard": leaderboard,
            "total_users": len(self._user_points)
        }
    
    async def get_user_rank(
        self,
        user_id: int
    ) -> Dict[str, Any]:
        """Get user's rank on leaderboard."""
        points = self._user_points[user_id]
        
        # Count users with more points
        rank = 1
        for uid, upoints in self._user_points.items():
            if upoints > points:
                rank += 1
        
        total_users = len(self._user_points) or 1
        percentile = ((total_users - rank + 1) / total_users) * 100
        
        return {
            "user_id": user_id,
            "rank": rank,
            "total_users": total_users,
            "percentile": round(percentile, 1),
            "points": points
        }
    
    async def update_streak(
        self,
        user_id: int,
        action: str = "login"
    ) -> Dict[str, Any]:
        """Update user's activity streak."""
        now = datetime.utcnow()
        
        streak = self._user_streaks.get(user_id, {
            "current": 0,
            "longest": 0,
            "last_activity": None
        })
        
        last_activity = streak.get("last_activity")
        if last_activity:
            last_date = datetime.fromisoformat(last_activity).date()
            today = now.date()
            days_diff = (today - last_date).days
            
            if days_diff == 1:
                # Streak continues
                streak["current"] += 1
                if streak["current"] > streak["longest"]:
                    streak["longest"] = streak["current"]
            elif days_diff > 1:
                # Streak broken
                streak["current"] = 1
            # days_diff == 0: same day, no change
        else:
            streak["current"] = 1
        
        streak["last_activity"] = now.isoformat()
        self._user_streaks[user_id] = streak
        
        # Check streak badges
        if streak["current"] == 7:
            await self.award_badge(user_id, BadgeType.ACTIVE_7_DAYS)
        elif streak["current"] == 30:
            await self.award_badge(user_id, BadgeType.ACTIVE_30_DAYS)
        elif streak["current"] == 365:
            await self.award_badge(user_id, BadgeType.ACTIVE_365_DAYS)
        
        return streak
    
    async def get_available_badges(
        self,
        user_id: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """Get all available badges with earned status."""
        earned = set(self._user_badges.get(user_id, [])) if user_id else set()
        
        badges = []
        for badge_type, badge_def in BADGE_DEFINITIONS.items():
            badges.append({
                "badge": badge_type.value,
                **badge_def,
                "earned": badge_type.value in earned
            })
        
        return badges
    
    async def _check_badge_triggers(
        self,
        user_id: int,
        action: str,
        total_points: int
    ) -> List[Dict[str, Any]]:
        """Check if any badges should be awarded."""
        badges_earned = []
        
        # Action-based badges
        action_badges = {
            "project_posted": BadgeType.FIRST_PROJECT,
            "proposal_submitted": BadgeType.FIRST_PROPOSAL,
            "contract_completed": BadgeType.FIRST_CONTRACT,
            "review_given": BadgeType.FIRST_REVIEW
        }
        
        if action in action_badges:
            badge = await self.award_badge(user_id, action_badges[action])
            if badge:
                badges_earned.append(badge)
        
        return badges_earned
    
    def _get_level_for_points(self, points: int) -> int:
        """Calculate level for point total."""
        for level, threshold in enumerate(LEVEL_THRESHOLDS):
            if points < threshold:
                return max(1, level)
        return len(LEVEL_THRESHOLDS)
    
    def _get_level_name(self, level: int) -> str:
        """Get name for level."""
        level_names = {
            1: "Newcomer",
            2: "Beginner",
            3: "Apprentice",
            4: "Intermediate",
            5: "Skilled",
            6: "Advanced",
            7: "Expert",
            8: "Master",
            9: "Grandmaster",
            10: "Elite",
            11: "Champion",
            12: "Legend",
            13: "Mythic",
            14: "Immortal",
            15: "Divine",
            16: "Transcendent",
            17: "Celestial",
            18: "Cosmic",
            19: "Universal",
            20: "Infinite"
        }
        return level_names.get(level, f"Level {level}")


# Singleton instance
_gamification_service: Optional[GamificationService] = None


def get_gamification_service(db: Session) -> GamificationService:
    """Get or create gamification service instance."""
    global _gamification_service
    if _gamification_service is None:
        _gamification_service = GamificationService(db)
    else:
        _gamification_service.db = db
    return _gamification_service
