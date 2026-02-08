"""
@AI-HINT: Projects API endpoints using Turso remote database ONLY
No local SQLite fallback - all queries go directly to Turso
"""

import re
from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List, Optional
from datetime import datetime, timezone

from app.models.user import User
from app.schemas.project import ProjectCreate, ProjectRead, ProjectUpdate
from app.core.security import get_current_active_user
from app.db.turso_http import get_turso_http
from app.services.profile_validation import is_profile_complete, get_missing_profile_fields
import logging

logger = logging.getLogger("megilance")

router = APIRouter()

# Validation constants
MAX_TITLE_LENGTH = 200
MAX_DESCRIPTION_LENGTH = 10000
MAX_SEARCH_LENGTH = 100
ALLOWED_STATUSES = {"open", "in_progress", "completed", "cancelled", "on_hold"}


def sanitize_search_term(term: str) -> str:
    """
    Sanitize search term to prevent injection and limit special characters.
    """
    if not term:
        return ""
    # Limit length
    term = term[:MAX_SEARCH_LENGTH]
    # Escape SQL LIKE special characters
    term = term.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
    # Remove any null bytes or control characters
    term = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', term)
    return term


def validate_project_input(project: ProjectCreate) -> None:
    """Validate project input data."""
    if len(project.title) > MAX_TITLE_LENGTH:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Title must not exceed {MAX_TITLE_LENGTH} characters"
        )
    if project.description and len(project.description) > MAX_DESCRIPTION_LENGTH:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Description must not exceed {MAX_DESCRIPTION_LENGTH} characters"
        )
    if project.status and project.status.lower() not in ALLOWED_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Allowed: {', '.join(ALLOWED_STATUSES)}"
        )
    if project.budget_min is not None and project.budget_min < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Budget minimum cannot be negative"
        )
    if project.budget_max is not None and project.budget_min is not None:
        if project.budget_max < project.budget_min:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Budget maximum cannot be less than minimum"
            )


def _row_to_project(row: list, columns: list = None) -> dict:
    """Convert database row to project dict"""
    # Default column order from our SELECT queries
    if columns is None:
        columns = ["id", "title", "description", "category", "budget_type", 
                   "budget_min", "budget_max", "experience_level", "estimated_duration",
                   "skills", "client_id", "status", "created_at", "updated_at"]
    
    project = {}
    for i, col in enumerate(columns):
        if i < len(row):
            val = row[i]
            if col == "skills" and isinstance(val, str):
                project[col] = val.split(",") if val else []
            elif col in ["budget_min", "budget_max"] and val is not None:
                project[col] = float(val)
            else:
                project[col] = val
        else:
            project[col] = None
    return project


@router.get("", response_model=List[ProjectRead])
@router.get("/", response_model=List[ProjectRead])
def list_projects(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=100, description="Max records to return"),
    status: Optional[str] = Query(None, description="Filter by project status"),
    category: Optional[str] = Query(None, max_length=50, description="Filter by category"),
    search: Optional[str] = Query(None, max_length=MAX_SEARCH_LENGTH, description="Search in title and description")
):
    """List projects from Turso database (Public)"""
    try:
        turso = get_turso_http()
        
        # Build query with optional filters
        sql = """SELECT id, title, description, category, budget_type, 
                        budget_min, budget_max, experience_level, estimated_duration,
                        skills, client_id, status, created_at, updated_at 
                 FROM projects WHERE 1=1"""
        params = []
        
        if status:
            # Validate status
            if status.lower() not in ALLOWED_STATUSES:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid status. Allowed: {', '.join(ALLOWED_STATUSES)}"
                )
            sql += " AND status = ?"
            params.append(status.lower())
        else:
            # By default only show open projects for public list
            sql += " AND status = 'open'"
            
        if category:
            sql += " AND category = ?"
            params.append(category)
        if search:
            # Sanitize search term
            safe_search = sanitize_search_term(search)
            if safe_search:
                sql += " AND (title LIKE ? ESCAPE '\\' OR description LIKE ? ESCAPE '\\')"
                params.extend([f"%{safe_search}%", f"%{safe_search}%"])
        
        sql += f" ORDER BY created_at DESC LIMIT {limit} OFFSET {skip}"
        
        result = turso.execute(sql, params)
        projects = [_row_to_project(row) for row in result.get("rows", [])]
        return projects
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("list_projects failed: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database temporarily unavailable"
        )


