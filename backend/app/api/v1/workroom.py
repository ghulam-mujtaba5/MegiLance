# @AI-HINT: Collaboration Workroom API - Kanban, Files, Discussions for project spaces
"""
Collaboration Workroom API
Provides project-centric collaboration features:
- Kanban boards with task management
- File sharing and document collaboration
- Threaded project discussions
- Real-time activity tracking
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status, UploadFile, File
from typing import List, Optional
from datetime import datetime
import json
import uuid
import logging
import os

from app.core.security import get_current_active_user
from app.core.config import get_settings
from app.db.turso_http import execute_query, to_str, parse_date
from app.models.user import User
from pydantic import BaseModel, Field

router = APIRouter()
logger = logging.getLogger(__name__)
settings = get_settings()


# ==================== Pydantic Models ====================

# Kanban Models
class TaskCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: Optional[str] = Field(None, max_length=5000)
    column: str = Field("todo", pattern="^(todo|in_progress|review|done)$")
    priority: str = Field("medium", pattern="^(low|medium|high|urgent)$")
    assignee_id: Optional[int] = None
    due_date: Optional[datetime] = None
    labels: List[str] = Field(default=[])


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=200)
    description: Optional[str] = Field(None, max_length=5000)
    column: Optional[str] = Field(None, pattern="^(todo|in_progress|review|done)$")
    priority: Optional[str] = Field(None, pattern="^(low|medium|high|urgent)$")
    assignee_id: Optional[int] = None
    due_date: Optional[datetime] = None
    labels: Optional[List[str]] = None
    order_index: Optional[int] = None


class TaskMoveRequest(BaseModel):
    column: str = Field(..., pattern="^(todo|in_progress|review|done)$")
    order_index: int = Field(..., ge=0)


# Discussion Models
class DiscussionCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=200)
    content: str = Field(..., min_length=10, max_length=10000)
    is_pinned: bool = False


class DiscussionUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=5, max_length=200)
    content: Optional[str] = Field(None, min_length=10, max_length=10000)
    is_pinned: Optional[bool] = None


class CommentCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000)
    parent_id: Optional[int] = None


# File Models
class FileMetadataUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)


# ==================== Helper Functions ====================

def _get_val(row: list, idx: int):
    """Extract value from database row"""
    if idx >= len(row):
        return None
    cell = row[idx]
    if isinstance(cell, dict):
        if cell.get("type") == "null":
            return None
        return cell.get("value")
    return cell


def _ensure_workroom_tables():
    """Create workroom tables if they don't exist"""
    # Kanban tasks table
    execute_query("""
        CREATE TABLE IF NOT EXISTS workroom_tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            contract_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            column_name TEXT DEFAULT 'todo',
            priority TEXT DEFAULT 'medium',
            assignee_id INTEGER,
            created_by INTEGER NOT NULL,
            due_date TEXT,
            labels TEXT,
            order_index INTEGER DEFAULT 0,
            is_completed INTEGER DEFAULT 0,
            completed_at TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (contract_id) REFERENCES contracts(id),
            FOREIGN KEY (assignee_id) REFERENCES users(id),
            FOREIGN KEY (created_by) REFERENCES users(id)
        )
    """, [])
    
    # Task comments
    execute_query("""
        CREATE TABLE IF NOT EXISTS workroom_task_comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            task_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            content TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (task_id) REFERENCES workroom_tasks(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """, [])
    
    # Project files
    execute_query("""
        CREATE TABLE IF NOT EXISTS workroom_files (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            contract_id INTEGER NOT NULL,
            uploaded_by INTEGER NOT NULL,
            filename TEXT NOT NULL,
            original_name TEXT NOT NULL,
            file_path TEXT NOT NULL,
            file_size INTEGER,
            mime_type TEXT,
            description TEXT,
            version INTEGER DEFAULT 1,
            parent_file_id INTEGER,
            download_count INTEGER DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (contract_id) REFERENCES contracts(id),
            FOREIGN KEY (uploaded_by) REFERENCES users(id)
        )
    """, [])
    
    # Project discussions (threaded)
    execute_query("""
        CREATE TABLE IF NOT EXISTS workroom_discussions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            contract_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            is_pinned INTEGER DEFAULT 0,
            reply_count INTEGER DEFAULT 0,
            last_reply_at TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (contract_id) REFERENCES contracts(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """, [])
    
    # Discussion replies
    execute_query("""
        CREATE TABLE IF NOT EXISTS workroom_discussion_replies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            discussion_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            parent_id INTEGER,
            content TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (discussion_id) REFERENCES workroom_discussions(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """, [])
    
    # Activity log
    execute_query("""
        CREATE TABLE IF NOT EXISTS workroom_activity (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            contract_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            activity_type TEXT NOT NULL,
            entity_type TEXT,
            entity_id INTEGER,
            description TEXT,
            metadata TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (contract_id) REFERENCES contracts(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """, [])


