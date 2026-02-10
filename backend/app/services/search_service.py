# @AI-HINT: Service layer for search CRUD operations - all DB access via Turso HTTP
"""
Search Service - Data access layer for project/freelancer/global search.

Handles all execute_query calls for:
- Project search with filters
- Freelancer search with filters
- Global cross-entity search
- Autocomplete suggestions
- Trending items
"""

from typing import Optional, List, Dict, Any

from app.db.turso_http import execute_query, to_str, parse_date


def row_to_project(row: list) -> dict:
    """Convert a database row to a project dict."""
    return {
        "id": row[0].get("value") if row[0].get("type") != "null" else None,
        "title": to_str(row[1]),
        "description": to_str(row[2]),
        "category": to_str(row[3]),
        "budget_type": to_str(row[4]),
        "budget_min": float(row[5].get("value")) if row[5].get("type") != "null" else None,
        "budget_max": float(row[6].get("value")) if row[6].get("type") != "null" else None,
        "experience_level": to_str(row[7]),
        "estimated_duration": to_str(row[8]) if len(row) > 8 else "Not specified",
        "status": to_str(row[9]) if len(row) > 9 else "open",
        "skills": to_str(row[10]).split(",") if len(row) > 10 and to_str(row[10]) else [],
        "client_id": row[11].get("value") if len(row) > 11 and row[11].get("type") != "null" else None,
        "created_at": parse_date(row[12]) if len(row) > 12 else None,
        "updated_at": parse_date(row[13]) if len(row) > 13 else None
    }


def row_to_user(row: list) -> dict:
    """Convert a database row to a user dict."""
    return {
        "id": row[0].get("value") if row[0].get("type") != "null" else None,
        "email": to_str(row[1]),
        "name": to_str(row[2]),
        "first_name": to_str(row[3]),
        "last_name": to_str(row[4]),
        "bio": to_str(row[5]),
        "hourly_rate": float(row[6].get("value")) if row[6].get("type") != "null" else None,
        "location": to_str(row[7]),
        "skills": to_str(row[8]),
        "user_type": to_str(row[9]),
        "is_active": bool(row[10].get("value")) if row[10].get("type") != "null" else True,
        "joined_at": parse_date(row[11])
    }


def search_projects_db(where_clause: str, params: List) -> List[dict]:
    """Execute project search query and return parsed project dicts."""
    result = execute_query(
        f"""SELECT id, title, description, category, budget_type, budget_min, budget_max, experience_level, estimated_duration, status, skills, client_id, created_at, updated_at
            FROM projects
            WHERE {where_clause}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?""",
        params
    )
    if not result or not result.get("rows"):
        return []
    return [row_to_project(row) for row in result["rows"]]


def search_freelancers_db(where_clause: str, params: List) -> List[dict]:
    """Execute freelancer search query and return parsed user dicts."""
    result = execute_query(
        f"""SELECT id, email, name, first_name, last_name, bio, hourly_rate, location, skills, user_type, is_active, created_at
            FROM users
            WHERE {where_clause}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?""",
        params
    )
    if not result or not result.get("rows"):
        return []
    return [row_to_user(row) for row in result["rows"]]


def global_search_projects(search_term: str, limit: int) -> List[dict]:
    """Search projects for global search."""
    result = execute_query(
        """SELECT id, title, description, budget_type, status
           FROM projects
           WHERE (title LIKE ? OR description LIKE ?) AND status = 'open'
           LIMIT ?""",
        [search_term, search_term, limit]
    )
    projects = []
    if result and result.get("rows"):
        for row in result["rows"]:
            desc = to_str(row[2])
            projects.append({
                "id": row[0].get("value") if row[0].get("type") != "null" else None,
                "type": "project",
                "title": to_str(row[1]),
                "description": desc[:200] if desc else None,
                "budget_type": to_str(row[3]),
                "status": to_str(row[4])
            })
    return projects


def global_search_freelancers(search_term: str, limit: int) -> List[dict]:
    """Search freelancers for global search."""
    result = execute_query(
        """SELECT id, name, first_name, last_name, bio, hourly_rate, location
           FROM users
           WHERE (name LIKE ? OR first_name LIKE ? OR last_name LIKE ? OR bio LIKE ?)
             AND LOWER(user_type) = 'freelancer' AND is_active = 1
           LIMIT ?""",
        [search_term, search_term, search_term, search_term, limit]
    )
    freelancers = []
    if result and result.get("rows"):
        for row in result["rows"]:
            name = to_str(row[1])
            if not name:
                first = to_str(row[2]) or ""
                last = to_str(row[3]) or ""
                name = f"{first} {last}".strip()
            bio = to_str(row[4])
            freelancers.append({
                "id": row[0].get("value") if row[0].get("type") != "null" else None,
                "type": "freelancer",
                "name": name,
                "bio": bio[:200] if bio else None,
                "hourly_rate": float(row[5].get("value")) if row[5].get("type") != "null" else None,
                "location": to_str(row[6])
            })
    return freelancers


def global_search_skills(search_term: str, limit: int) -> List[dict]:
    """Search skills for global search."""
    result = execute_query(
        """SELECT id, name, category FROM skills WHERE name LIKE ? LIMIT ?""",
        [search_term, limit]
    )
    skills = []
    if result and result.get("rows"):
        for row in result["rows"]:
            skills.append({
                "id": row[0].get("value") if row[0].get("type") != "null" else None,
                "type": "skill",
                "name": to_str(row[1]),
                "category": to_str(row[2])
            })
    return skills


