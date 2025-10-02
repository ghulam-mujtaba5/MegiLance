"""Review schemas for MegiLance platform"""
from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, Any
from datetime import datetime


class ReviewBase(BaseModel):
    """Base review schema"""
    rating: float = Field(..., ge=1.0, le=5.0)
    comment: Optional[str] = None
    rating_breakdown: Optional[Dict[str, float]] = None
    is_public: bool = True

    @validator('rating')
    def validate_rating(cls, v):
        if v < 1.0 or v > 5.0:
            raise ValueError('Rating must be between 1.0 and 5.0')
        return round(v, 1)


class ReviewCreate(ReviewBase):
    """Schema for creating a review"""
    contract_id: int
    reviewee_id: int


class ReviewUpdate(BaseModel):
    """Schema for updating a review"""
    rating: Optional[float] = Field(None, ge=1.0, le=5.0)
    comment: Optional[str] = None
    rating_breakdown: Optional[Dict[str, float]] = None
    is_public: Optional[bool] = None


class Review(ReviewBase):
    """Schema for review response"""
    id: int
    contract_id: int
    reviewer_id: int
    reviewee_id: int
    created_at: datetime
    updated_at: datetime
    response_to: Optional[int] = None

    class Config:
        from_attributes = True


class ReviewStats(BaseModel):
    """Schema for review statistics"""
    average_rating: float
    total_reviews: int
    rating_distribution: Dict[str, int]  # {5: 10, 4: 5, 3: 2, 2: 1, 1: 0}
