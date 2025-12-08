# @AI-HINT: Skills Management API - Turso-only, no SQLite fallback
"""
Skills Management API

Handles:
- Skills catalog (public listing)
- User skill management
- Skill verification
- Admin skill CRUD
- Industry metadata
- Freelancer search by skill/industry
"""
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from datetime import datetime
import json

from app.db.turso_http import execute_query, parse_rows
from app.core.security import get_current_user_from_token

router = APIRouter()

# ============ CONSTANTS ============

INDUSTRIES = {
  'healthcare': {'name': 'Healthcare', 'icon': '🏥', 'growth': 'high'},
  'fintech': {'name': 'FinTech', 'icon': '💰', 'growth': 'high'},
  'ecommerce': {'name': 'E-commerce', 'icon': '🛒', 'growth': 'medium'},
  'education': {'name': 'Education', 'icon': '📚', 'growth': 'high'},
  'real-estate': {'name': 'Real Estate', 'icon': '🏠', 'growth': 'medium'},
  'saas': {'name': 'SaaS', 'icon': '☁️', 'growth': 'high'},
  'gaming': {'name': 'Gaming', 'icon': '🎮', 'growth': 'high'},
  'travel': {'name': 'Travel & Hospitality', 'icon': '✈️', 'growth': 'medium'},
  'logistics': {'name': 'Logistics', 'icon': '📦', 'growth': 'medium'},
  'media': {'name': 'Media & Entertainment', 'icon': '🎬', 'growth': 'medium'},
  'automotive': {'name': 'Automotive', 'icon': '🚗', 'growth': 'medium'},
  'startup': {'name': 'Startups', 'icon': '🚀', 'growth': 'high'},
  'enterprise': {'name': 'Enterprise', 'icon': '🏢', 'growth': 'stable'},
  'nonprofit': {'name': 'Non-Profit', 'icon': '❤️', 'growth': 'stable'},
  'government': {'name': 'Government', 'icon': '🏛️', 'growth': 'stable'},
  'crypto': {'name': 'Cryptocurrency', 'icon': '₿', 'growth': 'volatile'},
  'ai': {'name': 'AI & Machine Learning', 'icon': '🤖', 'growth': 'explosive'},
  'sustainability': {'name': 'Sustainability', 'icon': '🌱', 'growth': 'high'},
}

def get_current_user(token_data = Depends(get_current_user_from_token)):
    """Get current user from token"""
    return token_data


# ============ Skills Catalog ============

@router.get("/", response_model=List[dict])
async def list_skills(
    category: Optional[str] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, description="Search in name or description"),
    active_only: bool = Query(True, description="Only active skills"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200)
):
    """
    List all skills in the catalog.
    
    Public endpoint - no authentication required.
    """
    where_clauses = []
    params = []
    
    if active_only:
        where_clauses.append("is_active = 1")
    
    if category:
        where_clauses.append("category = ?")
        params.append(category)
    
    if search:
        search_pattern = f"%{search}%"
        where_clauses.append("(name LIKE ? OR description LIKE ?)")
        params.extend([search_pattern, search_pattern])
    
    where_sql = " AND ".join(where_clauses) if where_clauses else "1=1"
    params.extend([limit, skip])
    
    result = execute_query(
        f"""SELECT id, name, description, category, icon, is_active, sort_order, created_at, updated_at
            FROM skills
            WHERE {where_sql}
            ORDER BY category ASC, sort_order ASC, name ASC
            LIMIT ? OFFSET ?""",
        params
    )
    
    if not result:
        return []
    
    rows = parse_rows(result)
    for row in rows:
        row["is_active"] = bool(row.get("is_active"))
    return rows


@router.get("/categories")
async def list_skill_categories():
    """
    Get list of all skill categories.
    
    Public endpoint.
    """
    result = execute_query(
        "SELECT DISTINCT category FROM skills WHERE is_active = 1 AND category IS NOT NULL",
        []
    )
    
    categories = []
    if result and result.get("rows"):
        rows = parse_rows(result)
        categories = [row.get("category") for row in rows if row.get("category")]
    
    return {"categories": categories}


@router.get("/industries")
async def list_industries():
    """
    Get list of all industries.
    
    Public endpoint.
    """
    return INDUSTRIES


