"""
@AI-HINT: Security and authentication module for MegiLance
Uses Turso remote database ONLY - no local SQLite fallback
All database queries use synchronous HTTP to avoid event loop issues
"""

from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException, status, Header
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import get_db
from app.db.turso_http import get_turso_http
from app.models.user import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    if isinstance(hashed_password, bytes):
        hashed_password = hashed_password.decode('utf-8')
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Generate password hash"""
    return pwd_context.hash(password)


def _parse_date(value) -> datetime:
    """Parse date from various formats"""
    if value is None:
        return datetime.utcnow()
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        try:
            return datetime.fromisoformat(value.replace('Z', '+00:00'))
        except:
            try:
                return datetime.strptime(value, '%Y-%m-%d %H:%M:%S')
            except:
                return datetime.utcnow()
    return datetime.utcnow()


def _to_str(value) -> Optional[str]:
    """Convert bytes to string if needed"""
    if value is None:
        return None
    if isinstance(value, bytes):
        return value.decode('utf-8')
    return str(value) if value is not None else None


def _row_to_user(row: list) -> User:
    """Convert database row to User object"""
    return User(
        id=row[0],
        email=_to_str(row[1]),
        hashed_password=_to_str(row[2]),
        name=_to_str(row[3]),
        role=_to_str(row[4]),
        is_active=bool(row[5]) if row[5] is not None else True,
        user_type=_to_str(row[6]),
        joined_at=_parse_date(row[7]),
        created_at=_parse_date(row[8])
    )


def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    """
    Authenticate user against Turso remote database ONLY
    No local database fallback - Turso must be available
    """
    print(f"\n[AUTH] Authenticating: {email}")
    
    try:
        turso = get_turso_http()
        row = turso.fetch_one(
            "SELECT id, email, hashed_password, name, role, is_active, user_type, joined_at, created_at FROM users WHERE email = ?",
            [email]
        )
        
        if not row:
            print(f"   [FAIL] User not found: {email}")
            return None
        
        print(f"   [OK] User found: ID={row[0]}, Role={row[4]}")
        
        if not verify_password(password, row[2]):
            print(f"   [FAIL] Invalid password")
            return None
        
        user = _row_to_user(row)
        print(f"   [SUCCESS] Authentication successful")
        return user
        
    except Exception as e:
        print(f"   [ERROR] Turso query failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database unavailable: {str(e)}"
        )


def _create_token(data: dict, expires_delta: timedelta, token_type: str) -> str:
    """Create JWT token"""
    settings = get_settings()
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire, "type": token_type})
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.jwt_algorithm)


def create_access_token(subject: str, custom_claims: Optional[dict] = None, expires_delta_minutes: Optional[int] = None) -> str:
    """Create access token"""
    settings = get_settings()
    claims = custom_claims.copy() if custom_claims else {}
    claims.update({"sub": subject})
    
    if expires_delta_minutes is not None:
        expires = timedelta(minutes=expires_delta_minutes)
    else:
        expires = timedelta(minutes=settings.access_token_expire_minutes)
    
    return _create_token(claims, expires, "access")


def create_refresh_token(subject: str, custom_claims: Optional[dict] = None) -> str:
    """Create refresh token"""
    settings = get_settings()
    claims = custom_claims.copy() if custom_claims else {}
    claims.update({"sub": subject})
    expires = timedelta(minutes=settings.refresh_token_expire_minutes)
    return _create_token(claims, expires, "refresh")


def decode_token(token: str) -> dict:
    """Decode JWT token"""
    settings = get_settings()
    return jwt.decode(token, settings.secret_key, algorithms=[settings.jwt_algorithm])


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """
    Get current user from JWT token using Turso ONLY
    No local database fallback
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not token:
        raise credentials_exception

    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            raise credentials_exception
        email: Optional[str] = payload.get("sub")
        if not email:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    try:
        turso = get_turso_http()
        row = turso.fetch_one(
            "SELECT id, email, hashed_password, name, role, is_active, user_type, joined_at, created_at FROM users WHERE email = ?",
            [email]
        )
        
        if not row:
            raise credentials_exception
        
        return _row_to_user(row)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] get_current_user Turso query failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database unavailable: {str(e)}"
        )


def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """Get current active user"""
    if not current_user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")
    return current_user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Require admin role"""
    if current_user.role != "Admin" and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


def get_user_by_email(email: str) -> Optional[User]:
    """Get user by email from Turso"""
    try:
        turso = get_turso_http()
        row = turso.fetch_one(
            "SELECT id, email, hashed_password, name, role, is_active, user_type, joined_at, created_at FROM users WHERE email = ?",
            [email]
        )
        return _row_to_user(row) if row else None
    except Exception as e:
        print(f"[ERROR] get_user_by_email failed: {e}")
        return None


def get_user_by_id(user_id: int) -> Optional[User]:
    """Get user by ID from Turso"""
    try:
        turso = get_turso_http()
        row = turso.fetch_one(
            "SELECT id, email, hashed_password, name, role, is_active, user_type, joined_at, created_at FROM users WHERE id = ?",
            [user_id]
        )
        return _row_to_user(row) if row else None
    except Exception as e:
        print(f"[ERROR] get_user_by_id failed: {e}")
        return None


def get_current_user_from_token(token: str = Depends(oauth2_scheme)) -> dict:
    """
    Get current user as dict from JWT token using Turso ONLY
    Returns a dict instead of User object for API compatibility
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not token:
        raise credentials_exception

    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            raise credentials_exception
        email: Optional[str] = payload.get("sub")
        user_id = payload.get("user_id")
        role = payload.get("role")
        if not email:
            raise credentials_exception
        
        # Return dict directly from token payload for efficiency
        return {
            "id": user_id,
            "email": email,
            "role": role,
            "user_id": user_id
        }
    except JWTError:
        raise credentials_exception


def get_current_user_optional(token: str = Depends(oauth2_scheme)) -> Optional[dict]:
    """
    Get current user if authenticated, return None if not.
    Use this for endpoints that work for both authenticated and anonymous users.
    """
    if not token:
        return None
    
    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            return None
        email: Optional[str] = payload.get("sub")
        user_id = payload.get("user_id")
        role = payload.get("role")
        if not email:
            return None
        
        return {
            "id": user_id,
            "email": email,
            "role": role,
            "user_id": user_id
        }
    except JWTError:
        return None


def get_current_user_from_header(authorization: str = Header(None, alias="Authorization")) -> dict:
    """
    Get current user from Authorization header
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not authorization:
        raise credentials_exception
    
    # Extract token from "Bearer <token>" format
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise credentials_exception
    
    token = parts[1]
    
    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            raise credentials_exception
        email: Optional[str] = payload.get("sub")
        user_id = payload.get("user_id")
        role = payload.get("role")
        if not email:
            raise credentials_exception
        
        return {
            "id": user_id,
            "email": email,
            "role": role,
            "user_id": user_id
        }
    except JWTError:
        raise credentials_exception


