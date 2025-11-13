# @AI-HINT: Categories API endpoints for project categorization
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime
import re

from app.db.session import get_db
from app.models import Category, User
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryRead, CategoryTree
from app.core.security import get_current_user

router = APIRouter(prefix="/categories", tags=["categories"])

def generate_slug(name: str) -> str:
    """Generate URL-friendly slug from category name"""
    slug = re.sub(r'[^a-zA-Z0-9\s-]', '', name.lower())
    slug = re.sub(r'[\s-]+', '-', slug)
    return slug.strip('-')

@router.post("/", response_model=CategoryRead, status_code=status.HTTP_201_CREATED)
async def create_category(
    category: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new category
    - Admin only
    - Auto-generates slug from name
    - Supports parent-child hierarchy
    """
    # Check admin role
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Check if category name exists
    existing = db.query(Category).filter(
        func.lower(Category.name) == category.name.lower()
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category name already exists")
    
    # Verify parent category exists
    if category.parent_id:
        parent = db.query(Category).filter(Category.id == category.parent_id).first()
        if not parent:
            raise HTTPException(status_code=404, detail="Parent category not found")
    
    # Generate slug
    slug = generate_slug(category.name)
    slug_exists = db.query(Category).filter(Category.slug == slug).first()
    if slug_exists:
        slug = f"{slug}-{datetime.utcnow().timestamp()}"
    
    # Create category
    db_category = Category(
        name=category.name,
        slug=slug,
        description=category.description,
        icon=category.icon,
        parent_id=category.parent_id,
        sort_order=category.sort_order,
        is_active=True,
        project_count=0
    )
    
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    
    return db_category

@router.get("/", response_model=List[CategoryRead])
async def list_categories(
    active_only: bool = Query(True, description="Show only active categories"),
    parent_id: Optional[int] = Query(None, description="Filter by parent category"),
    db: Session = Depends(get_db)
):
    """
    List all categories
    - Public endpoint
    - Supports filtering by parent
    - Returns flat list
    """
    query = db.query(Category)
    
    if active_only:
        query = query.filter(Category.is_active == True)
    
    if parent_id is not None:
        query = query.filter(Category.parent_id == parent_id)
    
    categories = query.order_by(Category.sort_order, Category.name).all()
    return categories

@router.get("/tree", response_model=List[CategoryTree])
async def get_category_tree(
    active_only: bool = Query(True, description="Show only active categories"),
    db: Session = Depends(get_db)
):
    """
    Get hierarchical category tree
    - Returns nested structure with children
    - Public endpoint
    """
    query = db.query(Category)
    
    if active_only:
        query = query.filter(Category.is_active == True)
    
    # Get all categories
    all_categories = query.order_by(Category.sort_order, Category.name).all()
    
    # Build tree structure
    category_map = {cat.id: CategoryTree.model_validate(cat) for cat in all_categories}
    root_categories = []
    
    for cat in all_categories:
        cat_tree = category_map[cat.id]
        if cat.parent_id and cat.parent_id in category_map:
            parent = category_map[cat.parent_id]
            parent.children.append(cat_tree)
        else:
            root_categories.append(cat_tree)
    
    return root_categories

@router.get("/{slug}", response_model=CategoryRead)
async def get_category(
    slug: str,
    db: Session = Depends(get_db)
):
    """Get a category by slug"""
    category = db.query(Category).filter(Category.slug == slug).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    return category

@router.patch("/{category_id}", response_model=CategoryRead)
async def update_category(
    category_id: int,
    update_data: CategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update a category
    - Admin only
    - Can update name, description, icon, parent, sort order, active status
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Update fields
    update_dict = update_data.model_dump(exclude_unset=True)
    
    # Check name uniqueness if changing name
    if "name" in update_dict and update_dict["name"] != category.name:
        existing = db.query(Category).filter(
            func.lower(Category.name) == update_dict["name"].lower(),
            Category.id != category_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Category name already exists")
        
        # Regenerate slug
        category.slug = generate_slug(update_dict["name"])
    
    # Verify parent if changing
    if "parent_id" in update_dict and update_dict["parent_id"]:
        if update_dict["parent_id"] == category_id:
            raise HTTPException(status_code=400, detail="Category cannot be its own parent")
        
        parent = db.query(Category).filter(Category.id == update_dict["parent_id"]).first()
        if not parent:
            raise HTTPException(status_code=404, detail="Parent category not found")
    
    for field, value in update_dict.items():
        setattr(category, field, value)
    
    db.commit()
    db.refresh(category)
    
    return category

@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a category
    - Admin only
    - Cannot delete if has child categories or projects
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Check for children
    children = db.query(Category).filter(Category.parent_id == category_id).count()
    if children > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete category with {children} child categories"
        )
    
    # Check for projects
    if category.project_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete category with {category.project_count} projects. Set to inactive instead."
        )
    
    db.delete(category)
    db.commit()
    
    return None