# Initialize tables on module load
try:
    _ensure_workroom_tables()
except Exception as e:
    logger.warning(f"Could not initialize workroom tables: {e}")


def _verify_contract_access(contract_id: int, user_id: int) -> tuple:
    """Verify user has access to contract workroom"""
    result = execute_query("""
        SELECT client_id, freelancer_id, status FROM contracts WHERE id = ?
    """, [contract_id])
    
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Contract not found")
    
    row = result["rows"][0]
    client_id = int(_get_val(row, 0) or 0)
    freelancer_id = int(_get_val(row, 1) or 0)
    status = _get_val(row, 2)
    
    if user_id not in [client_id, freelancer_id]:
        raise HTTPException(status_code=403, detail="You are not a party to this contract")
    
    return client_id, freelancer_id, status


def _log_activity(contract_id: int, user_id: int, activity_type: str, 
                  entity_type: str = None, entity_id: int = None, 
                  description: str = None, metadata: dict = None):
    """Log workroom activity"""
    now = datetime.utcnow().isoformat()
    metadata_json = json.dumps(metadata) if metadata else None
    try:
        execute_query("""
            INSERT INTO workroom_activity (contract_id, user_id, activity_type, entity_type, 
                                           entity_id, description, metadata, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, [contract_id, user_id, activity_type, entity_type, entity_id, description, metadata_json, now])
    except Exception as e:
        logger.warning(f"Failed to log activity: {e}")


# ==================== Kanban Board Endpoints ====================

@router.get("/contracts/{contract_id}/board")
async def get_kanban_board(
    contract_id: int,
    current_user: User = Depends(get_current_active_user)
):
    """Get the complete Kanban board for a contract workroom."""
    _verify_contract_access(contract_id, current_user.id)
    
    result = execute_query("""
        SELECT t.id, t.title, t.description, t.column_name, t.priority, t.assignee_id,
               u.full_name, t.due_date, t.labels, t.order_index, t.is_completed,
               t.completed_at, t.created_at, t.updated_at
        FROM workroom_tasks t
        LEFT JOIN users u ON t.assignee_id = u.id
        WHERE t.contract_id = ?
        ORDER BY t.column_name, t.order_index
    """, [contract_id])
    
    # Organize tasks by column
    columns = {
        "todo": {"name": "To Do", "tasks": []},
        "in_progress": {"name": "In Progress", "tasks": []},
        "review": {"name": "Review", "tasks": []},
        "done": {"name": "Done", "tasks": []}
    }
    
    if result and result.get("rows"):
        for row in result["rows"]:
            task = {
                "id": _get_val(row, 0),
                "title": _get_val(row, 1),
                "description": _get_val(row, 2),
                "column": _get_val(row, 3),
                "priority": _get_val(row, 4),
                "assignee_id": _get_val(row, 5),
                "assignee_name": _get_val(row, 6),
                "due_date": _get_val(row, 7),
                "labels": json.loads(_get_val(row, 8) or "[]"),
                "order_index": _get_val(row, 9) or 0,
                "is_completed": bool(_get_val(row, 10)),
                "completed_at": _get_val(row, 11),
                "created_at": _get_val(row, 12)
            }
            column = task["column"] or "todo"
            if column in columns:
                columns[column]["tasks"].append(task)
    
    return {"columns": columns}


@router.post("/contracts/{contract_id}/tasks", status_code=status.HTTP_201_CREATED)
async def create_task(
    contract_id: int,
    task: TaskCreate,
    current_user: User = Depends(get_current_active_user)
):
    """Create a new task on the Kanban board."""
    _verify_contract_access(contract_id, current_user.id)
    
    now = datetime.utcnow().isoformat()
    labels_json = json.dumps(task.labels) if task.labels else "[]"
    due_date = task.due_date.isoformat() if task.due_date else None
    
    # Get next order index
    order_result = execute_query("""
        SELECT MAX(order_index) FROM workroom_tasks WHERE contract_id = ? AND column_name = ?
    """, [contract_id, task.column])
    next_order = (_get_val(order_result["rows"][0], 0) or 0) + 1 if order_result and order_result.get("rows") else 0
    
    execute_query("""
        INSERT INTO workroom_tasks (contract_id, title, description, column_name, priority,
                                    assignee_id, created_by, due_date, labels, order_index, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, [contract_id, task.title, task.description, task.column, task.priority,
          task.assignee_id, current_user.id, due_date, labels_json, next_order, now, now])
    
    # Get created task ID
    id_result = execute_query("SELECT last_insert_rowid()", [])
    task_id = _get_val(id_result["rows"][0], 0) if id_result and id_result.get("rows") else None
    
    _log_activity(contract_id, current_user.id, "task_created", "task", task_id, f"Created task: {task.title}")
    
    return {
        "id": task_id,
        "title": task.title,
        "column": task.column,
        "priority": task.priority,
        "created_at": now,
        "message": "Task created successfully"
    }


@router.patch("/tasks/{task_id}")
async def update_task(
    task_id: int,
    update: TaskUpdate,
    current_user: User = Depends(get_current_active_user)
):
    """Update a task."""
    # Get task and verify access
    result = execute_query("SELECT contract_id, column_name FROM workroom_tasks WHERE id = ?", [task_id])
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Task not found")
    
    contract_id = int(_get_val(result["rows"][0], 0) or 0)
    old_column = _get_val(result["rows"][0], 1)
    _verify_contract_access(contract_id, current_user.id)
    
    # Build update
    update_fields = []
    params = []
    data = update.model_dump(exclude_unset=True)
    
    for field, value in data.items():
        if value is not None:
            if field == "column":
                field = "column_name"
            if field == "labels":
                value = json.dumps(value)
            elif field == "due_date":
                value = value.isoformat()
            update_fields.append(f"{field} = ?")
            params.append(value)
    
    if update_fields:
        update_fields.append("updated_at = ?")
        params.append(datetime.utcnow().isoformat())
        params.append(task_id)
        
        execute_query(f"UPDATE workroom_tasks SET {', '.join(update_fields)} WHERE id = ?", params)
        
        # Check if moved to done
        if update.column == "done" and old_column != "done":
            execute_query("""
                UPDATE workroom_tasks SET is_completed = 1, completed_at = ? WHERE id = ?
            """, [datetime.utcnow().isoformat(), task_id])
            _log_activity(contract_id, current_user.id, "task_completed", "task", task_id)
        elif update.column and update.column != "done" and old_column == "done":
            execute_query("UPDATE workroom_tasks SET is_completed = 0, completed_at = NULL WHERE id = ?", [task_id])
    
    return {"message": "Task updated successfully"}


@router.post("/tasks/{task_id}/move")
async def move_task(
    task_id: int,
    move: TaskMoveRequest,
    current_user: User = Depends(get_current_active_user)
):
    """Move a task to a different column or position."""
    result = execute_query("SELECT contract_id, column_name FROM workroom_tasks WHERE id = ?", [task_id])
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Task not found")
    
    contract_id = int(_get_val(result["rows"][0], 0) or 0)
    old_column = _get_val(result["rows"][0], 1)
    _verify_contract_access(contract_id, current_user.id)
    
    now = datetime.utcnow().isoformat()
    is_completed = 1 if move.column == "done" else 0
    completed_at = now if move.column == "done" and old_column != "done" else None
    
    execute_query("""
        UPDATE workroom_tasks 
        SET column_name = ?, order_index = ?, is_completed = ?, completed_at = COALESCE(?, completed_at), updated_at = ?
        WHERE id = ?
    """, [move.column, move.order_index, is_completed, completed_at, now, task_id])
    
    _log_activity(contract_id, current_user.id, "task_moved", "task", task_id, 
                  f"Moved task from {old_column} to {move.column}")
    
    return {"message": "Task moved successfully"}


@router.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: int,
    current_user: User = Depends(get_current_active_user)
):
    """Delete a task."""
    result = execute_query("SELECT contract_id, title FROM workroom_tasks WHERE id = ?", [task_id])
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Task not found")
    
    contract_id = int(_get_val(result["rows"][0], 0) or 0)
    title = _get_val(result["rows"][0], 1)
    _verify_contract_access(contract_id, current_user.id)
    
    execute_query("DELETE FROM workroom_task_comments WHERE task_id = ?", [task_id])
    execute_query("DELETE FROM workroom_tasks WHERE id = ?", [task_id])
    
    _log_activity(contract_id, current_user.id, "task_deleted", "task", task_id, f"Deleted task: {title}")


