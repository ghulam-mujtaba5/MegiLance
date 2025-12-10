# @AI-HINT: Gig FAQ model for frequently asked questions on gigs
"""Gig FAQ model for frequently asked questions."""

from sqlalchemy import String, Integer, DateTime, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
from datetime import datetime
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .gig import Gig


class GigFAQ(Base):
    """
    Gig FAQ model for frequently asked questions that sellers can add to their gigs.
    """
    __tablename__ = "gig_faqs"

    id: Mapped[int] = mapped_column(primary_key=True)
    
    gig_id: Mapped[int] = mapped_column(ForeignKey("gigs.id"), index=True)
    
    question: Mapped[str] = mapped_column(String(500))
    answer: Mapped[str] = mapped_column(Text)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    gig: Mapped["Gig"] = relationship("Gig", back_populates="faqs")

    def __repr__(self):
        return f"<GigFAQ {self.id}: {self.question[:50]}...>"
