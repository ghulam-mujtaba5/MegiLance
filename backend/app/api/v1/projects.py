"""
@AI-HINT: Projects API endpoints using Turso remote database ONLY
No local SQLite fallback - all queries go directly to Turso
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List, Optional
from datetime import datetime

from app.models.user import User
from app.schemas.project import ProjectCreate, ProjectRead, ProjectUpdate
from app.core.security import get_current_active_user
from app.db.turso_http import get_turso_http

router = APIRouter()


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


@router.get("/", response_model=List[ProjectRead])
def list_projects(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    status: Optional[str] = Query(None, description="Filter by project status"),
    category: Optional[str] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, description="Search in title and description")
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
            sql += " AND status = ?"
            params.append(status)
        else:
            # By default only show open projects for public list
            sql += " AND status = 'open'"
            
        if category:
            sql += " AND category = ?"
            params.append(category)
        if search:
            sql += " AND (title LIKE ? OR description LIKE ?)"
            params.extend([f"%{search}%", f"%{search}%"])
        
        sql += f" ORDER BY created_at DESC LIMIT {limit} OFFSET {skip}"
        
        result = turso.execute(sql, params)
        projects = [_row_to_project(row) for row in result.get("rows", [])]
        return projects
        
    except Exception as e:
        print(f"[ERROR] list_projects: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database unavailable: {str(e)}"
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
        print(f"[ERROR] get_my_projects: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database unavailable: {str(e)}"
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
        print(f"[ERROR] get_project: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database unavailable: {str(e)}"
        )


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
    
    try:
        turso = get_turso_http()
        now = datetime.utcnow().isoformat()
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
        print(f"[ERROR] create_project: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database unavailable: {str(e)}"
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
            params.append(datetime.utcnow().isoformat())
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
        print(f"[ERROR] update_project: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database unavailable: {str(e)}"
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
        print(f"[ERROR] delete_project: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database unavailable: {str(e)}"
        )
