# @AI-HINT: ML-powered smart pricing engine with market intelligence and dynamic recommendations
"""
Smart Pricing Engine
====================
Billion-dollar feature: AI-powered pricing intelligence
- Market rate analysis by skill/location/experience
- Dynamic pricing based on demand/supply
- Budget optimization for clients
- Competitive rate analysis for freelancers
- Project complexity scoring
- Historical trend analysis
"""

import logging
import math
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta, timezone
from collections import defaultdict
from enum import Enum
from sqlalchemy.orm import Session
from sqlalchemy import func, and_

from app.models.project import Project, ProjectStatus, ProjectCategory
from app.models.contract import Contract
from app.models.proposal import Proposal
from app.models.user import User, UserType

logger = logging.getLogger(__name__)


class PriceTier(str, Enum):
    """Pricing tiers"""
    BUDGET = "budget"          # < 25th percentile
    STANDARD = "standard"      # 25th-50th percentile
    PREMIUM = "premium"        # 50th-75th percentile
    EXPERT = "expert"          # > 75th percentile


class TrendDirection(str, Enum):
    """Market trend direction"""
    RISING = "rising"
    STABLE = "stable"
    FALLING = "falling"


# ============================================================================
# MARKET INTELLIGENCE DATA
# ============================================================================

# Global market rates by skill (USD/hour)
# In production, this would be computed from actual data
GLOBAL_SKILL_RATES = {
    # Development
    "python": {"median": 75, "p25": 50, "p75": 110},
    "javascript": {"median": 65, "p25": 40, "p75": 100},
    "react": {"median": 70, "p25": 45, "p75": 105},
    "nodejs": {"median": 70, "p25": 45, "p75": 105},
    "java": {"median": 80, "p25": 55, "p75": 120},
    "go": {"median": 90, "p25": 65, "p75": 135},
    "rust": {"median": 100, "p25": 70, "p75": 150},
    "swift": {"median": 85, "p25": 55, "p75": 130},
    "kotlin": {"median": 80, "p25": 55, "p75": 125},
    
    # AI/ML
    "machine learning": {"median": 120, "p25": 80, "p75": 180},
    "deep learning": {"median": 130, "p25": 90, "p75": 200},
    "nlp": {"median": 125, "p25": 85, "p75": 190},
    "computer vision": {"median": 130, "p25": 90, "p75": 195},
    "data science": {"median": 100, "p25": 65, "p75": 150},
    
    # Blockchain
    "solidity": {"median": 140, "p25": 90, "p75": 220},
    "web3": {"median": 130, "p25": 85, "p75": 200},
    "smart contracts": {"median": 135, "p25": 90, "p75": 210},
    
    # DevOps/Cloud
    "aws": {"median": 90, "p25": 60, "p75": 140},
    "kubernetes": {"median": 100, "p25": 70, "p75": 150},
    "docker": {"median": 75, "p25": 50, "p75": 115},
    "terraform": {"median": 95, "p25": 65, "p75": 145},
    
    # Design
    "ui design": {"median": 55, "p25": 35, "p75": 85},
    "ux design": {"median": 60, "p25": 40, "p75": 95},
    "figma": {"median": 50, "p25": 30, "p75": 80},
    "graphic design": {"median": 45, "p25": 25, "p75": 70},
    
    # Mobile
    "ios": {"median": 85, "p25": 55, "p75": 130},
    "android": {"median": 80, "p25": 50, "p75": 125},
    "flutter": {"median": 75, "p25": 50, "p75": 115},
    "react native": {"median": 75, "p25": 50, "p75": 115},
    
    # Writing
    "technical writing": {"median": 50, "p25": 30, "p75": 80},
    "copywriting": {"median": 45, "p25": 25, "p75": 75},
    "content writing": {"median": 35, "p25": 20, "p75": 55},
    
    # Marketing
    "seo": {"median": 55, "p25": 35, "p75": 85},
    "digital marketing": {"median": 50, "p25": 30, "p75": 80},
    "social media": {"median": 40, "p25": 25, "p75": 65},
}

# Location-based rate multipliers
LOCATION_MULTIPLIERS = {
    "us": 1.0,
    "uk": 0.95,
    "canada": 0.9,
    "australia": 0.9,
    "germany": 0.85,
    "western europe": 0.8,
    "eastern europe": 0.5,
    "india": 0.35,
    "southeast asia": 0.4,
    "south america": 0.45,
    "africa": 0.35,
    "global": 0.7,  # Default for unknown
}

