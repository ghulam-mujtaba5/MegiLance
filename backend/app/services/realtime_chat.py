# @AI-HINT: Production-grade real-time chat service with read receipts, presence, reactions, and file sharing
"""
Real-time Chat Service
======================
Billion-dollar feature: Professional chat with:
- Real-time messaging via WebSocket
- Read receipts (sent, delivered, read)
- Typing indicators with debouncing
- User presence (online, away, offline)
- Message reactions
- Thread replies
- File/media sharing
- Message search
- Chat export
"""

import logging
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
from enum import Enum
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc

from app.models.user import User
from app.models.message import Message
from app.models.conversation import Conversation
from app.core.websocket import websocket_manager

logger = logging.getLogger(__name__)


class MessageStatus(str, Enum):
    """Message delivery status"""
    SENT = "sent"
    DELIVERED = "delivered"
    READ = "read"


class PresenceStatus(str, Enum):
    """User presence status"""
    ONLINE = "online"
    AWAY = "away"  # Inactive for 5+ minutes
    OFFLINE = "offline"


class RealtimeChatService:
    """
    Production-grade real-time chat service
    """
    
    def __init__(self, db: Session):
        self.db = db
        self._presence_cache: Dict[int, Tuple[PresenceStatus, datetime]] = {}
        self._typing_users: Dict[str, Dict[int, datetime]] = {}  # chat_id -> {user_id: timestamp}
    
    # =========================================================================
    # CONVERSATIONS
    # =========================================================================
    
    async def get_or_create_conversation(
        self,
        user1_id: int,
        user2_id: int,
        project_id: Optional[int] = None
    ) -> Conversation:
        """Get existing or create new conversation between two users"""
        # Check for existing conversation
        existing = self.db.query(Conversation).filter(
            or_(
                and_(
                    Conversation.client_id == user1_id,
                    Conversation.freelancer_id == user2_id
                ),
                and_(
                    Conversation.client_id == user2_id,
                    Conversation.freelancer_id == user1_id
                )
            )
        ).first()
        
        if existing:
            return existing
        
        # Create new conversation
        conversation = Conversation(
            client_id=user1_id,  # First user as client
            freelancer_id=user2_id,  # Second user as freelancer
            project_id=project_id,
            created_at=datetime.utcnow(),
            last_message_at=datetime.utcnow()
        )
        self.db.add(conversation)
        self.db.commit()
        self.db.refresh(conversation)
        
        return conversation
    
    async def get_user_conversations(
        self,
        user_id: int,
        limit: int = 50,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Get all conversations for a user with metadata"""
        conversations = self.db.query(Conversation).filter(
            or_(
                Conversation.client_id == user_id,
                Conversation.freelancer_id == user_id
            )
        ).order_by(
            desc(Conversation.last_message_at)
        ).offset(offset).limit(limit).all()
        
        result = []
        for conv in conversations:
            other_id = conv.freelancer_id if conv.client_id == user_id else conv.client_id
            other_user = self.db.query(User).filter(User.id == other_id).first()
            
            # Get unread count
            unread = self.db.query(func.count(Message.id)).filter(
                Message.conversation_id == conv.id,
                Message.sender_id != user_id,
                Message.is_read == False
            ).scalar()
            
            # Get last message preview
            last_msg = self.db.query(Message).filter(
                Message.conversation_id == conv.id
            ).order_by(desc(Message.sent_at)).first()
            
            result.append({
                'id': conv.id,
                'other_user': {
                    'id': other_user.id if other_user else None,
                    'name': f"{other_user.first_name} {other_user.last_name}" if other_user else "Unknown",
                    'avatar_url': other_user.avatar_url if other_user else None,
                    'presence': await self.get_user_presence(other_id)
                },
                'unread_count': unread,
                'last_message': {
                    'content': last_msg.content[:50] + '...' if last_msg and len(last_msg.content) > 50 else (last_msg.content if last_msg else None),
                    'timestamp': last_msg.sent_at.isoformat() if last_msg else None,
                    'is_mine': last_msg.sender_id == user_id if last_msg else None
                } if last_msg else None,
                'project_id': conv.project_id,
                'created_at': conv.created_at.isoformat()
            })
        
        return result
    
    # =========================================================================
    # MESSAGES
    # =========================================================================
    
    async def send_message(
        self,
        conversation_id: int,
        sender_id: int,
        content: str,
        message_type: str = "text",
        attachments: List[Dict] = None,
        reply_to_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """Send a message with real-time delivery"""
        import json
        
        # Verify conversation exists
        conv = self.db.query(Conversation).filter(Conversation.id == conversation_id).first()
        if not conv:
            raise ValueError("Conversation not found")
        
        # Determine recipient
        recipient_id = conv.freelancer_id if conv.client_id == sender_id else conv.client_id
        
        # Create message
        message = Message(
            conversation_id=conversation_id,
            sender_id=sender_id,
            receiver_id=recipient_id,
            content=content,
            message_type=message_type,
            attachments=json.dumps(attachments) if attachments else None,
            parent_message_id=reply_to_id,
            is_read=False,
            sent_at=datetime.utcnow(),
            created_at=datetime.utcnow()
        )
        self.db.add(message)
        
        # Update conversation last_message_at
        conv.last_message_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(message)
        
        # Build message payload
        sender = self.db.query(User).filter(User.id == sender_id).first()
        msg_payload = {
            'id': message.id,
            'conversation_id': conversation_id,
            'sender': {
                'id': sender.id,
                'name': f"{sender.first_name} {sender.last_name}",
                'avatar_url': sender.avatar_url
            },
            'content': content,
            'message_type': message_type,
            'attachments': attachments or [],
            'reply_to_id': reply_to_id,
            'status': 'sent',
            'sent_at': message.sent_at.isoformat(),
            'reactions': []
        }
        
        # Send via WebSocket
        await websocket_manager.broadcast_to_chat(
            str(conversation_id),
            'new_message',
            msg_payload
        )
        
        # If recipient is online, mark as delivered
        if websocket_manager.is_user_online(str(recipient_id)):
            # Notify delivery
            await websocket_manager.broadcast_to_chat(
                str(conversation_id),
                'message_delivered',
                {'message_id': message.id, 'delivered_at': datetime.utcnow().isoformat()}
            )
        
        return msg_payload
    
    async def get_conversation_messages(
        self,
        conversation_id: int,
        user_id: int,
        limit: int = 50,
        before_id: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """Get messages for a conversation with pagination"""
        import json
        
        query = self.db.query(Message).filter(
            Message.conversation_id == conversation_id
        )
        
        if before_id:
            query = query.filter(Message.id < before_id)
        
        messages = query.order_by(desc(Message.sent_at)).limit(limit).all()
        
        # Mark unread messages as read
        unread_ids = [m.id for m in messages if m.receiver_id == user_id and not m.is_read]
        if unread_ids:
            await self.mark_messages_read(unread_ids, conversation_id)
        
        result = []
        for msg in reversed(messages):  # Chronological order
            sender = self.db.query(User).filter(User.id == msg.sender_id).first()
            
            # Parse attachments
            try:
                attachments = json.loads(msg.attachments) if msg.attachments else []
            except:
                attachments = []
            
            result.append({
                'id': msg.id,
                'sender': {
                    'id': sender.id if sender else None,
                    'name': f"{sender.first_name} {sender.last_name}" if sender else "Unknown",
                    'avatar_url': sender.avatar_url if sender else None
                },
                'content': msg.content,
                'message_type': msg.message_type,
                'attachments': attachments,
                'reply_to_id': msg.parent_message_id,
                'is_read': msg.is_read,
                'sent_at': msg.sent_at.isoformat(),
                'read_at': msg.read_at.isoformat() if msg.read_at else None,
                'is_mine': msg.sender_id == user_id
            })
        
        return result
    
    async def mark_messages_read(
        self,
        message_ids: List[int],
        conversation_id: int
    ) -> None:
        """Mark messages as read and notify sender"""
        now = datetime.utcnow()
        
        self.db.query(Message).filter(
            Message.id.in_(message_ids)
        ).update({
            'is_read': True,
            'read_at': now
        }, synchronize_session='fetch')
        self.db.commit()
        
        # Notify via WebSocket
        await websocket_manager.broadcast_to_chat(
            str(conversation_id),
            'messages_read',
            {
                'message_ids': message_ids,
                'read_at': now.isoformat()
            }
        )
    
    # =========================================================================
    # REACTIONS
    # =========================================================================
    
    async def add_reaction(
        self,
        message_id: int,
        user_id: int,
        emoji: str
    ) -> Dict[str, Any]:
        """Add emoji reaction to message"""
        message = self.db.query(Message).filter(Message.id == message_id).first()
        if not message:
            raise ValueError("Message not found")
        
        reactions = message.reactions or []
        
        # Check if user already reacted with this emoji
        existing = next(
            (r for r in reactions if r['user_id'] == user_id and r['emoji'] == emoji),
            None
        )
        
        if existing:
            # Remove reaction (toggle)
            reactions = [r for r in reactions if not (r['user_id'] == user_id and r['emoji'] == emoji)]
        else:
            # Add reaction
            reactions.append({
                'user_id': user_id,
                'emoji': emoji,
                'created_at': datetime.utcnow().isoformat()
            })
        
        message.reactions = reactions
        self.db.commit()
        
        # Broadcast reaction update
        await websocket_manager.broadcast_to_chat(
            str(message.conversation_id),
            'reaction_update',
            {
                'message_id': message_id,
                'reactions': reactions
            }
        )
        
        return {'message_id': message_id, 'reactions': reactions}
    
    # =========================================================================
    # TYPING INDICATORS
    # =========================================================================
    
    async def set_typing(
        self,
        conversation_id: int,
        user_id: int,
        is_typing: bool
    ) -> None:
        """Set typing status with debouncing"""
        chat_key = str(conversation_id)
        
        if chat_key not in self._typing_users:
            self._typing_users[chat_key] = {}
        
        if is_typing:
            self._typing_users[chat_key][user_id] = datetime.utcnow()
        else:
            self._typing_users[chat_key].pop(user_id, None)
        
        # Get user info
        user = self.db.query(User).filter(User.id == user_id).first()
        
        # Broadcast
        await websocket_manager.broadcast_to_chat(
            chat_key,
            'typing_indicator',
            {
                'user_id': user_id,
                'user_name': f"{user.first_name}" if user else "Someone",
                'is_typing': is_typing
            }
        )
    
    def get_typing_users(self, conversation_id: int) -> List[int]:
        """Get users currently typing (with 10s timeout)"""
        chat_key = str(conversation_id)
        if chat_key not in self._typing_users:
            return []
        
        now = datetime.utcnow()
        timeout = timedelta(seconds=10)
        
        # Clean up stale entries
        active = {
            uid: ts for uid, ts in self._typing_users[chat_key].items()
            if now - ts < timeout
        }
        self._typing_users[chat_key] = active
        
        return list(active.keys())
    
    # =========================================================================
    # PRESENCE
    # =========================================================================
    
    async def update_presence(
        self,
        user_id: int,
        status: PresenceStatus
    ) -> None:
        """Update user presence status"""
        self._presence_cache[user_id] = (status, datetime.utcnow())
        
        # Broadcast presence update
        await websocket_manager.broadcast_user_status(
            str(user_id),
            status.value
        )
    
    async def get_user_presence(self, user_id: int) -> str:
        """Get user presence status"""
        # Check WebSocket connection
        if websocket_manager.is_user_online(str(user_id)):
            cached = self._presence_cache.get(user_id)
            if cached:
                status, last_update = cached
                # Auto-away after 5 minutes of no activity
                if datetime.utcnow() - last_update > timedelta(minutes=5):
                    return PresenceStatus.AWAY.value
                return status.value
            return PresenceStatus.ONLINE.value
        
        return PresenceStatus.OFFLINE.value
    
    async def heartbeat(self, user_id: int) -> None:
        """Update user activity timestamp (call periodically)"""
        self._presence_cache[user_id] = (PresenceStatus.ONLINE, datetime.utcnow())
    
    # =========================================================================
    # SEARCH
    # =========================================================================
    
    async def search_messages(
        self,
        user_id: int,
        query: str,
        conversation_id: Optional[int] = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Search messages across conversations"""
        base_query = self.db.query(Message).join(Conversation).filter(
            or_(
                Conversation.participant1_id == user_id,
                Conversation.participant2_id == user_id
            ),
            Message.content.ilike(f"%{query}%")
        )
        
        if conversation_id:
            base_query = base_query.filter(Message.conversation_id == conversation_id)
        
        messages = base_query.order_by(desc(Message.created_at)).limit(limit).all()
        
        results = []
        for msg in messages:
            sender = self.db.query(User).filter(User.id == msg.sender_id).first()
            results.append({
                'id': msg.id,
                'conversation_id': msg.conversation_id,
                'content': msg.content,
                'highlight': self._highlight_match(msg.content, query),
                'sender_name': f"{sender.first_name} {sender.last_name}" if sender else "Unknown",
                'created_at': msg.created_at.isoformat()
            })
        
        return results
    
    def _highlight_match(self, content: str, query: str) -> str:
        """Highlight search matches in content"""
        import re
        pattern = re.compile(re.escape(query), re.IGNORECASE)
        return pattern.sub(lambda m: f"**{m.group()}**", content)
    
    # =========================================================================
    # EXPORT
    # =========================================================================
    
    async def export_conversation(
        self,
        conversation_id: int,
        user_id: int,
        format: str = "json"
    ) -> Dict[str, Any]:
        """Export conversation for download"""
        import json as json_module
        
        conv = self.db.query(Conversation).filter(Conversation.id == conversation_id).first()
        if not conv:
            raise ValueError("Conversation not found")
        
        # Verify user is participant
        if user_id not in [conv.client_id, conv.freelancer_id]:
            raise ValueError("Not authorized")
        
        messages = self.db.query(Message).filter(
            Message.conversation_id == conversation_id
        ).order_by(Message.sent_at).all()
        
        # Get participant names
        p1 = self.db.query(User).filter(User.id == conv.client_id).first()
        p2 = self.db.query(User).filter(User.id == conv.freelancer_id).first()
        
        export_data = {
            'conversation_id': conversation_id,
            'participants': [
                {'id': p1.id, 'name': f"{p1.first_name} {p1.last_name}"} if p1 else None,
                {'id': p2.id, 'name': f"{p2.first_name} {p2.last_name}"} if p2 else None
            ],
            'export_date': datetime.utcnow().isoformat(),
            'message_count': len(messages),
            'messages': [
                {
                    'sender_id': m.sender_id,
                    'content': m.content,
                    'timestamp': m.sent_at.isoformat(),
                    'attachments': json_module.loads(m.attachments) if m.attachments else []
                }
                for m in messages
            ]
        }
        
        return export_data


# Factory function
def get_chat_service(db: Session) -> RealtimeChatService:
    """Get chat service instance"""
    return RealtimeChatService(db)
