from fastapi import APIRouter
from .v1 import (
    health, users, mock, projects, proposals, contracts, portfolio, payments, 
    auth, client, upload, ai_services,
    messages, notifications, reviews, disputes, milestones, skills
)


api_router = APIRouter()

# Core services
api_router.include_router(health.router, prefix="/health", tags=["health"]) 
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])

# User management
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(skills.router, prefix="/api", tags=["skills"])

# Project workflow
api_router.include_router(projects.router, prefix="/projects", tags=["projects"])
api_router.include_router(proposals.router, prefix="/proposals", tags=["proposals"])
api_router.include_router(contracts.router, prefix="/contracts", tags=["contracts"])
api_router.include_router(milestones.router, prefix="/api", tags=["milestones"])

# Communication
api_router.include_router(messages.router, prefix="/api", tags=["messages"])
api_router.include_router(notifications.router, prefix="/api", tags=["notifications"])

# Reviews and disputes
api_router.include_router(reviews.router, prefix="/api", tags=["reviews"])
api_router.include_router(disputes.router, prefix="/api", tags=["disputes"])

# Payments and portfolio
api_router.include_router(payments.router, prefix="/payments", tags=["payments"])
api_router.include_router(portfolio.router, prefix="/portfolio", tags=["portfolio"])

# File uploads and client tools
api_router.include_router(upload.router, prefix="/upload", tags=["upload"])
api_router.include_router(client.router, prefix="/client", tags=["client"])

# AI services (excluded from implementation but keeping route)
api_router.include_router(ai_services.router, prefix="/ai", tags=["ai"])

# Mock endpoints
api_router.include_router(mock.router, prefix="", tags=["mock"])