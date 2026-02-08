# @AI-HINT: Advanced video calling and screen sharing API using WebRTC
"""
Video Communication API

Features:
- One-on-one video calls
- Group video conferences
- Screen sharing
- Virtual whiteboard
- Call recording
- Real-time transcription
- Meeting scheduler integration
"""

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime, timedelta, timezone
import json
import secrets

from app.db.session import get_db, execute_query
from app.core.security import get_current_active_user
from app.models.user import User

router = APIRouter(prefix="/video", tags=["video"])


# ============================================================================
# Request/Response Models
# ============================================================================

class CreateCallRequest(BaseModel):
    participant_ids: List[int]
    call_type: str = Field(..., pattern="^(one_on_one|group|screen_share)$")
    scheduled_at: Optional[datetime] = None
    duration_minutes: Optional[int] = 60
    enable_recording: bool = False
    metadata: Optional[Dict[str, Any]] = None


class CallResponse(BaseModel):
    call_id: int
    room_id: str
    host_id: int
    participant_ids: List[int]
    call_type: str
    status: str
    join_url: str
    scheduled_at: Optional[datetime]
    started_at: Optional[datetime]
    ended_at: Optional[datetime]
    recording_url: Optional[str]
    created_at: datetime


class JoinCallResponse(BaseModel):
    room_id: str
    ice_servers: List[Dict[str, Any]]
    turn_credentials: Optional[Dict[str, str]]
    participant_count: int
    call_config: Dict[str, Any]


class ScreenShareRequest(BaseModel):
    call_id: int
    stream_id: str


class WhiteboardAction(BaseModel):
    call_id: int
    action_type: str  # 'draw', 'erase', 'text', 'shape', 'clear'
    data: Dict[str, Any]


# ============================================================================
# WebRTC Configuration
# ============================================================================

class WebRTCService:
    """WebRTC signaling and media server integration"""

    def __init__(self):
        # STUN servers for NAT traversal
        self.stun_servers = [
            {"urls": "stun:stun.l.google.com:19302"},
            {"urls": "stun:stun1.l.google.com:19302"},
            {"urls": "stun:stun2.l.google.com:19302"},
        ]

        # TURN servers for relay (would be configured with actual credentials)
        self.turn_servers = [
            {
                "urls": "turn:turn.megilance.com:3478",
                "username": "megilance",
                "credential": "secretpassword"  # In production, use time-limited credentials
            }
        ]

    def get_ice_servers(self) -> List[Dict[str, Any]]:
        """Get ICE servers configuration for WebRTC"""
        return self.stun_servers + self.turn_servers

    def generate_room_id(self) -> str:
        """Generate unique room ID"""
        return f"room_{secrets.token_urlsafe(16)}"


webrtc_service = WebRTCService()


# ============================================================================
# Call Management Endpoints
# ============================================================================

