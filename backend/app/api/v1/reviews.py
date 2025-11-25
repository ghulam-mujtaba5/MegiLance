# @AI-HINT: Review and Rating Management API - Turso-only, no SQLite fallback
"""
Review and Rating Management API

Handles:
- Review creation (only contract parties)
- Review listing with filters
- Review stats calculation
- Review responses
- Rating aggregation
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from datetime import datetime

from app.db.turso_http import execute_query, parse_rows
from app.core.security import get_current_user_from_token

router = APIRouter()


def get_current_user(token_data: dict = Depends(get_current_user_from_token)):
    """Get current user from token"""
    return token_data


@router.post("/reviews", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_review(
    review_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """
    Create a new review.
    
    Business rules:
    - Only contract parties (client or freelancer) can review
    - Cannot review yourself
    - One review per party per contract
    - Contract must be completed
    """
    user_id = current_user.get("user_id")
    contract_id = review_data.get("contract_id")
    reviewed_user_id = review_data.get("reviewed_user_id")
    
    # Get contract
    result = execute_query(
        "SELECT id, client_id, freelancer_id, status FROM contracts WHERE id = ?",
        [contract_id]
    )
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Contract not found")
    
    rows = parse_rows(result)
    contract = rows[0]
    
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
    result = execute_query(
        "SELECT id FROM reviews WHERE contract_id = ? AND reviewer_id = ? AND reviewed_user_id = ?",
        [contract_id, user_id, reviewed_user_id]
    )
    if result and result.get("rows"):
        raise HTTPException(status_code=400, detail="You have already reviewed this user for this contract")
    
    now = datetime.utcnow().isoformat()
    
    # Create review
    result = execute_query(
        """INSERT INTO reviews (contract_id, reviewer_id, reviewed_user_id, rating, 
                                communication_rating, quality_rating, professionalism_rating, deadline_rating,
                                review_text, is_public, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        [
            contract_id,
            user_id,
            reviewed_user_id,
            review_data.get("rating", 5.0),
            review_data.get("communication_rating"),
            review_data.get("quality_rating"),
            review_data.get("professionalism_rating"),
            review_data.get("deadline_rating"),
            review_data.get("review_text"),
            1 if review_data.get("is_public", True) else 0,
            now,
            now
        ]
    )
    
    if not result:
        raise HTTPException(status_code=500, detail="Failed to create review")
    
    id_result = execute_query("SELECT last_insert_rowid() as id", [])
    new_id = 0
    if id_result and id_result.get("rows"):
        id_rows = parse_rows(id_result)
        if id_rows:
            new_id = id_rows[0].get("id", 0)
    
    return {
        "id": new_id,
        "contract_id": contract_id,
        "reviewer_id": user_id,
        "reviewed_user_id": reviewed_user_id,
        "rating": review_data.get("rating", 5.0),
        "communication_rating": review_data.get("communication_rating"),
        "quality_rating": review_data.get("quality_rating"),
        "professionalism_rating": review_data.get("professionalism_rating"),
        "deadline_rating": review_data.get("deadline_rating"),
        "review_text": review_data.get("review_text"),
        "is_public": review_data.get("is_public", True),
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
    current_user: dict = Depends(get_current_user)
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
        where_clauses.append("reviewed_user_id = ?")
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
        where_clauses.append("(is_public = 1 OR reviewer_id = ? OR reviewed_user_id = ?)")
        params.extend([current_user_id, current_user_id])
    
    if is_public is not None:
        where_clauses.append("is_public = ?")
        params.append(1 if is_public else 0)
    
    where_sql = " AND ".join(where_clauses) if where_clauses else "1=1"
    params.extend([limit, skip])
    
    result = execute_query(
        f"""SELECT id, contract_id, reviewer_id, reviewed_user_id, rating,
                   communication_rating, quality_rating, professionalism_rating, deadline_rating,
                   review_text, response, is_public, created_at, updated_at
            FROM reviews
            WHERE {where_sql}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?""",
        params
    )
    
    if not result:
        return []
    
    rows = parse_rows(result)
    for row in rows:
        row["is_public"] = bool(row.get("is_public"))
    return rows


@router.get("/reviews/stats/{user_id}", response_model=dict)
async def get_review_stats(user_id: int):
    """
    Get aggregated review statistics for a user.
    
    Only includes public reviews in stats.
    """
    # Check user exists
    result = execute_query("SELECT id FROM users WHERE id = ?", [user_id])
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get review stats (only public reviews)
    result = execute_query(
        """SELECT COUNT(*) as total_reviews,
                  AVG(rating) as average_rating,
                  AVG(communication_rating) as avg_communication,
                  AVG(quality_rating) as avg_quality,
                  AVG(professionalism_rating) as avg_professionalism,
                  AVG(deadline_rating) as avg_deadline
           FROM reviews
           WHERE reviewed_user_id = ? AND is_public = 1""",
        [user_id]
    )
    
    stats = {"total_reviews": 0, "average_rating": 0.0}
    if result and result.get("rows"):
        rows = parse_rows(result)
        if rows:
            stats = rows[0]
    
    # Get rating distribution
    rating_distribution = {}
    for i in range(1, 6):
        result = execute_query(
            """SELECT COUNT(*) as count FROM reviews
               WHERE reviewed_user_id = ? AND is_public = 1 AND rating >= ? AND rating < ?""",
            [user_id, i, i + 1]
        )
        count = 0
        if result and result.get("rows"):
            count_rows = parse_rows(result)
            if count_rows:
                count = count_rows[0].get("count", 0)
        rating_distribution[f"{i}_star"] = count
    
    total_reviews = stats.get("total_reviews") or 0
    avg_rating = stats.get("average_rating")
    
    return {
        "user_id": user_id,
        "total_reviews": total_reviews,
        "average_rating": round(float(avg_rating), 2) if avg_rating else 0.0,
        "communication_rating": round(float(stats.get("avg_communication") or 0), 2),
        "quality_rating": round(float(stats.get("avg_quality") or 0), 2),
        "professionalism_rating": round(float(stats.get("avg_professionalism") or 0), 2),
        "deadline_rating": round(float(stats.get("avg_deadline") or 0), 2),
        "rating_distribution": rating_distribution
    }


@router.get("/reviews/{review_id}", response_model=dict)
async def get_review(
    review_id: int,
    current_user: dict = Depends(get_current_user)
):
    """
    Get a specific review.
    
    Private reviews only visible to reviewer, reviewed user, or admin.
    """
    user_id = current_user.get("user_id")
    role = current_user.get("role", "")
    
    result = execute_query(
        """SELECT id, contract_id, reviewer_id, reviewed_user_id, rating,
                  communication_rating, quality_rating, professionalism_rating, deadline_rating,
                  review_text, response, is_public, created_at, updated_at
           FROM reviews WHERE id = ?""",
        [review_id]
    )
    
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Review not found")
    
    rows = parse_rows(result)
    review = rows[0]
    
    # Privacy check
    if not review.get("is_public"):
        if role.lower() != "admin" and user_id not in [review.get("reviewer_id"), review.get("reviewed_user_id")]:
            raise HTTPException(status_code=403, detail="You don't have permission to view this review")
    
    review["is_public"] = bool(review.get("is_public"))
    return review


@router.patch("/reviews/{review_id}", response_model=dict)
async def update_review(
    review_id: int,
    review_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """
    Update a review.
    
    Only the reviewer can update their review.
    Reviewed user can add a response.
    """
    user_id = current_user.get("user_id")
    
    result = execute_query(
        "SELECT id, reviewer_id, reviewed_user_id FROM reviews WHERE id = ?",
        [review_id]
    )
    
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Review not found")
    
    rows = parse_rows(result)
    review = rows[0]
    
    updates = []
    params = []
    
    # Determine what can be updated
    if user_id == review.get("reviewer_id"):
        # Reviewer can update ratings and text
        for field in ["rating", "communication_rating", "quality_rating", "professionalism_rating", 
                      "deadline_rating", "review_text"]:
            if field in review_data:
                updates.append(f"{field} = ?")
                params.append(review_data[field])
        if "is_public" in review_data:
            updates.append("is_public = ?")
            params.append(1 if review_data["is_public"] else 0)
    elif user_id == review.get("reviewed_user_id"):
        # Reviewed user can only add response
        if "response" not in review_data:
            raise HTTPException(status_code=403, detail="You can only add a response to this review")
        updates.append("response = ?")
        params.append(review_data["response"])
    else:
        raise HTTPException(status_code=403, detail="You don't have permission to update this review")
    
    if updates:
        updates.append("updated_at = ?")
        params.append(datetime.utcnow().isoformat())
        params.append(review_id)
        
        execute_query(
            f"UPDATE reviews SET {', '.join(updates)} WHERE id = ?",
            params
        )
    
    # Fetch updated review
    result = execute_query(
        """SELECT id, contract_id, reviewer_id, reviewed_user_id, rating,
                  communication_rating, quality_rating, professionalism_rating, deadline_rating,
                  review_text, response, is_public, created_at, updated_at
           FROM reviews WHERE id = ?""",
        [review_id]
    )
    
    rows = parse_rows(result)
    updated = rows[0] if rows else {}
    updated["is_public"] = bool(updated.get("is_public"))
    return updated


@router.delete("/reviews/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_review(
    review_id: int,
    current_user: dict = Depends(get_current_user)
):
    """
    Delete a review.
    
    Only reviewer or admin can delete.
    """
    user_id = current_user.get("user_id")
    role = current_user.get("role", "")
    
    result = execute_query(
        "SELECT id, reviewer_id FROM reviews WHERE id = ?",
        [review_id]
    )
    
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Review not found")
    
    rows = parse_rows(result)
    review = rows[0]
    
    # Permission check
    if role.lower() != "admin" and user_id != review.get("reviewer_id"):
        raise HTTPException(status_code=403, detail="Only the reviewer or admin can delete this review")
    
    execute_query("DELETE FROM reviews WHERE id = ?", [review_id])
