# @AI-HINT: Calendar and scheduling service for meetings and availability management
"""
Calendar Service - Meeting scheduling and availability management.

Features:
- Availability slots management
- Meeting scheduling
- Calendar integration
- Reminders and notifications
"""

from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta, date, time
from enum import Enum
from pydantic import BaseModel
import uuid


class MeetingStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"
    NO_SHOW = "no_show"
    RESCHEDULED = "rescheduled"


class MeetingType(str, Enum):
    VIDEO_CALL = "video_call"
    PHONE_CALL = "phone_call"
    IN_PERSON = "in_person"
    SCREEN_SHARE = "screen_share"


class RecurrencePattern(str, Enum):
    NONE = "none"
    DAILY = "daily"
    WEEKLY = "weekly"
    BIWEEKLY = "biweekly"
    MONTHLY = "monthly"


class AvailabilitySlot(BaseModel):
    """User availability slot."""
    id: str
    user_id: str
    day_of_week: int  # 0=Monday, 6=Sunday
    start_time: str  # HH:MM format
    end_time: str
    timezone: str = "UTC"
    is_active: bool = True


class Meeting(BaseModel):
    """Meeting data model."""
    id: str
    organizer_id: str
    attendee_ids: List[str]
    title: str
    description: Optional[str] = None
    meeting_type: MeetingType
    status: MeetingStatus = MeetingStatus.PENDING
    scheduled_at: datetime
    duration_minutes: int = 30
    timezone: str = "UTC"
    location: Optional[str] = None
    meeting_link: Optional[str] = None
    project_id: Optional[str] = None
    contract_id: Optional[str] = None
    notes: Optional[str] = None
    reminders: List[int] = [15, 60]  # Minutes before meeting
    recurrence: RecurrencePattern = RecurrencePattern.NONE
    created_at: datetime
    updated_at: datetime


