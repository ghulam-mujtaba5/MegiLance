# @AI-HINT: Service layer for analytics router - all execute_query calls for admin analytics CRUD
"""
Analytics Service - Data access for admin analytics endpoints.
Provides user, project, revenue, freelancer, client, and platform analytics.
Separate from advanced_analytics.py (ML/SQLAlchemy) and analytics_dashboard.py (dashboard widgets).
"""

from datetime import datetime, timedelta, timezone
from typing import List, Optional, Dict, Any

from app.db.turso_http import execute_query, to_str


def _extract_count(result) -> int:
    """Extract a COUNT(*) scalar from a Turso result."""
    if result and result.get("rows"):
        return result["rows"][0][0].get("value", 0) if result["rows"][0][0].get("type") != "null" else 0
    return 0


def _extract_float(result) -> float:
    """Extract a single float scalar from a Turso result."""
    if result and result.get("rows"):
        val = result["rows"][0][0]
        if val.get("type") != "null":
            return float(val.get("value", 0))
    return 0.0


# ==================== User Analytics ====================

def get_registration_trends(start_date: str, end_date: str, interval: str) -> List[Dict[str, Any]]:
    """Get user registration trends over a time period."""
    if interval == "day":
        date_format = "DATE(created_at)"
    elif interval == "week":
        date_format = "DATE(created_at, 'weekday 0', '-6 days')"
    else:
        date_format = "DATE(created_at, 'start of month')"

    result = execute_query(
        f"""SELECT {date_format} as date,
            COUNT(*) as total,
            SUM(CASE WHEN LOWER(user_type) = 'client' THEN 1 ELSE 0 END) as clients,
            SUM(CASE WHEN LOWER(user_type) = 'freelancer' THEN 1 ELSE 0 END) as freelancers
           FROM users
           WHERE created_at >= ? AND created_at <= ?
           GROUP BY {date_format}
           ORDER BY date""",
        [start_date, end_date]
    )

    trends = []
    if result and result.get("rows"):
        for row in result["rows"]:
            trends.append({
                "date": to_str(row[0]),
                "total": row[1].get("value", 0) if row[1].get("type") != "null" else 0,
                "clients": row[2].get("value", 0) if row[2].get("type") != "null" else 0,
                "freelancers": row[3].get("value", 0) if row[3].get("type") != "null" else 0
            })
    return trends


def get_active_user_stats(days: int) -> Dict[str, Any]:
    """Get active user statistics for a given period."""
    cutoff_date = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()

    total_users = _extract_count(execute_query("SELECT COUNT(*) FROM users", []))
    active_users = _extract_count(execute_query(
        "SELECT COUNT(*) FROM users WHERE last_login >= ?", [cutoff_date]
    ))
    verified_users = _extract_count(execute_query(
        "SELECT COUNT(*) FROM users WHERE email_verified = 1", []
    ))
    users_with_2fa = _extract_count(execute_query(
        "SELECT COUNT(*) FROM users WHERE two_factor_enabled = 1", []
    ))

    types_result = execute_query(
        "SELECT user_type, COUNT(*) FROM users GROUP BY user_type", []
    )
    user_types = {}
    if types_result and types_result.get("rows"):
        for row in types_result["rows"]:
            user_type = to_str(row[0]) or "unknown"
            count = row[1].get("value", 0) if row[1].get("type") != "null" else 0
            user_types[user_type] = count

    return {
        "total_users": total_users,
        "active_users": active_users,
        "verified_users": verified_users,
        "users_with_2fa": users_with_2fa,
        "user_types": user_types,
        "period_days": days
    }


def get_location_distribution() -> List[Dict[str, Any]]:
    """Get user distribution by location."""
    result = execute_query(
        """SELECT location, COUNT(*) as count
           FROM users
           WHERE location IS NOT NULL AND location != ''
           GROUP BY location
           ORDER BY count DESC
           LIMIT 20""",
        []
    )

    locations = []
    if result and result.get("rows"):
        for row in result["rows"]:
            locations.append({
                "location": to_str(row[0]),
                "count": row[1].get("value", 0) if row[1].get("type") != "null" else 0
            })
    return locations


