from fastapi import APIRouter
from .v1 import (
    health, users, mock, projects, proposals, contracts, portfolio, payments, 
    auth, client, upload, assessments, interviews, verification,
    analytics_pro, escrow_pro, notifications_pro, teams, audit, features,
    export_import, i18n, rate_limiting, webhooks, scheduler, reports, referrals, moderation,
    bulk_operations, saved_searches, activity_feed, api_keys, comments, file_versions, custom_fields,
    templates, calendar, organizations, notification_preferences, two_factor, email_templates, integrations,
    push_notifications, invoice_tax, contract_builder, skill_graph,
    social_login, timezone, backup_restore,
    portfolio_builder, compliance, learning_center,
    analytics_dashboard, marketplace,
    subscription_billing, legal_documents, knowledge_base, workflow_automation,
    messages, notifications, reviews, disputes, milestones, skills, admin,
    time_entries, invoices, escrow, categories, favorites, tags, support_tickets, refunds, search,
    websocket, uploads, portal_endpoints, analytics, job_alerts, ai_services, fraud_detection, stripe, chatbot,
    # New enterprise features
    user_feedback, custom_branding, audit_trail, career_development,
    referral_program, communication_center, metrics_dashboard, data_analytics_export,
    availability_calendar, review_responses, platform_compliance,
    notification_settings, search_analytics, rate_cards, proposal_templates,
    portfolio_showcase, notes_tags, custom_statuses, skill_taxonomy, search_advanced, realtime_notifications,
    ai_matching,
    # Version 2.0 Advanced Features
    security, video_communication,
    # Now enabled - all modules working
    multicurrency, ai_advanced, admin_fraud_alerts, admin_analytics,
    # AI Writing Assistant
    ai_writing,
    # Billion Dollar Upgrade Features
    scope_change, wallet, community, workroom, feature_flags,
    # Pakistan Payments - USDC, JazzCash, EasyPaisa, Wise, Payoneer
    pakistan_payments,
    # Blog & News
    blog,
    # Public clients showcase
    public_clients,
    # Fiverr/Upwork Feature Parity - Gig Marketplace & Seller Tiers
    gigs, seller_stats, talent_invitations
)
# Import separately to avoid circular import in Python 3.13
from .v1 import complete_integrations


api_router = APIRouter()

# Core services
api_router.include_router(health.router, prefix="/health", tags=["health"]) 
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(websocket.router, prefix="/ws", tags=["websocket"])  # WebSocket status

# User management
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(skills.router, prefix="/skills", tags=["skills"])
api_router.include_router(job_alerts.router, prefix="/job-alerts", tags=["job-alerts"])
api_router.include_router(admin.router, prefix="", tags=["admin"])  # Admin endpoints

# Project workflow
api_router.include_router(projects.router, prefix="/projects", tags=["projects"])
api_router.include_router(proposals.router, prefix="/proposals", tags=["proposals"])
api_router.include_router(contracts.router, prefix="/contracts", tags=["contracts"])
api_router.include_router(milestones.router, prefix="/milestones", tags=["milestones"])
api_router.include_router(scope_change.router, prefix="/scope-changes", tags=["scope-changes"])

# Communication
api_router.include_router(messages.router, prefix="", tags=["messages"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])

# Reviews and disputes
api_router.include_router(reviews.router, prefix="/reviews", tags=["reviews"])
api_router.include_router(disputes.router, prefix="/disputes", tags=["disputes"])

# Payments and portfolio
api_router.include_router(payments.router, prefix="/payments", tags=["payments"])
api_router.include_router(stripe.router, prefix="/stripe", tags=["stripe"])
api_router.include_router(portfolio.router, prefix="/portfolio", tags=["portfolio"])
api_router.include_router(wallet.router, prefix="/wallet", tags=["wallet"])

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
api_router.include_router(search_advanced.router, prefix="", tags=["search-advanced"])  # Turso FTS5 search

# Real-time notifications
api_router.include_router(realtime_notifications.router, prefix="/realtime", tags=["realtime"])

# AI-powered matching
api_router.include_router(ai_matching.router, prefix="", tags=["ai-matching"])

# Analytics and reporting
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])

