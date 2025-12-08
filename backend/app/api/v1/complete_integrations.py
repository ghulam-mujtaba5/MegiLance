# @AI-HINT: Complete API Integration - All fixed endpoints with Turso support
"""
API Integration Layer - Replaces stub endpoints with complete implementations
Endpoints for:
- Reviews and Ratings
- Search with FTS5
- Messaging
- Invoicing with tax
- Admin Dashboard
- Analytics
- AI Services (matching, pricing, fraud detection)
"""

from fastapi import APIRouter, Depends, Query, HTTPException, status
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

from app.core.security import get_current_user_from_token
from app.services.review_service_complete import get_review_service
from app.services.search_service_complete import get_search_service
from app.services.messaging_service_complete import get_messaging_service
from app.services.invoicing_service_complete import get_invoicing_service
from app.services.admin_service_complete import get_admin_service
from app.services.analytics_service_complete import get_analytics_service
from app.services.ai_services_complete import (
    get_ai_matching_service,
    get_pricing_service,
    get_fraud_detection_service
)

router = APIRouter()

# ============ SCHEMAS ============

class ReviewCreateRequest(BaseModel):
    contract_id: int
    reviewed_user_id: int
    rating: float = Field(..., ge=1.0, le=5.0)
    communication_rating: Optional[float] = Field(None, ge=1.0, le=5.0)
    quality_rating: Optional[float] = Field(None, ge=1.0, le=5.0)
    professionalism_rating: Optional[float] = Field(None, ge=1.0, le=5.0)
    deadline_rating: Optional[float] = Field(None, ge=1.0, le=5.0)
    review_text: str
    is_public: bool = True

class MessageCreateRequest(BaseModel):
    conversation_id: Optional[int] = None
    receiver_id: Optional[int] = None
    content: str
    message_type: str = "text"

class InvoiceCreateRequest(BaseModel):
    contract_id: int
    items: List[Dict[str, Any]]
    due_date: Optional[str] = None
    notes: str = ""
    tax_rate: Optional[float] = None

# ============ REVIEWS & RATINGS ============

