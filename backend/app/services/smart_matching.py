# @AI-HINT: Production-grade ML-powered matching engine with embeddings, collaborative filtering, and multi-signal ranking
"""
Smart AI Matching Engine
========================
Billion-dollar product feature: ML-powered freelancer-job matching
- Semantic skill matching via TF-IDF/embeddings
- Collaborative filtering (similar users)
- Multi-signal scoring (skills, ratings, success rate, response time, etc.)
- Real-time recommendations with caching
"""

import math
import json
import logging
import hashlib
from typing import List, Dict, Any, Optional, Tuple
from collections import defaultdict
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_

from app.models.user import User, UserType
from app.models.project import Project, ProjectStatus
from app.models.proposal import Proposal
from app.models.contract import Contract
from app.models.review import Review

logger = logging.getLogger(__name__)


# ============================================================================
# TEXT VECTORIZATION (TF-IDF based - no external dependencies)
# ============================================================================

class TFIDFVectorizer:
    """Lightweight TF-IDF vectorizer for semantic similarity"""
    
    def __init__(self):
        self.vocabulary: Dict[str, int] = {}
        self.idf_scores: Dict[str, float] = {}
        self.document_count = 0
        
    def fit(self, documents: List[str]) -> 'TFIDFVectorizer':
        """Fit vectorizer on corpus of documents"""
        self.document_count = len(documents)
        if self.document_count == 0:
            return self
            
        # Build vocabulary and document frequencies
        doc_freq: Dict[str, int] = defaultdict(int)
        
        for doc in documents:
            tokens = self._tokenize(doc)
            seen = set()
            for token in tokens:
                if token not in self.vocabulary:
                    self.vocabulary[token] = len(self.vocabulary)
                if token not in seen:
                    doc_freq[token] += 1
                    seen.add(token)
        
        # Calculate IDF scores
        for token, freq in doc_freq.items():
            self.idf_scores[token] = math.log((self.document_count + 1) / (freq + 1)) + 1
            
        return self
    
    def transform(self, text: str) -> Dict[int, float]:
        """Transform text to TF-IDF sparse vector"""
        tokens = self._tokenize(text)
        if not tokens:
            return {}
            
        # Calculate TF
        tf: Dict[str, int] = defaultdict(int)
        for token in tokens:
            tf[token] += 1
        
        # Build sparse TF-IDF vector
        vector: Dict[int, float] = {}
        max_tf = max(tf.values()) if tf else 1
        
        for token, freq in tf.items():
            if token in self.vocabulary:
                idx = self.vocabulary[token]
                normalized_tf = freq / max_tf
                idf = self.idf_scores.get(token, 1.0)
                vector[idx] = normalized_tf * idf
                
        return vector
    
    def _tokenize(self, text: str) -> List[str]:
        """Simple tokenizer with basic preprocessing"""
        if not text:
            return []
        # Lowercase, split, remove punctuation
        text = text.lower()
        tokens = []
        current = []
        for char in text:
            if char.isalnum():
                current.append(char)
            else:
                if current:
                    tokens.append(''.join(current))
                    current = []
        if current:
            tokens.append(''.join(current))
        # Remove very short tokens
        return [t for t in tokens if len(t) > 2]


def cosine_similarity(vec1: Dict[int, float], vec2: Dict[int, float]) -> float:
    """Calculate cosine similarity between sparse vectors"""
    if not vec1 or not vec2:
        return 0.0
    
    # Find common dimensions
    common_keys = set(vec1.keys()) & set(vec2.keys())
    if not common_keys:
        return 0.0
    
    # Calculate dot product
    dot_product = sum(vec1[k] * vec2[k] for k in common_keys)
    
    # Calculate magnitudes
    mag1 = math.sqrt(sum(v ** 2 for v in vec1.values()))
    mag2 = math.sqrt(sum(v ** 2 for v in vec2.values()))
    
    if mag1 == 0 or mag2 == 0:
        return 0.0
        
    return dot_product / (mag1 * mag2)


# ============================================================================
# COLLABORATIVE FILTERING
# ============================================================================

