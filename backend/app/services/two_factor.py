# @AI-HINT: Two-Factor Authentication service with TOTP and backup codes
"""
Two-Factor Authentication Service - Enhanced security with 2FA.

Features:
- TOTP (Time-based One-Time Password)
- Backup codes
- Device trust management
- Recovery options
"""

from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from enum import Enum
from pydantic import BaseModel
import secrets
import hashlib
import base64
import hmac
import struct
import time


class TwoFactorMethod(str, Enum):
    TOTP = "totp"
    SMS = "sms"
    EMAIL = "email"
    BACKUP_CODE = "backup_code"


class TwoFactorStatus(str, Enum):
    DISABLED = "disabled"
    PENDING_SETUP = "pending_setup"
    ENABLED = "enabled"


class TrustedDevice(BaseModel):
    """Trusted device record."""
    id: str
    user_id: str
    device_name: str
    device_fingerprint: str
    user_agent: Optional[str] = None
    ip_address: Optional[str] = None
    last_used: datetime
    trusted_until: datetime
    created_at: datetime


class TwoFactorConfig(BaseModel):
    """User's 2FA configuration."""
    user_id: str
    status: TwoFactorStatus = TwoFactorStatus.DISABLED
    primary_method: Optional[TwoFactorMethod] = None
    totp_secret: Optional[str] = None
    totp_verified: bool = False
    backup_codes: List[str] = []
    backup_codes_remaining: int = 0
    phone_number: Optional[str] = None  # For SMS
    recovery_email: Optional[str] = None
    trusted_devices: List[str] = []  # Device IDs
    last_verified: Optional[datetime] = None
    setup_started: Optional[datetime] = None
    enabled_at: Optional[datetime] = None