# ==================== Project Analytics ====================

def get_project_stats() -> Dict[str, Any]:
    """Get overall project statistics."""
    status_result = execute_query(
        "SELECT status, COUNT(*) FROM projects GROUP BY status", []
    )
    status_breakdown = {}
    if status_result and status_result.get("rows"):
        for row in status_result["rows"]:
            s = to_str(row[0]) or "unknown"
            count = row[1].get("value", 0) if row[1].get("type") != "null" else 0
            status_breakdown[s] = count

    avg_budget = _extract_float(execute_query(
        "SELECT AVG((COALESCE(budget_min, 0) + COALESCE(budget_max, 0)) / 2) FROM projects", []
    ))

    thirty_days_ago = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
    recent_projects = _extract_count(execute_query(
        "SELECT COUNT(*) FROM projects WHERE created_at >= ?", [thirty_days_ago]
    ))

    avg_proposals = _extract_float(execute_query(
        """SELECT AVG(proposal_count) FROM (
            SELECT COUNT(*) as proposal_count FROM proposals GROUP BY project_id
        )""",
        []
    ))

    return {
        "status_breakdown": status_breakdown,
        "average_budget": avg_budget,
        "projects_last_30_days": recent_projects,
        "average_proposals_per_project": avg_proposals
    }


def get_completion_rate() -> Dict[str, Any]:
    """Get project completion rate."""
    result = execute_query(
        """SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
            SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
            SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
           FROM projects""",
        []
    )

    total = completed = in_progress = cancelled = 0
    if result and result.get("rows"):
        row = result["rows"][0]
        total = row[0].get("value", 0) if row[0].get("type") != "null" else 0
        completed = row[1].get("value", 0) if row[1].get("type") != "null" else 0
        in_progress = row[2].get("value", 0) if row[2].get("type") != "null" else 0
        cancelled = row[3].get("value", 0) if row[3].get("type") != "null" else 0

    completion_rate = (completed / total * 100) if total > 0 else 0

    return {
        "total_projects": total,
        "completed": completed,
        "in_progress": in_progress,
        "cancelled": cancelled,
        "completion_rate": round(completion_rate, 2)
    }


def get_popular_categories(limit: int) -> List[Dict[str, Any]]:
    """Get most popular project categories."""
    result = execute_query(
        """SELECT category, COUNT(*) as count
           FROM projects
           WHERE category IS NOT NULL AND category != ''
           GROUP BY category
           ORDER BY count DESC
           LIMIT ?""",
        [limit]
    )

    categories = []
    if result and result.get("rows"):
        for row in result["rows"]:
            categories.append({
                "category": to_str(row[0]),
                "count": row[1].get("value", 0) if row[1].get("type") != "null" else 0
            })
    return categories


# ==================== Revenue Analytics ====================

def get_revenue_stats(start_date: str, end_date: str) -> Dict[str, Any]:
    """Get revenue statistics for a date range."""
    result = execute_query(
        """SELECT 
            COALESCE(SUM(amount), 0) as total,
            COUNT(*) as count,
            payment_method
           FROM payments
           WHERE created_at >= ? AND created_at <= ? AND status = 'completed'
           GROUP BY payment_method""",
        [start_date, end_date]
    )

    total_revenue = 0.0
    transaction_count = 0
    payment_methods = {}

    if result and result.get("rows"):
        for row in result["rows"]:
            amount = float(row[0].get("value", 0)) if row[0].get("type") != "null" else 0
            count = row[1].get("value", 0) if row[1].get("type") != "null" else 0
            method = to_str(row[2]) or "unknown"
            total_revenue += amount
            transaction_count += count
            payment_methods[method] = amount

    platform_fees = total_revenue * 0.10
    avg_transaction = total_revenue / transaction_count if transaction_count > 0 else 0

    return {
        "total_revenue": total_revenue,
        "platform_fees": platform_fees,
        "net_revenue": total_revenue - platform_fees,
        "transaction_count": transaction_count,
        "average_transaction": avg_transaction,
        "payment_methods": payment_methods
    }