# ==================== File Sharing Endpoints ====================

@router.get("/contracts/{contract_id}/files")
async def list_files(
    contract_id: int,
    current_user: User = Depends(get_current_active_user)
):
    """List all files in a contract workroom."""
    _verify_contract_access(contract_id, current_user.id)
    
    result = execute_query("""
        SELECT f.id, f.filename, f.original_name, f.file_size, f.mime_type, f.description,
               f.version, f.download_count, f.uploaded_by, u.full_name, f.created_at
        FROM workroom_files f
        LEFT JOIN users u ON f.uploaded_by = u.id
        WHERE f.contract_id = ? AND f.parent_file_id IS NULL
        ORDER BY f.created_at DESC
    """, [contract_id])
    
    files = []
    if result and result.get("rows"):
        for row in result["rows"]:
            files.append({
                "id": _get_val(row, 0),
                "filename": _get_val(row, 1),
                "original_name": _get_val(row, 2),
                "file_size": _get_val(row, 3),
                "mime_type": _get_val(row, 4),
                "description": _get_val(row, 5),
                "version": _get_val(row, 6),
                "download_count": _get_val(row, 7),
                "uploaded_by": _get_val(row, 8),
                "uploader_name": _get_val(row, 9),
                "created_at": _get_val(row, 10)
            })
    
    return {"files": files, "total": len(files)}


