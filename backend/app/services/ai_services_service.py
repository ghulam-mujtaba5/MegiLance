# @AI-HINT: AI services data access layer - database operations for AI feature endpoints
import json
import re
import logging
from typing import List, Optional

from app.db.turso_http import execute_query, to_str

logger = logging.getLogger("megilance")


def get_project_with_skills(project_id: int) -> Optional[dict]:
    """Get project details including skills for matching. Returns None if not found."""
    result = execute_query(
        "SELECT id, title, skills_required, category FROM projects WHERE id = ?",
        [project_id]
    )
    if not result or not result.get("rows"):
        return None

    row = result["rows"][0]
    skills_str = to_str(row[2]) or ""

    try:
        required_skills = json.loads(skills_str) if skills_str else []
    except Exception:
        required_skills = skills_str.split(",") if skills_str else []

    return {
        "id": row[0].get("value") if row[0].get("type") != "null" else None,
        "title": to_str(row[1]),
        "skills_str": skills_str,
        "required_skills": required_skills,
        "category": to_str(row[3]),
    }


def get_active_freelancers(limit: int) -> List[dict]:
    """Get active freelancers for matching."""
    result = execute_query(
        """SELECT u.id, u.name, u.email, u.skills, u.hourly_rate, NULL as rating,
                  u.profile_image_url, u.bio, NULL as completed_projects
           FROM users u
           WHERE u.user_type = 'Freelancer' AND u.is_active = 1
           LIMIT ?""",
        [limit]
    )

    freelancers = []
    if not result or not result.get("rows"):
        return freelancers

    for row in result["rows"]:
        freelancer_id = row[0].get("value") if row[0].get("type") != "null" else None
        skills_str = to_str(row[3]) or ""

        try:
            freelancer_skills = json.loads(skills_str) if skills_str else []
        except Exception:
            freelancer_skills = skills_str.split(",") if skills_str else []

        rating = row[5].get("value") if row[5].get("type") != "null" else 0

        freelancers.append({
            "freelancer_id": freelancer_id,
            "name": to_str(row[1]),
            "email": to_str(row[2]),
            "skills": freelancer_skills,
            "hourly_rate": row[4].get("value") if row[4].get("type") != "null" else None,
            "rating": rating,
            "profile_image": to_str(row[6]),
            "bio": to_str(row[7]),
            "completed_projects": row[8].get("value") if row[8].get("type") != "null" else 0,
        })

    return freelancers


def get_category_avg_budget(category_value: str) -> float:
    """Get average budget for a project category."""
    result = execute_query(
        """SELECT AVG((budget_min + budget_max) / 2) as avg_budget, COUNT(*) as project_count
           FROM projects
           WHERE category = ? AND status IN ('completed', 'in_progress')""",
        [category_value]
    )

    avg_budget = 500
    if result and result.get("rows"):
        row = result["rows"][0]
        if row[0].get("type") != "null" and row[0].get("value"):
            avg_budget = float(row[0].get("value"))
    return avg_budget


def get_skills_avg_hourly_rate(skills_pattern: str) -> float:
    """Get average hourly rate for freelancers with matching skills."""
    result = execute_query(
        """SELECT AVG(hourly_rate) as avg_rate
           FROM users
           WHERE user_type = 'Freelancer'
           AND hourly_rate IS NOT NULL
           AND skills LIKE ?""",
        [f"%{skills_pattern}%"]
    )

    avg_hourly = 35
    if result and result.get("rows"):
        row = result["rows"][0]
        if row[0].get("type") != "null" and row[0].get("value"):
            avg_hourly = float(row[0].get("value"))
    return avg_hourly


def get_freelancer_for_rate_estimation(freelancer_id: int) -> Optional[dict]:
    """Get freelancer details for rate estimation. Returns None if not found."""
    result = execute_query(
        """SELECT id, name, skills, hourly_rate, NULL as rating, NULL as completed_projects,
                  NULL as years_experience
           FROM users
           WHERE id = ? AND user_type = 'Freelancer'""",
        [freelancer_id]
    )

    if not result or not result.get("rows"):
        return None

    row = result["rows"][0]
    return {
        "id": row[0].get("value") if row[0].get("type") != "null" else None,
        "full_name": to_str(row[1]),
        "skills": to_str(row[2]),
        "current_rate": row[3].get("value") if row[3].get("type") != "null" else None,
        "rating": row[4].get("value") if row[4].get("type") != "null" else 0,
        "completed_projects": row[5].get("value") if row[5].get("type") != "null" else 0,
        "years_experience": row[6].get("value") if row[6].get("type") != "null" else 0,
    }


def get_user_for_fraud_check(user_id: int) -> Optional[dict]:
    """Get user data for fraud analysis. Returns None if not found."""
    result = execute_query(
        """SELECT id, email, name, created_at, is_active, is_verified,
                  user_type, bio
           FROM users WHERE id = ?""",
        [user_id]
    )

    if not result or not result.get("rows"):
        return None

    row = result["rows"][0]
    return {
        "id": row[0].get("value") if row[0].get("type") != "null" else None,
        "email": to_str(row[1]) or "",
        "full_name": to_str(row[2]) or "",
        "created_at": to_str(row[3]),
        "is_active": row[4].get("value") if row[4].get("type") != "null" else False,
        "is_verified": row[5].get("value") if row[5].get("type") != "null" else False,
        "user_type": to_str(row[6]),
        "bio": to_str(row[7]) or "",
    }