# Advanced Analytics Pro - ML predictions and BI
api_router.include_router(analytics_pro.router, prefix="/analytics-pro", tags=["analytics-pro"])

# AI Services - temporarily disabled for stability
# api_router.include_router(ai.router, prefix="/ai", tags=["ai"])

# File uploads and client tools
api_router.include_router(uploads.router, prefix="/uploads", tags=["uploads"])
api_router.include_router(upload.router, prefix="/upload", tags=["upload"])
api_router.include_router(client.router, prefix="/client", tags=["client"])

# AI services
api_router.include_router(ai_services.router, prefix="/ai", tags=["ai"])

# Smart AI Matching - ML-powered freelancer-job matching
# api_router.include_router(matching.router, prefix="/matching", tags=["matching"])

# Skill Assessments - Professional skill verification
api_router.include_router(assessments.router, prefix="/assessments", tags=["assessments"])

# Smart Pricing - ML-powered pricing intelligence
# api_router.include_router(pricing.router, prefix="/pricing", tags=["pricing"])

# Video Interviews - WebRTC video calling
api_router.include_router(interviews.router, prefix="/interviews", tags=["interviews"])

# Identity Verification - KYC workflow
api_router.include_router(verification.router, prefix="/verification", tags=["verification"])

# Portal endpoints (client and freelancer dashboards)
api_router.include_router(portal_endpoints.router, prefix="/portal", tags=["portals"])

# Advanced Escrow Pro - Stripe integration with milestones
api_router.include_router(escrow_pro.router, prefix="/escrow-pro", tags=["escrow-pro"])

# Notification Center Pro - Multi-channel notifications
api_router.include_router(notifications_pro.router, prefix="/notifications-pro", tags=["notifications-pro"])

# AI Chatbot - Intelligent support automation
api_router.include_router(chatbot.router, prefix="/chatbot", tags=["chatbot"])

# Team Collaboration - Agency and team management
api_router.include_router(teams.router, prefix="/teams", tags=["teams"])

# Audit Trail - Compliance and security logging
api_router.include_router(audit.router, prefix="/audit", tags=["audit"])

# Feature Flags & A/B Testing - Controlled rollout (disabled due to Python 3.14 compat)
# api_router.include_router(features.router, prefix="/features", tags=["features"])

# Recommendation Engine - AI-powered suggestions
# api_router.include_router(recommendations.router, prefix="/recommendations", tags=["recommendations"])

# Export/Import - Data portability and GDPR compliance
api_router.include_router(export_import.router, prefix="/export-import", tags=["export-import"])

# Internationalization (i18n) - Multi-language support
api_router.include_router(i18n.router, prefix="/i18n", tags=["i18n"])

# Rate Limiting Pro - Advanced API rate limiting
api_router.include_router(rate_limiting.router, prefix="/rate-limits", tags=["rate-limits"])

# Webhooks - Third-party integrations
api_router.include_router(webhooks.router, prefix="/webhooks", tags=["webhooks"])

# Background Task Scheduler - Job queue management
api_router.include_router(scheduler.router, prefix="/scheduler", tags=["scheduler"])

# Report Generation - PDF/Excel exports
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])

# Referral System - User acquisition rewards
api_router.include_router(referrals.router, prefix="/referrals", tags=["referrals"])

# Content Moderation - AI-powered content safety
api_router.include_router(moderation.router, prefix="/moderation", tags=["moderation"])

# Bulk Operations - Batch processing
api_router.include_router(bulk_operations.router, prefix="/bulk", tags=["bulk-operations"])

# Saved Searches - Persistent search queries
api_router.include_router(saved_searches.router, prefix="/saved-searches", tags=["saved-searches"])

# Activity Feed - User timeline and social features
api_router.include_router(activity_feed.router, prefix="/activity", tags=["activity-feed"])

# API Keys - Developer API management
api_router.include_router(api_keys.router, prefix="/api-keys", tags=["api-keys"])

# Comments - Threaded discussions
api_router.include_router(comments.router, prefix="/comments", tags=["comments"])

# File Versions - Document version control
api_router.include_router(file_versions.router, prefix="/file-versions", tags=["file-versions"])

