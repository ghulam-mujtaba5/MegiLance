# @AI-HINT: Email verification service for generating tokens, sending verification emails, and validating user emails
# Handles email verification token generation, expiry checking, and verification workflow

import secrets
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.orm import Session
from ..models.user import User


class EmailVerificationService:
    """Service for handling email verification operations"""
    
    def __init__(self):
        self.token_expiry_hours = 24  # Verification links valid for 24 hours
    
    def generate_verification_token(self) -> str:
        """
        Generate a secure random verification token
        
        Returns:
            str: URL-safe random token (32 bytes = 64 hex characters)
        """
        return secrets.token_urlsafe(32)
    
    def create_verification_token(self, db: Session, user: User) -> str:
        """
        Create and store a new verification token for a user
        
        Args:
            db: Database session
            user: User model instance
        
        Returns:
            str: Verification token to send via email
        """
        token = self.generate_verification_token()
        
        user.email_verification_token = token
        user.email_verified = False
        db.commit()
        
        return token
    
    def verify_email(self, db: Session, token: str) -> Optional[User]:
        """
        Verify a user's email using the verification token
        
        Args:
            db: Database session
            token: Verification token from email link
        
        Returns:
            User: User object if verification successful, None otherwise
        """
        user = db.query(User).filter(User.email_verification_token == token).first()
        
        if not user:
            return None
        
        # Mark email as verified
        user.email_verified = True
        user.email_verification_token = None  # Clear token after use
        user.is_verified = True  # Also mark account as verified
        db.commit()
        db.refresh(user)
        
        return user
    
    def is_token_valid(self, user: User) -> bool:
        """
        Check if user's verification token is still valid (not expired)
        
        Note: Currently tokens don't have expiry timestamp in DB,
        so this always returns True if token exists.
        Consider adding email_verification_expires field for production.
        
        Args:
            user: User model instance
        
        Returns:
            bool: True if token exists and is valid
        """
        return bool(user.email_verification_token)
    
    def resend_verification_email(self, db: Session, user: User) -> str:
        """
        Generate a new verification token and invalidate the old one
        
        Args:
            db: Database session
            user: User model instance
        
        Returns:
            str: New verification token
        """
        # Generate new token (this also invalidates the old one)
        return self.create_verification_token(db, user)


# Singleton instance
email_verification_service = EmailVerificationService()
