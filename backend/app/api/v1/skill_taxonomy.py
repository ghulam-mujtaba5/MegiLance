# @AI-HINT: Skill taxonomy - Hierarchical skill management and categorization
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel, ConfigDict
from datetime import datetime, timezone
from app.db.session import get_db
from app.core.security import get_current_active_user

router = APIRouter(prefix="/skill-taxonomy")


class SkillCategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None
    parent_id: Optional[str] = None
    icon: Optional[str] = None


class SkillCategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    parent_id: Optional[str] = None
    icon: Optional[str] = None


class SkillCategoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    description: Optional[str]
    parent_id: Optional[str]
    icon: Optional[str]
    skill_count: int
    created_at: datetime
    updated_at: Optional[datetime]


class TaxonomySkillCreate(BaseModel):
    name: str
    category_id: str
    description: Optional[str] = None
    aliases: List[str] = []
    related_skills: List[str] = []


class TaxonomySkillResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    category_id: str
    description: Optional[str]
    aliases: List[str]
    related_skills: List[str]
    usage_count: int
    created_at: datetime


# In-memory storage for demo
categories_db = {
    "cat_1": {
        "id": "cat_1",
        "name": "Programming Languages",
        "description": "Software development programming languages",
        "parent_id": None,
        "icon": "code",
        "skill_count": 15,
        "created_at": datetime.now(timezone.utc),
        "updated_at": None
    },
    "cat_2": {
        "id": "cat_2",
        "name": "Frontend Development",
        "description": "Client-side web development technologies",
        "parent_id": None,
        "icon": "browser",
        "skill_count": 12,
        "created_at": datetime.now(timezone.utc),
        "updated_at": None
    },
    "cat_3": {
        "id": "cat_3",
        "name": "Backend Development",
        "description": "Server-side development technologies",
        "parent_id": None,
        "icon": "server",
        "skill_count": 10,
        "created_at": datetime.now(timezone.utc),
        "updated_at": None
    },
    "cat_4": {
        "id": "cat_4",
        "name": "Design",
        "description": "Visual and UX design skills",
        "parent_id": None,
        "icon": "palette",
        "skill_count": 8,
        "created_at": datetime.now(timezone.utc),
        "updated_at": None
    }
}

skills_db = {
    "skill_1": {
        "id": "skill_1",
        "name": "Python",
        "category_id": "cat_1",
        "description": "General-purpose programming language",
        "aliases": ["py", "python3"],
        "related_skills": ["Django", "FastAPI", "Flask"],
        "usage_count": 1250,
        "created_at": datetime.now(timezone.utc)
    },
    "skill_2": {
        "id": "skill_2",
        "name": "JavaScript",
        "category_id": "cat_1",
        "description": "Web scripting language",
        "aliases": ["js", "ecmascript"],
        "related_skills": ["React", "Node.js", "TypeScript"],
        "usage_count": 1500,
        "created_at": datetime.now(timezone.utc)
    },
    "skill_3": {
        "id": "skill_3",
        "name": "React",
        "category_id": "cat_2",
        "description": "JavaScript library for building user interfaces",
        "aliases": ["reactjs", "react.js"],
        "related_skills": ["Redux", "Next.js", "JavaScript"],
        "usage_count": 980,
        "created_at": datetime.now(timezone.utc)
    },
    "skill_4": {
        "id": "skill_4",
        "name": "Node.js",
        "category_id": "cat_3",
        "description": "JavaScript runtime environment",
        "aliases": ["nodejs", "node"],
        "related_skills": ["Express.js", "JavaScript", "MongoDB"],
        "usage_count": 850,
        "created_at": datetime.now(timezone.utc)
    }
}

category_counter = 4
skill_counter = 4


