"""
@AI-HINT: Search service with full-text search, filtering, and AI-powered matching
Production-grade search for projects, freelancers, and global search
"""

from typing import List, Dict, Any, Optional, Tuple, Union
from dataclasses import dataclass, field
from enum import Enum
from datetime import datetime
import re
import logging
from math import ceil

from sqlalchemy import and_, or_, func, desc, asc
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

# ============================================================================
# Search Types
# ============================================================================

class SortOrder(str, Enum):
    ASC = "asc"
    DESC = "desc"


class SearchScope(str, Enum):
    PROJECTS = "projects"
    FREELANCERS = "freelancers"
    ALL = "all"


@dataclass
class SearchFilters:
    """Search filter criteria"""
    skills: List[str] = field(default_factory=list)
    categories: List[str] = field(default_factory=list)
    min_budget: Optional[float] = None
    max_budget: Optional[float] = None
    min_hourly_rate: Optional[float] = None
    max_hourly_rate: Optional[float] = None
    location: Optional[str] = None
    experience_level: Optional[str] = None
    project_type: Optional[str] = None  # fixed, hourly
    status: Optional[str] = None
    verified_only: bool = False
    has_portfolio: bool = False
    min_rating: Optional[float] = None
    posted_within_days: Optional[int] = None
    language: Optional[str] = None


@dataclass
class SearchSort:
    """Search sorting options"""
    field: str = "relevance"
    order: SortOrder = SortOrder.DESC


@dataclass
class SearchPagination:
    """Pagination options"""
    page: int = 1
    per_page: int = 20
    
    @property
    def offset(self) -> int:
        return (self.page - 1) * self.per_page


@dataclass
class SearchResult:
    """Individual search result"""
    id: str
    type: str  # project, freelancer
    title: str
    description: str
    score: float
    highlights: Dict[str, List[str]] = field(default_factory=dict)
    data: Dict[str, Any] = field(default_factory=dict)


@dataclass
class SearchResponse:
    """Search response with results and metadata"""
    results: List[SearchResult]
    total: int
    page: int
    per_page: int
    total_pages: int
    query: str
    filters: Dict[str, Any] = field(default_factory=dict)
    facets: Dict[str, Dict[str, int]] = field(default_factory=dict)
    suggestions: List[str] = field(default_factory=list)
    took_ms: float = 0


# ============================================================================
# Text Processing
# ============================================================================

class TextProcessor:
    """Text processing utilities for search"""
    
    # Common stop words to filter out
    STOP_WORDS = {
        'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
        'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'or', 'that',
        'the', 'to', 'was', 'were', 'will', 'with'
    }
    
    @staticmethod
    def normalize(text: str) -> str:
        """Normalize text for search"""
        if not text:
            return ""
        
        # Convert to lowercase
        text = text.lower()
        
        # Remove special characters but keep spaces
        text = re.sub(r'[^\w\s]', ' ', text)
        
        # Normalize whitespace
        text = ' '.join(text.split())
        
        return text
    
    @classmethod
    def tokenize(cls, text: str, remove_stop_words: bool = True) -> List[str]:
        """Tokenize text into words"""
        normalized = cls.normalize(text)
        tokens = normalized.split()
        
        if remove_stop_words:
            tokens = [t for t in tokens if t not in cls.STOP_WORDS]
        
        return tokens
    
    @staticmethod
    def highlight(text: str, query: str, tag: str = "mark") -> str:
        """Highlight query terms in text"""
        if not text or not query:
            return text
        
        query_words = set(query.lower().split())
        
        def highlight_word(match):
            word = match.group(0)
            if word.lower() in query_words:
                return f"<{tag}>{word}</{tag}>"
            return word
        
        return re.sub(r'\b\w+\b', highlight_word, text)
    
    @staticmethod
    def extract_snippets(
        text: str,
        query: str,
        snippet_length: int = 150,
        max_snippets: int = 3
    ) -> List[str]:
        """Extract relevant snippets containing query terms"""
        if not text or not query:
            return []
        
        query_words = set(query.lower().split())
        sentences = re.split(r'[.!?]+', text)
        
        scored_sentences = []
        for sentence in sentences:
            sentence = sentence.strip()
            if not sentence:
                continue
            
            # Score by number of query words found
            words = set(sentence.lower().split())
            score = len(query_words & words)
            
            if score > 0:
                scored_sentences.append((score, sentence))
        
        # Sort by score and take top snippets
        scored_sentences.sort(key=lambda x: x[0], reverse=True)
        
        snippets = []
        for _, sentence in scored_sentences[:max_snippets]:
            if len(sentence) > snippet_length:
                sentence = sentence[:snippet_length] + "..."
            snippets.append(sentence)
        
        return snippets


