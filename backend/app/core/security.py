from datetime import datetime, timedelta
from typing import Optional
import asyncio

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import get_db, get_turso_client
from app.models.user import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    # Handle bytes from database
    if isinstance(hashed_password, bytes):
        hashed_password = hashed_password.decode('utf-8')
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    """Authenticate user against Turso remote database"""
    print(f"\n[AUTH] AUTHENTICATE_USER:")
    print(f"   Email: {email}")
    
    # Try Turso first for fresh data
    turso_client = get_turso_client()
    if turso_client:
        try:
            print(f"   [TURSO] Querying Turso directly...")
            
            # Use asyncio.run WITHOUT closing session (shared client)
            async def query_user():
                result = await turso_client.execute(
                    "SELECT id, email, hashed_password, name, role, is_active, user_type, joined_at, created_at FROM users WHERE email = ?",
                    [email]
                )
                return result
            
            result = asyncio.run(query_user())
            
            if result.rows:
                row = result.rows[0]
                print(f"   [OK] User found in Turso")
                print(f"   Row data: ID={row[0]}, Email={row[1]}, Name={row[3]}, Role={row[4]}, Active={row[5]}")
                print(f"   Hash preview: {row[2][:30] if row[2] else 'None'}...")
                
                password_valid = verify_password(password, row[2])
                print(f"   Password valid: {password_valid}")
                
                if password_valid:
                    # Create User-like object from Turso result
                    # Row order: id, email, hashed_password, name, role, is_active, user_type, joined_at, created_at
                    from datetime import datetime
                    
                    # Parse dates safely - Turso may return string or datetime
                    def parse_date(value):
                        if value is None:
                            return datetime.utcnow()
                        if isinstance(value, datetime):
                            return value
                        if isinstance(value, str):
                            try:
                                # Try ISO format first
                                return datetime.fromisoformat(value.replace('Z', '+00:00'))
                            except:
                                try:
                                    # Try other common formats
                                    return datetime.strptime(value, '%Y-%m-%d %H:%M:%S')
                                except:
                                    return datetime.utcnow()
                        return datetime.utcnow()
                    
                    # Helper function to decode bytes to string
                    def to_str(value):
                        if value is None:
                            return None
                        if isinstance(value, bytes):
                            return value.decode('utf-8')
                        return value
                    
                    user = User(
                        id=row[0],
                        email=to_str(row[1]),
                        hashed_password=to_str(row[2]),
                        name=to_str(row[3]),
                        role=to_str(row[4]),
                        is_active=bool(row[5]),
                        user_type=to_str(row[6]),
                        joined_at=parse_date(row[7]),
                        created_at=parse_date(row[8])
                    )
                    print(f"   [SUCCESS] Authentication successful via Turso")
                    return user
                else:
                    print(f"   [FAIL] Password verification failed")
                    return None
            else:
                print(f"   [FAIL] No user with email {email} in Turso")
                return None
        except Exception as e:
            print(f"   [WARNING] Turso query failed: {e}, falling back to local DB")
    
    # Fallback to local DB (for dev environments without Turso)
    print(f"   [FALLBACK] Falling back to local DB...")
    user = db.query(User).filter(User.email == email).first()
    
    if not user:
        print(f"   [FAIL] No user with email {email}")
        return None
    
    print(f"   User ID: {user.id}, Role: {user.role}")
    print(f"   Hash preview: {user.hashed_password[:30] if user.hashed_password else 'None'}...")
    
    password_valid = verify_password(password, user.hashed_password)
    print(f"   Password valid: {password_valid}")
    
    if not password_valid:
        print(f"   [FAIL] Password verification failed")
        return None
    
    print(f"   [SUCCESS] Authentication successful")
    return user


def _create_token(data: dict, expires_delta: timedelta, token_type: str) -> str:
    settings = get_settings()
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire, "type": token_type})
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.jwt_algorithm)


def create_access_token(subject: str, custom_claims: Optional[dict] = None, expires_delta_minutes: Optional[int] = None) -> str:
    settings = get_settings()
    claims = custom_claims.copy() if custom_claims else {}
    claims.update({"sub": subject})
    
    # Allow custom expiry for special tokens (e.g., temp 2FA tokens)
    if expires_delta_minutes is not None:
        expires = timedelta(minutes=expires_delta_minutes)
    else:
        expires = timedelta(minutes=settings.access_token_expire_minutes)
    
    return _create_token(claims, expires, "access")


def create_refresh_token(subject: str, custom_claims: Optional[dict] = None) -> str:
    settings = get_settings()
    claims = custom_claims.copy() if custom_claims else {}
    claims.update({"sub": subject})
    expires = timedelta(minutes=settings.refresh_token_expire_minutes)
    return _create_token(claims, expires, "refresh")


def decode_token(token: str) -> dict:
    settings = get_settings()
    return jwt.decode(token, settings.secret_key, algorithms=[settings.jwt_algorithm])


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """Get current user from JWT token, querying Turso for fresh data"""
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

    # Try Turso first for fresh user data
    turso_client = get_turso_client()
    if turso_client:
        try:
            # Use asyncio.run for Turso query in sync context
            async def query_turso():
                return await turso_client.execute(
                    "SELECT id, email, hashed_password, name, role, is_active, user_type, joined_at, created_at FROM users WHERE email = ?",
                    [email]
                )
            result = asyncio.run(query_turso())
            
            if result.rows:
                row = result.rows[0]
                from datetime import datetime
                
                # Parse dates safely
                def parse_date(val):
                    if not val:
                        return datetime.utcnow()
                    if isinstance(val, datetime):
                        return val
                    try:
                        return datetime.fromisoformat(str(val).replace('Z', '+00:00'))
                    except:
                        return datetime.utcnow()
                
                user = User(
                    id=row[0],
                    email=row[1],
                    hashed_password=row[2],
                    name=row[3],
                    role=row[4],
                    is_active=bool(row[5]),
                    user_type=row[6],
                    joined_at=parse_date(row[7]),
                    created_at=parse_date(row[8])
                )
                print(f"[OK] get_current_user from Turso: id={user.id}, email={user.email}, role={user.role}, user_type={user.user_type}")
                return user
        except Exception as e:
            print(f"[WARNING] Turso query failed in get_current_user: {e}")
    
    # Fallback to local DB
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user


def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")
    return current_user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Dependency that requires the user to be an admin"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user