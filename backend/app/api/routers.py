from fastapi import APIRouter
from .v1 import (
    health, users, mock, projects, proposals, contracts, portfolio, payments, 
    auth, client, upload, ai_services, ai,
    messages, notifications, reviews, disputes, milestones, skills, admin,
    time_entries, invoices, escrow, categories, favorites, tags, support_tickets, refunds, search,
    websocket, uploads, portal_endpoints, analytics  # stripe temporarily disabled
)


api_router = APIRouter()

# Core services
api_router.include_router(health.router, prefix="/health", tags=["health"]) 
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(websocket.router, prefix="/ws", tags=["websocket"])  # WebSocket status

# User management
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(skills.router, prefix="/skills", tags=["skills"])
api_router.include_router(admin.router, prefix="", tags=["admin"])  # Admin endpoints

# Project workflow
api_router.include_router(projects.router, prefix="/projects", tags=["projects"])
api_router.include_router(proposals.router, prefix="/proposals", tags=["proposals"])
api_router.include_router(contracts.router, prefix="/contracts", tags=["contracts"])
api_router.include_router(milestones.router, prefix="/milestones", tags=["milestones"])

# Communication
api_router.include_router(messages.router, prefix="", tags=["messages"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])

# Reviews and disputes
api_router.include_router(reviews.router, prefix="/reviews", tags=["reviews"])
api_router.include_router(disputes.router, prefix="/disputes", tags=["disputes"])

# Payments and portfolio
api_router.include_router(payments.router, prefix="/payments", tags=["payments"])
# api_router.include_router(stripe.router, prefix="/stripe", tags=["stripe"])  # Stripe temporarily disabled - import error
api_router.include_router(portfolio.router, prefix="/portfolio", tags=["portfolio"])

# Time tracking, invoices, and escrow
api_router.include_router(time_entries.router, prefix="", tags=["time-tracking"])
api_router.include_router(invoices.router, prefix="", tags=["invoices"])
api_router.include_router(escrow.router, prefix="", tags=["escrow"])

# Categories, tags, and favorites
api_router.include_router(categories.router, prefix="", tags=["categories"])
api_router.include_router(tags.router, prefix="", tags=["tags"])
api_router.include_router(favorites.router, prefix="", tags=["favorites"])

# Support and refunds
api_router.include_router(support_tickets.router, prefix="", tags=["support"])
api_router.include_router(refunds.router, prefix="", tags=["refunds"])

# Search functionality
api_router.include_router(search.router, prefix="", tags=["search"])

# Analytics and reporting
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])

# AI Services
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])

# File uploads and client tools
api_router.include_router(uploads.router, prefix="/uploads", tags=["uploads"])
api_router.include_router(upload.router, prefix="/upload", tags=["upload"])
api_router.include_router(client.router, prefix="/client", tags=["client"])

# AI services (excluded from implementation but keeping route)
api_router.include_router(ai_services.router, prefix="/ai", tags=["ai"])

# Portal endpoints (client and freelancer dashboards)
api_router.include_router(portal_endpoints.router, prefix="", tags=["portals"])

# Mock endpoints (DISABLED - using real database endpoints)
# api_router.include_router(mock.router, prefix="", tags=["mock"])