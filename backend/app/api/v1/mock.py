from fastapi import APIRouter, HTTPException
from app.core.json_loader import read_json


router = APIRouter()


@router.get("/dashboard")
def get_dashboard() -> dict:
    try:
        return read_json("dashboard.json")
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="dashboard.json not found")


@router.get("/messages")
def get_messages() -> list[dict]:
    try:
        return read_json("messages.json")
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="messages.json not found")


@router.get("/projects")
def get_projects() -> list[dict]:
    try:
        projects_data = read_json("projects.json")
        # Transform the data to match what the frontend expects
        transformed_projects = []
        for project in projects_data:
            # Map status values
            status_map = {
                "active": "In Progress",
                "completed": "Completed",
                "pending": "Pending",
                "on_hold": "Cancelled"
            }
            
            transformed_project = {
                "id": project["id"],
                "title": project["name"],
                "status": status_map.get(project["status"], "Pending"),
                "progress": project["progress"],
                "budget": project["budget"],
                "paid": int(project["budget"] * project["progress"] / 100),  # Calculate paid amount
                "freelancers": [
                    {
                        "id": f"freelancer_{i}",
                        "name": member["name"],
                        "avatarUrl": member["avatar"]
                    }
                    for i, member in enumerate(project.get("team", []))
                ],
                "updatedAt": project.get("endDate", "2024-01-01")
            }
            transformed_projects.append(transformed_project)
        return transformed_projects
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="projects.json not found")


@router.get("/payments")
def get_payments() -> list[dict]:
    try:
        payments_data = read_json("payments.json")
        # Transform the data to match what the frontend expects
        if isinstance(payments_data, dict) and "transactions" in payments_data:
            transactions = payments_data["transactions"]
            # Transform to match frontend expectations
            transformed_payments = []
            for transaction in transactions:
                transformed_payments.append({
                    "id": transaction["id"],
                    "date": transaction["date"],
                    "description": transaction["description"],
                    "amount": transaction["amount"].replace("$", "").replace("+", "").replace("-", ""),
                    "status": transaction["status"].capitalize(),
                    "type": "Payment" if transaction["amount"].startswith("+") else "Refund"
                })
            return transformed_payments
        return payments_data if isinstance(payments_data, list) else []
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="payments.json not found")


@router.get("/freelancers")
def get_freelancers() -> list[dict]:
    try:
        # For now, we'll return an empty list or mock data
        # In a real implementation, this would come from the database
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
            },
            {
                "id": "freelancer_3",
                "name": "Charlie Brown",
                "title": "DevOps Engineer",
                "rating": 4.7,
                "hourlyRate": "$80/hr",
                "skills": ["AWS", "Docker", "Kubernetes"],
                "completedProjects": 32
            }
        ]
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="freelancers data not found")


@router.get("/reviews")
def get_reviews() -> list[dict]:
    try:
        # For now, we'll return mock data
        # In a real implementation, this would come from the database
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
            },
            {
                "id": "review_3",
                "projectTitle": "Cloud Migration",
                "freelancerName": "Charlie Brown",
                "rating": 4,
                "comment": "Good technical skills, but communication could be improved.",
                "date": "2024-01-10"
            }
        ]
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="reviews data not found")


@router.get("/user")
def get_user() -> dict:
    try:
        return read_json("user.json")
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="user.json not found")


@router.get("/admin/dashboard")
def admin_dashboard() -> dict:
    try:
        return read_json("admin_dashboard.json")
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="admin_dashboard.json not found")


@router.get("/admin/users")
def admin_users() -> list[dict]:
    try:
        return read_json("users.json")
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="users.json not found")


@router.get("/admin/projects")
def admin_projects() -> list[dict]:
    try:
        return read_json("admin_projects.json")
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="admin_projects.json not found")


@router.get("/admin/payments")
def admin_payments() -> dict:
    try:
        return read_json("admin_payments.json")
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="admin_payments.json not found")


@router.get("/admin/support")
def admin_support() -> dict:
    try:
        return read_json("admin_support_tickets.json")
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="admin_support_tickets.json not found")


@router.get("/admin/ai-monitoring")
def admin_ai_monitoring() -> dict:
    try:
        return read_json("admin_ai_monitoring.json")
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="admin_ai_monitoring.json not found")


@router.get("/admin/settings")
def admin_settings() -> dict:
    try:
        return read_json("admin_settings.json")
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="admin_settings.json not found")


@router.post("/jobs")
async def create_job() -> dict:
    try:
        # For now, we'll just return a success response
        # In a real implementation, this would save the job to the database
        return {
            "id": "job_" + str(hash("test") % 1000000),
            "message": "Job submitted successfully."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
