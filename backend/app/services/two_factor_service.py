# @AI-HINT: Two-Factor Authentication service for generating TOTP secrets, QR codes, and backup codes
# Handles all 2FA operations including setup, verification, and recovery

import pyotp
import qrcode
import io
import base64
import secrets
import hashlib
from typing import List, Tuple, Optional
from sqlalchemy.orm import Session
from ..models.user import User
import json


class TwoFactorService:
    """Service for handling Two-Factor Authentication operations"""
    
    def __init__(self):
        self.app_name = "MegiLance"
    
    def generate_secret(self) -> str:
        """
        Generate a new TOTP secret for a user
        
        Returns:
            str: Base32-encoded secret key
        """
        return pyotp.random_base32()
    
    def generate_provisioning_uri(self, user_email: str, secret: str) -> str:
        """
        Generate provisioning URI for authenticator apps
        
        Args:
            user_email: User's email address
            secret: TOTP secret key
        
        Returns:
            str: Provisioning URI (otpauth://totp/...)
        """
        totp = pyotp.TOTP(secret)
        return totp.provisioning_uri(
            name=user_email,
            issuer_name=self.app_name
        )
    
    def generate_qr_code(self, provisioning_uri: str) -> str:
        """
        Generate QR code image from provisioning URI
        
        Args:
            provisioning_uri: OTP provisioning URI
        
        Returns:
            str: Base64-encoded QR code image (data:image/png;base64,...)
        """
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(provisioning_uri)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Convert to base64 string
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        buffer.seek(0)
        img_base64 = base64.b64encode(buffer.getvalue()).decode()
        
        return f"data:image/png;base64,{img_base64}"
    
    def verify_token(self, secret: str, token: str) -> bool:
        """
        Verify a TOTP token against a secret
        
        Args:
            secret: User's TOTP secret
            token: 6-digit code from authenticator app
        
        Returns:
            bool: True if token is valid
        """
        totp = pyotp.TOTP(secret)
        # Allow 30-second window for time sync issues
        return totp.verify(token, valid_window=1)
    
    def generate_backup_codes(self, count: int = 10) -> Tuple[List[str], List[str]]:
        """
        Generate backup recovery codes
        
        Args:
            count: Number of backup codes to generate (default 10)
        
        Returns:
            Tuple[List[str], List[str]]: (plain_codes, hashed_codes)
                - plain_codes: List of codes to show user (only shown once)
                - hashed_codes: List of hashed codes to store in database
        """
        plain_codes = []
        hashed_codes = []
        
        for _ in range(count):
            # Generate 8-character alphanumeric code
            code = secrets.token_hex(4).upper()  # 8 hex chars
            plain_codes.append(code)
            
            # Hash the code for storage
            hashed = hashlib.sha256(code.encode()).hexdigest()
            hashed_codes.append(hashed)
        
        return plain_codes, hashed_codes
    
    def verify_backup_code(self, stored_codes_json: str, input_code: str) -> Tuple[bool, Optional[str]]:
        """
        Verify a backup code and remove it from the list
        
        Args:
            stored_codes_json: JSON array of hashed backup codes from database
            input_code: Backup code entered by user
        
        Returns:
            Tuple[bool, Optional[str]]: (is_valid, updated_codes_json)
                - is_valid: True if code matched and was valid
                - updated_codes_json: New JSON string with code removed (or None if invalid)
        """
        try:
            stored_codes = json.loads(stored_codes_json)
        except (json.JSONDecodeError, TypeError):
            return False, None
        
        # Hash the input code
        input_hash = hashlib.sha256(input_code.upper().encode()).hexdigest()
        
        # Check if code exists
        if input_hash in stored_codes:
            # Remove the used code
            stored_codes.remove(input_hash)
            updated_json = json.dumps(stored_codes)
            return True, updated_json
        
        return False, None
    
    def setup_2fa_for_user(self, db: Session, user: User) -> dict:
        """
        Initialize 2FA setup for a user
        
        Args:
            db: Database session
            user: User model instance
        
        Returns:
            dict: Contains secret, qr_code, and backup_codes for user to save
        """
        # Generate new secret
        secret = self.generate_secret()
        
        # Generate backup codes
        plain_codes, hashed_codes = self.generate_backup_codes()
        
        # Store secret and backup codes (2FA not enabled yet)
        user.two_factor_secret = secret
        user.two_factor_backup_codes = json.dumps(hashed_codes)
        user.two_factor_enabled = False  # Not enabled until verified
        
        db.commit()
        
        # Generate QR code
        provisioning_uri = self.generate_provisioning_uri(user.email, secret)
        qr_code = self.generate_qr_code(provisioning_uri)
        
        return {
            "secret": secret,
            "qr_code": qr_code,
            "backup_codes": plain_codes,  # Only time these are shown
            "provisioning_uri": provisioning_uri
        }
    
    def enable_2fa(self, db: Session, user: User, verification_token: str) -> bool:
        """
        Enable 2FA after user verifies setup with a valid token
        
        Args:
            db: Database session
            user: User model instance
            verification_token: Token from authenticator app to verify setup
        
        Returns:
            bool: True if token verified and 2FA enabled
        """
        if not user.two_factor_secret:
            return False
        
        # Verify the token
        if self.verify_token(user.two_factor_secret, verification_token):
            user.two_factor_enabled = True
            db.commit()
            return True
        
        return False
    
    def disable_2fa(self, db: Session, user: User):
        """
        Disable 2FA for a user
        
        Args:
            db: Database session
            user: User model instance
        """
        user.two_factor_enabled = False
        user.two_factor_secret = None
        user.two_factor_backup_codes = None
        db.commit()
    
    def verify_2fa_login(
        self, 
        user: User, 
        token: str, 
        db: Session,
        is_backup_code: bool = False
    ) -> bool:
        """
        Verify 2FA token during login
        
        Args:
            user: User attempting to log in
            token: TOTP token or backup code
            db: Database session
            is_backup_code: Whether token is a backup code (default False)
        
        Returns:
            bool: True if authentication successful
        """
        if not user.two_factor_enabled:
            return False
        
        if is_backup_code:
            # Verify backup code
            if not user.two_factor_backup_codes:
                return False
            
            is_valid, updated_codes = self.verify_backup_code(
                user.two_factor_backup_codes, 
                token
            )
            
            if is_valid:
                # Update stored codes (one-time use)
                user.two_factor_backup_codes = updated_codes
                db.commit()
                return True
            
            return False
        else:
            # Verify TOTP token
            if not user.two_factor_secret:
                return False
            
            return self.verify_token(user.two_factor_secret, token)


# Singleton instance
two_factor_service = TwoFactorService()
