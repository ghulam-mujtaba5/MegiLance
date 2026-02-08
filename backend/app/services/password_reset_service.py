# @AI-HINT: Password reset service for generating reset tokens, validating expiry, and updating passwords
# Handles forgot password workflow with secure token generation and expiry management

import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional
from sqlalchemy.orm import Session
from ..models.user import User


class PasswordResetService:
    """Service for handling password reset operations"""
    
    def __init__(self):
        self.token_expiry_hours = 1  # Reset tokens valid for 1 hour
    
    def generate_reset_token(self) -> str:
        """
        Generate a secure random password reset token
        
        Returns:
            str: URL-safe random token (32 bytes = 64 hex characters)
        """
        return secrets.token_urlsafe(32)
    
    def create_reset_token(self, db: Session, user: User) -> tuple[str, datetime]:
        """
        Create and store a new password reset token for a user
        
        Args:
            db: Database session
            user: User model instance
        
        Returns:
            tuple[str, datetime]: (reset_token, expiry_datetime)
        """
        token = self.generate_reset_token()
        expiry = datetime.now(timezone.utc) + timedelta(hours=self.token_expiry_hours)
        
        user.password_reset_token = token
        user.password_reset_expires = expiry
        db.commit()
        
        return token, expiry
    
    def validate_reset_token(self, db: Session, token: str) -> Optional[User]:
        """
        Validate a password reset token and check expiry
        
        Args:
            db: Database session
            token: Reset token from email link
        
        Returns:
            User: User object if token is valid and not expired, None otherwise
        """
        user = db.query(User).filter(User.password_reset_token == token).first()
        
        if not user:
            return None
        
        # Check if token has expired
        if user.password_reset_expires and user.password_reset_expires < datetime.now(timezone.utc):
            return None
        
        return user
    
    def reset_password(self, db: Session, user: User, new_password_hash: str) -> bool:
        """
        Reset user's password and clear reset token
        
        Args:
            db: Database session
            user: User model instance
            new_password_hash: Hashed new password
        
        Returns:
            bool: True if password reset successful
        """
        user.hashed_password = new_password_hash
        user.password_reset_token = None  # Clear token after use
        user.password_reset_expires = None
        user.last_password_changed = datetime.now(timezone.utc)
        
        db.commit()
        db.refresh(user)
        
        return True
    
    def is_token_expired(self, user: User) -> bool:
        """
        Check if user's reset token has expired
        
        Args:
            user: User model instance
        
        Returns:
            bool: True if token is expired or missing
        """
        if not user.password_reset_token or not user.password_reset_expires:
            return True
        
        return user.password_reset_expires < datetime.now(timezone.utc)
    
    def invalidate_reset_token(self, db: Session, user: User):
        """
        Manually invalidate a user's reset token
        
        Args:
            db: Database session
            user: User model instance
        """
        user.password_reset_token = None
        user.password_reset_expires = None
        db.commit()


# Singleton instance
password_reset_service = PasswordResetService()
