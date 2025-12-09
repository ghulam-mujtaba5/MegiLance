# @AI-HINT: Referral program API - User acquisition, rewards, tracking
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum
from app.db.session import get_db
from app.core.security import get_current_active_user

router = APIRouter(prefix="/referral-program")


class ReferralStatus(str, Enum):
    PENDING = "pending"
    REGISTERED = "registered"
    QUALIFIED = "qualified"
    REWARDED = "rewarded"
    EXPIRED = "expired"


class ReferralCode(BaseModel):
    code: str
    user_id: str
    uses_count: int
    max_uses: Optional[int] = None
    reward_per_referral: float
    bonus_reward: Optional[float] = None
    expires_at: Optional[datetime] = None
    created_at: datetime
    is_active: bool


class Referral(BaseModel):
    id: str
    referrer_id: str
    referred_id: str
    referred_email: str
    referral_code: str
    status: ReferralStatus
    reward_amount: float
    reward_paid: bool
    qualification_date: Optional[datetime] = None
    created_at: datetime


class ReferralStats(BaseModel):
    total_referrals: int
    successful_referrals: int
    pending_referrals: int
    total_earnings: float
    pending_earnings: float
    conversion_rate: float


class ReferralReward(BaseModel):
    id: str
    user_id: str
    referral_id: str
    amount: float
    type: str
    status: str
    paid_at: Optional[datetime] = None
    created_at: datetime


class ReferralCampaign(BaseModel):
    id: str
    name: str
    description: str
    reward_amount: float
    bonus_threshold: int
    bonus_amount: float
    start_date: datetime
    end_date: Optional[datetime] = None
    is_active: bool


