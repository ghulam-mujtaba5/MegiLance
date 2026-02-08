# @AI-HINT: Content recommendation engine using collaborative filtering and ML
"""
Recommendation Engine Service - AI-powered content recommendations.

Features:
- Collaborative filtering
- Content-based filtering
- Hybrid recommendations
- Real-time personalization
- Trending detection
- Similar items
- User preferences learning
"""

import logging
import math
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict, Any, Set
from sqlalchemy.orm import Session
from collections import defaultdict

logger = logging.getLogger(__name__)


class RecommendationEngine:
    """
    AI-powered recommendation engine using collaborative and content-based filtering.
    
    Provides personalized recommendations for projects, freelancers,
    and content based on user behavior and preferences.
    """
    
    def __init__(self, db: Session):
        self.db = db
        
        # User interaction matrices
        self._user_project_views: Dict[int, Dict[int, int]] = defaultdict(lambda: defaultdict(int))
        self._user_project_applications: Dict[int, Set[int]] = defaultdict(set)
        self._user_freelancer_hires: Dict[int, Set[int]] = defaultdict(set)
        self._user_category_preferences: Dict[int, Dict[str, float]] = defaultdict(lambda: defaultdict(float))
        self._user_skill_preferences: Dict[int, Dict[str, float]] = defaultdict(lambda: defaultdict(float))
        
        # Item features
        self._project_features: Dict[int, Dict[str, Any]] = {}
        self._freelancer_features: Dict[int, Dict[str, Any]] = {}
        
        # Similarity caches
        self._user_similarity_cache: Dict[str, float] = {}
        self._item_similarity_cache: Dict[str, float] = {}
        
        # Trending tracking
        self._hourly_views: Dict[int, List[datetime]] = defaultdict(list)
        self._daily_applications: Dict[int, List[datetime]] = defaultdict(list)

        # Load initial data from DB to persist state across restarts
        self._load_initial_data()

    def _load_initial_data(self):
        """Load historical data from database to populate recommendation matrices."""
        try:
            from app.models.project import Project
            from app.models.user import User
            from app.models.proposal import Proposal
            from app.models.contract import Contract
            import json

            # 1. Load Projects
            projects = self.db.query(Project).filter(Project.status == 'open').all()
            for p in projects:
                skills = []
                if p.skills:
                    try:
                        skills = json.loads(p.skills) if isinstance(p.skills, str) else p.skills
                    except:
                        skills = []
                
                self._project_features[p.id] = {
                    "title": p.title,
                    "category": p.category,
                    "skills": skills,
                    "budget_min": p.budget_min,
                    "budget_max": p.budget_max,
                    "experience_level": p.experience_level,
                    "created_at": p.created_at.isoformat() if p.created_at else datetime.now(timezone.utc).isoformat()
                }

            # 2. Load Freelancers
            freelancers = self.db.query(User).filter(User.user_type == 'Freelancer').all()
            for f in freelancers:
                skills = []
                if f.skills:
                    try:
                        skills = json.loads(f.skills) if isinstance(f.skills, str) else f.skills
                    except:
                        skills = []
                
                self._freelancer_features[f.id] = {
                    "name": f.name,
                    "title": f.profile_data, # Assuming title is in profile_data or similar
                    "skills": skills,
                    "hourly_rate": f.hourly_rate,
                    "rating": 0, # TODO: Calculate from reviews
                    "experience_years": 0, # TODO: Get from profile
                    "completed_projects": 0 # TODO: Count completed contracts
                }

            # 3. Load Applications (Proposals)
            proposals = self.db.query(Proposal).all()
            for prop in proposals:
                self._user_project_applications[prop.freelancer_id].add(prop.project_id)
                # Update preferences based on applications
                if prop.project_id in self._project_features:
                    feats = self._project_features[prop.project_id]
                    if "category" in feats:
                        self._user_category_preferences[prop.freelancer_id][feats["category"]] += 0.5
                    for skill in feats.get("skills", []):
                        self._user_skill_preferences[prop.freelancer_id][skill] += 0.5

            # 4. Load Hires (Contracts)
            contracts = self.db.query(Contract).all()
            for c in contracts:
                self._user_freelancer_hires[c.client_id].add(c.freelancer_id)
                # Update client preferences
                if c.freelancer_id in self._freelancer_features:
                    feats = self._freelancer_features[c.freelancer_id]
                    for skill in feats.get("skills", []):
                        self._user_skill_preferences[c.client_id][skill] += 1.0

            logger.info(f"Recommendation Engine warmed up: {len(self._project_features)} projects, {len(self._freelancer_features)} freelancers")

        except Exception as e:
            logger.error(f"Error warming up recommendation engine: {e}")

    
    # ===================
    # Event Tracking
    # ===================
    
    async def track_view(
        self,
        user_id: int,
        project_id: int,
        duration_seconds: Optional[int] = None
    ) -> None:
        """Track user viewing a project."""
        self._user_project_views[user_id][project_id] += 1
        self._hourly_views[project_id].append(datetime.now(timezone.utc))
        
        # Clean old view records
        cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
        self._hourly_views[project_id] = [
            t for t in self._hourly_views[project_id] if t > cutoff
        ]
        
        # Update category preferences if project has features
        if project_id in self._project_features:
            features = self._project_features[project_id]
            weight = 0.1  # View weight
            
            if "category" in features:
                self._user_category_preferences[user_id][features["category"]] += weight
            
            for skill in features.get("skills", []):
                self._user_skill_preferences[user_id][skill] += weight
    
    async def track_application(
        self,
        user_id: int,
        project_id: int
    ) -> None:
        """Track user applying to a project."""
        self._user_project_applications[user_id].add(project_id)
        self._daily_applications[project_id].append(datetime.now(timezone.utc))
        
        # Higher weight for applications
        if project_id in self._project_features:
            features = self._project_features[project_id]
            weight = 0.5
            
            if "category" in features:
                self._user_category_preferences[user_id][features["category"]] += weight
            
            for skill in features.get("skills", []):
                self._user_skill_preferences[user_id][skill] += weight
    
    async def track_hire(
        self,
        client_id: int,
        freelancer_id: int,
        project_id: int
    ) -> None:
        """Track client hiring a freelancer."""
        self._user_freelancer_hires[client_id].add(freelancer_id)
        
        # Update client preferences based on hired freelancer
        if freelancer_id in self._freelancer_features:
            features = self._freelancer_features[freelancer_id]
            weight = 1.0  # Hire is strongest signal
            
            for skill in features.get("skills", []):
                self._user_skill_preferences[client_id][skill] += weight
    
    async def register_project(
        self,
        project_id: int,
        features: Dict[str, Any]
    ) -> None:
        """Register project features for recommendations."""
        self._project_features[project_id] = {
            "title": features.get("title", ""),
            "category": features.get("category", ""),
            "skills": features.get("skills", []),
            "budget_min": features.get("budget_min", 0),
            "budget_max": features.get("budget_max", 0),
            "experience_level": features.get("experience_level", ""),
            "created_at": features.get("created_at", datetime.now(timezone.utc).isoformat())
        }
    
    async def register_freelancer(
        self,
        freelancer_id: int,
        features: Dict[str, Any]
    ) -> None:
        """Register freelancer features for recommendations."""
        self._freelancer_features[freelancer_id] = {
            "name": features.get("name", ""),
            "title": features.get("title", ""),
            "skills": features.get("skills", []),
            "hourly_rate": features.get("hourly_rate", 0),
            "rating": features.get("rating", 0),
            "experience_years": features.get("experience_years", 0),
            "completed_projects": features.get("completed_projects", 0)
        }
    
    # ===================
    # Recommendations
    # ===================
    
    async def get_project_recommendations(
        self,
        user_id: int,
        limit: int = 10,
        exclude_applied: bool = True
    ) -> List[Dict[str, Any]]:
        """Get personalized project recommendations for a freelancer."""
        recommendations = []
        
        # Get user's applied projects
        applied = self._user_project_applications.get(user_id, set())
        
        # Collaborative filtering - find similar users
        similar_users = await self._find_similar_users(user_id, limit=20)
        
        # Get projects viewed/applied by similar users
        collaborative_scores: Dict[int, float] = defaultdict(float)
        
        for sim_user_id, similarity in similar_users:
            for project_id in self._user_project_applications.get(sim_user_id, set()):
                if exclude_applied and project_id in applied:
                    continue
                collaborative_scores[project_id] += similarity
        
        # Content-based filtering - match user preferences
        content_scores: Dict[int, float] = defaultdict(float)
        user_prefs = self._user_category_preferences.get(user_id, {})
        skill_prefs = self._user_skill_preferences.get(user_id, {})
        
        for project_id, features in self._project_features.items():
            if exclude_applied and project_id in applied:
                continue
            
            score = 0
            
            # Category match
            if features.get("category") in user_prefs:
                score += user_prefs[features["category"]]
            
            # Skill matches
            for skill in features.get("skills", []):
                if skill in skill_prefs:
                    score += skill_prefs[skill]
            
            if score > 0:
                content_scores[project_id] = score
        
        # Hybrid scoring - combine collaborative and content-based
        all_projects = set(collaborative_scores.keys()) | set(content_scores.keys())
        
        final_scores = []
        for project_id in all_projects:
            collab_score = collaborative_scores.get(project_id, 0)
            content_score = content_scores.get(project_id, 0)
            
            # Weighted combination
            combined = 0.6 * collab_score + 0.4 * content_score
            
            # Boost for trending
            trending_boost = self._calculate_trending_score(project_id)
            combined += 0.1 * trending_boost
            
            final_scores.append((project_id, combined))
        
        # Sort by score
        final_scores.sort(key=lambda x: x[1], reverse=True)
        
        for project_id, score in final_scores[:limit]:
            features = self._project_features.get(project_id, {})
            recommendations.append({
                "project_id": project_id,
                "score": round(score, 3),
                "features": features,
                "reason": self._get_recommendation_reason(
                    project_id, user_prefs, skill_prefs
                )
            })
        
        return recommendations
    
    async def get_freelancer_recommendations(
        self,
        client_id: int,
        project_skills: Optional[List[str]] = None,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get freelancer recommendations for a client."""
        recommendations = []
        
        # Get previously hired freelancers
        hired = self._user_freelancer_hires.get(client_id, set())
        
        scores: Dict[int, float] = defaultdict(float)
        
        for freelancer_id, features in self._freelancer_features.items():
            if freelancer_id in hired:
                # Boost previously hired freelancers
                scores[freelancer_id] += 2.0
            
            # Skill matching
            if project_skills:
                freelancer_skills = set(features.get("skills", []))
                matching_skills = len(set(project_skills) & freelancer_skills)
                scores[freelancer_id] += matching_skills * 0.5
            
            # Rating factor
            rating = features.get("rating", 0)
            scores[freelancer_id] += rating * 0.2
            
            # Experience factor
            completed = features.get("completed_projects", 0)
            scores[freelancer_id] += min(completed * 0.1, 2.0)
        
        # Collaborative - find freelancers hired by similar clients
        similar_clients = await self._find_similar_clients(client_id)
        
        for sim_client_id, similarity in similar_clients:
            for freelancer_id in self._user_freelancer_hires.get(sim_client_id, set()):
                scores[freelancer_id] += similarity * 0.5
        
        # Sort and return
        sorted_scores = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        
        for freelancer_id, score in sorted_scores[:limit]:
            features = self._freelancer_features.get(freelancer_id, {})
            recommendations.append({
                "freelancer_id": freelancer_id,
                "score": round(score, 3),
                "features": features
            })
        
        return recommendations
    
    async def get_similar_projects(
        self,
        project_id: int,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """Get projects similar to a given project."""
        if project_id not in self._project_features:
            return []
        
        base_features = self._project_features[project_id]
        base_skills = set(base_features.get("skills", []))
        base_category = base_features.get("category", "")
        
        similarities = []
        
        for other_id, features in self._project_features.items():
            if other_id == project_id:
                continue
            
            score = 0
            
            # Category match
            if features.get("category") == base_category:
                score += 2.0
            
            # Skill overlap
            other_skills = set(features.get("skills", []))
            if base_skills and other_skills:
                jaccard = len(base_skills & other_skills) / len(base_skills | other_skills)
                score += jaccard * 3.0
            
            # Budget similarity
            base_budget = (base_features.get("budget_min", 0) + 
                          base_features.get("budget_max", 0)) / 2
            other_budget = (features.get("budget_min", 0) + 
                          features.get("budget_max", 0)) / 2
            
            if base_budget > 0 and other_budget > 0:
                budget_ratio = min(base_budget, other_budget) / max(base_budget, other_budget)
                score += budget_ratio
            
            if score > 0:
                similarities.append((other_id, score))
        
        similarities.sort(key=lambda x: x[1], reverse=True)
        
        return [
            {
                "project_id": pid,
                "similarity": round(score, 3),
                "features": self._project_features.get(pid, {})
            }
            for pid, score in similarities[:limit]
        ]
    
    async def get_trending_projects(
        self,
        hours: int = 24,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get trending projects based on recent activity."""
        cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
        
        trending_scores = []
        
        for project_id, views in self._hourly_views.items():
            recent_views = len([t for t in views if t > cutoff])
            applications = len([
                t for t in self._daily_applications.get(project_id, [])
                if t > cutoff
            ])
            
            # Score: views + 3x applications
            score = recent_views + applications * 3
            
            if score > 0:
                trending_scores.append((project_id, score))
        
        trending_scores.sort(key=lambda x: x[1], reverse=True)
        
        return [
            {
                "project_id": pid,
                "trending_score": score,
                "features": self._project_features.get(pid, {})
            }
            for pid, score in trending_scores[:limit]
        ]
    
    async def get_user_preferences(
        self,
        user_id: int
    ) -> Dict[str, Any]:
        """Get learned user preferences."""
        category_prefs = dict(self._user_category_preferences.get(user_id, {}))
        skill_prefs = dict(self._user_skill_preferences.get(user_id, {}))
        
        # Normalize scores
        if category_prefs:
            max_cat = max(category_prefs.values())
            category_prefs = {k: v/max_cat for k, v in category_prefs.items()}
        
        if skill_prefs:
            max_skill = max(skill_prefs.values())
            skill_prefs = {k: v/max_skill for k, v in skill_prefs.items()}
        
        # Sort by score
        top_categories = sorted(category_prefs.items(), key=lambda x: x[1], reverse=True)[:5]
        top_skills = sorted(skill_prefs.items(), key=lambda x: x[1], reverse=True)[:10]
        
        return {
            "top_categories": [{"name": k, "score": round(v, 2)} for k, v in top_categories],
            "top_skills": [{"name": k, "score": round(v, 2)} for k, v in top_skills],
            "projects_viewed": sum(self._user_project_views.get(user_id, {}).values()),
            "projects_applied": len(self._user_project_applications.get(user_id, set()))
        }
    
    # ===================
    # Helper Methods
    # ===================
    
    async def _find_similar_users(
        self,
        user_id: int,
        limit: int = 10
    ) -> List[tuple]:
        """Find users with similar viewing/application patterns."""
        user_projects = self._user_project_applications.get(user_id, set())
        
        if not user_projects:
            return []
        
        similarities = []
        
        for other_id, other_projects in self._user_project_applications.items():
            if other_id == user_id:
                continue
            
            # Jaccard similarity
            intersection = len(user_projects & other_projects)
            union = len(user_projects | other_projects)
            
            if union > 0:
                similarity = intersection / union
                if similarity > 0:
                    similarities.append((other_id, similarity))
        
        similarities.sort(key=lambda x: x[1], reverse=True)
        return similarities[:limit]
    
    async def _find_similar_clients(
        self,
        client_id: int,
        limit: int = 10
    ) -> List[tuple]:
        """Find clients with similar hiring patterns."""
        client_hires = self._user_freelancer_hires.get(client_id, set())
        
        if not client_hires:
            return []
        
        similarities = []
        
        for other_id, other_hires in self._user_freelancer_hires.items():
            if other_id == client_id:
                continue
            
            intersection = len(client_hires & other_hires)
            union = len(client_hires | other_hires)
            
            if union > 0:
                similarity = intersection / union
                if similarity > 0:
                    similarities.append((other_id, similarity))
        
        similarities.sort(key=lambda x: x[1], reverse=True)
        return similarities[:limit]
    
    def _calculate_trending_score(self, project_id: int) -> float:
        """Calculate trending score for a project."""
        recent_views = self._hourly_views.get(project_id, [])
        recent_apps = self._daily_applications.get(project_id, [])
        
        cutoff_1h = datetime.now(timezone.utc) - timedelta(hours=1)
        cutoff_24h = datetime.now(timezone.utc) - timedelta(hours=24)
        
        views_1h = len([t for t in recent_views if t > cutoff_1h])
        views_24h = len([t for t in recent_views if t > cutoff_24h])
        apps_24h = len([t for t in recent_apps if t > cutoff_24h])
        
        # Score with recency weighting
        return views_1h * 2 + views_24h * 0.5 + apps_24h * 3
    
    def _get_recommendation_reason(
        self,
        project_id: int,
        category_prefs: Dict[str, float],
        skill_prefs: Dict[str, float]
    ) -> str:
        """Generate explanation for recommendation."""
        features = self._project_features.get(project_id, {})
        reasons = []
        
        category = features.get("category", "")
        if category in category_prefs:
            reasons.append(f"Matches your interest in {category}")
        
        skills = features.get("skills", [])
        matching_skills = [s for s in skills if s in skill_prefs]
        if matching_skills:
            reasons.append(f"Uses skills you know: {', '.join(matching_skills[:3])}")
        
        if self._calculate_trending_score(project_id) > 5:
            reasons.append("Trending now")
        
        return " • ".join(reasons) if reasons else "Based on your activity"


# Singleton instance
_recommendation_engine: Optional[RecommendationEngine] = None


def get_recommendation_engine(db: Session) -> RecommendationEngine:
    """Get or create recommendation engine instance."""
    global _recommendation_engine
    if _recommendation_engine is None:
        _recommendation_engine = RecommendationEngine(db)
    else:
        _recommendation_engine.db = db
    return _recommendation_engine
