# @AI-HINT: Rate cards API - Freelancer pricing structures
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from enum import Enum
from app.db.session import get_db
from app.api.v1.auth import get_current_active_user

router = APIRouter(prefix="/rate-cards")


class RateType(str, Enum):
    HOURLY = "hourly"
    DAILY = "daily"
    WEEKLY = "weekly"
    FIXED = "fixed"
    RETAINER = "retainer"


class RateCard(BaseModel):
    id: str
    user_id: str
    name: str
    description: Optional[str] = None
    rate_type: RateType
    base_rate: float
    currency: str
    min_hours: Optional[int] = None
    max_hours: Optional[int] = None
    is_negotiable: bool = True
    is_default: bool = False
    created_at: datetime
    updated_at: Optional[datetime] = None


class ServicePackage(BaseModel):
    id: str
    rate_card_id: str
    name: str
    description: str
    price: float
    deliverables: List[str]
    estimated_duration: str
    revisions: int
    is_popular: bool = False


class RateModifier(BaseModel):
    id: str
    rate_card_id: str
    name: str
    type: str  # percentage, fixed
    value: float
    conditions: Optional[dict] = None


@router.get("/my-cards", response_model=List[RateCard])
async def get_my_rate_cards(
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get current user's rate cards"""
    return [
        RateCard(
            id="rate-1",
            user_id=str(current_user.id),
            name="Standard Hourly",
            description="My standard hourly rate for development work",
            rate_type=RateType.HOURLY,
            base_rate=75.0,
            currency="USD",
            min_hours=1,
            is_negotiable=True,
            is_default=True,
            created_at=datetime.utcnow()
        ),
        RateCard(
            id="rate-2",
            user_id=str(current_user.id),
            name="Daily Rate",
            description="Full day engagement rate",
            rate_type=RateType.DAILY,
            base_rate=500.0,
            currency="USD",
            min_hours=8,
            is_negotiable=True,
            is_default=False,
            created_at=datetime.utcnow()
        )
    ]


@router.post("/", response_model=RateCard)
async def create_rate_card(
    name: str,
    rate_type: RateType,
    base_rate: float,
    currency: str = "USD",
    description: Optional[str] = None,
    min_hours: Optional[int] = None,
    max_hours: Optional[int] = None,
    is_negotiable: bool = True,
    is_default: bool = False,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new rate card"""
    return RateCard(
        id="rate-new",
        user_id=str(current_user.id),
        name=name,
        description=description,
        rate_type=rate_type,
        base_rate=base_rate,
        currency=currency,
        min_hours=min_hours,
        max_hours=max_hours,
        is_negotiable=is_negotiable,
        is_default=is_default,
        created_at=datetime.utcnow()
    )


@router.get("/{rate_card_id}", response_model=RateCard)
async def get_rate_card(
    rate_card_id: str,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get a specific rate card"""
    return RateCard(
        id=rate_card_id,
        user_id=str(current_user.id),
        name="Standard Hourly",
        rate_type=RateType.HOURLY,
        base_rate=75.0,
        currency="USD",
        is_default=True,
        created_at=datetime.utcnow()
    )


@router.put("/{rate_card_id}", response_model=RateCard)
async def update_rate_card(
    rate_card_id: str,
    name: Optional[str] = None,
    description: Optional[str] = None,
    base_rate: Optional[float] = None,
    is_negotiable: Optional[bool] = None,
    is_default: Optional[bool] = None,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update a rate card"""
    return RateCard(
        id=rate_card_id,
        user_id=str(current_user.id),
        name=name or "Updated Rate",
        rate_type=RateType.HOURLY,
        base_rate=base_rate or 75.0,
        currency="USD",
        is_negotiable=is_negotiable if is_negotiable is not None else True,
        is_default=is_default if is_default is not None else False,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )


@router.delete("/{rate_card_id}")
async def delete_rate_card(
    rate_card_id: str,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a rate card"""
    return {"message": f"Rate card {rate_card_id} deleted"}


@router.get("/{rate_card_id}/packages", response_model=List[ServicePackage])
async def get_service_packages(
    rate_card_id: str,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get service packages for a rate card"""
    return [
        ServicePackage(
            id="pkg-1",
            rate_card_id=rate_card_id,
            name="Basic",
            description="Basic development package",
            price=500.0,
            deliverables=["Source code", "Documentation"],
            estimated_duration="1 week",
            revisions=2,
            is_popular=False
        ),
        ServicePackage(
            id="pkg-2",
            rate_card_id=rate_card_id,
            name="Standard",
            description="Standard development package",
            price=1500.0,
            deliverables=["Source code", "Documentation", "Testing", "Deployment"],
            estimated_duration="2 weeks",
            revisions=3,
            is_popular=True
        ),
        ServicePackage(
            id="pkg-3",
            rate_card_id=rate_card_id,
            name="Premium",
            description="Premium development package with support",
            price=3000.0,
            deliverables=["Source code", "Documentation", "Testing", "Deployment", "30-day support"],
            estimated_duration="3 weeks",
            revisions=5,
            is_popular=False
        )
    ]


@router.post("/{rate_card_id}/packages", response_model=ServicePackage)
async def create_service_package(
    rate_card_id: str,
    name: str,
    description: str,
    price: float,
    deliverables: List[str],
    estimated_duration: str,
    revisions: int = 2,
    is_popular: bool = False,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a service package"""
    return ServicePackage(
        id="pkg-new",
        rate_card_id=rate_card_id,
        name=name,
        description=description,
        price=price,
        deliverables=deliverables,
        estimated_duration=estimated_duration,
        revisions=revisions,
        is_popular=is_popular
    )


@router.put("/packages/{package_id}", response_model=ServicePackage)
async def update_service_package(
    package_id: str,
    name: Optional[str] = None,
    description: Optional[str] = None,
    price: Optional[float] = None,
    deliverables: Optional[List[str]] = None,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update a service package"""
    return ServicePackage(
        id=package_id,
        rate_card_id="rate-1",
        name=name or "Updated Package",
        description=description or "Updated description",
        price=price or 1000.0,
        deliverables=deliverables or ["Deliverable 1"],
        estimated_duration="1 week",
        revisions=3
    )


@router.delete("/packages/{package_id}")
async def delete_service_package(
    package_id: str,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a service package"""
    return {"message": f"Package {package_id} deleted"}


@router.get("/{rate_card_id}/modifiers", response_model=List[RateModifier])
async def get_rate_modifiers(
    rate_card_id: str,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get rate modifiers for a rate card"""
    return [
        RateModifier(
            id="mod-1",
            rate_card_id=rate_card_id,
            name="Rush Fee",
            type="percentage",
            value=25.0,
            conditions={"deadline": "less_than_3_days"}
        ),
        RateModifier(
            id="mod-2",
            rate_card_id=rate_card_id,
            name="Long-term Discount",
            type="percentage",
            value=-10.0,
            conditions={"duration": "more_than_1_month"}
        )
    ]


@router.post("/{rate_card_id}/modifiers", response_model=RateModifier)
async def create_rate_modifier(
    rate_card_id: str,
    name: str,
    type: str,
    value: float,
    conditions: Optional[dict] = None,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a rate modifier"""
    return RateModifier(
        id="mod-new",
        rate_card_id=rate_card_id,
        name=name,
        type=type,
        value=value,
        conditions=conditions
    )


@router.get("/user/{user_id}")
async def get_user_rate_cards(
    user_id: str,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get rate cards for a specific user (public view)"""
    return {
        "user_id": user_id,
        "rate_cards": [
            {
                "id": "rate-1",
                "name": "Standard Hourly",
                "rate_type": "hourly",
                "base_rate": 75.0,
                "currency": "USD",
                "is_negotiable": True
            }
        ],
        "packages": [
            {
                "name": "Basic",
                "price": 500.0,
                "deliverables": ["Source code", "Documentation"]
            }
        ]
    }


@router.post("/calculate")
async def calculate_project_rate(
    rate_card_id: str,
    hours: Optional[int] = None,
    package_id: Optional[str] = None,
    modifiers: Optional[List[str]] = None,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Calculate project cost based on rate card"""
    return {
        "base_rate": 75.0,
        "hours": hours or 0,
        "subtotal": 75.0 * (hours or 0),
        "modifiers_applied": [],
        "total": 75.0 * (hours or 0),
        "currency": "USD"
    }
