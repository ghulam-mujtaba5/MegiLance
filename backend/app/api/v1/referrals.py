# @AI-HINT: Referral system API endpoints
"""
Referrals API - User referral and rewards endpoints.

Features:
- Get/create referral codes
- Track referrals
- View rewards and statistics
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel

from app.db.session import get_db
from app.core.security import get_current_active_user
from app.models.user import User
from app.services.referrals import ReferralService, ReferralStatus

router = APIRouter()


# Request/Response schemas
class CreateCodeRequest(BaseModel):
    """Create referral code request."""
    custom_code: Optional[str] = None


class ValidateCodeRequest(BaseModel):
    """Validate referral code request."""
    code: str


class TrackReferralRequest(BaseModel):
    """Track referral request."""
    code: str
    email: str


# API Endpoints
@router.get("/code")
async def get_my_referral_code(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get or create referral code for current user."""
    service = ReferralService(db)
    
    code = await service.get_or_create_code(current_user.id)
    
    return code


@router.post("/code")
async def create_referral_code(
    request: CreateCodeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a custom referral code."""
    service = ReferralService(db)
    
    try:
        code = await service.get_or_create_code(
            current_user.id,
            custom_code=request.custom_code
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    return code


@router.post("/validate")
async def validate_code(
    request: ValidateCodeRequest,
    db: Session = Depends(get_db)
):
    """Validate a referral code (public endpoint)."""
    service = ReferralService(db)
    
    result = await service.validate_code(request.code)
    
    if not result:
        raise HTTPException(status_code=404, detail="Invalid referral code")
    
    return result


@router.get("/my-referrals")
async def get_my_referrals(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get referrals made by current user."""
    service = ReferralService(db)
    
    ref_status = None
    if status:
        try:
            ref_status = ReferralStatus(status)
        except ValueError:
            pass
    
    referrals = await service.get_user_referrals(current_user.id, ref_status)
    
    return {
        "referrals": referrals,
        "count": len(referrals)
    }


@router.get("/stats")
async def get_my_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get user's referral statistics."""
    service = ReferralService(db)
    
    stats = await service.get_user_stats(current_user.id)
    
    return stats


@router.get("/rewards")
async def get_my_rewards(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get user's referral rewards."""
    service = ReferralService(db)
    
    rewards = await service.get_user_rewards(current_user.id)
    
    return rewards


@router.get("/leaderboard")
async def get_leaderboard(
    period: str = "all_time",
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get referral leaderboard."""
    if limit > 100:
        limit = 100
    
    service = ReferralService(db)
    
    leaderboard = await service.get_leaderboard(period, limit)
    
    # Get current user's rank
    user_stats = await service.get_user_stats(current_user.id)
    
    return {
        "leaderboard": leaderboard,
        "your_stats": user_stats
    }


@router.delete("/code/{code}")
async def deactivate_code(
    code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Deactivate a referral code."""
    service = ReferralService(db)
    
    success = await service.deactivate_code(current_user.id, code)
    
    if not success:
        raise HTTPException(status_code=404, detail="Code not found")
    
    return {"status": "deactivated", "code": code}


@router.get("/tiers")
async def get_reward_tiers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get reward tier information."""
    from app.services.referrals import REWARD_TIERS
    
    tiers = []
    for tier_num, tier_data in REWARD_TIERS.items():
        tiers.append({
            "tier": tier_num,
            "referrer_reward": tier_data["referrer_reward"],
            "referee_reward": tier_data["referee_reward"],
            "reward_type": tier_data["reward_type"].value,
            "referrals_required": {1: 0, 2: 5, 3: 10, 4: 25}[tier_num]
        })
    
    return {"tiers": tiers}


# Admin endpoints
@router.post("/admin/convert/{referral_id}")
async def admin_convert_referral(
    referral_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Manually convert a referral (admin only)."""
    if not hasattr(current_user, 'role') or current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    service = ReferralService(db)
    
    result = await service.update_referral_status(
        referral_id,
        ReferralStatus.CONVERTED
    )
    
    if not result:
        raise HTTPException(status_code=404, detail="Referral not found")
    
    return result
