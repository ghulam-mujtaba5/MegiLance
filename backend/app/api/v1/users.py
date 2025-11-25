"""
@AI-HINT: Users API endpoints using Turso remote database ONLY
No local SQLite fallback - all queries go directly to Turso
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from datetime import datetime
import json

from app.models.user import User
from app.schemas.user import UserCreate, UserRead, UserUpdate, ProfileCompleteUpdate
from app.core.security import get_password_hash, get_current_user
from app.db.turso_http import get_turso_http

router = APIRouter()


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


def _row_to_user_dict(row: list) -> dict:
    """Convert database row to user dict"""
    return {
        "id": row[0],
        "email": _to_str(row[1]),
        "name": _to_str(row[2]),
        "role": _to_str(row[3]),
        "is_active": bool(row[4]) if row[4] is not None else True,
        "user_type": _to_str(row[5]),
        "joined_at": _parse_date(row[6]),
        "created_at": _parse_date(row[7])
    }


@router.get("/", response_model=List[UserRead])
def list_users():
    """List all users from Turso database"""
    try:
        turso = get_turso_http()
        result = turso.execute(
            "SELECT id, email, name, role, is_active, user_type, joined_at, created_at FROM users"
        )
        
        users = [_row_to_user_dict(row) for row in result.get("rows", [])]
        return users
        
    except Exception as e:
        print(f"[ERROR] list_users: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database unavailable: {str(e)}"
        )


@router.get("/{user_id}", response_model=UserRead)
def get_user(user_id: int):
    """Get user by ID from Turso database"""
    try:
        turso = get_turso_http()
        row = turso.fetch_one(
            "SELECT id, email, name, role, is_active, user_type, joined_at, created_at FROM users WHERE id = ?",
            [user_id]
        )
        
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
        return _row_to_user_dict(row)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] get_user: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database unavailable: {str(e)}"
        )


@router.post("/", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def create_user(payload: UserCreate):
    """Create new user in Turso database"""
    try:
        turso = get_turso_http()
        
        # Check if email exists
        existing = turso.fetch_one("SELECT id FROM users WHERE email = ?", [payload.email])
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        now = datetime.utcnow().isoformat()
        hashed_pw = get_password_hash(payload.password)
        
        turso.execute(
            """INSERT INTO users (email, hashed_password, name, role, is_active, user_type, 
                                  bio, skills, hourly_rate, profile_image_url, location,
                                  joined_at, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            [payload.email, hashed_pw, payload.name, "User", payload.is_active,
             payload.user_type, payload.bio, payload.skills, payload.hourly_rate,
             payload.profile_image_url, payload.location, now, now, now]
        )
        
        # Get created user
        row = turso.fetch_one(
            "SELECT id, email, name, role, is_active, user_type, joined_at, created_at FROM users WHERE email = ?",
            [payload.email]
        )
        
        return _row_to_user_dict(row)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] create_user: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database unavailable: {str(e)}"
        )


@router.get("/me", response_model=UserRead)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Get the currently authenticated user's profile"""
    return current_user


