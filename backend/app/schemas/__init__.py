"""Initialize all schemas"""

from .auth import Token, TokenRefresh, AuthResponse
from .user import User, UserCreate, UserUpdate, UserLogin
from .skill import Skill, SkillCreate, SkillUpdate, UserSkill, UserSkillCreate, UserSkillUpdate
from .project import Project, ProjectCreate, ProjectUpdate, ProjectList
from .proposal import Proposal, ProposalCreate, ProposalUpdate
from .contract import Contract, ContractCreate, ContractUpdate
from .payment import Payment, PaymentCreate, PaymentUpdate
from .portfolio import PortfolioItem, PortfolioCreate, PortfolioUpdate
from .message import Message, MessageCreate, MessageUpdate, Conversation, ConversationCreate, ConversationUpdate
from .notification import Notification, NotificationCreate, NotificationUpdate, NotificationList
from .review import Review, ReviewCreate, ReviewUpdate, ReviewStats
from .dispute import Dispute, DisputeCreate, DisputeUpdate, DisputeList
from .milestone import Milestone, MilestoneCreate, MilestoneUpdate, MilestoneSubmit, MilestoneApprove

__all__ = [
    "Token",
    "TokenRefresh",
    "AuthResponse",
    "User",
    "UserCreate",
    "UserUpdate",
    "UserLogin",
    "Skill",
    "SkillCreate",
    "SkillUpdate",
    "UserSkill",
    "UserSkillCreate",
    "UserSkillUpdate",
    "Project",
    "ProjectCreate",
    "ProjectUpdate",
    "ProjectList",
    "Proposal",
    "ProposalCreate",
    "ProposalUpdate",
    "Contract",
    "ContractCreate",
    "ContractUpdate",
    "Payment",
    "PaymentCreate",
    "PaymentUpdate",
    "PortfolioItem",
    "PortfolioCreate",
    "PortfolioUpdate",
    "Message",
    "MessageCreate",
    "MessageUpdate",
    "Conversation",
    "ConversationCreate",
    "ConversationUpdate",
    "Notification",
    "NotificationCreate",
    "NotificationUpdate",
    "NotificationList",
    "Review",
    "ReviewCreate",
    "ReviewUpdate",
    "ReviewStats",
    "Dispute",
    "DisputeCreate",
    "DisputeUpdate",
    "DisputeList",
    "Milestone",
    "MilestoneCreate",
    "MilestoneUpdate",
    "MilestoneSubmit",
    "MilestoneApprove",
]
