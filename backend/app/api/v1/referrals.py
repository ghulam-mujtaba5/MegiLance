# @AI-HINT: Referral System API - Turso-only
"""
Referral System API

Handles:
- Sending referral invitations
- Tracking referral status
- Calculating rewards
- Referral stats
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from datetime import datetime
import uuid
import secrets

from app.db.turso_http import execute_query, parse_rows
from app.core.security import get_current_user_from_token

router = APIRouter()

def get_current_user(token_data = Depends(get_current_user_from_token)):
    """Get current user from token"""
    return token_data

def generate_referral_code():
    """Generate a unique referral code"""
    return secrets.token_urlsafe(8)

# ============ ENDPOINTS ============

@router.get("/stats", response_model=dict)
async def get_referral_stats(current_user = Depends(get_current_user)):
    """
    Get referral statistics for the current user.
    """
    user_id = current_user.get("user_id")
    
    # Get total referrals
    result = execute_query(
        "SELECT COUNT(*) as count FROM referrals WHERE referrer_id = ?",
        [user_id]
    )
    total_referrals = 0
    if result and result.get("rows"):
        rows = parse_rows(result)
        if rows:
            total_referrals = rows[0].get("count", 0)
            
    # Get total earnings (paid)
    result = execute_query(
        "SELECT SUM(reward_amount) as total FROM referrals WHERE referrer_id = ? AND is_paid = 1",
        [user_id]
    )
    total_earnings = 0.0
    if result and result.get("rows"):
        rows = parse_rows(result)
        if rows and rows[0].get("total"):
            total_earnings = float(rows[0].get("total"))
            
    # Get pending earnings (completed but not paid)
    result = execute_query(
        "SELECT SUM(reward_amount) as total FROM referrals WHERE referrer_id = ? AND status = 'completed' AND is_paid = 0",
        [user_id]
    )
    pending_earnings = 0.0
    if result and result.get("rows"):
        rows = parse_rows(result)
        if rows and rows[0].get("total"):
            pending_earnings = float(rows[0].get("total"))
            
    return {
        "total_referrals": total_referrals,
        "total_earnings": total_earnings,
        "pending_earnings": pending_earnings,
        "referral_link": f"https://megilance.com/signup?ref={user_id}" # Simple ID-based link for now
    }

@router.get("/", response_model=List[dict])
async def list_referrals(
    current_user = Depends(get_current_user)
):
    """
    List all referrals sent by the current user.
    """
    user_id = current_user.get("user_id")
    
    result = execute_query(
        """SELECT id, referred_email, status, reward_amount, is_paid, created_at, completed_at
           FROM referrals
           WHERE referrer_id = ?
           ORDER BY created_at DESC""",
        [user_id]
    )
    
    if not result:
        return []
        
    return parse_rows(result)

@router.post("/invite", status_code=status.HTTP_201_CREATED)
async def invite_friend(
    invite_data: dict,
    background_tasks: BackgroundTasks,
    current_user = Depends(get_current_user)
):
    """
    Invite a friend via email.
    """
    user_id = current_user.get("user_id")
    email = invite_data.get("email")
    
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
        
    # Check if already invited
    result = execute_query(
        "SELECT id FROM referrals WHERE referrer_id = ? AND referred_email = ?",
        [user_id, email]
    )
    if result and result.get("rows"):
        raise HTTPException(status_code=400, detail="You have already invited this email")
        
    # Check if user already exists
    result = execute_query(
        "SELECT id FROM users WHERE email = ?",
        [email]
    )
    if result and result.get("rows"):
        raise HTTPException(status_code=400, detail="User is already a member of MegiLance")
        
    # Create referral record
    code = generate_referral_code()
    now = datetime.utcnow().isoformat()
    
    execute_query(
        """INSERT INTO referrals (referrer_id, referred_email, referral_code, status, created_at, updated_at)
           VALUES (?, ?, ?, 'pending', ?, ?)""",
        [user_id, email, code, now, now]
    )
    
    # Mock sending email
    # background_tasks.add_task(send_referral_email, email, code, current_user)
    
    return {"message": "Invitation sent successfully", "email": email}
