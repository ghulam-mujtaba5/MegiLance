# @AI-HINT: Portfolio items API - delegates to portfolio_service
from fastapi import APIRouter, Depends, HTTPException, Query, status, Request, UploadFile
from typing import List, Optional
import json
import uuid
from pathlib import Path

from app.core.security import get_current_user_from_token
from app.services import portfolio_service

router = APIRouter()


def get_current_user(token_data = Depends(get_current_user_from_token)):
    """Get current user from token"""
    return token_data

def _process_tags(items):
    """Parse tags JSON string to list"""
    for item in items:
        if item.get("tags"):
            try:
                if isinstance(item["tags"], list):
                    continue
                item["tags"] = json.loads(item["tags"])
            except:
                item["tags"] = []
        else:
            item["tags"] = []
    return items

@router.get("/", response_model=List[dict])
def list_portfolio_items(
    user_id: Optional[int] = Query(None, description="Filter by freelancer ID"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user = Depends(get_current_user)
):
    """List portfolio items for a user"""
    target_user_id = user_id if user_id else current_user.get("user_id")

    if target_user_id != current_user.get("user_id"):
        check = portfolio_service.verify_user_is_freelancer(target_user_id)
        if check is None or check is False:
            raise HTTPException(status_code=404, detail="Portfolio not found")

    items = portfolio_service.list_portfolio_items(target_user_id, skip, limit)
    return _process_tags(items)


@router.get("/{portfolio_item_id}", response_model=dict)
def get_portfolio_item(
    portfolio_item_id: int,
    current_user = Depends(get_current_user)
):
    """Get a specific portfolio item"""
    item = portfolio_service.get_portfolio_item_by_id(portfolio_item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Portfolio item not found")

    return _process_tags([item])[0]


@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_portfolio_item(
    portfolio_item: dict,
    current_user = Depends(get_current_user)
):
    """Create a new portfolio item (JSON)"""
    user_role = current_user.get("role", "")
    if user_role.lower() != "freelancer":
        raise HTTPException(
            status_code=403,
            detail="Only freelancers can create portfolio items"
        )

    user_id = current_user.get("user_id")
    tags_json = json.dumps(portfolio_item.get("tags", []))

    try:
        new_id, now = portfolio_service.create_portfolio_item_record(
            user_id,
            portfolio_item.get("title"),
            portfolio_item.get("description"),
            portfolio_item.get("image_url"),
            portfolio_item.get("project_url"),
            tags_json
        )
    except RuntimeError:
        raise HTTPException(status_code=500, detail="Failed to create portfolio item")

    return {
        "id": new_id,
        "freelancer_id": user_id,
        "title": portfolio_item.get("title"),
        "description": portfolio_item.get("description"),
        "image_url": portfolio_item.get("image_url"),
        "project_url": portfolio_item.get("project_url"),
        "tags": portfolio_item.get("tags", []),
        "created_at": now,
        "updated_at": now
    }


@router.post("/items", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_portfolio_item_wizard(
    request: Request,
    current_user = Depends(get_current_user)
):
    """Create a new portfolio item from wizard (multipart/form-data)"""
    user_role = current_user.get("role", "")
    if user_role.lower() != "freelancer":
        raise HTTPException(
            status_code=403,
            detail="Only freelancers can create portfolio items"
        )

    form = await request.form()

    title = form.get("title")
    description = form.get("short_description")
    project_url = form.get("project_url")
    technologies_json = form.get("technologies")

    tags = []
    if technologies_json:
        try:
            tags = json.loads(technologies_json)
        except:
            pass

    upload_dir = Path("uploads/portfolio")
    upload_dir.mkdir(parents=True, exist_ok=True)

    image_url = ""

    for key, value in form.items():
        if key.startswith("image_") and not key.endswith("_caption") and not key.endswith("_is_cover"):
            if isinstance(value, UploadFile):
                content = await value.read()
                if content:
                    filename = f"{uuid.uuid4()}_{value.filename}"
                    file_path = upload_dir / filename
                    with open(file_path, "wb") as f:
                        f.write(content)

                    index = key.split("_")[1]
                    is_cover = form.get(f"image_{index}_is_cover") == "true"

                    saved_url = f"/uploads/portfolio/{filename}"
                    if is_cover or not image_url:
                        image_url = saved_url

    user_id = current_user.get("user_id")
    tags_json = json.dumps(tags)

    try:
        new_id, now = portfolio_service.create_portfolio_item_record(
            user_id, title, description, image_url, project_url, tags_json
        )
    except RuntimeError:
        raise HTTPException(status_code=500, detail="Failed to create portfolio item")

    return {
        "id": new_id,
        "freelancer_id": user_id,
        "title": title,
        "description": description,
        "image_url": image_url,
        "project_url": project_url,
        "tags": tags,
        "created_at": now,
        "updated_at": now
    }


@router.put("/{portfolio_item_id}", response_model=dict)
def update_portfolio_item(
    portfolio_item_id: int,
    portfolio_item: dict,
    current_user = Depends(get_current_user)
):
    """Update a portfolio item"""
    user_id = current_user.get("user_id")

    owner = portfolio_service.get_portfolio_item_owner(portfolio_item_id)
    if not owner:
        raise HTTPException(status_code=404, detail="Portfolio item not found")
    if owner.get("freelancer_id") != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this portfolio item")

    updated = portfolio_service.update_portfolio_item_record(portfolio_item_id, portfolio_item)
    if not updated:
        return {}

    return _process_tags([updated])[0]


@router.delete("/{portfolio_item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_portfolio_item(
    portfolio_item_id: int,
    current_user = Depends(get_current_user)
):
    """Delete a portfolio item"""
    user_id = current_user.get("user_id")

    owner = portfolio_service.get_portfolio_item_owner(portfolio_item_id)
    if not owner:
        raise HTTPException(status_code=404, detail="Portfolio item not found")
    if owner.get("freelancer_id") != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this portfolio item")

    portfolio_service.delete_portfolio_item_record(portfolio_item_id)
    return
