# @AI-HINT: Mobile push notification service for iOS/Android
"""
Push Notification Service - FCM and APNs integration.

Features:
- Firebase Cloud Messaging (FCM) for Android
- Apple Push Notification Service (APNs) for iOS
- Device token management
- Notification templates
- Batch notifications
- Silent push for data sync
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from enum import Enum
import json
import uuid
import hashlib


class DevicePlatform(str, Enum):
    IOS = "ios"
    ANDROID = "android"
    WEB = "web"


class NotificationPriority(str, Enum):
    HIGH = "high"
    NORMAL = "normal"
    LOW = "low"


class PushNotificationService:
    """Service for mobile push notifications."""
    
    def __init__(self, db: Session):
        self.db = db
        # In production, initialize FCM and APNs clients here
        self._fcm_client = None
        self._apns_client = None
    
    # Device Management
    async def register_device(
        self,
        user_id: int,
        device_token: str,
        platform: DevicePlatform,
        device_info: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Register a device for push notifications."""
        device_id = str(uuid.uuid4())
        token_hash = hashlib.sha256(device_token.encode()).hexdigest()[:16]
        
        device = {
            "id": device_id,
            "user_id": user_id,
            "device_token": device_token,
            "token_hash": token_hash,
            "platform": platform.value,
            "device_info": device_info or {},
            "is_active": True,
            "created_at": datetime.utcnow().isoformat(),
            "last_used_at": datetime.utcnow().isoformat()
        }
        
        return device
    
    async def unregister_device(
        self,
        user_id: int,
        device_token: str
    ) -> bool:
        """Unregister a device from push notifications."""
        # In production, delete from database
        return True
    
    async def get_user_devices(
        self,
        user_id: int
    ) -> List[Dict[str, Any]]:
        """Get all registered devices for a user."""
        # Mock devices
        return [
            {
                "id": "device-1",
                "platform": "ios",
                "device_info": {"model": "iPhone 15 Pro", "os_version": "17.2"},
                "is_active": True,
                "last_used_at": datetime.utcnow().isoformat()
            },
            {
                "id": "device-2",
                "platform": "android",
                "device_info": {"model": "Pixel 8", "os_version": "14"},
                "is_active": True,
                "last_used_at": datetime.utcnow().isoformat()
            }
        ]
    
    async def update_device_token(
        self,
        user_id: int,
        old_token: str,
        new_token: str
    ) -> bool:
        """Update a device token (token refresh)."""
        # In production, update in database
        return True
    
    # Push Notifications
    async def send_notification(
        self,
        user_id: int,
        title: str,
        body: str,
        data: Optional[Dict] = None,
        image_url: Optional[str] = None,
        priority: NotificationPriority = NotificationPriority.HIGH,
        badge_count: Optional[int] = None,
        sound: str = "default",
        collapse_key: Optional[str] = None,
        ttl: int = 86400  # 24 hours
    ) -> Dict[str, Any]:
        """Send push notification to all user devices."""
        notification_id = str(uuid.uuid4())
        
        notification = {
            "id": notification_id,
            "user_id": user_id,
            "title": title,
            "body": body,
            "data": data or {},
            "image_url": image_url,
            "priority": priority.value,
            "badge_count": badge_count,
            "sound": sound,
            "collapse_key": collapse_key,
            "ttl": ttl,
            "status": "sent",
            "sent_at": datetime.utcnow().isoformat(),
            "devices_targeted": 2,
            "devices_delivered": 2
        }
        
        # In production, send via FCM/APNs
        await self._send_to_fcm(notification)
        await self._send_to_apns(notification)
        
        return notification
    
    async def send_to_device(
        self,
        device_token: str,
        platform: DevicePlatform,
        title: str,
        body: str,
        data: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Send push notification to a specific device."""
        if platform == DevicePlatform.IOS:
            return await self._send_to_apns({
                "device_token": device_token,
                "title": title,
                "body": body,
                "data": data
            })
        else:
            return await self._send_to_fcm({
                "device_token": device_token,
                "title": title,
                "body": body,
                "data": data
            })
    
    async def send_batch(
        self,
        user_ids: List[int],
        title: str,
        body: str,
        data: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Send push notification to multiple users."""
        batch_id = str(uuid.uuid4())
        
        results = {
            "batch_id": batch_id,
            "total_users": len(user_ids),
            "total_devices": len(user_ids) * 2,  # Estimated
            "successful": len(user_ids) * 2,
            "failed": 0,
            "sent_at": datetime.utcnow().isoformat()
        }
        
        return results
    
    async def send_silent_push(
        self,
        user_id: int,
        data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Send silent push for background data sync."""
        return {
            "id": str(uuid.uuid4()),
            "type": "silent",
            "user_id": user_id,
            "data": data,
            "sent_at": datetime.utcnow().isoformat()
        }
    
    # Notification Templates
    async def get_notification_templates(self) -> List[Dict[str, Any]]:
        """Get predefined notification templates."""
        return [
            {
                "id": "new_message",
                "name": "New Message",
                "title_template": "New message from {sender_name}",
                "body_template": "{preview}",
                "data_fields": ["conversation_id", "sender_id"]
            },
            {
                "id": "proposal_received",
                "name": "Proposal Received",
                "title_template": "New proposal on '{project_title}'",
                "body_template": "{freelancer_name} submitted a proposal",
                "data_fields": ["project_id", "proposal_id"]
            },
            {
                "id": "contract_signed",
                "name": "Contract Signed",
                "title_template": "Contract signed! 🎉",
                "body_template": "Your contract for '{project_title}' has been signed",
                "data_fields": ["contract_id"]
            },
            {
                "id": "milestone_approved",
                "name": "Milestone Approved",
                "title_template": "Milestone approved! 💰",
                "body_template": "'{milestone_title}' has been approved",
                "data_fields": ["milestone_id", "amount"]
            },
            {
                "id": "payment_received",
                "name": "Payment Received",
                "title_template": "Payment received! 💸",
                "body_template": "You received ${amount}",
                "data_fields": ["payment_id", "amount"]
            },
            {
                "id": "review_received",
                "name": "Review Received",
                "title_template": "New {rating}⭐ review!",
                "body_template": "{reviewer_name} left you a review",
                "data_fields": ["review_id", "rating"]
            }
        ]
    
    async def send_from_template(
        self,
        user_id: int,
        template_id: str,
        variables: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Send notification using a template."""
        templates = {t["id"]: t for t in await self.get_notification_templates()}
        
        template = templates.get(template_id)
        if not template:
            return {"success": False, "error": "Template not found"}
        
        title = template["title_template"].format(**variables)
        body = template["body_template"].format(**variables)
        
        data = {field: variables.get(field) for field in template["data_fields"]}
        
        return await self.send_notification(
            user_id=user_id,
            title=title,
            body=body,
            data=data
        )
    
    # Analytics
    async def get_notification_stats(
        self,
        user_id: Optional[int] = None,
        days: int = 30
    ) -> Dict[str, Any]:
        """Get push notification statistics."""
        return {
            "total_sent": 1542,
            "total_delivered": 1489,
            "total_opened": 876,
            "delivery_rate": 0.966,
            "open_rate": 0.588,
            "by_platform": {
                "ios": {"sent": 812, "delivered": 798, "opened": 512},
                "android": {"sent": 730, "delivered": 691, "opened": 364}
            },
            "by_type": {
                "new_message": 524,
                "proposal_received": 234,
                "payment_received": 189,
                "milestone_approved": 156,
                "other": 439
            },
            "period_days": days
        }
    
    async def mark_notification_opened(
        self,
        notification_id: str,
        device_id: str
    ) -> bool:
        """Mark a notification as opened for analytics."""
        # In production, update analytics
        return True
    
    # Platform-specific helpers
    async def _send_to_fcm(self, notification: Dict) -> Dict[str, Any]:
        """Send notification via Firebase Cloud Messaging."""
        # In production, use firebase-admin SDK
        return {
            "message_id": f"fcm_{uuid.uuid4().hex[:12]}",
            "success": True
        }
    
    async def _send_to_apns(self, notification: Dict) -> Dict[str, Any]:
        """Send notification via Apple Push Notification Service."""
        # In production, use apns2 library
        return {
            "apns_id": f"apns_{uuid.uuid4().hex[:12]}",
            "success": True
        }
    
    # Topic subscriptions
    async def subscribe_to_topic(
        self,
        device_token: str,
        topic: str
    ) -> bool:
        """Subscribe device to a topic."""
        return True
    
    async def unsubscribe_from_topic(
        self,
        device_token: str,
        topic: str
    ) -> bool:
        """Unsubscribe device from a topic."""
        return True
    
    async def send_to_topic(
        self,
        topic: str,
        title: str,
        body: str,
        data: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Send notification to all devices subscribed to a topic."""
        return {
            "id": str(uuid.uuid4()),
            "topic": topic,
            "title": title,
            "body": body,
            "data": data,
            "sent_at": datetime.utcnow().isoformat()
        }


def get_push_notification_service(db: Session) -> PushNotificationService:
    """Factory function for push notification service."""
    return PushNotificationService(db)