@router.post("/reviews", status_code=status.HTTP_201_CREATED)
async def create_review(
    review: ReviewCreateRequest,
    current_user = Depends(get_current_user_from_token)
):
    """Create a new review"""
    service = get_review_service()
    try:
        result = service.create_review(
            review.contract_id,
            current_user["user_id"],
            review.reviewed_user_id,
            review.rating,
            review.communication_rating,
            review.quality_rating,
            review.professionalism_rating,
            review.deadline_rating,
            review.review_text,
            review.is_public
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/reviews/user/{user_id}")
async def get_user_reviews(
    user_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user = Depends(get_current_user_from_token)
):
    """Get reviews for a user"""
    service = get_review_service()
    reviews = service.get_user_reviews(user_id, skip=skip, limit=limit)
    return {"reviews": reviews, "total": len(reviews)}

@router.get("/reviews/stats/{user_id}")
async def get_review_stats(user_id: int):
    """Get rating statistics for a user"""
    service = get_review_service()
    stats = service.calculate_user_rating_stats(user_id)
    distribution = service.get_rating_distribution(user_id)
    return {**stats, "distribution": distribution}

# ============ SEARCH ============

@router.get("/search/projects")
async def search_projects(
    q: Optional[str] = Query(None),
    category: Optional[str] = None,
    budget_min: Optional[float] = None,
    budget_max: Optional[float] = None,
    sort_by: str = Query("relevance"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user = Depends(get_current_user_from_token)
):
    """Search projects with FTS5"""
    service = get_search_service()
    results = service.search_projects(
        q or "",
        category,
        budget_min,
        budget_max,
        sort_by=sort_by,
        skip=skip,
        limit=limit
    )
    # Log search
    if q:
        service.search_analytics_log(q, current_user.get("user_id"), "projects")
    return results

@router.get("/search/freelancers")
async def search_freelancers(
    q: Optional[str] = Query(None),
    min_rating: Optional[float] = None,
    hourly_rate_max: Optional[float] = None,
    sort_by: str = Query("relevance"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user = Depends(get_current_user_from_token)
):
    """Search freelancers with FTS5"""
    service = get_search_service()
    results = service.search_freelancers(
        q or "",
        min_rating=min_rating,
        hourly_rate_max=hourly_rate_max,
        sort_by=sort_by,
        skip=skip,
        limit=limit
    )
    if q:
        service.search_analytics_log(q, current_user.get("user_id"), "freelancers")
    return results

@router.get("/search/autocomplete")
async def search_autocomplete(
    q: str = Query(..., min_length=2),
    suggestion_type: str = Query("projects"),
    limit: int = Query(10, ge=1, le=50)
):
    """Get autocomplete suggestions"""
    service = get_search_service()
    suggestions = service.autocomplete_suggestions(q, suggestion_type, limit)
    return {"suggestions": suggestions}

@router.get("/search/trending")
async def get_trending_searches(limit: int = Query(10, ge=1, le=50)):
    """Get trending searches"""
    service = get_search_service()
    trending = service.get_trending_searches(limit)
    return {"trending": trending}

# ============ MESSAGING ============

@router.post("/conversations", status_code=status.HTTP_201_CREATED)
async def create_conversation(
    receiver_id: int,
    current_user = Depends(get_current_user_from_token)
):
    """Create or get conversation"""
    service = get_messaging_service()
    result = service.create_conversation(
        current_user["user_id"],
        receiver_id
    )
    return result

@router.post("/messages", status_code=status.HTTP_201_CREATED)
async def send_message(
    message: MessageCreateRequest,
    current_user = Depends(get_current_user_from_token)
):
    """Send a message"""
    service = get_messaging_service()
    if not message.conversation_id:
        raise HTTPException(status_code=400, detail="Conversation ID required")
    
    result = service.send_message(
        message.conversation_id,
        current_user["user_id"],
        message.content,
        message.message_type
    )
    return result

@router.get("/conversations/{conversation_id}/messages")
async def get_messages(
    conversation_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user = Depends(get_current_user_from_token)
):
    """Get messages in a conversation"""
    service = get_messaging_service()
    messages = service.get_conversation_messages(
        conversation_id,
        current_user["user_id"],
        skip=skip,
        limit=limit
    )
    return {"messages": messages}

@router.get("/conversations")
async def get_conversations(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user = Depends(get_current_user_from_token)
):
    """Get user's conversations"""
    service = get_messaging_service()
    conversations = service.get_user_conversations(
        current_user["user_id"],
        skip=skip,
        limit=limit
    )
    return {"conversations": conversations}

# ============ INVOICING ============

@router.post("/invoices", status_code=status.HTTP_201_CREATED)
async def create_invoice(
    invoice: InvoiceCreateRequest,
    current_user = Depends(get_current_user_from_token)
):
    """Create an invoice with tax calculation"""
    service = get_invoicing_service()
    
    # Get contract to verify ownership
    from app.db.turso_http import execute_query, parse_rows
    contract_result = execute_query(
        "SELECT freelancer_id FROM contracts WHERE id = ?",
        [invoice.contract_id]
    )
    
    if not contract_result or not contract_result.get("rows"):
        raise HTTPException(status_code=404, detail="Contract not found")
    
    contract = parse_rows(contract_result)[0]
    if contract.get("freelancer_id") != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Create invoice
    result = service.create_invoice(
        invoice.contract_id,
        current_user["user_id"],
        0,  # Will be set from contract
        invoice.items,
        invoice.due_date,
        invoice.notes,
        tax_rate=invoice.tax_rate
    )
    return result

@router.get("/invoices/{invoice_id}")
async def get_invoice(
    invoice_id: int,
    current_user = Depends(get_current_user_from_token)
):
    """Get invoice details"""
    service = get_invoicing_service()
    invoice = service.get_invoice(invoice_id, current_user["user_id"])
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice

# ============ ADMIN DASHBOARD ============

@router.get("/admin/stats")
async def get_platform_stats(
    current_user = Depends(get_current_user_from_token)
):
    """Get platform statistics (admin only)"""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    service = get_admin_service()
    return service.get_platform_stats()

@router.get("/admin/fraud-alerts")
async def get_fraud_alerts(
    current_user = Depends(get_current_user_from_token)
):
    """Get fraud alerts (admin only)"""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    service = get_admin_service()
    return {"alerts": service.get_fraud_alerts()}

# ============ ANALYTICS ============

@router.get("/analytics/dashboard")
async def get_analytics_dashboard(
    days: int = Query(30, ge=1, le=365),
    current_user = Depends(get_current_user_from_token)
):
    """Get analytics dashboard data"""
    service = get_analytics_service()
    return service.get_dashboard_metrics(days)

@router.get("/analytics/revenue-trend")
async def get_revenue_trend(
    days: int = Query(30, ge=1, le=365),
    current_user = Depends(get_current_user_from_token)
):
    """Get revenue trend"""
    service = get_analytics_service()
    return {"trend": service.get_revenue_trend(days)}

@router.get("/analytics/top-categories")
async def get_top_categories(
    limit: int = Query(10, ge=1, le=50),
    current_user = Depends(get_current_user_from_token)
):
    """Get top categories"""
    service = get_analytics_service()
    return {"categories": service.get_top_categories(limit)}

@router.get("/analytics/top-freelancers")
async def get_top_freelancers(
    limit: int = Query(20, ge=1, le=100),
    current_user = Depends(get_current_user_from_token)
):
    """Get top freelancers"""
    service = get_analytics_service()
    return {"freelancers": service.get_top_freelancers(limit)}

# ============ AI SERVICES ============

@router.get("/ai/matching/freelancers/{project_id}")
async def get_freelancer_matches(
    project_id: int,
    limit: int = Query(10, ge=1, le=50),
    min_score: float = Query(0.5, ge=0.0, le=1.0),
    current_user = Depends(get_current_user_from_token)
):
    """Get AI-powered freelancer matches for a project"""
    service = get_ai_matching_service()
    matches = service.get_freelancer_matches(project_id, limit, min_score)
    return {"matches": matches}

@router.get("/ai/matching/projects/{freelancer_id}")
async def get_project_matches(
    freelancer_id: int,
    limit: int = Query(10, ge=1, le=50),
    min_score: float = Query(0.5, ge=0.0, le=1.0),
    current_user = Depends(get_current_user_from_token)
):
    """Get AI-powered project matches for a freelancer"""
    service = get_ai_matching_service()
    matches = service.get_project_matches(freelancer_id, limit, min_score)
    return {"matches": matches}

@router.post("/ai/pricing/recommend")
async def recommend_pricing(
    skills: List[str] = Query(...),
    experience_level: str = Query("intermediate"),
    location: Optional[str] = None,
    current_user = Depends(get_current_user_from_token)
):
    """Get AI pricing recommendations"""
    service = get_pricing_service()
    recommendation = service.recommend_pricing(
        skills,
        experience_level,
        location
    )
    return recommendation

@router.post("/ai/fraud-check/{user_id}")
async def check_fraud_risk(
    user_id: int,
    current_user = Depends(get_current_user_from_token)
):
    """Check fraud risk for a user"""
    service = get_fraud_detection_service()
    risk_assessment = service.calculate_fraud_risk(user_id)
    return risk_assessment
