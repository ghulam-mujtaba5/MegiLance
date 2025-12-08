# @AI-HINT: Email templates API endpoints
"""
Email Templates API - Template management endpoints.

Features:
- List/view templates
- Create custom templates
- Update templates
- Preview with variables
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

from app.db.session import get_db
from app.core.security import get_current_active_user
from app.models.user import User
from app.services.email_templates import (
    get_email_templates_service,
    EmailTemplateType
)

router = APIRouter(prefix="/email-templates", tags=["email-templates"])


# Request/Response Models
class CreateTemplateRequest(BaseModel):
    template_type: EmailTemplateType = EmailTemplateType.CUSTOM
    name: str
    subject: str
    html_body: str
    text_body: str
    variables: List[str] = []


class UpdateTemplateRequest(BaseModel):
    name: Optional[str] = None
    subject: Optional[str] = None
    html_body: Optional[str] = None
    text_body: Optional[str] = None
    variables: Optional[List[str]] = None
    is_active: Optional[bool] = None


class RenderTemplateRequest(BaseModel):
    variables: Dict[str, Any]


class PreviewTemplateRequest(BaseModel):
    sample_data: Optional[Dict[str, Any]] = None


# Endpoints
@router.get("")
async def list_templates(
    include_inactive: bool = False,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """List all email templates."""
    # Admin only
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    service = get_email_templates_service(db)
    templates = await service.list_templates(include_inactive)
    
    return {"templates": templates}


@router.get("/types")
async def list_template_types(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """List all available template types."""
    types = [
        {"type": t.value, "name": t.name.replace("_", " ").title()}
        for t in EmailTemplateType
    ]
    return {"types": types}


@router.get("/{template_id}")
async def get_template(
    template_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Get a specific template."""
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    service = get_email_templates_service(db)
    template = await service.get_template_by_id(template_id)
    
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    
    return {"template": template}


@router.post("")
async def create_template(
    request: CreateTemplateRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Create a custom email template."""
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    service = get_email_templates_service(db)
    
    template = await service.create_template(
        template_type=request.template_type,
        name=request.name,
        subject=request.subject,
        html_body=request.html_body,
        text_body=request.text_body,
        variables=request.variables,
        created_by=current_user["id"]
    )
    
    return {"template": template, "message": "Template created successfully"}


@router.put("/{template_id}")
async def update_template(
    template_id: str,
    request: UpdateTemplateRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Update an email template."""
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    service = get_email_templates_service(db)
    
    updates = request.dict(exclude_unset=True)
    template = await service.update_template(template_id, updates)
    
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    
    return {"template": template, "message": "Template updated successfully"}


@router.delete("/{template_id}")
async def delete_template(
    template_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Delete a custom template (system templates cannot be deleted)."""
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    service = get_email_templates_service(db)
    
    success = await service.delete_template(template_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete template. It may be a system template."
        )
    
    return {"message": "Template deleted successfully"}


@router.post("/{template_id}/preview")
async def preview_template(
    template_id: str,
    request: PreviewTemplateRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Preview a template with sample data."""
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    service = get_email_templates_service(db)
    
    result = await service.preview_template(
        template_id=template_id,
        sample_data=request.sample_data
    )
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    
    return result


@router.post("/{template_id}/duplicate")
async def duplicate_template(
    template_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Duplicate a template."""
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    service = get_email_templates_service(db)
    
    template = await service.duplicate_template(
        template_id=template_id,
        created_by=current_user["id"]
    )
    
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    
    return {"template": template, "message": "Template duplicated successfully"}


@router.post("/render/{template_type}")
async def render_template(
    template_type: EmailTemplateType,
    request: RenderTemplateRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Render a template with provided variables."""
    service = get_email_templates_service(db)
    
    result = await service.render_template(
        template_type=template_type,
        variables=request.variables
    )
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    
    return result
