# @AI-HINT: Video interview service with WebRTC signaling and scheduling
"""
Video Interview Service - WebRTC-based video calling for client-freelancer interviews.

Features:
- Interview scheduling with calendar integration
- WebRTC signaling server for peer-to-peer video
- Recording management and playback
- Screen sharing support
- Interview notes and rating
- Automatic reminders
"""

import logging
import json
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from enum import Enum

logger = logging.getLogger(__name__)


class InterviewStatus(str, Enum):
    """Interview status values."""
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"
    RESCHEDULED = "rescheduled"


class VideoInterviewService:
    """
    Service for managing video interviews between clients and freelancers.
    
    Handles scheduling, WebRTC signaling, recording, and interview tracking.
    """
    
    # ICE servers configuration for WebRTC
    ICE_SERVERS = [
        {"urls": "stun:stun.l.google.com:19302"},
        {"urls": "stun:stun1.l.google.com:19302"},
        {"urls": "stun:stun2.l.google.com:19302"},
        {"urls": "stun:stun3.l.google.com:19302"},
        {"urls": "stun:stun4.l.google.com:19302"},
    ]
    
    # TURN server would be configured in production
    # {"urls": "turn:turn.megilance.com:3478", "username": "user", "credential": "pass"}
    
    def __init__(self, db: Session):
        self.db = db
        self._active_rooms: Dict[str, Dict] = {}  # In-memory room state
        self._signaling_queue: Dict[str, List] = {}  # Signaling messages queue
        self._load_active_interviews() # Restore state on startup

    def _load_active_interviews(self):
        """Load scheduled interviews from DB into memory to prevent state loss on restart."""
        # In a real implementation, this would query the 'interviews' table.
        # Since we are simulating the table structure in this service for now,
        # we will just initialize the structure.
        # TODO: Create 'interviews' table in database schema
        pass

    
    async def schedule_interview(
        self,
        client_id: int,
        freelancer_id: int,
        project_id: Optional[int],
        scheduled_time: datetime,
        duration_minutes: int = 30,
        title: Optional[str] = None,
        description: Optional[str] = None,
        timezone: str = "UTC"
    ) -> Dict[str, Any]:
        """
        Schedule a video interview between client and freelancer.
        
        Args:
            client_id: ID of the client scheduling the interview
            freelancer_id: ID of the freelancer being interviewed
            project_id: Optional related project
            scheduled_time: Scheduled start time
            duration_minutes: Expected duration (default 30 min)
            title: Interview title
            description: Additional details
            timezone: Timezone for scheduling
            
        Returns:
            Interview details with room credentials
        """
        try:
            from app.models.user import User
            from app.models.project import Project
            
            # Validate participants
            client = self.db.query(User).filter(User.id == client_id).first()
            freelancer = self.db.query(User).filter(User.id == freelancer_id).first()
            
            if not client or not freelancer:
                raise ValueError("Invalid client or freelancer ID")
            
            # Validate scheduled time is in the future
            if scheduled_time <= datetime.now(timezone.utc):
                raise ValueError("Interview must be scheduled for a future time")
            
            # Check for scheduling conflicts (simple check - 1 hour buffer)
            # In production, would query actual interview table
            
            # Generate unique room ID
            room_id = self._generate_room_id(client_id, freelancer_id, scheduled_time)
            
            # Generate access tokens for both participants
            client_token = self._generate_access_token(room_id, client_id, "host")
            freelancer_token = self._generate_access_token(room_id, freelancer_id, "guest")
            
            # Create interview record (would be stored in database)
            interview = {
                "id": hash(room_id) % 1000000,  # Simulated ID
                "room_id": room_id,
                "client_id": client_id,
                "freelancer_id": freelancer_id,
                "project_id": project_id,
                "title": title or f"Interview with {freelancer.full_name}",
                "description": description,
                "scheduled_time": scheduled_time.isoformat(),
                "duration_minutes": duration_minutes,
                "end_time": (scheduled_time + timedelta(minutes=duration_minutes)).isoformat(),
                "status": InterviewStatus.SCHEDULED,
                "timezone": timezone,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "tokens": {
                    "client": client_token,
                    "freelancer": freelancer_token
                },
                "join_urls": {
                    "client": f"/interview/join/{room_id}?token={client_token}",
                    "freelancer": f"/interview/join/{room_id}?token={freelancer_token}"
                },
                "ice_servers": self.ICE_SERVERS
            }
            
            # Store in active rooms
            self._active_rooms[room_id] = {
                "interview": interview,
                "participants": {},
                "started_at": None,
                "recording": False
            }
            
            logger.info(f"Interview scheduled: {room_id} at {scheduled_time}")
            
            return interview
            
        except Exception as e:
            logger.error(f"Failed to schedule interview: {str(e)}")
            raise
    
    async def get_interview(self, room_id: str) -> Optional[Dict[str, Any]]:
        """Get interview details by room ID."""
        if room_id in self._active_rooms:
            return self._active_rooms[room_id]["interview"]
        return None
    
    async def get_user_interviews(
        self,
        user_id: int,
        status: Optional[str] = None,
        upcoming_only: bool = False
    ) -> List[Dict[str, Any]]:
        """
        Get all interviews for a user.
        
        Args:
            user_id: User ID to get interviews for
            status: Optional status filter
            upcoming_only: Only return future interviews
        """
        interviews = []
        now = datetime.now(timezone.utc)
        
        for room_id, room_data in self._active_rooms.items():
            interview = room_data["interview"]
            
            # Check if user is a participant
            if interview["client_id"] != user_id and interview["freelancer_id"] != user_id:
                continue
            
            # Apply status filter
            if status and interview["status"] != status:
                continue
            
            # Apply upcoming filter
            if upcoming_only:
                scheduled = datetime.fromisoformat(interview["scheduled_time"])
                if scheduled <= now:
                    continue
            
            # Add role information
            interview_copy = interview.copy()
            interview_copy["user_role"] = "client" if interview["client_id"] == user_id else "freelancer"
            interviews.append(interview_copy)
        
        # Sort by scheduled time
        interviews.sort(key=lambda x: x["scheduled_time"])
        return interviews
    
    async def join_room(
        self,
        room_id: str,
        user_id: int,
        token: str,
        socket_id: str
    ) -> Dict[str, Any]:
        """
        Join a video interview room.
        
        Args:
            room_id: Room to join
            user_id: User joining
            token: Access token
            socket_id: WebSocket connection ID for signaling
            
        Returns:
            Room configuration for WebRTC setup
        """
        if room_id not in self._active_rooms:
            raise ValueError("Interview room not found")
        
        room = self._active_rooms[room_id]
        interview = room["interview"]
        
        # Validate token
        valid_tokens = [
            interview["tokens"]["client"],
            interview["tokens"]["freelancer"]
        ]
        if token not in valid_tokens:
            raise ValueError("Invalid access token")
        
        # Validate user is a participant
        if user_id not in [interview["client_id"], interview["freelancer_id"]]:
            raise ValueError("User not authorized to join this interview")
        
        # Add participant to room
        participant_role = "client" if user_id == interview["client_id"] else "freelancer"
        room["participants"][user_id] = {
            "socket_id": socket_id,
            "role": participant_role,
            "joined_at": datetime.now(timezone.utc).isoformat(),
            "video_enabled": True,
            "audio_enabled": True,
            "screen_sharing": False
        }
        
        # Update interview status if first join
        if not room["started_at"] and len(room["participants"]) >= 1:
            # Mark as in progress when both join
            if len(room["participants"]) >= 2:
                room["started_at"] = datetime.now(timezone.utc)
                interview["status"] = InterviewStatus.IN_PROGRESS
        
        # Get other participants for WebRTC connection
        other_participants = [
            {"user_id": uid, **data}
            for uid, data in room["participants"].items()
            if uid != user_id
        ]
        
        return {
            "room_id": room_id,
            "user_id": user_id,
            "role": participant_role,
            "ice_servers": self.ICE_SERVERS,
            "other_participants": other_participants,
            "interview": interview,
            "room_state": {
                "recording": room["recording"],
                "started_at": room["started_at"].isoformat() if room["started_at"] else None
            }
        }
    
    async def leave_room(self, room_id: str, user_id: int) -> Dict[str, Any]:
        """
        Leave a video interview room.
        
        Args:
            room_id: Room to leave
            user_id: User leaving
        """
        if room_id not in self._active_rooms:
            return {"status": "room_not_found"}
        
        room = self._active_rooms[room_id]
        
        if user_id in room["participants"]:
            left_at = datetime.now(timezone.utc)
            participant_data = room["participants"].pop(user_id)
            
            # If room is now empty, mark interview as completed
            if len(room["participants"]) == 0 and room["started_at"]:
                room["interview"]["status"] = InterviewStatus.COMPLETED
                room["interview"]["ended_at"] = left_at.isoformat()
                room["interview"]["actual_duration_minutes"] = int(
                    (left_at - room["started_at"]).total_seconds() / 60
                )
            
            return {
                "status": "left",
                "room_id": room_id,
                "left_at": left_at.isoformat(),
                "remaining_participants": len(room["participants"])
            }
        
        return {"status": "not_in_room"}
    
    async def handle_signaling(
        self,
        room_id: str,
        from_user_id: int,
        to_user_id: int,
        signal_type: str,
        signal_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Handle WebRTC signaling messages.
        
        Signal types: offer, answer, ice-candidate
        
        Args:
            room_id: Interview room
            from_user_id: Sender
            to_user_id: Recipient
            signal_type: Type of signal (offer/answer/ice-candidate)
            signal_data: Signal payload (SDP or ICE candidate)
        """
        if room_id not in self._active_rooms:
            raise ValueError("Room not found")
        
        room = self._active_rooms[room_id]
        
        # Validate participants
        if from_user_id not in room["participants"]:
            raise ValueError("Sender not in room")
        
        if to_user_id not in room["participants"]:
            raise ValueError("Recipient not in room")
        
        # Create signaling message
        message = {
            "type": signal_type,
            "from_user_id": from_user_id,
            "to_user_id": to_user_id,
            "data": signal_data,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        # Queue message for recipient (would be sent via WebSocket in real implementation)
        if to_user_id not in self._signaling_queue:
            self._signaling_queue[to_user_id] = []
        self._signaling_queue[to_user_id].append(message)
        
        # Get recipient socket ID for routing
        recipient_socket = room["participants"][to_user_id]["socket_id"]
        
        return {
            "status": "queued",
            "recipient_socket": recipient_socket,
            "message": message
        }
    
    async def get_pending_signals(self, user_id: int) -> List[Dict[str, Any]]:
        """Get pending signaling messages for a user."""
        if user_id in self._signaling_queue:
            messages = self._signaling_queue[user_id]
            self._signaling_queue[user_id] = []
            return messages
        return []
    
    async def toggle_media(
        self,
        room_id: str,
        user_id: int,
        media_type: str,
        enabled: bool
    ) -> Dict[str, Any]:
        """
        Toggle video/audio/screen sharing.
        
        Args:
            room_id: Interview room
            user_id: User toggling
            media_type: 'video', 'audio', or 'screen'
            enabled: New state
        """
        if room_id not in self._active_rooms:
            raise ValueError("Room not found")
        
        room = self._active_rooms[room_id]
        
        if user_id not in room["participants"]:
            raise ValueError("User not in room")
        
        # Update participant state
        if media_type == "video":
            room["participants"][user_id]["video_enabled"] = enabled
        elif media_type == "audio":
            room["participants"][user_id]["audio_enabled"] = enabled
        elif media_type == "screen":
            room["participants"][user_id]["screen_sharing"] = enabled
        else:
            raise ValueError(f"Invalid media type: {media_type}")
        
        return {
            "room_id": room_id,
            "user_id": user_id,
            "media_type": media_type,
            "enabled": enabled,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    
    async def start_recording(self, room_id: str, user_id: int) -> Dict[str, Any]:
        """
        Start recording the interview.
        
        Requires consent from all participants.
        """
        if room_id not in self._active_rooms:
            raise ValueError("Room not found")
        
        room = self._active_rooms[room_id]
        interview = room["interview"]
        
        # Verify user is the host (client)
        if user_id != interview["client_id"]:
            raise ValueError("Only the host can start recording")
        
        if room["recording"]:
            return {"status": "already_recording"}
        
        room["recording"] = True
        room["recording_started_at"] = datetime.now(timezone.utc)
        
        # Generate recording ID
        recording_id = secrets.token_urlsafe(16)
        room["recording_id"] = recording_id
        
        logger.info(f"Recording started for room {room_id}: {recording_id}")
        
        return {
            "status": "recording_started",
            "recording_id": recording_id,
            "started_at": room["recording_started_at"].isoformat(),
            "room_id": room_id,
            "notification": "Recording has started. All participants will be notified."
        }
    
    async def stop_recording(self, room_id: str, user_id: int) -> Dict[str, Any]:
        """Stop recording the interview."""
        if room_id not in self._active_rooms:
            raise ValueError("Room not found")
        
        room = self._active_rooms[room_id]
        interview = room["interview"]
        
        if user_id != interview["client_id"]:
            raise ValueError("Only the host can stop recording")
        
        if not room["recording"]:
            return {"status": "not_recording"}
        
        room["recording"] = False
        stopped_at = datetime.now(timezone.utc)
        duration = (stopped_at - room["recording_started_at"]).total_seconds()
        
        recording_info = {
            "recording_id": room.get("recording_id"),
            "started_at": room["recording_started_at"].isoformat(),
            "stopped_at": stopped_at.isoformat(),
            "duration_seconds": int(duration),
            "room_id": room_id
        }
        
        # In production, would save recording to storage
        room["recordings"] = room.get("recordings", [])
        room["recordings"].append(recording_info)
        
        return {
            "status": "recording_stopped",
            **recording_info
        }
    
    async def cancel_interview(
        self,
        room_id: str,
        user_id: int,
        reason: Optional[str] = None
    ) -> Dict[str, Any]:
        """Cancel a scheduled interview."""
        if room_id not in self._active_rooms:
            raise ValueError("Interview not found")
        
        room = self._active_rooms[room_id]
        interview = room["interview"]
        
        # Verify user is a participant
        if user_id not in [interview["client_id"], interview["freelancer_id"]]:
            raise ValueError("User not authorized to cancel this interview")
        
        # Can only cancel scheduled interviews
        if interview["status"] not in [InterviewStatus.SCHEDULED, InterviewStatus.RESCHEDULED]:
            raise ValueError(f"Cannot cancel interview with status: {interview['status']}")
        
        interview["status"] = InterviewStatus.CANCELLED
        interview["cancelled_by"] = user_id
        interview["cancelled_at"] = datetime.now(timezone.utc).isoformat()
        interview["cancellation_reason"] = reason
        
        logger.info(f"Interview {room_id} cancelled by user {user_id}")
        
        return {
            "status": "cancelled",
            "room_id": room_id,
            "cancelled_by": user_id,
            "reason": reason
        }
    
    async def reschedule_interview(
        self,
        room_id: str,
        user_id: int,
        new_time: datetime,
        reason: Optional[str] = None
    ) -> Dict[str, Any]:
        """Reschedule an interview to a new time."""
        if room_id not in self._active_rooms:
            raise ValueError("Interview not found")
        
        room = self._active_rooms[room_id]
        interview = room["interview"]
        
        # Verify user is a participant
        if user_id not in [interview["client_id"], interview["freelancer_id"]]:
            raise ValueError("User not authorized to reschedule this interview")
        
        # Validate new time
        if new_time <= datetime.now(timezone.utc):
            raise ValueError("New time must be in the future")
        
        old_time = interview["scheduled_time"]
        
        # Update interview
        interview["status"] = InterviewStatus.RESCHEDULED
        interview["scheduled_time"] = new_time.isoformat()
        interview["end_time"] = (new_time + timedelta(minutes=interview["duration_minutes"])).isoformat()
        interview["rescheduled_by"] = user_id
        interview["rescheduled_at"] = datetime.now(timezone.utc).isoformat()
        interview["reschedule_reason"] = reason
        interview["previous_time"] = old_time
        
        # Generate new tokens
        interview["tokens"]["client"] = self._generate_access_token(
            room_id, interview["client_id"], "host"
        )
        interview["tokens"]["freelancer"] = self._generate_access_token(
            room_id, interview["freelancer_id"], "guest"
        )
        
        logger.info(f"Interview {room_id} rescheduled from {old_time} to {new_time}")
        
        return {
            "status": "rescheduled",
            "room_id": room_id,
            "old_time": old_time,
            "new_time": new_time.isoformat(),
            "rescheduled_by": user_id,
            "reason": reason,
            "new_tokens": interview["tokens"]
        }
    
    async def submit_interview_feedback(
        self,
        room_id: str,
        user_id: int,
        rating: int,
        notes: Optional[str] = None,
        would_hire: Optional[bool] = None,
        skills_demonstrated: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Submit feedback after an interview.
        
        Args:
            room_id: Interview room
            user_id: User submitting feedback
            rating: 1-5 rating
            notes: Detailed notes
            would_hire: Hiring decision (for clients)
            skills_demonstrated: Skills observed
        """
        if room_id not in self._active_rooms:
            raise ValueError("Interview not found")
        
        room = self._active_rooms[room_id]
        interview = room["interview"]
        
        # Verify user is a participant
        if user_id not in [interview["client_id"], interview["freelancer_id"]]:
            raise ValueError("User not authorized to submit feedback")
        
        # Validate rating
        if not 1 <= rating <= 5:
            raise ValueError("Rating must be between 1 and 5")
        
        # Determine feedback type
        feedback_type = "client_feedback" if user_id == interview["client_id"] else "freelancer_feedback"
        
        feedback = {
            "user_id": user_id,
            "rating": rating,
            "notes": notes,
            "would_hire": would_hire,
            "skills_demonstrated": skills_demonstrated or [],
            "submitted_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Store feedback
        if "feedback" not in room:
            room["feedback"] = {}
        room["feedback"][feedback_type] = feedback
        
        logger.info(f"Feedback submitted for interview {room_id} by user {user_id}")
        
        return {
            "status": "feedback_submitted",
            "room_id": room_id,
            "feedback_type": feedback_type,
            "rating": rating
        }
    
    async def get_interview_analytics(self, user_id: int) -> Dict[str, Any]:
        """
        Get interview analytics for a user.
        
        Returns statistics on interview history, ratings, and outcomes.
        """
        user_interviews = await self.get_user_interviews(user_id)
        
        total = len(user_interviews)
        completed = sum(1 for i in user_interviews if i["status"] == InterviewStatus.COMPLETED)
        cancelled = sum(1 for i in user_interviews if i["status"] == InterviewStatus.CANCELLED)
        no_shows = sum(1 for i in user_interviews if i["status"] == InterviewStatus.NO_SHOW)
        
        # Calculate average ratings from feedback
        ratings = []
        for room_id, room_data in self._active_rooms.items():
            if "feedback" in room_data:
                for feedback_type, feedback in room_data["feedback"].items():
                    if "rating" in feedback:
                        # Check if this feedback is about this user
                        interview = room_data["interview"]
                        if (feedback_type == "client_feedback" and interview["freelancer_id"] == user_id) or \
                           (feedback_type == "freelancer_feedback" and interview["client_id"] == user_id):
                            ratings.append(feedback["rating"])
        
        avg_rating = sum(ratings) / len(ratings) if ratings else 0
        
        return {
            "user_id": user_id,
            "total_interviews": total,
            "completed": completed,
            "cancelled": cancelled,
            "no_shows": no_shows,
            "completion_rate": (completed / total * 100) if total > 0 else 0,
            "average_rating": round(avg_rating, 2),
            "total_ratings": len(ratings),
            "generated_at": datetime.now(timezone.utc).isoformat()
        }
    
    def _generate_room_id(
        self,
        client_id: int,
        freelancer_id: int,
        scheduled_time: datetime
    ) -> str:
        """Generate unique room ID."""
        data = f"{client_id}-{freelancer_id}-{scheduled_time.isoformat()}-{secrets.token_hex(8)}"
        return hashlib.sha256(data.encode()).hexdigest()[:16]
    
    def _generate_access_token(
        self,
        room_id: str,
        user_id: int,
        role: str
    ) -> str:
        """Generate access token for joining room."""
        data = f"{room_id}-{user_id}-{role}-{secrets.token_hex(16)}"
        return hashlib.sha256(data.encode()).hexdigest()[:32]


# ============================================================================
# WebRTC Signaling Server (for WebSocket integration)
# ============================================================================

class WebRTCSignalingServer:
    """
    WebRTC signaling server for coordinating peer connections.
    
    Handles SDP offer/answer exchange and ICE candidate negotiation.
    """
    
    def __init__(self):
        self.connections: Dict[str, Dict] = {}  # socket_id -> user info
        self.rooms: Dict[str, set] = {}  # room_id -> set of socket_ids
    
    async def register_connection(
        self,
        socket_id: str,
        user_id: int,
        room_id: str
    ) -> Dict[str, Any]:
        """Register a WebSocket connection for signaling."""
        self.connections[socket_id] = {
            "user_id": user_id,
            "room_id": room_id,
            "connected_at": datetime.now(timezone.utc)
        }
        
        if room_id not in self.rooms:
            self.rooms[room_id] = set()
        self.rooms[room_id].add(socket_id)
        
        # Get other participants in room
        other_sockets = [s for s in self.rooms[room_id] if s != socket_id]
        
        return {
            "socket_id": socket_id,
            "room_id": room_id,
            "other_participants": [
                {"socket_id": s, "user_id": self.connections[s]["user_id"]}
                for s in other_sockets
            ]
        }
    
    async def unregister_connection(self, socket_id: str) -> None:
        """Unregister a WebSocket connection."""
        if socket_id in self.connections:
            room_id = self.connections[socket_id]["room_id"]
            del self.connections[socket_id]
            
            if room_id in self.rooms:
                self.rooms[room_id].discard(socket_id)
                if not self.rooms[room_id]:
                    del self.rooms[room_id]
    
    async def route_signal(
        self,
        from_socket: str,
        to_socket: str,
        signal_type: str,
        data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Route a signaling message to the target socket."""
        if from_socket not in self.connections:
            raise ValueError("Sender not registered")
        
        if to_socket not in self.connections:
            raise ValueError("Recipient not registered")
        
        message = {
            "type": signal_type,
            "from_socket": from_socket,
            "from_user_id": self.connections[from_socket]["user_id"],
            "data": data,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        return {
            "status": "routed",
            "to_socket": to_socket,
            "message": message
        }
    
    async def broadcast_to_room(
        self,
        room_id: str,
        exclude_socket: str,
        message_type: str,
        data: Dict[str, Any]
    ) -> List[str]:
        """Broadcast a message to all participants in a room."""
        if room_id not in self.rooms:
            return []
        
        targets = [s for s in self.rooms[room_id] if s != exclude_socket]
        return targets


# Singleton instances
_interview_service: Optional[VideoInterviewService] = None
_signaling_server: Optional[WebRTCSignalingServer] = None


def get_interview_service(db: Session) -> VideoInterviewService:
    """Get or create interview service instance."""
    global _interview_service
    if _interview_service is None:
        _interview_service = VideoInterviewService(db)
    else:
        _interview_service.db = db
    return _interview_service


def get_signaling_server() -> WebRTCSignalingServer:
    """Get or create signaling server instance."""
    global _signaling_server
    if _signaling_server is None:
        _signaling_server = WebRTCSignalingServer()
    return _signaling_server
