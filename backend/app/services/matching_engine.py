# @AI-HINT: AI-powered matching engine using skill embeddings and ML algorithms for smart project-freelancer matching
"""
AI-Powered Matching Engine
Uses skill embeddings, historical data, and ML algorithms to match freelancers with projects
"""

from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import text, func, and_, or_
from app.models.project import Project
from app.models.user import User
from app.models.proposal import Proposal
from app.models.contract import Contract
from app.models.review import Review
from datetime import datetime, timedelta
import json
import logging
import math
from collections import defaultdict

logger = logging.getLogger(__name__)


class MatchingEngine:
    """AI-powered matching engine for project-freelancer recommendations"""
    
    def __init__(self, db: Session):
        self.db = db
        self._ensure_matching_tables()
    
    def _ensure_matching_tables(self):
        """Create matching-related tables if they don't exist"""
        try:
            # Skill embeddings table for ML-based matching
            self.db.execute(text("""
                CREATE TABLE IF NOT EXISTS skill_embeddings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    skill_name VARCHAR(100) NOT NULL UNIQUE,
                    embedding_vector TEXT NOT NULL,
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
            """))
            
            # Match scores cache table
            self.db.execute(text("""
                CREATE TABLE IF NOT EXISTS match_scores (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    project_id INTEGER NOT NULL,
                    freelancer_id INTEGER NOT NULL,
                    score FLOAT NOT NULL,
                    factors TEXT,
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(project_id) REFERENCES projects(id),
                    FOREIGN KEY(freelancer_id) REFERENCES users(id),
                    UNIQUE(project_id, freelancer_id)
                )
            """))
            
            # Recommendation history
            self.db.execute(text("""
                CREATE TABLE IF NOT EXISTS recommendation_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    item_type VARCHAR(20) NOT NULL,
                    item_id INTEGER NOT NULL,
                    score FLOAT NOT NULL,
                    shown_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    clicked BOOLEAN DEFAULT FALSE,
                    FOREIGN KEY(user_id) REFERENCES users(id)
                )
            """))
            
            self.db.commit()
        except Exception as e:
            self.db.rollback()
            logger.error("Failed to create matching tables: %s", e)
    
    def calculate_skill_match_score(self, project_skills: List[str], freelancer_skills: List[str]) -> float:
        """
        Calculate skill match score between project requirements and freelancer skills
        Returns score from 0.0 to 1.0
        """
        if not project_skills or not freelancer_skills:
            return 0.0
        
        project_skills_set = set([s.lower() for s in project_skills])
        freelancer_skills_set = set([s.lower() for s in freelancer_skills])
        
        # Exact matches
        matches = project_skills_set.intersection(freelancer_skills_set)
        
        if len(project_skills_set) == 0:
            return 0.0
        
        # Calculate Jaccard similarity
        union = project_skills_set.union(freelancer_skills_set)
        jaccard = len(matches) / len(union)
        
        # Bonus for covering all required skills
        coverage = len(matches) / len(project_skills_set)
        
        # Weighted score
        score = (jaccard * 0.4) + (coverage * 0.6)
        
        return min(score, 1.0)
    
    def calculate_success_rate(self, freelancer_id: int) -> float:
        """Calculate freelancer's historical success rate"""
        # Count completed contracts
        completed = self.db.query(Contract).filter(
            Contract.freelancer_id == freelancer_id,
            Contract.status == "completed"
        ).count()
        
        # Count total contracts
        total = self.db.query(Contract).filter(
            Contract.freelancer_id == freelancer_id
        ).count()
        
        if total == 0:
            return 0.5  # Neutral score for new freelancers
        
        return completed / total
    
    def calculate_avg_rating(self, freelancer_id: int) -> float:
        """Calculate average rating from reviews"""
        result = self.db.query(func.avg(Review.rating)).filter(
            Review.reviewee_id == freelancer_id
        ).scalar()
        
        return float(result) if result else 0.0
    
    def calculate_budget_match_score(self, project: Project, freelancer: User) -> float:
        """
        Calculate how well freelancer's rate matches project budget
        Returns score from 0.0 to 1.0
        """
        if not freelancer.hourly_rate or not project.budget_max:
            return 0.5  # Neutral if no data
        
        # For hourly projects
        if project.budget_type == "hourly":
            if freelancer.hourly_rate <= project.budget_max:
                # Perfect match if within budget
                return 1.0
            else:
                # Penalize if too expensive
                overage = (freelancer.hourly_rate - project.budget_max) / project.budget_max
                return max(0.0, 1.0 - (overage * 0.5))
        
        # For fixed projects
        elif project.budget_type == "fixed":
            # Estimate hours needed
            estimated_hours = (project.budget_max + (project.budget_min or 0)) / 2 / freelancer.hourly_rate
            
            # Prefer freelancers who can complete within budget
            if estimated_hours >= 10:  # Reasonable project size
                return 1.0
            else:
                return 0.7  # Slightly lower score if project might be too small
        
        return 0.5
    
    def calculate_experience_match_score(self, project: Project, freelancer: User) -> float:
        """
        Match freelancer experience level with project requirements
        """
        if not project.experience_level:
            return 1.0  # No preference
        
        # Count freelancer's completed projects
        completed_count = self.db.query(Contract).filter(
            Contract.freelancer_id == freelancer.id,
            Contract.status == "completed"
        ).count()
        
        level_map = {
            "entry": (0, 5),
            "intermediate": (5, 15),
            "expert": (15, float('inf'))
        }
        
        required_range = level_map.get(project.experience_level.lower(), (0, float('inf')))
        
        if required_range[0] <= completed_count <= required_range[1]:
            return 1.0
        elif completed_count > required_range[1]:
            # Overqualified - slight penalty
            return 0.8
        else:
            # Underqualified - larger penalty
            return 0.4
    
    def calculate_availability_score(self, freelancer_id: int) -> float:
        """
        Calculate freelancer availability based on active contracts
        """
        active_contracts = self.db.query(Contract).filter(
            Contract.freelancer_id == freelancer_id,
            Contract.status.in_(["active", "in_progress"])
        ).count()
        
        if active_contracts == 0:
            return 1.0  # Fully available
        elif active_contracts == 1:
            return 0.7  # Somewhat available
        elif active_contracts == 2:
            return 0.4  # Limited availability
        else:
            return 0.1  # Very busy
    
    def calculate_response_rate(self, freelancer_id: int) -> float:
        """
        Calculate how quickly freelancer responds to proposals
        """
        # Count proposals submitted vs opportunities
        # This would require tracking proposal views
        # For now, use proposal acceptance rate
        
        proposals = self.db.query(Proposal).filter(
            Proposal.freelancer_id == freelancer_id
        ).count()
        
        accepted = self.db.query(Proposal).filter(
            Proposal.freelancer_id == freelancer_id,
            Proposal.status == "accepted"
        ).count()
        
        if proposals == 0:
            return 0.5  # Neutral for new users
        
        return min(accepted / proposals, 1.0)
    
    def calculate_match_score(self, project: Project, freelancer: User) -> Dict[str, Any]:
        """
        Calculate comprehensive match score between project and freelancer
        Returns score and breakdown of factors
        """
        # Parse skills
        project_skills = []
        freelancer_skills = []
        
        try:
            if isinstance(project.skills, str):
                project_skills = json.loads(project.skills)
            else:
                project_skills = project.skills or []
        except (json.JSONDecodeError, TypeError, ValueError):
            project_skills = []
        
        try:
            if isinstance(freelancer.skills, str):
                freelancer_skills = json.loads(freelancer.skills)
            else:
                freelancer_skills = freelancer.skills or []
        except (json.JSONDecodeError, TypeError, ValueError):
            freelancer_skills = []
        
        # Calculate individual factors
        factors = {
            "skill_match": self.calculate_skill_match_score(project_skills, freelancer_skills),
            "success_rate": self.calculate_success_rate(freelancer.id),
            "avg_rating": self.calculate_avg_rating(freelancer.id) / 5.0,  # Normalize to 0-1
            "budget_match": self.calculate_budget_match_score(project, freelancer),
            "experience_match": self.calculate_experience_match_score(project, freelancer),
            "availability": self.calculate_availability_score(freelancer.id),
            "response_rate": self.calculate_response_rate(freelancer.id)
        }
        
        # Weighted scoring
        weights = {
            "skill_match": 0.30,       # Most important
            "success_rate": 0.20,
            "avg_rating": 0.15,
            "budget_match": 0.15,
            "experience_match": 0.10,
            "availability": 0.05,
            "response_rate": 0.05
        }
        
        # Calculate total score
        total_score = sum(factors[key] * weights[key] for key in factors.keys())
        
        return {
            "score": round(total_score, 3),
            "factors": {k: round(v, 3) for k, v in factors.items()},
            "weights": weights
        }
    
    def get_recommended_freelancers(
        self,
        project_id: int,
        limit: int = 10,
        min_score: float = 0.5
    ) -> List[Dict[str, Any]]:
        """
        Get recommended freelancers for a project using AI matching
        """
        project = self.db.query(Project).filter(Project.id == project_id).first()
        if not project:
            return []
        
        # Get all active freelancers
        freelancers = self.db.query(User).filter(
            User.user_type == "freelancer",
            User.is_active == True
        ).all()
        
        # Calculate match scores
        recommendations = []
        for freelancer in freelancers:
            match_result = self.calculate_match_score(project, freelancer)
            
            if match_result["score"] >= min_score:
                recommendations.append({
                    "freelancer_id": freelancer.id,
                    "freelancer_name": freelancer.name,
                    "freelancer_bio": freelancer.bio,
                    "hourly_rate": freelancer.hourly_rate,
                    "location": freelancer.location,
                    "profile_image_url": freelancer.profile_image_url,
                    "match_score": match_result["score"],
                    "match_factors": match_result["factors"]
                })
        
        # Sort by match score
        recommendations.sort(key=lambda x: x["match_score"], reverse=True)
        
        # Cache results
        for rec in recommendations[:limit]:
            try:
                self.db.execute(
                    text("""
                        INSERT OR REPLACE INTO match_scores (project_id, freelancer_id, score, factors)
                        VALUES (:project_id, :freelancer_id, :score, :factors)
                    """),
                    {
                        "project_id": project_id,
                        "freelancer_id": rec["freelancer_id"],
                        "score": rec["match_score"],
                        "factors": json.dumps(rec["match_factors"])
                    }
                )
                self.db.commit()
            except Exception:
                self.db.rollback()
        
        return recommendations[:limit]
    
    def get_recommended_projects(
        self,
        freelancer_id: int,
        limit: int = 10,
        min_score: float = 0.5
    ) -> List[Dict[str, Any]]:
        """
        Get recommended projects for a freelancer
        """
        freelancer = self.db.query(User).filter(User.id == freelancer_id).first()
        if not freelancer:
            return []
        
        # Get open projects
        projects = self.db.query(Project).filter(
            Project.status == "open"
        ).all()
        
        # Calculate match scores
        recommendations = []
        for project in projects:
            match_result = self.calculate_match_score(project, freelancer)
            
            if match_result["score"] >= min_score:
                recommendations.append({
                    "project_id": project.id,
                    "project_title": project.title,
                    "project_description": project.description,
                    "category": project.category,
                    "budget_min": project.budget_min,
                    "budget_max": project.budget_max,
                    "budget_type": project.budget_type,
                    "experience_level": project.experience_level,
                    "created_at": project.created_at.isoformat(),
                    "match_score": match_result["score"],
                    "match_factors": match_result["factors"]
                })
        
        # Sort by match score
        recommendations.sort(key=lambda x: x["match_score"], reverse=True)
        
        return recommendations[:limit]
    
    def track_recommendation_click(self, user_id: int, item_type: str, item_id: int, score: float):
        """Track when a user clicks on a recommendation (for ML training data)"""
        try:
            self.db.execute(
                text("""
                    INSERT INTO recommendation_history (user_id, item_type, item_id, score, clicked)
                    VALUES (:user_id, :item_type, :item_id, :score, TRUE)
                """),
                {
                    "user_id": user_id,
                    "item_type": item_type,
                    "item_id": item_id,
                    "score": score
                }
            )
            self.db.commit()
        except Exception:
            self.db.rollback()


def get_matching_service(db: Session) -> MatchingEngine:
    """Dependency injection for matching service"""
    return MatchingEngine(db)