# ============================================================================
# Search Scoring
# ============================================================================

class SearchScorer:
    """Calculate relevance scores for search results"""
    
    @staticmethod
    def calculate_text_score(
        query: str,
        title: str,
        description: str,
        skills: List[str] = None
    ) -> float:
        """Calculate text relevance score"""
        query_tokens = set(TextProcessor.tokenize(query))
        
        if not query_tokens:
            return 0.0
        
        score = 0.0
        
        # Title match (highest weight)
        title_tokens = set(TextProcessor.tokenize(title or ""))
        title_matches = len(query_tokens & title_tokens)
        score += title_matches * 3.0
        
        # Exact title match bonus
        if query.lower() in (title or "").lower():
            score += 5.0
        
        # Description match
        desc_tokens = set(TextProcessor.tokenize(description or ""))
        desc_matches = len(query_tokens & desc_tokens)
        score += desc_matches * 1.0
        
        # Skills match
        if skills:
            skill_tokens = set(TextProcessor.tokenize(" ".join(skills)))
            skill_matches = len(query_tokens & skill_tokens)
            score += skill_matches * 2.0
        
        # Normalize score
        max_possible = len(query_tokens) * 6.0  # Max from all factors
        normalized = min(1.0, score / max_possible) if max_possible > 0 else 0.0
        
        return round(normalized, 4)
    
    @staticmethod
    def calculate_freshness_score(created_at: datetime, max_age_days: int = 30) -> float:
        """Calculate freshness boost (newer = higher)"""
        if not created_at:
            return 0.5
        
        age = (datetime.utcnow() - created_at).days
        
        if age <= 0:
            return 1.0
        elif age >= max_age_days:
            return 0.1
        else:
            return 1.0 - (age / max_age_days) * 0.9
    
    @staticmethod
    def calculate_popularity_score(
        views: int = 0,
        proposals: int = 0,
        rating: float = 0,
        completed_projects: int = 0
    ) -> float:
        """Calculate popularity/quality score"""
        score = 0.0
        
        # Views (logarithmic)
        if views > 0:
            import math
            score += min(0.2, math.log10(views + 1) / 10)
        
        # Proposals/interest
        if proposals > 0:
            score += min(0.2, proposals / 20)
        
        # Rating
        if rating > 0:
            score += (rating / 5.0) * 0.4
        
        # Experience
        if completed_projects > 0:
            score += min(0.2, completed_projects / 50)
        
        return min(1.0, score)


# ============================================================================
# Search Service
# ============================================================================