@router.post("/contracts/{contract_id}/files", status_code=status.HTTP_201_CREATED)
async def upload_file(
    contract_id: int,
    file: UploadFile = File(...),
    description: Optional[str] = None,
    current_user: User = Depends(get_current_active_user)
):
    """Upload a file to the workroom."""
    _verify_contract_access(contract_id, current_user.id)
    
    # Generate unique filename
    file_ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    
    # Create workroom files directory
    workroom_dir = os.path.join(settings.upload_dir, "workroom", str(contract_id))
    os.makedirs(workroom_dir, exist_ok=True)
    
    file_path = os.path.join(workroom_dir, unique_filename)
    
    # Save file
    content = await file.read()
    file_size = len(content)
    
    if file_size > settings.max_upload_size:
        raise HTTPException(status_code=400, detail=f"File too large. Maximum size is {settings.max_upload_size} bytes")
    
    with open(file_path, "wb") as f:
        f.write(content)
    
    now = datetime.utcnow().isoformat()
    
    execute_query("""
        INSERT INTO workroom_files (contract_id, uploaded_by, filename, original_name, file_path, 
                                    file_size, mime_type, description, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, [contract_id, current_user.id, unique_filename, file.filename, file_path,
          file_size, file.content_type, description, now, now])
    
    _log_activity(contract_id, current_user.id, "file_uploaded", "file", None, f"Uploaded file: {file.filename}")
    
    return {"message": "File uploaded successfully", "filename": file.filename, "size": file_size}


@router.get("/files/{file_id}/download")
async def download_file(
    file_id: int,
    current_user: User = Depends(get_current_active_user)
):
    """Get file download URL/path."""
    result = execute_query("""
        SELECT contract_id, file_path, original_name FROM workroom_files WHERE id = ?
    """, [file_id])
    
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="File not found")
    
    row = result["rows"][0]
    contract_id = int(_get_val(row, 0) or 0)
    file_path = _get_val(row, 1)
    original_name = _get_val(row, 2)
    
    _verify_contract_access(contract_id, current_user.id)
    
    # Increment download count
    execute_query("UPDATE workroom_files SET download_count = download_count + 1 WHERE id = ?", [file_id])
    
    # Return file path (in production, this would be a signed URL)
    return {
        "file_id": file_id,
        "original_name": original_name,
        "download_url": f"/uploads/workroom/{contract_id}/{os.path.basename(file_path)}"
    }


@router.delete("/files/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_file(
    file_id: int,
    current_user: User = Depends(get_current_active_user)
):
    """Delete a file from workroom."""
    result = execute_query("""
        SELECT contract_id, file_path, original_name, uploaded_by FROM workroom_files WHERE id = ?
    """, [file_id])
    
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="File not found")
    
    row = result["rows"][0]
    contract_id = int(_get_val(row, 0) or 0)
    file_path = _get_val(row, 1)
    original_name = _get_val(row, 2)
    uploaded_by = int(_get_val(row, 3) or 0)
    
    _verify_contract_access(contract_id, current_user.id)
    
    # Only uploader can delete (or either party in contract)
    if current_user.id != uploaded_by:
        client_id, freelancer_id, _ = _verify_contract_access(contract_id, current_user.id)
    
    # Delete physical file
    if file_path and os.path.exists(file_path):
        try:
            os.remove(file_path)
        except Exception as e:
            logger.warning(f"Could not delete file: {e}")
    
    execute_query("DELETE FROM workroom_files WHERE id = ?", [file_id])
    
    _log_activity(contract_id, current_user.id, "file_deleted", "file", file_id, f"Deleted file: {original_name}")


# ==================== Discussion Endpoints ====================

@router.get("/contracts/{contract_id}/discussions")
async def list_discussions(
    contract_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user)
):
    """List discussions in a contract workroom."""
    _verify_contract_access(contract_id, current_user.id)
    
    result = execute_query("""
        SELECT d.id, d.user_id, u.full_name, d.title, d.content, d.is_pinned,
               d.reply_count, d.last_reply_at, d.created_at, d.updated_at
        FROM workroom_discussions d
        LEFT JOIN users u ON d.user_id = u.id
        WHERE d.contract_id = ?
        ORDER BY d.is_pinned DESC, d.last_reply_at DESC, d.created_at DESC
        LIMIT ? OFFSET ?
    """, [contract_id, limit, skip])
    
    discussions = []
    if result and result.get("rows"):
        for row in result["rows"]:
            discussions.append({
                "id": _get_val(row, 0),
                "user_id": _get_val(row, 1),
                "author_name": _get_val(row, 2),
                "title": _get_val(row, 3),
                "content": _get_val(row, 4)[:300] + "..." if len(_get_val(row, 4) or "") > 300 else _get_val(row, 4),
                "is_pinned": bool(_get_val(row, 5)),
                "reply_count": _get_val(row, 6) or 0,
                "last_reply_at": _get_val(row, 7),
                "created_at": _get_val(row, 8)
            })
    
    return {"discussions": discussions, "total": len(discussions)}


@router.post("/contracts/{contract_id}/discussions", status_code=status.HTTP_201_CREATED)
async def create_discussion(
    contract_id: int,
    discussion: DiscussionCreate,
    current_user: User = Depends(get_current_active_user)
):
    """Create a new discussion thread."""
    _verify_contract_access(contract_id, current_user.id)
    
    now = datetime.utcnow().isoformat()
    
    execute_query("""
        INSERT INTO workroom_discussions (contract_id, user_id, title, content, is_pinned, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, [contract_id, current_user.id, discussion.title, discussion.content, 
          1 if discussion.is_pinned else 0, now, now])
    
    _log_activity(contract_id, current_user.id, "discussion_created", "discussion", None, 
                  f"Started discussion: {discussion.title}")
    
    return {"message": "Discussion created successfully"}


@router.get("/discussions/{discussion_id}")
async def get_discussion(
    discussion_id: int,
    current_user: User = Depends(get_current_active_user)
):
    """Get a discussion with all replies."""
    result = execute_query("""
        SELECT d.id, d.contract_id, d.user_id, u.full_name, d.title, d.content, 
               d.is_pinned, d.reply_count, d.last_reply_at, d.created_at, d.updated_at
        FROM workroom_discussions d
        LEFT JOIN users u ON d.user_id = u.id
        WHERE d.id = ?
    """, [discussion_id])
    
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Discussion not found")
    
    row = result["rows"][0]
    contract_id = int(_get_val(row, 1) or 0)
    _verify_contract_access(contract_id, current_user.id)
    
    discussion = {
        "id": _get_val(row, 0),
        "contract_id": contract_id,
        "user_id": _get_val(row, 2),
        "author_name": _get_val(row, 3),
        "title": _get_val(row, 4),
        "content": _get_val(row, 5),
        "is_pinned": bool(_get_val(row, 6)),
        "reply_count": _get_val(row, 7) or 0,
        "last_reply_at": _get_val(row, 8),
        "created_at": _get_val(row, 9),
        "updated_at": _get_val(row, 10)
    }
    
    # Get replies
    replies_result = execute_query("""
        SELECT r.id, r.user_id, u.full_name, r.parent_id, r.content, r.created_at, r.updated_at
        FROM workroom_discussion_replies r
        LEFT JOIN users u ON r.user_id = u.id
        WHERE r.discussion_id = ?
        ORDER BY r.created_at ASC
    """, [discussion_id])
    
    replies = []
    if replies_result and replies_result.get("rows"):
        for rrow in replies_result["rows"]:
            replies.append({
                "id": _get_val(rrow, 0),
                "user_id": _get_val(rrow, 1),
                "author_name": _get_val(rrow, 2),
                "parent_id": _get_val(rrow, 3),
                "content": _get_val(rrow, 4),
                "created_at": _get_val(rrow, 5),
                "updated_at": _get_val(rrow, 6)
            })
    
    discussion["replies"] = replies
    return discussion


@router.post("/discussions/{discussion_id}/replies", status_code=status.HTTP_201_CREATED)
async def add_reply(
    discussion_id: int,
    comment: CommentCreate,
    current_user: User = Depends(get_current_active_user)
):
    """Add a reply to a discussion."""
    result = execute_query("SELECT contract_id FROM workroom_discussions WHERE id = ?", [discussion_id])
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Discussion not found")
    
    contract_id = int(_get_val(result["rows"][0], 0) or 0)
    _verify_contract_access(contract_id, current_user.id)
    
    now = datetime.utcnow().isoformat()
    
    execute_query("""
        INSERT INTO workroom_discussion_replies (discussion_id, user_id, parent_id, content, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
    """, [discussion_id, current_user.id, comment.parent_id, comment.content, now, now])
    
    # Update discussion
    execute_query("""
        UPDATE workroom_discussions SET reply_count = reply_count + 1, last_reply_at = ?, updated_at = ?
        WHERE id = ?
    """, [now, now, discussion_id])
    
    return {"message": "Reply added successfully"}


# ==================== Activity Feed ====================

@router.get("/contracts/{contract_id}/activity")
async def get_workroom_activity(
    contract_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_active_user)
):
    """Get activity feed for a workroom."""
    _verify_contract_access(contract_id, current_user.id)
    
    result = execute_query("""
        SELECT a.id, a.user_id, u.full_name, a.activity_type, a.entity_type, a.entity_id,
               a.description, a.metadata, a.created_at
        FROM workroom_activity a
        LEFT JOIN users u ON a.user_id = u.id
        WHERE a.contract_id = ?
        ORDER BY a.created_at DESC
        LIMIT ? OFFSET ?
    """, [contract_id, limit, skip])
    
    activities = []
    if result and result.get("rows"):
        for row in result["rows"]:
            activities.append({
                "id": _get_val(row, 0),
                "user_id": _get_val(row, 1),
                "user_name": _get_val(row, 2),
                "activity_type": _get_val(row, 3),
                "entity_type": _get_val(row, 4),
                "entity_id": _get_val(row, 5),
                "description": _get_val(row, 6),
                "metadata": json.loads(_get_val(row, 7) or "{}"),
                "created_at": _get_val(row, 8)
            })
    
    return {"activities": activities, "total": len(activities)}


