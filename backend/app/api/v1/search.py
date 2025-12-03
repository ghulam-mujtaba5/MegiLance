# @AI-HINT: Advanced Search API for projects, freelancers, and global search - Turso HTTP only
# Enhanced with input sanitization and security measures
import re
from fastapi import APIRouter, Depends, Query, HTTPException, status
from typing import List, Optional, Literal

from app.db.turso_http import execute_query, to_str, parse_date
from app.schemas.project import ProjectRead
from app.schemas.user import UserRead

router = APIRouter(prefix="/search", tags=["search"])

# === Security Constants ===
MAX_QUERY_LENGTH = 200
MAX_SKILLS_LENGTH = 500
MAX_RESULTS = 100

# Characters that could be used for SQL/wildcard injection
UNSAFE_CHARS_PATTERN = re.compile(r'[%_\[\]\\\'\";\-\-]')


def sanitize_search_query(query: str) -> str:
    """Sanitize search query to prevent SQL injection and wildcard abuse"""
    if not query:
        return ""
    
    # Trim and limit length
    query = query.strip()[:MAX_QUERY_LENGTH]
    
    # Escape SQL LIKE wildcards
    query = query.replace('\\', '\\\\')
    query = query.replace('%', '\\%')
    query = query.replace('_', '\\_')
    
    # Remove potentially dangerous characters
    query = re.sub(r'[;\'\"\-\-]', '', query)
    
    return query


def sanitize_skill_list(skills: str) -> List[str]:
    """Sanitize and parse skill list"""
    if not skills:
        return []
    
    skills = skills[:MAX_SKILLS_LENGTH]
    skill_list = []
    
    for s in skills.split(','):
        s = s.strip().lower()
        # Remove special characters from skill names
        s = re.sub(r'[^a-z0-9\s\.\+\#]', '', s)
        if s and len(s) <= 50:
            skill_list.append(s)
    
    return skill_list[:20]  # Max 20 skills


def validate_search_params(q: Optional[str], limit: int, offset: int) -> None:
    """Validate common search parameters"""
    if limit > MAX_RESULTS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Limit cannot exceed {MAX_RESULTS}"
        )
    
    if q and len(q) > MAX_QUERY_LENGTH:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Search query exceeds maximum length of {MAX_QUERY_LENGTH} characters"
        )


def row_to_project(row: list) -> dict:
    """Convert a database row to a project dict"""
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
        "skills": to_str(row[10]) if len(row) > 10 else "",
        "client_id": row[11].get("value") if len(row) > 11 and row[11].get("type") != "null" else None,
        "created_at": parse_date(row[12]) if len(row) > 12 else None,
        "updated_at": parse_date(row[13]) if len(row) > 13 else None
    }


def row_to_user(row: list) -> dict:
    """Convert a database row to a user dict"""
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
        "created_at": parse_date(row[11])
    }


