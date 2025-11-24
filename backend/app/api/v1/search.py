# @AI-HINT: Advanced Search API for projects, freelancers, and global search
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from typing import List, Optional, Literal
from datetime import datetime

from app.db.session import get_db
from app.models import Project, User, Skill, UserSkill, ProjectTag, Tag
from app.schemas.project import ProjectRead
from app.schemas.user import UserRead
from app.core.security import get_current_user

router = APIRouter(prefix="/search", tags=["search"])

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
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """
    Advanced project search
    - Search by keywords in title/description
    - Filter by skills, category, budget range, experience level
    - Public endpoint
    """
    query = db.query(Project)
    
    # Text search
    if q:
        search_term = f"%{q}%"
        query = query.filter(
            or_(
                Project.title.ilike(search_term),
                Project.description.ilike(search_term)
            )
        )
    
    # Filter by status
    if status:
        query = query.filter(Project.status == status)
    
    # Filter by category
    if category:
        query = query.filter(Project.category.ilike(f"%{category}%"))
    
    # Filter by budget range
    if budget_min is not None:
        query = query.filter(Project.budget_min >= budget_min)
    if budget_max is not None:
        query = query.filter(Project.budget_max <= budget_max)
    
    # Filter by budget type
    if budget_type:
        query = query.filter(Project.budget_type == budget_type)
    
    # Filter by experience level
    if experience_level:
        query = query.filter(Project.experience_level == experience_level)
    
    # Filter by skills (if project's skills JSON contains any of the search skills)
    if skills:
        skill_list = [s.strip().lower() for s in skills.split(',')]
        # Generic DB text search fallback (JSON search enhancements future)
        for skill in skill_list:
            query = query.filter(Project.skills.ilike(f"%{skill}%"))
    
    # Order by most recent first
    query = query.order_by(Project.created_at.desc())
    
    projects = query.offset(offset).limit(limit).all()
    return projects