# Custom Fields - Dynamic entity metadata
api_router.include_router(custom_fields.router, prefix="/custom-fields", tags=["custom-fields"])

# Templates - Reusable project/proposal/contract templates
api_router.include_router(templates.router, tags=["templates"])

# Calendar - Meeting scheduling and availability
# TEMPORARILY DISABLED - calendar.py shadows built-in calendar module
# api_router.include_router(calendar.router, tags=["calendar"])

# Organizations - Multi-tenant workspace management
api_router.include_router(organizations.router, tags=["organizations"])

# Notification Preferences - Granular notification settings
api_router.include_router(notification_preferences.router, tags=["notification-preferences"])

# Two-Factor Authentication - TOTP 2FA with backup codes
api_router.include_router(two_factor.router, tags=["two-factor"])

# Email Templates - Customizable email templates
api_router.include_router(email_templates.router, tags=["email-templates"])

# Integrations Hub - Third-party service integrations
api_router.include_router(integrations.router, tags=["integrations"])

# Mobile Push Notifications - FCM/APNs
api_router.include_router(push_notifications.router, tags=["push-notifications"])

# Invoice & Tax Management - Professional invoicing
api_router.include_router(invoice_tax.router, tags=["invoice-tax"])

# Contract Builder - Visual contract creation
api_router.include_router(contract_builder.router, tags=["contract-builder"])

# Skill Graph - Skill relationships and endorsements
api_router.include_router(skill_graph.router, tags=["skill-graph"])

# AI Writing Assistant - Content generation
api_router.include_router(ai_writing.router, prefix="/ai-writing", tags=["ai-writing"])

# Social Login - OAuth2 social authentication
api_router.include_router(social_login.router, tags=["social-login"])

# Timezone Management - Smart timezone handling
api_router.include_router(timezone.router, tags=["timezone"])

# Backup & Restore - Data backup and restoration
api_router.include_router(backup_restore.router, tags=["backup-restore"])

# Portfolio Builder - Professional portfolio creation
api_router.include_router(portfolio_builder.router, tags=["portfolio-builder"])

# Compliance Center - GDPR and regulatory compliance
api_router.include_router(compliance.router, tags=["compliance"])

# Learning Center - Tutorials and courses
api_router.include_router(learning_center.router, tags=["learning-center"])

# Fraud Detection - AI-powered fraud prevention
api_router.include_router(fraud_detection.router, tags=["fraud-detection"])

# Analytics Dashboard - Business intelligence
api_router.include_router(analytics_dashboard.router, tags=["analytics-dashboard"])

# Marketplace - Advanced search and discovery
api_router.include_router(marketplace.router, tags=["marketplace"])

# Subscription & Billing - Premium plans and payments
api_router.include_router(subscription_billing.router, tags=["subscriptions"])

# Multi-Currency - Enabled
# api_router.include_router(multi_currency.router, tags=["currencies"])

# Legal Document Center - NDAs, contracts, e-signatures
api_router.include_router(legal_documents.router, tags=["legal-documents"])

# Knowledge Base & FAQ - Help center
api_router.include_router(knowledge_base.router, tags=["knowledge-base"])

# Workflow Automation - Triggers and automated actions
api_router.include_router(workflow_automation.router, tags=["workflows"])

# User Feedback - NPS surveys and feature requests
api_router.include_router(user_feedback.router, tags=["user-feedback"])

# Custom Branding - White-label support
api_router.include_router(custom_branding.router, tags=["branding"])

# Audit Trail - Comprehensive activity logging
api_router.include_router(audit_trail.router, tags=["audit-trail"])

# Career Development - Skill growth and career paths
api_router.include_router(career_development.router, tags=["career"])

# Referral Program - User acquisition and rewards
api_router.include_router(referral_program.router, tags=["referral-program"])

# Communication Center - Multi-channel messaging
api_router.include_router(communication_center.router, tags=["communications"])

# Metrics Dashboard - Real-time business metrics
api_router.include_router(metrics_dashboard.router, tags=["metrics"])

# Data Analytics Export - BI and reporting exports
api_router.include_router(data_analytics_export.router, tags=["data-export"])

# Availability Calendar - Freelancer scheduling
api_router.include_router(availability_calendar.router, tags=["availability"])