class CalendarService:
    """Service for calendar and scheduling operations."""
    
    def __init__(self, db: Session):
        self.db = db
        self._availability: Dict[str, List[AvailabilitySlot]] = {}
        self._meetings: Dict[str, Meeting] = {}
        self._user_settings: Dict[str, Dict[str, Any]] = {}
    
    async def set_availability(
        self,
        user_id: str,
        slots: List[Dict[str, Any]]
    ) -> List[AvailabilitySlot]:
        """Set user's availability slots."""
        # Clear existing slots
        self._availability[user_id] = []
        
        created_slots = []
        for slot_data in slots:
            slot = AvailabilitySlot(
                id=f"slot_{uuid.uuid4().hex[:12]}",
                user_id=user_id,
                **slot_data
            )
            created_slots.append(slot)
        
        self._availability[user_id] = created_slots
        return created_slots
    
    async def get_availability(
        self,
        user_id: str,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None
    ) -> Dict[str, Any]:
        """Get user's availability."""
        slots = self._availability.get(user_id, [])
        
        # Filter active slots
        active_slots = [s for s in slots if s.is_active]
        
        # Generate available times for date range
        available_times = []
        if date_from and date_to:
            current = date_from
            while current <= date_to:
                day_of_week = current.weekday()
                day_slots = [s for s in active_slots if s.day_of_week == day_of_week]
                
                for slot in day_slots:
                    # Check for conflicts with existing meetings
                    is_free = await self._check_slot_availability(
                        user_id, current, slot.start_time, slot.end_time
                    )
                    
                    if is_free:
                        available_times.append({
                            "date": current.isoformat(),
                            "start_time": slot.start_time,
                            "end_time": slot.end_time,
                            "timezone": slot.timezone
                        })
                
                current += timedelta(days=1)
        
        return {
            "slots": active_slots,
            "available_times": available_times
        }
    
    async def _check_slot_availability(
        self,
        user_id: str,
        check_date: date,
        start_time: str,
        end_time: str
    ) -> bool:
        """Check if a time slot is free from meetings."""
        user_meetings = [
            m for m in self._meetings.values()
            if user_id in [m.organizer_id] + m.attendee_ids
            and m.scheduled_at.date() == check_date
            and m.status not in [MeetingStatus.CANCELLED]
        ]
        
        slot_start = datetime.strptime(start_time, "%H:%M").time()
        slot_end = datetime.strptime(end_time, "%H:%M").time()
        
        for meeting in user_meetings:
            meeting_start = meeting.scheduled_at.time()
            meeting_end = (meeting.scheduled_at + timedelta(minutes=meeting.duration_minutes)).time()
            
            # Check overlap
            if slot_start < meeting_end and slot_end > meeting_start:
                return False
        
        return True
    
    async def get_available_slots(
        self,
        user_id: str,
        date_from: date,
        date_to: date,
        duration_minutes: int = 30
    ) -> List[Dict[str, Any]]:
        """Get available booking slots for a user."""
        availability = await self.get_availability(user_id, date_from, date_to)
        
        # Split into specific time slots based on duration
        slots = []
        for avail in availability.get("available_times", []):
            start = datetime.strptime(avail["start_time"], "%H:%M")
            end = datetime.strptime(avail["end_time"], "%H:%M")
            
            current = start
            while current + timedelta(minutes=duration_minutes) <= end:
                slots.append({
                    "date": avail["date"],
                    "start_time": current.strftime("%H:%M"),
                    "end_time": (current + timedelta(minutes=duration_minutes)).strftime("%H:%M"),
                    "duration_minutes": duration_minutes,
                    "timezone": avail["timezone"]
                })
                current += timedelta(minutes=duration_minutes)
        
        return slots
    
    async def schedule_meeting(
        self,
        organizer_id: str,
        attendee_ids: List[str],
        title: str,
        scheduled_at: datetime,
        meeting_type: MeetingType,
        duration_minutes: int = 30,
        description: Optional[str] = None,
        location: Optional[str] = None,
        project_id: Optional[str] = None,
        contract_id: Optional[str] = None,
        recurrence: RecurrencePattern = RecurrencePattern.NONE,
        reminders: Optional[List[int]] = None
    ) -> Meeting:
        """Schedule a new meeting."""
        meeting_id = f"mtg_{uuid.uuid4().hex[:12]}"
        
        # Generate meeting link for video calls
        meeting_link = None
        if meeting_type == MeetingType.VIDEO_CALL:
            meeting_link = f"https://meet.megilance.com/{meeting_id}"
        
        meeting = Meeting(
            id=meeting_id,
            organizer_id=organizer_id,
            attendee_ids=attendee_ids,
            title=title,
            description=description,
            meeting_type=meeting_type,
            scheduled_at=scheduled_at,
            duration_minutes=duration_minutes,
            location=location,
            meeting_link=meeting_link,
            project_id=project_id,
            contract_id=contract_id,
            recurrence=recurrence,
            reminders=reminders or [15, 60],
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        self._meetings[meeting_id] = meeting
        return meeting
    
    async def get_meeting(self, meeting_id: str) -> Optional[Meeting]:
        """Get a meeting by ID."""
        return self._meetings.get(meeting_id)
    
    async def get_user_meetings(
        self,
        user_id: str,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
        status: Optional[MeetingStatus] = None,
        include_as_attendee: bool = True
    ) -> List[Meeting]:
        """Get user's meetings."""
        meetings = []
        
        for meeting in self._meetings.values():
            is_organizer = meeting.organizer_id == user_id
            is_attendee = user_id in meeting.attendee_ids
            
            if not is_organizer and (not include_as_attendee or not is_attendee):
                continue
            
            if date_from and meeting.scheduled_at.date() < date_from:
                continue
            
            if date_to and meeting.scheduled_at.date() > date_to:
                continue
            
            if status and meeting.status != status:
                continue
            
            meetings.append(meeting)
        
        return sorted(meetings, key=lambda m: m.scheduled_at)
    
    async def update_meeting(
        self,
        meeting_id: str,
        user_id: str,
        updates: Dict[str, Any]
    ) -> Optional[Meeting]:
        """Update a meeting."""
        meeting = self._meetings.get(meeting_id)
        if not meeting:
            return None
        
        # Only organizer can update
        if meeting.organizer_id != user_id:
            return None
        
        allowed_fields = [
            "title", "description", "scheduled_at", "duration_minutes",
            "location", "meeting_type", "reminders", "notes"
        ]
        
        meeting_dict = meeting.dict()
        for field in allowed_fields:
            if field in updates:
                meeting_dict[field] = updates[field]
        
        meeting_dict["updated_at"] = datetime.utcnow()
        
        # If time changed, update status
        if "scheduled_at" in updates:
            meeting_dict["status"] = MeetingStatus.RESCHEDULED
        
        updated_meeting = Meeting(**meeting_dict)
        self._meetings[meeting_id] = updated_meeting
        return updated_meeting
    
    async def confirm_meeting(
        self,
        meeting_id: str,
        user_id: str
    ) -> Optional[Meeting]:
        """Confirm attendance for a meeting."""
        meeting = self._meetings.get(meeting_id)
        if not meeting:
            return None
        
        # Check if user is attendee or organizer
        if user_id not in [meeting.organizer_id] + meeting.attendee_ids:
            return None
        
        if meeting.status == MeetingStatus.PENDING:
            meeting.status = MeetingStatus.CONFIRMED
            meeting.updated_at = datetime.utcnow()
        
        return meeting
    
    async def cancel_meeting(
        self,
        meeting_id: str,
        user_id: str,
        reason: Optional[str] = None
    ) -> Optional[Meeting]:
        """Cancel a meeting."""
        meeting = self._meetings.get(meeting_id)
        if not meeting:
            return None
        
        # Only organizer or attendees can cancel
        if user_id not in [meeting.organizer_id] + meeting.attendee_ids:
            return None
        
        meeting.status = MeetingStatus.CANCELLED
        meeting.notes = f"Cancelled by {user_id}. Reason: {reason or 'No reason provided'}"
        meeting.updated_at = datetime.utcnow()
        
        return meeting
    
    async def complete_meeting(
        self,
        meeting_id: str,
        user_id: str,
        notes: Optional[str] = None
    ) -> Optional[Meeting]:
        """Mark meeting as completed."""
        meeting = self._meetings.get(meeting_id)
        if not meeting:
            return None
        
        if meeting.organizer_id != user_id:
            return None
        
        meeting.status = MeetingStatus.COMPLETED
        if notes:
            meeting.notes = notes
        meeting.updated_at = datetime.utcnow()
        
        return meeting
    
    async def propose_times(
        self,
        organizer_id: str,
        attendee_ids: List[str],
        date_range_days: int = 7,
        duration_minutes: int = 30,
        count: int = 5
    ) -> List[Dict[str, Any]]:
        """Propose meeting times based on all participants' availability."""
        start_date = date.today() + timedelta(days=1)
        end_date = start_date + timedelta(days=date_range_days)
        
        # Get availability for all participants
        all_users = [organizer_id] + attendee_ids
        common_slots = []
        
        # Get organizer's available slots
        organizer_slots = await self.get_available_slots(
            organizer_id, start_date, end_date, duration_minutes
        )
        
        # Check each slot against all attendees
        for slot in organizer_slots:
            slot_datetime = datetime.strptime(
                f"{slot['date']} {slot['start_time']}", "%Y-%m-%d %H:%M"
            )
            
            all_available = True
            for attendee_id in attendee_ids:
                is_free = await self._check_slot_availability(
                    attendee_id,
                    datetime.strptime(slot["date"], "%Y-%m-%d").date(),
                    slot["start_time"],
                    slot["end_time"]
                )
                if not is_free:
                    all_available = False
                    break
            
            if all_available:
                common_slots.append({
                    **slot,
                    "datetime": slot_datetime.isoformat()
                })
            
            if len(common_slots) >= count:
                break
        
        return common_slots
    
    async def get_upcoming_reminders(
        self,
        user_id: str,
        within_minutes: int = 60
    ) -> List[Dict[str, Any]]:
        """Get upcoming meeting reminders for a user."""
        now = datetime.utcnow()
        reminders = []
        
        meetings = await self.get_user_meetings(
            user_id,
            date_from=now.date(),
            date_to=(now + timedelta(days=1)).date(),
            status=MeetingStatus.CONFIRMED
        )
        
        for meeting in meetings:
            for reminder_minutes in meeting.reminders:
                reminder_time = meeting.scheduled_at - timedelta(minutes=reminder_minutes)
                time_until = (reminder_time - now).total_seconds() / 60
                
                if 0 <= time_until <= within_minutes:
                    reminders.append({
                        "meeting_id": meeting.id,
                        "title": meeting.title,
                        "scheduled_at": meeting.scheduled_at.isoformat(),
                        "minutes_until": int((meeting.scheduled_at - now).total_seconds() / 60),
                        "reminder_minutes": reminder_minutes,
                        "meeting_link": meeting.meeting_link
                    })
        
        return reminders
    
    async def update_calendar_settings(
        self,
        user_id: str,
        settings: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Update user's calendar settings."""
        current = self._user_settings.get(user_id, {
            "timezone": "UTC",
            "default_duration": 30,
            "buffer_before": 5,
            "buffer_after": 5,
            "working_hours_start": "09:00",
            "working_hours_end": "17:00",
            "working_days": [0, 1, 2, 3, 4],  # Mon-Fri
            "auto_accept": False,
            "require_approval": True
        })
        
        current.update(settings)
        self._user_settings[user_id] = current
        
        return current
    
    async def get_calendar_settings(self, user_id: str) -> Dict[str, Any]:
        """Get user's calendar settings."""
        return self._user_settings.get(user_id, {
            "timezone": "UTC",
            "default_duration": 30,
            "buffer_before": 5,
            "buffer_after": 5,
            "working_hours_start": "09:00",
            "working_hours_end": "17:00",
            "working_days": [0, 1, 2, 3, 4],
            "auto_accept": False,
            "require_approval": True
        })
    
    async def get_calendar_stats(
        self,
        user_id: str,
        days: int = 30
    ) -> Dict[str, Any]:
        """Get calendar statistics for a user."""
        start_date = date.today() - timedelta(days=days)
        
        meetings = await self.get_user_meetings(
            user_id,
            date_from=start_date
        )
        
        total = len(meetings)
        completed = len([m for m in meetings if m.status == MeetingStatus.COMPLETED])
        cancelled = len([m for m in meetings if m.status == MeetingStatus.CANCELLED])
        no_show = len([m for m in meetings if m.status == MeetingStatus.NO_SHOW])
        
        total_minutes = sum(
            m.duration_minutes for m in meetings
            if m.status == MeetingStatus.COMPLETED
        )
        
        by_type = {}
        for meeting_type in MeetingType:
            by_type[meeting_type.value] = len([
                m for m in meetings if m.meeting_type == meeting_type
            ])
        
        return {
            "period_days": days,
            "total_meetings": total,
            "completed": completed,
            "cancelled": cancelled,
            "no_show": no_show,
            "completion_rate": completed / total * 100 if total > 0 else 0,
            "total_meeting_hours": total_minutes / 60,
            "average_duration_minutes": total_minutes / completed if completed > 0 else 0,
            "by_type": by_type
        }


def get_calendar_service(db: Session) -> CalendarService:
    """Get calendar service instance."""
    return CalendarService(db)
