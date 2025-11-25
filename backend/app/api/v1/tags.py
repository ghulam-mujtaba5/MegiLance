# @AI-HINT: Tags API endpoints - Turso-only, no SQLite fallback
from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional, Literal
from datetime import datetime
import re

from app.db.turso_http import execute_query, parse_rows
from app.core.security import get_current_user_from_token

router = APIRouter(prefix="/tags", tags=["tags"])


def get_current_user(token_data: dict = Depends(get_current_user_from_token)):
    """Get current user from token"""
    return token_data


def generate_slug(name: str) -> str:
    """Generate URL-friendly slug from tag name"""
    slug = re.sub(r'[^a-zA-Z0-9\s-]', '', name.lower())
    slug = re.sub(r'[\s-]+', '-', slug)
    return slug.strip('-')


@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_tag(
    tag: dict,
    current_user: dict = Depends(get_current_user)
):
    """
    Create a new tag
    - Any authenticated user can create tags
    - Auto-generates slug from name
    - Prevents duplicates
    """
    name = tag.get("name", "").strip().lower()
    tag_type = tag.get("type", "general")
    
    # Check if tag exists
    result = execute_query(
        "SELECT id, name, slug, type, usage_count, created_at FROM tags WHERE LOWER(name) = ?",
        [name]
    )
    if result and result.get("rows"):
        rows = parse_rows(result)
        if rows:
            return rows[0]  # Return existing tag instead of error
    
    # Generate slug
    slug = generate_slug(name)
    result = execute_query("SELECT id FROM tags WHERE slug = ?", [slug])
    if result and result.get("rows"):
        # Add number suffix if slug exists
        counter = 1
        while True:
            check = execute_query("SELECT id FROM tags WHERE slug = ?", [f"{slug}-{counter}"])
            if not check or not check.get("rows"):
                break
            counter += 1
        slug = f"{slug}-{counter}"
    
    now = datetime.utcnow().isoformat()
    
    # Create tag
    result = execute_query(
        "INSERT INTO tags (name, slug, type, usage_count, created_at) VALUES (?, ?, ?, ?, ?)",
        [name, slug, tag_type, 0, now]
    )
    
    if not result:
        raise HTTPException(status_code=500, detail="Failed to create tag")
    
    id_result = execute_query("SELECT last_insert_rowid() as id", [])
    new_id = 0
    if id_result and id_result.get("rows"):
        id_rows = parse_rows(id_result)
        if id_rows:
            new_id = id_rows[0].get("id", 0)
    
    return {
        "id": new_id,
        "name": name,
        "slug": slug,
        "type": tag_type,
        "usage_count": 0,
        "created_at": now
    }


@router.get("/", response_model=List[dict])
async def list_tags(
    type: Optional[Literal["skill", "priority", "location", "budget", "general"]] = Query(None),
    search: Optional[str] = Query(None, description="Search tags by name"),
    limit: int = Query(100, ge=1, le=500)
):
    """
    List all tags
    - Public endpoint
    - Supports filtering by type
    - Supports search by name
    """
    where_clauses = []
    params = []
    
    if type:
        where_clauses.append("type = ?")
        params.append(type)
    
    if search:
        where_clauses.append("name LIKE ?")
        params.append(f"%{search}%")
    
    where_sql = " AND ".join(where_clauses) if where_clauses else "1=1"
    params.append(limit)
    
    result = execute_query(
        f"""SELECT id, name, slug, type, usage_count, created_at
            FROM tags WHERE {where_sql}
            ORDER BY usage_count DESC, name ASC
            LIMIT ?""",
        params
    )
    
    if not result:
        return []
    
    return parse_rows(result)


@router.get("/popular", response_model=List[dict])
async def get_popular_tags(
    limit: int = Query(20, ge=1, le=100)
):
    """Get most used tags"""
    result = execute_query(
        """SELECT id, name, slug, type, usage_count, created_at
           FROM tags WHERE usage_count > 0
           ORDER BY usage_count DESC
           LIMIT ?""",
        [limit]
    )
    
    if not result:
        return []
    
    return parse_rows(result)


@router.get("/{slug}", response_model=dict)
async def get_tag(slug: str):
    """Get a tag by slug"""
    result = execute_query(
        "SELECT id, name, slug, type, usage_count, created_at FROM tags WHERE slug = ?",
        [slug]
    )
    
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Tag not found")
    
    rows = parse_rows(result)
    if not rows:
        raise HTTPException(status_code=404, detail="Tag not found")
    
    return rows[0]


