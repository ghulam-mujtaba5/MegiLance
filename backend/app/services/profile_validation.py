# @AI-HINT: Profile completeness validation service - checks required fields and calculates completion %
from typing import List, Dict, Any, Optional
from app.models.user import User


# Fields and their weights for completeness scoring
BASIC_FIELDS = {
    "name": 10,
    "bio": 10,
    "location": 5,
    "profile_image_url": 10,
}

FREELANCER_FIELDS = {
    "skills": 15,
    "hourly_rate": 10,
    "headline": 10,
    "experience_level": 5,
    "languages": 5,
    "linkedin_url": 5,
    "github_url": 5,
    "website_url": 5,
    "timezone": 5,
}


def is_profile_complete(user: User) -> bool:
    """
    Check if user profile is complete enough to perform actions.
    A profile is considered complete if it scores >= 60%.
    """
    return get_profile_completeness(user) >= 60


def get_profile_completeness(user: User) -> int:
    """Calculate profile completeness as a percentage (0-100)."""
    total_weight = 0
    earned_weight = 0

    # Basic fields for all users
    for field, weight in BASIC_FIELDS.items():
        total_weight += weight
        if field == "name":
            if user.name or (user.first_name and user.last_name):
                earned_weight += weight
        elif field == "bio":
            if user.bio and len(user.bio) > 20:
                earned_weight += weight
        else:
            if getattr(user, field, None):
                earned_weight += weight

    # Freelancer-specific fields
    is_freelancer = getattr(user, 'user_type', '') in ('freelancer', 'Freelancer')
    if is_freelancer:
        for field, weight in FREELANCER_FIELDS.items():
            total_weight += weight
            val = getattr(user, field, None)
            if field == "skills":
                if val and len(val) > 2:
                    earned_weight += weight
            elif field == "hourly_rate":
                if val and float(val) > 0:
                    earned_weight += weight
            else:
                if val:
                    earned_weight += weight

    if total_weight == 0:
        return 100
    return round((earned_weight / total_weight) * 100)


def get_missing_profile_fields(user: User) -> List[str]:
    """Get list of missing profile fields with descriptions"""
    missing = []

    if not (user.name or (user.first_name and user.last_name)):
        missing.append("name")

    if not user.bio or len(user.bio) <= 20:
        missing.append("bio (min 20 chars)")

    if not user.location:
        missing.append("location")

    if not getattr(user, 'profile_image_url', None):
        missing.append("profile photo")

    is_freelancer = getattr(user, 'user_type', '') in ('freelancer', 'Freelancer')
    if is_freelancer:
        if not user.skills or len(user.skills) <= 2:
            missing.append("skills")
        if not getattr(user, 'hourly_rate', None):
            missing.append("hourly rate")
        if not getattr(user, 'headline', None):
            missing.append("headline")
        if not getattr(user, 'experience_level', None):
            missing.append("experience level")
        if not getattr(user, 'languages', None):
            missing.append("languages")
        if not getattr(user, 'timezone', None):
            missing.append("timezone")

    return missing
