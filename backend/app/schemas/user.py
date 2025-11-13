from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, EmailStr, Field


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
    skills: Optional[str] = None  # JSON string of skills
    hourly_rate: Optional[float] = None
    profile_image_url: Optional[str] = None
    location: Optional[str] = None


class UserCreate(UserBase):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(default=None, min_length=6)
    is_active: Optional[bool] = None
    name: Optional[str] = None
    user_type: Optional[str] = None
    bio: Optional[str] = None
    skills: Optional[str] = None
    hourly_rate: Optional[float] = None
    profile_image_url: Optional[str] = None
    location: Optional[str] = None


class UserRead(UserBase):
    id: int
    email: EmailStr
    joined_at: datetime

    class Config:
        from_attributes = True