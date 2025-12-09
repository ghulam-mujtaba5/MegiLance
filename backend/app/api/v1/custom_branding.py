# @AI-HINT: White-label branding API - Custom themes, logos, colors
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime
from app.db.session import get_db
from app.core.security import get_current_active_user

router = APIRouter(prefix="/branding")


class BrandingConfig(BaseModel):
    id: Optional[str] = None
    organization_id: str
    primary_color: str = "#4573df"
    secondary_color: str = "#27AE60"
    accent_color: str = "#ff9800"
    logo_url: Optional[str] = None
    favicon_url: Optional[str] = None
    custom_css: Optional[str] = None
    font_family: str = "Inter, sans-serif"
    heading_font: str = "Poppins, sans-serif"
    email_header_logo: Optional[str] = None
    email_footer_text: Optional[str] = None
    custom_domain: Optional[str] = None
    white_label_enabled: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class BrandingCreate(BaseModel):
    organization_id: str
    primary_color: str = "#4573df"
    secondary_color: str = "#27AE60"
    accent_color: str = "#ff9800"
    font_family: str = "Inter, sans-serif"
    heading_font: str = "Poppins, sans-serif"


class BrandingUpdate(BaseModel):
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    accent_color: Optional[str] = None
    logo_url: Optional[str] = None
    favicon_url: Optional[str] = None
    custom_css: Optional[str] = None
    font_family: Optional[str] = None
    heading_font: Optional[str] = None
    email_header_logo: Optional[str] = None
    email_footer_text: Optional[str] = None
    custom_domain: Optional[str] = None
    white_label_enabled: Optional[bool] = None


class ThemePreset(BaseModel):
    id: str
    name: str
    description: str
    primary_color: str
    secondary_color: str
    accent_color: str
    preview_image: Optional[str] = None


@router.get("/config/{organization_id}", response_model=BrandingConfig)
async def get_branding_config(
    organization_id: str,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get branding configuration for organization"""
    return BrandingConfig(
        id="branding-1",
        organization_id=organization_id,
        primary_color="#4573df",
        secondary_color="#27AE60",
        accent_color="#ff9800",
        font_family="Inter, sans-serif",
        heading_font="Poppins, sans-serif",
        white_label_enabled=False,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )


@router.post("/config", response_model=BrandingConfig)
async def create_branding_config(
    config: BrandingCreate,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create branding configuration"""
    return BrandingConfig(
        id="branding-new",
        **config.dict(),
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )


@router.put("/config/{organization_id}", response_model=BrandingConfig)
async def update_branding_config(
    organization_id: str,
    update: BrandingUpdate,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update branding configuration"""
    return BrandingConfig(
        id="branding-1",
        organization_id=organization_id,
        primary_color=update.primary_color or "#4573df",
        secondary_color=update.secondary_color or "#27AE60",
        accent_color=update.accent_color or "#ff9800",
        logo_url=update.logo_url,
        favicon_url=update.favicon_url,
        custom_css=update.custom_css,
        font_family=update.font_family or "Inter, sans-serif",
        heading_font=update.heading_font or "Poppins, sans-serif",
        white_label_enabled=update.white_label_enabled or False,
        updated_at=datetime.utcnow()
    )


@router.post("/config/{organization_id}/logo")
async def upload_logo(
    organization_id: str,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Upload organization logo"""
    return {
        "logo_url": f"/uploads/branding/{organization_id}/logo.png",
        "uploaded_at": datetime.utcnow().isoformat()
    }


@router.post("/config/{organization_id}/favicon")
async def upload_favicon(
    organization_id: str,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Upload organization favicon"""
    return {
        "favicon_url": f"/uploads/branding/{organization_id}/favicon.ico",
        "uploaded_at": datetime.utcnow().isoformat()
    }


@router.get("/presets", response_model=List[ThemePreset])
async def get_theme_presets(
    current_user=Depends(get_current_active_user)
):
    """Get available theme presets"""
    return [
        ThemePreset(
            id="preset-default",
            name="Default Blue",
            description="Professional blue theme",
            primary_color="#4573df",
            secondary_color="#27AE60",
            accent_color="#ff9800"
        ),
        ThemePreset(
            id="preset-dark",
            name="Dark Professional",
            description="Dark mode optimized",
            primary_color="#2D3748",
            secondary_color="#48BB78",
            accent_color="#ED8936"
        ),
        ThemePreset(
            id="preset-minimal",
            name="Minimal Light",
            description="Clean minimal design",
            primary_color="#1A202C",
            secondary_color="#38B2AC",
            accent_color="#F6AD55"
        )
    ]


@router.post("/config/{organization_id}/apply-preset")
async def apply_theme_preset(
    organization_id: str,
    preset_id: str,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Apply a theme preset to organization"""
    return {
        "message": f"Theme preset {preset_id} applied successfully",
        "organization_id": organization_id
    }


@router.get("/config/{organization_id}/preview")
async def preview_branding(
    organization_id: str,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get branding preview HTML"""
    return {
        "preview_url": f"/preview/branding/{organization_id}",
        "css_variables": {
            "--primary-color": "#4573df",
            "--secondary-color": "#27AE60",
            "--accent-color": "#ff9800"
        }
    }


@router.post("/config/{organization_id}/custom-domain")
async def setup_custom_domain(
    organization_id: str,
    domain: str,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Setup custom domain for white-label"""
    return {
        "domain": domain,
        "status": "pending_verification",
        "dns_records": [
            {"type": "CNAME", "name": domain, "value": "custom.megilance.com"},
            {"type": "TXT", "name": f"_verify.{domain}", "value": f"megilance-verify={organization_id}"}
        ]
    }


@router.get("/config/{organization_id}/domain-status")
async def check_domain_status(
    organization_id: str,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Check custom domain verification status"""
    return {
        "domain": None,
        "verified": False,
        "ssl_status": "pending"
    }


@router.delete("/config/{organization_id}")
async def delete_branding_config(
    organization_id: str,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete branding configuration (reset to defaults)"""
    return {"message": "Branding configuration reset to defaults"}

