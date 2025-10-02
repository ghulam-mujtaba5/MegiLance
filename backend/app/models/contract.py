from sqlalchemy import String, Integer, Float, DateTime, Text, ForeignKey, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
from datetime import datetime
from typing import List, Optional, TYPE_CHECKING
import enum

if TYPE_CHECKING:
    from .user import User
    from .project import Project
    from .review import Review
    from .dispute import Dispute
    from .milestone import Milestone
    from .payment import Payment

class ContractStatus(enum.Enum):
    """Contract status enumeration"""
    PENDING = "pending"
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    DISPUTED = "disputed"
    TERMINATED = "terminated"
    REFUNDED = "refunded"

class Contract(Base):
    __tablename__ = "contracts"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    contract_address: Mapped[str] = mapped_column(String(100), unique=True, nullable=True)  # Blockchain contract address
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), index=True)
    freelancer_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    winning_bid_id: Mapped[int] = mapped_column(ForeignKey("proposals.id"), nullable=True)
    contract_amount: Mapped[float] = mapped_column(Float)  # USDC value
    platform_fee: Mapped[float] = mapped_column(Float, default=0.0)
    status: Mapped[str] = mapped_column(String(20), default=ContractStatus.PENDING.value, index=True)
    start_date: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    end_date: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    milestones: Mapped[str] = mapped_column(Text, nullable=True)  # JSON string of milestones
    terms: Mapped[str] = mapped_column(Text, nullable=True)  # JSON string of terms
    blockchain_hash: Mapped[str] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    project: Mapped["Project"] = relationship("Project")
    freelancer: Mapped["User"] = relationship("User", foreign_keys=[freelancer_id])
    client: Mapped["User"] = relationship("User", foreign_keys=[client_id])
    reviews: Mapped[List["Review"]] = relationship("Review", back_populates="contract")
    disputes: Mapped[List["Dispute"]] = relationship("Dispute", back_populates="contract")
    milestone_items: Mapped[List["Milestone"]] = relationship("Milestone", back_populates="contract")
    payments: Mapped[List["Payment"]] = relationship("Payment", back_populates="contract")