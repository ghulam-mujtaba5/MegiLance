"""Review models for MegiLance platform"""
from sqlalchemy import String, Integer, Text, Boolean, DateTime, ForeignKey, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
from datetime import datetime
from typing import Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from .user import User
    from .contract import Contract

class Review(Base):
    """
    Reviews table for contract reviews and ratings
    """
    __tablename__ = "reviews"

    id: Mapped[int] = mapped_column(primary_key=True)
    contract_id: Mapped[int] = mapped_column(ForeignKey("contracts.id"), index=True)
    reviewer_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    reviewee_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    rating: Mapped[float] = mapped_column(Float)  # 1-5 rating
    comment: Mapped[str] = mapped_column(Text, nullable=True)
    rating_breakdown: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # Skills, communication, quality, etc. (JSON string for Oracle)
    is_public: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    response_to: Mapped[int] = mapped_column(ForeignKey("reviews.id"), nullable=True)  # For review responses

    # Relationships
    contract: Mapped["Contract"] = relationship("Contract", back_populates="reviews")
    reviewer: Mapped["User"] = relationship("User", foreign_keys=[reviewer_id])
    reviewee: Mapped["User"] = relationship("User", foreign_keys=[reviewee_id], back_populates="received_reviews")
    response: Mapped[Optional["Review"]] = relationship("Review", remote_side=[id])
