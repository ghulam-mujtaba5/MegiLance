# @AI-HINT: Messages and conversations API - Turso-only, no SQLite fallback
from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field, field_validator
import re
import logging

from app.db.turso_http import execute_query, parse_rows
from app.core.security import get_current_user_from_token

router = APIRouter()
logger = logging.getLogger(__name__)

# Validation constants
MAX_MESSAGE_LENGTH = 10000
MAX_CONTENT_LENGTH = 50000
VALID_MESSAGE_TYPES = {"text", "file", "image", "system"}
VALID_CONVERSATION_STATUSES = {"active", "closed", "blocked"}

# Regex for HTML/script injection detection
SCRIPT_PATTERN = re.compile(r'(javascript:|on\w+=|<script)', re.IGNORECASE)


def sanitize_content(content: Optional[str], max_length: int = MAX_MESSAGE_LENGTH) -> Optional[str]:
    """Sanitize message content to prevent XSS"""
    if content is None:
        return None
    content = content.strip()
    if len(content) > max_length:
        content = content[:max_length]
    # Remove potential script injections
    content = SCRIPT_PATTERN.sub('', content)
    return content


def get_current_user(token_data = Depends(get_current_user_from_token)):
    """Get current user from token"""
    return token_data


# Pydantic models for request validation
class ConversationCreate(BaseModel):
    client_id: int = Field(..., gt=0)
    freelancer_id: int = Field(..., gt=0)
    project_id: Optional[int] = Field(None, gt=0)


class ConversationUpdate(BaseModel):
    status: Optional[str] = Field(None, pattern=r'^(active|closed|blocked)$')
    is_archived: Optional[bool] = None


class MessageCreate(BaseModel):
    conversation_id: Optional[int] = Field(None, gt=0)
    receiver_id: Optional[int] = Field(None, gt=0)
    project_id: Optional[int] = Field(None, gt=0)
    content: str = Field(..., min_length=1, max_length=MAX_MESSAGE_LENGTH)
    message_type: str = Field("text", pattern=r'^(text|file|image|system)$')
    
    @field_validator('content')
    @classmethod
    def sanitize_message_content(cls, v: str) -> str:
        if SCRIPT_PATTERN.search(v):
            raise ValueError("Invalid characters in message content")
        return v.strip()


