# @AI-HINT: Complete Search Service with FTS5 and Turso
"""
Complete Search Service featuring:
- Full-text search using FTS5
- Relevance scoring
- Autocomplete suggestions
- Advanced filters
- Search analytics
"""

from typing import List, Dict, Any, Optional
from app.db.turso_http import execute_query, parse_rows
from datetime import datetime
import re

class SearchService:
    """Complete search implementation using Turso FTS5"""
    
    @staticmethod
    def search_projects(
        query: str,
        category: Optional[str] = None,
        budget_min: Optional[float] = None,
        budget_max: Optional[float] = None,
        skills: Optional[List[str]] = None,
        status: str = "open",
        sort_by: str = "relevance",
        skip: int = 0,
        limit: int = 20
    ) -> Dict[str, Any]:
        """Search projects using FTS5 full-text search"""
        
        # Build FTS5 query
        fts_params = []
        where_clauses = ["1=1"]
        
        # FTS5 search on projects_fts
        if query:
            # Escape FTS5 special characters
            sanitized_query = query.replace('"', '').replace("'", '')
            fts_params.append(f"{sanitized_query}*")
            where_clauses.append("p.id IN (SELECT rowid FROM projects_fts WHERE projects_fts MATCH ?)")
        
        # Filters
        if status:
            where_clauses.append("p.status = ?")
            fts_params.append(status)
        
        if category:
            where_clauses.append("p.category = ?")
            fts_params.append(category)
        
        if budget_min is not None:
            where_clauses.append("p.budget_max >= ?")
            fts_params.append(budget_min)
        
        if budget_max is not None:
            where_clauses.append("p.budget_min <= ?")
            fts_params.append(budget_max)
        
        # Sort options
        sort_sql = {
            "relevance": "CASE WHEN query IS NOT NULL THEN 0 ELSE 1 END, p.created_at DESC",
            "newest": "p.created_at DESC",
            "budget_high": "p.budget_max DESC",
            "budget_low": "p.budget_min ASC"
        }.get(sort_by, "p.created_at DESC")
        
        where_sql = " AND ".join(where_clauses)
        
        # Execute search
        search_query = f"""
            SELECT p.id, p.title, p.description, p.category, p.budget_min, p.budget_max,
                   p.experience_level, p.status, p.skills, p.created_at, 
                   u.name as client_name, u.profile_image_url,
                   COUNT(*) OVER() as total
            FROM projects p
            LEFT JOIN users u ON p.client_id = u.id
            WHERE {where_sql}
            ORDER BY {sort_sql}
            LIMIT ? OFFSET ?
        """
        
        fts_params.extend([limit, skip])
        
        result = execute_query(search_query, fts_params)
        
        if not result or not result.get("rows"):
            return {"projects": [], "total": 0}
        
        projects = []
        total = 0
        for row in parse_rows(result):
            total = row.get("total") or 0
            projects.append({
                "id": row.get("id"),
                "title": row.get("title"),
                "description": row.get("description"),
                "category": row.get("category"),
                "budget_min": row.get("budget_min"),
                "budget_max": row.get("budget_max"),
                "experience_level": row.get("experience_level"),
                "status": row.get("status"),
                "skills": row.get("skills"),
                "client_name": row.get("client_name"),
                "client_avatar": row.get("profile_image_url"),
                "created_at": row.get("created_at")
            })
        
        return {
            "projects": projects,
            "total": total,
            "query": query,
            "filters_applied": {
                "category": category,
                "budget_range": [budget_min, budget_max],
                "status": status
            }
        }
    
    @staticmethod
    def search_freelancers(
        query: str,
        skills: Optional[List[str]] = None,
        min_rating: Optional[float] = None,
        hourly_rate_max: Optional[float] = None,
        sort_by: str = "relevance",
        skip: int = 0,
        limit: int = 20
    ) -> Dict[str, Any]:
        """Search freelancers using FTS5"""
        
        fts_params = []
        where_clauses = ["u.role = 'freelancer'"]
        
        # FTS5 search on users_fts
        if query:
            sanitized_query = query.replace('"', '').replace("'", '')
            fts_params.append(f"{sanitized_query}*")
            where_clauses.append("u.id IN (SELECT rowid FROM users_fts WHERE users_fts MATCH ?)")
        
        # Skill filter
        if skills:
            skill_placeholders = ",".join(["?" for _ in skills])
            where_clauses.append(f"EXISTS (SELECT 1 FROM user_skills us WHERE us.user_id = u.id AND us.skill_id IN ({skill_placeholders}))")
            fts_params.extend(skills)
        
        # Rating filter
        if min_rating is not None:
            where_clauses.append("""u.id IN (
                SELECT r.reviewee_id FROM reviews r 
                WHERE r.is_public = 1 
                GROUP BY r.reviewee_id 
                HAVING AVG(r.rating) >= ?
            )""")
            fts_params.append(min_rating)
        
        # Hourly rate filter
        if hourly_rate_max is not None:
            where_clauses.append("u.hourly_rate <= ? OR u.hourly_rate IS NULL")
            fts_params.append(hourly_rate_max)
        
        sort_sql = {
            "relevance": "u.hourly_rate ASC",
            "rating": "avg_rating DESC",
            "rate_low": "u.hourly_rate ASC",
            "rate_high": "u.hourly_rate DESC"
        }.get(sort_by, "u.created_at DESC")
        
        where_sql = " AND ".join(where_clauses)
        
        search_query = f"""
            SELECT u.id, u.name, u.email, u.bio, u.hourly_rate, u.profile_image_url,
                   u.location, u.skills,
                   COUNT(*) OVER() as total,
                   COALESCE(AVG(r.rating), 0) as avg_rating
            FROM users u
            LEFT JOIN reviews r ON u.id = r.reviewee_id AND r.is_public = 1
            WHERE {where_sql}
            GROUP BY u.id
            ORDER BY {sort_sql}
            LIMIT ? OFFSET ?
        """
        
        fts_params.extend([limit, skip])
        
        result = execute_query(search_query, fts_params)
        
        if not result or not result.get("rows"):
            return {"freelancers": [], "total": 0}
        
        freelancers = []
        total = 0
        for row in parse_rows(result):
            total = row.get("total") or 0
            freelancers.append({
                "id": row.get("id"),
                "name": row.get("name"),
                "bio": row.get("bio"),
                "hourly_rate": row.get("hourly_rate"),
                "avatar": row.get("profile_image_url"),
                "location": row.get("location"),
                "skills": (row.get("skills") or "").split(","),
                "avg_rating": row.get("avg_rating") or 0
            })
        
        return {
            "freelancers": freelancers,
            "total": total,
            "query": query
        }
    
    @staticmethod
    def autocomplete_suggestions(
        query: str,
        suggestion_type: str = "projects",
        limit: int = 10
    ) -> List[str]:
        """Get autocomplete suggestions using FTS5"""
        
        if not query or len(query) < 2:
            return []
        
        sanitized = query.replace('"', '').replace("'", '')
        
        if suggestion_type == "projects":
            table = "projects_fts"
            column = "title"
        elif suggestion_type == "freelancers":
            table = "users_fts"
            column = "name"
        elif suggestion_type == "skills":
            table = "skills_fts"
            column = "name"
        else:
            return []
        
        result = execute_query(
            f"""SELECT DISTINCT {column} FROM {table}
               WHERE {table} MATCH ?
               LIMIT ?""",
            [f"{sanitized}*", limit]
        )
        
        if not result or not result.get("rows"):
            return []
        
        suggestions = []
        for row in parse_rows(result):
            val = row.get(column)
            if val:
                suggestions.append(val)
        
        return suggestions[:limit]
    
    @staticmethod
    def search_analytics_log(
        query: str,
        user_id: Optional[int] = None,
        search_type: str = "global"
    ):
        """Log search query for analytics"""
        now = datetime.utcnow().isoformat()
        
        execute_query(
            """INSERT INTO search_analytics (query, user_id, search_type, created_at)
               VALUES (?, ?, ?, ?)""",
            [query, user_id, search_type, now]
        )
    
    @staticmethod
    def get_trending_searches(limit: int = 10) -> List[Dict[str, Any]]:
        """Get trending search queries"""
        result = execute_query(
            """SELECT query, COUNT(*) as count
               FROM search_analytics
               WHERE created_at > datetime('now', '-7 days')
               GROUP BY query
               ORDER BY count DESC
               LIMIT ?""",
            [limit]
        )
        
        if not result or not result.get("rows"):
            return []
        
        trending = []
        for row in parse_rows(result):
            trending.append({
                "query": row.get("query"),
                "count": row.get("count") or 0
            })
        
        return trending


def get_search_service() -> SearchService:
    """Factory function for search service"""
    return SearchService()