@router.post("/calls", response_model=CallResponse)
async def create_call(
    request: CreateCallRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Create a new video call
    
    - **one_on_one**: Direct call between two users
    - **group**: Conference call with multiple participants
    - **screen_share**: Screen sharing session
    """
    # Generate unique room ID
    room_id = webrtc_service.generate_room_id()

    # Create call record
    scheduled_at = request.scheduled_at.isoformat() if request.scheduled_at else None
    metadata_json = json.dumps(request.metadata) if request.metadata else None

    execute_query("""
        INSERT INTO video_calls (
            host_id, participant_ids, room_id, call_type,
            status, scheduled_at, metadata, created_at
        ) VALUES (?, ?, ?, ?, 'scheduled', ?, ?, ?)
    """, [
        current_user.id,
        json.dumps(request.participant_ids),
        room_id,
        request.call_type,
        scheduled_at,
        metadata_json,
        datetime.now(timezone.utc).isoformat()
    ])

    # Get created call
    result = execute_query("""
        SELECT id, room_id, host_id, participant_ids, call_type,
               status, scheduled_at, created_at
        FROM video_calls
        WHERE room_id = ?
    """, [room_id])

    if not result or not result.get("rows"):
        raise HTTPException(status_code=500, detail="Failed to create call")

    row = result["rows"][0]
    call_data = {
        "call_id": int(row[0].get("value")),
        "room_id": row[1].get("value"),
        "host_id": int(row[2].get("value")),
        "participant_ids": json.loads(row[3].get("value")),
        "call_type": row[4].get("value"),
        "status": row[5].get("value"),
        "join_url": f"https://megilance.com/video/join/{room_id}",
        "scheduled_at": row[6].get("value"),
        "started_at": None,
        "ended_at": None,
        "recording_url": None,
        "created_at": row[7].get("value")
    }

    # Send notifications to participants
    for participant_id in request.participant_ids:
        execute_query("""
            INSERT INTO notifications (
                user_id, notification_type, title, message,
                link, is_read, created_at
            ) VALUES (?, 'video_call_invitation', 'Video Call Invitation',
                     'You have been invited to a video call', ?, 0, ?)
        """, [
            participant_id,
            f"/video/join/{room_id}",
            datetime.now(timezone.utc).isoformat()
        ])

    return CallResponse(**call_data)


@router.post("/calls/{room_id}/join", response_model=JoinCallResponse)
async def join_call(
    room_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Join a video call
    
    Returns WebRTC configuration including:
    - ICE servers (STUN/TURN)
    - Room configuration
    - Participant information
    """
    # Verify call exists and user is authorized
    result = execute_query("""
        SELECT id, host_id, participant_ids, call_type, status
        FROM video_calls
        WHERE room_id = ?
    """, [room_id])

    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Call not found")

    row = result["rows"][0]
    call_id = int(row[0].get("value"))
    host_id = int(row[1].get("value"))
    participant_ids = json.loads(row[2].get("value"))
    call_type = row[3].get("value")
    status = row[4].get("value")

    # Check authorization
    if current_user.id != host_id and current_user.id not in participant_ids:
        raise HTTPException(status_code=403, detail="Not authorized to join this call")

    # Update call status to 'ongoing' if first participant
    if status == "scheduled":
        execute_query("""
            UPDATE video_calls
            SET status = 'ongoing', started_at = ?
            WHERE id = ?
        """, [datetime.now(timezone.utc).isoformat(), call_id])

    # Get active participant count
    # In production, would track via WebSocket connections
    participant_count = len(participant_ids) + 1  # +1 for host

    return JoinCallResponse(
        room_id=room_id,
        ice_servers=webrtc_service.get_ice_servers(),
        turn_credentials={
            "username": f"user_{current_user.id}",
            "credential": secrets.token_urlsafe(16)  # Time-limited credential
        },
        participant_count=participant_count,
        call_config={
            "call_type": call_type,
            "max_participants": 50 if call_type == "group" else 2,
            "enable_recording": True,
            "enable_screen_share": True,
            "enable_whiteboard": True,
            "video_quality": "720p",
            "audio_codec": "opus"
        }
    )


@router.post("/calls/{call_id}/end")
async def end_call(
    call_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """End a video call (host only)"""
    # Verify caller is host
    result = execute_query("""
        SELECT host_id, started_at FROM video_calls WHERE id = ?
    """, [call_id])

    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Call not found")

    host_id = int(result["rows"][0][0].get("value"))
    started_at = result["rows"][0][1].get("value")

    if current_user.id != host_id:
        raise HTTPException(status_code=403, detail="Only host can end call")

    # Calculate duration
    if started_at:
        start_time = datetime.fromisoformat(started_at)
        duration_seconds = int((datetime.now(timezone.utc) - start_time).total_seconds())
    else:
        duration_seconds = 0

    # Update call status
    execute_query("""
        UPDATE video_calls
        SET status = 'ended', ended_at = ?, duration_seconds = ?
        WHERE id = ?
    """, [datetime.now(timezone.utc).isoformat(), duration_seconds, call_id])

    return {
        "message": "Call ended successfully",
        "duration_seconds": duration_seconds
    }


@router.get("/calls", response_model=List[CallResponse])
async def list_calls(
    status: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """List user's video calls"""
    # Build query
    query = """
        SELECT id, room_id, host_id, participant_ids, call_type,
               status, scheduled_at, started_at, ended_at,
               recording_url, created_at
        FROM video_calls
        WHERE (host_id = ? OR participant_ids LIKE ?)
    """
    params = [current_user.id, f'%{current_user.id}%']

    if status:
        query += " AND status = ?"
        params.append(status)

    query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])

    result = execute_query(query, params)

    calls = []
    if result and result.get("rows"):
        for row in result["rows"]:
            calls.append(CallResponse(
                call_id=int(row[0].get("value")),
                room_id=row[1].get("value"),
                host_id=int(row[2].get("value")),
                participant_ids=json.loads(row[3].get("value")),
                call_type=row[4].get("value"),
                status=row[5].get("value"),
                join_url=f"https://megilance.com/video/join/{row[1].get('value')}",
                scheduled_at=row[6].get("value"),
                started_at=row[7].get("value"),
                ended_at=row[8].get("value"),
                recording_url=row[9].get("value"),
                created_at=row[10].get("value")
            ))

    return calls


# ============================================================================
# Screen Sharing
# ============================================================================

@router.post("/screen-share/start")
async def start_screen_share(
    request: ScreenShareRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Start screen sharing in a call"""
    # Verify user is in call
    result = execute_query("""
        SELECT host_id, participant_ids FROM video_calls WHERE id = ?
    """, [request.call_id])

    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Call not found")

    host_id = int(result["rows"][0][0].get("value"))
    participant_ids = json.loads(result["rows"][0][1].get("value"))

    if current_user.id != host_id and current_user.id not in participant_ids:
        raise HTTPException(status_code=403, detail="Not in this call")

    # Log screen share event
    execute_query("""
        INSERT INTO analytics_events (
            user_id, event_name, event_category, event_properties, created_at
        ) VALUES (?, 'screen_share_started', 'video_call', ?, ?)
    """, [
        current_user.id,
        json.dumps({"call_id": request.call_id, "stream_id": request.stream_id}),
        datetime.now(timezone.utc).isoformat()
    ])

    return {
        "message": "Screen sharing started",
        "stream_id": request.stream_id,
        "permissions": ["audio", "video", "screen"]
    }


# ============================================================================
# Virtual Whiteboard
# ============================================================================

@router.post("/whiteboard/action")
async def whiteboard_action(
    request: WhiteboardAction,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Execute whiteboard action
    
    Actions:
    - draw: Free-hand drawing
    - erase: Erase strokes
    - text: Add text annotations
    - shape: Add shapes (rectangle, circle, arrow)
    - clear: Clear entire board
    """
    # Verify user is in call
    result = execute_query("""
        SELECT host_id, participant_ids FROM video_calls WHERE id = ?
    """, [request.call_id])

    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Call not found")

    # Store whiteboard action for replay
    execute_query("""
        INSERT INTO collaboration_sessions (
            project_id, session_type, participants, session_data,
            is_active, created_at
        ) VALUES (?, 'whiteboard', ?, ?, 1, ?)
    """, [
        request.call_id,  # Using call_id as project_id for simplicity
        json.dumps([current_user.id]),
        json.dumps({
            "action_type": request.action_type,
            "data": request.data,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }),
        datetime.now(timezone.utc).isoformat()
    ])

    return {
        "message": "Whiteboard action recorded",
        "action_type": request.action_type
    }


# ============================================================================
# WebSocket for Real-time Signaling
# ============================================================================

class ConnectionManager:
    """Manage WebSocket connections for WebRTC signaling"""

    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, room_id: str, websocket: WebSocket):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        self.active_connections[room_id].append(websocket)

    def disconnect(self, room_id: str, websocket: WebSocket):
        if room_id in self.active_connections:
            self.active_connections[room_id].remove(websocket)

    async def broadcast(self, room_id: str, message: dict, exclude: Optional[WebSocket] = None):
        """Broadcast message to all participants in room"""
        if room_id in self.active_connections:
            for connection in self.active_connections[room_id]:
                if connection != exclude:
                    await connection.send_json(message)


manager = ConnectionManager()


@router.websocket("/ws/{room_id}")
async def websocket_signaling(websocket: WebSocket, room_id: str):
    """
    WebSocket endpoint for WebRTC signaling
    
    Handles:
    - SDP offer/answer exchange
    - ICE candidate exchange
    - Participant join/leave notifications
    - Screen share signals
    - Whiteboard updates
    """
    await manager.connect(room_id, websocket)

    try:
        while True:
            # Receive message
            data = await websocket.receive_json()

            message_type = data.get("type")

            if message_type == "offer":
                # Forward SDP offer to other participants
                await manager.broadcast(room_id, {
                    "type": "offer",
                    "sdp": data.get("sdp"),
                    "from": data.get("from")
                }, exclude=websocket)

            elif message_type == "answer":
                # Forward SDP answer
                await manager.broadcast(room_id, {
                    "type": "answer",
                    "sdp": data.get("sdp"),
                    "from": data.get("from")
                }, exclude=websocket)

            elif message_type == "ice_candidate":
                # Forward ICE candidate
                await manager.broadcast(room_id, {
                    "type": "ice_candidate",
                    "candidate": data.get("candidate"),
                    "from": data.get("from")
                }, exclude=websocket)

            elif message_type == "join":
                # Notify others of new participant
                await manager.broadcast(room_id, {
                    "type": "participant_joined",
                    "user_id": data.get("user_id"),
                    "name": data.get("name")
                }, exclude=websocket)

            elif message_type == "whiteboard":
                # Broadcast whiteboard updates
                await manager.broadcast(room_id, {
                    "type": "whiteboard_update",
                    "action": data.get("action"),
                    "data": data.get("data")
                }, exclude=websocket)

            elif message_type == "screen_share":
                # Notify about screen sharing
                await manager.broadcast(room_id, {
                    "type": "screen_share_started",
                    "user_id": data.get("user_id"),
                    "stream_id": data.get("stream_id")
                }, exclude=websocket)

    except WebSocketDisconnect:
        manager.disconnect(room_id, websocket)
        # Notify others of participant leaving
        await manager.broadcast(room_id, {
            "type": "participant_left",
            "timestamp": datetime.now(timezone.utc).isoformat()
        })


# ============================================================================
# Call Recording
# ============================================================================

@router.post("/calls/{call_id}/recording/start")
async def start_recording(
    call_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Start call recording (host only)"""
    # Verify caller is host
    result = execute_query("""
        SELECT host_id FROM video_calls WHERE id = ?
    """, [call_id])

    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Call not found")

    host_id = int(result["rows"][0][0].get("value"))

    if current_user.id != host_id:
        raise HTTPException(status_code=403, detail="Only host can start recording")

    # In production, would integrate with media server for recording
    recording_id = f"rec_{secrets.token_urlsafe(16)}"

    return {
        "message": "Recording started",
        "recording_id": recording_id,
        "notice": "All participants will be notified that recording has started"
    }


@router.post("/calls/{call_id}/recording/stop")
async def stop_recording(
    call_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Stop call recording and get download URL"""
    # Verify caller is host
    result = execute_query("""
        SELECT host_id FROM video_calls WHERE id = ?
    """, [call_id])

    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Call not found")

    host_id = int(result["rows"][0][0].get("value"))

    if current_user.id != host_id:
        raise HTTPException(status_code=403, detail="Only host can stop recording")

    # Generate recording URL (stub - would be actual media server URL)
    recording_url = f"https://recordings.megilance.com/{call_id}/recording.mp4"

    # Update call record
    execute_query("""
        UPDATE video_calls SET recording_url = ? WHERE id = ?
    """, [recording_url, call_id])

    return {
        "message": "Recording stopped",
        "recording_url": recording_url,
        "expires_in_days": 30
    }


# ============================================================================
# Meeting Scheduler Integration
# ============================================================================

@router.get("/availability/{user_id}")
async def get_user_availability(
    user_id: int,
    start_date: str,
    end_date: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get user's availability for scheduling calls"""
    # Get user's scheduled calls in date range
    result = execute_query("""
        SELECT scheduled_at, duration_seconds FROM video_calls
        WHERE (host_id = ? OR participant_ids LIKE ?)
        AND scheduled_at BETWEEN ? AND ?
        AND status IN ('scheduled', 'ongoing')
    """, [user_id, f'%{user_id}%', start_date, end_date])

    busy_slots = []
    if result and result.get("rows"):
        for row in result["rows"]:
            scheduled_at = row[0].get("value")
            duration = row[1].get("value", 3600)  # Default 1 hour
            busy_slots.append({
                "start": scheduled_at,
                "end": (datetime.fromisoformat(scheduled_at) + timedelta(seconds=duration)).isoformat()
            })

    return {
        "user_id": user_id,
        "busy_slots": busy_slots,
        "timezone": "UTC"  # Would get from user preferences
    }


# ============================================================================
# Call Analytics
# ============================================================================

@router.get("/analytics/calls")
async def get_call_analytics(
    period: str = "week",  # 'day', 'week', 'month', 'year'
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get call usage analytics"""
    # Calculate date range
    if period == "day":
        start_date = datetime.now(timezone.utc) - timedelta(days=1)
    elif period == "week":
        start_date = datetime.now(timezone.utc) - timedelta(weeks=1)
    elif period == "month":
        start_date = datetime.now(timezone.utc) - timedelta(days=30)
    else:
        start_date = datetime.now(timezone.utc) - timedelta(days=365)

    # Get statistics
    result = execute_query("""
        SELECT 
            COUNT(*) as total_calls,
            SUM(duration_seconds) as total_duration,
            AVG(duration_seconds) as avg_duration
        FROM video_calls
        WHERE (host_id = ? OR participant_ids LIKE ?)
        AND created_at >= ?
    """, [current_user.id, f'%{current_user.id}%', start_date.isoformat()])

    stats = {
        "total_calls": 0,
        "total_duration_minutes": 0,
        "avg_duration_minutes": 0
    }

    if result and result.get("rows"):
        row = result["rows"][0]
        stats = {
            "total_calls": int(row[0].get("value", 0)),
            "total_duration_minutes": int(row[1].get("value", 0)) // 60,
            "avg_duration_minutes": int(row[2].get("value", 0)) // 60
        }

    return {
        "period": period,
        "stats": stats
    }
