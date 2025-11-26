# @AI-HINT: Two-Factor Authentication API endpoints
"""
Two-Factor Authentication API - 2FA management endpoints.

Features:
- Setup TOTP authenticator
- Verify 2FA codes
- Manage backup codes
- Trusted device management
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel

from app.db.session import get_db
from app.core.security import get_current_active_user
from app.models.user import User
from app.services.two_factor import get_two_factor_service, TwoFactorMethod

router = APIRouter(prefix="/2fa", tags=["two-factor-auth"])


# Request/Response Models
class VerifyCodeRequest(BaseModel):
    code: str
    method: Optional[TwoFactorMethod] = None


class TrustDeviceRequest(BaseModel):
    device_name: str
    device_fingerprint: str


class CheckDeviceRequest(BaseModel):
    device_fingerprint: str


# Endpoints
@router.get("/status")
async def get_2fa_status(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """Get current 2FA status."""
    service = get_two_factor_service(db)
    status = await service.get_2fa_status(current_user["id"])
    return status


@router.post("/totp/setup")
async def start_totp_setup(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """Start TOTP authenticator setup. Returns QR code data."""
    service = get_two_factor_service(db)
    
    result = await service.start_totp_setup(
        user_id=current_user["id"],
        email=current_user["email"]
    )
    
    return {
        "message": "Scan the QR code with your authenticator app",
        **result
    }


@router.post("/totp/verify-setup")
async def verify_totp_setup(
    request: VerifyCodeRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """Verify TOTP setup with a code from authenticator app."""
    service = get_two_factor_service(db)
    
    result = await service.verify_totp_setup(
        user_id=current_user["id"],
        code=request.code
    )
    
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("error", "Verification failed")
        )
    
    return result


@router.post("/verify")
async def verify_2fa_code(
    request: VerifyCodeRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """Verify a 2FA code (TOTP or backup code)."""
    service = get_two_factor_service(db)
    
    result = await service.verify_code(
        user_id=current_user["id"],
        code=request.code,
        method=request.method
    )
    
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=result.get("error", "Invalid code")
        )
    
    return result


@router.post("/disable")
async def disable_2fa(
    request: VerifyCodeRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """Disable 2FA (requires valid code)."""
    service = get_two_factor_service(db)
    
    result = await service.disable_2fa(
        user_id=current_user["id"],
        code=request.code
    )
    
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("error", "Failed to disable 2FA")
        )
    
    return result


@router.post("/backup-codes/regenerate")
async def regenerate_backup_codes(
    request: VerifyCodeRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """Regenerate backup codes (requires valid TOTP code)."""
    service = get_two_factor_service(db)
    
    result = await service.regenerate_backup_codes(
        user_id=current_user["id"],
        code=request.code
    )
    
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("error", "Failed to regenerate codes")
        )
    
    return result


# Trusted Devices
@router.get("/devices")
async def get_trusted_devices(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """Get all trusted devices."""
    service = get_two_factor_service(db)
    devices = await service.get_trusted_devices(current_user["id"])
    return {"devices": devices}


@router.post("/devices/trust")
async def trust_device(
    request: TrustDeviceRequest,
    req: Request,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """Add current device as trusted."""
    service = get_two_factor_service(db)
    
    # Get request info
    user_agent = req.headers.get("user-agent")
    ip_address = req.client.host if req.client else None
    
    device = await service.trust_device(
        user_id=current_user["id"],
        device_fingerprint=request.device_fingerprint,
        device_name=request.device_name,
        user_agent=user_agent,
        ip_address=ip_address
    )
    
    return {"device": device, "message": "Device trusted"}


@router.post("/devices/check")
async def check_device_trusted(
    request: CheckDeviceRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """Check if a device is trusted."""
    service = get_two_factor_service(db)
    
    is_trusted = await service.is_trusted_device(
        user_id=current_user["id"],
        device_fingerprint=request.device_fingerprint
    )
    
    return {"trusted": is_trusted}


@router.delete("/devices/{device_id}")
async def revoke_device(
    device_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """Revoke a trusted device."""
    service = get_two_factor_service(db)
    
    success = await service.revoke_trusted_device(
        user_id=current_user["id"],
        device_id=device_id
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device not found"
        )
    
    return {"message": "Device revoked"}


@router.delete("/devices")
async def revoke_all_devices(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """Revoke all trusted devices."""
    service = get_two_factor_service(db)
    
    count = await service.revoke_all_devices(current_user["id"])
    
    return {"message": f"Revoked {count} devices"}