@router.get("/my-projects", response_model=List[ProjectRead])
def get_my_projects(
    current_user: User = Depends(get_current_active_user)
):
    """Get projects for the current user (client's posted projects or freelancer's active projects)"""
    try:
        turso = get_turso_http()
        
        if current_user.user_type and current_user.user_type.lower() == "client":
            # Get client's posted projects
            sql = """SELECT id, title, description, category, budget_type, 
                            budget_min, budget_max, experience_level, estimated_duration,
                            skills, client_id, status, created_at, updated_at 
                     FROM projects WHERE client_id = ? ORDER BY created_at DESC"""
            result = turso.execute(sql, [current_user.id])
        else:
            # Get freelancer's projects (via contracts)
            # Note: This returns the project details for contracts the freelancer is involved in
            sql = """SELECT p.id, p.title, p.description, p.category, p.budget_type, 
                            p.budget_min, p.budget_max, p.experience_level, p.estimated_duration,
                            p.skills, p.client_id, p.status, p.created_at, p.updated_at 
                     FROM projects p
                     JOIN contracts c ON p.id = c.project_id
                     WHERE c.freelancer_id = ? ORDER BY c.created_at DESC"""
            result = turso.execute(sql, [current_user.id])
            
        projects = [_row_to_project(row) for row in result.get("rows", [])]
        return projects
        
    except Exception as e:
        logger.error("get_my_projects failed: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database temporarily unavailable"
        )


@router.get("/{project_id}", response_model=ProjectRead)
def get_project(
    project_id: int
):
    """Get single project from Turso (Public)"""
    try:
        turso = get_turso_http()
        row = turso.fetch_one(
            """SELECT id, title, description, category, budget_type, 
                      budget_min, budget_max, experience_level, estimated_duration,
                      skills, client_id, status, created_at, updated_at 
               FROM projects WHERE id = ?""",
            [project_id]
        )
        
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        
        return _row_to_project(row)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("get_project failed: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database temporarily unavailable"
        )


@router.post("", response_model=ProjectRead, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=ProjectRead, status_code=status.HTTP_201_CREATED)
def create_project(
    project: ProjectCreate,
    current_user: User = Depends(get_current_active_user)
):
    """Create new project in Turso"""
    # Only clients can create projects
    if not current_user.user_type or current_user.user_type.lower() != "client":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only clients can create projects"
        )
    
    # Check profile completion
    if not is_profile_complete(current_user):
        missing = get_missing_profile_fields(current_user)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Please complete your profile before posting a project. Missing: {', '.join(missing)}"
        )
    
    # Validate input
    validate_project_input(project)
    
    try:
        turso = get_turso_http()
        now = datetime.now(timezone.utc).isoformat()
        skills_str = ",".join(project.skills) if project.skills else ""
        
        # Insert project
        turso.execute(
            """INSERT INTO projects (title, description, category, budget_type, 
                                     budget_min, budget_max, experience_level, estimated_duration,
                                     skills, client_id, status, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            [project.title, project.description, project.category, project.budget_type,
             project.budget_min, project.budget_max, project.experience_level, 
             project.estimated_duration, skills_str, current_user.id,
             project.status or "open", now, now]
        )
        
        # Get the created project
        row = turso.fetch_one(
            """SELECT id, title, description, category, budget_type, 
                      budget_min, budget_max, experience_level, estimated_duration,
                      skills, client_id, status, created_at, updated_at 
               FROM projects WHERE client_id = ? ORDER BY id DESC LIMIT 1""",
            [current_user.id]
        )
        
        if not row:
            raise HTTPException(status_code=500, detail="Project created but not found")
        
        return _row_to_project(row)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("create_project failed: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database temporarily unavailable"
        )


@router.put("/{project_id}", response_model=ProjectRead)
def update_project(
    project_id: int,
    project_update: ProjectUpdate,
    current_user: User = Depends(get_current_active_user)
):
    """Update project in Turso"""
    try:
        turso = get_turso_http()
        
        # Check project exists and user owns it
        existing = turso.fetch_one("SELECT client_id FROM projects WHERE id = ?", [project_id])
        if not existing:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        if existing[0] != current_user.id and current_user.role != "Admin":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
        
        # Build update query
        updates = []
        params = []
        
        update_data = project_update.dict(exclude_unset=True)
        for key, value in update_data.items():
            if key == "skills" and value is not None:
                value = ",".join(value) if value else ""
            updates.append(f"{key} = ?")
            params.append(value)
        
        if updates:
            updates.append("updated_at = ?")
            params.append(datetime.now(timezone.utc).isoformat())
            params.append(project_id)
            
            turso.execute(
                f"UPDATE projects SET {', '.join(updates)} WHERE id = ?",
                params
            )
        
        # Return updated project
        row = turso.fetch_one(
            """SELECT id, title, description, category, budget_type, 
                      budget_min, budget_max, experience_level, estimated_duration,
                      skills, client_id, status, created_at, updated_at 
               FROM projects WHERE id = ?""",
            [project_id]
        )
        return _row_to_project(row)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("update_project failed: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database temporarily unavailable"
        )


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: int,
    current_user: User = Depends(get_current_active_user)
):
    """Delete project from Turso"""
    try:
        turso = get_turso_http()
        
        # Check project exists and user owns it
        existing = turso.fetch_one("SELECT client_id FROM projects WHERE id = ?", [project_id])
        if not existing:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        if existing[0] != current_user.id and current_user.role != "Admin":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
        
        turso.execute("DELETE FROM projects WHERE id = ?", [project_id])
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("delete_project failed: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database temporarily unavailable"
        )
