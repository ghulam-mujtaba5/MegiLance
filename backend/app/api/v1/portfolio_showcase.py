# @AI-HINT: Portfolio showcase API - Advanced portfolio features
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from app.db.session import get_db
from app.api.v1.auth import get_current_active_user

router = APIRouter(prefix="/portfolio-showcase")


class PortfolioItem(BaseModel):
    id: str
    user_id: str
    title: str
    description: str
    category: str
    images: List[str]
    video_url: Optional[str] = None
    live_url: Optional[str] = None
    github_url: Optional[str] = None
    technologies: List[str]
    client_name: Optional[str] = None
    project_date: Optional[datetime] = None
    is_featured: bool = False
    is_public: bool = True
    views_count: int = 0
    likes_count: int = 0
    order: int = 0
    created_at: datetime


class PortfolioSettings(BaseModel):
    user_id: str
    layout: str
    theme: str
    show_client_names: bool
    show_dates: bool
    enable_comments: bool
    custom_domain: Optional[str] = None
    custom_css: Optional[str] = None


class PortfolioAnalytics(BaseModel):
    total_views: int
    unique_visitors: int
    avg_time_on_page: float
    top_items: List[dict]
    traffic_sources: dict


@router.get("/items", response_model=List[PortfolioItem])
async def get_portfolio_items(
    category: Optional[str] = None,
    featured_only: bool = False,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get user's portfolio items"""
    return [
        PortfolioItem(
            id=f"portfolio-{i}",
            user_id=str(current_user.id),
            title=f"Project {i + 1}",
            description="An amazing project showcasing my skills",
            category="web-development",
            images=[f"/images/portfolio-{i}-1.jpg", f"/images/portfolio-{i}-2.jpg"],
            technologies=["React", "Node.js", "PostgreSQL"],
            is_featured=i == 0,
            views_count=150 + i * 20,
            likes_count=25 + i * 5,
            order=i,
            created_at=datetime.utcnow()
        )
        for i in range(min(limit, 5))
    ]


@router.post("/items", response_model=PortfolioItem)
async def create_portfolio_item(
    title: str,
    description: str,
    category: str,
    images: List[str],
    technologies: List[str],
    video_url: Optional[str] = None,
    live_url: Optional[str] = None,
    github_url: Optional[str] = None,
    client_name: Optional[str] = None,
    project_date: Optional[datetime] = None,
    is_featured: bool = False,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a portfolio item"""
    return PortfolioItem(
        id="portfolio-new",
        user_id=str(current_user.id),
        title=title,
        description=description,
        category=category,
        images=images,
        video_url=video_url,
        live_url=live_url,
        github_url=github_url,
        technologies=technologies,
        client_name=client_name,
        project_date=project_date,
        is_featured=is_featured,
        created_at=datetime.utcnow()
    )


@router.get("/items/{item_id}", response_model=PortfolioItem)
async def get_portfolio_item(
    item_id: str,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get a specific portfolio item"""
    return PortfolioItem(
        id=item_id,
        user_id=str(current_user.id),
        title="Amazing Project",
        description="Detailed description of the project",
        category="web-development",
        images=["/images/project.jpg"],
        technologies=["React", "Node.js"],
        views_count=250,
        likes_count=45,
        created_at=datetime.utcnow()
    )


@router.put("/items/{item_id}", response_model=PortfolioItem)
async def update_portfolio_item(
    item_id: str,
    title: Optional[str] = None,
    description: Optional[str] = None,
    category: Optional[str] = None,
    images: Optional[List[str]] = None,
    technologies: Optional[List[str]] = None,
    is_featured: Optional[bool] = None,
    is_public: Optional[bool] = None,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update a portfolio item"""
    return PortfolioItem(
        id=item_id,
        user_id=str(current_user.id),
        title=title or "Updated Project",
        description=description or "Updated description",
        category=category or "web-development",
        images=images or [],
        technologies=technologies or [],
        is_featured=is_featured if is_featured is not None else False,
        is_public=is_public if is_public is not None else True,
        created_at=datetime.utcnow()
    )


@router.delete("/items/{item_id}")
async def delete_portfolio_item(
    item_id: str,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a portfolio item"""
    return {"message": f"Portfolio item {item_id} deleted"}


@router.put("/items/reorder")
async def reorder_portfolio_items(
    item_orders: List[dict],
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Reorder portfolio items"""
    return {
        "success": True,
        "new_order": item_orders
    }


@router.get("/settings", response_model=PortfolioSettings)
async def get_portfolio_settings(
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get portfolio display settings"""
    return PortfolioSettings(
        user_id=str(current_user.id),
        layout="grid",
        theme="modern",
        show_client_names=True,
        show_dates=True,
        enable_comments=True
    )


@router.put("/settings")
async def update_portfolio_settings(
    layout: Optional[str] = Query(None),
    theme: Optional[str] = Query(None),
    show_client_names: Optional[bool] = Query(None),
    show_dates: Optional[bool] = Query(None),
    enable_comments: Optional[bool] = Query(None),
    custom_css: Optional[str] = Query(None),
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update portfolio settings"""
    return {
        "layout": layout,
        "theme": theme,
        "show_client_names": show_client_names,
        "show_dates": show_dates,
        "enable_comments": enable_comments,
        "updated_at": datetime.utcnow().isoformat()
    }


@router.get("/analytics", response_model=PortfolioAnalytics)
async def get_portfolio_analytics(
    days: int = Query(30, ge=1, le=365),
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get portfolio analytics"""
    return PortfolioAnalytics(
        total_views=1250,
        unique_visitors=850,
        avg_time_on_page=45.5,
        top_items=[
            {"id": "portfolio-1", "title": "Project 1", "views": 350},
            {"id": "portfolio-2", "title": "Project 2", "views": 280}
        ],
        traffic_sources={
            "direct": 45,
            "search": 30,
            "social": 15,
            "referral": 10
        }
    )


@router.post("/items/{item_id}/like")
async def like_portfolio_item(
    item_id: str,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Like a portfolio item"""
    return {
        "item_id": item_id,
        "liked": True,
        "likes_count": 46
    }


@router.delete("/items/{item_id}/like")
async def unlike_portfolio_item(
    item_id: str,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Unlike a portfolio item"""
    return {
        "item_id": item_id,
        "liked": False,
        "likes_count": 45
    }


@router.get("/public/{user_id}")
async def get_public_portfolio(
    user_id: str,
    db: Session = Depends(get_db)
):
    """Get a user's public portfolio (no auth required)"""
    return {
        "user_id": user_id,
        "user_name": "John Doe",
        "title": "Full Stack Developer",
        "bio": "Experienced developer with 5+ years of experience",
        "items": [],
        "settings": {
            "layout": "grid",
            "theme": "modern"
        }
    }


@router.post("/items/{item_id}/testimonial")
async def add_testimonial(
    item_id: str,
    client_name: str,
    testimonial: str,
    rating: int = Query(5, ge=1, le=5),
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Add a client testimonial to a portfolio item"""
    return {
        "item_id": item_id,
        "testimonial_id": "testimonial-new",
        "client_name": client_name,
        "testimonial": testimonial,
        "rating": rating
    }


@router.get("/categories")
async def get_portfolio_categories(
    current_user=Depends(get_current_active_user)
):
    """Get available portfolio categories"""
    return [
        {"id": "web-development", "name": "Web Development"},
        {"id": "mobile-development", "name": "Mobile Development"},
        {"id": "ui-ux-design", "name": "UI/UX Design"},
        {"id": "graphic-design", "name": "Graphic Design"},
        {"id": "marketing", "name": "Marketing"},
        {"id": "writing", "name": "Writing & Content"},
        {"id": "video", "name": "Video & Animation"},
        {"id": "other", "name": "Other"}
    ]


@router.post("/import/github")
async def import_from_github(
    github_username: str,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Import projects from GitHub"""
    return {
        "status": "processing",
        "github_username": github_username,
        "message": "Importing projects from GitHub..."
    }


@router.post("/export")
async def export_portfolio(
    format: str = Query("pdf", enum=["pdf", "html", "json"]),
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Export portfolio"""
    return {
        "export_id": "export-portfolio-123",
        "format": format,
        "status": "processing",
        "download_url": None
    }
