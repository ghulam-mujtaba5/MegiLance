# @AI-HINT: Pydantic schemas for Two-Factor Authentication API requests and responses
# Used for 2FA setup, verification, and management endpoints

from pydantic import BaseModel, Field
from typing import List, Optional


class TwoFactorSetupResponse(BaseModel):
    """Response when user initiates 2FA setup"""
    secret: str = Field(..., description="TOTP secret key (base32)")
    qr_code: str = Field(..., description="Base64-encoded QR code image")
    backup_codes: List[str] = Field(..., description="One-time backup recovery codes (save these!)")
    provisioning_uri: str = Field(..., description="otpauth:// URI for manual entry")
    
    class Config:
        json_schema_extra = {
            "example": {
                "secret": "JBSWY3DPEHPK3PXP",
                "qr_code": "data:image/png;base64,iVBORw0KGgoAAAANS...",
                "backup_codes": [
                    "A1B2C3D4",
                    "E5F6G7H8",
                    "I9J0K1L2"
                ],
                "provisioning_uri": "otpauth://totp/MegiLance:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=MegiLance"
            }
        }


class TwoFactorVerifyRequest(BaseModel):
    """Request to verify 2FA setup with a token"""
    token: str = Field(..., min_length=6, max_length=6, description="6-digit TOTP code from authenticator app")
    
    class Config:
        json_schema_extra = {
            "example": {
                "token": "123456"
            }
        }


class TwoFactorLoginRequest(BaseModel):
    """Request to complete login with 2FA token"""
    token: str = Field(..., description="6-digit TOTP code or 8-character backup code")
    is_backup_code: bool = Field(default=False, description="Set to true if using backup code")
    
    class Config:
        json_schema_extra = {
            "example": {
                "token": "123456",
                "is_backup_code": False
            }
        }


class TwoFactorStatusResponse(BaseModel):
    """Response showing user's 2FA status"""
    enabled: bool = Field(..., description="Whether 2FA is currently enabled")
    has_backup_codes: bool = Field(..., description="Whether user has backup codes stored")
    backup_codes_remaining: Optional[int] = Field(None, description="Number of unused backup codes")
    
    class Config:
        json_schema_extra = {
            "example": {
                "enabled": True,
                "has_backup_codes": True,
                "backup_codes_remaining": 8
            }
        }


class TwoFactorDisableRequest(BaseModel):
    """Request to disable 2FA (requires password confirmation)"""
    password: str = Field(..., min_length=8, description="Current password for verification")
    
    class Config:
        json_schema_extra = {
            "example": {
                "password": "MySecurePassword123!"
            }
        }


class TwoFactorRegenerateBackupCodesResponse(BaseModel):
    """Response when regenerating backup codes"""
    backup_codes: List[str] = Field(..., description="New backup codes (save these!)")
    message: str = Field(..., description="Warning message about old codes being invalidated")
    
    class Config:
        json_schema_extra = {
            "example": {
                "backup_codes": [
                    "A1B2C3D4",
                    "E5F6G7H8",
                    "I9J0K1L2"
                ],
                "message": "Your old backup codes have been invalidated. Save these new codes in a secure location."
            }
        }
