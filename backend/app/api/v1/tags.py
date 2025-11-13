# @AI-HINT: Tags API endpoints for project tagging system
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import List, Optional, Literal
import re

from app.db.session import get_db
from app.models import Tag, ProjectTag, Project, User
from app.schemas.tag import TagCreate, TagUpdate, TagRead, TagWithProjects
from app.core.security import get_current_user

router = APIRouter(prefix="/tags", tags=["tags"])

def generate_slug(name: str) -> str:
    """Generate URL-friendly slug from tag name"""
    slug = re.sub(r'[^a-zA-Z0-9\s-]', '', name.lower())
    slug = re.sub(r'[\s-]+', '-', slug)
    return slug.strip('-')

@router.post("/", response_model=TagRead, status_code=status.HTTP_201_CREATED)
async def create_tag(
    tag: TagCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new tag
    - Any authenticated user can create tags
    - Auto-generates slug from name
    - Prevents duplicates
    """
    # Check if tag exists
    normalized_name = tag.name.strip().lower()
    existing = db.query(Tag).filter(
        func.lower(Tag.name) == normalized_name
    ).first()
    
    if existing:
        return existing  # Return existing tag instead of error
    
    # Generate slug
    slug = generate_slug(tag.name)
    slug_exists = db.query(Tag).filter(Tag.slug == slug).first()
    if slug_exists:
        # Add number suffix if slug exists
        counter = 1
        while db.query(Tag).filter(Tag.slug == f"{slug}-{counter}").first():
            counter += 1
        slug = f"{slug}-{counter}"
    
    # Create tag
    db_tag = Tag(
        name=normalized_name,
        slug=slug,
        type=tag.type,
        usage_count=0
    )
    
    db.add(db_tag)
    db.commit()
    db.refresh(db_tag)
    
    return db_tag

@router.get("/", response_model=List[TagRead])
async def list_tags(
    type: Optional[Literal["skill", "priority", "location", "budget", "general"]] = Query(None),
    search: Optional[str] = Query(None, description="Search tags by name"),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    """
    List all tags
    - Public endpoint
    - Supports filtering by type
    - Supports search by name
    """
    query = db.query(Tag)
    
    if type:
        query = query.filter(Tag.type == type)
    
    if search:
        query = query.filter(Tag.name.ilike(f"%{search}%"))
    
    tags = query.order_by(Tag.usage_count.desc(), Tag.name).limit(limit).all()
    return tags

@router.get("/popular", response_model=List[TagRead])
async def get_popular_tags(
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get most used tags"""
    tags = db.query(Tag).filter(
        Tag.usage_count > 0
    ).order_by(Tag.usage_count.desc()).limit(limit).all()
    
    return tags

@router.get("/{slug}", response_model=TagRead)
async def get_tag(
    slug: str,
    db: Session = Depends(get_db)
):
    """Get a tag by slug"""
    tag = db.query(Tag).filter(Tag.slug == slug).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    
    return tag

@router.patch("/{tag_id}", response_model=TagRead)
async def update_tag(
    tag_id: int,
    update_data: TagUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update a tag
    - Admin only
    - Can update name and type
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    tag = db.query(Tag).filter(Tag.id == tag_id).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    
    # Update fields
    update_dict = update_data.model_dump(exclude_unset=True)
    
    # Check name uniqueness if changing
    if "name" in update_dict:
        normalized = update_dict["name"].strip().lower()
        existing = db.query(Tag).filter(
            func.lower(Tag.name) == normalized,
            Tag.id != tag_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Tag name already exists")
        
        tag.name = normalized
        tag.slug = generate_slug(normalized)
    
    if "type" in update_dict:
        tag.type = update_dict["type"]
    
    db.commit()
    db.refresh(tag)
    
    return tag

@router.delete("/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tag(
    tag_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a tag
    - Admin only
    - Also removes all project associations
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    tag = db.query(Tag).filter(Tag.id == tag_id).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    
    # Delete all project-tag associations
    db.query(ProjectTag).filter(ProjectTag.tag_id == tag_id).delete()
    
    # Delete tag
    db.delete(tag)
    db.commit()
    
    return None

@router.post("/projects/{project_id}/tags/{tag_id}", status_code=status.HTTP_201_CREATED)
async def add_tag_to_project(
    project_id: int,
    tag_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Add tag to project
    - Project owner or admin can add tags
    """
    # Verify project exists and user has access
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if project.client_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Verify tag exists
    tag = db.query(Tag).filter(Tag.id == tag_id).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    
    # Check if already tagged
    existing = db.query(ProjectTag).filter(
        and_(
            ProjectTag.project_id == project_id,
            ProjectTag.tag_id == tag_id
        )
    ).first()
    
    if existing:
        return {"message": "Tag already added to project"}
    
    # Create association
    project_tag = ProjectTag(project_id=project_id, tag_id=tag_id)
    db.add(project_tag)
    
    # Increment usage count
    tag.usage_count += 1
    
    db.commit()
    
    return {"message": "Tag added to project successfully"}

@router.delete("/projects/{project_id}/tags/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_tag_from_project(
    project_id: int,
    tag_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Remove tag from project
    - Project owner or admin can remove tags
    """
    # Verify project exists and user has access
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if project.client_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Find and delete association
    project_tag = db.query(ProjectTag).filter(
        and_(
            ProjectTag.project_id == project_id,
            ProjectTag.tag_id == tag_id
        )
    ).first()
    
    if not project_tag:
        raise HTTPException(status_code=404, detail="Tag not associated with project")
    
    # Decrement usage count
    tag = db.query(Tag).filter(Tag.id == tag_id).first()
    if tag and tag.usage_count > 0:
        tag.usage_count -= 1
    
    db.delete(project_tag)
    db.commit()
    
    return None

@router.get("/projects/{project_id}/tags", response_model=List[TagRead])
async def get_project_tags(
    project_id: int,
    db: Session = Depends(get_db)
):
    """Get all tags for a project"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    tag_ids = db.query(ProjectTag.tag_id).filter(ProjectTag.project_id == project_id).all()
    tag_ids = [t[0] for t in tag_ids]
    
    tags = db.query(Tag).filter(Tag.id.in_(tag_ids)).all()
    return tags
