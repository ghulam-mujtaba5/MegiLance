# @AI-HINT: ML-powered smart pricing API endpoints with market intelligence
"""
Smart Pricing API - ML-enhanced pricing recommendations and market intelligence.
Provides dynamic pricing suggestions based on market data, complexity analysis,
and demand patterns to help clients set budgets and freelancers price competitively.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime, timedelta

from app.db.session import get_db
from app.core.security import get_current_active_user
from app.models.user import User
from app.services.smart_pricing import SmartPricingEngine

import logging

logger = logging.getLogger(__name__)

router = APIRouter()


# ============================================================================
# Pydantic Schemas
# ============================================================================

class ProjectPricingRequest(BaseModel):
    """Request schema for project price estimation."""
    title: str = Field(..., description="Project title")
    description: str = Field(..., description="Project description")
    category: str = Field(..., description="Project category (e.g., web_development)")
    skills_required: List[str] = Field(default_factory=list, description="Required skills")
    estimated_duration_days: Optional[int] = Field(None, description="Estimated duration in days")
    complexity: Optional[str] = Field("medium", description="Project complexity: low, medium, high, expert")
    urgency: Optional[str] = Field("normal", description="Urgency level: normal, urgent, rush")
    region: Optional[str] = Field(None, description="Target region for pricing")

class PriceEstimateResponse(BaseModel):
    """Response schema for price estimation."""
    estimated_min: float
    estimated_max: float
    recommended_budget: float
    hourly_rate_estimate: Optional[float]
    market_rate_comparison: str
    confidence_score: float
    factors: dict
    recommendations: List[str]

class FreelancerWorthRequest(BaseModel):
    """Request for freelancer worth estimation."""
    user_id: Optional[int] = None
    skills: Optional[List[str]] = None
    experience_years: Optional[int] = None
    portfolio_items: Optional[int] = None

class FreelancerWorthResponse(BaseModel):
    """Freelancer worth estimation response."""
    estimated_hourly_min: float
    estimated_hourly_max: float
    recommended_rate: float
    annual_earning_potential: float
    market_position: str
    growth_opportunities: List[str]
    skill_value_breakdown: dict

class MarketIntelligenceResponse(BaseModel):
    """Market intelligence data response."""
    category: Optional[str]
    region: Optional[str]
    skill: Optional[str]
    avg_project_budget: float
    avg_hourly_rate: float
    demand_level: str
    supply_level: str
    competition_index: float
    trend_direction: str
    top_skills_in_demand: List[str]
    price_range: dict
    insights: List[str]

class BidOptimizationRequest(BaseModel):
    """Request for bid optimization."""
    project_id: int
    freelancer_id: Optional[int] = None
    proposed_amount: Optional[float] = None

class BidOptimizationResponse(BaseModel):
    """Optimized bid recommendation response."""
    optimal_bid_amount: float
    bid_range_min: float
    bid_range_max: float
    win_probability: float
    competitive_analysis: dict
    recommendations: List[str]
    timing_recommendation: str


# ============================================================================
# API Endpoints
# ============================================================================

@router.post("/estimate-project", response_model=PriceEstimateResponse)
async def estimate_project_price(
    request: ProjectPricingRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get ML-powered price estimation for a project.
    
    Uses market data, complexity analysis, and demand patterns to suggest
    optimal budget ranges for new projects.
    """
    try:
        engine = SmartPricingEngine(db)
        
        estimate = await engine.estimate_project_price_ml(
            title=request.title,
            description=request.description,
            category=request.category,
            skills_required=request.skills_required,
            estimated_duration_days=request.estimated_duration_days,
            complexity=request.complexity,
            urgency=request.urgency,
            region=request.region
        )
        
        return PriceEstimateResponse(**estimate)
        
    except Exception as e:
        logger.error(f"Price estimation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Price estimation failed: {str(e)}")


