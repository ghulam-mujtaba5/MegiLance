# @AI-HINT: Social login OAuth2 API endpoints
"""
Social Login API - OAuth2 authentication endpoints.

Features:
- Get available providers
- Start OAuth flow
- Complete OAuth flow
- Manage linked accounts
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel

from app.db.session import get_db
from app.core.security import get_current_active_user, get_current_user_optional
from app.services.social_login import get_social_login_service, SocialProvider

router = APIRouter(prefix="/social-auth", tags=["social-auth"])


# Request/Response Models
class StartOAuthRequest(BaseModel):
    provider: SocialProvider
    redirect_uri: str


class CompleteOAuthRequest(BaseModel):
    code: str
    state: str


class SyncProfileRequest(BaseModel):
    provider: SocialProvider
    fields: Optional[List[str]] = None


# Public Endpoints
@router.get("/providers")
async def get_available_providers(
    db: Session = Depends(get_db)
):
    """Get list of available social login providers."""
    service = get_social_login_service(db)
    providers = await service.get_available_providers()
    return {"providers": providers}


@router.post("/start")
async def start_oauth(
    request: StartOAuthRequest,
    db: Session = Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """Start OAuth flow - returns authorization URL."""
    service = get_social_login_service(db)
    
    user_id = current_user["id"] if current_user else None
    
    result = await service.start_oauth(
        provider=request.provider,
        redirect_uri=request.redirect_uri,
        user_id=user_id
    )
    
    return result


@router.post("/complete")
async def complete_oauth(
    request: CompleteOAuthRequest,
    db: Session = Depends(get_db)
):
    """Complete OAuth flow - exchange code for tokens."""
    service = get_social_login_service(db)
    
    result = await service.complete_oauth(
        code=request.code,
        state=request.state
    )
    
    if not result.get("success"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("error", "OAuth failed")
        )
    
    return result


# Authenticated Endpoints
@router.get("/linked-accounts")
async def get_linked_accounts(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Get user's linked social accounts."""
    service = get_social_login_service(db)
    accounts = await service.get_linked_accounts(current_user["id"])
    return {"accounts": accounts}


@router.delete("/linked-accounts/{provider}")
async def unlink_account(
    provider: SocialProvider,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Unlink a social account."""
    service = get_social_login_service(db)
    
    result = await service.unlink_account(
        user_id=current_user["id"],
        provider=provider
    )
    
    if not result.get("success"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot unlink account. Ensure you have a password or another linked account."
        )
    
    return result


@router.post("/sync-profile")
async def sync_profile_from_social(
    request: SyncProfileRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Sync profile data from a linked social account."""
    service = get_social_login_service(db)
    
    result = await service.sync_profile_from_social(
        user_id=current_user["id"],
        provider=request.provider,
        fields=request.fields
    )
    
    return result