class SearchService:
    """Main search service"""
    
    def __init__(self, db: Session):
        self.db = db
        self.text_processor = TextProcessor()
        self.scorer = SearchScorer()
    
    async def search(
        self,
        query: str,
        scope: SearchScope = SearchScope.ALL,
        filters: Optional[SearchFilters] = None,
        sort: Optional[SearchSort] = None,
        pagination: Optional[SearchPagination] = None
    ) -> SearchResponse:
        """Execute search across specified scope"""
        import time
        start_time = time.time()
        
        filters = filters or SearchFilters()
        sort = sort or SearchSort()
        pagination = pagination or SearchPagination()
        
        results: List[SearchResult] = []
        total = 0
        facets: Dict[str, Dict[str, int]] = {}
        
        if scope in (SearchScope.PROJECTS, SearchScope.ALL):
            project_results, project_count, project_facets = await self._search_projects(
                query, filters, sort, pagination if scope == SearchScope.PROJECTS else None
            )
            results.extend(project_results)
            total += project_count
            facets.update(project_facets)
        
        if scope in (SearchScope.FREELANCERS, SearchScope.ALL):
            freelancer_results, freelancer_count, freelancer_facets = await self._search_freelancers(
                query, filters, sort, pagination if scope == SearchScope.FREELANCERS else None
            )
            results.extend(freelancer_results)
            total += freelancer_count
            facets.update(freelancer_facets)
        
        # Sort combined results if searching all
        if scope == SearchScope.ALL:
            results.sort(key=lambda x: x.score, reverse=(sort.order == SortOrder.DESC))
            # Apply pagination
            start = pagination.offset
            end = start + pagination.per_page
            results = results[start:end]
        
        # Generate suggestions
        suggestions = self._generate_suggestions(query, results)
        
        took_ms = (time.time() - start_time) * 1000
        
        return SearchResponse(
            results=results,
            total=total,
            page=pagination.page,
            per_page=pagination.per_page,
            total_pages=ceil(total / pagination.per_page) if pagination.per_page > 0 else 0,
            query=query,
            filters={k: v for k, v in filters.__dict__.items() if v},
            facets=facets,
            suggestions=suggestions,
            took_ms=round(took_ms, 2)
        )
    
    async def _search_projects(
        self,
        query: str,
        filters: SearchFilters,
        sort: SearchSort,
        pagination: Optional[SearchPagination]
    ) -> Tuple[List[SearchResult], int, Dict[str, Dict[str, int]]]:
        """Search projects"""
        from app.models.project import Project
        
        # Build base query
        base_query = self.db.query(Project).filter(Project.status == "open")
        
        # Text search
        if query:
            search_term = f"%{query}%"
            base_query = base_query.filter(
                or_(
                    Project.title.ilike(search_term),
                    Project.description.ilike(search_term)
                )
            )
        
        # Apply filters
        if filters.min_budget:
            base_query = base_query.filter(Project.budget >= filters.min_budget)
        if filters.max_budget:
            base_query = base_query.filter(Project.budget <= filters.max_budget)
        if filters.categories:
            base_query = base_query.filter(Project.category.in_(filters.categories))
        if filters.project_type:
            base_query = base_query.filter(Project.project_type == filters.project_type)
        if filters.posted_within_days:
            from datetime import timedelta
            cutoff = datetime.utcnow() - timedelta(days=filters.posted_within_days)
            base_query = base_query.filter(Project.created_at >= cutoff)
        
        # Get total count
        total = base_query.count()
        
        # Apply sorting
        if sort.field == "budget":
            order_by = desc(Project.budget) if sort.order == SortOrder.DESC else asc(Project.budget)
        elif sort.field == "created_at":
            order_by = desc(Project.created_at) if sort.order == SortOrder.DESC else asc(Project.created_at)
        else:
            order_by = desc(Project.created_at)  # Default to newest
        
        base_query = base_query.order_by(order_by)
        
        # Apply pagination
        if pagination:
            base_query = base_query.offset(pagination.offset).limit(pagination.per_page)
        
        # Execute query
        projects = base_query.all()
        
        # Build results
        results = []
        for project in projects:
            score = self.scorer.calculate_text_score(
                query,
                project.title,
                project.description,
                getattr(project, 'skills', [])
            )
            
            # Add freshness boost
            freshness = self.scorer.calculate_freshness_score(project.created_at)
            score = score * 0.7 + freshness * 0.3
            
            results.append(SearchResult(
                id=str(project.id),
                type="project",
                title=project.title,
                description=project.description[:200] + "..." if len(project.description) > 200 else project.description,
                score=score,
                highlights={
                    "title": [self.text_processor.highlight(project.title, query)] if query else [],
                    "description": self.text_processor.extract_snippets(project.description, query)
                },
                data={
                    "budget": project.budget,
                    "category": project.category,
                    "project_type": project.project_type,
                    "created_at": project.created_at.isoformat() if project.created_at else None,
                    "proposals_count": getattr(project, 'proposals_count', 0)
                }
            ))
        
        # Build facets
        facets = await self._build_project_facets(query, filters)
        
        return results, total, facets
    
    async def _search_freelancers(
        self,
        query: str,
        filters: SearchFilters,
        sort: SearchSort,
        pagination: Optional[SearchPagination]
    ) -> Tuple[List[SearchResult], int, Dict[str, Dict[str, int]]]:
        """Search freelancers"""
        from app.models.user import User
        
        # Build base query
        base_query = self.db.query(User).filter(
            User.role == "freelancer",
            User.is_active == True
        )
        
        # Text search
        if query:
            search_term = f"%{query}%"
            base_query = base_query.filter(
                or_(
                    User.full_name.ilike(search_term),
                    User.title.ilike(search_term),
                    User.bio.ilike(search_term)
                )
            )
        
        # Apply filters
        if filters.min_hourly_rate:
            base_query = base_query.filter(User.hourly_rate >= filters.min_hourly_rate)
        if filters.max_hourly_rate:
            base_query = base_query.filter(User.hourly_rate <= filters.max_hourly_rate)
        if filters.location:
            base_query = base_query.filter(User.location.ilike(f"%{filters.location}%"))
        if filters.verified_only:
            base_query = base_query.filter(User.is_verified == True)
        if filters.min_rating:
            base_query = base_query.filter(User.rating >= filters.min_rating)
        
        # Get total count
        total = base_query.count()
        
        # Apply sorting
        if sort.field == "hourly_rate":
            order_by = desc(User.hourly_rate) if sort.order == SortOrder.DESC else asc(User.hourly_rate)
        elif sort.field == "rating":
            order_by = desc(User.rating) if sort.order == SortOrder.DESC else asc(User.rating)
        else:
            order_by = desc(User.rating)  # Default to highest rated
        
        base_query = base_query.order_by(order_by)
        
        # Apply pagination
        if pagination:
            base_query = base_query.offset(pagination.offset).limit(pagination.per_page)
        
        # Execute query
        freelancers = base_query.all()
        
        # Build results
        results = []
        for user in freelancers:
            score = self.scorer.calculate_text_score(
                query,
                user.full_name + " " + (user.title or ""),
                user.bio or "",
                getattr(user, 'skills', [])
            )
            
            # Add popularity boost
            popularity = self.scorer.calculate_popularity_score(
                rating=user.rating or 0,
                completed_projects=getattr(user, 'completed_projects_count', 0)
            )
            score = score * 0.6 + popularity * 0.4
            
            results.append(SearchResult(
                id=str(user.id),
                type="freelancer",
                title=user.full_name,
                description=user.bio[:200] + "..." if user.bio and len(user.bio) > 200 else (user.bio or ""),
                score=score,
                highlights={
                    "name": [self.text_processor.highlight(user.full_name, query)] if query else [],
                    "bio": self.text_processor.extract_snippets(user.bio or "", query)
                },
                data={
                    "title": user.title,
                    "hourly_rate": user.hourly_rate,
                    "rating": user.rating,
                    "location": user.location,
                    "avatar_url": user.avatar_url,
                    "is_verified": user.is_verified,
                    "completed_projects": getattr(user, 'completed_projects_count', 0)
                }
            ))
        
        # Build facets
        facets = await self._build_freelancer_facets(query, filters)
        
        return results, total, facets
    
    async def _build_project_facets(
        self,
        query: str,
        filters: SearchFilters
    ) -> Dict[str, Dict[str, int]]:
        """Build facet counts for projects"""
        # This would typically aggregate counts from the database
        # Simplified implementation for now
        return {
            "project_categories": {},
            "project_types": {},
            "budget_ranges": {}
        }
    
    async def _build_freelancer_facets(
        self,
        query: str,
        filters: SearchFilters
    ) -> Dict[str, Dict[str, int]]:
        """Build facet counts for freelancers"""
        return {
            "skills": {},
            "locations": {},
            "rate_ranges": {}
        }
    
    def _generate_suggestions(
        self,
        query: str,
        results: List[SearchResult]
    ) -> List[str]:
        """Generate search suggestions"""
        if not query or len(results) >= 5:
            return []
        
        suggestions = []
        
        # Suggest broader search
        tokens = query.split()
        if len(tokens) > 1:
            suggestions.append(f"Try searching for just '{tokens[0]}'")
        
        # Suggest related terms (would typically use a thesaurus or ML model)
        related_terms = {
            "python": ["django", "flask", "data science"],
            "javascript": ["react", "node.js", "typescript"],
            "design": ["ui/ux", "graphic design", "web design"],
            "writing": ["content writing", "copywriting", "technical writing"],
        }
        
        for term, related in related_terms.items():
            if term in query.lower():
                suggestions.extend([f"Also try: {r}" for r in related[:2]])
                break
        
        return suggestions[:3]


# ============================================================================
# Factory Function
# ============================================================================

def get_search_service(db: Session) -> SearchService:
    """Get search service instance"""
    return SearchService(db)
