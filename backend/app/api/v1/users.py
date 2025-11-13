from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserRead, UserUpdate, ProfileCompleteUpdate
from app.core.security import get_password_hash, get_current_user
from typing import Optional
import json


router = APIRouter()


@router.get("/", response_model=list[UserRead])
def list_users(db: Session = Depends(get_db)):
    return db.query(User).all()


@router.post("/", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def create_user(payload: UserCreate, db: Session = Depends(get_db)):
    exists = db.query(User).filter(User.email == payload.email).first()
    if exists:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        email=payload.email,
        hashed_password=get_password_hash(payload.password),
        is_active=payload.is_active,
        name=payload.name,
        user_type=payload.user_type,
        bio=payload.bio,
        skills=payload.skills,
        hourly_rate=payload.hourly_rate,
        profile_image_url=payload.profile_image_url,
        location=payload.location,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("/me", response_model=UserRead)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Get the currently authenticated user's profile"""
    return current_user


@router.put("/me/complete-profile", response_model=UserRead)
def complete_user_profile(
    profile_data: ProfileCompleteUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Complete user profile after initial signup.
    This endpoint updates all profile fields including:
    - Basic info (name, bio, location, timezone)
    - Professional info (skills, hourly rate, experience level, availability, languages)
    - Portfolio items
    - Verification links (phone, LinkedIn, GitHub, website)
    """
    # Update basic info
    if profile_data.firstName and profile_data.lastName:
        current_user.name = f"{profile_data.firstName} {profile_data.lastName}"
    if profile_data.title:
        current_user.profile_data = current_user.profile_data or {}
        current_user.profile_data['title'] = profile_data.title
    if profile_data.bio:
        current_user.bio = profile_data.bio
    if profile_data.location:
        current_user.location = profile_data.location
    if profile_data.timezone:
        current_user.profile_data = current_user.profile_data or {}
        current_user.profile_data['timezone'] = profile_data.timezone
    
    # Update professional info
    if profile_data.skills:
        current_user.skills = profile_data.skills
    if profile_data.hourlyRate:
        current_user.hourly_rate = float(profile_data.hourlyRate)
    if profile_data.experienceLevel:
        current_user.profile_data = current_user.profile_data or {}
        current_user.profile_data['experience_level'] = profile_data.experienceLevel
    if profile_data.availability:
        current_user.profile_data = current_user.profile_data or {}
        current_user.profile_data['availability'] = profile_data.availability
    if profile_data.languages:
        current_user.profile_data = current_user.profile_data or {}
        current_user.profile_data['languages'] = profile_data.languages
    
    # Update portfolio items
    if profile_data.portfolioItems:
        current_user.profile_data = current_user.profile_data or {}
        current_user.profile_data['portfolio_items'] = [
            {
                'title': item.title,
                'description': item.description,
                'url': item.url,
                'imageUrl': item.imageUrl,
                'tags': item.tags
            }
            for item in profile_data.portfolioItems
        ]
    
    # Update verification info
    if profile_data.phoneNumber:
        current_user.profile_data = current_user.profile_data or {}
        current_user.profile_data['phone_number'] = profile_data.phoneNumber
    if profile_data.linkedinUrl:
        current_user.profile_data = current_user.profile_data or {}
        current_user.profile_data['linkedin_url'] = profile_data.linkedinUrl
    if profile_data.githubUrl:
        current_user.profile_data = current_user.profile_data or {}
        current_user.profile_data['github_url'] = profile_data.githubUrl
    if profile_data.websiteUrl:
        current_user.profile_data = current_user.profile_data or {}
        current_user.profile_data['website_url'] = profile_data.websiteUrl
    
    # Mark profile as completed
    current_user.profile_data = current_user.profile_data or {}
    current_user.profile_data['profile_completed'] = True
    
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/me/notification-preferences")
def get_notification_preferences(
    current_user: User = Depends(get_current_user)
):
    """
    Get the current user's notification preferences.
    Returns default preferences if none are set.
    """
    if current_user.notification_preferences:
        try:
            return json.loads(current_user.notification_preferences)
        except json.JSONDecodeError:
            pass
    
    # Return default preferences
    return {
        "preferences": {
            "projectUpdates": {
                "email": True,
                "push": True,
                "sms": False,
                "inApp": True
            },
            "proposals": {
                "email": True,
                "push": True,
                "sms": True,
                "inApp": True
            },
            "messages": {
                "email": True,
                "push": True,
                "sms": False,
                "inApp": True
            },
            "payments": {
                "email": True,
                "push": True,
                "sms": True,
                "inApp": True
            },
            "reviews": {
                "email": True,
                "push": False,
                "sms": False,
                "inApp": True
            },
            "marketing": {
                "email": False,
                "push": False,
                "sms": False,
                "inApp": False
            }
        },
        "digest": {
            "frequency": "realtime",
            "quietHoursStart": "22:00",
            "quietHoursEnd": "08:00"
        }
    }


@router.put("/me/notification-preferences")
def update_notification_preferences(
    preferences: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update the current user's notification preferences.
    Accepts a JSON object with notification channel settings and digest preferences.
    """
    try:
        # Validate structure
        if "preferences" not in preferences or "digest" not in preferences:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid preferences structure. Must include 'preferences' and 'digest' keys."
            )
        
        # Store as JSON string
        current_user.notification_preferences = json.dumps(preferences)
        db.commit()
        db.refresh(current_user)
        
        return {
            "message": "Notification preferences updated successfully",
            "preferences": json.loads(current_user.notification_preferences)
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update notification preferences: {str(e)}"
        )
