# @AI-HINT: Advanced Search API for projects, freelancers, and global search - Turso HTTP only
# Enhanced with input sanitization and security measures
import re
from fastapi import APIRouter, Depends, Query, HTTPException, status
from typing import List, Optional, Literal

from app.schemas.project import ProjectRead
from app.schemas.user import UserRead
from app.services import search_service

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
    
    return search_service.search_projects_db(where_clause, params)


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
    
    return search_service.search_freelancers_db(where_clause, params)


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
    
    projects = search_service.global_search_projects(search_term, limit)
    freelancers = search_service.global_search_freelancers(search_term, limit)
    skills = search_service.global_search_skills(search_term, limit)
    tags = search_service.global_search_tags(search_term, limit)
    
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
        suggestions.extend(search_service.autocomplete_projects(search_term, limit))
    
    if type is None or type == "freelancer":
        suggestions.extend(search_service.autocomplete_freelancers(search_term, limit))
    
    if type is None or type == "skill":
        suggestions.extend(search_service.autocomplete_skills(search_term, limit))
    
    if type is None or type == "tag":
        suggestions.extend(search_service.autocomplete_tags(search_term, limit))
    
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
        items = search_service.get_trending_projects(limit)
        return {"type": "projects", "items": items}
    
    elif type == "freelancers":
        items = search_service.get_trending_freelancers(limit)
        return {"type": "freelancers", "items": items}
    
    elif type == "skills":
        items = search_service.get_trending_skills(limit)
        return {"type": "skills", "items": items}
    
    elif type == "tags":
        items = search_service.get_trending_tags(limit)
        return {"type": "tags", "items": items}