@router.get("/projects", response_model=List[ProjectRead])
async def search_projects(
    q: Optional[str] = Query(None, description="Search query (title, description)"),
    skills: Optional[str] = Query(None, description="Comma-separated skill names"),
    category: Optional[str] = Query(None, description="Project category"),
    budget_min: Optional[float] = Query(None, ge=0, description="Minimum budget"),
    budget_max: Optional[float] = Query(None, ge=0, description="Maximum budget"),
    budget_type: Optional[Literal["fixed", "hourly"]] = Query(None, description="Budget type"),
    experience_level: Optional[Literal["entry", "intermediate", "expert"]] = Query(None),
    status: Optional[str] = Query("open", description="Project status"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """
    Advanced project search
    - Search by keywords in title/description
    - Filter by skills, category, budget range, experience level
    - Public endpoint
    """
    validate_search_params(q, limit, offset)
    
    conditions = []
    params = []
    
    # Text search with sanitization
    if q:
        safe_q = sanitize_search_query(q)
        if safe_q:
            conditions.append("(title LIKE ? ESCAPE '\\' OR description LIKE ? ESCAPE '\\')")
            search_term = f"%{safe_q}%"
            params.extend([search_term, search_term])
    
    # Filter by status (validate against allowed values)
    valid_statuses = {"open", "in_progress", "completed", "cancelled", "draft"}
    if status:
        if status.lower() not in valid_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status. Allowed: {', '.join(valid_statuses)}"
            )
        conditions.append("status = ?")
        params.append(status.lower())
    
    # Filter by category
    if category:
        safe_category = sanitize_search_query(category)
        if safe_category:
            conditions.append("category LIKE ? ESCAPE '\\'")
            params.append(f"%{safe_category}%")
    
    # Filter by budget range
    if budget_min is not None:
        conditions.append("budget_min >= ?")
        params.append(budget_min)
    if budget_max is not None:
        conditions.append("budget_max <= ?")
        params.append(budget_max)
    
    # Filter by budget type
    if budget_type:
        conditions.append("budget_type = ?")
        params.append(budget_type)
    
    # Filter by experience level
    if experience_level:
        conditions.append("experience_level = ?")
        params.append(experience_level)
    
    # Filter by skills (search in skills text field)
    if skills:
        skill_list = [s.strip().lower() for s in skills.split(',')]
        for skill in skill_list:
            conditions.append("LOWER(skills) LIKE ?")
            params.append(f"%{skill}%")
    
    where_clause = " AND ".join(conditions) if conditions else "1=1"
    params.extend([limit, offset])
    
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


@router.get("/freelancers", response_model=List[UserRead])
async def search_freelancers(
    q: Optional[str] = Query(None, description="Search query (name, bio)"),
    skills: Optional[str] = Query(None, description="Comma-separated skill names"),
    min_rate: Optional[float] = Query(None, ge=0, description="Minimum hourly rate"),
    max_rate: Optional[float] = Query(None, ge=0, description="Maximum hourly rate"),
    location: Optional[str] = Query(None, description="Location filter"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """
    Advanced freelancer search
    - Search by keywords in name/bio
    - Filter by skills, hourly rate, location
    - Public endpoint
    """
    conditions = ["LOWER(user_type) = 'freelancer'", "is_active = 1"]
    params = []
    
    # Text search
    if q:
        conditions.append("(name LIKE ? OR first_name LIKE ? OR last_name LIKE ? OR bio LIKE ?)")
        search_term = f"%{q}%"
        params.extend([search_term, search_term, search_term, search_term])
    
    # Filter by hourly rate range
    if min_rate is not None:
        conditions.append("hourly_rate >= ?")
        params.append(min_rate)
    if max_rate is not None:
        conditions.append("hourly_rate <= ?")
        params.append(max_rate)
    
    # Filter by location
    if location:
        conditions.append("location LIKE ?")
        params.append(f"%{location}%")
    
    # Filter by skills
    if skills:
        skill_list = [s.strip().lower() for s in skills.split(',')]
        for skill in skill_list:
            conditions.append("LOWER(skills) LIKE ?")
            params.append(f"%{skill}%")
    
    where_clause = " AND ".join(conditions)
    params.extend([limit, offset])
    
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


@router.get("/global")
async def global_search(
    q: str = Query(..., min_length=2, description="Search query"),
    limit: int = Query(10, ge=1, le=50)
):
    """
    Global search across projects, freelancers, and skills
    - Returns mixed results from all searchable entities
    - Public endpoint
    """
    search_term = f"%{q}%"
    
    # Search projects
    projects_result = execute_query(
        """SELECT id, title, description, budget_type, status
           FROM projects
           WHERE (title LIKE ? OR description LIKE ?) AND status = 'open'
           LIMIT ?""",
        [search_term, search_term, limit]
    )
    
    projects = []
    if projects_result and projects_result.get("rows"):
        for row in projects_result["rows"]:
            desc = to_str(row[2])
            projects.append({
                "id": row[0].get("value") if row[0].get("type") != "null" else None,
                "type": "project",
                "title": to_str(row[1]),
                "description": desc[:200] if desc else None,
                "budget_type": to_str(row[3]),
                "status": to_str(row[4])
            })
    
    # Search freelancers
    freelancers_result = execute_query(
        """SELECT id, name, first_name, last_name, bio, hourly_rate, location
           FROM users
           WHERE (name LIKE ? OR first_name LIKE ? OR last_name LIKE ? OR bio LIKE ?)
             AND LOWER(user_type) = 'freelancer' AND is_active = 1
           LIMIT ?""",
        [search_term, search_term, search_term, search_term, limit]
    )
    
    freelancers = []
    if freelancers_result and freelancers_result.get("rows"):
        for row in freelancers_result["rows"]:
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
    
    # Search skills
    skills_result = execute_query(
        """SELECT id, name, category FROM skills WHERE name LIKE ? LIMIT ?""",
        [search_term, limit]
    )
    
    skills = []
    if skills_result and skills_result.get("rows"):
        for row in skills_result["rows"]:
            skills.append({
                "id": row[0].get("value") if row[0].get("type") != "null" else None,
                "type": "skill",
                "name": to_str(row[1]),
                "category": to_str(row[2])
            })
    
    # Search tags
    tags_result = execute_query(
        """SELECT id, name, slug, usage_count FROM tags WHERE name LIKE ? LIMIT ?""",
        [search_term, limit]
    )
    
    tags = []
    if tags_result and tags_result.get("rows"):
        for row in tags_result["rows"]:
            tags.append({
                "id": row[0].get("value") if row[0].get("type") != "null" else None,
                "type": "tag",
                "name": to_str(row[1]),
                "slug": to_str(row[2]),
                "usage_count": row[3].get("value") if row[3].get("type") != "null" else 0
            })
    
    return {
        "query": q,
        "results": {
            "projects": projects,
            "freelancers": freelancers,
            "skills": skills,
            "tags": tags
        },
        "total_results": len(projects) + len(freelancers) + len(skills) + len(tags)
    }


@router.get("/autocomplete")
async def search_autocomplete(
    q: str = Query(..., min_length=2, description="Search query"),
    type: Optional[Literal["project", "freelancer", "skill", "tag"]] = Query(None),
    limit: int = Query(10, ge=1, le=50)
):
    """
    Autocomplete suggestions for search
    - Returns quick suggestions as user types
    - Can filter by entity type
    """
    search_term = f"{q}%"
    suggestions = []
    
    if type is None or type == "project":
        projects_result = execute_query(
            """SELECT id, title FROM projects WHERE title LIKE ? AND status = 'open' LIMIT ?""",
            [search_term, limit]
        )
        if projects_result and projects_result.get("rows"):
            for row in projects_result["rows"]:
                suggestions.append({
                    "id": row[0].get("value") if row[0].get("type") != "null" else None,
                    "type": "project",
                    "text": to_str(row[1])
                })
    
    if type is None or type == "freelancer":
        freelancers_result = execute_query(
            """SELECT id, name, first_name, last_name FROM users
               WHERE (name LIKE ? OR first_name LIKE ? OR last_name LIKE ?)
                 AND LOWER(user_type) = 'freelancer' AND is_active = 1
               LIMIT ?""",
            [search_term, search_term, search_term, limit]
        )
        if freelancers_result and freelancers_result.get("rows"):
            for row in freelancers_result["rows"]:
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
    
    if type is None or type == "skill":
        skills_result = execute_query(
            """SELECT id, name FROM skills WHERE name LIKE ? LIMIT ?""",
            [search_term, limit]
        )
        if skills_result and skills_result.get("rows"):
            for row in skills_result["rows"]:
                suggestions.append({
                    "id": row[0].get("value") if row[0].get("type") != "null" else None,
                    "type": "skill",
                    "text": to_str(row[1])
                })
    
    if type is None or type == "tag":
        tags_result = execute_query(
            """SELECT id, name FROM tags WHERE name LIKE ? LIMIT ?""",
            [search_term, limit]
        )
        if tags_result and tags_result.get("rows"):
            for row in tags_result["rows"]:
                suggestions.append({
                    "id": row[0].get("value") if row[0].get("type") != "null" else None,
                    "type": "tag",
                    "text": to_str(row[1])
                })
    
    return {
        "query": q,
        "suggestions": suggestions[:limit]
    }


@router.get("/trending")
async def get_trending(
    type: Literal["projects", "freelancers", "skills", "tags"] = Query("projects"),
    limit: int = Query(10, ge=1, le=50)
):
    """
    Get trending items
    - Most viewed projects
    - Most active freelancers
    - Most used skills/tags
    """
    if type == "projects":
        result = execute_query(
            """SELECT id, title, description, category, budget_type, budget_min, budget_max, experience_level, estimated_duration, status, skills, client_id, created_at, updated_at
               FROM projects
               WHERE status = 'open'
               ORDER BY created_at DESC
               LIMIT ?""",
            [limit]
        )
        
        items = []
        if result and result.get("rows"):
            items = [row_to_project(row) for row in result["rows"]]
        
        return {"type": "projects", "items": items}
    
    elif type == "freelancers":
        result = execute_query(
            """SELECT id, email, name, first_name, last_name, bio, hourly_rate, location, skills, user_type, is_active, created_at
               FROM users
               WHERE LOWER(user_type) = 'freelancer' AND is_active = 1
               ORDER BY created_at DESC
               LIMIT ?""",
            [limit]
        )
        
        items = []
        if result and result.get("rows"):
            items = [row_to_user(row) for row in result["rows"]]
        
        return {"type": "freelancers", "items": items}
    
    elif type == "skills":
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
        
        return {"type": "skills", "items": items}
    
    elif type == "tags":
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
        
        return {"type": "tags", "items": items}
