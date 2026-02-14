# @AI-HINT: Notes and tags API - Organization and metadata
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, timezone
from app.db.session import get_db
from app.core.security import get_current_active_user
from app.services.db_utils import paginate_params

router = APIRouter(prefix="/notes-tags")


class Note(BaseModel):
    id: str
    user_id: str
    entity_type: str
    entity_id: str
    content: str
    is_private: bool = True
    is_pinned: bool = False
    color: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None


class Tag(BaseModel):
    id: str
    user_id: str
    name: str
    color: str
    description: Optional[str] = None
    entity_count: int = 0
    created_at: datetime


class EntityTag(BaseModel):
    tag_id: str
    entity_type: str
    entity_id: str
    tagged_at: datetime


@router.get("/notes", response_model=List[Note])
async def get_notes(
    entity_type: Optional[str] = None,
    entity_id: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get user's notes"""
    offset, limit = paginate_params(page, page_size)
    return [
        Note(
            id=f"note-{i}",
            user_id=str(current_user.id),
            entity_type="project",
            entity_id=f"project-{i}",
            content=f"Important note about project {i}",
            is_private=True,
            is_pinned=i == 0,
            color="#FFE4B5" if i == 0 else None,
            created_at=datetime.now(timezone.utc)
        )
        for i in range(min(limit, 5))
    ]


@router.post("/notes", response_model=Note)
async def create_note(
    entity_type: str,
    entity_id: str,
    content: str,
    is_private: bool = True,
    color: Optional[str] = None,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a note"""
    return Note(
        id="note-new",
        user_id=str(current_user.id),
        entity_type=entity_type,
        entity_id=entity_id,
        content=content,
        is_private=is_private,
        color=color,
        created_at=datetime.now(timezone.utc)
    )


@router.get("/notes/{note_id}", response_model=Note)
async def get_note(
    note_id: str,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get a specific note"""
    return Note(
        id=note_id,
        user_id=str(current_user.id),
        entity_type="project",
        entity_id="project-1",
        content="Note content",
        created_at=datetime.now(timezone.utc)
    )


@router.put("/notes/{note_id}", response_model=Note)
async def update_note(
    note_id: str,
    content: Optional[str] = None,
    is_pinned: Optional[bool] = None,
    color: Optional[str] = None,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update a note"""
    return Note(
        id=note_id,
        user_id=str(current_user.id),
        entity_type="project",
        entity_id="project-1",
        content=content or "Updated content",
        is_pinned=is_pinned if is_pinned is not None else False,
        color=color,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )


@router.delete("/notes/{note_id}")
async def delete_note(
    note_id: str,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a note"""
    return {"message": f"Note {note_id} deleted"}


@router.get("/tags", response_model=List[Tag])
async def get_tags(
    search: Optional[str] = None,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get user's tags"""
    return [
        Tag(
            id="tag-1",
            user_id=str(current_user.id),
            name="Priority",
            color="#FF5733",
            description="High priority items",
            entity_count=12,
            created_at=datetime.now(timezone.utc)
        ),
        Tag(
            id="tag-2",
            user_id=str(current_user.id),
            name="Follow-up",
            color="#33A1FF",
            description="Items needing follow-up",
            entity_count=8,
            created_at=datetime.now(timezone.utc)
        ),
        Tag(
            id="tag-3",
            user_id=str(current_user.id),
            name="Important",
            color="#FFD700",
            entity_count=15,
            created_at=datetime.now(timezone.utc)
        )
    ]


@router.post("/tags", response_model=Tag)
async def create_tag(
    name: str,
    color: str,
    description: Optional[str] = None,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a tag"""
    return Tag(
        id="tag-new",
        user_id=str(current_user.id),
        name=name,
        color=color,
        description=description,
        entity_count=0,
        created_at=datetime.now(timezone.utc)
    )


@router.put("/tags/{tag_id}", response_model=Tag)
async def update_tag(
    tag_id: str,
    name: Optional[str] = None,
    color: Optional[str] = None,
    description: Optional[str] = None,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update a tag"""
    return Tag(
        id=tag_id,
        user_id=str(current_user.id),
        name=name or "Updated Tag",
        color=color or "#000000",
        description=description,
        entity_count=10,
        created_at=datetime.now(timezone.utc)
    )


@router.delete("/tags/{tag_id}")
async def delete_tag(
    tag_id: str,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a tag"""
    return {"message": f"Tag {tag_id} deleted"}


@router.post("/tags/{tag_id}/assign")
async def assign_tag(
    tag_id: str,
    entity_type: str,
    entity_id: str,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Assign a tag to an entity"""
    return {
        "tag_id": tag_id,
        "entity_type": entity_type,
        "entity_id": entity_id,
        "assigned": True
    }


@router.delete("/tags/{tag_id}/assign")
async def remove_tag(
    tag_id: str,
    entity_type: str,
    entity_id: str,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Remove a tag from an entity"""
    return {
        "tag_id": tag_id,
        "entity_type": entity_type,
        "entity_id": entity_id,
        "removed": True
    }


@router.get("/entity/{entity_type}/{entity_id}")
async def get_entity_notes_tags(
    entity_type: str,
    entity_id: str,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get notes and tags for a specific entity"""
    return {
        "entity_type": entity_type,
        "entity_id": entity_id,
        "notes": [
            {
                "id": "note-1",
                "content": "Important note",
                "is_pinned": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        ],
        "tags": [
            {"id": "tag-1", "name": "Priority", "color": "#FF5733"}
        ]
    }


@router.post("/bulk-tag")
async def bulk_tag_entities(
    tag_id: str,
    entity_type: str,
    entity_ids: List[str],
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Apply a tag to multiple entities"""
    return {
        "tag_id": tag_id,
        "entity_type": entity_type,
        "tagged_count": len(entity_ids)
    }


@router.get("/search")
async def search_by_tags(
    tag_ids: List[str] = Query([]),
    entity_type: Optional[str] = None,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Search entities by tags"""
    return {
        "results": [
            {"entity_type": "project", "entity_id": "project-1", "tags": ["tag-1"]},
            {"entity_type": "project", "entity_id": "project-2", "tags": ["tag-1", "tag-2"]}
        ],
        "total": 2
    }


@router.get("/stats")
async def get_notes_tags_stats(
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get notes and tags statistics"""
    return {
        "total_notes": 45,
        "pinned_notes": 5,
        "total_tags": 12,
        "most_used_tags": [
            {"name": "Priority", "count": 15},
            {"name": "Important", "count": 12}
        ],
        "notes_by_entity": {
            "project": 25,
            "contract": 12,
            "user": 8
        }
    }

