# @AI-HINT: Webhook management service for third-party integrations
"""
Webhook Service - Outbound webhook management.

Features:
- Webhook registration
- Event subscription
- Delivery management
- Retry logic
- Signature verification
- Delivery logs
"""

import logging
import hashlib
import hmac
import json
import httpx
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from enum import Enum
from collections import defaultdict

logger = logging.getLogger(__name__)


class WebhookEvent(str, Enum):
    """Webhook event types."""
    # User events
    USER_REGISTERED = "user.registered"
    USER_VERIFIED = "user.verified"
    USER_UPDATED = "user.updated"
    
    # Project events
    PROJECT_CREATED = "project.created"
    PROJECT_UPDATED = "project.updated"
    PROJECT_COMPLETED = "project.completed"
    PROJECT_CANCELLED = "project.cancelled"
    
    # Proposal events
    PROPOSAL_SUBMITTED = "proposal.submitted"
    PROPOSAL_ACCEPTED = "proposal.accepted"
    PROPOSAL_REJECTED = "proposal.rejected"
    
    # Contract events
    CONTRACT_CREATED = "contract.created"
    CONTRACT_SIGNED = "contract.signed"
    CONTRACT_COMPLETED = "contract.completed"
    CONTRACT_DISPUTED = "contract.disputed"
    
    # Payment events
    PAYMENT_INITIATED = "payment.initiated"
    PAYMENT_COMPLETED = "payment.completed"
    PAYMENT_FAILED = "payment.failed"
    ESCROW_FUNDED = "escrow.funded"
    ESCROW_RELEASED = "escrow.released"
    
    # Message events
    MESSAGE_SENT = "message.sent"
    MESSAGE_READ = "message.read"
    
    # Review events
    REVIEW_CREATED = "review.created"
    
    # Milestone events
    MILESTONE_COMPLETED = "milestone.completed"
    MILESTONE_APPROVED = "milestone.approved"


class WebhookStatus(str, Enum):
    """Webhook delivery status."""
    PENDING = "pending"
    DELIVERED = "delivered"
    FAILED = "failed"
    RETRYING = "retrying"