@router.get("/categories", response_model=List[SkillCategoryResponse])
async def list_categories(
    parent_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """List all skill categories"""
    categories = list(categories_db.values())
    if parent_id is not None:
        categories = [c for c in categories if c["parent_id"] == parent_id]
    return sorted(categories, key=lambda x: x["name"])


@router.post("/categories", response_model=SkillCategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    category_data: SkillCategoryCreate,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new skill category (admin only)"""
    global category_counter
    category_counter += 1
    
    new_category = {
        "id": f"cat_{category_counter}",
        "name": category_data.name,
        "description": category_data.description,
        "parent_id": category_data.parent_id,
        "icon": category_data.icon,
        "skill_count": 0,
        "created_at": datetime.now(timezone.utc),
        "updated_at": None
    }
    
    categories_db[new_category["id"]] = new_category
    return new_category


@router.get("/categories/{category_id}", response_model=SkillCategoryResponse)
async def get_category(
    category_id: str,
    db: Session = Depends(get_db)
):
    """Get a specific skill category"""
    if category_id not in categories_db:
        raise HTTPException(status_code=404, detail="Category not found")
    return categories_db[category_id]


@router.put("/categories/{category_id}", response_model=SkillCategoryResponse)
async def update_category(
    category_id: str,
    category_data: SkillCategoryUpdate,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update a skill category (admin only)"""
    if category_id not in categories_db:
        raise HTTPException(status_code=404, detail="Category not found")
    
    category = categories_db[category_id]
    
    if category_data.name is not None:
        category["name"] = category_data.name
    if category_data.description is not None:
        category["description"] = category_data.description
    if category_data.parent_id is not None:
        category["parent_id"] = category_data.parent_id
    if category_data.icon is not None:
        category["icon"] = category_data.icon
    
    category["updated_at"] = datetime.now(timezone.utc)
    return category


@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: str,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a skill category (admin only)"""
    if category_id not in categories_db:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Check if category has skills
    category_skills = [s for s in skills_db.values() if s["category_id"] == category_id]
    if category_skills:
        raise HTTPException(status_code=400, detail="Cannot delete category with skills")
    
    del categories_db[category_id]
    return None


@router.get("/skills", response_model=List[TaxonomySkillResponse])
async def list_taxonomy_skills(
    category_id: Optional[str] = None,
    search: Optional[str] = Query(None, description="Search skills by name or alias"),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """List skills in the taxonomy"""
    skills = list(skills_db.values())
    
    if category_id:
        skills = [s for s in skills if s["category_id"] == category_id]
    
    if search:
        search_lower = search.lower()
        skills = [s for s in skills if 
                 search_lower in s["name"].lower() or 
                 any(search_lower in alias.lower() for alias in s["aliases"])]
    
    return sorted(skills, key=lambda x: -x["usage_count"])[:limit]


@router.post("/skills", response_model=TaxonomySkillResponse, status_code=status.HTTP_201_CREATED)
async def create_taxonomy_skill(
    skill_data: TaxonomySkillCreate,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Add a new skill to the taxonomy (admin only)"""
    global skill_counter
    
    if skill_data.category_id not in categories_db:
        raise HTTPException(status_code=404, detail="Category not found")
    
    skill_counter += 1
    
    new_skill = {
        "id": f"skill_{skill_counter}",
        "name": skill_data.name,
        "category_id": skill_data.category_id,
        "description": skill_data.description,
        "aliases": skill_data.aliases,
        "related_skills": skill_data.related_skills,
        "usage_count": 0,
        "created_at": datetime.now(timezone.utc)
    }
    
    skills_db[new_skill["id"]] = new_skill
    categories_db[skill_data.category_id]["skill_count"] += 1
    
    return new_skill


@router.get("/skills/{skill_id}", response_model=TaxonomySkillResponse)
async def get_taxonomy_skill(
    skill_id: str,
    db: Session = Depends(get_db)
):
    """Get a specific skill from taxonomy"""
    if skill_id not in skills_db:
        raise HTTPException(status_code=404, detail="Skill not found")
    return skills_db[skill_id]


@router.get("/tree")
async def get_taxonomy_tree(
    db: Session = Depends(get_db)
):
    """Get the full skill taxonomy as a tree structure"""
    tree = []
    
    # Get root categories (no parent)
    root_categories = [c for c in categories_db.values() if c["parent_id"] is None]
    
    for category in sorted(root_categories, key=lambda x: x["name"]):
        category_skills = [s for s in skills_db.values() if s["category_id"] == category["id"]]
        
        tree.append({
            "id": category["id"],
            "name": category["name"],
            "icon": category["icon"],
            "skill_count": len(category_skills),
            "skills": sorted([{"id": s["id"], "name": s["name"], "usage_count": s["usage_count"]} 
                             for s in category_skills], key=lambda x: -x["usage_count"]),
            "subcategories": []  # Could be expanded for nested categories
        })
    
    return {"taxonomy": tree, "total_categories": len(categories_db), "total_skills": len(skills_db)}


@router.get("/suggest")
async def suggest_skills(
    query: str = Query(..., min_length=1),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """Suggest skills based on partial input"""
    query_lower = query.lower()
    
    matches = []
    for skill in skills_db.values():
        score = 0
        
        # Exact match in name
        if skill["name"].lower() == query_lower:
            score = 100
        # Starts with query
        elif skill["name"].lower().startswith(query_lower):
            score = 80
        # Contains query
        elif query_lower in skill["name"].lower():
            score = 60
        # Match in aliases
        else:
            for alias in skill["aliases"]:
                if query_lower in alias.lower():
                    score = 40
                    break
        
        if score > 0:
            matches.append({
                "skill": skill,
                "score": score + (skill["usage_count"] / 100)  # Boost popular skills
            })
    
    matches.sort(key=lambda x: -x["score"])
    
    return {
        "suggestions": [m["skill"] for m in matches[:limit]],
        "query": query
    }

