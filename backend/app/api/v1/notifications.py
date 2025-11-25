# @AI-HINT: Notifications API endpoints - Turso-only, no SQLite fallback
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from datetime import datetime
import json

from app.db.turso_http import execute_query, parse_rows
from app.core.security import get_current_user_from_token

router = APIRouter()


def get_current_user(token_data: dict = Depends(get_current_user_from_token)):
    """Get current user from token"""
    return token_data


@router.post("/notifications", response_model=dict)
def create_notification(
    notification: dict,
    current_user: dict = Depends(get_current_user)
):
    """Create a new notification (admin/system use)"""
    user_id = notification.get("user_id")
    current_user_id = current_user.get("user_id")
    role = current_user.get("role", "")
    
    # Only admins can create notifications for other users
    if user_id != current_user_id and role.lower() != "admin":
        raise HTTPException(status_code=403, detail="Only admins can create notifications for other users")
    
    now = datetime.utcnow().isoformat()
    data_json = json.dumps(notification.get("data")) if notification.get("data") else None
    
    result = execute_query(
        """INSERT INTO notifications (user_id, notification_type, title, content, data, 
                                      priority, action_url, expires_at, is_read, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        [
            user_id,
            notification.get("notification_type"),
            notification.get("title"),
            notification.get("content"),
            data_json,
            notification.get("priority", "medium"),
            notification.get("action_url"),
            notification.get("expires_at"),
            False,
            now
        ]
    )
    
    if not result:
        raise HTTPException(status_code=500, detail="Failed to create notification")
    
    # Get new ID
    id_result = execute_query("SELECT last_insert_rowid() as id", [])
    new_id = 0
    if id_result and id_result.get("rows"):
        id_rows = parse_rows(id_result)
        if id_rows:
            new_id = id_rows[0].get("id", 0)
    
    return {
        "id": new_id,
        "user_id": user_id,
        "notification_type": notification.get("notification_type"),
        "title": notification.get("title"),
        "content": notification.get("content"),
        "data": notification.get("data"),
        "priority": notification.get("priority", "medium"),
        "action_url": notification.get("action_url"),
        "is_read": False,
        "created_at": now
    }


@router.get("/notifications", response_model=dict)
def get_notifications(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    is_read: Optional[bool] = Query(None),
    notification_type: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """Get all notifications for current user"""
    user_id = current_user.get("user_id")
    now = datetime.utcnow().isoformat()
    
    # Build query with filters
    where_clauses = ["user_id = ?", "(expires_at IS NULL OR expires_at > ?)"]
    params = [user_id, now]
    
    if is_read is not None:
        where_clauses.append("is_read = ?")
        params.append(1 if is_read else 0)
    
    if notification_type:
        where_clauses.append("notification_type = ?")
        params.append(notification_type)
    
    if priority:
        where_clauses.append("priority = ?")
        params.append(priority)
    
    where_sql = " AND ".join(where_clauses)
    
    # Get total count
    count_result = execute_query(
        f"SELECT COUNT(*) as total FROM notifications WHERE {where_sql}",
        params
    )
    total = 0
    if count_result and count_result.get("rows"):
        count_rows = parse_rows(count_result)
        if count_rows:
            total = count_rows[0].get("total", 0)
    
    # Get unread count
    unread_result = execute_query(
        "SELECT COUNT(*) as unread FROM notifications WHERE user_id = ? AND is_read = 0",
        [user_id]
    )
    unread_count = 0
    if unread_result and unread_result.get("rows"):
        unread_rows = parse_rows(unread_result)
        if unread_rows:
            unread_count = unread_rows[0].get("unread", 0)
    
    # Get notifications
    params.extend([limit, skip])
    result = execute_query(
        f"""SELECT id, user_id, notification_type, title, content, data, priority,
                   action_url, is_read, read_at, expires_at, created_at
            FROM notifications WHERE {where_sql}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?""",
        params
    )
    
    notifications = []
    if result and result.get("rows"):
        for row in parse_rows(result):
            # Parse JSON data field
            if row.get("data"):
                try:
                    row["data"] = json.loads(row["data"])
                except:
                    pass
            row["is_read"] = bool(row.get("is_read"))
            notifications.append(row)
    
    return {
        "total": total,
        "unread_count": unread_count,
        "notifications": notifications
    }


@router.get("/notifications/{notification_id}", response_model=dict)
def get_notification(
    notification_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific notification"""
    user_id = current_user.get("user_id")
    
    result = execute_query(
        """SELECT id, user_id, notification_type, title, content, data, priority,
                  action_url, is_read, read_at, expires_at, created_at
           FROM notifications WHERE id = ?""",
        [notification_id]
    )
    
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Notification not found")
    
    rows = parse_rows(result)
    if not rows:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notification = rows[0]
    
    if notification.get("user_id") != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Auto-mark as read when viewed
    if not notification.get("is_read"):
        now = datetime.utcnow().isoformat()
        execute_query(
            "UPDATE notifications SET is_read = 1, read_at = ? WHERE id = ?",
            [now, notification_id]
        )
        notification["is_read"] = True
        notification["read_at"] = now
    
    # Parse JSON data
    if notification.get("data"):
        try:
            notification["data"] = json.loads(notification["data"])
        except:
            pass
    
    notification["is_read"] = bool(notification.get("is_read"))
    return notification


@router.patch("/notifications/{notification_id}", response_model=dict)
def update_notification(
    notification_id: int,
    notification_update: dict,
    current_user: dict = Depends(get_current_user)
):
    """Update a notification (mark as read/unread)"""
    user_id = current_user.get("user_id")
    
    result = execute_query(
        "SELECT id, user_id, is_read, read_at FROM notifications WHERE id = ?",
        [notification_id]
    )
    
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Notification not found")
    
    rows = parse_rows(result)
    if not rows:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notification = rows[0]
    
    if notification.get("user_id") != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Build update query
    updates = []
    params = []
    
    if "is_read" in notification_update:
        updates.append("is_read = ?")
        params.append(1 if notification_update["is_read"] else 0)
        
        if notification_update["is_read"] and not notification.get("read_at"):
            updates.append("read_at = ?")
            params.append(datetime.utcnow().isoformat())
    
    if updates:
        params.append(notification_id)
        execute_query(
            f"UPDATE notifications SET {', '.join(updates)} WHERE id = ?",
            params
        )
    
    # Fetch updated notification
    result = execute_query(
        """SELECT id, user_id, notification_type, title, content, data, priority,
                  action_url, is_read, read_at, expires_at, created_at
           FROM notifications WHERE id = ?""",
        [notification_id]
    )
    
    rows = parse_rows(result)
    updated = rows[0] if rows else {}
    
    if updated.get("data"):
        try:
            updated["data"] = json.loads(updated["data"])
        except:
            pass
    
    updated["is_read"] = bool(updated.get("is_read"))
    return updated


@router.post("/notifications/mark-all-read")
def mark_all_read(
    current_user: dict = Depends(get_current_user)
):
    """Mark all notifications as read for current user"""
    user_id = current_user.get("user_id")
    now = datetime.utcnow().isoformat()
    
    execute_query(
        "UPDATE notifications SET is_read = 1, read_at = ? WHERE user_id = ? AND is_read = 0",
        [now, user_id]
    )
    
    return {"message": "All notifications marked as read"}


@router.delete("/notifications/{notification_id}")
def delete_notification(
    notification_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Delete a notification"""
    user_id = current_user.get("user_id")
    
    result = execute_query(
        "SELECT id, user_id FROM notifications WHERE id = ?",
        [notification_id]
    )
    
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Notification not found")
    
    rows = parse_rows(result)
    if not rows:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    if rows[0].get("user_id") != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    execute_query("DELETE FROM notifications WHERE id = ?", [notification_id])
    
    return {"message": "Notification deleted successfully"}


@router.get("/notifications/unread/count")
def get_unread_count(
    current_user: dict = Depends(get_current_user)
):
    """Get count of unread notifications for current user"""
    user_id = current_user.get("user_id")
    
    result = execute_query(
        "SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0",
        [user_id]
    )
    
    count = 0
    if result and result.get("rows"):
        rows = parse_rows(result)
        if rows:
            count = rows[0].get("count", 0)
    
    return {"unread_count": count}


# Utility function to send notifications (can be used by other modules)
def send_notification(
    user_id: int,
    notification_type: str,
    title: str,
    content: str,
    data: dict = None,
    priority: str = "medium",
    action_url: str = None,
    expires_at: str = None,
):
    """Helper function to send a notification"""
    now = datetime.utcnow().isoformat()
    data_json = json.dumps(data) if data else None
    
    result = execute_query(
        """INSERT INTO notifications (user_id, notification_type, title, content, data, 
                                      priority, action_url, expires_at, is_read, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        [user_id, notification_type, title, content, data_json, priority, action_url, expires_at, False, now]
    )
    
    if not result:
        return None
    
    id_result = execute_query("SELECT last_insert_rowid() as id", [])
    new_id = 0
    if id_result and id_result.get("rows"):
        id_rows = parse_rows(id_result)
        if id_rows:
            new_id = id_rows[0].get("id", 0)
    
    return {
        "id": new_id,
        "user_id": user_id,
        "notification_type": notification_type,
        "title": title,
        "content": content,
        "data": data,
        "priority": priority,
        "action_url": action_url,
        "is_read": False,
        "created_at": now
    }
