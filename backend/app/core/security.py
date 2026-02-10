"""
@AI-HINT: Security and authentication module for MegiLance
- JWT token management with expiry validation
- Token blacklist for revoked tokens
- Password hashing with bcrypt
- Rate limiting on auth endpoints
"""

from datetime import datetime, timedelta, timezone
from typing import Optional, Set, Any, Union
import logging

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import get_db
from app.db.turso_http import execute_query, parse_rows
from app.models.user import User

logger = logging.getLogger(__name__)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

# Token blacklist is now DB-backed via token_blacklist_service
# See: app/services/token_blacklist_service.py


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    if isinstance(hashed_password, bytes):
        hashed_password = hashed_password.decode('utf-8')
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Generate password hash"""
    return pwd_context.hash(password)


class UserProxy:
    """Lightweight user object from Turso query results"""
    def __init__(self, row: dict):
        self.id = row.get('id')
        self.email = row.get('email')
        self.hashed_password = row.get('hashed_password')
        self.is_active = bool(row.get('is_active', 0))
        self.is_verified = bool(row.get('is_verified', 0))
        self.name = row.get('name')
        self.user_type = row.get('user_type') or row.get('role', 'client')
        self.role = row.get('role') or row.get('user_type', 'client')  # Ensure role is always set
        self.bio = row.get('bio')
        self.skills = row.get('skills')
        self.hourly_rate = row.get('hourly_rate', 0)
        self.profile_image_url = row.get('profile_image_url')
        self.location = row.get('location')
        self.profile_data = row.get('profile_data')
        self.two_factor_enabled = bool(row.get('two_factor_enabled', 0))
        self.joined_at = row.get('joined_at')


def authenticate_user(db: Session, email: str, password: str) -> Optional[Any]:
    """Authenticate user - check credentials and return user if valid
    
    Uses Turso HTTP API directly to ensure consistency with registration.
    """
    try:
        # Normalize email to lowercase
        email_lower = email.lower().strip()
        
        # Query user by email using Turso HTTP API
        result = execute_query(
            """SELECT id, email, hashed_password, is_active, is_verified, 
                      name, user_type, role, bio, skills, hourly_rate,
                      profile_image_url, location, profile_data, 
                      two_factor_enabled, joined_at
               FROM users WHERE email = ?""",
            [email_lower]
        )
        
        rows = parse_rows(result)
        
        if not rows or len(rows) == 0:
            logger.warning(f"Login attempt with non-existent email: {email}")
            return None
        
        user_data = rows[0]
        
        # Get hashed password (handle bytes if returned)
        hashed_pw = user_data.get('hashed_password')
        if isinstance(hashed_pw, bytes):
            hashed_pw = hashed_pw.decode('utf-8')
        
        if not hashed_pw or not verify_password(password, hashed_pw):
            logger.warning(f"Failed login attempt for user: {email}")
            return None
        
        if not user_data.get('is_active', True):
            logger.warning(f"Login attempt for inactive user: {email}")
            return None
        
        logger.info(f"Successful authentication for user: {email}")
        return UserProxy(user_data)
        
    except Exception as e:
        logger.error(f"Authentication error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication failed"
        )


def _create_token(data: dict, expires_delta: timedelta, token_type: str) -> str:
    """Create JWT token with expiry"""
    settings = get_settings()
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + expires_delta
    
    # Add token metadata
    to_encode.update({
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "type": token_type,
    })
    
    token = jwt.encode(to_encode, settings.secret_key, algorithm=settings.jwt_algorithm)
    return token


def create_access_token(subject: str, expires_delta_minutes: Optional[int] = None, custom_claims: Optional[dict] = None) -> str:
    """Create access token"""
    settings = get_settings()
    if expires_delta_minutes is None:
        expires_delta_minutes = settings.access_token_expire_minutes
    
    data = {"sub": subject}
    if custom_claims:
        data.update(custom_claims)
    
    return _create_token(
        data,
        timedelta(minutes=expires_delta_minutes),
        "access"
    )


def create_refresh_token(subject: str, custom_claims: Optional[dict] = None) -> str:
    """Create refresh token"""
    settings = get_settings()
    data = {"sub": subject}
    if custom_claims:
        data.update(custom_claims)
    
    return _create_token(
        data,
        timedelta(minutes=settings.refresh_token_expire_minutes),
        "refresh"
    )


def decode_token(token: str) -> dict:
    """Decode and validate JWT token"""
    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.jwt_algorithm])
        return payload
    except JWTError as e:
        logger.warning(f"Invalid token: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )


def add_token_to_blacklist(token: str, expiry: datetime) -> None:
    """Add token to persistent blacklist (Turso DB-backed)"""
    from app.services.token_blacklist_service import add_token_to_blacklist as _add
    _add(token, expiry, reason="logout")


def is_token_blacklisted(token: str) -> bool:
    """Check if token is blacklisted (Turso DB-backed with memory cache)"""
    from app.services.token_blacklist_service import is_token_blacklisted as _check
    return _check(token)


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> Union[User, UserProxy]:
    """Get current authenticated user from JWT token.
    
    Returns a UserProxy (lightweight dict wrapper) from Turso queries,
    not the full SQLAlchemy User model.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not token:
        raise credentials_exception

    # Check if token is blacklisted
    if is_token_blacklisted(token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked"
        )

    try:
        payload = decode_token(token)
        
        # Validate token type
        token_type = payload.get("type")
        if token_type != "access":
            logger.warning(f"Invalid token type: {token_type}")
            raise credentials_exception
        
        # Validate expiry
        exp_timestamp = payload.get("exp")
        if exp_timestamp and datetime.fromtimestamp(exp_timestamp, tz=timezone.utc) < datetime.now(timezone.utc):
            logger.warning("Token has expired")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired"
            )
        
        email: Optional[str] = payload.get("sub")
        if not email:
            raise credentials_exception
            
    except HTTPException:
        raise
    except JWTError:
        raise credentials_exception

    try:
        # Fetch user from Turso database using HTTP API (not SQLAlchemy which falls back to local SQLite)
        result = execute_query(
            """SELECT id, email, name, hashed_password, role, user_type, is_active, is_verified, 
                      bio, skills, hourly_rate, profile_image_url, location, profile_data,
                      two_factor_enabled, joined_at FROM users WHERE email = ?""",
            [email]
        )
        rows = parse_rows(result)
        
        if not rows:
            logger.warning(f"User not found for email: {email}")
            raise credentials_exception
        
        row = rows[0]
        # Return UserProxy that mimics User model
        return UserProxy(row)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching user from Turso: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch user"
        )