@router.get("/freelancers/match", response_model=List[dict])
async def match_freelancers(
    skill_slug: str = Query(..., description="Skill slug or name"),
    industry_slug: Optional[str] = Query(None, description="Industry slug"),
    limit: int = Query(10, ge=1, le=50)
):
    """
    Find freelancers matching a skill and optionally an industry.
    Used for Programmatic SEO pages.
    """
    # 1. Find skill ID
    skill_result = execute_query(
        "SELECT id, name FROM skills WHERE LOWER(name) = LOWER(?) OR LOWER(name) = LOWER(?)",
        [skill_slug.replace("-", " "), skill_slug]
    )
    
    if not skill_result or not skill_result.get("rows"):
        # Try partial match
        skill_result = execute_query(
            "SELECT id, name FROM skills WHERE name LIKE ? LIMIT 1",
            [f"%{skill_slug.replace('-', ' ')}%"]
        )
        if not skill_result or not skill_result.get("rows"):
            return []
            
    skill_rows = parse_rows(skill_result)
    skill_id = skill_rows[0]["id"]
    
    # 2. Find users with this skill
    # We join user_skills with users to get profile info
    query = """
        SELECT u.id, u.name, u.bio, u.profile_image_url, u.hourly_rate, u.location, u.profile_data,
               us.proficiency_level, us.years_experience, us.is_verified
        FROM users u
        JOIN user_skills us ON u.id = us.user_id
        WHERE us.skill_id = ? AND u.user_type = 'freelancer' AND u.is_active = 1
    """
    params = [skill_id]
    
    # 3. Filter by industry (if provided)
    # Since we don't have an industry column, we search in bio or profile_data
    if industry_slug:
        industry_name = INDUSTRIES.get(industry_slug, {}).get('name', industry_slug)
        query += " AND (LOWER(u.bio) LIKE ? OR LOWER(u.profile_data) LIKE ?)"
        params.extend([f"%{industry_name.lower()}%", f"%{industry_name.lower()}%"])
        
    query += " ORDER BY us.proficiency_level DESC, us.is_verified DESC LIMIT ?"
    params.append(limit)
    
    result = execute_query(query, params)
    
    if not result:
        return []
        
    rows = parse_rows(result)
    
    # Process rows
    freelancers = []
    for row in rows:
        # Parse profile data if needed
        profile_data = {}
        if row.get("profile_data"):
            try:
                profile_data = json.loads(row["profile_data"])
            except:
                pass
                
        freelancers.append({
            "id": row["id"],
            "name": row["name"],
            "title": profile_data.get("title", f"{skill_rows[0]['name']} Specialist"),
            "bio": row["bio"],
            "avatar": row["profile_image_url"],
            "hourly_rate": row["hourly_rate"],
            "location": row["location"],
            "rating": 5.0, # Mock rating for now
            "reviews_count": 0, # Mock count
            "skills": [skill_rows[0]["name"]], # Just the matched skill for now
            "verified": bool(row["is_verified"])
        })
        
    return freelancers


@router.get("/{skill_id}", response_model=dict)
async def get_skill(skill_id: int):
    """
    Get a specific skill.
    
    Public endpoint.
    """
    result = execute_query(
        """SELECT id, name, description, category, icon, is_active, sort_order, created_at, updated_at
           FROM skills WHERE id = ?""",
        [skill_id]
    )
    
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Skill not found")
    
    rows = parse_rows(result)
    if not rows:
        raise HTTPException(status_code=404, detail="Skill not found")
    
    skill = rows[0]
    skill["is_active"] = bool(skill.get("is_active"))
    return skill


