# @AI-HINT: Favorites API endpoints - Turso-only, no SQLite fallback
from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Literal, Optional
from datetime import datetime

from app.db.turso_http import execute_query, parse_rows
from app.core.security import get_current_user_from_token

router = APIRouter(prefix="/favorites", tags=["favorites"])


def get_current_user(token_data = Depends(get_current_user_from_token)):
    """Get current user from token"""
    return token_data


@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_favorite(
    favorite: dict,
    current_user = Depends(get_current_user)
):
    """
    Add item to favorites
    - Users can favorite projects or freelancers
    - Prevents duplicate favorites
    """
    user_id = current_user.get("user_id")
    target_type = favorite.get("target_type")
    target_id = favorite.get("target_id")
    
    # Check if already favorited
    result = execute_query(
        "SELECT id FROM favorites WHERE user_id = ? AND target_type = ? AND target_id = ?",
        [user_id, target_type, target_id]
    )
    
    if result and result.get("rows"):
        raise HTTPException(status_code=400, detail="Already in favorites")
    
    # Verify target exists
    if target_type == "project":
        result = execute_query("SELECT id FROM projects WHERE id = ?", [target_id])
        if not result or not result.get("rows"):
            raise HTTPException(status_code=404, detail="Project not found")
    elif target_type == "freelancer":
        result = execute_query(
            "SELECT id FROM users WHERE id = ? AND LOWER(user_type) = 'freelancer'",
            [target_id]
        )
        if not result or not result.get("rows"):
            raise HTTPException(status_code=404, detail="Freelancer not found")
    
    # Create favorite
    now = datetime.utcnow().isoformat()
    result = execute_query(
        "INSERT INTO favorites (user_id, target_type, target_id, created_at) VALUES (?, ?, ?, ?)",
        [user_id, target_type, target_id, now]
    )
    
    if not result:
        raise HTTPException(status_code=500, detail="Failed to create favorite")
    
    # Get the new favorite ID
    id_result = execute_query("SELECT last_insert_rowid() as id", [])
    new_id = 0
    if id_result and id_result.get("rows"):
        id_rows = parse_rows(id_result)
        if id_rows:
            new_id = id_rows[0].get("id", 0)
    
    return {
        "id": new_id,
        "user_id": user_id,
        "target_type": target_type,
        "target_id": target_id,
        "created_at": now
    }


@router.get("/", response_model=List[dict])
async def list_favorites(
    target_type: Optional[Literal["project", "freelancer"]] = Query(None, description="Filter by type"),
    current_user = Depends(get_current_user)
):
    """
    List user's favorites
    - Returns user's bookmarked items
    - Can filter by type (project/freelancer)
    """
    user_id = current_user.get("user_id")
    
    if target_type:
        result = execute_query(
            """SELECT id, user_id, target_type, target_id, created_at
               FROM favorites WHERE user_id = ? AND target_type = ?
               ORDER BY created_at DESC""",
            [user_id, target_type]
        )
    else:
        result = execute_query(
            """SELECT id, user_id, target_type, target_id, created_at
               FROM favorites WHERE user_id = ?
               ORDER BY created_at DESC""",
            [user_id]
        )
    
    if not result:
        return []
    
    return parse_rows(result)


@router.delete("/{favorite_id}", response_model=dict)
async def delete_favorite(
    favorite_id: int,
    current_user = Depends(get_current_user)
):
    """Remove item from favorites"""
    user_id = current_user.get("user_id")
    
    result = execute_query(
        "SELECT id, user_id, target_type, target_id FROM favorites WHERE id = ?",
        [favorite_id]
    )
    
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Favorite not found")
    
    rows = parse_rows(result)
    if not rows:
        raise HTTPException(status_code=404, detail="Favorite not found")
    
    favorite = rows[0]
    if favorite.get("user_id") != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    target_type = favorite.get("target_type")
    target_id = favorite.get("target_id")
    
    execute_query("DELETE FROM favorites WHERE id = ?", [favorite_id])
    
    return {
        "message": "Removed from favorites",
        "target_type": target_type,
        "target_id": target_id
    }


@router.delete("/remove/{target_type}/{target_id}", response_model=dict)
async def remove_favorite_by_target(
    target_type: Literal["project", "freelancer"],
    target_id: int,
    current_user = Depends(get_current_user)
):
    """Remove item from favorites by type and ID"""
    user_id = current_user.get("user_id")
    
    result = execute_query(
        "SELECT id FROM favorites WHERE user_id = ? AND target_type = ? AND target_id = ?",
        [user_id, target_type, target_id]
    )
    
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Not in favorites")
    
    execute_query(
        "DELETE FROM favorites WHERE user_id = ? AND target_type = ? AND target_id = ?",
        [user_id, target_type, target_id]
    )
    
    return {
        "message": "Removed from favorites",
        "target_type": target_type,
        "target_id": target_id
    }


@router.get("/check/{target_type}/{target_id}")
async def check_favorite(
    target_type: Literal["project", "freelancer"],
    target_id: int,
    current_user = Depends(get_current_user)
):
    """Check if item is favorited"""
    user_id = current_user.get("user_id")
    
    result = execute_query(
        "SELECT id FROM favorites WHERE user_id = ? AND target_type = ? AND target_id = ?",
        [user_id, target_type, target_id]
    )
    
    is_favorited = result and result.get("rows") and len(result["rows"]) > 0
    favorite_id = None
    
    if is_favorited:
        rows = parse_rows(result)
        if rows:
            favorite_id = rows[0].get("id")
    
    return {
        "is_favorited": is_favorited,
        "favorite_id": favorite_id
    }
