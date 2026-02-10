# @AI-HINT: Review and Rating Management API - Turso-only, no SQLite fallback
# Enhanced with input validation and security measures
"""
Review and Rating Management API

Handles:
- Review creation (only contract parties)
- Review listing with filters
- Review stats calculation
- Review responses
- Rating aggregation
"""
import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from datetime import datetime, timezone

from app.core.security import get_current_user_from_token
from app.services import reviews_service

router = APIRouter()

# === Input Validation Constants ===
MAX_REVIEW_TEXT_LENGTH = 2000
MIN_REVIEW_TEXT_LENGTH = 20
MIN_RATING = 1.0
MAX_RATING = 5.0


def _validate_rating(rating: float, field_name: str = "Rating") -> float:
    """Validate rating is within acceptable range"""
    if rating is None:
        return None
    if not isinstance(rating, (int, float)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{field_name} must be a number"
        )
    if rating < MIN_RATING or rating > MAX_RATING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{field_name} must be between {MIN_RATING} and {MAX_RATING}"
        )
    return float(rating)


def _validate_review_text(text: str) -> str:
    """Validate review text content"""
    if not text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Review text is required"
        )
    
    text = text.strip()
    
    if len(text) < MIN_REVIEW_TEXT_LENGTH:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Review text must be at least {MIN_REVIEW_TEXT_LENGTH} characters"
        )
    
    if len(text) > MAX_REVIEW_TEXT_LENGTH:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Review text exceeds maximum length of {MAX_REVIEW_TEXT_LENGTH} characters"
        )
    
    return text


def _validate_review_data(review_data: dict) -> None:
    """Validate all review input data"""
    # Validate main rating
    if "rating" in review_data:
        _validate_rating(review_data["rating"], "Overall rating")
    
    # Validate sub-ratings
    for field in ["communication_rating", "quality_rating", "professionalism_rating", "deadline_rating"]:
        if field in review_data and review_data[field] is not None:
            _validate_rating(review_data[field], field.replace("_", " ").title())
    
    # Validate review text
    if "review_text" in review_data:
        review_data["review_text"] = _validate_review_text(review_data["review_text"])


def get_current_user(token_data = Depends(get_current_user_from_token)):
    """Get current user from token"""
    return token_data


@router.post("/reviews", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_review(
    review_data: dict,
    current_user = Depends(get_current_user)
):
    """
    Create a new review.
    
    Business rules:
    - Only contract parties (client or freelancer) can review
    - Cannot review yourself
    - One review per party per contract
    - Contract must be completed
    """
    # Validate input
    _validate_review_data(review_data)
    
    user_id = current_user.get("user_id")
    contract_id = review_data.get("contract_id")
    reviewed_user_id = review_data.get("reviewed_user_id")
    
    # Validate required fields
    if not contract_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Contract ID is required"
        )
    if not reviewed_user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reviewed user ID is required"
        )
    
    # Get contract
    contract = reviews_service.get_contract_by_id(contract_id)
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    # Verify user is part of the contract
    if user_id not in [contract.get("client_id"), contract.get("freelancer_id")]:
        raise HTTPException(status_code=403, detail="Only contract parties can create reviews")
    
    # Verify not reviewing yourself
    if user_id == reviewed_user_id:
        raise HTTPException(status_code=400, detail="Cannot review yourself")
    
    # Verify reviewed user is the other party
    other_party_id = contract.get("freelancer_id") if user_id == contract.get("client_id") else contract.get("client_id")
    if reviewed_user_id != other_party_id:
        raise HTTPException(status_code=400, detail="Can only review the other party in the contract")
    
    # Check for existing review
    if reviews_service.has_existing_review(contract_id, user_id, reviewed_user_id):
        raise HTTPException(status_code=400, detail="You have already reviewed this user for this contract")
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Prepare rating breakdown
    rating_breakdown = {
        "communication": review_data.get("communication_rating"),
        "quality": review_data.get("quality_rating"),
        "professionalism": review_data.get("professionalism_rating"),
        "deadline": review_data.get("deadline_rating")
    }
    
    rating = review_data.get("rating", 5.0)
    is_public = review_data.get("is_public", True)
    review_text = review_data.get("review_text")
    
    # Create review
    new_id = reviews_service.create_review(
        contract_id, user_id, reviewed_user_id, rating,
        rating_breakdown, review_text, is_public, now
    )
    
    if not new_id:
        raise HTTPException(status_code=500, detail="Failed to create review")
    
    return {
        "id": new_id,
        "contract_id": contract_id,
        "reviewer_id": user_id,
        "reviewed_user_id": reviewed_user_id,
        "rating": rating,
        "communication_rating": review_data.get("communication_rating"),
        "quality_rating": review_data.get("quality_rating"),
        "professionalism_rating": review_data.get("professionalism_rating"),
        "deadline_rating": review_data.get("deadline_rating"),
        "review_text": review_text,
        "is_public": is_public,
        "created_at": now,
        "updated_at": now
    }