@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_skill(
    skill_data: dict,
    current_user = Depends(get_current_user)
):
    """
    Create a new skill (admin only).
    """
    role = current_user.get("role", "")
    if role.lower() != "admin":
        raise HTTPException(status_code=403, detail="Only admins can create skills")
    
    name = skill_data.get("name", "")
    
    # Check for duplicate name
    result = execute_query(
        "SELECT id FROM skills WHERE LOWER(name) = LOWER(?)",
        [name]
    )
    if result and result.get("rows"):
        raise HTTPException(status_code=400, detail="A skill with this name already exists")
    
    now = datetime.utcnow().isoformat()
    
    result = execute_query(
        """INSERT INTO skills (name, description, category, icon, is_active, sort_order, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        [
            name,
            skill_data.get("description"),
            skill_data.get("category"),
            skill_data.get("icon"),
            1 if skill_data.get("is_active", True) else 0,
            skill_data.get("sort_order", 0),
            now,
            now
        ]
    )
    
    if not result:
        raise HTTPException(status_code=500, detail="Failed to create skill")
    
    id_result = execute_query("SELECT last_insert_rowid() as id", [])
    new_id = 0
    if id_result and id_result.get("rows"):
        id_rows = parse_rows(id_result)
        if id_rows:
            new_id = id_rows[0].get("id", 0)
    
    return {
        "id": new_id,
        "name": name,
        "description": skill_data.get("description"),
        "category": skill_data.get("category"),
        "icon": skill_data.get("icon"),
        "is_active": skill_data.get("is_active", True),
        "sort_order": skill_data.get("sort_order", 0),
        "created_at": now,
        "updated_at": now
    }


@router.patch("/{skill_id}", response_model=dict)
async def update_skill(
    skill_id: int,
    skill_data: dict,
    current_user = Depends(get_current_user)
):
    """
    Update a skill (admin only).
    """
    role = current_user.get("role", "")
    if role.lower() != "admin":
        raise HTTPException(status_code=403, detail="Only admins can update skills")
    
    result = execute_query("SELECT id FROM skills WHERE id = ?", [skill_id])
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Skill not found")
    
    # Check for duplicate name if updating name
    if "name" in skill_data:
        result = execute_query(
            "SELECT id FROM skills WHERE LOWER(name) = LOWER(?) AND id != ?",
            [skill_data["name"], skill_id]
        )
        if result and result.get("rows"):
            raise HTTPException(status_code=400, detail="A skill with this name already exists")
    
    # Build update query
    updates = []
    params = []
    
    for field in ["name", "description", "category", "icon", "sort_order"]:
        if field in skill_data:
            updates.append(f"{field} = ?")
            params.append(skill_data[field])
    
    if "is_active" in skill_data:
        updates.append("is_active = ?")
        params.append(1 if skill_data["is_active"] else 0)
    
    if updates:
        updates.append("updated_at = ?")
        params.append(datetime.utcnow().isoformat())
        params.append(skill_id)
        
        execute_query(
            f"UPDATE skills SET {', '.join(updates)} WHERE id = ?",
            params
        )
    
    # Fetch updated skill
    result = execute_query(
        """SELECT id, name, description, category, icon, is_active, sort_order, created_at, updated_at
           FROM skills WHERE id = ?""",
        [skill_id]
    )
    
    rows = parse_rows(result)
    if not rows:
        raise HTTPException(status_code=404, detail="Skill not found")
    
    skill = rows[0]
    skill["is_active"] = bool(skill.get("is_active"))
    return skill


@router.delete("/{skill_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_skill(
    skill_id: int,
    current_user = Depends(get_current_user)
):
    """
    Delete a skill (admin only).
    
    This is a soft delete - sets is_active to False.
    """
    role = current_user.get("role", "")
    if role.lower() != "admin":
        raise HTTPException(status_code=403, detail="Only admins can delete skills")
    
    result = execute_query("SELECT id FROM skills WHERE id = ?", [skill_id])
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Skill not found")
    
    # Soft delete
    execute_query(
        "UPDATE skills SET is_active = 0, updated_at = ? WHERE id = ?",
        [datetime.utcnow().isoformat(), skill_id]
    )


# ============ User Skills ============

@router.get("/user-skills", response_model=List[dict])
async def list_user_skills(
    user_id: Optional[int] = Query(None, description="Filter by user (defaults to current user)"),
    skill_category: Optional[str] = Query(None, description="Filter by skill category"),
    min_proficiency: Optional[int] = Query(None, ge=1, le=5, description="Minimum proficiency level"),
    verified_only: bool = Query(False, description="Only verified skills"),
    current_user = Depends(get_current_user)
):
    """
    List user skills.
    
    By default shows current user's skills.
    Can view other users' skills by providing user_id.
    """
    target_user_id = user_id if user_id is not None else current_user.get("user_id")
    
    where_clauses = ["us.user_id = ?"]
    params = [target_user_id]
    
    if skill_category:
        where_clauses.append("s.category = ?")
        params.append(skill_category)
    
    if min_proficiency is not None:
        where_clauses.append("us.proficiency_level >= ?")
        params.append(min_proficiency)
    
    if verified_only:
        where_clauses.append("us.is_verified = 1")
    
    where_sql = " AND ".join(where_clauses)
    
    result = execute_query(
        f"""SELECT us.id, us.user_id, us.skill_id, us.proficiency_level, us.years_experience,
                   us.is_verified, us.verified_at, us.verified_by, us.created_at, us.updated_at,
                   s.name as skill_name, s.category as skill_category
            FROM user_skills us
            LEFT JOIN skills s ON us.skill_id = s.id
            WHERE {where_sql}
            ORDER BY us.proficiency_level DESC""",
        params
    )
    
    if not result:
        return []
    
    rows = parse_rows(result)
    for row in rows:
        row["is_verified"] = bool(row.get("is_verified"))
    return rows


@router.post("/user-skills", response_model=dict, status_code=status.HTTP_201_CREATED)
async def add_user_skill(
    user_skill_data: dict,
    current_user = Depends(get_current_user)
):
    """
    Add a skill to current user's profile.
    """
    user_id = current_user.get("user_id")
    skill_id = user_skill_data.get("skill_id")
    
    # Verify skill exists
    result = execute_query(
        "SELECT id FROM skills WHERE id = ? AND is_active = 1",
        [skill_id]
    )
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Skill not found or inactive")
    
    # Check if user already has this skill
    result = execute_query(
        "SELECT id FROM user_skills WHERE user_id = ? AND skill_id = ?",
        [user_id, skill_id]
    )
    if result and result.get("rows"):
        raise HTTPException(status_code=400, detail="You already have this skill in your profile")
    
    now = datetime.utcnow().isoformat()
    
    result = execute_query(
        """INSERT INTO user_skills (user_id, skill_id, proficiency_level, years_experience, is_verified, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)""",
        [
            user_id,
            skill_id,
            user_skill_data.get("proficiency_level", 1),
            user_skill_data.get("years_experience"),
            0,  # New skills are unverified by default
            now,
            now
        ]
    )
    
    if not result:
        raise HTTPException(status_code=500, detail="Failed to add skill")
    
    id_result = execute_query("SELECT last_insert_rowid() as id", [])
    new_id = 0
    if id_result and id_result.get("rows"):
        id_rows = parse_rows(id_result)
        if id_rows:
            new_id = id_rows[0].get("id", 0)
    
    return {
        "id": new_id,
        "user_id": user_id,
        "skill_id": skill_id,
        "proficiency_level": user_skill_data.get("proficiency_level", 1),
        "years_experience": user_skill_data.get("years_experience"),
        "is_verified": False,
        "created_at": now,
        "updated_at": now
    }


@router.patch("/user-skills/{user_skill_id}", response_model=dict)
async def update_user_skill(
    user_skill_id: int,
    user_skill_data: dict,
    current_user = Depends(get_current_user)
):
    """
    Update a user skill.
    
    Users can update their own skills.
    Admins can verify skills.
    """
    user_id = current_user.get("user_id")
    role = current_user.get("role", "")
    
    result = execute_query(
        "SELECT id, user_id FROM user_skills WHERE id = ?",
        [user_skill_id]
    )
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="User skill not found")
    
    rows = parse_rows(result)
    user_skill = rows[0]
    
    # Permission check
    if role.lower() == "admin":
        # Admins can update everything
        pass
    elif user_id == user_skill.get("user_id"):
        # Users can update their own skills but not verification status
        if "is_verified" in user_skill_data:
            raise HTTPException(status_code=403, detail="You cannot verify your own skills")
    else:
        raise HTTPException(status_code=403, detail="You don't have permission to update this skill")
    
    # Build update query
    updates = []
    params = []
    
    if "proficiency_level" in user_skill_data:
        updates.append("proficiency_level = ?")
        params.append(user_skill_data["proficiency_level"])
    
    if "years_experience" in user_skill_data:
        updates.append("years_experience = ?")
        params.append(user_skill_data["years_experience"])
    
    if "is_verified" in user_skill_data and role.lower() == "admin":
        updates.append("is_verified = ?")
        params.append(1 if user_skill_data["is_verified"] else 0)
        if user_skill_data["is_verified"]:
            updates.append("verified_at = ?")
            params.append(datetime.utcnow().isoformat())
            updates.append("verified_by = ?")
            params.append(user_id)
    
    if updates:
        updates.append("updated_at = ?")
        params.append(datetime.utcnow().isoformat())
        params.append(user_skill_id)
        
        execute_query(
            f"UPDATE user_skills SET {', '.join(updates)} WHERE id = ?",
            params
        )
    
    # Fetch updated user skill
    result = execute_query(
        """SELECT id, user_id, skill_id, proficiency_level, years_experience,
                  is_verified, verified_at, verified_by, created_at, updated_at
           FROM user_skills WHERE id = ?""",
        [user_skill_id]
    )
    
    rows = parse_rows(result)
    if not rows:
        raise HTTPException(status_code=404, detail="User skill not found")
    
    updated = rows[0]
    updated["is_verified"] = bool(updated.get("is_verified"))
    return updated


@router.delete("/user-skills/{user_skill_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user_skill(
    user_skill_id: int,
    current_user = Depends(get_current_user)
):
    """
    Remove a skill from user's profile.
    
    Users can only remove their own skills.
    """
    user_id = current_user.get("user_id")
    role = current_user.get("role", "")
    
    result = execute_query(
        "SELECT id, user_id FROM user_skills WHERE id = ?",
        [user_skill_id]
    )
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="User skill not found")
    
    rows = parse_rows(result)
    user_skill = rows[0]
    
    # Permission check
    if user_id != user_skill.get("user_id") and role.lower() != "admin":
        raise HTTPException(status_code=403, detail="You don't have permission to delete this skill")
    
    execute_query("DELETE FROM user_skills WHERE id = ?", [user_skill_id])
