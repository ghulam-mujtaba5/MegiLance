# @AI-HINT: API v1 exports
from . import (
    health, users, auth, projects, proposals, contracts, portfolio, payments,
    client, upload, assessments, interviews, verification,
    analytics_pro, escrow_pro, notifications_pro, teams, audit, features,
    export_import, i18n, rate_limiting, webhooks, gamification, scheduler,
    reports, referrals, moderation, bulk_operations, saved_searches,
    activity_feed, api_keys, comments, file_versions, custom_fields,
    templates, calendar, organizations, notification_preferences, two_factor,
    email_templates, integrations, push_notifications, invoice_tax,
    contract_builder, skill_graph, social_login, timezone, backup_restore,
    portfolio_builder, compliance, achievement_system, learning_center,
    analytics_dashboard, marketplace, subscription_billing,
    legal_documents, knowledge_base, workflow_automation, messages,
    notifications, reviews, disputes, milestones, skills, admin,
    time_entries, invoices, escrow, categories, favorites, tags,
    support_tickets, refunds, search, websocket, uploads, portal_endpoints,
    analytics, job_alerts, ai_services, fraud_detection, stripe,
    user_feedback, custom_branding, audit_trail, career_development,
    referral_program, communication_center, metrics_dashboard,
    data_analytics_export, advanced_gamification, availability_calendar,
    review_responses, platform_compliance, notification_settings,
    search_analytics, rate_cards, proposal_templates, portfolio_showcase,
    notes_tags, custom_statuses, skill_taxonomy, search_advanced,
    realtime_notifications, ai_matching, security, video_communication, mock,
    # Version 2.0 features
    multicurrency, ai_advanced, admin_analytics,  # admin_fraud_alerts temporarily disabled
    # Billion Dollar Upgrade
    scope_change
)

# complete_integrations imported separately in routers.py to avoid circular import

__all__ = [
    "health", "users", "auth", "projects", "proposals", "contracts",
    "portfolio", "payments", "client", "upload", "assessments", "interviews",
    "verification", "analytics_pro", "escrow_pro", "notifications_pro",
    "teams", "audit", "features", "export_import", "i18n", "rate_limiting",
    "webhooks", "gamification", "scheduler", "reports", "referrals",
    "moderation", "bulk_operations", "saved_searches", "activity_feed",
    "api_keys", "comments", "file_versions", "custom_fields", "templates",
    "calendar", "organizations", "notification_preferences", "two_factor",
    "email_templates", "integrations", "push_notifications", "invoice_tax",
    "contract_builder", "skill_graph", "social_login", "timezone",
    "backup_restore", "portfolio_builder", "compliance", "achievement_system",
    "learning_center", "analytics_dashboard", "marketplace", "subscription_billing",
    "legal_documents", "knowledge_base", "workflow_automation",
    "messages", "notifications", "reviews", "disputes", "milestones", "skills",
    "admin", "time_entries", "invoices", "escrow", "categories", "favorites",
    "tags", "support_tickets", "refunds", "search", "websocket", "uploads",
    "portal_endpoints", "analytics", "job_alerts", "ai_services",
    "fraud_detection", "stripe", "user_feedback", "custom_branding",
    "audit_trail", "career_development", "referral_program",
    "communication_center", "metrics_dashboard", "data_analytics_export",
    "advanced_gamification", "availability_calendar", "review_responses",
    "platform_compliance", "notification_settings", "search_analytics",
    "rate_cards", "proposal_templates", "portfolio_showcase", "notes_tags",
    "custom_statuses", "skill_taxonomy", "search_advanced",
    "realtime_notifications", "ai_matching", "security", "video_communication",
    "mock", "multicurrency", "ai_advanced",
    "admin_analytics", "scope_change"  # admin_fraud_alerts temporarily disabled
]
