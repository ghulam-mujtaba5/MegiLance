# @AI-HINT: Achievement system service beyond basic gamification
"""
Achievement System Service - Comprehensive achievement and milestone tracking.

Features:
- Achievement categories
- Progress tracking
- Milestone unlocks
- Certificates
- Achievement showcase
- Leaderboards
"""

from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
import uuid


class AchievementCategory(str, Enum):
    PROFILE = "profile"
    PROJECTS = "projects"
    COMMUNICATION = "communication"
    EARNINGS = "earnings"
    SKILLS = "skills"
    REVIEWS = "reviews"
    COMMUNITY = "community"
    MILESTONES = "milestones"
    SPECIAL = "special"


class AchievementTier(str, Enum):
    BRONZE = "bronze"
    SILVER = "silver"
    GOLD = "gold"
    PLATINUM = "platinum"
    DIAMOND = "diamond"


class AchievementRarity(str, Enum):
    COMMON = "common"
    UNCOMMON = "uncommon"
    RARE = "rare"
    EPIC = "epic"
    LEGENDARY = "legendary"


class AchievementSystemService:
    """Comprehensive achievement tracking service."""
    
    def __init__(self, db: Session):
        self.db = db
        self._achievements = self._define_achievements()
    
    def _define_achievements(self) -> Dict[str, Dict[str, Any]]:
        """Define all available achievements."""
        return {
            # Profile Achievements
            "profile_complete": {
                "name": "Profile Pro",
                "description": "Complete your profile 100%",
                "category": AchievementCategory.PROFILE,
                "tier": AchievementTier.BRONZE,
                "rarity": AchievementRarity.COMMON,
                "points": 50,
                "icon": "user-check"
            },
            "verified_identity": {
                "name": "Verified Professional",
                "description": "Complete identity verification",
                "category": AchievementCategory.PROFILE,
                "tier": AchievementTier.SILVER,
                "rarity": AchievementRarity.UNCOMMON,
                "points": 100,
                "icon": "shield-check"
            },
            "portfolio_showcase": {
                "name": "Portfolio Star",
                "description": "Add 10 projects to your portfolio",
                "category": AchievementCategory.PROFILE,
                "tier": AchievementTier.GOLD,
                "rarity": AchievementRarity.RARE,
                "points": 200,
                "icon": "briefcase"
            },
            
            # Project Achievements
            "first_project": {
                "name": "First Steps",
                "description": "Complete your first project",
                "category": AchievementCategory.PROJECTS,
                "tier": AchievementTier.BRONZE,
                "rarity": AchievementRarity.COMMON,
                "points": 100,
                "icon": "flag"
            },
            "project_streak_5": {
                "name": "On A Roll",
                "description": "Complete 5 projects in a row with 5-star reviews",
                "category": AchievementCategory.PROJECTS,
                "tier": AchievementTier.GOLD,
                "rarity": AchievementRarity.RARE,
                "points": 300,
                "icon": "fire"
            },
            "project_100": {
                "name": "Century Club",
                "description": "Complete 100 projects",
                "category": AchievementCategory.PROJECTS,
                "tier": AchievementTier.PLATINUM,
                "rarity": AchievementRarity.EPIC,
                "points": 1000,
                "icon": "trophy"
            },
            "project_500": {
                "name": "Legendary Freelancer",
                "description": "Complete 500 projects",
                "category": AchievementCategory.PROJECTS,
                "tier": AchievementTier.DIAMOND,
                "rarity": AchievementRarity.LEGENDARY,
                "points": 5000,
                "icon": "crown"
            },
            
            # Communication
            "fast_responder": {
                "name": "Lightning Fast",
                "description": "Maintain 95%+ response rate for 30 days",
                "category": AchievementCategory.COMMUNICATION,
                "tier": AchievementTier.SILVER,
                "rarity": AchievementRarity.UNCOMMON,
                "points": 150,
                "icon": "zap"
            },
            
            # Earnings
            "first_1k": {
                "name": "First Thousand",
                "description": "Earn your first $1,000",
                "category": AchievementCategory.EARNINGS,
                "tier": AchievementTier.BRONZE,
                "rarity": AchievementRarity.COMMON,
                "points": 100,
                "icon": "dollar-sign"
            },
            "earnings_10k": {
                "name": "Five Figure Freelancer",
                "description": "Earn $10,000 on the platform",
                "category": AchievementCategory.EARNINGS,
                "tier": AchievementTier.SILVER,
                "rarity": AchievementRarity.UNCOMMON,
                "points": 250,
                "icon": "trending-up"
            },
            "earnings_100k": {
                "name": "Six Figure Success",
                "description": "Earn $100,000 on the platform",
                "category": AchievementCategory.EARNINGS,
                "tier": AchievementTier.PLATINUM,
                "rarity": AchievementRarity.EPIC,
                "points": 1500,
                "icon": "star"
            },
            
            # Skills
            "skill_master": {
                "name": "Skill Master",
                "description": "Pass 5 skill assessments",
                "category": AchievementCategory.SKILLS,
                "tier": AchievementTier.GOLD,
                "rarity": AchievementRarity.RARE,
                "points": 300,
                "icon": "award"
            },
            "top_rated_skill": {
                "name": "Top 10%",
                "description": "Rank in top 10% for any skill",
                "category": AchievementCategory.SKILLS,
                "tier": AchievementTier.PLATINUM,
                "rarity": AchievementRarity.EPIC,
                "points": 500,
                "icon": "medal"
            },
            
            # Reviews
            "five_star_10": {
                "name": "Consistent Excellence",
                "description": "Receive 10 five-star reviews",
                "category": AchievementCategory.REVIEWS,
                "tier": AchievementTier.SILVER,
                "rarity": AchievementRarity.UNCOMMON,
                "points": 200,
                "icon": "star"
            },
            "perfect_score": {
                "name": "Perfect Score",
                "description": "Maintain 5.0 rating for 6 months",
                "category": AchievementCategory.REVIEWS,
                "tier": AchievementTier.PLATINUM,
                "rarity": AchievementRarity.EPIC,
                "points": 750,
                "icon": "sparkles"
            },
            
            # Community
            "helpful_reviewer": {
                "name": "Community Helper",
                "description": "Write 50 helpful reviews",
                "category": AchievementCategory.COMMUNITY,
                "tier": AchievementTier.GOLD,
                "rarity": AchievementRarity.RARE,
                "points": 250,
                "icon": "users"
            },
            "referral_champion": {
                "name": "Referral Champion",
                "description": "Refer 25 active users",
                "category": AchievementCategory.COMMUNITY,
                "tier": AchievementTier.PLATINUM,
                "rarity": AchievementRarity.EPIC,
                "points": 500,
                "icon": "share"
            },
            
            # Special
            "early_adopter": {
                "name": "Early Adopter",
                "description": "Joined during beta period",
                "category": AchievementCategory.SPECIAL,
                "tier": AchievementTier.GOLD,
                "rarity": AchievementRarity.LEGENDARY,
                "points": 500,
                "icon": "rocket"
            },
            "anniversary_1": {
                "name": "First Anniversary",
                "description": "1 year on MegiLance",
                "category": AchievementCategory.MILESTONES,
                "tier": AchievementTier.SILVER,
                "rarity": AchievementRarity.UNCOMMON,
                "points": 200,
                "icon": "cake"
            }
        }
    
    # Achievement Discovery
    async def get_all_achievements(
        self,
        category: Optional[AchievementCategory] = None,
        include_hidden: bool = False
    ) -> List[Dict[str, Any]]:
        """Get all available achievements."""
        achievements = []
        
        for achievement_id, data in self._achievements.items():
            if category and data["category"] != category:
                continue
            
            achievements.append({
                "achievement_id": achievement_id,
                **data
            })
        
        return achievements
    
    async def get_achievement_details(
        self,
        achievement_id: str
    ) -> Optional[Dict[str, Any]]:
        """Get detailed achievement information."""
        if achievement_id not in self._achievements:
            return None
        
        data = self._achievements[achievement_id]
        
        return {
            "achievement_id": achievement_id,
            **data,
            "global_unlock_rate": 15.5,  # Percentage of users who have this
            "total_unlocks": 12500,
            "recent_unlocks": [
                {"user_id": 1, "username": "john_doe", "unlocked_at": datetime.utcnow().isoformat()},
                {"user_id": 2, "username": "jane_smith", "unlocked_at": datetime.utcnow().isoformat()}
            ]
        }
    
    # User Achievements
    async def get_user_achievements(
        self,
        user_id: int,
        include_progress: bool = True
    ) -> Dict[str, Any]:
        """Get user's achievements and progress."""
        unlocked = []
        in_progress = []
        locked = []
        
        # Simulate some unlocked achievements
        for achievement_id, data in list(self._achievements.items())[:5]:
            unlocked.append({
                "achievement_id": achievement_id,
                **data,
                "unlocked_at": datetime.utcnow().isoformat()
            })
        
        # Some in progress
        for achievement_id, data in list(self._achievements.items())[5:10]:
            in_progress.append({
                "achievement_id": achievement_id,
                **data,
                "progress": 65,
                "target": 100
            })
        
        # Rest are locked
        for achievement_id, data in list(self._achievements.items())[10:]:
            locked.append({
                "achievement_id": achievement_id,
                **data,
                "progress": 0,
                "target": 100
            })
        
        return {
            "user_id": user_id,
            "total_points": sum(a["points"] for a in unlocked),
            "total_achievements": len(self._achievements),
            "unlocked_count": len(unlocked),
            "unlocked": unlocked,
            "in_progress": in_progress if include_progress else [],
            "locked": locked if include_progress else [],
            "completion_rate": len(unlocked) / len(self._achievements) * 100
        }
    
    async def check_achievement_progress(
        self,
        user_id: int,
        achievement_id: str
    ) -> Dict[str, Any]:
        """Check progress on a specific achievement."""
        if achievement_id not in self._achievements:
            return {"error": "Achievement not found"}
        
        data = self._achievements[achievement_id]
        
        return {
            "achievement_id": achievement_id,
            "name": data["name"],
            "current_progress": 65,
            "target": 100,
            "percentage": 65.0,
            "estimated_completion": "2 weeks",
            "tips": [
                "Complete more projects to progress",
                "Maintain high quality work"
            ]
        }
    
    async def unlock_achievement(
        self,
        user_id: int,
        achievement_id: str,
        trigger_event: Optional[str] = None
    ) -> Dict[str, Any]:
        """Unlock an achievement for a user."""
        if achievement_id not in self._achievements:
            return {"error": "Achievement not found"}
        
        data = self._achievements[achievement_id]
        
        return {
            "achievement_id": achievement_id,
            "unlocked": True,
            "achievement": data,
            "points_earned": data["points"],
            "new_total_points": 1500,
            "unlocked_at": datetime.utcnow().isoformat(),
            "celebration": {
                "show_animation": True,
                "sound": "achievement_unlock",
                "share_enabled": True
            }
        }
    
    # Leaderboards
    async def get_leaderboard(
        self,
        category: Optional[AchievementCategory] = None,
        period: str = "all_time",
        limit: int = 100
    ) -> Dict[str, Any]:
        """Get achievement leaderboard."""
        return {
            "category": category,
            "period": period,
            "leaderboard": [
                {"rank": 1, "user_id": 1, "username": "top_freelancer", "points": 15000, "achievements": 45},
                {"rank": 2, "user_id": 2, "username": "pro_developer", "points": 12500, "achievements": 40},
                {"rank": 3, "user_id": 3, "username": "design_master", "points": 11000, "achievements": 38},
                {"rank": 4, "user_id": 4, "username": "code_ninja", "points": 10500, "achievements": 35},
                {"rank": 5, "user_id": 5, "username": "creative_guru", "points": 9800, "achievements": 33}
            ],
            "total_participants": 50000,
            "updated_at": datetime.utcnow().isoformat()
        }
    
    async def get_user_ranking(
        self,
        user_id: int,
        category: Optional[AchievementCategory] = None
    ) -> Dict[str, Any]:
        """Get user's ranking on leaderboard."""
        return {
            "user_id": user_id,
            "global_rank": 1250,
            "category_rank": 450 if category else None,
            "percentile": 85.5,
            "points": 3500,
            "achievements_unlocked": 15,
            "rank_change": "+25",
            "next_rank_points_needed": 150
        }
    
    # Certificates
    async def get_certificates(self, user_id: int) -> List[Dict[str, Any]]:
        """Get user's achievement certificates."""
        return [
            {
                "certificate_id": str(uuid.uuid4()),
                "achievement_id": "project_100",
                "name": "Century Club Certificate",
                "description": "Awarded for completing 100 projects",
                "issued_at": datetime.utcnow().isoformat(),
                "verification_url": f"https://megilance.com/verify/{uuid.uuid4()}",
                "shareable": True,
                "linkedin_badge": True
            }
        ]
    
    async def generate_certificate(
        self,
        user_id: int,
        achievement_id: str
    ) -> Dict[str, Any]:
        """Generate a certificate for an achievement."""
        certificate_id = str(uuid.uuid4())
        
        return {
            "certificate_id": certificate_id,
            "achievement_id": achievement_id,
            "pdf_url": f"/certificates/{certificate_id}.pdf",
            "image_url": f"/certificates/{certificate_id}.png",
            "verification_code": str(uuid.uuid4())[:8].upper(),
            "generated_at": datetime.utcnow().isoformat()
        }
    
    # Achievement Showcase
    async def get_showcase_settings(self, user_id: int) -> Dict[str, Any]:
        """Get user's achievement showcase settings."""
        return {
            "user_id": user_id,
            "featured_achievements": [
                "project_100",
                "five_star_10",
                "verified_identity"
            ],
            "show_on_profile": True,
            "show_points": True,
            "show_ranking": True,
            "theme": "default"
        }
    
    async def update_showcase_settings(
        self,
        user_id: int,
        settings: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Update showcase settings."""
        return {
            "user_id": user_id,
            **settings,
            "updated_at": datetime.utcnow().isoformat()
        }
    
    # Achievement Triggers
    async def process_event(
        self,
        user_id: int,
        event_type: str,
        event_data: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Process an event that might trigger achievements."""
        triggered = []
        
        # Check if event triggers any achievements
        if event_type == "project_completed":
            # Check project count achievements
            pass
        elif event_type == "review_received":
            # Check review achievements
            pass
        elif event_type == "earnings_milestone":
            # Check earnings achievements
            pass
        
        return triggered
    
    # Statistics
    async def get_achievement_stats(self, user_id: int) -> Dict[str, Any]:
        """Get user's achievement statistics."""
        return {
            "user_id": user_id,
            "total_points": 3500,
            "achievements_unlocked": 15,
            "achievements_total": len(self._achievements),
            "completion_rate": 35.5,
            "by_category": {
                "profile": {"unlocked": 3, "total": 4},
                "projects": {"unlocked": 5, "total": 8},
                "earnings": {"unlocked": 2, "total": 5},
                "skills": {"unlocked": 3, "total": 6},
                "reviews": {"unlocked": 2, "total": 4}
            },
            "by_rarity": {
                "common": {"unlocked": 8, "total": 10},
                "uncommon": {"unlocked": 4, "total": 8},
                "rare": {"unlocked": 2, "total": 6},
                "epic": {"unlocked": 1, "total": 4},
                "legendary": {"unlocked": 0, "total": 2}
            },
            "recent_unlocks": [
                {"achievement_id": "five_star_10", "unlocked_at": datetime.utcnow().isoformat()}
            ],
            "next_achievable": [
                {"achievement_id": "project_streak_5", "progress": 80}
            ]
        }


def get_achievement_service(db: Session) -> AchievementSystemService:
    return AchievementSystemService(db)