def get_current_user_from_token(token: str = Depends(oauth2_scheme)) -> dict:
    """Get user info directly from token without database lookup"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not token:
        raise credentials_exception

    try:
        payload = decode_token(token)
        
        # Validate token type
        if payload.get("type") != "access":
            raise credentials_exception
        
        # Validate expiry
        exp = payload.get("exp")
        if exp and datetime.fromtimestamp(exp, tz=timezone.utc) < datetime.now(timezone.utc):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
        
        return payload
        
    except HTTPException:
        raise
    except JWTError:
        raise credentials_exception


def get_current_user_optional(token: str = Depends(oauth2_scheme)) -> Optional[dict]:
    """Get user info from token, but don't fail if not provided - returns None if no valid token"""
    if not token:
        return None
    
    try:
        return get_current_user_from_token(token)
    except HTTPException:
        return None


def get_current_active_user(current_user: Union[User, UserProxy] = Depends(get_current_user)) -> Union[User, UserProxy]:
    """Ensure user is active"""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    return current_user


def require_admin(current_user: Union[User, UserProxy] = Depends(get_current_active_user)) -> Union[User, UserProxy]:
    """Require admin role"""
    if not current_user.role or current_user.role.lower() != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


def check_admin_role(user: Union[User, UserProxy]) -> None:
    """Check if user has admin role, raise 403 if not"""
    if not user.role or user.role.lower() != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )


def require_role(required_role: str):
    """Generic role requirement"""
    def role_checker(current_user: Union[User, UserProxy] = Depends(get_current_active_user)) -> Union[User, UserProxy]:
        if current_user.role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{required_role}' required"
            )
        return current_user
    return role_checker


def get_user_by_email(db: Session, email: str) -> Optional[UserProxy]:
    """Get user by email via Turso HTTP API"""
    try:
        result = execute_query(
            "SELECT id, email, hashed_password, is_active, is_verified, name, user_type, role, "
            "bio, skills, hourly_rate, profile_image_url, location, profile_data, "
            "two_factor_enabled, joined_at FROM users WHERE email = ?",
            [email.lower().strip()]
        )
        rows = parse_rows(result)
        if rows:
            return UserProxy(rows[0])
        return None
    except Exception as e:
        logger.error(f"Error getting user by email: {e}")
        return None


def get_user_by_id(db: Session, user_id: int) -> Optional[UserProxy]:
    """Get user by ID via Turso HTTP API"""
    try:
        result = execute_query(
            "SELECT id, email, hashed_password, is_active, is_verified, name, user_type, role, "
            "bio, skills, hourly_rate, profile_image_url, location, profile_data, "
            "two_factor_enabled, joined_at FROM users WHERE id = ?",
            [user_id]
        )
        rows = parse_rows(result)
        if rows:
            return UserProxy(rows[0])
        return None
    except Exception as e:
        logger.error(f"Error getting user by ID: {e}")
        return None


