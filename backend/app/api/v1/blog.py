from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, Depends
from app.schemas.blog import BlogPostCreate, BlogPostUpdate, BlogPostResponse
from app.services.blog_service import BlogService
from app.core.security import get_current_active_user, require_admin

router = APIRouter()

@router.post("/", response_model=BlogPostResponse)
async def create_post(post: BlogPostCreate, current_user=Depends(require_admin)):
    """Create a new blog post (admin only)"""
    existing_post = await BlogService.get_post_by_slug(post.slug)
    if existing_post:
        raise HTTPException(status_code=400, detail="Slug already exists")
    return await BlogService.create_post(post)

@router.get("/", response_model=List[BlogPostResponse])
async def read_posts(
    skip: int = 0, 
    limit: int = 10, 
    is_published: Optional[bool] = None,
    is_news_trend: Optional[bool] = None
):
    return await BlogService.get_posts(skip=skip, limit=limit, is_published=is_published, is_news_trend=is_news_trend)

@router.get("/{slug}", response_model=BlogPostResponse)
async def read_post(slug: str):
    post = await BlogService.get_post_by_slug(slug)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Increment views asynchronously (fire and forget)
    await BlogService.increment_views(slug)
    
    return post

@router.put("/{post_id}", response_model=BlogPostResponse)
async def update_post(post_id: str, post_update: BlogPostUpdate, current_user=Depends(require_admin)):
    """Update a blog post (admin only)"""
    post = await BlogService.update_post(post_id, post_update)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post

@router.delete("/{post_id}")
async def delete_post(post_id: str, current_user=Depends(require_admin)):
    """Delete a blog post (admin only)"""
    success = await BlogService.delete_post(post_id)
    if not success:
        raise HTTPException(status_code=404, detail="Post not found")
    return {"status": "success"}
