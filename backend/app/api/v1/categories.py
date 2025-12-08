# @AI-HINT: Categories API endpoints - Turso-only, no SQLite fallback
from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from datetime import datetime
import re

from app.db.turso_http import execute_query, parse_rows
from app.core.security import get_current_user_from_token

router = APIRouter(prefix="/categories", tags=["categories"])


def get_current_user(token_data = Depends(get_current_user_from_token)):
    """Get current user from token"""
    return token_data


def generate_slug(name: str) -> str:
    """Generate URL-friendly slug from category name"""
    slug = re.sub(r'[^a-zA-Z0-9\s-]', '', name.lower())
    slug = re.sub(r'[\s-]+', '-', slug)
    return slug.strip('-')


@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_category(
    category: dict,
    current_user = Depends(get_current_user)
):
    """
    Create a new category
    - Admin only
    - Auto-generates slug from name
    - Supports parent-child hierarchy
    """
    role = current_user.get("role", "")
    if role.lower() != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    name = category.get("name", "")
    
    # Check if category name exists
    result = execute_query(
        "SELECT id FROM categories WHERE LOWER(name) = LOWER(?)",
        [name]
    )
    if result and result.get("rows"):
        raise HTTPException(status_code=400, detail="Category name already exists")
    
    # Verify parent category exists
    parent_id = category.get("parent_id")
    if parent_id:
        result = execute_query("SELECT id FROM categories WHERE id = ?", [parent_id])
        if not result or not result.get("rows"):
            raise HTTPException(status_code=404, detail="Parent category not found")
    
    # Generate slug
    slug = generate_slug(name)
    result = execute_query("SELECT id FROM categories WHERE slug = ?", [slug])
    if result and result.get("rows"):
        slug = f"{slug}-{int(datetime.utcnow().timestamp())}"
    
    now = datetime.utcnow().isoformat()
    
    # Create category
    result = execute_query(
        """INSERT INTO categories (name, slug, description, icon, parent_id, sort_order, is_active, project_count, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        [
            name,
            slug,
            category.get("description"),
            category.get("icon"),
            parent_id,
            category.get("sort_order", 0),
            1,
            0,
            now,
            now
        ]
    )
    
    if not result:
        raise HTTPException(status_code=500, detail="Failed to create category")
    
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
        "description": category.get("description"),
        "icon": category.get("icon"),
        "parent_id": parent_id,
        "sort_order": category.get("sort_order", 0),
        "is_active": True,
        "project_count": 0,
        "created_at": now,
        "updated_at": now
    }


@router.get("/", response_model=List[dict])
async def list_categories(
    active_only: bool = Query(True, description="Show only active categories"),
    parent_id: Optional[int] = Query(None, description="Filter by parent category")
):
    """
    List all categories
    - Public endpoint
    - Supports filtering by parent
    - Returns flat list
    """
    where_clauses = []
    params = []
    
    if active_only:
        where_clauses.append("is_active = 1")
    
    if parent_id is not None:
        where_clauses.append("parent_id = ?")
        params.append(parent_id)
    
    where_sql = " AND ".join(where_clauses) if where_clauses else "1=1"
    
    result = execute_query(
        f"""SELECT id, name, slug, description, icon, parent_id, sort_order, is_active, project_count, created_at, updated_at
            FROM categories WHERE {where_sql}
            ORDER BY sort_order, name""",
        params
    )
    
    if not result:
        return []
    
    rows = parse_rows(result)
    for row in rows:
        row["is_active"] = bool(row.get("is_active"))
    return rows


@router.get("/tree", response_model=List[dict])
async def get_category_tree(
    active_only: bool = Query(True, description="Show only active categories")
):
    """
    Get hierarchical category tree
    - Returns nested structure with children
    - Public endpoint
    """
    where_sql = "is_active = 1" if active_only else "1=1"
    
    result = execute_query(
        f"""SELECT id, name, slug, description, icon, parent_id, sort_order, is_active, project_count, created_at, updated_at
            FROM categories WHERE {where_sql}
            ORDER BY sort_order, name""",
        []
    )
    
    if not result:
        return []
    
    all_categories = parse_rows(result)
    for cat in all_categories:
        cat["is_active"] = bool(cat.get("is_active"))
        cat["children"] = []
    
    # Build tree structure
    category_map = {cat["id"]: cat for cat in all_categories}
    root_categories = []
    
    for cat in all_categories:
        parent_id = cat.get("parent_id")
        if parent_id and parent_id in category_map:
            category_map[parent_id]["children"].append(cat)
        else:
            root_categories.append(cat)
    
    return root_categories


@router.get("/{slug}", response_model=dict)
async def get_category(slug: str):
    """Get a category by slug"""
    result = execute_query(
        """SELECT id, name, slug, description, icon, parent_id, sort_order, is_active, project_count, created_at, updated_at
           FROM categories WHERE slug = ?""",
        [slug]
    )
    
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Category not found")
    
    rows = parse_rows(result)
    if not rows:
        raise HTTPException(status_code=404, detail="Category not found")
    
    cat = rows[0]
    cat["is_active"] = bool(cat.get("is_active"))
    return cat


@router.patch("/{category_id}", response_model=dict)
async def update_category(
    category_id: int,
    update_data: dict,
    current_user = Depends(get_current_user)
):
    """
    Update a category
    - Admin only
    - Can update name, description, icon, parent, sort order, active status
    """
    role = current_user.get("role", "")
    if role.lower() != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = execute_query(
        "SELECT id, name, slug FROM categories WHERE id = ?",
        [category_id]
    )
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Category not found")
    
    rows = parse_rows(result)
    category = rows[0]
    
    updates = []
    params = []
    
    # Check name uniqueness if changing name
    if "name" in update_data and update_data["name"] != category.get("name"):
        check = execute_query(
            "SELECT id FROM categories WHERE LOWER(name) = LOWER(?) AND id != ?",
            [update_data["name"], category_id]
        )
        if check and check.get("rows"):
            raise HTTPException(status_code=400, detail="Category name already exists")
        
        updates.append("name = ?")
        params.append(update_data["name"])
        updates.append("slug = ?")
        params.append(generate_slug(update_data["name"]))
    
    # Verify parent if changing
    if "parent_id" in update_data and update_data["parent_id"]:
        if update_data["parent_id"] == category_id:
            raise HTTPException(status_code=400, detail="Category cannot be its own parent")
        
        check = execute_query("SELECT id FROM categories WHERE id = ?", [update_data["parent_id"]])
        if not check or not check.get("rows"):
            raise HTTPException(status_code=404, detail="Parent category not found")
        
        updates.append("parent_id = ?")
        params.append(update_data["parent_id"])
    elif "parent_id" in update_data and update_data["parent_id"] is None:
        updates.append("parent_id = ?")
        params.append(None)
    
    for field in ["description", "icon", "sort_order"]:
        if field in update_data:
            updates.append(f"{field} = ?")
            params.append(update_data[field])
    
    if "is_active" in update_data:
        updates.append("is_active = ?")
        params.append(1 if update_data["is_active"] else 0)
    
    if updates:
        updates.append("updated_at = ?")
        params.append(datetime.utcnow().isoformat())
        params.append(category_id)
        
        execute_query(
            f"UPDATE categories SET {', '.join(updates)} WHERE id = ?",
            params
        )
    
    # Fetch updated category
    result = execute_query(
        """SELECT id, name, slug, description, icon, parent_id, sort_order, is_active, project_count, created_at, updated_at
           FROM categories WHERE id = ?""",
        [category_id]
    )
    
    rows = parse_rows(result)
    if not rows:
        raise HTTPException(status_code=404, detail="Category not found")
    
    cat = rows[0]
    cat["is_active"] = bool(cat.get("is_active"))
    return cat


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: int,
    current_user = Depends(get_current_user)
):
    """
    Delete a category
    - Admin only
    - Cannot delete if has child categories or projects
    """
    role = current_user.get("role", "")
    if role.lower() != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = execute_query(
        "SELECT id, project_count FROM categories WHERE id = ?",
        [category_id]
    )
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Category not found")
    
    rows = parse_rows(result)
    category = rows[0]
    
    # Check for children
    result = execute_query(
        "SELECT COUNT(*) as count FROM categories WHERE parent_id = ?",
        [category_id]
    )
    if result and result.get("rows"):
        count_rows = parse_rows(result)
        children = count_rows[0].get("count", 0) if count_rows else 0
        if children > 0:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot delete category with {children} child categories"
            )
    
    # Check for projects
    project_count = category.get("project_count", 0)
    if project_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete category with {project_count} projects. Set to inactive instead."
        )
    
    execute_query("DELETE FROM categories WHERE id = ?", [category_id])
    
    return None
