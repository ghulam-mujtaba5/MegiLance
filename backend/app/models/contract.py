from sqlalchemy import String, Integer, Float, DateTime, Text, ForeignKey, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
from datetime import datetime, timezone
from typing import List, Optional, TYPE_CHECKING
import enum

if TYPE_CHECKING:
    from .user import User
    from .project import Project
    from .review import Review
    from .dispute import Dispute
    from .milestone import Milestone
    from .payment import Payment
    from .escrow import Escrow
    from .time_entry import TimeEntry
    from .invoice import Invoice

class ContractStatus(enum.Enum):
    """Contract status enumeration"""
    PENDING = "pending"
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    DISPUTED = "disputed"
    TERMINATED = "terminated"
    REFUNDED = "refunded"

class ContractType(enum.Enum):
    """Contract type enumeration"""
    FIXED = "fixed"
    HOURLY = "hourly"
    RETAINER = "retainer"

class Contract(Base):
    __tablename__ = "contracts"

    id: Mapped[int] = mapped_column(primary_key=True)
    contract_address: Mapped[str] = mapped_column(String(100), unique=True, nullable=True)  # Blockchain contract address
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), index=True)
    freelancer_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    winning_bid_id: Mapped[int] = mapped_column(ForeignKey("proposals.id"), nullable=True)
    
    # Financials
    contract_type: Mapped[str] = mapped_column(String(20), default=ContractType.FIXED.value, index=True)
    amount: Mapped[float] = mapped_column(Float, nullable=False)  # Total contract amount / Budget cap
    currency: Mapped[str] = mapped_column(String(10), default="USD")
    hourly_rate: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    retainer_amount: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    retainer_frequency: Mapped[Optional[str]] = mapped_column(String(20), nullable=True) # weekly, monthly
    
    contract_amount: Mapped[float] = mapped_column(Float)  # USDC value (Legacy/Crypto specific)
    platform_fee: Mapped[float] = mapped_column(Float, default=0.0)
    status: Mapped[str] = mapped_column(String(20), default=ContractStatus.PENDING.value, index=True)
    start_date: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    end_date: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    milestones: Mapped[str] = mapped_column(Text, nullable=True)  # JSON string of milestones
    terms: Mapped[str] = mapped_column(Text, nullable=True)  # JSON string of terms
    blockchain_hash: Mapped[str] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    project: Mapped["Project"] = relationship("Project")
    freelancer: Mapped["User"] = relationship("User", foreign_keys=[freelancer_id])
    client: Mapped["User"] = relationship("User", foreign_keys=[client_id])
    escrow_records: Mapped[List["Escrow"]] = relationship("Escrow", back_populates="contract")
    time_entries: Mapped[List["TimeEntry"]] = relationship("TimeEntry", back_populates="contract")
    invoices: Mapped[List["Invoice"]] = relationship("Invoice", back_populates="contract")
    reviews: Mapped[List["Review"]] = relationship("Review", back_populates="contract")
    disputes: Mapped[List["Dispute"]] = relationship("Dispute", back_populates="contract")
    milestone_items: Mapped[List["Milestone"]] = relationship("Milestone", back_populates="contract")
    payments: Mapped[List["Payment"]] = relationship("Payment", back_populates="contract")