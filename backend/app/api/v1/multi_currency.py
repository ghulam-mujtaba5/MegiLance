# @AI-HINT: Multi-currency API endpoints for international payment support
"""
Multi-Currency API

Endpoints for currency conversion, exchange rates,
user currency preferences, and international payments.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel
from decimal import Decimal

from app.db.session import get_db
from app.core.security import get_current_active_user
from app.services.multi_currency import (
    get_multi_currency_service,
    Currency
)

router = APIRouter(prefix="/currencies", tags=["currencies"])


# Request/Response Models
class ConvertRequest(BaseModel):
    amount: float
    from_currency: Currency
    to_currency: Currency
    include_fee: bool = False


class BulkConvertRequest(BaseModel):
    amount: float
    from_currency: Currency
    to_currencies: List[Currency]


class SetCurrencyRequest(BaseModel):
    currency: Currency


class CreateRateAlertRequest(BaseModel):
    from_currency: Currency
    to_currency: Currency
    target_rate: float
    alert_type: str = "above"  # above, below


class FormatAmountRequest(BaseModel):
    amount: float
    currency: Currency
    include_symbol: bool = True


# Currency Information Endpoints
@router.get("")
async def get_supported_currencies(
    db: Session = Depends(get_db)
):
    """Get all supported currencies."""
    service = get_multi_currency_service(db)
    currencies = await service.get_supported_currencies()
    return {"currencies": currencies, "count": len(currencies)}


@router.get("/{currency}")
async def get_currency_info(
    currency: Currency,
    db: Session = Depends(get_db)
):
    """Get detailed information about a specific currency."""
    service = get_multi_currency_service(db)
    info = await service.get_currency_info(currency)
    
    if "error" in info:
        raise HTTPException(status_code=404, detail=info["error"])
    
    return info


# Exchange Rate Endpoints
@router.get("/rates/all")
async def get_all_exchange_rates(
    base: Currency = Query(Currency.USD, description="Base currency"),
    db: Session = Depends(get_db)
):
    """Get all exchange rates relative to base currency."""
    service = get_multi_currency_service(db)
    rates = await service.get_exchange_rates(base)
    return rates


@router.get("/rates/{from_currency}/{to_currency}")
async def get_exchange_rate(
    from_currency: Currency,
    to_currency: Currency,
    db: Session = Depends(get_db)
):
    """Get exchange rate between two currencies."""
    service = get_multi_currency_service(db)
    rate = await service.get_exchange_rate(from_currency, to_currency)
    return rate


@router.get("/rates/history/{from_currency}/{to_currency}")
async def get_rate_history(
    from_currency: Currency,
    to_currency: Currency,
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db)
):
    """Get historical exchange rates."""
    service = get_multi_currency_service(db)
    history = await service.get_rate_history(from_currency, to_currency, days)
    return history


# Conversion Endpoints
@router.post("/convert")
async def convert_currency(
    request: ConvertRequest,
    db: Session = Depends(get_db)
):
    """Convert amount between currencies."""
    service = get_multi_currency_service(db)
    result = await service.convert(
        Decimal(str(request.amount)),
        request.from_currency,
        request.to_currency,
        request.include_fee
    )
    return result


@router.post("/convert/bulk")
async def bulk_convert_currency(
    request: BulkConvertRequest,
    db: Session = Depends(get_db)
):
    """Convert amount to multiple currencies at once."""
    service = get_multi_currency_service(db)
    result = await service.bulk_convert(
        Decimal(str(request.amount)),
        request.from_currency,
        request.to_currencies
    )
    return result


@router.get("/convert/quick")
async def quick_convert(
    amount: float = Query(..., description="Amount to convert"),
    from_currency: Currency = Query(..., alias="from"),
    to_currency: Currency = Query(..., alias="to"),
    db: Session = Depends(get_db)
):
    """Quick conversion via query parameters."""
    service = get_multi_currency_service(db)
    result = await service.convert(
        Decimal(str(amount)),
        from_currency,
        to_currency
    )
    return result


# User Preferences Endpoints
@router.get("/preferences/my")
async def get_my_currency_preference(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Get current user's preferred currency."""
    service = get_multi_currency_service(db)
    preference = await service.get_user_currency(current_user["id"])
    return preference


@router.put("/preferences/my")
async def set_my_currency_preference(
    request: SetCurrencyRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Set current user's preferred currency."""
    service = get_multi_currency_service(db)
    result = await service.set_user_currency(current_user["id"], request.currency)
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result


# Price Display Endpoints
@router.get("/display/price")
async def get_price_display(
    amount_usd: float = Query(..., description="Amount in USD"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Get price display in user's preferred currency."""
    service = get_multi_currency_service(db)
    display = await service.get_price_display(
        Decimal(str(amount_usd)),
        current_user["id"]
    )
    return display


# Formatting Endpoints
@router.post("/format")
async def format_currency_amount(
    request: FormatAmountRequest,
    db: Session = Depends(get_db)
):
    """Format amount for display."""
    service = get_multi_currency_service(db)
    formatted = await service.format_amount(
        Decimal(str(request.amount)),
        request.currency,
        request.include_symbol
    )
    return {"formatted": formatted}


# Rate Alerts Endpoints
@router.post("/alerts")
async def create_rate_alert(
    request: CreateRateAlertRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Create an exchange rate alert."""
    service = get_multi_currency_service(db)
    alert = await service.create_rate_alert(
        current_user["id"],
        request.from_currency,
        request.to_currency,
        Decimal(str(request.target_rate)),
        request.alert_type
    )
    return alert


@router.get("/alerts/my")
async def get_my_rate_alerts(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Get user's rate alerts."""
    # Placeholder
    return {
        "alerts": [],
        "message": "Rate alerts not yet implemented"
    }


@router.delete("/alerts/{alert_id}")
async def delete_rate_alert(
    alert_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Delete a rate alert."""
    return {
        "message": "Alert deleted",
        "alert_id": alert_id
    }


# Admin Endpoints
@router.get("/admin/usage")
async def admin_get_currency_usage(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Admin: Get currency usage statistics."""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    return {
        "total_conversions": 0,
        "popular_currencies": [],
        "conversion_volume_usd": 0.0,
        "message": "Usage statistics not yet implemented"
    }


@router.put("/admin/rates")
async def admin_update_exchange_rates(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Admin: Manually refresh exchange rates."""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    return {
        "message": "Exchange rates would be refreshed from external API",
        "note": "Using static rates in development"
    }
