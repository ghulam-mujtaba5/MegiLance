# @AI-HINT: AI-powered matching engine with skill graphs, synonym resolution, and multi-factor intelligent scoring
"""
AI-Powered Matching Engine v2.0
Intelligent matching using skill graphs, synonym resolution, behavioral signals,
historical success data, and multi-factor scoring with configurable weights.
"""

from typing import List, Dict, Any, Optional, Set, Tuple
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

# ============================================================================
# Skill Synonym Graph — resolves equivalent skill names
# ============================================================================

SKILL_SYNONYMS: Dict[str, Set[str]] = {
    "react": {"reactjs", "react.js", "react js"},
    "vue": {"vuejs", "vue.js", "vue js"},
    "angular": {"angularjs", "angular.js"},
    "node": {"nodejs", "node.js", "node js"},
    "express": {"expressjs", "express.js"},
    "next": {"nextjs", "next.js", "next js"},
    "nuxt": {"nuxtjs", "nuxt.js"},
    "typescript": {"ts"},
    "javascript": {"js", "ecmascript", "es6"},
    "python": {"python3", "py"},
    "csharp": {"c#", "c sharp"},
    "cpp": {"c++", "cplusplus"},
    "golang": {"go"},
    "postgresql": {"postgres", "psql"},
    "mongodb": {"mongo"},
    "mysql": {"mariadb"},
    "graphql": {"gql"},
    "rest": {"restful", "rest api", "restful api"},
    "aws": {"amazon web services", "amazon aws"},
    "gcp": {"google cloud", "google cloud platform"},
    "azure": {"microsoft azure"},
    "docker": {"containerization"},
    "kubernetes": {"k8s"},
    "ci/cd": {"cicd", "ci cd", "continuous integration"},
    "machine learning": {"ml"},
    "artificial intelligence": {"ai"},
    "deep learning": {"dl"},
    "natural language processing": {"nlp"},
    "html": {"html5"},
    "css": {"css3", "cascading style sheets"},
    "sass": {"scss"},
    "tailwind": {"tailwindcss", "tailwind css"},
    "bootstrap": {"bootstrap5"},
    "figma": {"figma design"},
    "photoshop": {"adobe photoshop", "ps"},
    "illustrator": {"adobe illustrator", "ai design"},
    "ui/ux": {"ui ux", "ux/ui", "ux ui", "user experience", "user interface"},
    "seo": {"search engine optimization"},
    "ppc": {"pay per click"},
    "google ads": {"adwords", "google adwords"},
    "facebook ads": {"meta ads"},
    "wordpress": {"wp"},
    "shopify": {"shopify development"},
    "flutter": {"flutter development"},
    "react native": {"rn", "react-native"},
    "swift": {"swiftui"},
    "kotlin": {"kotlin android"},
    "sql": {"structured query language"},
    "nosql": {"no sql"},
    "redis": {"redis cache"},
    "elasticsearch": {"elastic", "es"},
    "terraform": {"iac", "infrastructure as code"},
}

# Build reverse lookup: synonym -> canonical name
_SYNONYM_LOOKUP: Dict[str, str] = {}
for canonical, synonyms in SKILL_SYNONYMS.items():
    _SYNONYM_LOOKUP[canonical] = canonical
    for syn in synonyms:
        _SYNONYM_LOOKUP[syn] = canonical

# ============================================================================
# Skill Category Graph — skills that are related (partial credit)
# ============================================================================

SKILL_CATEGORIES: Dict[str, Set[str]] = {
    "frontend": {"react", "vue", "angular", "next", "nuxt", "html", "css", "sass", "tailwind", "bootstrap", "javascript", "typescript", "svelte"},
    "backend": {"node", "express", "python", "django", "flask", "fastapi", "golang", "java", "spring", "csharp", "ruby", "rails", "php", "laravel"},
    "mobile": {"react native", "flutter", "swift", "kotlin", "ios", "android"},
    "database": {"postgresql", "mysql", "mongodb", "redis", "sqlite", "sql", "nosql", "elasticsearch"},
    "devops": {"docker", "kubernetes", "aws", "gcp", "azure", "terraform", "ci/cd", "linux", "nginx"},
    "ai_ml": {"machine learning", "deep learning", "natural language processing", "tensorflow", "pytorch", "scikit-learn", "data science"},
    "design": {"figma", "photoshop", "illustrator", "ui/ux", "sketch", "adobe xd", "graphic design"},
    "marketing": {"seo", "ppc", "google ads", "facebook ads", "content marketing", "email marketing", "social media"},
}


