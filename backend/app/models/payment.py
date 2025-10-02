from sqlalchemy import String, Integer, Float, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
from datetime import datetime
from typing import Optional, TYPE_CHECKING
import enum

if TYPE_CHECKING:
    from .user import User
    from .contract import Contract
    from .milestone import Milestone

class PaymentType(enum.Enum):
    """Payment type enumeration"""
    MILESTONE = "milestone"
    PROJECT = "project"
    REFUND = "refund"
    WITHDRAWAL = "withdrawal"
    DEPOSIT = "deposit"

class PaymentStatus(enum.Enum):
    """Payment status enumeration"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"
    CANCELLED = "cancelled"

class PaymentMethod(enum.Enum):
    """Payment method enumeration"""
    USDC = "usdc"
    BTC = "btc"
    ETH = "eth"
    USDT = "usdt"

class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    contract_id: Mapped[int] = mapped_column(ForeignKey("contracts.id"), nullable=True, index=True)
    milestone_id: Mapped[int] = mapped_column(ForeignKey("milestones.id"), nullable=True, index=True)
    from_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    to_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    amount: Mapped[float] = mapped_column(Float)
    payment_type: Mapped[str] = mapped_column(String(20), default=PaymentType.PROJECT.value, index=True)
    payment_method: Mapped[str] = mapped_column(String(20), default=PaymentMethod.USDC.value)
    status: Mapped[str] = mapped_column(String(20), default=PaymentStatus.PENDING.value, index=True)
    transaction_id: Mapped[str] = mapped_column(String(200), nullable=True, unique=True)
    blockchain_tx_hash: Mapped[str] = mapped_column(String(200), nullable=True)  # Blockchain transaction hash
    payment_details: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    platform_fee: Mapped[float] = mapped_column(Float, default=0.0)
    freelancer_amount: Mapped[float] = mapped_column(Float)  # Amount after platform fee
    description: Mapped[str] = mapped_column(Text, nullable=True)
    processed_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    contract: Mapped[Optional["Contract"]] = relationship("Contract", back_populates="payments")
    milestone: Mapped[Optional["Milestone"]] = relationship("Milestone")
    from_user: Mapped["User"] = relationship("User", foreign_keys=[from_user_id])
    to_user: Mapped["User"] = relationship("User", foreign_keys=[to_user_id])