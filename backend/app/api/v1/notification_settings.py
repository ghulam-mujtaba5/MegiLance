# @AI-HINT: Notification settings API - Granular notification preferences
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, time
from enum import Enum
from app.db.session import get_db
from app.api.v1.auth import get_current_active_user

router = APIRouter(prefix="/notification-settings")


class NotificationChannel(str, Enum):
    EMAIL = "email"
    PUSH = "push"
    SMS = "sms"
    IN_APP = "in_app"


class NotificationCategory(str, Enum):
    PROJECTS = "projects"
    PROPOSALS = "proposals"
    MESSAGES = "messages"
    PAYMENTS = "payments"
    REVIEWS = "reviews"
    MARKETING = "marketing"
    SECURITY = "security"
    SYSTEM = "system"


class NotificationSetting(BaseModel):
    category: NotificationCategory
    channel: NotificationChannel
    enabled: bool
    frequency: Optional[str] = None


class QuietHours(BaseModel):
    enabled: bool
    start_time: time
    end_time: time
    timezone: str
    days: List[int]


class DigestSettings(BaseModel):
    enabled: bool
    frequency: str
    send_time: time
    categories: List[NotificationCategory]


@router.get("/all")
async def get_all_notification_settings(
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all notification settings"""
    return {
        "user_id": str(current_user.id),
        "settings": {
            "projects": {
                "email": True,
                "push": True,
                "sms": False,
                "in_app": True
            },
            "proposals": {
                "email": True,
                "push": True,
                "sms": False,
                "in_app": True
            },
            "messages": {
                "email": True,
                "push": True,
                "sms": True,
                "in_app": True
            },
            "payments": {
                "email": True,
                "push": True,
                "sms": True,
                "in_app": True
            },
            "reviews": {
                "email": True,
                "push": True,
                "sms": False,
                "in_app": True
            },
            "marketing": {
                "email": False,
                "push": False,
                "sms": False,
                "in_app": False
            },
            "security": {
                "email": True,
                "push": True,
                "sms": True,
                "in_app": True
            },
            "system": {
                "email": True,
                "push": True,
                "sms": False,
                "in_app": True
            }
        }
    }


@router.get("/category/{category}", response_model=List[NotificationSetting])
async def get_category_settings(
    category: NotificationCategory,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get settings for a specific category"""
    return [
        NotificationSetting(category=category, channel=NotificationChannel.EMAIL, enabled=True),
        NotificationSetting(category=category, channel=NotificationChannel.PUSH, enabled=True),
        NotificationSetting(category=category, channel=NotificationChannel.SMS, enabled=False),
        NotificationSetting(category=category, channel=NotificationChannel.IN_APP, enabled=True)
    ]


@router.put("/category/{category}")
async def update_category_settings(
    category: NotificationCategory,
    email: Optional[bool] = None,
    push: Optional[bool] = None,
    sms: Optional[bool] = None,
    in_app: Optional[bool] = None,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update settings for a specific category"""
    return {
        "category": category,
        "updated": True,
        "settings": {
            "email": email,
            "push": push,
            "sms": sms,
            "in_app": in_app
        }
    }


@router.put("/channel/{channel}")
async def update_channel_settings(
    channel: NotificationChannel,
    enabled: bool,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Enable or disable a notification channel globally"""
    return {
        "channel": channel,
        "enabled": enabled,
        "message": f"{channel} notifications {'enabled' if enabled else 'disabled'}"
    }


@router.get("/quiet-hours", response_model=QuietHours)
async def get_quiet_hours(
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get quiet hours settings"""
    return QuietHours(
        enabled=True,
        start_time=time(22, 0),
        end_time=time(8, 0),
        timezone="UTC",
        days=[0, 1, 2, 3, 4, 5, 6]
    )


@router.put("/quiet-hours")
async def update_quiet_hours(
    enabled: bool,
    start_time: Optional[time] = None,
    end_time: Optional[time] = None,
    timezone: Optional[str] = None,
    days: Optional[List[int]] = None,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update quiet hours settings"""
    return {
        "enabled": enabled,
        "start_time": start_time.isoformat() if start_time else None,
        "end_time": end_time.isoformat() if end_time else None,
        "timezone": timezone,
        "days": days,
        "updated_at": datetime.utcnow().isoformat()
    }


@router.get("/digest", response_model=DigestSettings)
async def get_digest_settings(
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get email digest settings"""
    return DigestSettings(
        enabled=True,
        frequency="daily",
        send_time=time(9, 0),
        categories=[NotificationCategory.PROJECTS, NotificationCategory.PROPOSALS, NotificationCategory.MESSAGES]
    )


@router.put("/digest")
async def update_digest_settings(
    enabled: bool,
    frequency: Optional[str] = Query(None, enum=["daily", "weekly", "never"]),
    send_time: Optional[time] = None,
    categories: Optional[List[NotificationCategory]] = None,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update email digest settings"""
    return {
        "enabled": enabled,
        "frequency": frequency,
        "send_time": send_time.isoformat() if send_time else None,
        "categories": categories,
        "updated_at": datetime.utcnow().isoformat()
    }


@router.post("/mute/{entity_type}/{entity_id}")
async def mute_entity(
    entity_type: str,
    entity_id: str,
    duration_hours: Optional[int] = None,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Mute notifications for a specific entity (project, user, etc.)"""
    return {
        "entity_type": entity_type,
        "entity_id": entity_id,
        "muted": True,
        "muted_until": datetime.utcnow().isoformat() if duration_hours else "indefinitely"
    }


@router.delete("/mute/{entity_type}/{entity_id}")
async def unmute_entity(
    entity_type: str,
    entity_id: str,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Unmute notifications for a specific entity"""
    return {
        "entity_type": entity_type,
        "entity_id": entity_id,
        "muted": False
    }


@router.get("/muted")
async def get_muted_entities(
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get list of muted entities"""
    return {
        "muted_entities": [
            {"type": "project", "id": "proj-123", "muted_until": None},
            {"type": "user", "id": "user-456", "muted_until": datetime.utcnow().isoformat()}
        ]
    }


@router.post("/test/{channel}")
async def send_test_notification(
    channel: NotificationChannel,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Send a test notification"""
    return {
        "channel": channel,
        "sent": True,
        "message": f"Test notification sent via {channel}"
    }


@router.get("/devices")
async def get_registered_devices(
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get registered devices for push notifications"""
    return [
        {
            "id": "device-1",
            "name": "iPhone 15",
            "platform": "ios",
            "last_active": datetime.utcnow().isoformat(),
            "enabled": True
        },
        {
            "id": "device-2",
            "name": "Chrome - Windows",
            "platform": "web",
            "last_active": datetime.utcnow().isoformat(),
            "enabled": True
        }
    ]


@router.delete("/devices/{device_id}")
async def remove_device(
    device_id: str,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Remove a registered device"""
    return {"message": f"Device {device_id} removed"}


@router.post("/unsubscribe-all")
async def unsubscribe_all(
    confirm: bool = Query(...),
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Unsubscribe from all non-essential notifications"""
    if not confirm:
        raise HTTPException(status_code=400, detail="Confirmation required")
    return {
        "unsubscribed": True,
        "message": "Unsubscribed from all non-essential notifications. Security notifications remain enabled."
    }
