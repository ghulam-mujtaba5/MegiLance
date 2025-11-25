# @AI-HINT: Portfolio items API - Turso-only, no SQLite fallback
from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List, Optional
from datetime import datetime

from app.db.turso_http import execute_query, parse_rows
from app.core.security import get_current_user_from_token

router = APIRouter()


def get_current_user(token_data: dict = Depends(get_current_user_from_token)):
    """Get current user from token"""
    return token_data


@router.get("/", response_model=List[dict])
def list_portfolio_items(
    user_id: Optional[int] = Query(None, description="Filter by freelancer ID"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: dict = Depends(get_current_user)
):
    """List portfolio items for a user"""
    target_user_id = user_id if user_id else current_user.get("user_id")
    
    # If viewing another user's portfolio, verify they are a freelancer
    if target_user_id != current_user.get("user_id"):
        result = execute_query(
            "SELECT id, user_type FROM users WHERE id = ?",
            [target_user_id]
        )
        if not result or not result.get("rows"):
            raise HTTPException(status_code=404, detail="Portfolio not found")
        rows = parse_rows(result)
        if not rows:
            raise HTTPException(status_code=404, detail="Portfolio not found")
        user_type = rows[0].get("user_type", "")
        if user_type and user_type.lower() != "freelancer":
            raise HTTPException(status_code=404, detail="Portfolio not found")
    
    result = execute_query(
        """SELECT id, freelancer_id, title, description, image_url, project_url, 
                  created_at, updated_at
           FROM portfolio_items 
           WHERE freelancer_id = ?
           ORDER BY created_at DESC
           LIMIT ? OFFSET ?""",
        [target_user_id, limit, skip]
    )
    
    if not result:
        return []
    
    return parse_rows(result)


@router.get("/{portfolio_item_id}", response_model=dict)
def get_portfolio_item(
    portfolio_item_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific portfolio item"""
    result = execute_query(
        """SELECT id, freelancer_id, title, description, image_url, project_url,
                  created_at, updated_at
           FROM portfolio_items WHERE id = ?""",
        [portfolio_item_id]
    )
    
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Portfolio item not found")
    
    rows = parse_rows(result)
    if not rows:
        raise HTTPException(status_code=404, detail="Portfolio item not found")
    
    return rows[0]


@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_portfolio_item(
    portfolio_item: dict,
    current_user: dict = Depends(get_current_user)
):
    """Create a new portfolio item"""
    user_role = current_user.get("role", "")
    if user_role.lower() != "freelancer":
        raise HTTPException(
            status_code=403,
            detail="Only freelancers can create portfolio items"
        )
    
    user_id = current_user.get("user_id")
    now = datetime.utcnow().isoformat()
    
    result = execute_query(
        """INSERT INTO portfolio_items (freelancer_id, title, description, image_url, project_url, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)""",
        [
            user_id,
            portfolio_item.get("title"),
            portfolio_item.get("description"),
            portfolio_item.get("image_url"),
            portfolio_item.get("project_url"),
            now,
            now
        ]
    )
    
    if not result:
        raise HTTPException(status_code=500, detail="Failed to create portfolio item")
    
    # Get the last inserted ID
    id_result = execute_query("SELECT last_insert_rowid() as id", [])
    new_id = 0
    if id_result and id_result.get("rows"):
        id_rows = parse_rows(id_result)
        if id_rows:
            new_id = id_rows[0].get("id", 0)
    
    return {
        "id": new_id,
        "freelancer_id": user_id,
        "title": portfolio_item.get("title"),
        "description": portfolio_item.get("description"),
        "image_url": portfolio_item.get("image_url"),
        "project_url": portfolio_item.get("project_url"),
        "created_at": now,
        "updated_at": now
    }


@router.put("/{portfolio_item_id}", response_model=dict)
def update_portfolio_item(
    portfolio_item_id: int,
    portfolio_item: dict,
    current_user: dict = Depends(get_current_user)
):
    """Update a portfolio item"""
    user_id = current_user.get("user_id")
    
    # Check if item exists and belongs to user
    result = execute_query(
        "SELECT id, freelancer_id FROM portfolio_items WHERE id = ?",
        [portfolio_item_id]
    )
    
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Portfolio item not found")
    
    rows = parse_rows(result)
    if not rows:
        raise HTTPException(status_code=404, detail="Portfolio item not found")
    
    if rows[0].get("freelancer_id") != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this portfolio item")
    
    # Build update query
    updates = []
    params = []
    
    if "title" in portfolio_item:
        updates.append("title = ?")
        params.append(portfolio_item["title"])
    if "description" in portfolio_item:
        updates.append("description = ?")
        params.append(portfolio_item["description"])
    if "image_url" in portfolio_item:
        updates.append("image_url = ?")
        params.append(portfolio_item["image_url"])
    if "project_url" in portfolio_item:
        updates.append("project_url = ?")
        params.append(portfolio_item["project_url"])
    
    if updates:
        updates.append("updated_at = ?")
        params.append(datetime.utcnow().isoformat())
        params.append(portfolio_item_id)
        
        execute_query(
            f"UPDATE portfolio_items SET {', '.join(updates)} WHERE id = ?",
            params
        )
    
    # Fetch updated item
    result = execute_query(
        """SELECT id, freelancer_id, title, description, image_url, project_url,
                  created_at, updated_at
           FROM portfolio_items WHERE id = ?""",
        [portfolio_item_id]
    )
    
    rows = parse_rows(result)
    return rows[0] if rows else {}


@router.delete("/{portfolio_item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_portfolio_item(
    portfolio_item_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Delete a portfolio item"""
    user_id = current_user.get("user_id")
    
    # Check if item exists and belongs to user
    result = execute_query(
        "SELECT id, freelancer_id FROM portfolio_items WHERE id = ?",
        [portfolio_item_id]
    )
    
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Portfolio item not found")
    
    rows = parse_rows(result)
    if not rows:
        raise HTTPException(status_code=404, detail="Portfolio item not found")
    
    if rows[0].get("freelancer_id") != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this portfolio item")
    
    execute_query("DELETE FROM portfolio_items WHERE id = ?", [portfolio_item_id])
    return