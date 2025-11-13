"""Milestone models for MegiLance platform"""
from sqlalchemy import String, Integer, Text, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
from datetime import datetime
from typing import TYPE_CHECKING
import enum

if TYPE_CHECKING:
    from .contract import Contract

class MilestoneStatus(enum.Enum):
    """Milestone status enumeration"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    SUBMITTED = "submitted"
    APPROVED = "approved"
    REJECTED = "rejected"
    PAID = "paid"

class Milestone(Base):
    """
    Milestones table for contract milestones
    """
    __tablename__ = "milestones"

    id: Mapped[int] = mapped_column(primary_key=True)
    contract_id: Mapped[int] = mapped_column(ForeignKey("contracts.id"), index=True)
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text)
    amount: Mapped[float] = mapped_column(Float)
    due_date: Mapped[datetime] = mapped_column(DateTime)
    status: Mapped[str] = mapped_column(String(20), default=MilestoneStatus.PENDING.value, index=True)
    deliverables: Mapped[str] = mapped_column(Text, nullable=True)  # JSON string
    submitted_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    approved_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    paid_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    feedback: Mapped[str] = mapped_column(Text, nullable=True)
    order_index: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    contract: Mapped["Contract"] = relationship("Contract", back_populates="milestone_items")
