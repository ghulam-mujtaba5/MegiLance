# @AI-HINT: Notifications API endpoints - Turso-only, no SQLite fallback
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from datetime import datetime, timezone
import json

from app.services import notifications_service
from app.core.security import get_current_user_from_token

router = APIRouter()


def get_current_user(token_data = Depends(get_current_user_from_token)):
    """Get current user from token"""
    return token_data


@router.post("", response_model=dict)
def create_notification(
    notification: dict,
    current_user = Depends(get_current_user)
):
    """Create a new notification (admin/system use)"""
    user_id = notification.get("user_id")
    current_user_id = current_user.get("user_id")
    role = current_user.get("role", "")
    
    # Only admins can create notifications for other users
    if user_id != current_user_id and role.lower() != "admin":
        raise HTTPException(status_code=403, detail="Only admins can create notifications for other users")
    
    now = datetime.now(timezone.utc).isoformat()
    data_json = json.dumps(notification.get("data")) if notification.get("data") else None
    
    new_id = notifications_service.insert_notification(
        user_id=user_id,
        notification_type=notification.get("notification_type"),
        title=notification.get("title"),
        content=notification.get("content"),
        data_json=data_json,
        priority=notification.get("priority", "medium"),
        action_url=notification.get("action_url"),
        expires_at=notification.get("expires_at"),
        now=now
    )
    
    if not new_id:
        raise HTTPException(status_code=500, detail="Failed to create notification")
    
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


@router.get("", response_model=dict)
def get_notifications(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    is_read: Optional[bool] = Query(None),
    notification_type: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    current_user = Depends(get_current_user)
):
    """Get all notifications for current user"""
    user_id = current_user.get("user_id")
    now = datetime.now(timezone.utc).isoformat()
    
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
    total = notifications_service.query_notification_count(where_sql, list(params))
    
    # Get unread count
    unread_count = notifications_service.query_unread_count(user_id)
    
    # Get notifications
    notifications = notifications_service.query_notifications(where_sql, list(params), limit, skip)
    
    for row in notifications:
        if row.get("data"):
            try:
                row["data"] = json.loads(row["data"])
            except:
                pass
        row["is_read"] = bool(row.get("is_read"))
    
    return {
        "total": total,
        "unread_count": unread_count,
        "notifications": notifications
    }


@router.get("/{notification_id}", response_model=dict)
def get_notification(
    notification_id: int,
    current_user = Depends(get_current_user)
):
    """Get a specific notification"""
    user_id = current_user.get("user_id")
    
    notification = notifications_service.fetch_notification_by_id(notification_id)
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    if notification.get("user_id") != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Auto-mark as read when viewed
    if not notification.get("is_read"):
        now = datetime.now(timezone.utc).isoformat()
        notifications_service.mark_notification_as_read(notification_id, now)
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


@router.patch("/{notification_id}", response_model=dict)
def update_notification(
    notification_id: int,
    notification_update: dict,
    current_user = Depends(get_current_user)
):
    """Update a notification (mark as read/unread)"""
    user_id = current_user.get("user_id")
    
    existing = notifications_service.fetch_notification_for_permission(notification_id)
    
    if not existing:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    if existing.get("user_id") != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Build update query
    updates = []
    params = []
    
    if "is_read" in notification_update:
        updates.append("is_read = ?")
        params.append(1 if notification_update["is_read"] else 0)
        
        if notification_update["is_read"] and not existing.get("read_at"):
            updates.append("read_at = ?")
            params.append(datetime.now(timezone.utc).isoformat())
    
    if updates:
        notifications_service.update_notification_fields(notification_id, ", ".join(updates), params)
    
    # Fetch updated notification
    updated = notifications_service.fetch_notification_by_id(notification_id)
    if not updated:
        updated = {}
    
    if updated.get("data"):
        try:
            updated["data"] = json.loads(updated["data"])
        except:
            pass
    
    updated["is_read"] = bool(updated.get("is_read"))
    return updated


@router.post("/mark-all-read")
def mark_all_read(
    current_user = Depends(get_current_user)
):
    """Mark all notifications as read for current user"""
    user_id = current_user.get("user_id")
    now = datetime.now(timezone.utc).isoformat()
    
    notifications_service.mark_all_read(user_id, now)
    
    return {"message": "All notifications marked as read"}


@router.delete("/{notification_id}")
def delete_notification(
    notification_id: int,
    current_user = Depends(get_current_user)
):
    """Delete a notification"""
    user_id = current_user.get("user_id")
    
    owner = notifications_service.fetch_notification_owner(notification_id)
    
    if not owner:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    if owner.get("user_id") != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    notifications_service.delete_notification_record(notification_id)
    
    return {"message": "Notification deleted successfully"}


@router.get("/unread/count")
def get_unread_count(
    current_user = Depends(get_current_user)
):
    """Get count of unread notifications for current user"""
    user_id = current_user.get("user_id")
    
    count = notifications_service.query_unread_count(user_id)
    
    return {"unread_count": count}


# Re-export send_notification from service for backward compatibility
send_notification = notifications_service.send_notification
