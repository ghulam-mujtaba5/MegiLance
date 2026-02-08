# @AI-HINT: Complete Admin Dashboard Service - Analytics, moderation, platform management
"""
Complete Admin Service featuring:
- Platform statistics and KPIs
- User management and moderation
- Fraud detection and risk scoring
- Payment reconciliation
- Report generation
- System health monitoring
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta, timezone
from app.db.turso_http import execute_query, parse_rows

class AdminService:
    """Complete admin functionality"""
    
    @staticmethod
    def get_platform_stats() -> Dict[str, Any]:
        """Get comprehensive platform statistics"""
        
        now = datetime.now(timezone.utc)
        week_ago = (now - timedelta(days=7)).isoformat()
        month_ago = (now - timedelta(days=30)).isoformat()
        
        # Total users
        users_result = execute_query(
            "SELECT COUNT(*) as total, role FROM users GROUP BY role",
            []
        )
        
        user_breakdown = {}
        total_users = 0
        if users_result and users_result.get("rows"):
            for row in parse_rows(users_result):
                role = row.get("role") or "unknown"
                count = row.get("total") or 0
                user_breakdown[role] = count
                total_users += count
        
        # Active projects
        projects_result = execute_query(
            """SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open,
                SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
               FROM projects""",
            []
        )
        
        project_stats = {}
        if projects_result and projects_result.get("rows"):
            row = parse_rows(projects_result)[0]
            project_stats = {
                "total": row.get("total") or 0,
                "open": row.get("open") or 0,
                "in_progress": row.get("in_progress") or 0,
                "completed": row.get("completed") or 0
            }
        
        # Payment stats
        payments_result = execute_query(
            """SELECT 
                COUNT(*) as total,
                SUM(amount) as total_volume,
                AVG(amount) as avg_amount,
                SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as completed_volume
               FROM payments
               WHERE created_at > ?""",
            [month_ago]
        )
        
        payment_stats = {}
        if payments_result and payments_result.get("rows"):
            row = parse_rows(payments_result)[0]
            payment_stats = {
                "total_transactions": row.get("total") or 0,
                "total_volume": row.get("total_volume") or 0,
                "avg_transaction": row.get("avg_amount") or 0,
                "completed_volume": row.get("completed_volume") or 0
            }
        
        # Recent activity
        recent_users = execute_query(
            "SELECT COUNT(*) as count FROM users WHERE created_at > ?",
            [week_ago]
        )
        
        new_users = 0
        if recent_users and recent_users.get("rows"):
            new_users = parse_rows(recent_users)[0].get("count") or 0
        
        return {
            "total_users": total_users,
            "user_breakdown": user_breakdown,
            "projects": project_stats,
            "payments": payment_stats,
            "new_users_this_week": new_users,
            "timestamp": now.isoformat()
        }
    
    @staticmethod
    def get_user_analytics(days: int = 30) -> Dict[str, Any]:
        """Get user growth and engagement analytics"""
        
        cutoff_date = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
        
        # User growth
        growth_result = execute_query(
            """SELECT 
                DATE(created_at) as signup_date,
                COUNT(*) as new_users,
                SUM(CASE WHEN user_type = 'freelancer' THEN 1 ELSE 0 END) as freelancers,
                SUM(CASE WHEN user_type = 'client' THEN 1 ELSE 0 END) as clients
               FROM users
               WHERE created_at > ?
               GROUP BY DATE(created_at)
               ORDER BY signup_date""",
            [cutoff_date]
        )
        
        daily_growth = []
        if growth_result and growth_result.get("rows"):
            for row in parse_rows(growth_result):
                daily_growth.append({
                    "date": row.get("signup_date"),
                    "new_users": row.get("new_users") or 0,
                    "freelancers": row.get("freelancers") or 0,
                    "clients": row.get("clients") or 0
                })
        
        # User retention
        active_result = execute_query(
            """SELECT 
                COUNT(DISTINCT u.id) as active_users,
                COUNT(DISTINCT CASE WHEN p.created_at > ? THEN p.client_id ELSE NULL END) as active_clients,
                COUNT(DISTINCT CASE WHEN pr.created_at > ? THEN pr.freelancer_id ELSE NULL END) as active_freelancers
               FROM users u
               LEFT JOIN projects p ON u.id = p.client_id
               LEFT JOIN proposals pr ON u.id = pr.freelancer_id
               WHERE u.last_activity > ?""",
            [cutoff_date, cutoff_date, cutoff_date]
        )
        
        retention = {}
        if active_result and active_result.get("rows"):
            row = parse_rows(active_result)[0]
            retention = {
                "active_users": row.get("active_users") or 0,
                "active_clients": row.get("active_clients") or 0,
                "active_freelancers": row.get("active_freelancers") or 0
            }
        
        return {
            "daily_growth": daily_growth,
            "retention": retention
        }
    
    @staticmethod
    def get_fraud_alerts() -> List[Dict[str, Any]]:
        """Get active fraud alerts and risk scores"""
        
        result = execute_query(
            """SELECT 
                u.id, u.name, u.email, u.created_at, u.account_balance,
                COUNT(DISTINCT fraud_flags.id) as flag_count,
                SUM(CASE WHEN fraud_flags.type = 'payment_chargeback' THEN 1 ELSE 0 END) as chargebacks,
                SUM(CASE WHEN fraud_flags.type = 'unusual_activity' THEN 1 ELSE 0 END) as unusual_activity
               FROM users u
               LEFT JOIN fraud_flags ON u.id = fraud_flags.user_id
               WHERE fraud_flags.id IS NOT NULL OR
                     (u.account_balance < -100) OR
                     (SELECT COUNT(*) FROM payments WHERE user_id = u.id AND status = 'failed') > 5
               GROUP BY u.id
               ORDER BY flag_count DESC
               LIMIT 100""",
            []
        )
        
        alerts = []
        if result and result.get("rows"):
            for row in parse_rows(result):
                risk_score = min(100, (row.get("flag_count") or 0) * 20 + (row.get("chargebacks") or 0) * 30)
                alerts.append({
                    "user_id": row.get("id"),
                    "name": row.get("name"),
                    "email": row.get("email"),
                    "risk_score": risk_score,
                    "flags": {
                        "total": row.get("flag_count") or 0,
                        "chargebacks": row.get("chargebacks") or 0,
                        "unusual_activity": row.get("unusual_activity") or 0
                    },
                    "balance": row.get("account_balance") or 0
                })
        
        return alerts
    
    @staticmethod
    def flag_user_for_review(
        user_id: int,
        reason: str,
        severity: str = "medium"
    ) -> bool:
        """Flag a user for manual review"""
        
        now = datetime.now(timezone.utc).isoformat()
        
        result = execute_query(
            """INSERT INTO fraud_flags (user_id, type, reason, severity, status, created_at)
               VALUES (?, ?, ?, ?, ?, ?)""",
            [user_id, "manual_review", reason, severity, "open", now]
        )
        
        return bool(result)
    
    @staticmethod
    def get_suspended_users(skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        """Get suspended/blocked users"""
        
        result = execute_query(
            """SELECT u.id, u.name, u.email, u.suspended_at, u.suspension_reason,
                      u.created_at, COUNT(DISTINCT p.id) as projects
               FROM users u
               LEFT JOIN projects p ON u.id = p.client_id
               WHERE u.is_active = 0 OR u.suspended_at IS NOT NULL
               GROUP BY u.id
               ORDER BY u.suspended_at DESC
               LIMIT ? OFFSET ?""",
            [limit, skip]
        )
        
        users = []
        if result and result.get("rows"):
            for row in parse_rows(result):
                users.append({
                    "id": row.get("id"),
                    "name": row.get("name"),
                    "email": row.get("email"),
                    "suspended_at": row.get("suspended_at"),
                    "reason": row.get("suspension_reason"),
                    "created_at": row.get("created_at"),
                    "projects": row.get("projects") or 0
                })
        
        return users
    
    @staticmethod
    def suspend_user(user_id: int, reason: str) -> bool:
        """Suspend a user account"""
        
        now = datetime.now(timezone.utc).isoformat()
        
        result = execute_query(
            """UPDATE users SET is_active = 0, suspended_at = ?, suspension_reason = ?
               WHERE id = ?""",
            [now, reason, user_id]
        )
        
        # Log action
        execute_query(
            """INSERT INTO admin_audit_log (action, target_user_id, details, created_at)
               VALUES (?, ?, ?, ?)""",
            ["suspend_user", user_id, reason, now]
        )
        
        return bool(result)
    
    @staticmethod
    def unsuspend_user(user_id: int) -> bool:
        """Unsuspend a user account"""
        
        now = datetime.now(timezone.utc).isoformat()
        
        result = execute_query(
            """UPDATE users SET is_active = 1, suspended_at = NULL, suspension_reason = NULL
               WHERE id = ?""",
            [user_id]
        )
        
        # Log action
        execute_query(
            """INSERT INTO admin_audit_log (action, target_user_id, created_at)
               VALUES (?, ?, ?)""",
            ["unsuspend_user", user_id, now]
        )
        
        return bool(result)
    
    @staticmethod
    def get_reported_content() -> List[Dict[str, Any]]:
        """Get content flagged for moderation"""
        
        result = execute_query(
            """SELECT * FROM content_reports WHERE status = 'pending'
               ORDER BY created_at ASC
               LIMIT 50""",
            []
        )
        
        reports = []
        if result and result.get("rows"):
            for row in parse_rows(result):
                reports.append({
                    "id": row.get("id"),
                    "content_type": row.get("content_type"),
                    "content_id": row.get("content_id"),
                    "reason": row.get("reason"),
                    "reporter_id": row.get("reporter_id"),
                    "status": row.get("status"),
                    "created_at": row.get("created_at")
                })
        
        return reports
    
    @staticmethod
    def moderate_content(
        report_id: int,
        action: str,  # "approve", "reject", "remove"
        admin_notes: str = ""
    ) -> bool:
        """Take moderation action on reported content"""
        
        now = datetime.now(timezone.utc).isoformat()
        
        result = execute_query(
            """UPDATE content_reports 
               SET status = ?, admin_notes = ?, updated_at = ?
               WHERE id = ?""",
            ["resolved", admin_notes, now, report_id]
        )
        
        return bool(result)


def get_admin_service() -> AdminService:
    """Factory function for admin service"""
    return AdminService()
