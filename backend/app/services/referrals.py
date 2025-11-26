# @AI-HINT: Referral system service for user acquisition
"""
Referral Service - User referral and rewards system.

Features:
- Referral code generation
- Referral tracking
- Reward distribution
- Multi-tier rewards
- Analytics
"""

import logging
import secrets
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from enum import Enum
from collections import defaultdict

logger = logging.getLogger(__name__)


class ReferralStatus(str, Enum):
    """Referral status."""
    PENDING = "pending"
    SIGNED_UP = "signed_up"
    VERIFIED = "verified"
    CONVERTED = "converted"
    EXPIRED = "expired"


class RewardType(str, Enum):
    """Reward type."""
    CASH = "cash"
    CREDITS = "credits"
    DISCOUNT = "discount"
    PREMIUM = "premium"


# Reward tiers
REWARD_TIERS = {
    1: {  # First 5 referrals
        "referrer_reward": 25.00,
        "referee_reward": 10.00,
        "reward_type": RewardType.CREDITS
    },
    2: {  # 6-10 referrals
        "referrer_reward": 50.00,
        "referee_reward": 15.00,
        "reward_type": RewardType.CREDITS
    },
    3: {  # 11-25 referrals
        "referrer_reward": 75.00,
        "referee_reward": 20.00,
        "reward_type": RewardType.CREDITS
    },
    4: {  # 26+ referrals
        "referrer_reward": 100.00,
        "referee_reward": 25.00,
        "reward_type": RewardType.CASH
    }
}