class TwoFactorService:
    """Service for Two-Factor Authentication."""
    
    def __init__(self, db: Session):
        self.db = db
        self._user_configs: Dict[str, TwoFactorConfig] = {}
        self._trusted_devices: Dict[str, TrustedDevice] = {}
        self._pending_verifications: Dict[str, Dict[str, Any]] = {}
        self.totp_digits = 6
        self.totp_interval = 30
        self.backup_codes_count = 10
        self.device_trust_days = 30
    
    def _generate_secret(self) -> str:
        """Generate a TOTP secret key."""
        return base64.b32encode(secrets.token_bytes(20)).decode('utf-8')
    
    def _get_totp_code(self, secret: str, timestamp: Optional[int] = None) -> str:
        """Generate TOTP code for given secret and time."""
        if timestamp is None:
            timestamp = int(time.time())
        
        counter = timestamp // self.totp_interval
        
        # Decode secret
        key = base64.b32decode(secret.upper())
        
        # Generate HMAC-SHA1
        msg = struct.pack('>Q', counter)
        h = hmac.new(key, msg, hashlib.sha1).digest()
        
        # Dynamic truncation
        offset = h[-1] & 0x0f
        code = struct.unpack('>I', h[offset:offset + 4])[0] & 0x7fffffff
        
        # Get last N digits
        return str(code % (10 ** self.totp_digits)).zfill(self.totp_digits)
    
    def _verify_totp(self, secret: str, code: str, window: int = 1) -> bool:
        """Verify TOTP code with time window tolerance."""
        current_time = int(time.time())
        
        for offset in range(-window, window + 1):
            check_time = current_time + (offset * self.totp_interval)
            expected = self._get_totp_code(secret, check_time)
            if code == expected:
                return True
        
        return False
    
    def _generate_backup_codes(self) -> List[str]:
        """Generate backup codes."""
        codes = []
        for _ in range(self.backup_codes_count):
            code = secrets.token_hex(4).upper()  # 8 character codes
            codes.append(f"{code[:4]}-{code[4:]}")
        return codes
    
    def _hash_backup_code(self, code: str) -> str:
        """Hash a backup code for storage."""
        return hashlib.sha256(code.encode()).hexdigest()
    
    async def get_config(self, user_id: str) -> TwoFactorConfig:
        """Get user's 2FA configuration."""
        if user_id not in self._user_configs:
            self._user_configs[user_id] = TwoFactorConfig(user_id=user_id)
        return self._user_configs[user_id]
    
    async def start_totp_setup(self, user_id: str, email: str) -> Dict[str, Any]:
        """Start TOTP setup process."""
        config = await self.get_config(user_id)
        
        # Generate new secret
        secret = self._generate_secret()
        config.totp_secret = secret
        config.status = TwoFactorStatus.PENDING_SETUP
        config.setup_started = datetime.utcnow()
        
        # Generate provisioning URI for QR code
        issuer = "MegiLance"
        uri = f"otpauth://totp/{issuer}:{email}?secret={secret}&issuer={issuer}&digits={self.totp_digits}&period={self.totp_interval}"
        
        return {
            "secret": secret,
            "provisioning_uri": uri,
            "qr_code_data": uri,  # Can be used to generate QR code
            "digits": self.totp_digits,
            "interval": self.totp_interval,
            "setup_started": config.setup_started.isoformat()
        }
    
    async def verify_totp_setup(
        self,
        user_id: str,
        code: str
    ) -> Dict[str, Any]:
        """Verify TOTP setup with user's code."""
        config = await self.get_config(user_id)
        
        if config.status != TwoFactorStatus.PENDING_SETUP or not config.totp_secret:
            return {"success": False, "error": "No pending TOTP setup"}
        
        if not self._verify_totp(config.totp_secret, code):
            return {"success": False, "error": "Invalid code"}
        
        # Generate backup codes
        backup_codes = self._generate_backup_codes()
        hashed_codes = [self._hash_backup_code(c) for c in backup_codes]
        
        config.totp_verified = True
        config.status = TwoFactorStatus.ENABLED
        config.primary_method = TwoFactorMethod.TOTP
        config.backup_codes = hashed_codes
        config.backup_codes_remaining = len(backup_codes)
        config.enabled_at = datetime.utcnow()
        
        return {
            "success": True,
            "backup_codes": backup_codes,  # Show only once!
            "message": "2FA enabled successfully. Save your backup codes!"
        }
    
    async def verify_code(
        self,
        user_id: str,
        code: str,
        method: Optional[TwoFactorMethod] = None
    ) -> Dict[str, Any]:
        """Verify a 2FA code."""
        config = await self.get_config(user_id)
        
        if config.status != TwoFactorStatus.ENABLED:
            return {"success": False, "error": "2FA not enabled"}
        
        # Determine method
        if method is None:
            method = config.primary_method or TwoFactorMethod.TOTP
        
        if method == TwoFactorMethod.TOTP:
            if not config.totp_secret:
                return {"success": False, "error": "TOTP not configured"}
            
            if self._verify_totp(config.totp_secret, code):
                config.last_verified = datetime.utcnow()
                return {"success": True, "method": "totp"}
        
        elif method == TwoFactorMethod.BACKUP_CODE:
            # Check backup codes
            code_hash = self._hash_backup_code(code)
            if code_hash in config.backup_codes:
                config.backup_codes.remove(code_hash)
                config.backup_codes_remaining -= 1
                config.last_verified = datetime.utcnow()
                return {
                    "success": True,
                    "method": "backup_code",
                    "codes_remaining": config.backup_codes_remaining
                }
        
        return {"success": False, "error": "Invalid code"}
    
    async def disable_2fa(
        self,
        user_id: str,
        code: str
    ) -> Dict[str, Any]:
        """Disable 2FA (requires valid code)."""
        # First verify the code
        verification = await self.verify_code(user_id, code)
        if not verification["success"]:
            return {"success": False, "error": "Invalid code"}
        
        config = await self.get_config(user_id)
        
        config.status = TwoFactorStatus.DISABLED
        config.totp_secret = None
        config.totp_verified = False
        config.backup_codes = []
        config.backup_codes_remaining = 0
        config.primary_method = None
        config.enabled_at = None
        
        return {"success": True, "message": "2FA disabled"}
    
    async def regenerate_backup_codes(
        self,
        user_id: str,
        code: str
    ) -> Dict[str, Any]:
        """Regenerate backup codes (requires valid TOTP code)."""
        config = await self.get_config(user_id)
        
        if config.status != TwoFactorStatus.ENABLED:
            return {"success": False, "error": "2FA not enabled"}
        
        # Verify with TOTP only (not backup code)
        if not config.totp_secret or not self._verify_totp(config.totp_secret, code):
            return {"success": False, "error": "Invalid code"}
        
        # Generate new backup codes
        backup_codes = self._generate_backup_codes()
        hashed_codes = [self._hash_backup_code(c) for c in backup_codes]
        
        config.backup_codes = hashed_codes
        config.backup_codes_remaining = len(backup_codes)
        
        return {
            "success": True,
            "backup_codes": backup_codes,
            "message": "New backup codes generated. Save them securely!"
        }
    
    async def trust_device(
        self,
        user_id: str,
        device_fingerprint: str,
        device_name: str,
        user_agent: Optional[str] = None,
        ip_address: Optional[str] = None
    ) -> TrustedDevice:
        """Add a trusted device."""
        import uuid
        device_id = f"dev_{uuid.uuid4().hex[:12]}"
        
        device = TrustedDevice(
            id=device_id,
            user_id=user_id,
            device_name=device_name,
            device_fingerprint=device_fingerprint,
            user_agent=user_agent,
            ip_address=ip_address,
            last_used=datetime.utcnow(),
            trusted_until=datetime.utcnow() + timedelta(days=self.device_trust_days),
            created_at=datetime.utcnow()
        )
        
        self._trusted_devices[device_id] = device
        
        # Add to user's config
        config = await self.get_config(user_id)
        config.trusted_devices.append(device_id)
        
        return device
    
    async def is_trusted_device(
        self,
        user_id: str,
        device_fingerprint: str
    ) -> bool:
        """Check if device is trusted."""
        config = await self.get_config(user_id)
        
        for device_id in config.trusted_devices:
            device = self._trusted_devices.get(device_id)
            if device and device.device_fingerprint == device_fingerprint:
                # Check if still valid
                if datetime.utcnow() < device.trusted_until:
                    device.last_used = datetime.utcnow()
                    return True
        
        return False
    
    async def get_trusted_devices(self, user_id: str) -> List[TrustedDevice]:
        """Get all trusted devices for user."""
        config = await self.get_config(user_id)
        
        devices = []
        for device_id in config.trusted_devices:
            device = self._trusted_devices.get(device_id)
            if device:
                devices.append(device)
        
        return devices
    
    async def revoke_trusted_device(
        self,
        user_id: str,
        device_id: str
    ) -> bool:
        """Revoke a trusted device."""
        config = await self.get_config(user_id)
        
        if device_id not in config.trusted_devices:
            return False
        
        config.trusted_devices.remove(device_id)
        
        if device_id in self._trusted_devices:
            del self._trusted_devices[device_id]
        
        return True
    
    async def revoke_all_devices(self, user_id: str) -> int:
        """Revoke all trusted devices."""
        config = await self.get_config(user_id)
        
        count = len(config.trusted_devices)
        
        for device_id in config.trusted_devices:
            if device_id in self._trusted_devices:
                del self._trusted_devices[device_id]
        
        config.trusted_devices = []
        
        return count
    
    async def get_2fa_status(self, user_id: str) -> Dict[str, Any]:
        """Get 2FA status summary."""
        config = await self.get_config(user_id)
        
        return {
            "enabled": config.status == TwoFactorStatus.ENABLED,
            "status": config.status.value,
            "primary_method": config.primary_method.value if config.primary_method else None,
            "backup_codes_remaining": config.backup_codes_remaining,
            "trusted_devices_count": len(config.trusted_devices),
            "last_verified": config.last_verified.isoformat() if config.last_verified else None,
            "enabled_at": config.enabled_at.isoformat() if config.enabled_at else None
        }


def get_two_factor_service(db: Session) -> TwoFactorService:
    """Get 2FA service instance."""
    return TwoFactorService(db)