@router.put("/me/complete-profile", response_model=UserRead)
def complete_user_profile(
    profile_data: ProfileCompleteUpdate,
    current_user: User = Depends(get_current_user)
):
    """Complete user profile after initial signup"""
    try:
        turso = get_turso_http()
        
        updates = []
        params = []
        
        # Build name from first/last
        if profile_data.firstName and profile_data.lastName:
            updates.append("name = ?")
            params.append(f"{profile_data.firstName} {profile_data.lastName}")
        
        if profile_data.bio:
            updates.append("bio = ?")
            params.append(profile_data.bio)
        
        if profile_data.location:
            updates.append("location = ?")
            params.append(profile_data.location)
        
        if profile_data.skills:
            updates.append("skills = ?")
            params.append(profile_data.skills)
        
        if profile_data.hourlyRate:
            updates.append("hourly_rate = ?")
            params.append(float(profile_data.hourlyRate))
        
        # Build profile_data JSON
        extra_data = {}
        if profile_data.title:
            extra_data['title'] = profile_data.title
        if profile_data.timezone:
            extra_data['timezone'] = profile_data.timezone
        if profile_data.experienceLevel:
            extra_data['experience_level'] = profile_data.experienceLevel
        if profile_data.availability:
            extra_data['availability'] = profile_data.availability
        if profile_data.languages:
            extra_data['languages'] = profile_data.languages
        if profile_data.portfolioItems:
            extra_data['portfolio_items'] = [
                {'title': item.title, 'description': item.description, 
                 'url': item.url, 'imageUrl': item.imageUrl, 'tags': item.tags}
                for item in profile_data.portfolioItems
            ]
        if profile_data.phoneNumber:
            extra_data['phone_number'] = profile_data.phoneNumber
        if profile_data.linkedinUrl:
            extra_data['linkedin_url'] = profile_data.linkedinUrl
        if profile_data.githubUrl:
            extra_data['github_url'] = profile_data.githubUrl
        if profile_data.websiteUrl:
            extra_data['website_url'] = profile_data.websiteUrl
        
        extra_data['profile_completed'] = True
        
        if extra_data:
            updates.append("profile_data = ?")
            params.append(json.dumps(extra_data))
        
        updates.append("updated_at = ?")
        params.append(datetime.utcnow().isoformat())
        params.append(current_user.id)
        
        if updates:
            turso.execute(f"UPDATE users SET {', '.join(updates)} WHERE id = ?", params)
        
        # Return updated user
        row = turso.fetch_one(
            "SELECT id, email, name, role, is_active, user_type, joined_at, created_at FROM users WHERE id = ?",
            [current_user.id]
        )
        return _row_to_user_dict(row)
        
    except Exception as e:
        print(f"[ERROR] complete_user_profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database unavailable: {str(e)}"
        )


@router.get("/me/notification-preferences")
def get_notification_preferences(current_user: User = Depends(get_current_user)):
    """Get the current user's notification preferences"""
    try:
        turso = get_turso_http()
        row = turso.fetch_one(
            "SELECT notification_preferences FROM users WHERE id = ?",
            [current_user.id]
        )
        
        if row and row[0]:
            try:
                return json.loads(row[0])
            except json.JSONDecodeError:
                pass
        
        # Return default preferences
        return {
            "preferences": {
                "projectUpdates": {"email": True, "push": True, "sms": False, "inApp": True},
                "proposals": {"email": True, "push": True, "sms": True, "inApp": True},
                "messages": {"email": True, "push": True, "sms": False, "inApp": True},
                "payments": {"email": True, "push": True, "sms": True, "inApp": True},
                "reviews": {"email": True, "push": False, "sms": False, "inApp": True},
                "marketing": {"email": False, "push": False, "sms": False, "inApp": False}
            },
            "digest": {
                "frequency": "realtime",
                "quietHoursStart": "22:00",
                "quietHoursEnd": "08:00"
            }
        }
        
    except Exception as e:
        print(f"[ERROR] get_notification_preferences: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database unavailable: {str(e)}"
        )


@router.put("/me/notification-preferences")
def update_notification_preferences(
    preferences: dict,
    current_user: User = Depends(get_current_user)
):
    """Update the current user's notification preferences"""
    try:
        if "preferences" not in preferences or "digest" not in preferences:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid preferences structure. Must include 'preferences' and 'digest' keys."
            )
        
        turso = get_turso_http()
        turso.execute(
            "UPDATE users SET notification_preferences = ?, updated_at = ? WHERE id = ?",
            [json.dumps(preferences), datetime.utcnow().isoformat(), current_user.id]
        )
        
        return {
            "message": "Notification preferences updated successfully",
            "preferences": preferences
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] update_notification_preferences: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database unavailable: {str(e)}"
        )
