# @AI-HINT: Client-specific API endpoints - Turso HTTP only
from fastapi import APIRouter, Depends, HTTPException, Header
from typing import List, Optional
from datetime import datetime

from app.db.turso_http import execute_query, to_str, parse_date
from app.core.security import get_current_user_from_token

router = APIRouter()


@router.get("/projects", response_model=List[dict])
def get_client_projects(
    current_user = Depends(get_current_user_from_token)
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
    current_user = Depends(get_current_user_from_token)
):
    """
    Get client payments with transformed data structure for frontend
    """
    result = execute_query(
        """SELECT p.id, p.to_user_id, p.from_user_id, p.amount, p.status, p.description, p.created_at,
                  proj.title as project_title,
                  u.name as freelancer_name,
                  u.profile_image_url as freelancer_avatar
           FROM payments p
           LEFT JOIN contracts c ON p.contract_id = c.id
           LEFT JOIN projects proj ON c.project_id = proj.id
           LEFT JOIN users u ON c.freelancer_id = u.id
           WHERE p.to_user_id = ? OR p.from_user_id = ?
           ORDER BY p.created_at DESC""",
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
        
        project_title = to_str(row[7]) or "Untitled Project"
        freelancer_name = to_str(row[8]) or "Unknown Freelancer"
        freelancer_avatar = to_str(row[9])

        transformed_payment = {
            "id": str(payment_id) if payment_id else None,
            "date": created_at.isoformat() if created_at else None,
            "description": to_str(row[5]),
            "amount": str(amount),
            "status": status_val.capitalize() if status_val else "Pending",
            "type": payment_type,
            "project": project_title,
            "freelancer": freelancer_name,
            "freelancerAvatarUrl": freelancer_avatar
        }
        transformed_payments.append(transformed_payment)
    
    return transformed_payments


@router.get("/freelancers", response_model=List[dict])
def get_client_freelancers(
    current_user = Depends(get_current_user_from_token)
):
    """
    Get freelancers that have worked with the client
    """
    # Get freelancers from contracts and accepted proposals
    result = execute_query(
        """SELECT DISTINCT u.id, u.name, u.first_name, u.last_name, u.bio, u.hourly_rate, u.skills, u.profile_image_url, u.location
           FROM users u
           INNER JOIN contracts c ON c.freelancer_id = u.id
           WHERE c.client_id = ?
           LIMIT 20""",
        [current_user["id"]]
    )
    
    if not result or not result.get("rows"):
        # Return empty list if no real data
        return []
    
    freelancers = []
    for row in result["rows"]:
        freelancer_id = row[0].get("value") if row[0].get("type") != "null" else None
        name = to_str(row[1])
        if not name:
            first = to_str(row[2]) or ""
            last = to_str(row[3]) or ""
            name = f"{first} {last}".strip() or "Unknown"
        
        bio = to_str(row[4])
        title = bio.split('.')[0][:50] + "..." if bio else "Freelancer"
        
        hourly_rate = float(row[5].get("value")) if row[5].get("type") != "null" else 0
        skills_str = to_str(row[6])
        skills = skills_str.split(",") if skills_str else []
        
        profile_image_url = to_str(row[7])
        location = to_str(row[8]) or "Remote"
        
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
        
        # Check if freelancer is verified (has completed profile, identity verification, etc.)
        is_verified = completed_count >= 3 and avg_rating >= 4.0
        
        freelancers.append({
            "id": f"freelancer_{freelancer_id}",
            "name": name,
            "title": title,
            "rating": avg_rating or 4.5,  # Default rating if no reviews
            "hourlyRate": f"${hourly_rate}/hr",
            "skills": skills[:5],  # Limit to 5 skills
            "completedProjects": completed_count,
            "avatarUrl": profile_image_url,
            "location": location,
            "availability": "Contract",  # Default for now
            "isVerified": is_verified,
            "matchScore": min(95, 70 + (completed_count * 2) + int(avg_rating * 3))  # Calculate based on reputation
        })
    
    return freelancers


@router.get("/reviews", response_model=List[dict])
def get_client_reviews(
    current_user = Depends(get_current_user_from_token)
):
    """
    Get reviews for the client
    """
    result = execute_query(
        """SELECT r.id, r.rating, r.comment, r.created_at, p.title, u.name, u.first_name, u.last_name, u.profile_image_url
           FROM reviews r
           LEFT JOIN projects p ON r.project_id = p.id
           LEFT JOIN users u ON r.reviewer_id = u.id
           WHERE r.reviewee_id = ?
           ORDER BY r.created_at DESC
           LIMIT 20""",
        [current_user["id"]]
    )
    
    if not result or not result.get("rows"):
        return []
    
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
        
        freelancer_avatar = to_str(row[8])

        reviews.append({
            "id": f"review_{review_id}",
            "projectTitle": to_str(row[4]) or "Project",
            "freelancerName": freelancer_name,
            "rating": rating,
            "comment": to_str(row[2]),
            "date": created_at.strftime("%Y-%m-%d") if created_at else None,
            "avatarUrl": freelancer_avatar
        })
    
    return reviews


@router.post("/jobs")
def create_client_job(
    job_data: dict,
    current_user = Depends(get_current_user_from_token)
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
