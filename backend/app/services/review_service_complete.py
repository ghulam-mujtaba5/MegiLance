# @AI-HINT: Complete Review and Rating Service - Full implementation with Turso
"""
Complete Review Service with:
- Review CRUD operations
- Rating aggregation
- Statistical calculations
- Moderation logic
- Response handling
"""

import json
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from app.db.turso_http import execute_query, parse_rows

class ReviewService:
    """Complete review management service using Turso"""
    
    @staticmethod
    def create_review(
        contract_id: int,
        reviewer_id: int,
        reviewee_id: int,
        rating: float,
        communication_rating: Optional[float] = None,
        quality_rating: Optional[float] = None,
        professionalism_rating: Optional[float] = None,
        deadline_rating: Optional[float] = None,
        review_text: str = None,
        is_public: bool = True
    ) -> Dict[str, Any]:
        """Create a new review"""
        now = datetime.now(timezone.utc).isoformat()
        
        rating_breakdown = {
            "communication": communication_rating,
            "quality": quality_rating,
            "professionalism": professionalism_rating,
            "deadline": deadline_rating
        }
        
        result = execute_query(
            """INSERT INTO reviews (
                contract_id, reviewer_id, reviewee_id, rating, 
                rating_breakdown, comment, is_public, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            [
                contract_id, reviewer_id, reviewee_id, rating,
                json.dumps(rating_breakdown), review_text, 
                1 if is_public else 0, now, now
            ]
        )
        
        return {
            "success": bool(result),
            "contract_id": contract_id,
            "reviewer_id": reviewer_id,
            "reviewee_id": reviewee_id,
            "rating": rating,
            "created_at": now
        }
    
    @staticmethod
    def get_user_reviews(
        user_id: int,
        is_public_only: bool = True,
        skip: int = 0,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Get all reviews for a user"""
        public_filter = "is_public = 1" if is_public_only else "1=1"
        
        result = execute_query(
            f"""SELECT r.id, r.contract_id, r.reviewer_id, r.reviewee_id,
                       r.rating, r.rating_breakdown, r.comment, r.is_public,
                       r.created_at, r.updated_at, u.name as reviewer_name,
                       u.profile_image_url as reviewer_avatar
                FROM reviews r
                LEFT JOIN users u ON r.reviewer_id = u.id
                WHERE r.reviewee_id = ? AND {public_filter}
                ORDER BY r.created_at DESC
                LIMIT ? OFFSET ?""",
            [user_id, limit, skip]
        )
        
        if not result or not result.get("rows"):
            return []
        
        reviews = []
        for row in parse_rows(result):
            breakdown = {}
            try:
                if row.get("rating_breakdown"):
                    breakdown = json.loads(row.get("rating_breakdown"))
            except:
                pass
            
            reviews.append({
                "id": row.get("id"),
                "contract_id": row.get("contract_id"),
                "reviewer_id": row.get("reviewer_id"),
                "reviewer_name": row.get("reviewer_name"),
                "reviewer_avatar": row.get("reviewer_avatar"),
                "rating": row.get("rating"),
                "communication": breakdown.get("communication"),
                "quality": breakdown.get("quality"),
                "professionalism": breakdown.get("professionalism"),
                "deadline": breakdown.get("deadline"),
                "comment": row.get("comment"),
                "is_public": bool(row.get("is_public")),
                "created_at": row.get("created_at")
            })
        
        return reviews
    
    @staticmethod
    def calculate_user_rating_stats(user_id: int) -> Dict[str, Any]:
        """Calculate comprehensive rating statistics for a user"""
        result = execute_query(
            """SELECT 
                COUNT(*) as total_reviews,
                AVG(rating) as avg_rating,
                MIN(rating) as min_rating,
                MAX(rating) as max_rating,
                ROUND(AVG(rating), 1) as average_rating
            FROM reviews WHERE reviewee_id = ? AND is_public = 1""",
            [user_id]
        )
        
        if not result or not result.get("rows"):
            return {
                "total_reviews": 0,
                "avg_rating": 0,
                "category_ratings": {}
            }
        
        row = parse_rows(result)[0]
        
        # Get category averages
        category_result = execute_query(
            """SELECT 
                ROUND(AVG(json_extract(rating_breakdown, '$.communication')), 1) as communication,
                ROUND(AVG(json_extract(rating_breakdown, '$.quality')), 1) as quality,
                ROUND(AVG(json_extract(rating_breakdown, '$.professionalism')), 1) as professionalism,
                ROUND(AVG(json_extract(rating_breakdown, '$.deadline')), 1) as deadline
            FROM reviews WHERE reviewee_id = ? AND is_public = 1""",
            [user_id]
        )
        
        category_avg = {}
        if category_result and category_result.get("rows"):
            cat_row = parse_rows(category_result)[0]
            category_avg = {
                "communication": cat_row.get("communication") or 0,
                "quality": cat_row.get("quality") or 0,
                "professionalism": cat_row.get("professionalism") or 0,
                "deadline": cat_row.get("deadline") or 0
            }
        
        return {
            "total_reviews": row.get("total_reviews") or 0,
            "avg_rating": round(float(row.get("avg_rating") or 0), 2),
            "min_rating": row.get("min_rating") or 0,
            "max_rating": row.get("max_rating") or 0,
            "category_ratings": category_avg
        }
    
    @staticmethod
    def get_rating_distribution(user_id: int) -> Dict[int, int]:
        """Get distribution of ratings (1-5 stars)"""
        result = execute_query(
            """SELECT 
                CAST(rating AS INTEGER) as rating_value,
                COUNT(*) as count
            FROM reviews
            WHERE reviewee_id = ? AND is_public = 1
            GROUP BY CAST(rating AS INTEGER)
            ORDER BY rating_value""",
            [user_id]
        )
        
        distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        
        if result and result.get("rows"):
            for row in parse_rows(result):
                rating_val = int(row.get("rating_value") or 0)
                if rating_val in distribution:
                    distribution[rating_val] = row.get("count") or 0
        
        return distribution
    
    @staticmethod
    def add_review_response(
        review_id: int,
        respondee_id: int,
        response_text: str
    ) -> Dict[str, Any]:
        """Add a response to a review"""
        now = datetime.now(timezone.utc).isoformat()
        
        result = execute_query(
            """INSERT INTO review_responses (review_id, respondee_id, response_text, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?)""",
            [review_id, respondee_id, response_text, now, now]
        )
        
        return {
            "success": bool(result),
            "review_id": review_id,
            "created_at": now
        }
    
    @staticmethod
    def get_review_responses(review_id: int) -> List[Dict[str, Any]]:
        """Get all responses to a review"""
        result = execute_query(
            """SELECT r.id, r.review_id, r.respondee_id, r.response_text,
                      r.created_at, u.name as respondee_name
               FROM review_responses r
               LEFT JOIN users u ON r.respondee_id = u.id
               WHERE r.review_id = ?
               ORDER BY r.created_at ASC""",
            [review_id]
        )
        
        if not result or not result.get("rows"):
            return []
        
        responses = []
        for row in parse_rows(result):
            responses.append({
                "id": row.get("id"),
                "respondee_name": row.get("respondee_name"),
                "response_text": row.get("response_text"),
                "created_at": row.get("created_at")
            })
        
        return responses
    
    @staticmethod
    def flag_review_for_moderation(
        review_id: int,
        reason: str,
        reporter_id: int
    ) -> Dict[str, Any]:
        """Flag a review for moderation"""
        now = datetime.now(timezone.utc).isoformat()
        
        result = execute_query(
            """INSERT INTO review_flags (review_id, reason, reporter_id, status, created_at)
               VALUES (?, ?, ?, ?, ?)""",
            [review_id, reason, reporter_id, "pending", now]
        )
        
        return {
            "success": bool(result),
            "review_id": review_id,
            "status": "flagged"
        }
    
    @staticmethod
    def delete_review(review_id: int, user_id: int) -> Dict[str, Any]:
        """Delete a review (only by reviewer)"""
        # Verify ownership
        result = execute_query(
            "SELECT reviewer_id FROM reviews WHERE id = ?",
            [review_id]
        )
        
        if not result or not result.get("rows"):
            return {"success": False, "error": "Review not found"}
        
        row = parse_rows(result)[0]
        if row.get("reviewer_id") != user_id:
            return {"success": False, "error": "Not authorized"}
        
        # Delete the review
        delete_result = execute_query(
            "DELETE FROM reviews WHERE id = ?",
            [review_id]
        )
        
        return {"success": bool(delete_result), "review_id": review_id}


def get_review_service() -> ReviewService:
    """Factory function for review service"""
    return ReviewService()
