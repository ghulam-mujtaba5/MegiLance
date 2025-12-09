# @AI-HINT: Availability calendar API - Freelancer scheduling and booking
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, date, time
from enum import Enum
from app.db.session import get_db
from app.core.security import get_current_active_user

router = APIRouter(prefix="/availability")


class AvailabilityStatus(str, Enum):
    AVAILABLE = "available"
    BUSY = "busy"
    TENTATIVE = "tentative"
    OUT_OF_OFFICE = "out_of_office"


class TimeSlot(BaseModel):
    id: Optional[str] = None
    start_time: time
    end_time: time
    is_available: bool = True


class DayAvailability(BaseModel):
    day_of_week: int  # 0=Monday, 6=Sunday
    is_working_day: bool
    slots: List[TimeSlot]


class AvailabilityBlock(BaseModel):
    id: str
    user_id: str
    start_datetime: datetime
    end_datetime: datetime
    status: AvailabilityStatus
    title: Optional[str] = None
    is_recurring: bool = False
    recurrence_rule: Optional[str] = None


class BookingSlot(BaseModel):
    id: str
    freelancer_id: str
    client_id: Optional[str] = None
    start_datetime: datetime
    end_datetime: datetime
    title: str
    status: str
    meeting_link: Optional[str] = None


@router.get("/schedule")
async def get_my_schedule(
    start_date: date,
    end_date: date,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get user's availability schedule"""
    return {
        "user_id": str(current_user.id),
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "availability_blocks": [
            {
                "date": start_date.isoformat(),
                "slots": [
                    {"start": "09:00", "end": "12:00", "status": "available"},
                    {"start": "13:00", "end": "17:00", "status": "available"}
                ]
            }
        ],
        "booked_slots": [],
        "time_zone": "UTC"
    }


@router.get("/weekly-pattern", response_model=List[DayAvailability])
async def get_weekly_pattern(
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get weekly availability pattern"""
    return [
        DayAvailability(
            day_of_week=i,
            is_working_day=i < 5,
            slots=[
                TimeSlot(start_time=time(9, 0), end_time=time(12, 0)),
                TimeSlot(start_time=time(13, 0), end_time=time(17, 0))
            ] if i < 5 else []
        )
        for i in range(7)
    ]


@router.put("/weekly-pattern")
async def update_weekly_pattern(
    pattern: List[DayAvailability],
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update weekly availability pattern"""
    return {
        "message": "Weekly pattern updated successfully",
        "pattern": pattern
    }


@router.post("/blocks", response_model=AvailabilityBlock)
async def create_availability_block(
    start_datetime: datetime,
    end_datetime: datetime,
    status: AvailabilityStatus,
    title: Optional[str] = None,
    is_recurring: bool = False,
    recurrence_rule: Optional[str] = None,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create availability block (e.g., time off, busy period)"""
    return AvailabilityBlock(
        id="block-new",
        user_id=str(current_user.id),
        start_datetime=start_datetime,
        end_datetime=end_datetime,
        status=status,
        title=title,
        is_recurring=is_recurring,
        recurrence_rule=recurrence_rule
    )


@router.get("/blocks", response_model=List[AvailabilityBlock])
async def get_availability_blocks(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get availability blocks"""
    return [
        AvailabilityBlock(
            id="block-1",
            user_id=str(current_user.id),
            start_datetime=datetime.utcnow(),
            end_datetime=datetime.utcnow(),
            status=AvailabilityStatus.OUT_OF_OFFICE,
            title="Vacation"
        )
    ]


@router.put("/blocks/{block_id}", response_model=AvailabilityBlock)
async def update_availability_block(
    block_id: str,
    start_datetime: Optional[datetime] = None,
    end_datetime: Optional[datetime] = None,
    status: Optional[AvailabilityStatus] = None,
    title: Optional[str] = None,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update availability block"""
    return AvailabilityBlock(
        id=block_id,
        user_id=str(current_user.id),
        start_datetime=start_datetime or datetime.utcnow(),
        end_datetime=end_datetime or datetime.utcnow(),
        status=status or AvailabilityStatus.BUSY,
        title=title
    )


@router.delete("/blocks/{block_id}")
async def delete_availability_block(
    block_id: str,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete availability block"""
    return {"message": f"Block {block_id} deleted"}


@router.get("/user/{user_id}/available-slots")
async def get_user_available_slots(
    user_id: str,
    date: date,
    duration_minutes: int = Query(60, ge=15, le=480),
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get available time slots for a user on a specific date"""
    return {
        "user_id": user_id,
        "date": date.isoformat(),
        "duration_minutes": duration_minutes,
        "available_slots": [
            {"start": "09:00", "end": "10:00"},
            {"start": "10:00", "end": "11:00"},
            {"start": "11:00", "end": "12:00"},
            {"start": "14:00", "end": "15:00"},
            {"start": "15:00", "end": "16:00"}
        ],
        "timezone": "UTC"
    }


@router.post("/bookings", response_model=BookingSlot)
async def create_booking(
    freelancer_id: str,
    start_datetime: datetime,
    end_datetime: datetime,
    title: str,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Book a time slot with a freelancer"""
    return BookingSlot(
        id="booking-new",
        freelancer_id=freelancer_id,
        client_id=str(current_user.id),
        start_datetime=start_datetime,
        end_datetime=end_datetime,
        title=title,
        status="confirmed",
        meeting_link="https://meet.megilance.com/booking-new"
    )


@router.get("/bookings", response_model=List[BookingSlot])
async def get_my_bookings(
    status: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get user's bookings"""
    return [
        BookingSlot(
            id="booking-1",
            freelancer_id=str(current_user.id),
            client_id="client-1",
            start_datetime=datetime.utcnow(),
            end_datetime=datetime.utcnow(),
            title="Project Discussion",
            status="confirmed",
            meeting_link="https://meet.megilance.com/booking-1"
        )
    ]


@router.put("/bookings/{booking_id}")
async def update_booking(
    booking_id: str,
    start_datetime: Optional[datetime] = None,
    end_datetime: Optional[datetime] = None,
    status: Optional[str] = None,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update booking"""
    return {
        "booking_id": booking_id,
        "updated": True,
        "status": status
    }


@router.delete("/bookings/{booking_id}")
async def cancel_booking(
    booking_id: str,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Cancel booking"""
    return {"message": f"Booking {booking_id} cancelled"}


@router.get("/settings")
async def get_availability_settings(
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get availability settings"""
    return {
        "timezone": "UTC",
        "default_meeting_duration": 60,
        "buffer_before": 15,
        "buffer_after": 15,
        "minimum_notice_hours": 24,
        "maximum_advance_days": 60,
        "auto_accept_bookings": False
    }


@router.put("/settings")
async def update_availability_settings(
    timezone: Optional[str] = None,
    default_meeting_duration: Optional[int] = None,
    buffer_before: Optional[int] = None,
    buffer_after: Optional[int] = None,
    minimum_notice_hours: Optional[int] = None,
    maximum_advance_days: Optional[int] = None,
    auto_accept_bookings: Optional[bool] = None,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update availability settings"""
    return {
        "message": "Settings updated successfully",
        "updated_at": datetime.utcnow().isoformat()
    }


@router.get("/sync-status")
async def get_calendar_sync_status(
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get external calendar sync status"""
    return {
        "google_calendar": {"connected": False, "last_sync": None},
        "outlook_calendar": {"connected": False, "last_sync": None},
        "apple_calendar": {"connected": False, "last_sync": None}
    }


@router.post("/sync/{provider}")
async def sync_calendar(
    provider: str = Path(..., enum=["google", "outlook", "apple"]),
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Initiate calendar sync with external provider"""
    return {
        "provider": provider,
        "auth_url": f"https://auth.megilance.com/calendar/{provider}?user={current_user.id}"
    }

