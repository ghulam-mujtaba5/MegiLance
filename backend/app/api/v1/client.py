# @AI-HINT: Client-specific API endpoints - Turso HTTP only
from fastapi import APIRouter, Depends, HTTPException, Header
from typing import List, Optional
from datetime import datetime

from app.db.turso_http import execute_query, to_str, parse_date
from app.core.security import get_current_user

router = APIRouter()


def get_current_user_from_header(authorization: Optional[str] = Header(None)):
    """Extract and validate the current user from the Authorization header"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    
    # Extract token from "Bearer <token>" format
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header format")
    
    token = authorization[7:]  # Remove "Bearer " prefix
    
    # Use the existing get_current_user function with the token
    from app.core.security import decode_access_token
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    
    # Fetch user from Turso
    result = execute_query(
        "SELECT id, email, name, first_name, last_name, user_type, role, is_active FROM users WHERE id = ?",
        [user_id]
    )
    
    if not result or not result.get("rows"):
        raise HTTPException(status_code=401, detail="User not found")
    
    row = result["rows"][0]
    return {
        "id": row[0].get("value") if row[0].get("type") != "null" else None,
        "email": to_str(row[1]),
        "name": to_str(row[2]),
        "first_name": to_str(row[3]),
        "last_name": to_str(row[4]),
        "user_type": to_str(row[5]),
        "role": to_str(row[6]),
        "is_active": bool(row[7].get("value")) if row[7].get("type") != "null" else True
    }


@router.get("/projects", response_model=List[dict])
def get_client_projects(
    current_user: dict = Depends(get_current_user_from_header)
):
    """
    Get client projects with transformed data structure for frontend
    """
    result = execute_query(
        """SELECT id, title, status, budget_min, budget_max, created_at, updated_at
           FROM projects WHERE client_id = ?
           ORDER BY created_at DESC""",
        [current_user["id"]]
    )
    
    if not result or not result.get("rows"):
        return []
    
    # Transform the data to match what the frontend expects
    transformed_projects = []
    for row in result["rows"]:
        project_id = row[0].get("value") if row[0].get("type") != "null" else None
        status_val = to_str(row[2])
        budget_min = float(row[3].get("value")) if row[3].get("type") != "null" else 0
        budget_max = float(row[4].get("value")) if row[4].get("type") != "null" else 0
        
        # Map status values
        status_map = {
            "open": "Pending",
            "in_progress": "In Progress",
            "completed": "Completed",
            "cancelled": "Cancelled"
        }
        
        budget = budget_max or budget_min or 0
        updated_at = parse_date(row[6]) or parse_date(row[5])
        
        # Calculate progress from milestones (completed / total)
        progress = 0
        if project_id:
            # Get contract_id for this project
            contract_result = execute_query(
                "SELECT id FROM contracts WHERE project_id = ? LIMIT 1",
                [project_id]
            )
            if contract_result and contract_result.get("rows"):
                contract_id = contract_result["rows"][0][0].get("value")
                if contract_id:
                    milestone_result = execute_query(
                        """SELECT 
                           COUNT(*) as total,
                           SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
                           FROM milestones WHERE contract_id = ?""",
                        [contract_id]
                    )
                    if milestone_result and milestone_result.get("rows"):
                        total_count = milestone_result["rows"][0][0].get("value", 0)
                        completed_count = milestone_result["rows"][0][1].get("value", 0)
                        if total_count and total_count > 0:
                            progress = int((completed_count / total_count) * 100)
        
        # Calculate paid amount from payments
        paid = 0
        if project_id:
            # Payments linked via contract_id
            contract_result = execute_query(
                "SELECT id FROM contracts WHERE project_id = ? LIMIT 1",
                [project_id]
            )
            if contract_result and contract_result.get("rows"):
                contract_id = contract_result["rows"][0][0].get("value")
                if contract_id:
                    payment_result = execute_query(
                        """SELECT SUM(amount) FROM payments 
                           WHERE contract_id = ? AND status = 'completed'""",
                        [contract_id]
                    )
                    if payment_result and payment_result.get("rows"):
                        paid_val = payment_result["rows"][0][0].get("value")
                        if paid_val and payment_result["rows"][0][0].get("type") != "null":
                            paid = float(paid_val)
        
        # Get freelancers from accepted proposals
        freelancers = []
        if project_id:
            freelancer_result = execute_query(
                """SELECT DISTINCT u.id, u.full_name, u.profile_image 
                   FROM users u
                   JOIN proposals p ON p.freelancer_id = u.id
                   WHERE p.project_id = ? AND p.status = 'accepted'""",
                [project_id]
            )
            if freelancer_result and freelancer_result.get("rows"):
                for fl_row in freelancer_result["rows"]:
                    fl_id = fl_row[0].get("value") if fl_row[0].get("type") != "null" else None
                    fl_name = to_str(fl_row[1])
                    fl_image = to_str(fl_row[2])
                    if fl_id:
                        freelancers.append({
                            "id": fl_id,
                            "name": fl_name or "Unknown",
                            "avatar": fl_image
                        })
        
        transformed_project = {
            "id": f"PROJ-{project_id:03d}" if project_id else None,
            "title": to_str(row[1]),
            "status": status_map.get(status_val, "Pending"),
            "progress": progress,
            "budget": budget,
            "paid": paid,
            "freelancers": freelancers,
            "updatedAt": updated_at.isoformat() if updated_at else None
        }
        transformed_projects.append(transformed_project)
    
    return transformed_projects


@router.get("/payments", response_model=List[dict])
def get_client_payments(
    current_user: dict = Depends(get_current_user_from_header)
):
    """
    Get client payments with transformed data structure for frontend
    """
    result = execute_query(
        """SELECT id, to_user_id, from_user_id, amount, status, description, created_at
           FROM payments
           WHERE to_user_id = ? OR from_user_id = ?
           ORDER BY created_at DESC""",
        [current_user["id"], current_user["id"]]
    )
    
    if not result or not result.get("rows"):
        return []
    
    transformed_payments = []
    for row in result["rows"]:
        payment_id = row[0].get("value") if row[0].get("type") != "null" else None
        to_user_id = row[1].get("value") if row[1].get("type") != "null" else None
        amount = float(row[3].get("value")) if row[3].get("type") != "null" else 0
        status_val = to_str(row[4])
        
        # Determine payment type
        payment_type = "Payment" if to_user_id == current_user["id"] else "Refund"
        created_at = parse_date(row[6])
        
        transformed_payment = {
            "id": str(payment_id) if payment_id else None,
            "date": created_at.isoformat() if created_at else None,
            "description": to_str(row[5]),
            "amount": str(amount),
            "status": status_val.capitalize() if status_val else "Pending",
            "type": payment_type
        }
        transformed_payments.append(transformed_payment)
    
    return transformed_payments


@router.get("/freelancers", response_model=List[dict])
def get_client_freelancers(
    current_user: dict = Depends(get_current_user_from_header)
):
    """
    Get freelancers that have worked with the client
    """
    # Get freelancers from contracts and accepted proposals
    result = execute_query(
        """SELECT DISTINCT u.id, u.name, u.first_name, u.last_name, u.bio, u.hourly_rate, u.skills, u.profile_image
           FROM users u
           INNER JOIN contracts c ON c.freelancer_id = u.id
           WHERE c.client_id = ?
           LIMIT 20""",
        [current_user["id"]]
    )
    
    if not result or not result.get("rows"):
        # Return mock data if no real data
        return [
            {
                "id": "freelancer_1",
                "name": "Alice Johnson",
                "title": "Senior Full-Stack Developer",
                "rating": 4.8,
                "hourlyRate": "$75/hr",
                "skills": ["React", "Node.js", "Python"],
                "completedProjects": 24
            },
            {
                "id": "freelancer_2",
                "name": "Bob Smith",
                "title": "UI/UX Designer",
                "rating": 4.9,
                "hourlyRate": "$65/hr",
                "skills": ["Figma", "UI Design", "Prototyping"],
                "completedProjects": 18
            }
        ]
    
    freelancers = []
    for row in result["rows"]:
        freelancer_id = row[0].get("value") if row[0].get("type") != "null" else None
        name = to_str(row[1])
        if not name:
            first = to_str(row[2]) or ""
            last = to_str(row[3]) or ""
            name = f"{first} {last}".strip() or "Unknown"
        
        hourly_rate = float(row[5].get("value")) if row[5].get("type") != "null" else 0
        skills_str = to_str(row[6])
        skills = skills_str.split(",") if skills_str else []
        
        # Get completed projects count
        count_result = execute_query(
            "SELECT COUNT(*) FROM contracts WHERE freelancer_id = ? AND status = 'completed'",
            [freelancer_id]
        )
        completed_count = 0
        if count_result and count_result.get("rows"):
            completed_count = count_result["rows"][0][0].get("value", 0)
        
        # Get average rating
        rating_result = execute_query(
            "SELECT AVG(rating) FROM reviews WHERE reviewee_id = ?",
            [freelancer_id]
        )
        avg_rating = 0
        if rating_result and rating_result.get("rows"):
            val = rating_result["rows"][0][0]
            if val.get("type") != "null":
                avg_rating = round(float(val.get("value", 0)), 1)
        
        freelancers.append({
            "id": f"freelancer_{freelancer_id}",
            "name": name,
            "title": to_str(row[3]) or "Freelancer",
            "rating": avg_rating,
            "hourlyRate": f"${hourly_rate}/hr",
            "skills": skills[:5],  # Limit to 5 skills
            "completedProjects": completed_count
        })
    
    return freelancers


@router.get("/reviews", response_model=List[dict])
def get_client_reviews(
    current_user: dict = Depends(get_current_user_from_header)
):
    """
    Get reviews for the client
    """
    result = execute_query(
        """SELECT r.id, r.rating, r.comment, r.created_at, p.title, u.name, u.first_name, u.last_name
           FROM reviews r
           LEFT JOIN projects p ON r.project_id = p.id
           LEFT JOIN users u ON r.reviewer_id = u.id
           WHERE r.reviewee_id = ?
           ORDER BY r.created_at DESC
           LIMIT 20""",
        [current_user["id"]]
    )
    
    if not result or not result.get("rows"):
        # Return mock data if no real reviews
        return [
            {
                "id": "review_1",
                "projectTitle": "E-commerce Website",
                "freelancerName": "Alice Johnson",
                "rating": 5,
                "comment": "Excellent work! Delivered ahead of schedule and exceeded expectations.",
                "date": "2024-03-15"
            },
            {
                "id": "review_2",
                "projectTitle": "Mobile App Redesign",
                "freelancerName": "Bob Smith",
                "rating": 5,
                "comment": "Fantastic design work. Very responsive to feedback.",
                "date": "2024-02-28"
            }
        ]
    
    reviews = []
    for row in result["rows"]:
        review_id = row[0].get("value") if row[0].get("type") != "null" else None
        rating = row[1].get("value") if row[1].get("type") != "null" else 0
        created_at = parse_date(row[3])
        
        freelancer_name = to_str(row[5])
        if not freelancer_name:
            first = to_str(row[6]) or ""
            last = to_str(row[7]) or ""
            freelancer_name = f"{first} {last}".strip() or "Anonymous"
        
        reviews.append({
            "id": f"review_{review_id}",
            "projectTitle": to_str(row[4]) or "Project",
            "freelancerName": freelancer_name,
            "rating": rating,
            "comment": to_str(row[2]),
            "date": created_at.strftime("%Y-%m-%d") if created_at else None
        })
    
    return reviews


@router.post("/jobs")
def create_client_job(
    job_data: dict,
    current_user: dict = Depends(get_current_user_from_header)
):
    """
    Create a new job posting for the client
    """
    try:
        now = datetime.utcnow().isoformat()
        skills = ",".join(job_data.get("skills", []))
        budget = job_data.get("budget", 0)
        
        result = execute_query(
            """INSERT INTO projects (title, description, category, budget_type, budget_min, budget_max, experience_level, estimated_duration, skills, client_id, status, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, 'Intermediate', ?, ?, ?, 'open', ?, ?)""",
            [
                job_data.get("title", ""),
                job_data.get("description", ""),
                job_data.get("category", ""),
                job_data.get("budgetType", "Fixed"),
                budget,
                budget,
                job_data.get("timeline", ""),
                skills,
                current_user["id"],
                now,
                now
            ]
        )
        
        if not result:
            raise HTTPException(status_code=500, detail="Failed to create job")
        
        project_id = result.get("last_insert_rowid")
        
        return {
            "id": f"job_{project_id}",
            "message": "Job submitted successfully."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))