def get_revenue_trends(start_date: str, end_date: str, interval: str) -> List[Dict[str, Any]]:
    """Get revenue trends over time."""
    if interval == "day":
        date_format = "DATE(created_at)"
    elif interval == "week":
        date_format = "DATE(created_at, 'weekday 0', '-6 days')"
    else:
        date_format = "DATE(created_at, 'start of month')"

    result = execute_query(
        f"""SELECT {date_format} as date,
            COALESCE(SUM(amount), 0) as total,
            COUNT(*) as count
           FROM payments
           WHERE created_at >= ? AND created_at <= ? AND status = 'completed'
           GROUP BY {date_format}
           ORDER BY date""",
        [start_date, end_date]
    )

    trends = []
    if result and result.get("rows"):
        for row in result["rows"]:
            trends.append({
                "date": to_str(row[0]),
                "revenue": float(row[1].get("value", 0)) if row[1].get("type") != "null" else 0,
                "transactions": row[2].get("value", 0) if row[2].get("type") != "null" else 0
            })
    return trends


# ==================== Freelancer Analytics ====================

def get_top_freelancers(limit: int, sort_by: str) -> List[Dict[str, Any]]:
    """Get top performing freelancers."""
    order_by = {
        "earnings": "total_earnings DESC",
        "rating": "avg_rating DESC",
        "projects": "project_count DESC"
    }.get(sort_by, "total_earnings DESC")

    result = execute_query(
        f"""SELECT 
            u.id, u.first_name, u.last_name, u.email,
            COUNT(DISTINCT c.id) as project_count,
            COALESCE(SUM(p.amount), 0) as total_earnings,
            COALESCE(AVG(r.rating), 0) as avg_rating
           FROM users u
           LEFT JOIN contracts c ON c.freelancer_id = u.id
           LEFT JOIN payments p ON p.to_user_id = u.id AND p.status = 'completed'
           LEFT JOIN reviews r ON r.reviewee_id = u.id
           WHERE LOWER(u.user_type) = 'freelancer'
           GROUP BY u.id, u.first_name, u.last_name, u.email
           ORDER BY {order_by}
           LIMIT ?""",
        [limit]
    )

    freelancers = []
    if result and result.get("rows"):
        for row in result["rows"]:
            first = to_str(row[1]) or ""
            last = to_str(row[2]) or ""
            freelancers.append({
                "id": row[0].get("value") if row[0].get("type") != "null" else None,
                "name": f"{first} {last}".strip(),
                "email": to_str(row[3]),
                "project_count": row[4].get("value", 0) if row[4].get("type") != "null" else 0,
                "total_earnings": float(row[5].get("value", 0)) if row[5].get("type") != "null" else 0,
                "average_rating": round(float(row[6].get("value", 0)), 2) if row[6].get("type") != "null" else 0
            })
    return freelancers


def get_freelancer_success_rate(freelancer_id: int) -> Dict[str, Any]:
    """Get success metrics for a specific freelancer."""
    proposals_result = execute_query(
        """SELECT 
            COUNT(*) as submitted,
            SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted
           FROM proposals WHERE freelancer_id = ?""",
        [freelancer_id]
    )

    submitted = accepted = 0
    if proposals_result and proposals_result.get("rows"):
        row = proposals_result["rows"][0]
        submitted = row[0].get("value", 0) if row[0].get("type") != "null" else 0
        accepted = row[1].get("value", 0) if row[1].get("type") != "null" else 0

    completed = _extract_count(execute_query(
        "SELECT COUNT(*) FROM contracts WHERE freelancer_id = ? AND status = 'completed'",
        [freelancer_id]
    ))

    avg_rating = _extract_float(execute_query(
        "SELECT AVG(rating) FROM reviews WHERE reviewee_id = ?",
        [freelancer_id]
    ))

    total_earnings = _extract_float(execute_query(
        "SELECT COALESCE(SUM(amount), 0) FROM payments WHERE to_user_id = ? AND status = 'completed'",
        [freelancer_id]
    ))

    success_rate = (accepted / submitted * 100) if submitted > 0 else 0

    return {
        "proposals_submitted": submitted,
        "proposals_accepted": accepted,
        "success_rate": round(success_rate, 2),
        "projects_completed": completed,
        "average_rating": round(avg_rating, 2),
        "total_earnings": total_earnings
    }


