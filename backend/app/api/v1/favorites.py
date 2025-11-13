# @AI-HINT: Favorites API endpoints for user bookmarking
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Literal

from app.db.session import get_db
from app.models import Favorite, User, Project
from app.schemas.favorite import FavoriteCreate, FavoriteRead, FavoriteDelete
from app.core.security import get_current_user

router = APIRouter(prefix="/favorites", tags=["favorites"])

@router.post("/", response_model=FavoriteRead, status_code=status.HTTP_201_CREATED)
async def create_favorite(
    favorite: FavoriteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Add item to favorites
    - Users can favorite projects or freelancers
    - Prevents duplicate favorites
    """
    # Check if already favorited
    existing = db.query(Favorite).filter(
        and_(
            Favorite.user_id == current_user.id,
            Favorite.target_type == favorite.target_type,
            Favorite.target_id == favorite.target_id
        )
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Already in favorites")
    
    # Verify target exists
    if favorite.target_type == "project":
        project = db.query(Project).filter(Project.id == favorite.target_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
    elif favorite.target_type == "freelancer":
        freelancer = db.query(User).filter(
            and_(
                User.id == favorite.target_id,
                User.user_type == "freelancer"
            )
        ).first()
        if not freelancer:
            raise HTTPException(status_code=404, detail="Freelancer not found")
    
    # Create favorite
    db_favorite = Favorite(
        user_id=current_user.id,
        target_type=favorite.target_type,
        target_id=favorite.target_id
    )
    
    db.add(db_favorite)
    db.commit()
    db.refresh(db_favorite)
    
    return db_favorite

@router.get("/", response_model=List[FavoriteRead])
async def list_favorites(
    target_type: Literal["project", "freelancer", None] = Query(None, description="Filter by type"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List user's favorites
    - Returns user's bookmarked items
    - Can filter by type (project/freelancer)
    """
    query = db.query(Favorite).filter(Favorite.user_id == current_user.id)
    
    if target_type:
        query = query.filter(Favorite.target_type == target_type)
    
    favorites = query.order_by(Favorite.created_at.desc()).all()
    return favorites

@router.delete("/{favorite_id}", response_model=FavoriteDelete)
async def delete_favorite(
    favorite_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remove item from favorites"""
    favorite = db.query(Favorite).filter(Favorite.id == favorite_id).first()
    if not favorite:
        raise HTTPException(status_code=404, detail="Favorite not found")
    
    if favorite.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    target_type = favorite.target_type
    target_id = favorite.target_id
    
    db.delete(favorite)
    db.commit()
    
    return FavoriteDelete(
        message="Removed from favorites",
        target_type=target_type,
        target_id=target_id
    )

@router.delete("/remove/{target_type}/{target_id}", response_model=FavoriteDelete)
async def remove_favorite_by_target(
    target_type: Literal["project", "freelancer"],
    target_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remove item from favorites by type and ID"""
    favorite = db.query(Favorite).filter(
        and_(
            Favorite.user_id == current_user.id,
            Favorite.target_type == target_type,
            Favorite.target_id == target_id
        )
    ).first()
    
    if not favorite:
        raise HTTPException(status_code=404, detail="Not in favorites")
    
    db.delete(favorite)
    db.commit()
    
    return FavoriteDelete(
        message="Removed from favorites",
        target_type=target_type,
        target_id=target_id
    )

@router.get("/check/{target_type}/{target_id}")
async def check_favorite(
    target_type: Literal["project", "freelancer"],
    target_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Check if item is favorited"""
    favorite = db.query(Favorite).filter(
        and_(
            Favorite.user_id == current_user.id,
            Favorite.target_type == target_type,
            Favorite.target_id == target_id
        )
    ).first()
    
    return {
        "is_favorited": favorite is not None,
        "favorite_id": favorite.id if favorite else None
    }