def get_urgent_ticket_count(user_id: int) -> int:
    """Get count of urgent support tickets for a user."""
    result = execute_query(
        "SELECT COUNT(*) FROM support_tickets WHERE user_id = ? AND priority = 'urgent'",
        [user_id]
    )
    if result and result.get("rows"):
        return result["rows"][0][0].get("value") or 0
    return 0


def get_project_for_fraud_check(project_id: int) -> Optional[dict]:
    """Get project data for fraud analysis. Returns None if not found."""
    result = execute_query(
        """SELECT id, title, description, budget, client_id
           FROM projects WHERE id = ?""",
        [project_id]
    )

    if not result or not result.get("rows"):
        return None

    row = result["rows"][0]
    return {
        "id": row[0].get("value") if row[0].get("type") != "null" else None,
        "title": to_str(row[1]) or "",
        "description": to_str(row[2]) or "",
        "budget": row[3].get("value") if row[3].get("type") != "null" else 0,
        "client_id": row[4].get("value") if row[4].get("type") != "null" else None,
    }


def get_proposal_for_fraud_check(proposal_id: int) -> Optional[dict]:
    """Get proposal data for fraud analysis. Returns None if not found."""
    result = execute_query(
        """SELECT id, cover_letter, bid_amount, freelancer_id
           FROM proposals WHERE id = ?""",
        [proposal_id]
    )

    if not result or not result.get("rows"):
        return None

    row = result["rows"][0]
    return {
        "id": row[0].get("value") if row[0].get("type") != "null" else None,
        "cover_letter": to_str(row[1]) or "",
        "bid_amount": row[2].get("value") if row[2].get("type") != "null" else 0,
        "freelancer_id": row[3].get("value") if row[3].get("type") != "null" else None,
    }


def get_user_profile_for_suggestions(user_id: int) -> Optional[dict]:
    """Get user profile data for optimization suggestions. Returns None if not found."""
    result = execute_query(
        """SELECT id, name, bio, skills, hourly_rate, NULL as portfolio_url,
                  profile_image_url, NULL as completed_projects, NULL as rating, NULL as years_experience
           FROM users WHERE id = ?""",
        [user_id]
    )

    if not result or not result.get("rows"):
        return None

    row = result["rows"][0]
    return {
        "id": row[0].get("value") if row[0].get("type") != "null" else None,
        "full_name": to_str(row[1]),
        "bio": to_str(row[2]) or "",
        "skills_str": to_str(row[3]) or "",
        "hourly_rate": row[4].get("value") if row[4].get("type") != "null" else None,
        "portfolio_url": to_str(row[5]),
        "profile_image": to_str(row[6]),
        "completed_projects": row[7].get("value") if row[7].get("type") != "null" else 0,
        "rating": row[8].get("value") if row[8].get("type") != "null" else 0,
        "years_experience": row[9].get("value") if row[9].get("type") != "null" else 0,
    }


def get_user_skills_and_rate(user_id: int) -> Optional[dict]:
    """Get user skills and hourly rate. Returns None if not found."""
    result = execute_query(
        "SELECT skills, hourly_rate FROM users WHERE id = ?",
        [user_id]
    )

    if not result or not result.get("rows"):
        return None

    row = result["rows"][0]
    skills_str = to_str(row[0]) or ""
    hourly_rate = row[1].get("value") if row[1].get("type") != "null" else 0

    try:
        user_skills = json.loads(skills_str) if skills_str else []
    except Exception:
        user_skills = skills_str.split(",") if skills_str else []

    return {
        "skills": user_skills,
        "hourly_rate": hourly_rate,
    }


def get_open_projects(limit: int) -> List[dict]:
    """Get open projects for job recommendations."""
    result = execute_query(
        """SELECT id, title, description, skills_required, budget_min, budget_max, category
           FROM projects
           WHERE status = 'open'
           ORDER BY created_at DESC
           LIMIT ?""",
        [limit]
    )

    projects = []
    if not result or not result.get("rows"):
        return projects

    for row in result["rows"]:
        project_id = row[0].get("value") if row[0].get("type") != "null" else None
        proj_skills_str = to_str(row[3]) or ""

        try:
            proj_skills = json.loads(proj_skills_str) if proj_skills_str else []
        except Exception:
            proj_skills = proj_skills_str.split(",") if proj_skills_str else []

        budget_min = row[4].get("value") if row[4].get("type") != "null" else 0
        budget_max = row[5].get("value") if row[5].get("type") != "null" else 0

        projects.append({
            "project_id": project_id,
            "title": to_str(row[1]),
            "description": to_str(row[2]) or "",
            "skills": proj_skills,
            "budget_min": budget_min,
            "budget_max": budget_max,
            "category": to_str(row[6]),
        })

    return projects
