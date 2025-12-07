"""
@AI-HINT: Users API endpoints using Turso remote database ONLY
No local SQLite fallback - all queries go directly to Turso
Enhanced with input validation and security measures
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from datetime import datetime
import json
import re

from app.models.user import User
from app.schemas.user import UserCreate, UserRead, UserUpdate, ProfileCompleteUpdate
from app.core.security import get_password_hash, get_current_user
from app.db.turso_http import get_turso_http

router = APIRouter()

# === Input Validation Constants ===
MAX_BIO_LENGTH = 2000
MAX_NAME_LENGTH = 100
MAX_SKILLS_LENGTH = 1000
MAX_LOCATION_LENGTH = 200
MAX_URL_LENGTH = 500
MAX_PHONE_LENGTH = 20
VALID_USER_TYPES = {"client", "freelancer", "both"}
VALID_DIGEST_FREQUENCIES = {"realtime", "daily", "weekly", "never"}

# Validation patterns
EMAIL_PATTERN = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
URL_PATTERN = re.compile(r'^https?://[a-zA-Z0-9.-]+(?:/[^\s]*)?$')
PHONE_PATTERN = re.compile(r'^[\d\s\+\-\(\)\.]+$')
TIME_PATTERN = re.compile(r'^([01]?[0-9]|2[0-3]):[0-5][0-9]$')


def _validate_url(url: Optional[str], field_name: str) -> Optional[str]:
    """Validate URL format"""
    if not url:
        return None
    url = url.strip()
    if len(url) > MAX_URL_LENGTH:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{field_name} URL exceeds maximum length of {MAX_URL_LENGTH} characters"
        )
    if not URL_PATTERN.match(url):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid {field_name} URL format"
        )
    return url


def _validate_string(value: Optional[str], field_name: str, max_length: int) -> Optional[str]:
    """Validate and sanitize string input"""
    if not value:
        return None
    value = value.strip()
    if len(value) > max_length:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{field_name} exceeds maximum length of {max_length} characters"
        )
    return value


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
    user_dict = {
        "id": row[0],
        "email": _to_str(row[1]),
        "name": _to_str(row[2]),
        "role": _to_str(row[3]),
        "is_active": bool(row[4]) if row[4] is not None else True,
        "user_type": _to_str(row[5]),
        "joined_at": _parse_date(row[6]),
        "created_at": _parse_date(row[7]),
        "bio": _to_str(row[8]) if len(row) > 8 else None,
        "skills": _to_str(row[9]) if len(row) > 9 else None,
        "hourly_rate": row[10] if len(row) > 10 else None,
        "profile_image_url": _to_str(row[11]) if len(row) > 11 else None,
        "location": _to_str(row[12]) if len(row) > 12 else None,
    }
    
    # Parse profile_data if present
    if len(row) > 13 and row[13]:
        try:
            profile_data = json.loads(_to_str(row[13]))
            if isinstance(profile_data, dict):
                user_dict.update(profile_data)
        except:
            pass
            
    # Parse skills if it looks like a list string
    if user_dict.get("skills"):
        try:
            # If it's a JSON string list
            if user_dict["skills"].startswith("["):
                user_dict["skills"] = json.loads(user_dict["skills"])
            # If it's comma separated
            elif "," in user_dict["skills"]:
                user_dict["skills"] = [s.strip() for s in user_dict["skills"].split(",")]
            # If it's a single string, make it a list
            elif isinstance(user_dict["skills"], str):
                user_dict["skills"] = [user_dict["skills"]]
        except:
            pass
            
    return user_dict


@router.get("/", response_model=List[UserRead])
def list_users():
    """List all users from Turso database"""
    try:
        turso = get_turso_http()
        result = turso.execute(
            """SELECT id, email, name, role, is_active, user_type, joined_at, created_at,
                      bio, skills, hourly_rate, profile_image_url, location, profile_data 
               FROM users"""
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
            """SELECT id, email, name, role, is_active, user_type, joined_at, created_at,
                      bio, skills, hourly_rate, profile_image_url, location, profile_data 
               FROM users WHERE id = ?""",
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


@router.post("/me/change-password")
def change_password(
    current_password: str,
    new_password: str,
    current_user: User = Depends(get_current_user)
):
    """Change user password"""
    from app.core.security import verify_password, get_password_hash
    from app.db.turso_http import execute_query
    
    # Get current hashed password
    result = execute_query(
        "SELECT hashed_password FROM users WHERE id = ?",
        [current_user.id]
    )
    
    if not result or not result.get("rows"):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    current_hash = _to_str(result["rows"][0][0])
    
    # Verify current password
    if not verify_password(current_password, current_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Validate new password strength
    if len(new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 8 characters long"
        )
    
    # Hash and update password
    new_hash = get_password_hash(new_password)
    execute_query(
        "UPDATE users SET hashed_password = ? WHERE id = ?",
        [new_hash, current_user.id]
    )
    
    return {"message": "Password changed successfully"}


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
        
        # Validate and build name from first/last
        if profile_data.firstName and profile_data.lastName:
            first_name = _validate_string(profile_data.firstName, "First name", 50)
            last_name = _validate_string(profile_data.lastName, "Last name", 50)
            if first_name and last_name:
                updates.append("name = ?")
                params.append(f"{first_name} {last_name}")
        
        if profile_data.bio:
            bio = _validate_string(profile_data.bio, "Bio", MAX_BIO_LENGTH)
            if bio:
                updates.append("bio = ?")
                params.append(bio)
        
        if profile_data.location:
            location = _validate_string(profile_data.location, "Location", MAX_LOCATION_LENGTH)
            if location:
                updates.append("location = ?")
                params.append(location)
        
        if profile_data.skills:
            skills = _validate_string(profile_data.skills, "Skills", MAX_SKILLS_LENGTH)
            if skills:
                updates.append("skills = ?")
                params.append(skills)
        
        if profile_data.hourlyRate:
            # Validate hourly rate is reasonable
            try:
                rate = float(profile_data.hourlyRate)
                if rate < 0 or rate > 10000:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Hourly rate must be between 0 and 10000"
                    )
                updates.append("hourly_rate = ?")
                params.append(rate)
            except (ValueError, TypeError):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid hourly rate format"
                )
        
        # Build profile_data JSON with validation
        extra_data = {}
        if profile_data.title:
            title = _validate_string(profile_data.title, "Title", 100)
            if title:
                extra_data['title'] = title
        if profile_data.timezone:
            timezone = _validate_string(profile_data.timezone, "Timezone", 100)
            if timezone:
                extra_data['timezone'] = timezone
        if profile_data.experienceLevel:
            valid_levels = {"entry", "intermediate", "expert", "junior", "mid", "senior"}
            if profile_data.experienceLevel.lower() not in valid_levels:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid experience level. Must be one of: {', '.join(valid_levels)}"
                )
            extra_data['experience_level'] = profile_data.experienceLevel
        if profile_data.availability:
            valid_availability = {"full_time", "part_time", "contract", "hourly", "not_available"}
            if profile_data.availability.lower().replace("-", "_") not in valid_availability:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid availability. Must be one of: {', '.join(valid_availability)}"
                )
            extra_data['availability'] = profile_data.availability
        if profile_data.languages:
            languages = _validate_string(profile_data.languages, "Languages", 500)
            if languages:
                extra_data['languages'] = languages
        if profile_data.portfolioItems:
            # Validate portfolio items
            validated_items = []
            for idx, item in enumerate(profile_data.portfolioItems[:10]):  # Max 10 items
                validated_item = {
                    'title': _validate_string(item.title, f"Portfolio item {idx+1} title", 200),
                    'description': _validate_string(item.description, f"Portfolio item {idx+1} description", 1000),
                    'url': _validate_url(item.url, f"Portfolio item {idx+1}"),
                    'imageUrl': _validate_url(item.imageUrl, f"Portfolio item {idx+1} image"),
                    'tags': item.tags[:20] if item.tags else []  # Max 20 tags
                }
                validated_items.append(validated_item)
            extra_data['portfolio_items'] = validated_items
        if profile_data.phoneNumber:
            phone = profile_data.phoneNumber.strip()
            if len(phone) > MAX_PHONE_LENGTH:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Phone number exceeds maximum length of {MAX_PHONE_LENGTH} characters"
                )
            if not PHONE_PATTERN.match(phone):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid phone number format"
                )
            extra_data['phone_number'] = phone
        if profile_data.linkedinUrl:
            linkedin = _validate_url(profile_data.linkedinUrl, "LinkedIn")
            if linkedin and "linkedin.com" not in linkedin.lower():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="LinkedIn URL must be a valid LinkedIn profile URL"
                )
            extra_data['linkedin_url'] = linkedin
        if profile_data.githubUrl:
            github = _validate_url(profile_data.githubUrl, "GitHub")
            if github and "github.com" not in github.lower():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="GitHub URL must be a valid GitHub profile URL"
                )
            extra_data['github_url'] = github
        if profile_data.websiteUrl:
            extra_data['website_url'] = _validate_url(profile_data.websiteUrl, "Website")
        
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
        # Validate preferences structure
        if "preferences" not in preferences or "digest" not in preferences:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid preferences structure. Must include 'preferences' and 'digest' keys."
            )
        
        # Validate preferences object
        prefs = preferences.get("preferences", {})
        if not isinstance(prefs, dict):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="'preferences' must be an object"
            )
        
        valid_channels = {"email", "push", "sms", "inApp"}
        valid_categories = {"projectUpdates", "proposals", "messages", "payments", "reviews", "marketing"}
        
        for category, settings in prefs.items():
            if category not in valid_categories:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid preference category: {category}"
                )
            if not isinstance(settings, dict):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Settings for '{category}' must be an object"
                )
            for channel, value in settings.items():
                if channel not in valid_channels:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Invalid channel '{channel}' in category '{category}'"
                    )
                if not isinstance(value, bool):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Channel value for '{channel}' in '{category}' must be boolean"
                    )
        
        # Validate digest settings
        digest = preferences.get("digest", {})
        if not isinstance(digest, dict):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="'digest' must be an object"
            )
        
        if "frequency" in digest:
            if digest["frequency"] not in VALID_DIGEST_FREQUENCIES:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid digest frequency. Must be one of: {', '.join(VALID_DIGEST_FREQUENCIES)}"
                )
        
        for time_field in ["quietHoursStart", "quietHoursEnd"]:
            if time_field in digest:
                if not TIME_PATTERN.match(str(digest[time_field])):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Invalid time format for {time_field}. Use HH:MM format."
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
