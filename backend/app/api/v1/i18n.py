# @AI-HINT: Internationalization API endpoints for multi-language support
"""
i18n API - Multi-language support endpoints.

Features:
- Language detection
- Translation retrieval
- User language preferences
- Locale formatting
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime

from app.db.session import get_db
from app.core.security import get_current_active_user, require_admin
from app.models.user import User
from app.services.i18n import InternationalizationService, Language

router = APIRouter()


# Request/Response schemas
class SetLanguageRequest(BaseModel):
    """Set language preference request."""
    language: str


class TranslateRequest(BaseModel):
    """Translation request."""
    keys: List[str]
    language: str = "en"


class AddTranslationRequest(BaseModel):
    """Add translation request."""
    key: str
    translations: dict  # {"en": "Hello", "es": "Hola"}


class DetectLanguageRequest(BaseModel):
    """Language detection request."""
    text: str


class FormatRequest(BaseModel):
    """Format request."""
    value: float
    language: str = "en"
    type: str = "number"  # number, currency, date
    currency: Optional[str] = "USD"


# API Endpoints
@router.get("/languages")
async def get_supported_languages(
    db: Session = Depends(get_db)
):
    """Get list of supported languages."""
    service = InternationalizationService(db)
    
    languages = service.get_supported_languages()
    
    return {
        "languages": languages,
        "default": "en"
    }


@router.get("/translations/{language}")
async def get_translations(
    language: str,
    namespace: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all translations for a language."""
    try:
        lang = Language(language)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported language: {language}"
        )
    
    service = InternationalizationService(db)
    
    translations = service.get_all_translations(lang)
    
    return {
        "language": language,
        "translations": translations,
        "count": len(translations)
    }


@router.post("/translate")
async def translate_keys(
    request: TranslateRequest,
    db: Session = Depends(get_db)
):
    """Translate multiple keys."""
    try:
        lang = Language(request.language)
    except ValueError:
        lang = Language.EN
    
    service = InternationalizationService(db)
    
    translations = service.translate_batch(request.keys, lang)
    
    return {
        "language": request.language,
        "translations": translations
    }


@router.post("/detect")
async def detect_language(
    request: DetectLanguageRequest,
    db: Session = Depends(get_db)
):
    """Detect language from text."""
    service = InternationalizationService(db)
    
    result = service.detect_language(request.text)
    
    return result


@router.get("/user/language")
async def get_user_language(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get user's preferred language."""
    service = InternationalizationService(db)
    
    language = service.get_user_language(current_user.id)
    
    return {
        "user_id": current_user.id,
        "language": language.value,
        "is_rtl": service.is_rtl(language)
    }


@router.put("/user/language")
async def set_user_language(
    request: SetLanguageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Set user's preferred language."""
    try:
        lang = Language(request.language)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported language: {request.language}"
        )
    
    service = InternationalizationService(db)
    
    result = service.set_user_language(current_user.id, lang)
    
    return {
        **result,
        "is_rtl": service.is_rtl(lang)
    }


@router.post("/format/currency")
async def format_currency(
    amount: float,
    currency: str = "USD",
    language: str = "en",
    db: Session = Depends(get_db)
):
    """Format currency for locale."""
    try:
        lang = Language(language)
    except ValueError:
        lang = Language.EN
    
    service = InternationalizationService(db)
    
    formatted = service.format_currency(amount, currency, lang)
    
    return {
        "original": amount,
        "currency": currency,
        "language": language,
        "formatted": formatted
    }


@router.post("/format/number")
async def format_number(
    number: float,
    language: str = "en",
    decimals: int = 2,
    db: Session = Depends(get_db)
):
    """Format number for locale."""
    try:
        lang = Language(language)
    except ValueError:
        lang = Language.EN
    
    service = InternationalizationService(db)
    
    formatted = service.format_number(number, lang, decimals)
    
    return {
        "original": number,
        "language": language,
        "formatted": formatted
    }


@router.post("/format/date")
async def format_date(
    date: datetime,
    language: str = "en",
    format: str = "medium",
    db: Session = Depends(get_db)
):
    """Format date for locale."""
    try:
        lang = Language(language)
    except ValueError:
        lang = Language.EN
    
    if format not in ["short", "medium", "long"]:
        format = "medium"
    
    service = InternationalizationService(db)
    
    formatted = service.format_date(date, lang, format)
    
    return {
        "original": date.isoformat(),
        "language": language,
        "format": format,
        "formatted": formatted
    }


@router.post("/translations/add", include_in_schema=False)
async def add_translation(
    request: AddTranslationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    _admin = Depends(require_admin)
):
    """Add a new translation (admin only)."""
    service = InternationalizationService(db)
    
    result = service.add_translation(
        key=request.key,
        translations=request.translations
    )
    
    return result


@router.get("/rtl/{language}")
async def check_rtl(
    language: str,
    db: Session = Depends(get_db)
):
    """Check if a language is RTL."""
    try:
        lang = Language(language)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported language: {language}"
        )
    
    service = InternationalizationService(db)
    
    return {
        "language": language,
        "is_rtl": service.is_rtl(lang)
    }