@router.get("/freelancers", response_model=List[UserRead])
async def search_freelancers(
    q: Optional[str] = Query(None, description="Search query (name, bio)"),
    skills: Optional[str] = Query(None, description="Comma-separated skill names"),
    min_rate: Optional[float] = Query(None, ge=0, description="Minimum hourly rate"),
    max_rate: Optional[float] = Query(None, ge=0, description="Maximum hourly rate"),
    location: Optional[str] = Query(None, description="Location filter"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """
    Advanced freelancer search
    - Search by keywords in name/bio
    - Filter by skills, hourly rate, location
    - Public endpoint
    """
    query = db.query(User).filter(User.user_type == "freelancer", User.is_active == True)
    
    # Text search
    if q:
        search_term = f"%{q}%"
        query = query.filter(
            or_(
                User.name.ilike(search_term),
                User.first_name.ilike(search_term),
                User.last_name.ilike(search_term),
                User.bio.ilike(search_term)
            )
        )
    
    # Filter by hourly rate range
    if min_rate is not None:
        query = query.filter(User.hourly_rate >= min_rate)
    if max_rate is not None:
        query = query.filter(User.hourly_rate <= max_rate)
    
    # Filter by location
    if location:
        query = query.filter(User.location.ilike(f"%{location}%"))
    
    # Filter by skills
    if skills:
        skill_list = [s.strip().lower() for s in skills.split(',')]
        # Get users with matching skills
        for skill in skill_list:
            query = query.filter(User.skills.ilike(f"%{skill}%"))
    
    # Order by most recent first
    query = query.order_by(User.created_at.desc())
    
    freelancers = query.offset(offset).limit(limit).all()
    return freelancers

@router.get("/global")
async def global_search(
    q: str = Query(..., min_length=2, description="Search query"),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """
    Global search across projects, freelancers, and skills
    - Returns mixed results from all searchable entities
    - Public endpoint
    """
    search_term = f"%{q}%"
    
    # Search projects
    projects = db.query(Project).filter(
        or_(
            Project.title.ilike(search_term),
            Project.description.ilike(search_term)
        ),
        Project.status == "open"
    ).limit(limit).all()
    
    # Search freelancers
    freelancers = db.query(User).filter(
        or_(
            User.name.ilike(search_term),
            User.first_name.ilike(search_term),
            User.last_name.ilike(search_term),
            User.bio.ilike(search_term)
        ),
        User.user_type == "freelancer",
        User.is_active == True
    ).limit(limit).all()
    
    # Search skills
    skills = db.query(Skill).filter(
        Skill.name.ilike(search_term)
    ).limit(limit).all()
    
    # Search tags
    tags = db.query(Tag).filter(
        Tag.name.ilike(search_term)
    ).limit(limit).all()
    
    return {
        "query": q,
        "results": {
            "projects": [
                {
                    "id": p.id,
                    "type": "project",
                    "title": p.title,
                    "description": p.description[:200] if p.description else None,
                    "budget_type": p.budget_type,
                    "status": p.status
                }
                for p in projects
            ],
            "freelancers": [
                {
                    "id": f.id,
                    "type": "freelancer",
                    "name": f.name or f"{f.first_name} {f.last_name}",
                    "bio": f.bio[:200] if f.bio else None,
                    "hourly_rate": f.hourly_rate,
                    "location": f.location
                }
                for f in freelancers
            ],
            "skills": [
                {
                    "id": s.id,
                    "type": "skill",
                    "name": s.name,
                    "category": s.category
                }
                for s in skills
            ],
            "tags": [
                {
                    "id": t.id,
                    "type": "tag",
                    "name": t.name,
                    "slug": t.slug,
                    "usage_count": t.usage_count
                }
                for t in tags
            ]
        },
        "total_results": len(projects) + len(freelancers) + len(skills) + len(tags)
    }

@router.get("/autocomplete")
async def search_autocomplete(
    q: str = Query(..., min_length=2, description="Search query"),
    type: Optional[Literal["project", "freelancer", "skill", "tag"]] = Query(None),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """
    Autocomplete suggestions for search
    - Returns quick suggestions as user types
    - Can filter by entity type
    """
    search_term = f"{q}%"
    suggestions = []
    
    if type is None or type == "project":
        projects = db.query(Project.id, Project.title).filter(
            Project.title.ilike(search_term),
            Project.status == "open"
        ).limit(limit).all()
        suggestions.extend([
            {"id": p.id, "type": "project", "text": p.title}
            for p in projects
        ])
    
    if type is None or type == "freelancer":
        freelancers = db.query(User.id, User.name, User.first_name, User.last_name).filter(
            or_(
                User.name.ilike(search_term),
                User.first_name.ilike(search_term),
                User.last_name.ilike(search_term)
            ),
            User.user_type == "freelancer",
            User.is_active == True
        ).limit(limit).all()
        suggestions.extend([
            {
                "id": f.id,
                "type": "freelancer",
                "text": f.name or f"{f.first_name} {f.last_name}"
            }
            for f in freelancers
        ])
    
    if type is None or type == "skill":
        skills = db.query(Skill.id, Skill.name).filter(
            Skill.name.ilike(search_term)
        ).limit(limit).all()
        suggestions.extend([
            {"id": s.id, "type": "skill", "text": s.name}
            for s in skills
        ])
    
    if type is None or type == "tag":
        tags = db.query(Tag.id, Tag.name).filter(
            Tag.name.ilike(search_term)
        ).limit(limit).all()
        suggestions.extend([
            {"id": t.id, "type": "tag", "text": t.name}
            for t in tags
        ])
    
    return {
        "query": q,
        "suggestions": suggestions[:limit]
    }

@router.get("/trending")
async def get_trending(
    type: Literal["projects", "freelancers", "skills", "tags"] = Query("projects"),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """
    Get trending items
    - Most viewed projects
    - Most active freelancers
    - Most used skills/tags
    """
    if type == "projects":
        # Most recent open projects (could add view_count for better trending)
        projects = db.query(Project).filter(
            Project.status == "open"
        ).order_by(Project.created_at.desc()).limit(limit).all()
        
        return {
            "type": "projects",
            "items": [ProjectRead.model_validate(p) for p in projects]
        }
    
    elif type == "freelancers":
        # Most recently active freelancers
        freelancers = db.query(User).filter(
            User.user_type == "freelancer",
            User.is_active == True
        ).order_by(User.created_at.desc()).limit(limit).all()
        
        return {
            "type": "freelancers",
            "items": [UserRead.model_validate(f) for f in freelancers]
        }
    
    elif type == "skills":
        # Most used skills (by user_skill count)
        skills = db.query(Skill).order_by(Skill.created_at.desc()).limit(limit).all()
        
        return {
            "type": "skills",
            "items": [
                {"id": s.id, "name": s.name, "category": s.category}
                for s in skills
            ]
        }
    
    elif type == "tags":
        # Most used tags
        tags = db.query(Tag).filter(
            Tag.usage_count > 0
        ).order_by(Tag.usage_count.desc()).limit(limit).all()
        
        return {
            "type": "tags",
            "items": [
                {
                    "id": t.id,
                    "name": t.name,
                    "slug": t.slug,
                    "usage_count": t.usage_count
                }
                for t in tags
            ]
        }
