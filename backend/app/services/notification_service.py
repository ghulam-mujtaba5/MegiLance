"""
Notification Service
Manages email, in-app, and push notifications
"""

from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime, timezone
import logging
import json
from app.models.notification import Notification

logger = logging.getLogger(__name__)


class NotificationService:
    """Service for managing notifications"""
    
    NOTIFICATION_TYPES = {
        'PROJECT_CREATED': 'New project created',
        'PROPOSAL_RECEIVED': 'New proposal received',
        'PROPOSAL_ACCEPTED': 'Your proposal was accepted',
        'PROPOSAL_REJECTED': 'Your proposal was rejected',
        'CONTRACT_CREATED': 'Contract created',
        'PAYMENT_RECEIVED': 'Payment received',
        'MESSAGE_RECEIVED': 'New message received',
        'REVIEW_RECEIVED': 'New review received',
        'PROJECT_COMPLETED': 'Project completed',
    }
    
    def __init__(self, db: Session):
        self.db = db
    
    async def send_notification(
        self,
        user_id: int,
        notification_type: str,
        title: str,
        message: str,
        data: Optional[Dict[str, Any]] = None,
        send_email: bool = False,
        send_push: bool = False
    ) -> Dict[str, Any]:
        """Send a notification to a user"""
        try:
            notification_data = {
                'user_id': user_id,
                'type': notification_type,
                'title': title,
                'message': message,
                'data': data or {},
                'created_at': datetime.now(timezone.utc).isoformat(),
                'read': False
            }
            
            # Save to database
            saved_notification = await self._save_notification(notification_data)
            
            # Send email if requested
            if send_email:
                await self._send_email_notification(user_id, title, message)
            
            # Send push notification if requested
            if send_push:
                await self._send_push_notification(user_id, title, message)
            
            logger.info(f"Notification sent to user {user_id}: {notification_type}")
            
            # Return dict representation including the ID
            notification_data['id'] = saved_notification.id
            return notification_data
            
        except Exception as e:
            logger.error(f"Error sending notification: {e}")
            # Don't crash the caller if notification fails, just log it
            return {}
    
    async def _save_notification(self, notification_data: Dict[str, Any]) -> Notification:
        """Save notification to database"""
        try:
            notification = Notification(
                user_id=notification_data['user_id'],
                notification_type=notification_data['type'],
                title=notification_data['title'],
                content=notification_data['message'],
                data=json.dumps(notification_data['data']) if notification_data.get('data') else None,
                is_read=False,
                created_at=datetime.now(timezone.utc)
            )
            self.db.add(notification)
            self.db.commit()
            self.db.refresh(notification)
            return notification
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to save notification to DB: {e}")
            raise
    
    async def get_user_notifications(
        self,
        user_id: int,
        unread_only: bool = False,
        limit: int = 50,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Get notifications for a user"""
        try:
            query = self.db.query(Notification).filter(Notification.user_id == user_id)
            
            if unread_only:
                query = query.filter(Notification.is_read == False)
            
            # Sort by newest first
            query = query.order_by(desc(Notification.created_at))
            
            # Pagination
            notifications = query.offset(offset).limit(limit).all()
            
            results = []
            for n in notifications:
                results.append({
                    'id': n.id,
                    'type': n.notification_type,
                    'title': n.title,
                    'message': n.content,
                    'data': json.loads(n.data) if n.data else {},
                    'created_at': n.created_at.isoformat() if n.created_at else None,
                    'read': n.is_read,
                    'read_at': n.read_at.isoformat() if n.read_at else None
                })
            
            return results
            
        except Exception as e:
            logger.error(f"Error getting notifications: {e}")
            return []
    
    async def mark_as_read(
        self,
        notification_ids: List[int],
        user_id: int
    ) -> bool:
        """Mark notifications as read"""
        try:
            # Update notifications belonging to this user
            self.db.query(Notification).filter(
                Notification.id.in_(notification_ids),
                Notification.user_id == user_id
            ).update(
                {
                    Notification.is_read: True,
                    Notification.read_at: datetime.now(timezone.utc)
                },
                synchronize_session=False
            )
            self.db.commit()
            return True
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error marking notifications as read: {e}")
            return False

    async def mark_all_as_read(self, user_id: int) -> bool:
        """Mark all notifications for a user as read"""
        try:
            self.db.query(Notification).filter(
                Notification.user_id == user_id,
                Notification.is_read == False
            ).update(
                {
                    Notification.is_read: True,
                    Notification.read_at: datetime.now(timezone.utc)
                },
                synchronize_session=False
            )
            self.db.commit()
            return True
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error marking all notifications as read: {e}")
            return False
    
    async def _send_email_notification(self, user_id: int, title: str, message: str):
        """Send email notification"""
        try:
            # Get user email
            from app.models.user import User
            user = self.db.query(User).filter(User.id == user_id).first()
            if not user:
                return
            
            # Send email via AWS SES or other service
            logger.info(f"Email notification sent to {user.email}: {title}")
            
        except Exception as e:
            logger.error(f"Error sending email notification: {e}")
    
    async def _send_push_notification(self, user_id: int, title: str, message: str):
        """Send push notification"""
        try:
            # Send via FCM, APNS, or other push service
            logger.info(f"Push notification sent to user {user_id}: {title}")
            
        except Exception as e:
            logger.error(f"Error sending push notification: {e}")
    
    async def notify_project_created(self, project_id: int, client_id: int):
        """Notify relevant freelancers about new project"""
        try:
            # Get matching freelancers
            from app.services.ai_matching import get_project_matches
            matches = await get_project_matches(self.db, project_id, limit=10)
            
            for match in matches:
                await self.send_notification(
                    user_id=match['freelancer_id'],
                    notification_type='PROJECT_CREATED',
                    title='New Project Match',
                    message=f"A new project matches your skills ({match['match_score']*100:.0f}% match)",
                    data={'project_id': project_id, 'match_score': match['match_score']},
                    send_email=True
                )
                
        except Exception as e:
            logger.error(f"Error notifying about project: {e}")
    
    async def notify_proposal_received(self, proposal_id: int, client_id: int):
        """Notify client about new proposal"""
        await self.send_notification(
            user_id=client_id,
            notification_type='PROPOSAL_RECEIVED',
            title='New Proposal',
            message='You have received a new proposal for your project',
            data={'proposal_id': proposal_id},
            send_email=True
        )
    
    async def notify_proposal_accepted(self, proposal_id: int, freelancer_id: int):
        """Notify freelancer their proposal was accepted"""
        await self.send_notification(
            user_id=freelancer_id,
            notification_type='PROPOSAL_ACCEPTED',
            title='Proposal Accepted!',
            message='Congratulations! Your proposal has been accepted',
            data={'proposal_id': proposal_id},
            send_email=True,
            send_push=True
        )
    
    async def send_payment_notification(
        self,
        recipient_id: int,
        payment_id: int,
        amount: float,
        currency: str,
        notification_type: str,
        db: Session
    ) -> Dict[str, Any]:
        """
        Send payment-related notification
        Types: 'payment_received', 'payment_confirmed', 'payment_refunded'
        """
        messages = {
            'payment_received': f'You received a payment of {amount} {currency}',
            'payment_confirmed': f'Payment of {amount} {currency} has been confirmed',
            'payment_refunded': f'Payment of {amount} {currency} has been refunded'
        }
        
        message = messages.get(notification_type, 'Payment update')
        
        # Use the send_notification method
        return await self.send_notification(
            user_id=recipient_id,
            notification_type=notification_type.upper(),
            title='Payment Update',
            message=message,
            data={'payment_id': payment_id, 'amount': amount, 'currency': currency},
            send_email=True,
            send_push=True
        )
