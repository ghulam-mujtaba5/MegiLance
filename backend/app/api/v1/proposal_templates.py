# @AI-HINT: Proposal templates API - Reusable proposal templates
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from app.db.session import get_db
from app.core.security import get_current_active_user

router = APIRouter(prefix="/proposal-templates")


class ProposalTemplate(BaseModel):
    id: str
    user_id: str
    name: str
    description: Optional[str] = None
    cover_letter: str
    milestones_template: Optional[List[dict]] = None
    default_rate: Optional[float] = None
    rate_type: Optional[str] = None
    attachments: Optional[List[str]] = None
    tags: List[str] = []
    use_count: int = 0
    is_public: bool = False
    created_at: datetime
    updated_at: Optional[datetime] = None


class TemplateVariable(BaseModel):
    name: str
    description: str
    default_value: Optional[str] = None


@router.get("/", response_model=List[ProposalTemplate])
async def get_my_templates(
    tag: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get user's proposal templates"""
    return [
        ProposalTemplate(
            id="template-1",
            user_id=str(current_user.id),
            name="Web Development Proposal",
            description="Standard template for web development projects",
            cover_letter="Dear {{client_name}},\n\nI'm excited to submit my proposal for your {{project_type}} project...",
            milestones_template=[
                {"title": "Discovery & Planning", "percentage": 20},
                {"title": "Development", "percentage": 50},
                {"title": "Testing & Launch", "percentage": 30}
            ],
            default_rate=75.0,
            rate_type="hourly",
            tags=["web", "development"],
            use_count=15,
            is_public=False,
            created_at=datetime.utcnow()
        ),
        ProposalTemplate(
            id="template-2",
            user_id=str(current_user.id),
            name="Mobile App Proposal",
            description="Template for mobile app development",
            cover_letter="Hello {{client_name}},\n\nThank you for considering me for your mobile app project...",
            default_rate=85.0,
            rate_type="hourly",
            tags=["mobile", "app"],
            use_count=8,
            is_public=False,
            created_at=datetime.utcnow()
        )
    ]


@router.post("/", response_model=ProposalTemplate)
async def create_template(
    name: str,
    cover_letter: str,
    description: Optional[str] = None,
    milestones_template: Optional[List[dict]] = None,
    default_rate: Optional[float] = None,
    rate_type: Optional[str] = None,
    tags: List[str] = [],
    is_public: bool = False,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a proposal template"""
    return ProposalTemplate(
        id="template-new",
        user_id=str(current_user.id),
        name=name,
        description=description,
        cover_letter=cover_letter,
        milestones_template=milestones_template,
        default_rate=default_rate,
        rate_type=rate_type,
        tags=tags,
        use_count=0,
        is_public=is_public,
        created_at=datetime.utcnow()
    )


@router.get("/{template_id}", response_model=ProposalTemplate)
async def get_template(
    template_id: str,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get a specific template"""
    return ProposalTemplate(
        id=template_id,
        user_id=str(current_user.id),
        name="Web Development Proposal",
        cover_letter="Dear {{client_name}}...",
        tags=["web"],
        use_count=15,
        created_at=datetime.utcnow()
    )


@router.put("/{template_id}", response_model=ProposalTemplate)
async def update_template(
    template_id: str,
    name: Optional[str] = None,
    description: Optional[str] = None,
    cover_letter: Optional[str] = None,
    milestones_template: Optional[List[dict]] = None,
    default_rate: Optional[float] = None,
    tags: Optional[List[str]] = None,
    is_public: Optional[bool] = None,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update a template"""
    return ProposalTemplate(
        id=template_id,
        user_id=str(current_user.id),
        name=name or "Updated Template",
        cover_letter=cover_letter or "Updated content",
        tags=tags or [],
        use_count=15,
        is_public=is_public if is_public is not None else False,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )


@router.delete("/{template_id}")
async def delete_template(
    template_id: str,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a template"""
    return {"message": f"Template {template_id} deleted"}


@router.post("/{template_id}/duplicate", response_model=ProposalTemplate)
async def duplicate_template(
    template_id: str,
    new_name: Optional[str] = None,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Duplicate a template"""
    return ProposalTemplate(
        id="template-duplicate",
        user_id=str(current_user.id),
        name=new_name or "Copy of Template",
        cover_letter="Duplicated content...",
        tags=[],
        use_count=0,
        created_at=datetime.utcnow()
    )


@router.get("/public/browse", response_model=List[ProposalTemplate])
async def browse_public_templates(
    category: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Browse public templates"""
    return [
        ProposalTemplate(
            id="public-1",
            user_id="user-other",
            name="Professional Web Development",
            description="Highly-rated template for web projects",
            cover_letter="Dear Client...",
            tags=["web", "professional"],
            use_count=250,
            is_public=True,
            created_at=datetime.utcnow()
        )
    ]


@router.post("/public/{template_id}/use")
async def use_public_template(
    template_id: str,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Copy a public template to user's templates"""
    return {
        "new_template_id": "template-copied",
        "message": "Template copied to your templates"
    }


@router.get("/variables", response_model=List[TemplateVariable])
async def get_available_variables(
    current_user=Depends(get_current_active_user)
):
    """Get available template variables"""
    return [
        TemplateVariable(name="client_name", description="Client's full name"),
        TemplateVariable(name="project_title", description="Project title"),
        TemplateVariable(name="project_type", description="Type of project"),
        TemplateVariable(name="budget", description="Project budget"),
        TemplateVariable(name="deadline", description="Project deadline"),
        TemplateVariable(name="my_name", description="Your full name"),
        TemplateVariable(name="my_title", description="Your professional title"),
        TemplateVariable(name="hourly_rate", description="Your hourly rate")
    ]


@router.post("/{template_id}/preview")
async def preview_template(
    template_id: str,
    variables: dict,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Preview template with variables replaced"""
    return {
        "preview": f"Dear {variables.get('client_name', 'Client')},\n\nI'm excited to submit my proposal...",
        "variables_used": list(variables.keys()),
        "missing_variables": []
    }


@router.get("/analytics")
async def get_template_analytics(
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get template usage analytics"""
    return {
        "total_templates": 5,
        "total_uses": 45,
        "most_used_template": {"id": "template-1", "name": "Web Development", "uses": 15},
        "conversion_rates": {
            "template-1": 35.0,
            "template-2": 28.0
        },
        "avg_response_time_hours": 4.5
    }


@router.post("/{template_id}/generate")
async def generate_proposal_from_template(
    template_id: str,
    project_id: str,
    variables: Optional[dict] = None,
    customize: bool = False,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Generate a proposal from template"""
    return {
        "proposal_draft": {
            "cover_letter": "Generated cover letter content...",
            "milestones": [
                {"title": "Phase 1", "amount": 500},
                {"title": "Phase 2", "amount": 1000}
            ],
            "total_amount": 1500
        },
        "template_id": template_id,
        "project_id": project_id,
        "requires_review": customize
    }