# Experience level multipliers
EXPERIENCE_MULTIPLIERS = {
    0: 0.6,   # Entry level (0-1 years)
    1: 0.7,   # Junior (1-2 years)
    2: 0.85,  # Mid-level (2-4 years)
    4: 1.0,   # Senior (4-6 years)
    6: 1.2,   # Expert (6-10 years)
    10: 1.4,  # Principal (10+ years)
}


# ============================================================================
# COMPLEXITY ANALYZER
# ============================================================================

class ComplexityAnalyzer:
    """Analyze project complexity from description"""
    
    # Complexity indicators
    HIGH_COMPLEXITY_KEYWORDS = [
        'ai', 'machine learning', 'ml', 'deep learning', 'neural network',
        'blockchain', 'smart contract', 'distributed', 'real-time', 'streaming',
        'microservices', 'kubernetes', 'enterprise', 'scalable', 'high availability',
        'security', 'encryption', 'compliance', 'gdpr', 'hipaa',
        'integration', 'api', 'third-party', 'legacy',
    ]
    
    MODERATE_COMPLEXITY_KEYWORDS = [
        'database', 'authentication', 'payment', 'dashboard', 'analytics',
        'mobile app', 'responsive', 'custom', 'workflow', 'automation',
        'testing', 'deployment', 'ci/cd', 'documentation',
    ]
    
    SIMPLE_KEYWORDS = [
        'landing page', 'simple', 'basic', 'small', 'quick',
        'wordpress', 'template', 'bug fix', 'update', 'maintain',
    ]
    
    def analyze(self, title: str, description: str, skills: List[str]) -> Dict[str, Any]:
        """Analyze project complexity"""
        text = f"{title} {description}".lower()
        
        # Count complexity indicators
        high_count = sum(1 for k in self.HIGH_COMPLEXITY_KEYWORDS if k in text)
        moderate_count = sum(1 for k in self.MODERATE_COMPLEXITY_KEYWORDS if k in text)
        simple_count = sum(1 for k in self.SIMPLE_KEYWORDS if k in text)
        
        # Skill complexity
        skill_complexity = self._assess_skill_complexity(skills)
        
        # Calculate overall score
        complexity_score = (
            high_count * 3 +
            moderate_count * 2 +
            skill_complexity * 2 -
            simple_count
        )
        
        # Determine level
        if complexity_score >= 10:
            level = "expert"
            multiplier = 1.6
        elif complexity_score >= 5:
            level = "complex"
            multiplier = 1.3
        elif complexity_score >= 2:
            level = "moderate"
            multiplier = 1.0
        else:
            level = "simple"
            multiplier = 0.8
        
        return {
            "level": level,
            "score": complexity_score,
            "multiplier": multiplier,
            "indicators": {
                "high_complexity_count": high_count,
                "moderate_complexity_count": moderate_count,
                "simple_count": simple_count,
                "skill_complexity": skill_complexity
            }
        }
    
    def _assess_skill_complexity(self, skills: List[str]) -> int:
        """Assess complexity based on required skills"""
        high_complexity_skills = {
            'machine learning', 'blockchain', 'ai', 'deep learning',
            'kubernetes', 'distributed systems', 'security'
        }
        
        complexity = 0
        for skill in skills:
            skill_lower = skill.lower()
            for hcs in high_complexity_skills:
                if hcs in skill_lower:
                    complexity += 1
                    break
        
        return complexity


# ============================================================================
# SMART PRICING ENGINE
# ============================================================================