# Review Responses - Business owner replies
api_router.include_router(review_responses.router, tags=["review-responses"])

# Platform Compliance - GDPR, HIPAA, SOC2
api_router.include_router(platform_compliance.router, tags=["platform-compliance"])

# Notification Settings - Granular notification preferences
api_router.include_router(notification_settings.router, tags=["notification-settings"])

# Search Analytics - Search insights and optimization
api_router.include_router(search_analytics.router, tags=["search-analytics"])

# Rate Cards - Freelancer pricing structures
api_router.include_router(rate_cards.router, tags=["rate-cards"])

# Proposal Templates - Reusable proposal templates
api_router.include_router(proposal_templates.router, tags=["proposal-templates"])

# Portfolio Showcase - Advanced portfolio features
api_router.include_router(portfolio_showcase.router, tags=["portfolio-showcase"])

# Notes & Tags - Organization and metadata
api_router.include_router(notes_tags.router, tags=["notes-tags"])

# Custom Statuses - Workflow customization
api_router.include_router(custom_statuses.router, tags=["custom-statuses"])

# Skill Taxonomy - Hierarchical skill management
api_router.include_router(skill_taxonomy.router, tags=["skill-taxonomy"])

# ========================================
# VERSION 2.0 ADVANCED FEATURES
# ========================================

# Advanced Security - MFA, risk-based auth, session management
api_router.include_router(security.router, prefix="/security", tags=["security-advanced"])

# Video Communication - WebRTC calls, screen sharing, whiteboard
api_router.include_router(video_communication.router, prefix="/video", tags=["video"])

# Multi-Currency Payments
api_router.include_router(multicurrency.router, prefix="/multicurrency", tags=["multicurrency"])

# Advanced AI - ML-powered features
api_router.include_router(ai_advanced.router, prefix="/ai-advanced", tags=["ai-advanced"])

# Admin Fraud Alerts - Real-time fraud monitoring
api_router.include_router(admin_fraud_alerts.router, prefix="/admin/fraud-alerts", tags=["admin-fraud"])

# Admin Analytics - Dashboard and insights
api_router.include_router(admin_analytics.router, prefix="/admin", tags=["admin-analytics"])

# ========================================
# BILLION DOLLAR UPGRADE FEATURES
# ========================================

# Community Hub - Q&A, Playbooks, Office Hours
api_router.include_router(community.router, prefix="/community", tags=["community"])

# Collaboration Workroom - Kanban, Files, Discussions
api_router.include_router(workroom.router, prefix="/workroom", tags=["workroom"])

# Feature Flags - A/B Testing and gradual rollouts
api_router.include_router(feature_flags.router, tags=["feature-flags"])

# Pakistan Payments - USDC, JazzCash, EasyPaisa, AirTM, Wise, Payoneer
# Stripe is NOT available in Pakistan - these are the alternatives
api_router.include_router(pakistan_payments.router, prefix="/pk-payments", tags=["pakistan-payments"])

# Mock endpoints (DISABLED - using real database endpoints)
# api_router.include_router(mock.router, prefix="", tags=["mock"])

# ============================================================================
# COMPLETE IMPLEMENTATIONS WITH TURSO SUPPORT - All fixed endpoints
# ============================================================================
api_router.include_router(complete_integrations.router, prefix="", tags=["complete-integrations"])

# Blog & News
api_router.include_router(blog.router, prefix="/blog", tags=["blog"])

# Public clients showcase (no auth required)
api_router.include_router(public_clients.router, tags=["public-clients"])

# ============================================================================
# FIVERR/UPWORK FEATURE PARITY - Gig Marketplace & Seller Tier System
# ============================================================================

# Gig Marketplace - Fiverr-style service packages with 3-tier pricing
api_router.include_router(gigs.router, prefix="/gigs", tags=["gigs"])

# Seller Stats & Tier System - Bronze to Platinum levels with JSS algorithm
api_router.include_router(seller_stats.router, prefix="/seller-stats", tags=["seller-stats"])

# Talent Invitations - Upwork-style invite-to-bid system
api_router.include_router(talent_invitations.router, prefix="/invitations", tags=["talent-invitations"])