def normalize_skill(skill: str) -> str:
    """Normalize a skill name to its canonical form."""
    lower = skill.strip().lower()
    return _SYNONYM_LOOKUP.get(lower, lower)


def get_skill_category(skill: str) -> Optional[str]:
    """Find which category a skill belongs to."""
    norm = normalize_skill(skill)
    for cat, skills in SKILL_CATEGORIES.items():
        if norm in skills:
            return cat
    return None


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
    
    def calculate_skill_match_score(self, project_skills: List[str], freelancer_skills: List[str]) -> Dict[str, Any]:
        """
        Advanced skill matching with synonym resolution and category-based partial credit.
        Returns detailed match info with score 0.0-1.0.
        """
        if not project_skills or not freelancer_skills:
            return {"score": 0.0, "exact_matches": [], "synonym_matches": [], "category_matches": [], "missing": list(project_skills or [])}

        # Normalize all skills
        proj_normalized = {normalize_skill(s): s for s in project_skills}
        free_normalized = {normalize_skill(s): s for s in freelancer_skills}

        proj_set = set(proj_normalized.keys())
        free_set = set(free_normalized.keys())

        # 1. Direct/synonym matches (full credit)
        exact_matches = proj_set & free_set

        # 2. Category-based partial credit for unmatched skills
        unmatched_proj = proj_set - exact_matches
        category_matches = []
        for ps in list(unmatched_proj):
            ps_cat = get_skill_category(ps)
            if ps_cat:
                for fs in free_set:
                    if get_skill_category(fs) == ps_cat:
                        category_matches.append((ps, fs, ps_cat))
                        unmatched_proj.discard(ps)
                        break

        if len(proj_set) == 0:
            return {"score": 0.0, "exact_matches": [], "synonym_matches": [], "category_matches": [], "missing": []}

        # Score: exact matches = 1.0 credit, category matches = 0.4 credit
        match_score = (len(exact_matches) + len(category_matches) * 0.4) / len(proj_set)

        # Coverage bonus: covering ALL required skills is highly valued
        coverage = len(exact_matches) / len(proj_set)
        coverage_bonus = 0.15 if coverage >= 1.0 else 0.08 if coverage >= 0.8 else 0.0

        # Breadth bonus: freelancer with many additional relevant skills
        extra_skills = free_set - exact_matches
        relevant_extra = sum(1 for s in extra_skills if get_skill_category(s) is not None)
        breadth_bonus = min(relevant_extra * 0.02, 0.1)

        score = min(match_score + coverage_bonus + breadth_bonus, 1.0)

        return {
            "score": round(score, 4),
            "exact_matches": [proj_normalized.get(m, m) for m in exact_matches],
            "synonym_matches": [],  # Already resolved by normalization
            "category_matches": [(proj_normalized.get(p, p), f, c) for p, f, c in category_matches],
            "missing": [proj_normalized.get(m, m) for m in unmatched_proj],
        }
    
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
    
    def _parse_skills(self, raw) -> List[str]:
        """Safely parse a skills field (JSON string, list, or CSV)."""
        if not raw:
            return []
        if isinstance(raw, list):
            return [str(s).strip() for s in raw if s]
        if isinstance(raw, str):
            try:
                parsed = json.loads(raw)
                if isinstance(parsed, list):
                    return [str(s).strip() for s in parsed if s]
            except (json.JSONDecodeError, TypeError, ValueError):
                pass
            # Fallback: comma-separated
            return [s.strip() for s in raw.split(",") if s.strip()]
        return []

    def calculate_match_score(self, project: Project, freelancer: User) -> Dict[str, Any]:
        """
        Calculate comprehensive match score between project and freelancer.
        Uses skill synonym resolution, category matching, behavioral signals,
        and configurable weights for multi-factor scoring.
        """
        project_skills = self._parse_skills(project.skills)
        freelancer_skills = self._parse_skills(freelancer.skills)

        # Calculate individual factors
        skill_result = self.calculate_skill_match_score(project_skills, freelancer_skills)
        avg_rating = self.calculate_avg_rating(freelancer.id)
        success_rate = self.calculate_success_rate(freelancer.id)
        budget_match = self.calculate_budget_match_score(project, freelancer)
        experience = self.calculate_experience_match_score(project, freelancer)
        availability = self.calculate_availability_score(freelancer.id)
        response_rate = self.calculate_response_rate(freelancer.id)

        # Recency bonus: prefer recently active freelancers
        recency = self._calculate_recency_score(freelancer.id)

        factors = {
            "skill_match": skill_result["score"],
            "success_rate": success_rate,
            "avg_rating": min(avg_rating / 5.0, 1.0),
            "budget_match": budget_match,
            "experience_match": experience,
            "availability": availability,
            "response_rate": response_rate,
            "recency": recency,
        }

        # Configurable weights (sum = 1.0)
        weights = {
            "skill_match": 0.30,
            "success_rate": 0.15,
            "avg_rating": 0.15,
            "budget_match": 0.15,
            "experience_match": 0.10,
            "availability": 0.05,
            "response_rate": 0.05,
            "recency": 0.05,
        }

        total_score = sum(factors[k] * weights[k] for k in factors)

        # Match quality label
        if total_score >= 0.85:
            quality = "excellent"
        elif total_score >= 0.70:
            quality = "strong"
        elif total_score >= 0.55:
            quality = "good"
        elif total_score >= 0.40:
            quality = "fair"
        else:
            quality = "weak"

        return {
            "score": round(total_score, 3),
            "quality": quality,
            "factors": {k: round(v, 3) for k, v in factors.items()},
            "weights": weights,
            "skill_details": {
                "exact_matches": skill_result["exact_matches"],
                "category_matches": [(p, f, c) for p, f, c in skill_result.get("category_matches", [])],
                "missing_skills": skill_result["missing"],
            },
        }

    def _calculate_recency_score(self, freelancer_id: int) -> float:
        """Score based on how recently the freelancer was active."""
        last_activity = self.db.query(func.max(Proposal.created_at)).filter(
            Proposal.freelancer_id == freelancer_id
        ).scalar()

        if not last_activity:
            # Check contracts instead
            last_activity = self.db.query(func.max(Contract.created_at)).filter(
                Contract.freelancer_id == freelancer_id
            ).scalar()

        if not last_activity:
            return 0.3  # New freelancer - neutral-low

        days_ago = (datetime.utcnow() - last_activity).days
        if days_ago <= 7:
            return 1.0
        elif days_ago <= 30:
            return 0.8
        elif days_ago <= 90:
            return 0.5
        else:
            return 0.2
    
    def get_recommended_freelancers(
        self,
        project_id: int,
        limit: int = 10,
        min_score: float = 0.3,
        diversity: bool = True,
    ) -> List[Dict[str, Any]]:
        """
        Get recommended freelancers for a project using AI matching.
        Includes diversity boosting to avoid showing only top-heavy results.
        """
        project = self.db.query(Project).filter(Project.id == project_id).first()
        if not project:
            return []

        freelancers = self.db.query(User).filter(
            User.user_type == "freelancer",
            User.is_active == True
        ).all()

        recommendations = []
        for freelancer in freelancers:
            match_result = self.calculate_match_score(project, freelancer)

            if match_result["score"] >= min_score:
                rec = {
                    "freelancer_id": freelancer.id,
                    "freelancer_name": freelancer.name or f"{freelancer.first_name or ''} {freelancer.last_name or ''}".strip(),
                    "freelancer_bio": (freelancer.bio or "")[:300],
                    "hourly_rate": freelancer.hourly_rate,
                    "location": freelancer.location,
                    "profile_image_url": freelancer.profile_image_url,
                    "match_score": match_result["score"],
                    "match_quality": match_result["quality"],
                    "match_factors": match_result["factors"],
                    "skill_details": match_result["skill_details"],
                }
                recommendations.append(rec)

        recommendations.sort(key=lambda x: x["match_score"], reverse=True)

        # Diversity: ensure we don't only recommend from one price tier
        if diversity and len(recommendations) > limit:
            recommendations = self._apply_diversity(recommendations, limit)

        final = recommendations[:limit]

        # Cache top results
        for rec in final:
            try:
                self.db.execute(
                    text("INSERT OR REPLACE INTO match_scores (project_id, freelancer_id, score, factors) VALUES (:pid, :fid, :score, :factors)"),
                    {"pid": project_id, "fid": rec["freelancer_id"], "score": rec["match_score"], "factors": json.dumps(rec["match_factors"])}
                )
                self.db.commit()
            except Exception:
                self.db.rollback()

        return final

    def _apply_diversity(self, recommendations: List[Dict], limit: int) -> List[Dict]:
        """
        Apply diversity boosting: mix top matches with some variety
        in price range and location to avoid homogeneous results.
        """
        if len(recommendations) <= limit:
            return recommendations

        # Take top 60% by score, fill remaining 40% with diverse picks
        top_count = max(int(limit * 0.6), 1)
        result = recommendations[:top_count]
        seen_ids = {r["freelancer_id"] for r in result}

        # Group remaining by rate bracket
        remaining = [r for r in recommendations[top_count:] if r["freelancer_id"] not in seen_ids]
        rate_buckets: Dict[str, List[Dict]] = defaultdict(list)
        for r in remaining:
            rate = r.get("hourly_rate") or 0
            bucket = "budget" if rate < 30 else "mid" if rate < 80 else "premium" if rate < 150 else "expert"
            rate_buckets[bucket].append(r)

        # Round-robin from each bucket to fill remaining slots
        remaining_slots = limit - len(result)
        buckets = list(rate_buckets.values())
        bucket_idx = 0
        while remaining_slots > 0 and buckets:
            bucket = buckets[bucket_idx % len(buckets)]
            if bucket:
                result.append(bucket.pop(0))
                remaining_slots -= 1
            if not bucket:
                buckets.remove(bucket)
            if buckets:
                bucket_idx = (bucket_idx + 1) % len(buckets)

        return result
    
    def get_recommended_projects(
        self,
        freelancer_id: int,
        limit: int = 10,
        min_score: float = 0.3,
    ) -> List[Dict[str, Any]]:
        """
        Get recommended projects for a freelancer with detailed match insights.
        """
        freelancer = self.db.query(User).filter(User.id == freelancer_id).first()
        if not freelancer:
            return []

        projects = self.db.query(Project).filter(
            Project.status == "open"
        ).all()

        recommendations = []
        for project in projects:
            match_result = self.calculate_match_score(project, freelancer)

            if match_result["score"] >= min_score:
                recommendations.append({
                    "project_id": project.id,
                    "project_title": project.title,
                    "project_description": (project.description or "")[:400],
                    "category": project.category,
                    "budget_min": project.budget_min,
                    "budget_max": project.budget_max,
                    "budget_type": project.budget_type,
                    "experience_level": project.experience_level,
                    "created_at": project.created_at.isoformat() if project.created_at else None,
                    "match_score": match_result["score"],
                    "match_quality": match_result["quality"],
                    "match_factors": match_result["factors"],
                    "skill_details": match_result["skill_details"],
                    "why_good_fit": self._generate_fit_reason(match_result),
                })

        recommendations.sort(key=lambda x: x["match_score"], reverse=True)
        return recommendations[:limit]

    def _generate_fit_reason(self, match_result: Dict[str, Any]) -> str:
        """Generate a human-readable reason why this is a good match."""
        reasons = []
        factors = match_result["factors"]
        skill_details = match_result.get("skill_details", {})

        if factors.get("skill_match", 0) >= 0.8:
            exact = skill_details.get("exact_matches", [])
            if exact:
                reasons.append(f"Strong skill match: {', '.join(exact[:3])}")
            else:
                reasons.append("Excellent skill alignment")
        elif factors.get("skill_match", 0) >= 0.5:
            reasons.append("Good skill overlap with requirements")

        if factors.get("avg_rating", 0) >= 0.9:
            reasons.append("Top-rated professional")
        if factors.get("success_rate", 0) >= 0.8:
            reasons.append("High project completion rate")
        if factors.get("budget_match", 0) >= 0.9:
            reasons.append("Rate fits within budget")
        if factors.get("availability", 0) >= 0.9:
            reasons.append("Immediately available")

        return "; ".join(reasons[:3]) if reasons else "Relevant background and experience"
    
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