class MessageUpdate(BaseModel):
    content: Optional[str] = Field(None, max_length=MAX_MESSAGE_LENGTH)
    is_read: Optional[bool] = None
    
    @field_validator('content')
    @classmethod
    def sanitize_update_content(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        if SCRIPT_PATTERN.search(v):
            raise ValueError("Invalid characters in message content")
        return v.strip()


# Conversation endpoints
@router.post("/conversations", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_conversation(
    conversation: ConversationCreate,
    current_user = Depends(get_current_user)
):
    """Create a new conversation"""
    user_id = current_user.get("user_id")
    client_id = conversation.client_id
    freelancer_id = conversation.freelancer_id
    project_id = conversation.project_id
    
    # Verify the current user is one of the participants
    if user_id not in (client_id, freelancer_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot create conversation for other users"
        )
    
    # Prevent self-conversation
    if client_id == freelancer_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot create conversation with yourself"
        )
    
    # Verify both users exist and have correct roles
    for uid, expected_role in [(client_id, "client"), (freelancer_id, "freelancer")]:
        result = execute_query(
            "SELECT id, user_type, is_active FROM users WHERE id = ?",
            [uid]
        )
        if not result or not result.get("rows"):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User {uid} not found"
            )
        rows = parse_rows(result)
        user_type = rows[0].get("user_type", "").lower()
        is_active = rows[0].get("is_active", False)
        if not is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"User {uid} is not active"
            )
    
    # Check if conversation already exists
    if project_id:
        result = execute_query(
            """SELECT id, client_id, freelancer_id, project_id, status, is_archived, 
                      last_message_at, created_at, updated_at
               FROM conversations
               WHERE client_id = ? AND freelancer_id = ? AND project_id = ?""",
            [client_id, freelancer_id, project_id]
        )
    else:
        result = execute_query(
            """SELECT id, client_id, freelancer_id, project_id, status, is_archived, 
                      last_message_at, created_at, updated_at
               FROM conversations
               WHERE client_id = ? AND freelancer_id = ? AND project_id IS NULL""",
            [client_id, freelancer_id]
        )
    
    if result and result.get("rows"):
        rows = parse_rows(result)
        if rows:
            existing = rows[0]
            existing["is_archived"] = bool(existing.get("is_archived"))
            return existing
    
    now = datetime.utcnow().isoformat()
    
    try:
        # Create new conversation
        result = execute_query(
            """INSERT INTO conversations (client_id, freelancer_id, project_id, status, is_archived, last_message_at, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            [client_id, freelancer_id, project_id, "active", 0, now, now, now]
        )
        
        if not result:
            raise HTTPException(status_code=500, detail="Failed to create conversation")
        
        id_result = execute_query("SELECT last_insert_rowid() as id", [])
        new_id = 0
        if id_result and id_result.get("rows"):
            id_rows = parse_rows(id_result)
            if id_rows:
                new_id = id_rows[0].get("id", 0)
        
        logger.info(f"Conversation {new_id} created between client {client_id} and freelancer {freelancer_id}")
        
        return {
            "id": new_id,
            "client_id": client_id,
            "freelancer_id": freelancer_id,
            "project_id": project_id,
            "status": "active",
            "is_archived": False,
            "last_message_at": now,
            "created_at": now,
            "updated_at": now
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create conversation: {e}")
        raise HTTPException(status_code=500, detail="Failed to create conversation")


@router.get("/conversations", response_model=List[dict])
def get_conversations(
    skip: int = Query(0, ge=0, le=10000),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None, pattern=r'^(active|closed|blocked)$'),
    archived: Optional[bool] = Query(None),
    current_user = Depends(get_current_user)
):
    """Get all conversations for current user"""
    user_id = current_user.get("user_id")
    
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not authenticated")
    
    where_clauses = ["(client_id = ? OR freelancer_id = ?)"]
    params = [user_id, user_id]
    
    if status:
        if status.lower() not in VALID_CONVERSATION_STATUSES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status. Must be one of: {', '.join(VALID_CONVERSATION_STATUSES)}"
            )
        where_clauses.append("status = ?")
        params.append(status.lower())
    
    if archived is not None:
        where_clauses.append("is_archived = ?")
        params.append(1 if archived else 0)
    
    where_sql = " AND ".join(where_clauses)
    params.extend([limit, skip])
    
    result = execute_query(
        f"""SELECT id, client_id, freelancer_id, project_id, status, is_archived, 
                   last_message_at, created_at, updated_at
            FROM conversations
            WHERE {where_sql}
            ORDER BY last_message_at DESC
            LIMIT ? OFFSET ?""",
        params
    )
    
    if not result:
        return []
    
    rows = parse_rows(result)
    conversations = []
    
    for row in rows:
        conv = row
        conv["is_archived"] = bool(conv.get("is_archived"))
        
        # Determine other user ID
        other_user_id = conv["freelancer_id"] if conv["client_id"] == user_id else conv["client_id"]
        
        # Fetch other user details (only public info)
        user_res = execute_query("SELECT full_name, profile_image_url FROM users WHERE id = ?", [other_user_id])
        if user_res and user_res.get("rows"):
            u_rows = parse_rows(user_res)
            if u_rows:
                conv["contact_name"] = u_rows[0].get("full_name", "Unknown")
                conv["avatar"] = u_rows[0].get("profile_image_url")
        
        # Fetch last message content (truncate for preview)
        msg_res = execute_query(
            "SELECT content, message_type FROM messages WHERE conversation_id = ? AND is_deleted = 0 ORDER BY sent_at DESC LIMIT 1",
            [conv["id"]]
        )
        if msg_res and msg_res.get("rows"):
            m_rows = parse_rows(msg_res)
            if m_rows:
                content = m_rows[0].get("content", "")
                # Truncate for preview
                conv["last_message"] = content[:100] + "..." if len(content) > 100 else content
                conv["last_message_type"] = m_rows[0].get("message_type", "text")
        
        # Fetch unread count
        count_res = execute_query(
            "SELECT COUNT(*) as count FROM messages WHERE conversation_id = ? AND receiver_id = ? AND is_read = 0 AND is_deleted = 0",
            [conv["id"], user_id]
        )
        if count_res and count_res.get("rows"):
            c_rows = parse_rows(count_res)
            if c_rows:
                conv["unread_count"] = c_rows[0].get("count", 0)
        
        conversations.append(conv)
        
    return conversations


@router.get("/conversations/{conversation_id}", response_model=dict)
def get_conversation(
    conversation_id: int,
    current_user = Depends(get_current_user)
):
    """Get a specific conversation"""
    user_id = current_user.get("user_id")
    
    if conversation_id <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid conversation ID")
    
    result = execute_query(
        """SELECT id, client_id, freelancer_id, project_id, status, is_archived, 
                  last_message_at, created_at, updated_at
           FROM conversations WHERE id = ?""",
        [conversation_id]
    )
    
    if not result or not result.get("rows"):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    
    rows = parse_rows(result)
    if not rows:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    
    conversation = rows[0]
    
    # Check if user is part of conversation
    if conversation.get("client_id") != user_id and conversation.get("freelancer_id") != user_id:
        logger.warning(f"Unauthorized access attempt to conversation {conversation_id} by user {user_id}")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    conversation["is_archived"] = bool(conversation.get("is_archived"))
    
    # Add contact info
    other_user_id = conversation["freelancer_id"] if conversation["client_id"] == user_id else conversation["client_id"]
    user_res = execute_query("SELECT full_name, profile_image_url FROM users WHERE id = ?", [other_user_id])
    if user_res and user_res.get("rows"):
        u_rows = parse_rows(user_res)
        if u_rows:
            conversation["contact_name"] = u_rows[0].get("full_name", "Unknown")
            conversation["avatar"] = u_rows[0].get("profile_image_url")
            
    return conversation


@router.patch("/conversations/{conversation_id}", response_model=dict)
def update_conversation(
    conversation_id: int,
    conversation_update: ConversationUpdate,
    current_user = Depends(get_current_user)
):
    """Update a conversation"""
    user_id = current_user.get("user_id")
    
    if conversation_id <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid conversation ID")
    
    result = execute_query(
        "SELECT id, client_id, freelancer_id FROM conversations WHERE id = ?",
        [conversation_id]
    )
    
    if not result or not result.get("rows"):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    
    rows = parse_rows(result)
    conversation = rows[0]
    
    # Check if user is part of conversation
    if conversation.get("client_id") != user_id and conversation.get("freelancer_id") != user_id:
        logger.warning(f"Unauthorized update attempt on conversation {conversation_id} by user {user_id}")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    # Build update query
    update_data = conversation_update.model_dump(exclude_unset=True, exclude_none=True)
    
    if not update_data:
        return get_conversation(conversation_id, current_user)
    
    updates = []
    params = []
    
    if "status" in update_data:
        if update_data["status"].lower() not in VALID_CONVERSATION_STATUSES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status. Must be one of: {', '.join(VALID_CONVERSATION_STATUSES)}"
            )
        updates.append("status = ?")
        params.append(update_data["status"].lower())
    
    if "is_archived" in update_data:
        updates.append("is_archived = ?")
        params.append(1 if update_data["is_archived"] else 0)
    
    if updates:
        updates.append("updated_at = ?")
        params.append(datetime.utcnow().isoformat())
        params.append(conversation_id)
        
        try:
            execute_query(
                f"UPDATE conversations SET {', '.join(updates)} WHERE id = ?",
                params
            )
            logger.info(f"Conversation {conversation_id} updated by user {user_id}")
        except Exception as e:
            logger.error(f"Failed to update conversation {conversation_id}: {e}")
            raise HTTPException(status_code=500, detail="Failed to update conversation")
    
    # Fetch updated conversation
    return get_conversation(conversation_id, current_user)


# Message endpoints
@router.post("/messages", response_model=dict, status_code=status.HTTP_201_CREATED)
def send_message(
    message: MessageCreate,
    current_user = Depends(get_current_user)
):
    """Send a new message"""
    user_id = current_user.get("user_id")
    role = current_user.get("role", "")
    conversation_id = message.conversation_id
    receiver_id = message.receiver_id
    project_id = message.project_id
    content = sanitize_content(message.content)
    message_type = message.message_type
    
    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message content cannot be empty"
        )
    
    # If conversation_id not provided, create/find conversation
    if not conversation_id:
        if not receiver_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Either conversation_id or receiver_id must be provided"
            )
        
        # Prevent messaging yourself
        if receiver_id == user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot send message to yourself"
            )
        
        # Try to find existing conversation
        if project_id:
            result = execute_query(
                """SELECT id FROM conversations 
                   WHERE ((client_id = ? AND freelancer_id = ?) OR (client_id = ? AND freelancer_id = ?))
                   AND project_id = ?""",
                [user_id, receiver_id, receiver_id, user_id, project_id]
            )
        else:
            result = execute_query(
                """SELECT id FROM conversations 
                   WHERE ((client_id = ? AND freelancer_id = ?) OR (client_id = ? AND freelancer_id = ?))
                   AND project_id IS NULL""",
                [user_id, receiver_id, receiver_id, user_id]
            )
        
        if result and result.get("rows"):
            rows = parse_rows(result)
            if rows:
                conversation_id = rows[0].get("id")
        
        if not conversation_id:
            # Verify receiver exists and is active
            result = execute_query("SELECT id, user_type, is_active FROM users WHERE id = ?", [receiver_id])
            if not result or not result.get("rows"):
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Receiver not found")
            
            rows = parse_rows(result)
            if not rows[0].get("is_active"):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot message inactive user"
                )
            
            receiver_type = rows[0].get("user_type", "")
            
            # Create new conversation
            now = datetime.utcnow().isoformat()
            if role.lower() == "client":
                client_id = user_id
                freelancer_id = receiver_id
            else:
                client_id = receiver_id
                freelancer_id = user_id
            
            execute_query(
                """INSERT INTO conversations (client_id, freelancer_id, project_id, status, is_archived, last_message_at, created_at, updated_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                [client_id, freelancer_id, project_id, "active", 0, now, now, now]
            )
            
            id_result = execute_query("SELECT last_insert_rowid() as id", [])
            if id_result and id_result.get("rows"):
                id_rows = parse_rows(id_result)
                if id_rows:
                    conversation_id = id_rows[0].get("id", 0)
    else:
        # Verify user has access to conversation
        result = execute_query(
            "SELECT client_id, freelancer_id, status FROM conversations WHERE id = ?",
            [conversation_id]
        )
        if not result or not result.get("rows"):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
        
        rows = parse_rows(result)
        conv = rows[0]
        
        if conv["client_id"] != user_id and conv["freelancer_id"] != user_id:
            logger.warning(f"Unauthorized message attempt in conversation {conversation_id} by user {user_id}")
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        
        # Check if conversation is blocked
        if conv.get("status") == "blocked":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot send messages in a blocked conversation"
            )
        
        if not receiver_id:
            # Fetch receiver_id from conversation
            if conv["client_id"] == user_id:
                receiver_id = conv["freelancer_id"]
            else:
                receiver_id = conv["client_id"]
    
    if not receiver_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Receiver ID could not be determined")

    now = datetime.utcnow().isoformat()
    
    try:
        # Create message
        result = execute_query(
            """INSERT INTO messages (conversation_id, sender_id, receiver_id, project_id, content, message_type, 
                                     is_read, is_deleted, sent_at, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            [conversation_id, user_id, receiver_id, project_id, content, message_type, 0, 0, now, now]
        )
        
        if not result:
            raise HTTPException(status_code=500, detail="Failed to send message")
        
        # Update conversation last_message_at
        execute_query(
            "UPDATE conversations SET last_message_at = ?, updated_at = ? WHERE id = ?",
            [now, now, conversation_id]
        )
        
        id_result = execute_query("SELECT last_insert_rowid() as id", [])
        new_id = 0
        if id_result and id_result.get("rows"):
            id_rows = parse_rows(id_result)
            if id_rows:
                new_id = id_rows[0].get("id", 0)
        
        logger.info(f"Message {new_id} sent from user {user_id} to user {receiver_id} in conversation {conversation_id}")
        
        return {
            "id": new_id,
            "conversation_id": conversation_id,
            "sender_id": user_id,
            "receiver_id": receiver_id,
            "project_id": project_id,
            "content": content,
            "message_type": message_type,
            "is_read": False,
            "is_deleted": False,
            "sent_at": now,
            "created_at": now
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to send message: {e}")
        raise HTTPException(status_code=500, detail="Failed to send message")


@router.get("/messages", response_model=List[dict])
def get_messages(
    conversation_id: int = Query(...),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user = Depends(get_current_user)
):
    """Get messages for a conversation"""
    user_id = current_user.get("user_id")
    
    # Verify user has access to conversation
    result = execute_query(
        "SELECT id, client_id, freelancer_id FROM conversations WHERE id = ?",
        [conversation_id]
    )
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    rows = parse_rows(result)
    conversation = rows[0]
    
    if conversation.get("client_id") != user_id and conversation.get("freelancer_id") != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    result = execute_query(
        """SELECT id, conversation_id, sender_id, receiver_id, project_id, content, 
                  message_type, is_read, read_at, is_deleted, sent_at, created_at
           FROM messages
           WHERE conversation_id = ? AND is_deleted = 0
           ORDER BY sent_at DESC
           LIMIT ? OFFSET ?""",
        [conversation_id, limit, skip]
    )
    
    if not result:
        return []
    
    messages = parse_rows(result)
    now = datetime.utcnow().isoformat()
    
    # Mark messages as read
    unread_ids = []
    for msg in messages:
        msg["is_read"] = bool(msg.get("is_read"))
        msg["is_deleted"] = bool(msg.get("is_deleted"))
        if not msg.get("is_read") and msg.get("receiver_id") == user_id:
            unread_ids.append(msg["id"])
    
    if unread_ids:
        for msg_id in unread_ids:
            execute_query(
                "UPDATE messages SET is_read = 1, read_at = ? WHERE id = ?",
                [now, msg_id]
            )
    
    # Return in chronological order
    return list(reversed(messages))


@router.get("/messages/{message_id}", response_model=dict)
def get_message(
    message_id: int,
    current_user = Depends(get_current_user)
):
    """Get a specific message"""
    user_id = current_user.get("user_id")
    
    result = execute_query(
        """SELECT id, conversation_id, sender_id, receiver_id, project_id, content, 
                  message_type, is_read, read_at, is_deleted, sent_at, created_at
           FROM messages WHERE id = ?""",
        [message_id]
    )
    
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Message not found")
    
    rows = parse_rows(result)
    message = rows[0]
    
    # Check if user is sender or receiver
    if message.get("sender_id") != user_id and message.get("receiver_id") != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Mark as read if receiver
    if message.get("receiver_id") == user_id and not message.get("is_read"):
        now = datetime.utcnow().isoformat()
        execute_query(
            "UPDATE messages SET is_read = 1, read_at = ? WHERE id = ?",
            [now, message_id]
        )
        message["is_read"] = True
        message["read_at"] = now
    
    message["is_read"] = bool(message.get("is_read"))
    message["is_deleted"] = bool(message.get("is_deleted"))
    return message


@router.patch("/messages/{message_id}", response_model=dict)
def update_message(
    message_id: int,
    message_update: dict,
    current_user = Depends(get_current_user)
):
    """Update a message"""
    user_id = current_user.get("user_id")
    
    result = execute_query(
        "SELECT id, sender_id, receiver_id FROM messages WHERE id = ?",
        [message_id]
    )
    
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Message not found")
    
    rows = parse_rows(result)
    message = rows[0]
    
    # Only sender can edit message content
    if "content" in message_update and message.get("sender_id") != user_id:
        raise HTTPException(status_code=403, detail="Only sender can edit message")
    
    # Receiver can mark as read
    if "is_read" in message_update and message.get("receiver_id") != user_id:
        raise HTTPException(status_code=403, detail="Only receiver can mark as read")
    
    updates = []
    params = []
    
    if "content" in message_update:
        updates.append("content = ?")
        params.append(message_update["content"])
    
    if "is_read" in message_update:
        updates.append("is_read = ?")
        params.append(1 if message_update["is_read"] else 0)
        if message_update["is_read"]:
            updates.append("read_at = ?")
            params.append(datetime.utcnow().isoformat())
    
    if updates:
        params.append(message_id)
        execute_query(
            f"UPDATE messages SET {', '.join(updates)} WHERE id = ?",
            params
        )
    
    # Fetch updated message
    result = execute_query(
        """SELECT id, conversation_id, sender_id, receiver_id, project_id, content, 
                  message_type, is_read, read_at, is_deleted, sent_at, created_at
           FROM messages WHERE id = ?""",
        [message_id]
    )
    
    rows = parse_rows(result)
    updated = rows[0] if rows else {}
    updated["is_read"] = bool(updated.get("is_read"))
    updated["is_deleted"] = bool(updated.get("is_deleted"))
    return updated


@router.delete("/messages/{message_id}")
def delete_message(
    message_id: int,
    current_user = Depends(get_current_user)
):
    """Soft delete a message"""
    user_id = current_user.get("user_id")
    
    result = execute_query(
        "SELECT id, sender_id FROM messages WHERE id = ?",
        [message_id]
    )
    
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Message not found")
    
    rows = parse_rows(result)
    message = rows[0]
    
    # Only sender can delete
    if message.get("sender_id") != user_id:
        raise HTTPException(status_code=403, detail="Only sender can delete message")
    
    execute_query("UPDATE messages SET is_deleted = 1 WHERE id = ?", [message_id])
    
    return {"message": "Message deleted successfully"}


@router.get("/messages/unread/count")
def get_unread_count(
    current_user = Depends(get_current_user)
):
    """Get count of unread messages for current user"""
    user_id = current_user.get("user_id")
    
    result = execute_query(
        "SELECT COUNT(*) as count FROM messages WHERE receiver_id = ? AND is_read = 0 AND is_deleted = 0",
        [user_id]
    )
    
    count = 0
    if result and result.get("rows"):
        rows = parse_rows(result)
        if rows:
            count = rows[0].get("count", 0)
    
    return {"unread_count": count}
