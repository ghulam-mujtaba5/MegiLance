"""
AI-powered Freelancer Matching Service
Matches freelancers to projects based on skills, experience, and other factors
"""

from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
import logging
from datetime import datetime

from app.models.user import User, UserType
from app.models.project import Project, ProjectStatus
from app.models.proposal import Proposal
from app.services.vector_embeddings import VectorEmbeddingService
from app.services.turso_vector_search import TursoVectorSearchService

logger = logging.getLogger(__name__)


class AIMatchingService:
    """Service for AI-powered freelancer-project matching"""
    
    def __init__(self, db: Session):
        self.db = db
        self.vector_service = VectorEmbeddingService()
        self.turso_search = TursoVectorSearchService()
        
    async def find_matching_freelancers(
        self, 
        project_id: int,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Find freelancers that match a project's requirements
        Uses Hybrid Search: Vector Similarity + Heuristic Scoring
        
        Args:
            project_id: ID of the project
            limit: Maximum number of matches to return
            
        Returns:
            List of freelancer matches with scores
        """
        try:
            # Get project
            project = self.db.query(Project).filter(Project.id == project_id).first()
            if not project:
                logger.error(f"Project {project_id} not found")
                return []

            # 1. Try Vector Search First (Candidate Generation)
            vector_matches = []
            try:
                # Generate embedding if missing (lazy generation)
                project_embedding = await self.vector_service.generate_project_embedding(project.__dict__)
                vector_matches = await self.turso_search.search_similar_freelancers(project_embedding, limit=limit*2)
            except Exception as e:
                logger.warning(f"Vector search failed (falling back to heuristic): {e}")

            # 2. Get Heuristic Candidates (if vector search returned few/no results)
            heuristic_freelancers = []
            if len(vector_matches) < limit:
                heuristic_freelancers = self.db.query(User).filter(
                    User.user_type == UserType.FREELANCER,
                    User.is_active == True,
                    User.is_verified == True
                ).limit(50).all() # Limit to 50 for performance
            
            # Combine candidates
            candidate_ids = set([m['id'] for m in vector_matches] + [f.id for f in heuristic_freelancers])
            candidates = self.db.query(User).filter(User.id.in_(candidate_ids)).all()
            
            if not candidates:
                return []
            
            # 3. Calculate Final Hybrid Scores
            matches = []
            for freelancer in candidates:
                # Base heuristic score
                heuristic_score = await self._calculate_match_score(freelancer, project)
                
                # Vector score (if available)
                vector_score = 0.0
                v_match = next((m for m in vector_matches if m['id'] == freelancer.id), None)
                if v_match and 'distance' in v_match:
                    # Convert distance to similarity (0 to 1)
                    # Assuming cosine distance (0=identical, 2=opposite)
                    vector_score = max(0.0, 1.0 - v_match['distance'])
                
                # Weighted Hybrid Score: 70% Heuristic (Hard constraints), 30% Vector (Semantic)
                # If vector search failed, use 100% heuristic
                if vector_matches:
                    final_score = (heuristic_score * 0.7) + (vector_score * 0.3)
                else:
                    final_score = heuristic_score

                if final_score > 0.3:  # Minimum threshold
                    matches.append({
                        'freelancer_id': freelancer.id,
                        'freelancer_name': f"{freelancer.first_name} {freelancer.last_name}",
                        'email': freelancer.email,
                        'match_score': round(final_score, 2),
                        'reasons': self._get_match_reasons(freelancer, project),
                        'profile_data': freelancer.profile_data or {}
                    })
            
            # Sort by score and limit
            matches.sort(key=lambda x: x['match_score'], reverse=True)
            return matches[:limit]
            
        except Exception as e:
            logger.error(f"Error in freelancer matching: {e}")
            return []
    
    async def _calculate_match_score(
        self, 
        freelancer: User,
        project: Project
    ) -> float:
        """Calculate match score between freelancer and project"""
        
        scores = []
        
        # Skills matching (40% weight)
        skill_score = self._calculate_skill_match(
            freelancer.profile_data or {}, 
            project
        )
        scores.append(skill_score * 0.4)
        
        # Budget compatibility (20% weight)
        budget_score = self._calculate_budget_compatibility(
            freelancer.profile_data or {}, 
            project
        )
        scores.append(budget_score * 0.2)
        
        # Rating/reviews score (20% weight)
        rating_score = self._calculate_rating_score(freelancer)
        scores.append(rating_score * 0.2)
        
        # Availability score (10% weight)
        availability_score = self._calculate_availability(freelancer)
        scores.append(availability_score * 0.1)
        
        # Success rate (10% weight)
        success_score = self._calculate_success_rate(freelancer)
        scores.append(success_score * 0.1)
        
        return sum(scores)
    
    def _calculate_skill_match(
        self, 
        profile_data: Dict[str, Any],
        project: Project
    ) -> float:
        """Calculate skill matching score"""
        required_skills = project.skills_required or []
        if not required_skills:
            return 0.5
        
        freelancer_skills = profile_data.get('skills', [])
        if not freelancer_skills:
            return 0.0
        
        # Convert to lowercase for comparison
        freelancer_skills_lower = [str(skill).lower() for skill in freelancer_skills]
        required_skills_lower = [str(skill).lower() for skill in required_skills]
        
        # Calculate matches
        matches = sum(1 for skill in required_skills_lower if skill in freelancer_skills_lower)
        return matches / len(required_skills) if required_skills else 0.0
    
    def _calculate_budget_compatibility(
        self,
        profile_data: Dict[str, Any],
        project: Project
    ) -> float:
        """Calculate budget compatibility score"""
        freelancer_rate = profile_data.get('hourly_rate', 0)
        if not freelancer_rate:
            return 0.5
        
        budget_min = project.budget_min or 0
        budget_max = project.budget_max or 0
        
        if not budget_max:
            return 0.5
        
        if budget_min <= freelancer_rate <= budget_max:
            return 1.0
        elif freelancer_rate < budget_min:
            return 0.8  # Slightly prefer lower rates
        else:
            # Penalize rates above budget
            return max(0.0, 1.0 - (freelancer_rate - budget_max) / budget_max)
    
    def _calculate_rating_score(self, freelancer: User) -> float:
        """Calculate rating-based score"""
        profile_data = freelancer.profile_data or {}
        avg_rating = profile_data.get('average_rating', 0)
        total_reviews = profile_data.get('total_reviews', 0)
        
        if total_reviews == 0:
            return 0.3  # New freelancers get neutral score
        
        # Normalize rating (assuming 1-5 scale)
        rating_score = (avg_rating - 1) / 4 if avg_rating > 0 else 0
        
        # Boost score for freelancers with more reviews
        review_boost = min(1.0, total_reviews / 10)
        
        return rating_score * (0.7 + 0.3 * review_boost)
    
    def _calculate_availability(self, freelancer: User) -> float:
        """Calculate availability score"""
        profile_data = freelancer.profile_data or {}
        
        # Check if marked as available
        is_available = profile_data.get('is_available', True)
        if not is_available:
            return 0.0
        
        # Check current workload
        active_proposals = self.db.query(Proposal).filter(
            Proposal.freelancer_id == freelancer.id,
            Proposal.status.in_(['SUBMITTED', 'ACCEPTED'])
        ).count()
        
        # More proposals = less available
        if active_proposals == 0:
            return 1.0
        elif active_proposals <= 3:
            return 0.7
        elif active_proposals <= 5:
            return 0.4
        else:
            return 0.2
    
    def _calculate_success_rate(self, freelancer: User) -> float:
        """Calculate success rate based on completed projects"""
        profile_data = freelancer.profile_data or {}
        
        completed_projects = profile_data.get('completed_projects', 0)
        total_projects = profile_data.get('total_projects', 0)
        
        if total_projects == 0:
            return 0.5  # Neutral score for new freelancers
        
        success_rate = completed_projects / total_projects
        return success_rate
    
    def _get_match_reasons(
        self, 
        freelancer: User,
        project: Project
    ) -> List[str]:
        """Get human-readable reasons for the match"""
        reasons = []
        profile_data = freelancer.profile_data or {}
        
        # Skill matches
        required_skills = project.skills_required or []
        freelancer_skills = profile_data.get('skills', [])
        matching_skills = [
            skill for skill in required_skills 
            if skill.lower() in [s.lower() for s in freelancer_skills]
        ]
        if matching_skills:
            reasons.append(f"Matches {len(matching_skills)}/{len(required_skills)} required skills")
        
        # High rating
        avg_rating = profile_data.get('average_rating', 0)
        if avg_rating >= 4.5:
            reasons.append(f"Highly rated ({avg_rating}/5.0)")
        
        # Experience
        completed_projects = profile_data.get('completed_projects', 0)
        if completed_projects > 10:
            reasons.append(f"Experienced ({completed_projects} completed projects)")
        
        # Budget fit
        hourly_rate = profile_data.get('hourly_rate', 0)
        budget_max = project.budget_max or 0
        if hourly_rate and budget_max and hourly_rate <= budget_max:
            reasons.append(f"Within budget (${hourly_rate}/hr)")
        
        # Availability
        is_available = profile_data.get('is_available', True)
        if is_available:
            reasons.append("Currently available")
        
        return reasons or ["General match"]


async def get_project_matches(
    db: Session,
    project_id: int,
    limit: int = 10
) -> List[Dict[str, Any]]:
    """
    Convenience function to get project matches
    
    Args:
        db: Database session
        project_id: Project ID
        limit: Maximum matches to return
        
    Returns:
        List of matching freelancers
    """
    service = AIMatchingService(db)
    return await service.find_matching_freelancers(project_id, limit)
