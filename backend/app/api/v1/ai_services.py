"""
AI-powered services API endpoints
Price estimation, freelancer matching, fraud detection
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.session import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.project import ProjectCategory
from app.services.ai_matching import get_project_matches
from app.services.price_estimation import estimate_project, estimate_freelancer_rate_quick
from app.services.fraud_detection import FraudDetectionService

router = APIRouter(tags=["AI Services"])  # Prefix is added in routers.py


# ============ Chatbot Endpoint ============

@router.post("/chat")
async def ai_chatbot(
    message: str,
    db: Session = Depends(get_db)
):
    """
    AI Chatbot endpoint - responds to user queries
    
    **No authentication required** - public chatbot
    """
    # Simple rule-based responses for now
    message_lower = message.lower()
    
    if "hello" in message_lower or "hi" in message_lower:
        return {
            "response": "Hello! I'm MegiLance AI assistant. How can I help you today?",
            "confidence": 0.95
        }
    elif "price" in message_lower or "cost" in message_lower:
        return {
            "response": "I can help you estimate project costs! Please use the /ai/estimate-price endpoint with your project details.",
            "confidence": 0.9
        }
    elif "freelancer" in message_lower:
        return {
            "response": "Looking for freelancers? I can match you with the best talent for your project. Try posting a project first!",
            "confidence": 0.85
        }
    elif "help" in message_lower:
        return {
            "response": "I can assist with: project price estimation, freelancer matching, and answering questions about MegiLance. What would you like to know?",
            "confidence": 0.9
        }
    else:
        return {
            "response": "Thanks for your message! I'm still learning. For now, try asking about pricing, freelancers, or help.",
            "confidence": 0.6
        }


# ============ Fraud Detection Endpoint ============

@router.post("/fraud-check")
async def fraud_detection(
    text: str,
    db: Session = Depends(get_db)
):
    """
    AI Fraud Detection - analyzes text for potential fraud indicators
    
    **No authentication required** - can be used during project posting
    """
    # Simple keyword-based fraud detection
    fraud_keywords = [
        "wire money", "western union", "moneygram", "advance payment",
        "upfront fee", "processing fee", "guarantee", "risk free",
        "click here", "urgent", "act now", "limited time"
    ]
    
    text_lower = text.lower()
    detected_flags = []
    
    for keyword in fraud_keywords:
        if keyword in text_lower:
            detected_flags.append(keyword)
    
    risk_score = min(len(detected_flags) * 15, 100)
    
    return {
        "risk_score": risk_score,
        "risk_level": "high" if risk_score > 60 else "medium" if risk_score > 30 else "low",
        "flags": detected_flags,
        "message": "Potential fraud indicators detected" if detected_flags else "No obvious fraud indicators"
    }


@router.get("/match-freelancers/{project_id}")
async def match_freelancers_to_project(
    project_id: int,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get AI-powered freelancer matches for a project
    
    - **project_id**: ID of the project
    - **limit**: Maximum number of matches to return
    """
    try:
        matches = await get_project_matches(db, project_id, limit)
        return {
            "project_id": project_id,
            "matches": matches,
            "total_matches": len(matches)
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error matching freelancers: {str(e)}"
        )


@router.post("/estimate-price")
async def estimate_project_price(
    category: ProjectCategory,
    skills_required: List[str],
    description: str = "",
    estimated_hours: Optional[int] = None,
    complexity: str = "moderate",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get AI-powered price estimation for a project
    
    - **category**: Project category
    - **skills_required**: List of required skills
    - **description**: Project description
    - **estimated_hours**: Estimated hours (optional)
    - **complexity**: simple, moderate, complex, or expert
    """
    try:
        estimation = await estimate_project(
            db, category, skills_required, description, estimated_hours, complexity
        )
        return estimation
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error estimating price: {str(e)}"
        )


@router.get("/estimate-freelancer-rate/{freelancer_id}")
async def estimate_freelancer_hourly_rate(
    freelancer_id: int,
    years_experience: Optional[int] = None,
    skills: Optional[List[str]] = None,
    completed_projects: Optional[int] = None,
    average_rating: Optional[float] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get AI-powered rate estimation for a freelancer
    
    - **freelancer_id**: ID of the freelancer
    - **years_experience**: Years of professional experience
    - **skills**: List of skills
    - **completed_projects**: Number of completed projects
    - **average_rating**: Average client rating
    """
    try:
        estimation = await estimate_freelancer_rate_quick(
            db, freelancer_id,
            years_experience=years_experience,
            skills=skills,
            completed_projects=completed_projects,
            average_rating=average_rating
        )
        return estimation
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error estimating freelancer rate: {str(e)}"
        )


@router.get("/fraud-check/user/{user_id}")
async def check_user_fraud_risk(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Analyze user for fraudulent behavior
    
    - **user_id**: ID of the user to analyze
    
    Requires admin privileges or own user
    """
    # Only allow admins or self
    if current_user.id != user_id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to check this user"
        )
    
    try:
        fraud_service = FraudDetectionService(db)
        analysis = await fraud_service.analyze_user(user_id)
        return analysis
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error analyzing user: {str(e)}"
        )


@router.get("/fraud-check/project/{project_id}")
async def check_project_fraud_risk(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Analyze project for fraudulent characteristics
    
    - **project_id**: ID of the project to analyze
    """
    try:
        fraud_service = FraudDetectionService(db)
        analysis = await fraud_service.analyze_project(project_id)
        return analysis
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error analyzing project: {str(e)}"
        )


@router.get("/fraud-check/proposal/{proposal_id}")
async def check_proposal_fraud_risk(
    proposal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Analyze proposal for suspicious activity
    
    - **proposal_id**: ID of the proposal to analyze
    """
    try:
        fraud_service = FraudDetectionService(db)
        analysis = await fraud_service.analyze_proposal(proposal_id)
        return analysis
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error analyzing proposal: {str(e)}"
        )