# ==================== Workroom Summary ====================

@router.get("/contracts/{contract_id}/summary")
async def get_workroom_summary(
    contract_id: int,
    current_user: User = Depends(get_current_active_user)
):
    """Get summary statistics for a workroom."""
    _verify_contract_access(contract_id, current_user.id)
    
    summary = {"contract_id": contract_id}
    
    # Task counts by column
    tasks_result = execute_query("""
        SELECT column_name, COUNT(*) FROM workroom_tasks WHERE contract_id = ? GROUP BY column_name
    """, [contract_id])
    
    task_counts = {"todo": 0, "in_progress": 0, "review": 0, "done": 0}
    if tasks_result and tasks_result.get("rows"):
        for row in tasks_result["rows"]:
            col = _get_val(row, 0)
            count = _get_val(row, 1) or 0
            if col in task_counts:
                task_counts[col] = count
    
    summary["tasks"] = task_counts
    summary["total_tasks"] = sum(task_counts.values())
    summary["completion_rate"] = round(task_counts["done"] / max(summary["total_tasks"], 1) * 100, 1)
    
    # File count
    files_result = execute_query("SELECT COUNT(*) FROM workroom_files WHERE contract_id = ?", [contract_id])
    summary["file_count"] = _get_val(files_result["rows"][0], 0) or 0 if files_result and files_result.get("rows") else 0
    
    # Discussion count
    disc_result = execute_query("SELECT COUNT(*) FROM workroom_discussions WHERE contract_id = ?", [contract_id])
    summary["discussion_count"] = _get_val(disc_result["rows"][0], 0) or 0 if disc_result and disc_result.get("rows") else 0
    
    # Recent activity count (last 7 days)
    week_ago = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    week_ago = week_ago.isoformat()
    activity_result = execute_query("""
        SELECT COUNT(*) FROM workroom_activity WHERE contract_id = ? AND created_at > ?
    """, [contract_id, week_ago])
    summary["recent_activities"] = _get_val(activity_result["rows"][0], 0) or 0 if activity_result and activity_result.get("rows") else 0
    
    return summary
