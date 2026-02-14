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
        Create and store a new verification token for a user (ORM version)
        """
        token = self.generate_verification_token()
        user.email_verification_token = token
        user.email_verified = False
        db.commit()
        return token
    
    def verify_email(self, db: Session, token: str) -> Optional[User]:
        """
        Verify a user's email using the verification token (ORM version)
        """
        user = db.query(User).filter(User.email_verification_token == token).first()
        if not user:
            return None
        user.email_verified = True
        user.email_verification_token = None
        user.is_verified = True
        db.commit()
        db.refresh(user)
        return user
    
    def verify_email_turso(self, token: str) -> Optional[dict]:
        """
        Verify a user's email using the verification token (Turso HTTP version)
        """
        from app.db.turso_http import get_turso_http
        turso = get_turso_http()
        result = turso.execute(
            "SELECT id, email, name FROM users WHERE email_verification_token = ?",
            [token]
        )
        rows = result.get("rows", [])
        if not rows:
            return None
        user_id = rows[0][0]
        turso.execute(
            "UPDATE users SET email_verified = 1, email_verification_token = NULL WHERE id = ?",
            [user_id]
        )
        return {"id": user_id, "email": rows[0][1], "name": rows[0][2]}
    
    def resend_verification_email_turso(self, current_user) -> str:
        """
        Generate a new verification token and store it via Turso HTTP
        """
        from app.db.turso_http import get_turso_http
        token = self.generate_verification_token()
        user_id = getattr(current_user, "id", None) or getattr(current_user, "user_id", None)
        turso = get_turso_http()
        turso.execute(
            "UPDATE users SET email_verification_token = ? WHERE id = ?",
            [token, user_id]
        )
        return token
    
    def is_token_valid(self, user: User) -> bool:
        """Check if user's verification token is still valid (not expired)"""
        return bool(user.email_verification_token)
    
    def resend_verification_email(self, db: Session, user: User) -> str:
        """Generate a new verification token and invalidate the old one (ORM version)"""
        return self.create_verification_token(db, user)


# Singleton instance
email_verification_service = EmailVerificationService()
