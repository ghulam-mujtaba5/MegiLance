# @AI-HINT: Career development API - Skill growth, career paths, mentorship
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum
from app.db.session import get_db
from app.core.security import get_current_active_user

router = APIRouter(prefix="/career")


class SkillLevel(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"


class CareerPath(BaseModel):
    id: str
    name: str
    description: str
    skills_required: List[dict]
    milestones: List[dict]
    estimated_duration: str
    salary_range: dict
    job_outlook: str
    related_paths: List[str]


class SkillProgress(BaseModel):
    skill_id: str
    skill_name: str
    current_level: SkillLevel
    target_level: SkillLevel
    progress_percentage: float
    hours_invested: int
    projects_completed: int
    certifications: List[str]


class LearningGoal(BaseModel):
    id: str
    user_id: str
    title: str
    description: str
    target_skill: str
    target_level: SkillLevel
    deadline: Optional[datetime] = None
    progress: float
    status: str
    created_at: datetime


class MentorProfile(BaseModel):
    id: str
    user_id: str
    name: str
    avatar: Optional[str] = None
    expertise: List[str]
    experience_years: int
    rating: float
    mentees_count: int
    availability: str
    hourly_rate: Optional[float] = None


class MentorshipRequest(BaseModel):
    id: str
    mentee_id: str
    mentor_id: str
    message: str
    goals: List[str]
    status: str
    created_at: datetime


@router.get("/paths", response_model=List[CareerPath])
async def get_career_paths(
    category: Optional[str] = None,
    current_user=Depends(get_current_active_user)
):
    """Get available career paths"""
    return [
        CareerPath(
            id="path-fullstack",
            name="Full Stack Developer",
            description="Master both frontend and backend development",
            skills_required=[
                {"name": "JavaScript", "level": "advanced"},
                {"name": "React", "level": "advanced"},
                {"name": "Node.js", "level": "intermediate"},
                {"name": "Databases", "level": "intermediate"}
            ],
            milestones=[
                {"name": "Frontend Basics", "duration": "3 months"},
                {"name": "Backend Fundamentals", "duration": "3 months"},
                {"name": "Full Stack Projects", "duration": "6 months"}
            ],
            estimated_duration="12-18 months",
            salary_range={"min": 70000, "max": 150000},
            job_outlook="Excellent - High demand",
            related_paths=["frontend-developer", "backend-developer"]
        ),
        CareerPath(
            id="path-data-science",
            name="Data Scientist",
            description="Analyze data and build ML models",
            skills_required=[
                {"name": "Python", "level": "advanced"},
                {"name": "Statistics", "level": "advanced"},
                {"name": "Machine Learning", "level": "intermediate"},
                {"name": "SQL", "level": "intermediate"}
            ],
            milestones=[
                {"name": "Python & Statistics", "duration": "4 months"},
                {"name": "ML Fundamentals", "duration": "4 months"},
                {"name": "Applied Projects", "duration": "4 months"}
            ],
            estimated_duration="12-24 months",
            salary_range={"min": 80000, "max": 180000},
            job_outlook="Excellent - Growing rapidly",
            related_paths=["ml-engineer", "data-analyst"]
        )
    ]


@router.get("/paths/{path_id}", response_model=CareerPath)
async def get_career_path(
    path_id: str,
    current_user=Depends(get_current_active_user)
):
    """Get specific career path details"""
    return CareerPath(
        id=path_id,
        name="Full Stack Developer",
        description="Master both frontend and backend development",
        skills_required=[{"name": "JavaScript", "level": "advanced"}],
        milestones=[{"name": "Frontend Basics", "duration": "3 months"}],
        estimated_duration="12-18 months",
        salary_range={"min": 70000, "max": 150000},
        job_outlook="Excellent",
        related_paths=["frontend-developer"]
    )


@router.get("/my-progress", response_model=List[SkillProgress])
async def get_my_skill_progress(
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get current user's skill progress"""
    return [
        SkillProgress(
            skill_id="skill-python",
            skill_name="Python",
            current_level=SkillLevel.INTERMEDIATE,
            target_level=SkillLevel.ADVANCED,
            progress_percentage=65.0,
            hours_invested=120,
            projects_completed=8,
            certifications=["Python Professional Certificate"]
        ),
        SkillProgress(
            skill_id="skill-react",
            skill_name="React",
            current_level=SkillLevel.BEGINNER,
            target_level=SkillLevel.INTERMEDIATE,
            progress_percentage=40.0,
            hours_invested=50,
            projects_completed=3,
            certifications=[]
        )
    ]


@router.post("/goals", response_model=LearningGoal)
async def create_learning_goal(
    title: str,
    target_skill: str,
    target_level: SkillLevel,
    deadline: Optional[datetime] = None,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a learning goal"""
    return LearningGoal(
        id="goal-new",
        user_id=str(current_user.id),
        title=title,
        description=f"Learn {target_skill} to {target_level} level",
        target_skill=target_skill,
        target_level=target_level,
        deadline=deadline,
        progress=0.0,
        status="active",
        created_at=datetime.utcnow()
    )


@router.get("/goals", response_model=List[LearningGoal])
async def get_my_learning_goals(
    status: Optional[str] = None,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get user's learning goals"""
    return [
        LearningGoal(
            id="goal-1",
            user_id=str(current_user.id),
            title="Master React",
            description="Become proficient in React development",
            target_skill="React",
            target_level=SkillLevel.ADVANCED,
            deadline=datetime(2025, 12, 31),
            progress=45.0,
            status="active",
            created_at=datetime.utcnow()
        )
    ]


@router.put("/goals/{goal_id}", response_model=LearningGoal)
async def update_learning_goal(
    goal_id: str,
    progress: Optional[float] = None,
    status: Optional[str] = None,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update learning goal progress"""
    return LearningGoal(
        id=goal_id,
        user_id=str(current_user.id),
        title="Master React",
        description="Become proficient in React development",
        target_skill="React",
        target_level=SkillLevel.ADVANCED,
        progress=progress or 50.0,
        status=status or "active",
        created_at=datetime.utcnow()
    )


@router.delete("/goals/{goal_id}")
async def delete_learning_goal(
    goal_id: str,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a learning goal"""
    return {"message": f"Goal {goal_id} deleted"}


@router.get("/mentors", response_model=List[MentorProfile])
async def find_mentors(
    skill: Optional[str] = None,
    min_experience: int = Query(0, ge=0),
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Find available mentors"""
    return [
        MentorProfile(
            id="mentor-1",
            user_id="user-mentor-1",
            name="John Smith",
            expertise=["Python", "Machine Learning", "Data Science"],
            experience_years=10,
            rating=4.9,
            mentees_count=25,
            availability="weekends",
            hourly_rate=75.0
        ),
        MentorProfile(
            id="mentor-2",
            user_id="user-mentor-2",
            name="Sarah Johnson",
            expertise=["React", "JavaScript", "TypeScript"],
            experience_years=8,
            rating=4.8,
            mentees_count=18,
            availability="evenings",
            hourly_rate=65.0
        )
    ]


@router.post("/mentorship/request", response_model=MentorshipRequest)
async def request_mentorship(
    mentor_id: str,
    message: str,
    goals: List[str],
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Request mentorship from a mentor"""
    return MentorshipRequest(
        id="request-new",
        mentee_id=str(current_user.id),
        mentor_id=mentor_id,
        message=message,
        goals=goals,
        status="pending",
        created_at=datetime.utcnow()
    )


@router.get("/mentorship/requests", response_model=List[MentorshipRequest])
async def get_mentorship_requests(
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get mentorship requests (as mentor or mentee)"""
    return []


@router.put("/mentorship/requests/{request_id}")
async def respond_to_mentorship(
    request_id: str,
    action: str = Query(..., enum=["accept", "reject"]),
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Accept or reject mentorship request"""
    return {
        "request_id": request_id,
        "status": "accepted" if action == "accept" else "rejected"
    }


@router.get("/recommendations")
async def get_career_recommendations(
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get personalized career recommendations"""
    return {
        "recommended_paths": [
            {"path": "Full Stack Developer", "match_score": 0.92},
            {"path": "Backend Developer", "match_score": 0.85}
        ],
        "recommended_skills": [
            {"skill": "TypeScript", "reason": "Complements your JavaScript skills"},
            {"skill": "Docker", "reason": "In-demand DevOps skill"}
        ],
        "recommended_courses": [
            {"title": "Advanced React Patterns", "provider": "Udemy"},
            {"title": "System Design", "provider": "Coursera"}
        ]
    }


@router.get("/skill-gap-analysis")
async def analyze_skill_gaps(
    target_role: str,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Analyze skill gaps for target role"""
    return {
        "target_role": target_role,
        "current_match": 65,
        "gaps": [
            {"skill": "System Design", "importance": "high", "current_level": "none"},
            {"skill": "AWS", "importance": "medium", "current_level": "beginner"}
        ],
        "strengths": [
            {"skill": "Python", "level": "advanced"},
            {"skill": "Problem Solving", "level": "advanced"}
        ],
        "time_to_ready": "6-9 months"
    }


@router.post("/skill-assessment")
async def start_skill_assessment(
    skill: str,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Start a skill assessment"""
    return {
        "assessment_id": "assessment-new",
        "skill": skill,
        "questions_count": 25,
        "time_limit": 45,
        "start_url": f"/assessments/assessment-new/start"
    }


@router.get("/certifications")
async def get_recommended_certifications(
    current_user=Depends(get_current_active_user)
):
    """Get recommended certifications"""
    return [
        {
            "name": "AWS Solutions Architect",
            "provider": "Amazon",
            "difficulty": "intermediate",
            "value_score": 9.2,
            "avg_salary_boost": "15%"
        },
        {
            "name": "Google Professional Cloud Developer",
            "provider": "Google",
            "difficulty": "advanced",
            "value_score": 8.8,
            "avg_salary_boost": "12%"
        }
    ]