class CollaborativeFilter:
    """User-based collaborative filtering for "users who hired X also hired Y" """
    
    def __init__(self, db: Session):
        self.db = db
        self._user_history: Dict[int, set] = {}  # client_id -> set of hired freelancer_ids
        self._freelancer_clients: Dict[int, set] = {}  # freelancer_id -> set of client_ids
        
    def build_matrices(self) -> None:
        """Build user-item matrices from contract history"""
        contracts = self.db.query(Contract).filter(
            Contract.status.in_(['ACTIVE', 'COMPLETED'])
        ).all()
        
        for contract in contracts:
            if contract.client_id and contract.freelancer_id:
                if contract.client_id not in self._user_history:
                    self._user_history[contract.client_id] = set()
                self._user_history[contract.client_id].add(contract.freelancer_id)
                
                if contract.freelancer_id not in self._freelancer_clients:
                    self._freelancer_clients[contract.freelancer_id] = set()
                self._freelancer_clients[contract.freelancer_id].add(contract.client_id)
    
    def get_similar_freelancers(
        self, 
        freelancer_id: int, 
        limit: int = 10
    ) -> List[Tuple[int, float]]:
        """Find freelancers often hired by same clients (co-occurrence similarity)"""
        if freelancer_id not in self._freelancer_clients:
            return []
            
        # Get clients who hired this freelancer
        clients = self._freelancer_clients[freelancer_id]
        
        # Count co-occurrences with other freelancers
        co_occurrence: Dict[int, int] = defaultdict(int)
        for client_id in clients:
            if client_id in self._user_history:
                for other_freelancer in self._user_history[client_id]:
                    if other_freelancer != freelancer_id:
                        co_occurrence[other_freelancer] += 1
        
        # Calculate Jaccard similarity
        similarities: List[Tuple[int, float]] = []
        for other_id, count in co_occurrence.items():
            other_clients = self._freelancer_clients.get(other_id, set())
            union_size = len(clients | other_clients)
            if union_size > 0:
                similarity = count / union_size
                similarities.append((other_id, similarity))
        
        # Sort by similarity
        similarities.sort(key=lambda x: x[1], reverse=True)
        return similarities[:limit]
    
    def recommend_for_client(
        self, 
        client_id: int,
        exclude_freelancers: set = None,
        limit: int = 10
    ) -> List[Tuple[int, float]]:
        """Recommend freelancers based on similar clients' hiring patterns"""
        if client_id not in self._user_history:
            return []
            
        hired = self._user_history[client_id]
        exclude = exclude_freelancers or set()
        
        # Find similar clients (hired same freelancers)
        similar_clients: Dict[int, float] = {}
        for freelancer_id in hired:
            for other_client in self._freelancer_clients.get(freelancer_id, set()):
                if other_client != client_id:
                    if other_client not in similar_clients:
                        similar_clients[other_client] = 0
                    similar_clients[other_client] += 1
        
        # Score freelancers hired by similar clients
        recommendations: Dict[int, float] = defaultdict(float)
        for other_client, similarity in similar_clients.items():
            for freelancer_id in self._user_history.get(other_client, set()):
                if freelancer_id not in hired and freelancer_id not in exclude:
                    recommendations[freelancer_id] += similarity
        
        # Sort and return
        sorted_recs = sorted(recommendations.items(), key=lambda x: x[1], reverse=True)
        return sorted_recs[:limit]


# ============================================================================
# MULTI-SIGNAL SCORING ENGINE
# ============================================================================

class SignalWeights:
    """Configurable weights for different matching signals"""
    SKILL_MATCH = 0.30        # Semantic skill matching
    EXPERIENCE = 0.15         # Completed projects, years
    RATING = 0.15             # Average rating & review count
    SUCCESS_RATE = 0.10       # Completion rate
    RESPONSE_TIME = 0.10      # How fast they respond
    BUDGET_FIT = 0.10         # Rate vs budget alignment
    COLLABORATIVE = 0.05      # Similar users hired them
    RECENCY = 0.05            # Recent activity bonus


