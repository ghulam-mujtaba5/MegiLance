# @AI-HINT: Calendar API endpoints for meetings and availability
"""
Calendar API - Meeting scheduling and availability endpoints.

Features:
- Set/get availability
- Schedule meetings
- Manage calendar settings
- Get calendar stats
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime, date

from app.db.session import get_db
from app.core.security import get_current_active_user
from app.models.user import User
from app.services.calendar import (
    get_calendar_service,
    MeetingType,
    MeetingStatus,
    RecurrencePattern
)

router = APIRouter(prefix="/calendar", tags=["calendar"])


# Request/Response Models
class AvailabilitySlotRequest(BaseModel):
    day_of_week: int = Field(..., ge=0, le=6)
    start_time: str  # HH:MM
    end_time: str
    timezone: str = "UTC"
    is_active: bool = True


class SetAvailabilityRequest(BaseModel):
    slots: List[AvailabilitySlotRequest]


class ScheduleMeetingRequest(BaseModel):
    attendee_ids: List[str]
    title: str = Field(..., min_length=1, max_length=200)
    scheduled_at: datetime
    meeting_type: MeetingType = MeetingType.VIDEO_CALL
    duration_minutes: int = Field(default=30, ge=15, le=480)
    description: Optional[str] = None
    location: Optional[str] = None
    project_id: Optional[str] = None
    contract_id: Optional[str] = None
    recurrence: RecurrencePattern = RecurrencePattern.NONE
    reminders: Optional[List[int]] = None


class UpdateMeetingRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    location: Optional[str] = None
    meeting_type: Optional[MeetingType] = None
    reminders: Optional[List[int]] = None
    notes: Optional[str] = None


class CancelMeetingRequest(BaseModel):
    reason: Optional[str] = None


class CompleteMeetingRequest(BaseModel):
    notes: Optional[str] = None


class ProposeTimesRequest(BaseModel):
    attendee_ids: List[str]
    date_range_days: int = Field(default=7, ge=1, le=30)
    duration_minutes: int = Field(default=30, ge=15, le=480)
    count: int = Field(default=5, ge=1, le=20)


class CalendarSettingsRequest(BaseModel):
    timezone: Optional[str] = None
    default_duration: Optional[int] = None
    buffer_before: Optional[int] = None
    buffer_after: Optional[int] = None
    working_hours_start: Optional[str] = None
    working_hours_end: Optional[str] = None
    working_days: Optional[List[int]] = None
    auto_accept: Optional[bool] = None
    require_approval: Optional[bool] = None


# Endpoints
@router.post("/availability")
async def set_availability(
    request: SetAvailabilityRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Set user's availability slots."""
    service = get_calendar_service(db)
    
    slots = await service.set_availability(
        user_id=current_user["id"],
        slots=[s.dict() for s in request.slots]
    )
    
    return {"slots": slots, "message": "Availability updated successfully"}


