# @AI-HINT: Complete Analytics Service - Real data aggregation and BI metrics
"""
Complete Analytics Service featuring:
- Real-time platform metrics
- User behavior analytics
- Revenue and payment analytics
- Performance metrics and KPIs
- Trend analysis
- Business intelligence
"""

from typing import List, Dict, Any
from datetime import datetime, timedelta, timezone
from app.db.turso_http import execute_query, parse_rows

class AnalyticsService:
    """Complete analytics engine with real data"""
    
    @staticmethod
    def get_dashboard_metrics(days: int = 30) -> Dict[str, Any]:
        """Get comprehensive dashboard metrics"""
        
        cutoff_date = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
        
        # Revenue metrics
        revenue_result = execute_query(
            """SELECT 
                SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_revenue,
                COUNT(CASE WHEN status = 'completed' THEN 1 ELSE NULL END) as completed_payments,
                AVG(CASE WHEN status = 'completed' THEN amount ELSE NULL END) as avg_payment,
                SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_revenue
               FROM payments
               WHERE created_at > ?""",
            [cutoff_date]
        )
        
        revenue_metrics = {}
        if revenue_result and revenue_result.get("rows"):
            row = parse_rows(revenue_result)[0]
            revenue_metrics = {
                "total_revenue": row.get("total_revenue") or 0,
                "completed_transactions": row.get("completed_payments") or 0,
                "average_transaction": row.get("avg_payment") or 0,
                "pending_revenue": row.get("pending_revenue") or 0
            }
        
        # Project metrics
        project_result = execute_query(
            """SELECT 
                COUNT(CASE WHEN status = 'open' THEN 1 ELSE NULL END) as open_projects,
                COUNT(CASE WHEN status = 'in_progress' THEN 1 ELSE NULL END) as in_progress,
                COUNT(CASE WHEN status = 'completed' THEN 1 ELSE NULL END) as completed_projects,
                COUNT(*) as total_projects,
                AVG(budget_min) as avg_budget_min,
                AVG(budget_max) as avg_budget_max
               FROM projects
               WHERE created_at > ?""",
            [cutoff_date]
        )
        
        project_metrics = {}
        if project_result and project_result.get("rows"):
            row = parse_rows(project_result)[0]
            project_metrics = {
                "open": row.get("open_projects") or 0,
                "in_progress": row.get("in_progress") or 0,
                "completed": row.get("completed_projects") or 0,
                "total": row.get("total_projects") or 0,
                "avg_budget_range": [row.get("avg_budget_min") or 0, row.get("avg_budget_max") or 0]
            }
        
        # Contract metrics
        contract_result = execute_query(
            """SELECT 
                COUNT(CASE WHEN status = 'active' THEN 1 ELSE NULL END) as active_contracts,
                COUNT(CASE WHEN status = 'completed' THEN 1 ELSE NULL END) as completed_contracts,
                AVG(hourly_rate) as avg_hourly_rate,
                SUM(CASE WHEN status = 'completed' THEN hours_worked ELSE 0 END) as total_hours_worked
               FROM contracts
               WHERE created_at > ?""",
            [cutoff_date]
        )
        
        contract_metrics = {}
        if contract_result and contract_result.get("rows"):
            row = parse_rows(contract_result)[0]
            contract_metrics = {
                "active": row.get("active_contracts") or 0,
                "completed": row.get("completed_contracts") or 0,
                "avg_rate": row.get("avg_hourly_rate") or 0,
                "total_hours": row.get("total_hours_worked") or 0
            }
        
        return {
            "period_days": days,
            "revenue": revenue_metrics,
            "projects": project_metrics,
            "contracts": contract_metrics,
            "generated_at": datetime.now(timezone.utc).isoformat()
        }
    
    @staticmethod
    def get_revenue_trend(days: int = 30) -> List[Dict[str, Any]]:
        """Get daily revenue trend"""
        
        cutoff_date = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
        
        result = execute_query(
            """SELECT 
                DATE(created_at) as day,
                SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as revenue,
                COUNT(CASE WHEN status = 'completed' THEN 1 ELSE NULL END) as transactions,
                COUNT(DISTINCT user_id) as unique_users
               FROM payments
               WHERE created_at > ?
               GROUP BY DATE(created_at)
               ORDER BY day ASC""",
            [cutoff_date]
        )
        
        trend = []
        if result and result.get("rows"):
            for row in parse_rows(result):
                trend.append({
                    "date": row.get("day"),
                    "revenue": row.get("revenue") or 0,
                    "transactions": row.get("transactions") or 0,
                    "unique_users": row.get("unique_users") or 0
                })
        
        return trend
    
    @staticmethod
    def get_top_categories(limit: int = 10) -> List[Dict[str, Any]]:
        """Get top project categories by count and revenue"""
        
        result = execute_query(
            """SELECT 
                p.category,
                COUNT(*) as project_count,
                AVG(budget_max) as avg_budget,
                SUM(CASE WHEN p.status = 'completed' THEN 1 ELSE 0 END) as completed
               FROM projects p
               GROUP BY p.category
               ORDER BY project_count DESC
               LIMIT ?""",
            [limit]
        )
        
        categories = []
        if result and result.get("rows"):
            for row in parse_rows(result):
                categories.append({
                    "category": row.get("category"),
                    "project_count": row.get("project_count") or 0,
                    "avg_budget": row.get("avg_budget") or 0,
                    "completed_projects": row.get("completed") or 0
                })
        
        return categories
    
    @staticmethod
    def get_top_freelancers(limit: int = 20) -> List[Dict[str, Any]]:
        """Get top freelancers by earnings and rating"""
        
        result = execute_query(
            """SELECT 
                u.id,
                u.name,
                u.profile_image_url,
                COUNT(DISTINCT c.id) as contracts_completed,
                SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END) as total_earnings,
                ROUND(AVG(r.rating), 1) as avg_rating,
                COUNT(DISTINCT r.id) as review_count
               FROM users u
               LEFT JOIN contracts c ON u.id = c.freelancer_id AND c.status = 'completed'
               LEFT JOIN payments p ON c.id = p.contract_id
               LEFT JOIN reviews r ON u.id = r.reviewee_id AND r.is_public = 1
               WHERE u.role = 'freelancer'
               GROUP BY u.id
               ORDER BY total_earnings DESC
               LIMIT ?""",
            [limit]
        )
        
        freelancers = []
        if result and result.get("rows"):
            for row in parse_rows(result):
                freelancers.append({
                    "freelancer_id": row.get("id"),
                    "name": row.get("name"),
                    "avatar": row.get("profile_image_url"),
                    "contracts": row.get("contracts_completed") or 0,
                    "total_earnings": row.get("total_earnings") or 0,
                    "avg_rating": row.get("avg_rating") or 0,
                    "reviews": row.get("review_count") or 0
                })
        
        return freelancers
    
    @staticmethod
    def get_user_retention() -> Dict[str, Any]:
        """Get user retention metrics"""
        
        now = datetime.now(timezone.utc)
        month_ago = (now - timedelta(days=30)).isoformat()
        
        # New users
        new_users_result = execute_query(
            "SELECT COUNT(*) as count FROM users WHERE created_at > ?",
            [month_ago]
        )
        
        new_users = 0
        if new_users_result and new_users_result.get("rows"):
            new_users = parse_rows(new_users_result)[0].get("count") or 0
        
        # Active users (had activity in last 7 days)
        active_users_result = execute_query(
            """SELECT COUNT(DISTINCT u.id) as count 
               FROM users u
               WHERE u.updated_at > ?""",
            [(now - timedelta(days=7)).isoformat()]
        )
        
        active_users = 0
        if active_users_result and active_users_result.get("rows"):
            active_users = parse_rows(active_users_result)[0].get("count") or 0
        
        # Returning users (2+ logins in last month)
        returning_result = execute_query(
            """SELECT COUNT(DISTINCT user_id) as count
               FROM user_sessions
               WHERE created_at > ?
               GROUP BY user_id
               HAVING COUNT(*) > 1""",
            [month_ago]
        )
        
        returning_users = 0
        if returning_result and returning_result.get("rows"):
            for row in parse_rows(returning_result):
                returning_users += 1
        
        return {
            "new_users_month": new_users,
            "active_users_week": active_users,
            "returning_users": returning_users
        }
    
    @staticmethod
    def get_success_metrics() -> Dict[str, Any]:
        """Get platform success metrics"""
        
        # Project to contract conversion rate
        projects_result = execute_query(
            "SELECT COUNT(*) as total FROM projects WHERE status != 'draft'",
            []
        )
        
        contracts_result = execute_query(
            "SELECT COUNT(*) as total FROM contracts",
            []
        )
        
        projects_total = 0
        contracts_total = 0
        
        if projects_result and projects_result.get("rows"):
            projects_total = parse_rows(projects_result)[0].get("total") or 0
        
        if contracts_result and contracts_result.get("rows"):
            contracts_total = parse_rows(contracts_result)[0].get("total") or 0
        
        conversion_rate = (contracts_total / projects_total * 100) if projects_total > 0 else 0
        
        # Payment success rate
        payment_result = execute_query(
            """SELECT 
                COUNT(CASE WHEN status = 'completed' THEN 1 ELSE NULL END) as completed,
                COUNT(*) as total
               FROM payments""",
            []
        )
        
        payment_success = 0
        if payment_result and payment_result.get("rows"):
            row = parse_rows(payment_result)[0]
            completed = row.get("completed") or 0
            total = row.get("total") or 1
            payment_success = (completed / total * 100) if total > 0 else 0
        
        # Average contract completion rate
        completion_result = execute_query(
            """SELECT 
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                COUNT(*) as total
               FROM contracts""",
            []
        )
        
        contract_completion = 0
        if completion_result and completion_result.get("rows"):
            row = parse_rows(completion_result)[0]
            completed = row.get("completed") or 0
            total = row.get("total") or 1
            contract_completion = (completed / total * 100) if total > 0 else 0
        
        return {
            "project_to_contract_conversion": round(conversion_rate, 1),
            "payment_success_rate": round(payment_success, 1),
            "contract_completion_rate": round(contract_completion, 1)
        }
    
    @staticmethod
    def get_skill_demand() -> List[Dict[str, Any]]:
        """Get most in-demand skills"""
        
        result = execute_query(
            """SELECT 
                s.name as skill,
                COUNT(DISTINCT ps.project_id) as project_count,
                COUNT(DISTINCT us.user_id) as freelancer_count,
                ROUND(AVG(u.hourly_rate), 2) as avg_rate
               FROM skills s
               LEFT JOIN project_skills ps ON s.id = ps.skill_id
               LEFT JOIN user_skills us ON s.id = us.skill_id
               LEFT JOIN users u ON us.user_id = u.id
               GROUP BY s.id
               ORDER BY project_count DESC
               LIMIT 20""",
            []
        )
        
        skills = []
        if result and result.get("rows"):
            for row in parse_rows(result):
                skills.append({
                    "skill": row.get("skill"),
                    "projects_needing": row.get("project_count") or 0,
                    "freelancers_available": row.get("freelancer_count") or 0,
                    "average_rate": row.get("avg_rate") or 0
                })
        
        return skills


def get_analytics_service() -> AnalyticsService:
    """Factory function for analytics service"""
    return AnalyticsService()
