# @AI-HINT: Review responses API - Business owner replies to reviews
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from app.db.session import get_db
from app.core.security import get_current_active_user

router = APIRouter(prefix="/review-responses")


class ReviewResponse(BaseModel):
    id: str
    review_id: str
    responder_id: str
    response_text: str
    is_public: bool = True
    created_at: datetime
    updated_at: Optional[datetime] = None


class ResponseTemplate(BaseModel):
    id: str
    user_id: str
    name: str
    content: str
    category: str
    use_count: int


class ReviewWithResponse(BaseModel):
    review_id: str
    reviewer_name: str
    rating: int
    review_text: str
    review_date: datetime
    response: Optional[ReviewResponse] = None
    project_title: str


@router.get("/pending", response_model=List[ReviewWithResponse])
async def get_pending_reviews(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get reviews awaiting response"""
    return [
        ReviewWithResponse(
            review_id=f"review-{i}",
            reviewer_name=f"Client {i}",
            rating=4 + (i % 2),
            review_text="Great work on the project!",
            review_date=datetime.utcnow(),
            response=None,
            project_title=f"Project {i}"
        )
        for i in range(min(limit, 5))
    ]


@router.get("/responded", response_model=List[ReviewWithResponse])
async def get_responded_reviews(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get reviews with responses"""
    return [
        ReviewWithResponse(
            review_id=f"review-{i}",
            reviewer_name=f"Client {i}",
            rating=5,
            review_text="Excellent work!",
            review_date=datetime.utcnow(),
            response=ReviewResponse(
                id=f"response-{i}",
                review_id=f"review-{i}",
                responder_id=str(current_user.id),
                response_text="Thank you for your kind words!",
                created_at=datetime.utcnow()
            ),
            project_title=f"Project {i}"
        )
        for i in range(min(limit, 3))
    ]


@router.post("/{review_id}", response_model=ReviewResponse)
async def respond_to_review(
    review_id: str,
    response_text: str,
    is_public: bool = True,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Respond to a review"""
    return ReviewResponse(
        id="response-new",
        review_id=review_id,
        responder_id=str(current_user.id),
        response_text=response_text,
        is_public=is_public,
        created_at=datetime.utcnow()
    )


@router.put("/{response_id}", response_model=ReviewResponse)
async def update_response(
    response_id: str,
    response_text: str,
    is_public: Optional[bool] = None,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update a review response"""
    return ReviewResponse(
        id=response_id,
        review_id="review-1",
        responder_id=str(current_user.id),
        response_text=response_text,
        is_public=is_public if is_public is not None else True,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )


@router.delete("/{response_id}")
async def delete_response(
    response_id: str,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a review response"""
    return {"message": f"Response {response_id} deleted"}


@router.get("/templates", response_model=List[ResponseTemplate])
async def get_response_templates(
    category: Optional[str] = None,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get response templates"""
    return [
        ResponseTemplate(
            id="template-1",
            user_id=str(current_user.id),
            name="Thank You - Positive",
            content="Thank you so much for your kind words! It was a pleasure working with you.",
            category="positive",
            use_count=15
        ),
        ResponseTemplate(
            id="template-2",
            user_id=str(current_user.id),
            name="Acknowledgment - Constructive",
            content="Thank you for your feedback. I appreciate your insights and will incorporate them in future projects.",
            category="constructive",
            use_count=5
        )
    ]


@router.post("/templates", response_model=ResponseTemplate)
async def create_response_template(
    name: str,
    content: str,
    category: str,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a response template"""
    return ResponseTemplate(
        id="template-new",
        user_id=str(current_user.id),
        name=name,
        content=content,
        category=category,
        use_count=0
    )


@router.put("/templates/{template_id}", response_model=ResponseTemplate)
async def update_response_template(
    template_id: str,
    name: Optional[str] = None,
    content: Optional[str] = None,
    category: Optional[str] = None,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update a response template"""
    return ResponseTemplate(
        id=template_id,
        user_id=str(current_user.id),
        name=name or "Updated Template",
        content=content or "Updated content",
        category=category or "general",
        use_count=5
    )


@router.delete("/templates/{template_id}")
async def delete_response_template(
    template_id: str,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a response template"""
    return {"message": f"Template {template_id} deleted"}


@router.get("/analytics")
async def get_response_analytics(
    days: int = Query(30, ge=1, le=365),
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get review response analytics"""
    return {
        "total_reviews": 45,
        "responded_reviews": 40,
        "pending_reviews": 5,
        "response_rate": 88.9,
        "average_response_time_hours": 4.5,
        "reviews_by_rating": {
            "5": 25,
            "4": 12,
            "3": 5,
            "2": 2,
            "1": 1
        }
    }


@router.post("/ai-suggest")
async def get_ai_response_suggestion(
    review_id: str,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get AI-generated response suggestion"""
    return {
        "review_id": review_id,
        "suggestions": [
            "Thank you for taking the time to share your feedback. I really appreciate your kind words about the project and look forward to working with you again in the future!",
            "I'm thrilled to hear that you were satisfied with the project! Your positive feedback motivates me to continue delivering quality work. Thank you!",
            "Your kind review means a lot to me! It was a pleasure collaborating on this project. I hope we can work together again soon."
        ]
    }