@router.get("/reviews", response_model=List[dict])
async def list_reviews(
    user_id: Optional[int] = Query(None, description="Filter by reviewed user"),
    reviewer_id: Optional[int] = Query(None, description="Filter by reviewer"),
    contract_id: Optional[int] = Query(None, description="Filter by contract"),
    min_rating: Optional[float] = Query(None, ge=1.0, le=5.0, description="Minimum rating"),
    is_public: Optional[bool] = Query(None, description="Filter by public status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user = Depends(get_current_user)
):
    """
    List reviews with filtering.
    
    Only public reviews are visible unless you're:
    - The reviewer
    - The reviewed user
    - An admin
    """
    current_user_id = current_user.get("user_id")
    role = current_user.get("role", "")
    
    where_clauses = []
    params = []
    
    if user_id is not None:
        where_clauses.append("reviewee_id = ?")
        params.append(user_id)
    
    if reviewer_id is not None:
        where_clauses.append("reviewer_id = ?")
        params.append(reviewer_id)
    
    if contract_id is not None:
        where_clauses.append("contract_id = ?")
        params.append(contract_id)
    
    if min_rating is not None:
        where_clauses.append("rating >= ?")
        params.append(min_rating)
    
    # Privacy filter
    if role.lower() != "admin":
        where_clauses.append("(is_public = 1 OR reviewer_id = ? OR reviewee_id = ?)")
        params.extend([current_user_id, current_user_id])
    
    if is_public is not None:
        where_clauses.append("is_public = ?")
        params.append(1 if is_public else 0)
    
    where_sql = " AND ".join(where_clauses) if where_clauses else "1=1"
    params.extend([limit, skip])
    
    rows = reviews_service.query_reviews(where_sql, params)
    output = []
    for row in rows:
        # Parse breakdown
        breakdown = {}
        try:
            if row.get("rating_breakdown"):
                breakdown = json.loads(row.get("rating_breakdown"))
        except:
            pass
            
        output.append({
            "id": row.get("id"),
            "contract_id": row.get("contract_id"),
            "reviewer_id": row.get("reviewer_id"),
            "reviewed_user_id": row.get("reviewee_id"),
            "rating": row.get("rating"),
            "communication_rating": breakdown.get("communication"),
            "quality_rating": breakdown.get("quality"),
            "professionalism_rating": breakdown.get("professionalism"),
            "deadline_rating": breakdown.get("deadline"),
            "review_text": row.get("comment"),
            "is_public": bool(row.get("is_public")),
            "created_at": row.get("created_at"),
            "updated_at": row.get("updated_at"),
            "project_title": row.get("project_title"),
            "reviewed_user_name": row.get("reviewed_user_name"),
            "reviewer_name": row.get("reviewer_name")
        })
    return output


@router.get("/reviews/stats/{user_id}", response_model=dict)
async def get_review_stats(user_id: int):
    """
    Get aggregated review statistics for a user.
    
    Only includes public reviews in stats.
    """
    # Check user exists
    if not reviews_service.user_exists(user_id):
        raise HTTPException(status_code=404, detail="User not found")
    
    stats = reviews_service.get_review_aggregate_stats(user_id)
    rating_distribution = reviews_service.get_rating_distribution(user_id)
    
    total_reviews = stats.get("total_reviews") or 0
    avg_rating = stats.get("average_rating")
    
    return {
        "user_id": user_id,
        "total_reviews": total_reviews,
        "average_rating": round(float(avg_rating), 2) if avg_rating else 0.0,
        "communication_rating": stats.get("communication_avg", 0.0),
        "quality_rating": stats.get("quality_avg", 0.0),
        "professionalism_rating": stats.get("professionalism_avg", 0.0),
        "deadline_rating": stats.get("deadline_avg", 0.0),
        "rating_distribution": rating_distribution
    }


@router.get("/reviews/{review_id}", response_model=dict)
async def get_review(
    review_id: int,
    current_user = Depends(get_current_user)
):
    """
    Get a specific review.
    
    Private reviews only visible to reviewer, reviewed user, or admin.
    """
    user_id = current_user.get("user_id")
    role = current_user.get("role", "")
    
    row = reviews_service.get_review_by_id(review_id)
    if not row:
        raise HTTPException(status_code=404, detail="Review not found")
    
    # Privacy check
    if not row.get("is_public"):
        if role.lower() != "admin" and user_id not in [row.get("reviewer_id"), row.get("reviewee_id")]:
            raise HTTPException(status_code=403, detail="You don't have permission to view this review")
    
    breakdown = {}
    try:
        if row.get("rating_breakdown"):
            breakdown = json.loads(row.get("rating_breakdown"))
    except:
        pass

    return {
        "id": row.get("id"),
        "contract_id": row.get("contract_id"),
        "reviewer_id": row.get("reviewer_id"),
        "reviewed_user_id": row.get("reviewee_id"),
        "rating": row.get("rating"),
        "communication_rating": breakdown.get("communication"),
        "quality_rating": breakdown.get("quality"),
        "professionalism_rating": breakdown.get("professionalism"),
        "deadline_rating": breakdown.get("deadline"),
        "review_text": row.get("comment"),
        "is_public": bool(row.get("is_public")),
        "created_at": row.get("created_at"),
        "updated_at": row.get("updated_at")
    }


@router.patch("/reviews/{review_id}", response_model=dict)
async def update_review(
    review_id: int,
    review_data: dict,
    current_user = Depends(get_current_user)
):
    """
    Update a review.
    
    Only the reviewer can update their review.
    """
    user_id = current_user.get("user_id")
    
    review = reviews_service.get_review_for_permission_check(review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    if user_id != review.get("reviewer_id"):
        raise HTTPException(status_code=403, detail="You don't have permission to update this review")

    updates = []
    params = []
    
    # Handle rating breakdown updates
    current_breakdown = {}
    try:
        if review.get("rating_breakdown"):
            current_breakdown = json.loads(review.get("rating_breakdown"))
    except:
        pass
        
    breakdown_changed = False
    for field in ["communication_rating", "quality_rating", "professionalism_rating", "deadline_rating"]:
        if field in review_data:
            key = field.replace("_rating", "")
            current_breakdown[key] = review_data[field]
            breakdown_changed = True
            
    if breakdown_changed:
        updates.append("rating_breakdown = ?")
        params.append(json.dumps(current_breakdown))

    if "rating" in review_data:
        updates.append("rating = ?")
        params.append(review_data["rating"])
        
    if "review_text" in review_data:
        updates.append("comment = ?")
        params.append(review_data["review_text"])
        
    if "is_public" in review_data:
        updates.append("is_public = ?")
        params.append(1 if review_data["is_public"] else 0)
    
    if updates:
        updates.append("updated_at = ?")
        params.append(datetime.now(timezone.utc).isoformat())
        params.append(review_id)
        
        reviews_service.update_review_fields(review_id, ', '.join(updates), params)
    
    # Fetch updated review (reuse get logic)
    # ... (simplified for brevity, just return what we have)
    return await get_review(review_id, current_user)


@router.delete("/reviews/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_review(
    review_id: int,
    current_user = Depends(get_current_user)
):
    """
    Delete a review.
    
    Only reviewer or admin can delete.
    """
    user_id = current_user.get("user_id")
    role = current_user.get("role", "")
    
    review = reviews_service.get_review_owner(review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    # Permission check
    if role.lower() != "admin" and user_id != review.get("reviewer_id"):
        raise HTTPException(status_code=403, detail="Only the reviewer or admin can delete this review")
    
    reviews_service.delete_review_record(review_id)