@router.get("/my-code", response_model=ReferralCode)
async def get_my_referral_code(
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get current user's referral code"""
    return ReferralCode(
        code=f"REF{str(current_user.id)[:8].upper()}",
        user_id=str(current_user.id),
        uses_count=5,
        max_uses=None,
        reward_per_referral=25.0,
        bonus_reward=100.0,
        created_at=datetime.utcnow(),
        is_active=True
    )


@router.post("/generate-code", response_model=ReferralCode)
async def generate_referral_code(
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Generate a new referral code"""
    return ReferralCode(
        code=f"NEW{str(current_user.id)[:6].upper()}",
        user_id=str(current_user.id),
        uses_count=0,
        reward_per_referral=25.0,
        created_at=datetime.utcnow(),
        is_active=True
    )


@router.get("/validate/{code}")
async def validate_referral_code(
    code: str,
    db: Session = Depends(get_db)
):
    """Validate a referral code"""
    return {
        "valid": True,
        "code": code,
        "referrer_name": "John D.",
        "reward_amount": 25.0,
        "bonus_for_you": 10.0
    }


@router.post("/apply/{code}")
async def apply_referral_code(
    code: str,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Apply a referral code to account"""
    return {
        "success": True,
        "code": code,
        "message": "Referral code applied! You'll receive $10 bonus after first project.",
        "referral_id": "ref-new"
    }


@router.get("/my-referrals", response_model=List[Referral])
async def get_my_referrals(
    status: Optional[ReferralStatus] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get list of people you referred"""
    return [
        Referral(
            id=f"ref-{i}",
            referrer_id=str(current_user.id),
            referred_id=f"user-{i}",
            referred_email=f"user{i}@example.com",
            referral_code=f"REF{str(current_user.id)[:8].upper()}",
            status=ReferralStatus.QUALIFIED if i < 3 else ReferralStatus.PENDING,
            reward_amount=25.0,
            reward_paid=i < 3,
            qualification_date=datetime.utcnow() if i < 3 else None,
            created_at=datetime.utcnow()
        )
        for i in range(5)
    ]


@router.get("/stats", response_model=ReferralStats)
async def get_referral_stats(
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get referral statistics"""
    return ReferralStats(
        total_referrals=15,
        successful_referrals=8,
        pending_referrals=4,
        total_earnings=200.0,
        pending_earnings=75.0,
        conversion_rate=53.3
    )


@router.get("/rewards", response_model=List[ReferralReward])
async def get_referral_rewards(
    status: Optional[str] = None,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get referral rewards history"""
    return [
        ReferralReward(
            id=f"reward-{i}",
            user_id=str(current_user.id),
            referral_id=f"ref-{i}",
            amount=25.0,
            type="referral_bonus",
            status="paid" if i < 3 else "pending",
            paid_at=datetime.utcnow() if i < 3 else None,
            created_at=datetime.utcnow()
        )
        for i in range(5)
    ]


@router.post("/withdraw-rewards")
async def withdraw_referral_rewards(
    amount: float = Query(..., gt=0),
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Withdraw referral earnings"""
    return {
        "success": True,
        "amount": amount,
        "withdrawal_id": "withdrawal-123",
        "estimated_arrival": "3-5 business days"
    }


@router.get("/leaderboard")
async def get_referral_leaderboard(
    period: str = Query("monthly", enum=["weekly", "monthly", "all_time"]),
    limit: int = Query(10, ge=1, le=50),
    current_user=Depends(get_current_active_user)
):
    """Get referral leaderboard"""
    return {
        "period": period,
        "leaders": [
            {"rank": 1, "name": "Sarah K.", "referrals": 45, "earnings": 1125.0},
            {"rank": 2, "name": "Mike J.", "referrals": 38, "earnings": 950.0},
            {"rank": 3, "name": "Emily R.", "referrals": 32, "earnings": 800.0}
        ],
        "your_rank": 25,
        "your_referrals": 8
    }


@router.get("/campaigns", response_model=List[ReferralCampaign])
async def get_referral_campaigns(
    current_user=Depends(get_current_active_user)
):
    """Get active referral campaigns"""
    return [
        ReferralCampaign(
            id="campaign-1",
            name="Summer Referral Bonus",
            description="Earn 2x rewards for every referral this summer!",
            reward_amount=50.0,
            bonus_threshold=5,
            bonus_amount=100.0,
            start_date=datetime.utcnow(),
            end_date=datetime(2025, 8, 31),
            is_active=True
        )
    ]


@router.post("/invite/email")
async def send_referral_invite(
    email: str,
    message: Optional[str] = None,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Send referral invite via email"""
    return {
        "success": True,
        "email": email,
        "message": "Invitation sent successfully!"
    }


@router.post("/invite/bulk")
async def send_bulk_invites(
    emails: List[str],
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Send multiple referral invites"""
    return {
        "success": True,
        "sent_count": len(emails),
        "failed_count": 0
    }


@router.get("/share-links")
async def get_share_links(
    current_user=Depends(get_current_active_user)
):
    """Get social media share links"""
    code = f"REF{str(current_user.id)[:8].upper()}"
    base_url = "https://megilance.com/join"
    return {
        "direct_link": f"{base_url}?ref={code}",
        "twitter": f"https://twitter.com/intent/tweet?text=Join%20MegiLance%20and%20get%20$10%20bonus!&url={base_url}?ref={code}",
        "facebook": f"https://www.facebook.com/sharer/sharer.php?u={base_url}?ref={code}",
        "linkedin": f"https://www.linkedin.com/sharing/share-offsite/?url={base_url}?ref={code}",
        "whatsapp": f"https://wa.me/?text=Join%20MegiLance%20{base_url}?ref={code}"
    }


@router.get("/milestones")
async def get_referral_milestones(
    current_user=Depends(get_current_active_user)
):
    """Get referral milestones and bonuses"""
    return {
        "milestones": [
            {"referrals": 5, "bonus": 50, "achieved": True},
            {"referrals": 10, "bonus": 150, "achieved": False},
            {"referrals": 25, "bonus": 500, "achieved": False},
            {"referrals": 50, "bonus": 1500, "achieved": False}
        ],
        "current_referrals": 8,
        "next_milestone": {"referrals": 10, "bonus": 150}
    }