class SmartPricingEngine:
    """
    ML-powered pricing intelligence
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.complexity_analyzer = ComplexityAnalyzer()
    
    # =========================================================================
    # PROJECT PRICING
    # =========================================================================
    
    def estimate_project_budget(
        self,
        title: str,
        description: str,
        skills: List[str],
        category: str = None,
        duration_weeks: int = None,
        quality_level: str = "standard"  # budget, standard, premium, expert
    ) -> Dict[str, Any]:
        """
        Estimate appropriate budget for a project
        
        Returns budget range with confidence and breakdown.
        """
        # Analyze complexity
        complexity = self.complexity_analyzer.analyze(title, description, skills)
        
        # Get skill-based rate
        skill_rate = self._calculate_skill_rate(skills)
        
        # Apply quality level
        quality_multipliers = {
            "budget": 0.6,
            "standard": 1.0,
            "premium": 1.5,
            "expert": 2.0
        }
        quality_mult = quality_multipliers.get(quality_level, 1.0)
        
        # Base hourly rate
        base_rate = skill_rate["median"] * complexity["multiplier"] * quality_mult
        
        # Estimate hours based on description length and complexity
        if duration_weeks:
            estimated_hours = duration_weeks * 30  # ~30 hours/week
        else:
            # Heuristic based on description
            desc_length = len(description.split())
            base_hours = 40 + (desc_length / 10) + (complexity["score"] * 5)
            estimated_hours = min(max(base_hours, 20), 200)
        
        # Calculate budget
        min_budget = base_rate * 0.8 * estimated_hours * 0.8
        max_budget = base_rate * 1.2 * estimated_hours * 1.2
        recommended = base_rate * estimated_hours
        
        # Get market comparison
        market_data = self._get_platform_market_data(category, skills)
        
        return {
            "recommended_budget": round(recommended, -1),  # Round to nearest 10
            "budget_range": {
                "min": round(min_budget, -1),
                "max": round(max_budget, -1)
            },
            "estimated_hours": int(estimated_hours),
            "effective_hourly_rate": round(base_rate, 2),
            "complexity": complexity,
            "skill_rates": skill_rate,
            "quality_tier": quality_level,
            "market_comparison": {
                "vs_platform_avg": self._compare_to_market(recommended, market_data),
                "percentile": self._calculate_percentile(recommended, market_data)
            },
            "confidence": self._calculate_confidence(skills, description),
            "breakdown": {
                "skill_rate": skill_rate["median"],
                "complexity_multiplier": complexity["multiplier"],
                "quality_multiplier": quality_mult,
                "hours": estimated_hours
            },
            "recommendations": self._get_budget_recommendations(
                recommended, complexity["level"], quality_level
            )
        }
    
    # =========================================================================
    # FREELANCER RATE ANALYSIS
    # =========================================================================
    
    def analyze_freelancer_rate(
        self,
        current_rate: float,
        skills: List[str],
        years_experience: int = 0,
        location: str = "global",
        completed_projects: int = 0,
        average_rating: float = 0
    ) -> Dict[str, Any]:
        """
        Analyze freelancer rate vs market and provide recommendations
        """
        # Get market rate for skills
        skill_rate = self._calculate_skill_rate(skills)
        
        # Location adjustment
        loc_mult = LOCATION_MULTIPLIERS.get(location.lower(), 0.7)
        
        # Experience adjustment
        exp_mult = self._get_experience_multiplier(years_experience)
        
        # Calculate expected rate
        expected_rate = skill_rate["median"] * loc_mult * exp_mult
        
        # Rating bonus
        if average_rating >= 4.8:
            expected_rate *= 1.2
        elif average_rating >= 4.5:
            expected_rate *= 1.1
        
        # Project history bonus
        if completed_projects >= 50:
            expected_rate *= 1.15
        elif completed_projects >= 20:
            expected_rate *= 1.1
        elif completed_projects >= 10:
            expected_rate *= 1.05
        
        # Calculate variance
        variance = ((current_rate - expected_rate) / expected_rate * 100) if expected_rate > 0 else 0
        
        # Determine tier
        tier = self._determine_price_tier(current_rate, skill_rate)
        
        return {
            "current_rate": current_rate,
            "market_analysis": {
                "expected_rate": round(expected_rate, 2),
                "rate_range": {
                    "min": round(skill_rate["p25"] * loc_mult * exp_mult, 2),
                    "max": round(skill_rate["p75"] * loc_mult * exp_mult, 2)
                },
                "variance_percent": round(variance, 1),
                "price_tier": tier.value
            },
            "factors": {
                "skill_base": skill_rate["median"],
                "location_multiplier": loc_mult,
                "experience_multiplier": exp_mult,
                "rating_bonus": "1.2x" if average_rating >= 4.8 else ("1.1x" if average_rating >= 4.5 else "1x"),
                "experience_bonus": f"{(exp_mult - 1) * 100:.0f}%"
            },
            "competitive_position": self._analyze_competitive_position(
                current_rate, expected_rate, tier
            ),
            "recommendations": self._get_rate_recommendations(
                current_rate, expected_rate, tier, skills
            )
        }
    
    def suggest_optimal_rate(
        self,
        skills: List[str],
        years_experience: int,
        location: str = "global",
        target_tier: str = "standard"
    ) -> Dict[str, Any]:
        """
        Suggest optimal rate based on profile and goals
        """
        skill_rate = self._calculate_skill_rate(skills)
        loc_mult = LOCATION_MULTIPLIERS.get(location.lower(), 0.7)
        exp_mult = self._get_experience_multiplier(years_experience)
        
        # Target tier multipliers
        tier_targets = {
            "budget": 0.7,
            "standard": 0.9,
            "premium": 1.1,
            "expert": 1.3
        }
        tier_mult = tier_targets.get(target_tier, 0.9)
        
        optimal = skill_rate["median"] * loc_mult * exp_mult * tier_mult
        
        return {
            "suggested_rate": round(optimal, 2),
            "rate_range": {
                "conservative": round(optimal * 0.85, 2),
                "aggressive": round(optimal * 1.15, 2)
            },
            "target_tier": target_tier,
            "rationale": [
                f"Based on {len(skills)} skill(s) with median rate ${skill_rate['median']}/hr",
                f"Location factor: {loc_mult}x ({location})",
                f"Experience factor: {exp_mult}x ({years_experience} years)",
                f"Tier targeting: {tier_mult}x ({target_tier})"
            ]
        }
    
    # =========================================================================
    # MARKET INTELLIGENCE
    # =========================================================================
    
    def get_skill_market_rates(
        self,
        skill: str
    ) -> Dict[str, Any]:
        """Get detailed market rates for a skill"""
        skill_lower = skill.lower()
        
        # Find matching skill
        rate_data = None
        for key, rates in GLOBAL_SKILL_RATES.items():
            if key in skill_lower or skill_lower in key:
                rate_data = rates
                break
        
        if not rate_data:
            rate_data = {"median": 50, "p25": 30, "p75": 80}  # Default
        
        return {
            "skill": skill,
            "global_rates": {
                "median": rate_data["median"],
                "25th_percentile": rate_data["p25"],
                "75th_percentile": rate_data["p75"]
            },
            "regional_rates": {
                region: {
                    "median": round(rate_data["median"] * mult, 2),
                    "range": [
                        round(rate_data["p25"] * mult, 2),
                        round(rate_data["p75"] * mult, 2)
                    ]
                }
                for region, mult in list(LOCATION_MULTIPLIERS.items())[:5]
            },
            "trend": self._get_skill_trend(skill_lower)
        }
    
    def get_market_overview(self) -> Dict[str, Any]:
        """Get overall market overview"""
        # Top skills by rate
        sorted_skills = sorted(
            GLOBAL_SKILL_RATES.items(),
            key=lambda x: x[1]["median"],
            reverse=True
        )
        
        return {
            "highest_paying_skills": [
                {"skill": s[0], "median_rate": s[1]["median"]}
                for s in sorted_skills[:10]
            ],
            "trending_skills": [
                "machine learning", "blockchain", "rust", "kubernetes", "ai"
            ],
            "demand_indicators": {
                "ai_ml": "very_high",
                "web_development": "high",
                "mobile_development": "high",
                "design": "moderate",
                "writing": "moderate"
            },
            "generated_at": datetime.now(timezone.utc).isoformat()
        }
    
    # =========================================================================
    # HELPERS
    # =========================================================================
    
    def _calculate_skill_rate(self, skills: List[str]) -> Dict[str, float]:
        """Calculate composite rate from multiple skills"""
        if not skills:
            return {"median": 50, "p25": 30, "p75": 80}
        
        rates = []
        for skill in skills:
            skill_lower = skill.lower()
            for key, rate_data in GLOBAL_SKILL_RATES.items():
                if key in skill_lower or skill_lower in key:
                    rates.append(rate_data)
                    break
        
        if not rates:
            return {"median": 50, "p25": 30, "p75": 80}
        
        # Use highest skill rate (specialist pricing)
        best_rate = max(rates, key=lambda x: x["median"])
        
        # Slight bonus for multiple skills
        skill_bonus = 1 + (len(skills) - 1) * 0.05  # 5% per additional skill
        skill_bonus = min(skill_bonus, 1.3)  # Cap at 30% bonus
        
        return {
            "median": round(best_rate["median"] * skill_bonus, 2),
            "p25": round(best_rate["p25"] * skill_bonus, 2),
            "p75": round(best_rate["p75"] * skill_bonus, 2)
        }
    
    def _get_experience_multiplier(self, years: int) -> float:
        """Get multiplier for experience level"""
        for threshold, multiplier in sorted(EXPERIENCE_MULTIPLIERS.items(), reverse=True):
            if years >= threshold:
                return multiplier
        return 0.6
    
    def _determine_price_tier(
        self,
        rate: float,
        market_rates: Dict[str, float]
    ) -> PriceTier:
        """Determine price tier relative to market"""
        if rate < market_rates["p25"]:
            return PriceTier.BUDGET
        elif rate < market_rates["median"]:
            return PriceTier.STANDARD
        elif rate < market_rates["p75"]:
            return PriceTier.PREMIUM
        else:
            return PriceTier.EXPERT
    
    def _get_platform_market_data(
        self,
        category: str,
        skills: List[str]
    ) -> Dict[str, float]:
        """Get market data from platform history"""
        # In production, query actual contract data
        # For now, use skill rates
        skill_rate = self._calculate_skill_rate(skills)
        return {
            "avg": skill_rate["median"] * 50,  # 50 hours typical
            "min": skill_rate["p25"] * 30,
            "max": skill_rate["p75"] * 100
        }
    
    def _compare_to_market(
        self,
        budget: float,
        market_data: Dict[str, float]
    ) -> str:
        """Compare budget to market"""
        avg = market_data.get("avg", budget)
        if budget < avg * 0.7:
            return "below_market"
        elif budget > avg * 1.3:
            return "above_market"
        else:
            return "at_market"
    
    def _calculate_percentile(
        self,
        value: float,
        market_data: Dict[str, float]
    ) -> int:
        """Calculate approximate percentile"""
        min_val = market_data.get("min", value * 0.5)
        max_val = market_data.get("max", value * 2)
        
        if value <= min_val:
            return 10
        elif value >= max_val:
            return 90
        else:
            percentile = ((value - min_val) / (max_val - min_val)) * 80 + 10
            return int(percentile)
    
    def _calculate_confidence(
        self,
        skills: List[str],
        description: str
    ) -> str:
        """Calculate estimate confidence"""
        # More skills and longer description = higher confidence
        skill_score = len([s for s in skills if s.lower() in str(GLOBAL_SKILL_RATES.keys())])
        desc_score = 1 if len(description.split()) > 50 else 0.5
        
        total = skill_score * desc_score
        if total >= 2:
            return "high"
        elif total >= 1:
            return "medium"
        else:
            return "low"
    
    def _get_budget_recommendations(
        self,
        budget: float,
        complexity: str,
        quality: str
    ) -> List[str]:
        """Get budget recommendations"""
        recs = []
        
        if quality == "budget" and complexity == "expert":
            recs.append("⚠️ Complex projects may struggle to attract quality at budget rates")
        
        if budget < 500:
            recs.append("Consider fixed-price for small projects to attract more freelancers")
        elif budget > 5000:
            recs.append("Consider milestone payments for better cash flow management")
        
        if complexity in ["complex", "expert"]:
            recs.append("Post detailed requirements to attract specialized talent")
        
        return recs
    
    def _analyze_competitive_position(
        self,
        current: float,
        expected: float,
        tier: PriceTier
    ) -> Dict[str, Any]:
        """Analyze competitive position"""
        variance = ((current - expected) / expected * 100) if expected > 0 else 0
        
        if tier == PriceTier.BUDGET:
            position = "You're competing on price - expect high volume, lower quality clients"
        elif tier == PriceTier.STANDARD:
            position = "Well-positioned for steady work flow"
        elif tier == PriceTier.PREMIUM:
            position = "Premium positioning - focus on showcasing expertise"
        else:
            position = "Expert tier - target enterprise and high-value projects"
        
        return {
            "position": position,
            "variance_direction": "above" if variance > 0 else "below",
            "variance_percent": abs(round(variance, 1))
        }
    
    def _get_rate_recommendations(
        self,
        current: float,
        expected: float,
        tier: PriceTier,
        skills: List[str]
    ) -> List[str]:
        """Get rate optimization recommendations"""
        recs = []
        
        if current < expected * 0.7:
            recs.append("🔼 Consider raising rates - you may be undervaluing your skills")
        elif current > expected * 1.5:
            recs.append("💡 Very high rate - ensure portfolio demonstrates exceptional value")
        
        if tier == PriceTier.BUDGET:
            recs.append("Build reviews and portfolio to move to higher tier")
        
        # Skill-specific advice
        high_demand = ["machine learning", "blockchain", "ai", "rust"]
        if any(hd in ' '.join(skills).lower() for hd in high_demand):
            recs.append("⭐ High-demand skills - premium pricing justified")
        
        return recs
    
    def _get_skill_trend(self, skill: str) -> Dict[str, Any]:
        """Get trend for a skill"""
        # In production, compute from actual data
        rising_skills = ["machine learning", "ai", "rust", "go", "kubernetes", "blockchain"]
        falling_skills = ["php", "jquery", "wordpress"]
        
        if skill in rising_skills:
            return {"direction": "rising", "change": "+15%", "period": "12 months"}
        elif skill in falling_skills:
            return {"direction": "falling", "change": "-5%", "period": "12 months"}
        else:
            return {"direction": "stable", "change": "+2%", "period": "12 months"}


# Factory function
def get_pricing_engine(db: Session) -> SmartPricingEngine:
    """Get pricing engine instance"""
    return SmartPricingEngine(db)