class ReferralService:
    """
    Referral system service.
    
    Manages user referrals, tracking, and rewards.
    """
    
    def __init__(self, db: Session):
        self.db = db
        # In-memory storage
        self._referral_codes: Dict[str, Dict[str, Any]] = {}
        self._referrals: Dict[str, Dict[str, Any]] = {}
        self._rewards: Dict[int, List[Dict[str, Any]]] = defaultdict(list)
        self._user_stats: Dict[int, Dict[str, Any]] = defaultdict(lambda: {
            "total_referrals": 0,
            "successful_referrals": 0,
            "pending_referrals": 0,
            "total_earned": 0.0
        })
    
    async def get_or_create_code(
        self,
        user_id: int,
        custom_code: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get or create referral code for user.
        
        Args:
            user_id: User ID
            custom_code: Optional custom code
            
        Returns:
            Referral code details
        """
        # Check if user already has a code
        for code, data in self._referral_codes.items():
            if data["user_id"] == user_id and data["active"]:
                return {
                    "code": code,
                    **data
                }
        
        # Generate new code
        if custom_code:
            code = custom_code.upper()
            if code in self._referral_codes:
                raise ValueError("Code already in use")
        else:
            code = self._generate_code()
        
        referral_code = {
            "user_id": user_id,
            "code": code,
            "active": True,
            "created_at": datetime.utcnow().isoformat(),
            "uses": 0,
            "max_uses": None,  # Unlimited
            "expires_at": None,  # Never expires
            "link": f"https://megilance.com/signup?ref={code}"
        }
        
        self._referral_codes[code] = referral_code
        
        return {"code": code, **referral_code}
    
    async def validate_code(
        self,
        code: str
    ) -> Optional[Dict[str, Any]]:
        """Validate a referral code."""
        code = code.upper()
        referral_code = self._referral_codes.get(code)
        
        if not referral_code:
            return None
        
        if not referral_code["active"]:
            return {"valid": False, "reason": "Code is inactive"}
        
        if referral_code.get("expires_at"):
            expires = datetime.fromisoformat(referral_code["expires_at"])
            if datetime.utcnow() > expires:
                return {"valid": False, "reason": "Code has expired"}
        
        if referral_code.get("max_uses"):
            if referral_code["uses"] >= referral_code["max_uses"]:
                return {"valid": False, "reason": "Code usage limit reached"}
        
        return {
            "valid": True,
            "referrer_id": referral_code["user_id"],
            "code": code
        }
    
    async def track_referral(
        self,
        referral_code: str,
        referee_id: int,
        referee_email: str
    ) -> Dict[str, Any]:
        """
        Track a new referral.
        
        Args:
            referral_code: The referral code used
            referee_id: New user's ID
            referee_email: New user's email
            
        Returns:
            Referral tracking details
        """
        code = referral_code.upper()
        code_data = self._referral_codes.get(code)
        
        if not code_data:
            raise ValueError("Invalid referral code")
        
        referral_id = f"ref_{secrets.token_urlsafe(12)}"
        
        referral = {
            "id": referral_id,
            "referrer_id": code_data["user_id"],
            "referee_id": referee_id,
            "referee_email": referee_email,
            "code": code,
            "status": ReferralStatus.SIGNED_UP.value,
            "created_at": datetime.utcnow().isoformat(),
            "converted_at": None,
            "reward_paid": False,
            "referrer_reward": None,
            "referee_reward": None
        }
        
        self._referrals[referral_id] = referral
        
        # Update code usage
        code_data["uses"] += 1
        
        # Update stats
        self._user_stats[code_data["user_id"]]["total_referrals"] += 1
        self._user_stats[code_data["user_id"]]["pending_referrals"] += 1
        
        logger.info(f"Tracked referral: {referral_id}")
        
        return referral
    
    async def update_referral_status(
        self,
        referral_id: str,
        status: ReferralStatus
    ) -> Optional[Dict[str, Any]]:
        """Update referral status and process rewards."""
        referral = self._referrals.get(referral_id)
        
        if not referral:
            return None
        
        old_status = referral["status"]
        referral["status"] = status.value
        
        # If converting to converted status, process rewards
        if status == ReferralStatus.CONVERTED and old_status != ReferralStatus.CONVERTED.value:
            await self._process_conversion(referral)
        
        return referral
    
    async def _process_conversion(
        self,
        referral: Dict[str, Any]
    ) -> None:
        """Process a successful conversion and pay rewards."""
        referrer_id = referral["referrer_id"]
        referee_id = referral["referee_id"]
        
        # Determine tier based on successful referrals
        successful = self._user_stats[referrer_id]["successful_referrals"]
        
        if successful < 5:
            tier = REWARD_TIERS[1]
        elif successful < 10:
            tier = REWARD_TIERS[2]
        elif successful < 25:
            tier = REWARD_TIERS[3]
        else:
            tier = REWARD_TIERS[4]
        
        # Create rewards
        referrer_reward = {
            "user_id": referrer_id,
            "amount": tier["referrer_reward"],
            "type": tier["reward_type"].value,
            "reason": "Referral conversion",
            "referral_id": referral["id"],
            "created_at": datetime.utcnow().isoformat()
        }
        
        referee_reward = {
            "user_id": referee_id,
            "amount": tier["referee_reward"],
            "type": tier["reward_type"].value,
            "reason": "Welcome bonus (referred)",
            "referral_id": referral["id"],
            "created_at": datetime.utcnow().isoformat()
        }
        
        self._rewards[referrer_id].append(referrer_reward)
        self._rewards[referee_id].append(referee_reward)
        
        # Update referral
        referral["converted_at"] = datetime.utcnow().isoformat()
        referral["reward_paid"] = True
        referral["referrer_reward"] = tier["referrer_reward"]
        referral["referee_reward"] = tier["referee_reward"]
        
        # Update stats
        self._user_stats[referrer_id]["successful_referrals"] += 1
        self._user_stats[referrer_id]["pending_referrals"] -= 1
        self._user_stats[referrer_id]["total_earned"] += tier["referrer_reward"]
        
        logger.info(f"Processed conversion for referral {referral['id']}")
    
    async def get_user_referrals(
        self,
        user_id: int,
        status: Optional[ReferralStatus] = None
    ) -> List[Dict[str, Any]]:
        """Get referrals made by a user."""
        referrals = [
            r for r in self._referrals.values()
            if r["referrer_id"] == user_id
        ]
        
        if status:
            referrals = [r for r in referrals if r["status"] == status.value]
        
        # Sort by date descending
        referrals.sort(key=lambda x: x["created_at"], reverse=True)
        
        return referrals
    
    async def get_user_rewards(
        self,
        user_id: int
    ) -> Dict[str, Any]:
        """Get user's referral rewards."""
        rewards = self._rewards.get(user_id, [])
        
        total = sum(r["amount"] for r in rewards)
        by_type = defaultdict(float)
        
        for r in rewards:
            by_type[r["type"]] += r["amount"]
        
        return {
            "rewards": rewards,
            "total_earned": total,
            "by_type": dict(by_type)
        }
    
    async def get_user_stats(
        self,
        user_id: int
    ) -> Dict[str, Any]:
        """Get user's referral statistics."""
        stats = dict(self._user_stats[user_id])
        
        # Get current tier
        successful = stats["successful_referrals"]
        if successful < 5:
            current_tier = 1
            next_tier_at = 5
        elif successful < 10:
            current_tier = 2
            next_tier_at = 10
        elif successful < 25:
            current_tier = 3
            next_tier_at = 25
        else:
            current_tier = 4
            next_tier_at = None
        
        stats["current_tier"] = current_tier
        stats["tier_rewards"] = REWARD_TIERS[current_tier]
        stats["next_tier_at"] = next_tier_at
        stats["referrals_to_next_tier"] = (
            next_tier_at - successful if next_tier_at else 0
        )
        
        return stats
    
    async def get_leaderboard(
        self,
        period: str = "all_time",
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get referral leaderboard."""
        # Sort users by successful referrals
        sorted_users = sorted(
            self._user_stats.items(),
            key=lambda x: x[1]["successful_referrals"],
            reverse=True
        )[:limit]
        
        leaderboard = []
        for rank, (user_id, stats) in enumerate(sorted_users, 1):
            if stats["successful_referrals"] > 0:
                leaderboard.append({
                    "rank": rank,
                    "user_id": user_id,
                    "successful_referrals": stats["successful_referrals"],
                    "total_earned": stats["total_earned"]
                })
        
        return leaderboard
    
    async def deactivate_code(
        self,
        user_id: int,
        code: str
    ) -> bool:
        """Deactivate a referral code."""
        code = code.upper()
        code_data = self._referral_codes.get(code)
        
        if not code_data or code_data["user_id"] != user_id:
            return False
        
        code_data["active"] = False
        code_data["deactivated_at"] = datetime.utcnow().isoformat()
        
        return True
    
    def _generate_code(self) -> str:
        """Generate unique referral code."""
        while True:
            code = secrets.token_urlsafe(6).upper()[:8]
            if code not in self._referral_codes:
                return code


# Singleton instance
_referral_service: Optional[ReferralService] = None


def get_referral_service(db: Session) -> ReferralService:
    """Get or create referral service instance."""
    global _referral_service
    if _referral_service is None:
        _referral_service = ReferralService(db)
    else:
        _referral_service.db = db
    return _referral_service
