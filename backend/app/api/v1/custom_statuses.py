# @AI-HINT: Custom workflow statuses - Allow users to define custom project/task statuses
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from enum import Enum
from app.db.session import get_db
from app.api.v1.auth import get_current_active_user

router = APIRouter(prefix="/custom-statuses")


class EntityType(str, Enum):
    PROJECT = "project"
    PROPOSAL = "proposal"
    CONTRACT = "contract"
    MILESTONE = "milestone"
    TASK = "task"


class StatusColor(str, Enum):
    GRAY = "gray"
    BLUE = "blue"
    GREEN = "green"
    YELLOW = "yellow"
    ORANGE = "orange"
    RED = "red"
    PURPLE = "purple"
    PINK = "pink"


class CustomStatusCreate(BaseModel):
    name: str
    entity_type: EntityType
    color: StatusColor = StatusColor.GRAY
    description: Optional[str] = None
    is_default: bool = False
    sort_order: int = 0


class CustomStatusUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[StatusColor] = None
    description: Optional[str] = None
    is_default: Optional[bool] = None
    sort_order: Optional[int] = None


class CustomStatusResponse(BaseModel):
    id: str
    name: str
    entity_type: EntityType
    color: StatusColor
    description: Optional[str]
    is_default: bool
    sort_order: int
    user_id: str
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


# In-memory storage for demo
custom_statuses_db = {}
status_counter = 0


@router.get("", response_model=List[CustomStatusResponse])
async def list_custom_statuses(
    entity_type: Optional[EntityType] = None,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """List all custom statuses for the current user"""
    user_statuses = [s for s in custom_statuses_db.values() if s["user_id"] == str(current_user.id)]
    if entity_type:
        user_statuses = [s for s in user_statuses if s["entity_type"] == entity_type.value]
    return sorted(user_statuses, key=lambda x: x["sort_order"])


@router.post("", response_model=CustomStatusResponse, status_code=status.HTTP_201_CREATED)
async def create_custom_status(
    status_data: CustomStatusCreate,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new custom status"""
    global status_counter
    status_counter += 1
    
    now = datetime.utcnow()
    new_status = {
        "id": f"status_{status_counter}",
        "name": status_data.name,
        "entity_type": status_data.entity_type.value,
        "color": status_data.color.value,
        "description": status_data.description,
        "is_default": status_data.is_default,
        "sort_order": status_data.sort_order,
        "user_id": str(current_user.id),
        "created_at": now,
        "updated_at": None
    }
    
    custom_statuses_db[new_status["id"]] = new_status
    return new_status


@router.get("/{status_id}", response_model=CustomStatusResponse)
async def get_custom_status(
    status_id: str,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get a specific custom status"""
    if status_id not in custom_statuses_db:
        raise HTTPException(status_code=404, detail="Custom status not found")
    
    custom_status = custom_statuses_db[status_id]
    if custom_status["user_id"] != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to access this status")
    
    return custom_status


@router.put("/{status_id}", response_model=CustomStatusResponse)
async def update_custom_status(
    status_id: str,
    status_data: CustomStatusUpdate,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update a custom status"""
    if status_id not in custom_statuses_db:
        raise HTTPException(status_code=404, detail="Custom status not found")
    
    custom_status = custom_statuses_db[status_id]
    if custom_status["user_id"] != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to modify this status")
    
    if status_data.name is not None:
        custom_status["name"] = status_data.name
    if status_data.color is not None:
        custom_status["color"] = status_data.color.value
    if status_data.description is not None:
        custom_status["description"] = status_data.description
    if status_data.is_default is not None:
        custom_status["is_default"] = status_data.is_default
    if status_data.sort_order is not None:
        custom_status["sort_order"] = status_data.sort_order
    
    custom_status["updated_at"] = datetime.utcnow()
    return custom_status


@router.delete("/{status_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_custom_status(
    status_id: str,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a custom status"""
    if status_id not in custom_statuses_db:
        raise HTTPException(status_code=404, detail="Custom status not found")
    
    custom_status = custom_statuses_db[status_id]
    if custom_status["user_id"] != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to delete this status")
    
    del custom_statuses_db[status_id]
    return None


@router.post("/reorder", response_model=List[CustomStatusResponse])
async def reorder_statuses(
    entity_type: EntityType,
    status_ids: List[str],
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Reorder custom statuses"""
    for idx, status_id in enumerate(status_ids):
        if status_id in custom_statuses_db:
            if custom_statuses_db[status_id]["user_id"] == str(current_user.id):
                custom_statuses_db[status_id]["sort_order"] = idx
                custom_statuses_db[status_id]["updated_at"] = datetime.utcnow()
    
    user_statuses = [s for s in custom_statuses_db.values() 
                    if s["user_id"] == str(current_user.id) and s["entity_type"] == entity_type.value]
    return sorted(user_statuses, key=lambda x: x["sort_order"])