def global_search_tags(search_term: str, limit: int) -> List[dict]:
    """Search tags for global search."""
    result = execute_query(
        """SELECT id, name, slug, usage_count FROM tags WHERE name LIKE ? LIMIT ?""",
        [search_term, limit]
    )
    tags = []
    if result and result.get("rows"):
        for row in result["rows"]:
            tags.append({
                "id": row[0].get("value") if row[0].get("type") != "null" else None,
                "type": "tag",
                "name": to_str(row[1]),
                "slug": to_str(row[2]),
                "usage_count": row[3].get("value") if row[3].get("type") != "null" else 0
            })
    return tags


def autocomplete_projects(search_term: str, limit: int) -> List[dict]:
    """Get project autocomplete suggestions."""
    result = execute_query(
        """SELECT id, title FROM projects WHERE title LIKE ? AND status = 'open' LIMIT ?""",
        [search_term, limit]
    )
    suggestions = []
    if result and result.get("rows"):
        for row in result["rows"]:
            suggestions.append({
                "id": row[0].get("value") if row[0].get("type") != "null" else None,
                "type": "project",
                "text": to_str(row[1])
            })
    return suggestions


def autocomplete_freelancers(search_term: str, limit: int) -> List[dict]:
    """Get freelancer autocomplete suggestions."""
    result = execute_query(
        """SELECT id, name, first_name, last_name FROM users
           WHERE (name LIKE ? OR first_name LIKE ? OR last_name LIKE ?)
             AND LOWER(user_type) = 'freelancer' AND is_active = 1
           LIMIT ?""",
        [search_term, search_term, search_term, limit]
    )
    suggestions = []
    if result and result.get("rows"):
        for row in result["rows"]:
            name = to_str(row[1])
            if not name:
                first = to_str(row[2]) or ""
                last = to_str(row[3]) or ""
                name = f"{first} {last}".strip()
            suggestions.append({
                "id": row[0].get("value") if row[0].get("type") != "null" else None,
                "type": "freelancer",
                "text": name
            })
    return suggestions


def autocomplete_skills(search_term: str, limit: int) -> List[dict]:
    """Get skill autocomplete suggestions."""
    result = execute_query(
        """SELECT id, name FROM skills WHERE name LIKE ? LIMIT ?""",
        [search_term, limit]
    )
    suggestions = []
    if result and result.get("rows"):
        for row in result["rows"]:
            suggestions.append({
                "id": row[0].get("value") if row[0].get("type") != "null" else None,
                "type": "skill",
                "text": to_str(row[1])
            })
    return suggestions


def autocomplete_tags(search_term: str, limit: int) -> List[dict]:
    """Get tag autocomplete suggestions."""
    result = execute_query(
        """SELECT id, name FROM tags WHERE name LIKE ? LIMIT ?""",
        [search_term, limit]
    )
    suggestions = []
    if result and result.get("rows"):
        for row in result["rows"]:
            suggestions.append({
                "id": row[0].get("value") if row[0].get("type") != "null" else None,
                "type": "tag",
                "text": to_str(row[1])
            })
    return suggestions


def get_trending_projects(limit: int) -> List[dict]:
    """Get trending/recent open projects."""
    result = execute_query(
        """SELECT id, title, description, category, budget_type, budget_min, budget_max, experience_level, estimated_duration, status, skills, client_id, created_at, updated_at
           FROM projects
           WHERE status = 'open'
           ORDER BY created_at DESC
           LIMIT ?""",
        [limit]
    )
    if not result or not result.get("rows"):
        return []
    return [row_to_project(row) for row in result["rows"]]


def get_trending_freelancers(limit: int) -> List[dict]:
    """Get trending/recent active freelancers."""
    result = execute_query(
        """SELECT id, email, name, first_name, last_name, bio, hourly_rate, location, skills, user_type, is_active, created_at
           FROM users
           WHERE LOWER(user_type) = 'freelancer' AND is_active = 1
           ORDER BY created_at DESC
           LIMIT ?""",
        [limit]
    )
    if not result or not result.get("rows"):
        return []
    return [row_to_user(row) for row in result["rows"]]


def get_trending_skills(limit: int) -> List[dict]:
    """Get trending skills."""
    result = execute_query(
        """SELECT id, name, category, created_at FROM skills ORDER BY created_at DESC LIMIT ?""",
        [limit]
    )
    items = []
    if result and result.get("rows"):
        for row in result["rows"]:
            items.append({
                "id": row[0].get("value") if row[0].get("type") != "null" else None,
                "name": to_str(row[1]),
                "category": to_str(row[2])
            })
    return items


def get_trending_tags(limit: int) -> List[dict]:
    """Get trending tags by usage count."""
    result = execute_query(
        """SELECT id, name, slug, usage_count FROM tags WHERE usage_count > 0 ORDER BY usage_count DESC LIMIT ?""",
        [limit]
    )
    items = []
    if result and result.get("rows"):
        for row in result["rows"]:
            items.append({
                "id": row[0].get("value") if row[0].get("type") != "null" else None,
                "name": to_str(row[1]),
                "slug": to_str(row[2]),
                "usage_count": row[3].get("value") if row[3].get("type") != "null" else 0
            })
    return items
