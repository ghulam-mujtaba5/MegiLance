from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class ContractBase(BaseModel):
    amount: float = Field(gt=0, description="Contract amount in USDC")
    description: Optional[str] = Field(None, description="Contract description")
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    milestones: Optional[str] = Field(None, description="JSON string of milestones")
    terms: Optional[str] = Field(None, description="JSON string of contract terms")


class ContractCreate(BaseModel):
    project_id: int
    freelancer_id: int
    amount: float = Field(gt=0)
    description: Optional[str] = Field(None, min_length=10)
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    milestones: Optional[str] = None
    terms: Optional[str] = None


class ContractUpdate(BaseModel):
    amount: Optional[float] = Field(None, gt=0)
    description: Optional[str] = Field(None, min_length=10)
    status: Optional[str] = None
    milestones: Optional[str] = None
    terms: Optional[str] = None
    end_date: Optional[datetime] = None


class ContractRead(ContractBase):
    id: str
    project_id: int
    freelancer_id: int
    client_id: int
    status: str
    contract_amount: Optional[float] = None
    platform_fee: Optional[float] = None
    created_at: datetime
    updated_at: datetime
    job_title: Optional[str] = None
    client_name: Optional[str] = None

    class Config:
        from_attributes = True
