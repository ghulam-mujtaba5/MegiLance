# @AI-HINT: Pydantic schemas for User API - registration, profile update, and response models
from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator
from typing import Literal


class PortfolioItemSchema(BaseModel):
    title: str
    description: str
    url: Optional[str] = None
    imageUrl: Optional[str] = None
    tags: List[str] = []


class ProfileCompleteUpdate(BaseModel):
    """Schema for completing user profile during onboarding"""
    # Basic Info
    firstName: str
    lastName: str
    title: str
    bio: str
    location: Optional[str] = None
    timezone: str = "Asia/Karachi"
    
    # Professional Info
    skills: List[str]
    hourlyRate: str
    experienceLevel: str
    availability: str
    languages: List[str] = ["English"]
    
    # Portfolio
    portfolioItems: List[PortfolioItemSchema] = []
    
    # Verification
    phoneNumber: Optional[str] = None
    linkedinUrl: Optional[str] = None
    githubUrl: Optional[str] = None
    websiteUrl: Optional[str] = None


class UserBase(BaseModel):
    is_active: bool = True
    name: Optional[str] = None
    user_type: Optional[str] = Field(default=None, description="Freelancer, Client, Admin")
    bio: Optional[str] = None
    skills: Optional[List[str] | str] = None  # Can be list or JSON string
    hourly_rate: Optional[float] = None
    profile_image_url: Optional[str] = None
    location: Optional[str] = None
    title: Optional[str] = None
    portfolio_url: Optional[str] = None


class UserCreate(UserBase):
    email: EmailStr
    password: str
    role: Optional[str] = None  # Alias for user_type from frontend
    tos_accepted: bool = Field(default=False, description="User must accept Terms of Service")
    
    def __init__(self, **data):
        # Handle frontend 'role' field mapping to 'user_type'
        if 'role' in data and 'user_type' not in data:
            data['user_type'] = data.pop('role')
        super().__init__(**data)


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(default=None, min_length=8)
    is_active: Optional[bool] = None
    name: Optional[str] = None
    user_type: Optional[str] = None
    bio: Optional[str] = None
    skills: Optional[str] = None
    hourly_rate: Optional[float] = None
    profile_image_url: Optional[str] = None
    location: Optional[str] = None
    title: Optional[str] = None
    portfolio_url: Optional[str] = None
    full_name: Optional[str] = None # Alias for name
    availability_status: Optional[str] = Field(default=None, description="available, busy, or away")

    @field_validator('availability_status')
    @classmethod
    def validate_availability(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in ('available', 'busy', 'away'):
            raise ValueError("availability_status must be 'available', 'busy', or 'away'")
        return v


class UserRead(UserBase):
    id: int
    email: EmailStr
    role: Optional[str] = None
    joined_at: Optional[datetime] = None
    full_name: Optional[str] = None # Alias for name
    availability_status: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