class SmartMatchingEngine:
    """
    Production-grade ML matching engine
    Combines multiple signals for freelancer-job matching
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.vectorizer = TFIDFVectorizer()
        self.collab_filter = CollaborativeFilter(db)
        self._cache: Dict[str, Any] = {}
        self._cache_ttl = 300  # 5 minutes
        
    def initialize(self) -> None:
        """Initialize ML components (call once on startup or periodically)"""
        logger.info("Initializing Smart Matching Engine...")
        
        # Build TF-IDF vocabulary from all skills and project descriptions
        corpus = self._build_skill_corpus()
        self.vectorizer.fit(corpus)
        
        # Build collaborative filtering matrices
        self.collab_filter.build_matrices()
        
        logger.info(f"Initialized with {len(self.vectorizer.vocabulary)} vocabulary terms")
    
    def _build_skill_corpus(self) -> List[str]:
        """Build corpus from all skills and descriptions"""
        corpus = []
        
        # Get all freelancer skills
        freelancers = self.db.query(User).filter(
            User.user_type == UserType.FREELANCER,
            User.is_active == True
        ).all()
        
        for f in freelancers:
            profile = f.profile_data or {}
            skills = profile.get('skills', [])
            bio = profile.get('bio', '')
            title = profile.get('title', '')
            
            doc = ' '.join([
                ' '.join(str(s) for s in skills),
                bio or '',
                title or ''
            ])
            if doc.strip():
                corpus.append(doc)
        
        # Get all project requirements
        projects = self.db.query(Project).filter(
            Project.status != ProjectStatus.DELETED
        ).limit(1000).all()
        
        for p in projects:
            skills = p.skills_required or []
            doc = ' '.join([
                p.title or '',
                p.description or '',
                ' '.join(str(s) for s in skills)
            ])
            if doc.strip():
                corpus.append(doc)
        
        return corpus
    
    def find_matches(
        self,
        project_id: int,
        client_id: Optional[int] = None,
        limit: int = 20,
        min_score: float = 0.25
    ) -> List[Dict[str, Any]]:
        """
        Find best freelancer matches for a project
        
        Args:
            project_id: Project to match
            client_id: Client posting the project (for collaborative filtering)
            limit: Max results
            min_score: Minimum match score threshold
            
        Returns:
            Ranked list of freelancer matches with detailed scores
        """
        # Check cache
        cache_key = f"matches:{project_id}:{client_id}:{limit}"
        cached = self._get_cache(cache_key)
        if cached:
            return cached
        
        # Get project
        project = self.db.query(Project).filter(Project.id == project_id).first()
        if not project:
            return []
        
        # Build project vector
        project_doc = ' '.join([
            project.title or '',
            project.description or '',
            ' '.join(str(s) for s in (project.skills_required or []))
        ])
        project_vector = self.vectorizer.transform(project_doc)
        
        # Get all eligible freelancers
        freelancers = self.db.query(User).filter(
            User.user_type == UserType.FREELANCER,
            User.is_active == True
        ).all()
        
        # Get collaborative recommendations if client provided
        collab_scores: Dict[int, float] = {}
        if client_id:
            collab_recs = self.collab_filter.recommend_for_client(client_id, limit=50)
            max_collab = max((s for _, s in collab_recs), default=1) or 1
            collab_scores = {fid: score / max_collab for fid, score in collab_recs}
        
        # Score each freelancer
        matches = []
        for freelancer in freelancers:
            scores = self._calculate_all_scores(
                freelancer, project, project_vector, collab_scores
            )
            
            total_score = (
                scores['skill_match'] * SignalWeights.SKILL_MATCH +
                scores['experience'] * SignalWeights.EXPERIENCE +
                scores['rating'] * SignalWeights.RATING +
                scores['success_rate'] * SignalWeights.SUCCESS_RATE +
                scores['response_time'] * SignalWeights.RESPONSE_TIME +
                scores['budget_fit'] * SignalWeights.BUDGET_FIT +
                scores['collaborative'] * SignalWeights.COLLABORATIVE +
                scores['recency'] * SignalWeights.RECENCY
            )
            
            if total_score >= min_score:
                matches.append({
                    'freelancer_id': freelancer.id,
                    'freelancer_name': f"{freelancer.first_name} {freelancer.last_name}",
                    'email': freelancer.email,
                    'avatar_url': freelancer.avatar_url,
                    'match_score': round(total_score, 3),
                    'scores': {k: round(v, 3) for k, v in scores.items()},
                    'profile_data': freelancer.profile_data or {},
                    'match_reasons': self._generate_match_reasons(scores, freelancer, project),
                    'highlights': self._get_highlights(freelancer)
                })
        
        # Sort by score
        matches.sort(key=lambda x: x['match_score'], reverse=True)
        result = matches[:limit]
        
        # Cache results
        self._set_cache(cache_key, result)
        
        return result
    
    def _calculate_all_scores(
        self,
        freelancer: User,
        project: Project,
        project_vector: Dict[int, float],
        collab_scores: Dict[int, float]
    ) -> Dict[str, float]:
        """Calculate all scoring signals"""
        profile = freelancer.profile_data or {}
        
        return {
            'skill_match': self._score_skill_match(freelancer, project, project_vector),
            'experience': self._score_experience(profile),
            'rating': self._score_rating(freelancer),
            'success_rate': self._score_success_rate(profile),
            'response_time': self._score_response_time(freelancer),
            'budget_fit': self._score_budget_fit(profile, project),
            'collaborative': collab_scores.get(freelancer.id, 0),
            'recency': self._score_recency(freelancer)
        }
    
    def _score_skill_match(
        self,
        freelancer: User,
        project: Project,
        project_vector: Dict[int, float]
    ) -> float:
        """Semantic skill matching using TF-IDF similarity"""
        profile = freelancer.profile_data or {}
        
        # Build freelancer document
        freelancer_doc = ' '.join([
            ' '.join(str(s) for s in profile.get('skills', [])),
            profile.get('bio', ''),
            profile.get('title', '')
        ])
        
        if not freelancer_doc.strip():
            return 0.0
        
        freelancer_vector = self.vectorizer.transform(freelancer_doc)
        
        # Semantic similarity
        semantic_score = cosine_similarity(project_vector, freelancer_vector)
        
        # Exact skill matches (bonus)
        required = set(str(s).lower() for s in (project.skills_required or []))
        has = set(str(s).lower() for s in profile.get('skills', []))
        
        if required:
            exact_matches = len(required & has)
            exact_score = exact_matches / len(required)
        else:
            exact_score = 0.5
        
        # Combine semantic + exact (60/40)
        return 0.6 * semantic_score + 0.4 * exact_score
    
    def _score_experience(self, profile: Dict[str, Any]) -> float:
        """Score based on experience level"""
        completed = profile.get('completed_projects', 0)
        years = profile.get('years_experience', 0)
        
        # Project experience (diminishing returns after 20)
        project_score = min(1.0, completed / 20)
        
        # Years experience (diminishing returns after 10)
        years_score = min(1.0, years / 10) if years else 0.3
        
        return 0.6 * project_score + 0.4 * years_score
    
    def _score_rating(self, freelancer: User) -> float:
        """Score based on ratings and review volume"""
        # Get actual reviews
        reviews = self.db.query(Review).filter(
            Review.reviewee_id == freelancer.id
        ).all()
        
        if not reviews:
            return 0.5  # Neutral for new freelancers
        
        avg_rating = sum(r.rating for r in reviews) / len(reviews)
        review_count = len(reviews)
        
        # Normalize rating (1-5 scale)
        rating_score = (avg_rating - 1) / 4
        
        # Review volume boost (caps at 30 reviews)
        volume_factor = min(1.0, 0.5 + (review_count / 60))
        
        return rating_score * volume_factor
    
    def _score_success_rate(self, profile: Dict[str, Any]) -> float:
        """Score based on project completion rate"""
        completed = profile.get('completed_projects', 0)
        total = profile.get('total_projects', 0)
        
        if total == 0:
            return 0.5  # Neutral for new freelancers
        
        return completed / total
    
    def _score_response_time(self, freelancer: User) -> float:
        """Score based on average response time to messages/proposals"""
        profile = freelancer.profile_data or {}
        
        # Check average response time (in hours)
        avg_response = profile.get('avg_response_time_hours', None)
        
        if avg_response is None:
            return 0.5  # Neutral
        
        # Under 1 hour = perfect, degrades up to 48 hours
        if avg_response <= 1:
            return 1.0
        elif avg_response <= 4:
            return 0.9
        elif avg_response <= 12:
            return 0.7
        elif avg_response <= 24:
            return 0.5
        elif avg_response <= 48:
            return 0.3
        else:
            return 0.1
    
    def _score_budget_fit(self, profile: Dict[str, Any], project: Project) -> float:
        """Score based on rate vs project budget alignment"""
        hourly_rate = profile.get('hourly_rate', 0)
        
        if not hourly_rate:
            return 0.5  # Neutral
        
        budget_min = project.budget_min or 0
        budget_max = project.budget_max or 0
        
        if not budget_max:
            return 0.5  # No budget specified
        
        # Perfect fit: within range
        if budget_min <= hourly_rate <= budget_max:
            return 1.0
        
        # Below budget: good
        if hourly_rate < budget_min:
            return 0.8
        
        # Above budget: penalize progressively
        overage = (hourly_rate - budget_max) / budget_max
        return max(0.0, 1.0 - overage)
    
    def _score_recency(self, freelancer: User) -> float:
        """Score based on recent platform activity"""
        # Check last activity
        last_active = freelancer.last_login or freelancer.updated_at or freelancer.created_at
        
        if not last_active:
            return 0.3
        
        now = datetime.utcnow()
        days_ago = (now - last_active).days
        
        if days_ago <= 1:
            return 1.0
        elif days_ago <= 7:
            return 0.9
        elif days_ago <= 14:
            return 0.7
        elif days_ago <= 30:
            return 0.5
        elif days_ago <= 90:
            return 0.3
        else:
            return 0.1
    
    def _generate_match_reasons(
        self,
        scores: Dict[str, float],
        freelancer: User,
        project: Project
    ) -> List[Dict[str, Any]]:
        """Generate human-readable match reasons with icons"""
        reasons = []
        profile = freelancer.profile_data or {}
        
        # Top skill match
        if scores['skill_match'] >= 0.7:
            matched_skills = self._get_matched_skills(profile, project)
            reasons.append({
                'icon': '🎯',
                'label': 'Strong skill match',
                'detail': f"Matches {len(matched_skills)} key skills: {', '.join(matched_skills[:3])}"
            })
        
        # High rating
        if scores['rating'] >= 0.8:
            reasons.append({
                'icon': '⭐',
                'label': 'Highly rated',
                'detail': f"{profile.get('average_rating', 4.5)}/5 average rating"
            })
        
        # Experienced
        if scores['experience'] >= 0.6:
            completed = profile.get('completed_projects', 0)
            reasons.append({
                'icon': '💼',
                'label': 'Experienced professional',
                'detail': f"{completed}+ projects completed"
            })
        
        # Fast responder
        if scores['response_time'] >= 0.8:
            reasons.append({
                'icon': '⚡',
                'label': 'Fast responder',
                'detail': 'Typically responds within hours'
            })
        
        # Budget fit
        if scores['budget_fit'] >= 0.8:
            rate = profile.get('hourly_rate', 0)
            reasons.append({
                'icon': '💰',
                'label': 'Within budget',
                'detail': f"${rate}/hr fits your budget"
            })
        
        # High success rate
        if scores['success_rate'] >= 0.9:
            reasons.append({
                'icon': '✅',
                'label': 'High completion rate',
                'detail': f"{int(scores['success_rate'] * 100)}% project success rate"
            })
        
        # Recently active
        if scores['recency'] >= 0.8:
            reasons.append({
                'icon': '🟢',
                'label': 'Recently active',
                'detail': 'Active on platform this week'
            })
        
        # Collaborative recommendation
        if scores['collaborative'] > 0:
            reasons.append({
                'icon': '👥',
                'label': 'Popular choice',
                'detail': 'Often hired by similar clients'
            })
        
        return reasons[:5]  # Top 5 reasons
    
    def _get_matched_skills(
        self, 
        profile: Dict[str, Any], 
        project: Project
    ) -> List[str]:
        """Get list of matching skills"""
        required = set(str(s).lower() for s in (project.skills_required or []))
        has = {str(s).lower(): s for s in profile.get('skills', [])}
        
        return [has[skill] for skill in required if skill in has]
    
    def _get_highlights(self, freelancer: User) -> List[str]:
        """Get freelancer highlights/badges"""
        highlights = []
        profile = freelancer.profile_data or {}
        
        # Top Rated
        avg_rating = profile.get('average_rating', 0)
        if avg_rating >= 4.8:
            highlights.append('Top Rated')
        
        # Rising Talent (new but good)
        completed = profile.get('completed_projects', 0)
        if completed < 5 and avg_rating >= 4.5:
            highlights.append('Rising Talent')
        
        # Expert
        if completed >= 50:
            highlights.append('Expert')
        
        # Verified
        if freelancer.is_verified:
            highlights.append('Verified')
        
        # Fast Responder
        response_time = profile.get('avg_response_time_hours', 999)
        if response_time <= 2:
            highlights.append('Fast Responder')
        
        return highlights
    
    # =========================================================================
    # JOB RECOMMENDATIONS FOR FREELANCERS
    # =========================================================================
    
    def find_jobs_for_freelancer(
        self,
        freelancer_id: int,
        limit: int = 20,
        min_score: float = 0.2
    ) -> List[Dict[str, Any]]:
        """
        Find best job matches for a freelancer (reverse matching)
        
        Args:
            freelancer_id: Freelancer to match jobs for
            limit: Max results
            min_score: Minimum match threshold
            
        Returns:
            Ranked list of job recommendations
        """
        # Get freelancer
        freelancer = self.db.query(User).filter(User.id == freelancer_id).first()
        if not freelancer:
            return []
        
        profile = freelancer.profile_data or {}
        
        # Build freelancer vector
        freelancer_doc = ' '.join([
            ' '.join(str(s) for s in profile.get('skills', [])),
            profile.get('bio', ''),
            profile.get('title', '')
        ])
        freelancer_vector = self.vectorizer.transform(freelancer_doc)
        
        # Get open projects
        projects = self.db.query(Project).filter(
            Project.status.in_([ProjectStatus.OPEN, ProjectStatus.DRAFT])
        ).order_by(Project.created_at.desc()).limit(200).all()
        
        matches = []
        for project in projects:
            # Build project vector
            project_doc = ' '.join([
                project.title or '',
                project.description or '',
                ' '.join(str(s) for s in (project.skills_required or []))
            ])
            project_vector = self.vectorizer.transform(project_doc)
            
            # Calculate skill match
            skill_score = cosine_similarity(freelancer_vector, project_vector)
            
            # Budget fit
            hourly_rate = profile.get('hourly_rate', 0)
            budget_max = project.budget_max or 0
            budget_fit = 1.0 if not budget_max or hourly_rate <= budget_max else 0.5
            
            # Recency (newer = better)
            days_old = (datetime.utcnow() - project.created_at).days if project.created_at else 30
            recency = max(0, 1 - (days_old / 30))
            
            # Total score
            total = 0.6 * skill_score + 0.2 * budget_fit + 0.2 * recency
            
            if total >= min_score:
                matches.append({
                    'project_id': project.id,
                    'title': project.title,
                    'description': (project.description or '')[:200] + '...',
                    'budget_min': project.budget_min,
                    'budget_max': project.budget_max,
                    'skills_required': project.skills_required or [],
                    'match_score': round(total, 3),
                    'skill_match': round(skill_score, 3),
                    'posted_days_ago': days_old,
                    'client_id': project.client_id
                })
        
        matches.sort(key=lambda x: x['match_score'], reverse=True)
        return matches[:limit]
    
    # =========================================================================
    # CACHING
    # =========================================================================
    
    def _get_cache(self, key: str) -> Optional[Any]:
        """Get from cache if not expired"""
        if key in self._cache:
            data, timestamp = self._cache[key]
            if (datetime.utcnow() - timestamp).total_seconds() < self._cache_ttl:
                return data
            del self._cache[key]
        return None
    
    def _set_cache(self, key: str, value: Any) -> None:
        """Set cache with timestamp"""
        self._cache[key] = (value, datetime.utcnow())
    
    def clear_cache(self) -> None:
        """Clear all cached data"""
        self._cache.clear()


# ============================================================================
# SINGLETON INSTANCE
# ============================================================================

_engine_instance: Optional[SmartMatchingEngine] = None


def get_matching_engine(db: Session) -> SmartMatchingEngine:
    """Get or create singleton matching engine"""
    global _engine_instance
    if _engine_instance is None:
        _engine_instance = SmartMatchingEngine(db)
        _engine_instance.initialize()
    else:
        _engine_instance.db = db  # Update db session
    return _engine_instance


def reinitialize_engine(db: Session) -> SmartMatchingEngine:
    """Force reinitialize engine (call after bulk data changes)"""
    global _engine_instance
    _engine_instance = SmartMatchingEngine(db)
    _engine_instance.initialize()
    return _engine_instance