@router.post("/freelancer-worth", response_model=FreelancerWorthResponse)
async def estimate_freelancer_worth(
    request: FreelancerWorthRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Estimate a freelancer's market worth and earning potential.
    
    Analyzes skills, experience, and market conditions to suggest
    competitive hourly rates and annual earning potential.
    """
    try:
        engine = SmartPricingEngine(db)
        
        # Use current user if no user_id specified
        user_id = request.user_id or current_user.id
        
        worth = await engine.estimate_freelancer_worth(
            user_id=user_id,
            skills=request.skills,
            experience_years=request.experience_years,
            portfolio_items=request.portfolio_items
        )
        
        return FreelancerWorthResponse(**worth)
        
    except Exception as e:
        logger.error(f"Freelancer worth estimation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Worth estimation failed: {str(e)}")


@router.get("/market-intelligence", response_model=MarketIntelligenceResponse)
async def get_market_intelligence(
    category: Optional[str] = Query(None, description="Project category"),
    region: Optional[str] = Query(None, description="Geographic region"),
    skill: Optional[str] = Query(None, description="Specific skill"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get market intelligence data for pricing decisions.
    
    Provides insights on market rates, demand levels, competition,
    and trends for specific categories, regions, or skills.
    """
    try:
        engine = SmartPricingEngine(db)
        
        intelligence = await engine.get_market_intelligence(
            category=category,
            region=region,
            skill=skill
        )
        
        return MarketIntelligenceResponse(**intelligence)
        
    except Exception as e:
        logger.error(f"Market intelligence error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Market intelligence failed: {str(e)}")


@router.post("/optimize-bid", response_model=BidOptimizationResponse)
async def optimize_bid(
    request: BidOptimizationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get optimized bid recommendation for a project.
    
    Analyzes competition, project requirements, and freelancer profile
    to suggest optimal bid amounts with win probability estimates.
    """
    try:
        engine = SmartPricingEngine(db)
        
        # Use current user as freelancer if not specified
        freelancer_id = request.freelancer_id or current_user.id
        
        optimization = await engine.calculate_optimal_bid(
            project_id=request.project_id,
            freelancer_id=freelancer_id,
            proposed_amount=request.proposed_amount
        )
        
        return BidOptimizationResponse(**optimization)
        
    except Exception as e:
        logger.error(f"Bid optimization error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Bid optimization failed: {str(e)}")


@router.get("/trending-skills")
async def get_trending_skills(
    category: Optional[str] = Query(None, description="Filter by category"),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get trending skills with their market value.
    
    Returns skills that are in high demand with associated
    rate information and growth trends.
    """
    try:
        engine = SmartPricingEngine(db)
        
        # Get market intelligence for trending data
        intelligence = await engine.get_market_intelligence(category=category)
        
        # Build trending skills response
        trending = []
        for skill in intelligence.get("top_skills_in_demand", [])[:limit]:
            skill_intel = await engine.get_market_intelligence(skill=skill)
            trending.append({
                "skill": skill,
                "avg_hourly_rate": skill_intel.get("avg_hourly_rate", 0),
                "demand_level": skill_intel.get("demand_level", "medium"),
                "trend": skill_intel.get("trend_direction", "stable"),
                "competition": skill_intel.get("competition_index", 0.5)
            })
        
        return {
            "trending_skills": trending,
            "category": category,
            "updated_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Trending skills error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get trending skills: {str(e)}")


@router.get("/rate-benchmark/{skill}")
async def get_rate_benchmark(
    skill: str,
    experience_level: Optional[str] = Query("mid", description="junior, mid, senior, expert"),
    region: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get rate benchmarks for a specific skill.
    
    Returns detailed rate information broken down by
    experience level and region.
    """
    try:
        engine = SmartPricingEngine(db)
        
        intelligence = await engine.get_market_intelligence(skill=skill, region=region)
        
        # Experience multipliers
        exp_multipliers = {
            "junior": 0.6,
            "mid": 1.0,
            "senior": 1.5,
            "expert": 2.0
        }
        
        multiplier = exp_multipliers.get(experience_level, 1.0)
        base_rate = intelligence.get("avg_hourly_rate", 50)
        
        return {
            "skill": skill,
            "experience_level": experience_level,
            "region": region,
            "hourly_rate": {
                "low": round(base_rate * multiplier * 0.7, 2),
                "median": round(base_rate * multiplier, 2),
                "high": round(base_rate * multiplier * 1.4, 2)
            },
            "annual_potential": {
                "part_time": round(base_rate * multiplier * 20 * 52, 2),  # 20 hrs/week
                "full_time": round(base_rate * multiplier * 40 * 50, 2)   # 40 hrs/week
            },
            "demand": intelligence.get("demand_level", "medium"),
            "competition": intelligence.get("supply_level", "moderate"),
            "trend": intelligence.get("trend_direction", "stable")
        }
        
    except Exception as e:
        logger.error(f"Rate benchmark error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get rate benchmark: {str(e)}")


@router.post("/compare-proposals")
async def compare_proposals(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Compare proposals for a project with pricing analysis.
    
    Helps clients evaluate proposals based on value,
    market rates, and quality indicators.
    """
    try:
        from app.models.proposal import Proposal
        from app.models.project import Project
        
        # Get project
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Verify ownership
        if project.client_id != current_user.id and current_user.role != "admin":
            raise HTTPException(status_code=403, detail="Not authorized to view this project's proposals")
        
        # Get proposals
        proposals = db.query(Proposal).filter(
            Proposal.project_id == project_id,
            Proposal.status == "pending"
        ).all()
        
        engine = SmartPricingEngine(db)
        
        # Get market estimate for comparison
        market_estimate = await engine.estimate_project_price_ml(
            title=project.title,
            description=project.description or "",
            category=project.category or "general",
            skills_required=project.skills_required.split(",") if project.skills_required else [],
            complexity="medium"
        )
        
        comparisons = []
        for proposal in proposals:
            value_score = 0.5  # Default
            
            # Calculate value score based on bid vs market
            if market_estimate["recommended_budget"] > 0:
                ratio = proposal.bid_amount / market_estimate["recommended_budget"]
                if ratio < 0.8:
                    value_score = 0.9  # Great value
                elif ratio < 1.0:
                    value_score = 0.7  # Good value
                elif ratio < 1.2:
                    value_score = 0.5  # Fair
                else:
                    value_score = 0.3  # Premium
            
            comparisons.append({
                "proposal_id": proposal.id,
                "freelancer_id": proposal.freelancer_id,
                "bid_amount": proposal.bid_amount,
                "delivery_days": proposal.delivery_days,
                "market_comparison": "below_market" if proposal.bid_amount < market_estimate["estimated_min"] else
                                   "at_market" if proposal.bid_amount <= market_estimate["estimated_max"] else
                                   "above_market",
                "value_score": value_score,
                "price_per_day": round(proposal.bid_amount / max(proposal.delivery_days, 1), 2)
            })
        
        return {
            "project_id": project_id,
            "market_estimate": {
                "min": market_estimate["estimated_min"],
                "max": market_estimate["estimated_max"],
                "recommended": market_estimate["recommended_budget"]
            },
            "proposals": sorted(comparisons, key=lambda x: x["value_score"], reverse=True),
            "total_proposals": len(comparisons),
            "best_value_proposal_id": comparisons[0]["proposal_id"] if comparisons else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Compare proposals error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to compare proposals: {str(e)}")