@router.patch("/{tag_id}", response_model=dict)
async def update_tag(
    tag_id: int,
    update_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """
    Update a tag
    - Admin only
    - Can update name and type
    """
    role = current_user.get("role", "")
    if role.lower() != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = execute_query("SELECT id, name, slug, type, usage_count FROM tags WHERE id = ?", [tag_id])
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Tag not found")
    
    rows = parse_rows(result)
    tag = rows[0]
    
    updates = []
    params = []
    
    # Check name uniqueness if changing
    if "name" in update_data:
        normalized = update_data["name"].strip().lower()
        check = execute_query(
            "SELECT id FROM tags WHERE LOWER(name) = ? AND id != ?",
            [normalized, tag_id]
        )
        if check and check.get("rows"):
            raise HTTPException(status_code=400, detail="Tag name already exists")
        
        updates.append("name = ?")
        params.append(normalized)
        updates.append("slug = ?")
        params.append(generate_slug(normalized))
    
    if "type" in update_data:
        updates.append("type = ?")
        params.append(update_data["type"])
    
    if updates:
        params.append(tag_id)
        execute_query(
            f"UPDATE tags SET {', '.join(updates)} WHERE id = ?",
            params
        )
    
    # Fetch updated tag
    result = execute_query(
        "SELECT id, name, slug, type, usage_count, created_at FROM tags WHERE id = ?",
        [tag_id]
    )
    
    rows = parse_rows(result)
    return rows[0] if rows else {}


@router.delete("/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tag(
    tag_id: int,
    current_user: dict = Depends(get_current_user)
):
    """
    Delete a tag
    - Admin only
    - Also removes all project associations
    """
    role = current_user.get("role", "")
    if role.lower() != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = execute_query("SELECT id FROM tags WHERE id = ?", [tag_id])
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Tag not found")
    
    # Delete all project-tag associations
    execute_query("DELETE FROM project_tags WHERE tag_id = ?", [tag_id])
    
    # Delete tag
    execute_query("DELETE FROM tags WHERE id = ?", [tag_id])
    
    return None


@router.post("/projects/{project_id}/tags/{tag_id}", status_code=status.HTTP_201_CREATED)
async def add_tag_to_project(
    project_id: int,
    tag_id: int,
    current_user: dict = Depends(get_current_user)
):
    """
    Add tag to project
    - Project owner or admin can add tags
    """
    user_id = current_user.get("user_id")
    role = current_user.get("role", "")
    
    # Verify project exists and user has access
    result = execute_query("SELECT id, client_id FROM projects WHERE id = ?", [project_id])
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Project not found")
    
    rows = parse_rows(result)
    project = rows[0]
    
    if project.get("client_id") != user_id and role.lower() != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Verify tag exists
    result = execute_query("SELECT id, usage_count FROM tags WHERE id = ?", [tag_id])
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Tag not found")
    
    # Check if already tagged
    result = execute_query(
        "SELECT id FROM project_tags WHERE project_id = ? AND tag_id = ?",
        [project_id, tag_id]
    )
    if result and result.get("rows"):
        return {"message": "Tag already added to project"}
    
    # Create association
    execute_query(
        "INSERT INTO project_tags (project_id, tag_id) VALUES (?, ?)",
        [project_id, tag_id]
    )
    
    # Increment usage count
    execute_query(
        "UPDATE tags SET usage_count = usage_count + 1 WHERE id = ?",
        [tag_id]
    )
    
    return {"message": "Tag added to project successfully"}


@router.delete("/projects/{project_id}/tags/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_tag_from_project(
    project_id: int,
    tag_id: int,
    current_user: dict = Depends(get_current_user)
):
    """
    Remove tag from project
    - Project owner or admin can remove tags
    """
    user_id = current_user.get("user_id")
    role = current_user.get("role", "")
    
    # Verify project exists and user has access
    result = execute_query("SELECT id, client_id FROM projects WHERE id = ?", [project_id])
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Project not found")
    
    rows = parse_rows(result)
    project = rows[0]
    
    if project.get("client_id") != user_id and role.lower() != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Find and delete association
    result = execute_query(
        "SELECT id FROM project_tags WHERE project_id = ? AND tag_id = ?",
        [project_id, tag_id]
    )
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Tag not associated with project")
    
    # Decrement usage count
    execute_query(
        "UPDATE tags SET usage_count = MAX(0, usage_count - 1) WHERE id = ?",
        [tag_id]
    )
    
    execute_query(
        "DELETE FROM project_tags WHERE project_id = ? AND tag_id = ?",
        [project_id, tag_id]
    )
    
    return None


@router.get("/projects/{project_id}/tags", response_model=List[dict])
async def get_project_tags(project_id: int):
    """Get all tags for a project"""
    result = execute_query("SELECT id FROM projects WHERE id = ?", [project_id])
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Project not found")
    
    result = execute_query(
        """SELECT t.id, t.name, t.slug, t.type, t.usage_count, t.created_at
           FROM tags t
           INNER JOIN project_tags pt ON t.id = pt.tag_id
           WHERE pt.project_id = ?""",
        [project_id]
    )
    
    if not result:
        return []
    
    return parse_rows(result)
