# @AI-HINT: Pydantic schemas for Portfolio API - item creation, update, and response models
from pydantic import BaseModel, ConfigDict, Field
from typing import Optional
from datetime import datetime

class PortfolioItemBase(BaseModel):
    title: str
    description: str
    image_url: str
    project_url: Optional[str] = None

class PortfolioItemCreate(PortfolioItemBase):
    pass

class PortfolioItemUpdate(PortfolioItemBase):
    title: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    project_url: Optional[str] = None

class PortfolioItemRead(PortfolioItemBase):
    id: int
    freelancer_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)