@router.get("/availability")
async def get_my_availability(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Get current user's availability."""
    service = get_calendar_service(db)
    
    result = await service.get_availability(
        user_id=current_user["id"],
        date_from=date_from,
        date_to=date_to
    )
    
    return result


@router.get("/availability/{user_id}")
async def get_user_availability(
    user_id: str,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    duration_minutes: int = 30,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Get another user's available booking slots."""
    service = get_calendar_service(db)
    
    if not date_from:
        date_from = date.today()
    if not date_to:
        date_to = date_from + timedelta(days=14)
    
    slots = await service.get_available_slots(
        user_id=user_id,
        date_from=date_from,
        date_to=date_to,
        duration_minutes=duration_minutes
    )
    
    return {"user_id": user_id, "available_slots": slots}


@router.post("/meetings")
async def schedule_meeting(
    request: ScheduleMeetingRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Schedule a new meeting."""
    service = get_calendar_service(db)
    
    meeting = await service.schedule_meeting(
        organizer_id=current_user["id"],
        attendee_ids=request.attendee_ids,
        title=request.title,
        scheduled_at=request.scheduled_at,
        meeting_type=request.meeting_type,
        duration_minutes=request.duration_minutes,
        description=request.description,
        location=request.location,
        project_id=request.project_id,
        contract_id=request.contract_id,
        recurrence=request.recurrence,
        reminders=request.reminders
    )
    
    return {"meeting": meeting, "message": "Meeting scheduled successfully"}


@router.get("/meetings")
async def get_my_meetings(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    status: Optional[MeetingStatus] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Get current user's meetings."""
    service = get_calendar_service(db)
    
    meetings = await service.get_user_meetings(
        user_id=current_user["id"],
        date_from=date_from,
        date_to=date_to,
        status=status
    )
    
    return {"meetings": meetings, "total": len(meetings)}


@router.get("/meetings/{meeting_id}")
async def get_meeting(
    meeting_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Get a specific meeting."""
    service = get_calendar_service(db)
    
    meeting = await service.get_meeting(meeting_id)
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found"
        )
    
    # Check access
    if current_user["id"] not in [meeting.organizer_id] + meeting.attendee_ids:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return {"meeting": meeting}


@router.put("/meetings/{meeting_id}")
async def update_meeting(
    meeting_id: str,
    request: UpdateMeetingRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Update a meeting."""
    service = get_calendar_service(db)
    
    updates = request.dict(exclude_unset=True)
    meeting = await service.update_meeting(
        meeting_id=meeting_id,
        user_id=current_user["id"],
        updates=updates
    )
    
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found or you are not the organizer"
        )
    
    return {"meeting": meeting, "message": "Meeting updated successfully"}


@router.post("/meetings/{meeting_id}/confirm")
async def confirm_meeting(
    meeting_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Confirm attendance for a meeting."""
    service = get_calendar_service(db)
    
    meeting = await service.confirm_meeting(
        meeting_id=meeting_id,
        user_id=current_user["id"]
    )
    
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found or access denied"
        )
    
    return {"meeting": meeting, "message": "Meeting confirmed"}


@router.post("/meetings/{meeting_id}/cancel")
async def cancel_meeting(
    meeting_id: str,
    request: CancelMeetingRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Cancel a meeting."""
    service = get_calendar_service(db)
    
    meeting = await service.cancel_meeting(
        meeting_id=meeting_id,
        user_id=current_user["id"],
        reason=request.reason
    )
    
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found or access denied"
        )
    
    return {"meeting": meeting, "message": "Meeting cancelled"}


@router.post("/meetings/{meeting_id}/complete")
async def complete_meeting(
    meeting_id: str,
    request: CompleteMeetingRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Mark a meeting as completed."""
    service = get_calendar_service(db)
    
    meeting = await service.complete_meeting(
        meeting_id=meeting_id,
        user_id=current_user["id"],
        notes=request.notes
    )
    
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found or you are not the organizer"
        )
    
    return {"meeting": meeting, "message": "Meeting completed"}


@router.post("/propose-times")
async def propose_meeting_times(
    request: ProposeTimesRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Propose meeting times based on all participants' availability."""
    service = get_calendar_service(db)
    
    proposed_times = await service.propose_times(
        organizer_id=current_user["id"],
        attendee_ids=request.attendee_ids,
        date_range_days=request.date_range_days,
        duration_minutes=request.duration_minutes,
        count=request.count
    )
    
    return {"proposed_times": proposed_times}


@router.get("/reminders")
async def get_upcoming_reminders(
    within_minutes: int = 60,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Get upcoming meeting reminders."""
    service = get_calendar_service(db)
    
    reminders = await service.get_upcoming_reminders(
        user_id=current_user["id"],
        within_minutes=within_minutes
    )
    
    return {"reminders": reminders}


@router.get("/settings")
async def get_calendar_settings(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Get user's calendar settings."""
    service = get_calendar_service(db)
    
    settings = await service.get_calendar_settings(current_user["id"])
    return {"settings": settings}


@router.put("/settings")
async def update_calendar_settings(
    request: CalendarSettingsRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Update user's calendar settings."""
    service = get_calendar_service(db)
    
    settings = await service.update_calendar_settings(
        user_id=current_user["id"],
        settings=request.dict(exclude_unset=True)
    )
    
    return {"settings": settings, "message": "Settings updated"}


@router.get("/stats")
async def get_calendar_stats(
    days: int = 30,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Get calendar statistics."""
    service = get_calendar_service(db)
    
    stats = await service.get_calendar_stats(
        user_id=current_user["id"],
        days=days
    )
    
    return stats


# Add missing import
from datetime import timedelta