# ==================== Client Analytics ====================

def get_top_clients(limit: int) -> List[Dict[str, Any]]:
    """Get top clients by spending."""
    result = execute_query(
        """SELECT 
            u.id, u.first_name, u.last_name, u.email,
            COUNT(DISTINCT pr.id) as project_count,
            COALESCE(SUM(p.amount), 0) as total_spent
           FROM users u
           LEFT JOIN projects pr ON pr.client_id = u.id
           LEFT JOIN payments p ON p.from_user_id = u.id AND p.status = 'completed'
           WHERE LOWER(u.user_type) = 'client'
           GROUP BY u.id, u.first_name, u.last_name, u.email
           ORDER BY total_spent DESC
           LIMIT ?""",
        [limit]
    )

    clients = []
    if result and result.get("rows"):
        for row in result["rows"]:
            first = to_str(row[1]) or ""
            last = to_str(row[2]) or ""
            clients.append({
                "id": row[0].get("value") if row[0].get("type") != "null" else None,
                "name": f"{first} {last}".strip(),
                "email": to_str(row[3]),
                "project_count": row[4].get("value", 0) if row[4].get("type") != "null" else 0,
                "total_spent": float(row[5].get("value", 0)) if row[5].get("type") != "null" else 0
            })
    return clients


# ==================== Platform Health ====================

def get_platform_health() -> Dict[str, Any]:
    """Get platform health metrics."""
    active_disputes = _extract_count(execute_query(
        "SELECT COUNT(*) FROM disputes WHERE status IN ('open', 'investigating')", []
    ))
    pending_tickets = _extract_count(execute_query(
        "SELECT COUNT(*) FROM support_tickets WHERE status = 'open'", []
    ))

    user_satisfaction = _extract_float(execute_query(
        "SELECT AVG(rating) FROM reviews", []
    ))

    yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
    daily_active = _extract_count(execute_query(
        "SELECT COUNT(*) FROM users WHERE last_login >= ?", [yesterday]
    ))

    return {
        "active_disputes": active_disputes,
        "pending_support_tickets": pending_tickets,
        "average_response_time_hours": 0,
        "user_satisfaction_rating": round(user_satisfaction, 2),
        "daily_active_users": daily_active
    }


def get_engagement_metrics(days: int) -> Dict[str, Any]:
    """Get user engagement metrics."""
    cutoff_date = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()

    messages = _extract_count(execute_query(
        "SELECT COUNT(*) FROM messages WHERE created_at >= ?", [cutoff_date]
    ))
    proposals = _extract_count(execute_query(
        "SELECT COUNT(*) FROM proposals WHERE created_at >= ?", [cutoff_date]
    ))
    projects = _extract_count(execute_query(
        "SELECT COUNT(*) FROM projects WHERE created_at >= ?", [cutoff_date]
    ))
    contracts = _extract_count(execute_query(
        "SELECT COUNT(*) FROM contracts WHERE created_at >= ?", [cutoff_date]
    ))
    reviews = _extract_count(execute_query(
        "SELECT COUNT(*) FROM reviews WHERE created_at >= ?", [cutoff_date]
    ))

    return {
        "period_days": days,
        "messages_sent": messages,
        "proposals_submitted": proposals,
        "projects_posted": projects,
        "contracts_created": contracts,
        "reviews_posted": reviews
    }
