from sqlalchemy import String, Boolean, Integer, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
from datetime import datetime
from typing import List, Optional
import enum

class UserType(enum.Enum):
    """User type enumeration"""
    FREELANCER = "freelancer"
    CLIENT = "client"
    ADMIN = "admin"

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    first_name: Mapped[str] = mapped_column(String(100), nullable=True)
    last_name: Mapped[str] = mapped_column(String(100), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    name: Mapped[str] = mapped_column(String(255), nullable=True)
    role: Mapped[str] = mapped_column(String(50), nullable=False, default="client")  # Role for authorization
    user_type: Mapped[str] = mapped_column(String(20), nullable=True, index=True)  # Freelancer, Client
    bio: Mapped[str] = mapped_column(Text, nullable=True)
    skills: Mapped[str] = mapped_column(Text, nullable=True)  # JSON string of skills
    hourly_rate: Mapped[float] = mapped_column(Float, nullable=True)
    profile_image_url: Mapped[str] = mapped_column(String(500), nullable=True)
    location: Mapped[str] = mapped_column(String(100), nullable=True)
    profile_data: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON string for Oracle compatibility
    account_balance: Mapped[float] = mapped_column(Float, default=0.0)
    created_by: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=True)
    joined_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user_skills: Mapped[List["UserSkill"]] = relationship("UserSkill", foreign_keys="UserSkill.user_id", back_populates="user")
    notifications: Mapped[List["Notification"]] = relationship("Notification", back_populates="user")
    received_reviews: Mapped[List["Review"]] = relationship("Review", foreign_keys="Review.reviewee_id", back_populates="reviewee")
    sessions: Mapped[List["UserSession"]] = relationship("UserSession", back_populates="user")
    audit_logs: Mapped[List["AuditLog"]] = relationship("AuditLog", back_populates="user")