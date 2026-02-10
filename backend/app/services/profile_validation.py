# @AI-HINT: Profile completeness validation service - checks required fields before user actions
from typing import List, Dict, Any, Optional
from app.models.user import User

def is_profile_complete(user: User) -> bool:
    """
    Check if user profile is complete enough to perform actions.
    
    Required fields:
    - name (or first_name + last_name)
    - bio
    - skills (for freelancers)
    - location
    """
    # Check basic info
    has_name = bool(user.name or (user.first_name and user.last_name))
    has_bio = bool(user.bio and len(user.bio) > 20)  # Minimum bio length
    has_location = bool(user.location)
    
    if not (has_name and has_bio and has_location):
        return False
        
    # Role specific checks
    if user.user_type == "freelancer":
        # Freelancers must have skills
        # skills is stored as JSON string or comma-separated string in DB
        has_skills = bool(user.skills and len(user.skills) > 2)
        if not has_skills:
            return False
            
    return True

def get_missing_profile_fields(user: User) -> List[str]:
    """Get list of missing profile fields"""
    missing = []
    
    if not (user.name or (user.first_name and user.last_name)):
        missing.append("name")
    
    if not user.bio or len(user.bio) <= 20:
        missing.append("bio (min 20 chars)")
        
    if not user.location:
        missing.append("location")
        
    if user.user_type == "freelancer":
        if not user.skills or len(user.skills) <= 2:
            missing.append("skills")
            
    return missing