class WebhookService:
    """
    Webhook management service.
    
    Handles registration, delivery, and management
    of outbound webhooks for third-party integrations.
    """
    
    def __init__(self, db: Session):
        self.db = db
        # In-memory webhook storage (would be in DB in production)
        self._webhooks: Dict[str, Dict[str, Any]] = {}
        self._deliveries: Dict[str, Dict[str, Any]] = {}
        self._delivery_logs: List[Dict[str, Any]] = []
        self._retry_queue: List[str] = []
    
    async def register_webhook(
        self,
        user_id: int,
        url: str,
        events: List[WebhookEvent],
        description: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Register a new webhook.
        
        Args:
            user_id: Owner user ID
            url: Webhook URL
            events: Events to subscribe to
            description: Optional description
            
        Returns:
            Webhook details with secret
        """
        webhook_id = f"wh_{secrets.token_urlsafe(16)}"
        secret = secrets.token_urlsafe(32)
        
        webhook = {
            "id": webhook_id,
            "user_id": user_id,
            "url": url,
            "events": [e.value for e in events],
            "description": description,
            "secret": secret,
            "active": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "last_triggered": None,
            "success_count": 0,
            "failure_count": 0
        }
        
        self._webhooks[webhook_id] = webhook
        
        logger.info(f"Webhook registered: {webhook_id} for user {user_id}")
        
        # Return without full secret (show only once)
        return {
            **webhook,
            "secret": secret,  # Only show full secret on creation
            "note": "Save this secret - it won't be shown again"
        }
    
    async def update_webhook(
        self,
        webhook_id: str,
        user_id: int,
        url: Optional[str] = None,
        events: Optional[List[WebhookEvent]] = None,
        active: Optional[bool] = None,
        description: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """Update webhook configuration."""
        webhook = self._webhooks.get(webhook_id)
        
        if not webhook or webhook["user_id"] != user_id:
            return None
        
        if url:
            webhook["url"] = url
        if events:
            webhook["events"] = [e.value for e in events]
        if active is not None:
            webhook["active"] = active
        if description is not None:
            webhook["description"] = description
        
        webhook["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        # Don't return secret on update
        result = {**webhook}
        result["secret"] = "********"
        
        return result
    
    async def delete_webhook(
        self,
        webhook_id: str,
        user_id: int
    ) -> bool:
        """Delete a webhook."""
        webhook = self._webhooks.get(webhook_id)
        
        if not webhook or webhook["user_id"] != user_id:
            return False
        
        del self._webhooks[webhook_id]
        
        logger.info(f"Webhook deleted: {webhook_id}")
        
        return True
    
    async def get_webhook(
        self,
        webhook_id: str,
        user_id: int
    ) -> Optional[Dict[str, Any]]:
        """Get webhook details."""
        webhook = self._webhooks.get(webhook_id)
        
        if not webhook or webhook["user_id"] != user_id:
            return None
        
        # Mask secret
        result = {**webhook}
        result["secret"] = "********"
        
        return result
    
    async def list_webhooks(
        self,
        user_id: int
    ) -> List[Dict[str, Any]]:
        """List user's webhooks."""
        webhooks = []
        
        for webhook in self._webhooks.values():
            if webhook["user_id"] == user_id:
                result = {**webhook}
                result["secret"] = "********"
                webhooks.append(result)
        
        return webhooks
    
    async def trigger_webhook(
        self,
        event: WebhookEvent,
        payload: Dict[str, Any],
        user_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Trigger webhooks for an event.
        
        Args:
            event: Event type
            payload: Event data
            user_id: Optional specific user to trigger for
            
        Returns:
            Delivery summary
        """
        triggered = []
        
        for webhook in self._webhooks.values():
            # Skip inactive webhooks
            if not webhook["active"]:
                continue
            
            # Check if subscribed to event
            if event.value not in webhook["events"]:
                continue
            
            # Check user filter
            if user_id and webhook["user_id"] != user_id:
                continue
            
            # Create delivery
            delivery_id = f"del_{secrets.token_urlsafe(12)}"
            delivery = await self._deliver_webhook(
                webhook=webhook,
                delivery_id=delivery_id,
                event=event,
                payload=payload
            )
            
            triggered.append(delivery)
        
        return {
            "event": event.value,
            "webhooks_triggered": len(triggered),
            "deliveries": triggered
        }
    
    async def get_delivery_logs(
        self,
        webhook_id: str,
        user_id: int,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get delivery logs for a webhook."""
        webhook = self._webhooks.get(webhook_id)
        
        if not webhook or webhook["user_id"] != user_id:
            return []
        
        logs = [
            log for log in self._delivery_logs
            if log["webhook_id"] == webhook_id
        ]
        
        # Sort by timestamp descending
        logs.sort(key=lambda x: x["timestamp"], reverse=True)
        
        return logs[:limit]
    
    async def retry_delivery(
        self,
        delivery_id: str,
        user_id: int
    ) -> Optional[Dict[str, Any]]:
        """Manually retry a failed delivery."""
        delivery = self._deliveries.get(delivery_id)
        
        if not delivery:
            return None
        
        webhook = self._webhooks.get(delivery["webhook_id"])
        
        if not webhook or webhook["user_id"] != user_id:
            return None
        
        # Retry
        return await self._deliver_webhook(
            webhook=webhook,
            delivery_id=delivery_id,
            event=WebhookEvent(delivery["event"]),
            payload=delivery["payload"],
            is_retry=True
        )
    
    async def rotate_secret(
        self,
        webhook_id: str,
        user_id: int
    ) -> Optional[Dict[str, Any]]:
        """Rotate webhook secret."""
        webhook = self._webhooks.get(webhook_id)
        
        if not webhook or webhook["user_id"] != user_id:
            return None
        
        new_secret = secrets.token_urlsafe(32)
        webhook["secret"] = new_secret
        webhook["secret_rotated_at"] = datetime.now(timezone.utc).isoformat()
        
        return {
            "webhook_id": webhook_id,
            "new_secret": new_secret,
            "note": "Save this secret - it won't be shown again"
        }
    
    async def test_webhook(
        self,
        webhook_id: str,
        user_id: int
    ) -> Dict[str, Any]:
        """Send a test event to webhook."""
        webhook = self._webhooks.get(webhook_id)
        
        if not webhook or webhook["user_id"] != user_id:
            return {"error": "Webhook not found"}
        
        test_payload = {
            "test": True,
            "message": "This is a test webhook delivery",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        delivery_id = f"test_{secrets.token_urlsafe(8)}"
        
        result = await self._deliver_webhook(
            webhook=webhook,
            delivery_id=delivery_id,
            event=WebhookEvent.USER_UPDATED,  # Use a simple event
            payload=test_payload,
            is_test=True
        )
        
        return {
            "test": True,
            "delivery": result
        }
    
    def get_available_events(self) -> List[Dict[str, str]]:
        """Get list of available webhook events."""
        return [
            {
                "event": event.value,
                "category": event.value.split(".")[0],
                "action": event.value.split(".")[1]
            }
            for event in WebhookEvent
        ]
    
    async def _deliver_webhook(
        self,
        webhook: Dict[str, Any],
        delivery_id: str,
        event: WebhookEvent,
        payload: Dict[str, Any],
        is_retry: bool = False,
        is_test: bool = False
    ) -> Dict[str, Any]:
        """Deliver webhook to URL."""
        # Prepare payload
        full_payload = {
            "event": event.value,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "delivery_id": delivery_id,
            "test": is_test,
            "data": payload
        }
        
        payload_json = json.dumps(full_payload)
        
        # Generate signature
        signature = self._generate_signature(
            payload_json,
            webhook["secret"]
        )
        
        # Prepare headers
        headers = {
            "Content-Type": "application/json",
            "X-Webhook-Signature": signature,
            "X-Webhook-Event": event.value,
            "X-Webhook-Delivery": delivery_id
        }
        
        # Store delivery attempt
        delivery = {
            "id": delivery_id,
            "webhook_id": webhook["id"],
            "event": event.value,
            "payload": payload,
            "status": WebhookStatus.PENDING.value,
            "attempts": 1 if not is_retry else self._deliveries.get(delivery_id, {}).get("attempts", 0) + 1,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        self._deliveries[delivery_id] = delivery
        
        # Attempt delivery
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    webhook["url"],
                    content=payload_json,
                    headers=headers
                )
                
                # Check response
                if response.status_code < 300:
                    delivery["status"] = WebhookStatus.DELIVERED.value
                    delivery["response_code"] = response.status_code
                    webhook["success_count"] += 1
                    webhook["last_triggered"] = datetime.now(timezone.utc).isoformat()
                else:
                    raise Exception(f"HTTP {response.status_code}")
                    
        except Exception as e:
            logger.error(f"Webhook delivery failed: {delivery_id} - {str(e)}")
            
            delivery["status"] = WebhookStatus.FAILED.value
            delivery["error"] = str(e)
            webhook["failure_count"] += 1
            
            # Schedule retry if not too many attempts
            if delivery["attempts"] < 3:
                delivery["status"] = WebhookStatus.RETRYING.value
                self._retry_queue.append(delivery_id)
        
        # Log delivery
        log_entry = {
            "delivery_id": delivery_id,
            "webhook_id": webhook["id"],
            "event": event.value,
            "status": delivery["status"],
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "response_code": delivery.get("response_code"),
            "error": delivery.get("error")
        }
        
        self._delivery_logs.append(log_entry)
        
        return delivery
    
    def _generate_signature(
        self,
        payload: str,
        secret: str
    ) -> str:
        """Generate HMAC signature for payload."""
        return hmac.new(
            secret.encode("utf-8"),
            payload.encode("utf-8"),
            hashlib.sha256
        ).hexdigest()
    
    @staticmethod
    def verify_signature(
        payload: str,
        signature: str,
        secret: str
    ) -> bool:
        """Verify webhook signature (for incoming webhooks)."""
        expected = hmac.new(
            secret.encode("utf-8"),
            payload.encode("utf-8"),
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(expected, signature)


# Singleton instance
_webhook_service: Optional[WebhookService] = None


def get_webhook_service(db: Session) -> WebhookService:
    """Get or create webhook service instance."""
    global _webhook_service
    if _webhook_service is None:
        _webhook_service = WebhookService(db)
    else:
        _webhook_service.db = db
    return _webhook_service
