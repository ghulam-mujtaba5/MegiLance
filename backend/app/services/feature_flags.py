# @AI-HINT: A/B testing and feature flags for controlled feature rollout
"""
Feature Flags and A/B Testing Service - Controlled feature rollout system.

Features:
- Feature flag management
- A/B testing with variants
- User targeting rules
- Gradual rollout percentages
- Analytics and metrics
- Environment-specific flags
- Real-time flag updates
"""

import logging
import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from enum import Enum
from collections import defaultdict

logger = logging.getLogger(__name__)


class FeatureStatus(str, Enum):
    """Feature flag status."""
    DISABLED = "disabled"
    ENABLED = "enabled"
    PERCENTAGE = "percentage"
    TARGETED = "targeted"
    SCHEDULED = "scheduled"


class ExperimentStatus(str, Enum):
    """A/B experiment status."""
    DRAFT = "draft"
    RUNNING = "running"
    PAUSED = "paused"
    COMPLETED = "completed"
    ARCHIVED = "archived"


class TargetOperator(str, Enum):
    """Targeting rule operators."""
    EQUALS = "equals"
    NOT_EQUALS = "not_equals"
    CONTAINS = "contains"
    IN_LIST = "in_list"
    NOT_IN_LIST = "not_in_list"
    GREATER_THAN = "greater_than"
    LESS_THAN = "less_than"
    REGEX = "regex"


class FeatureFlagsService:
    """
    Feature flags and A/B testing management service.
    
    Provides controlled feature rollout, experimentation,
    and user targeting capabilities.
    """
    
    def __init__(self, db: Session):
        self.db = db
        
        # In-memory stores
        self._flags: Dict[str, Dict] = {}
        self._experiments: Dict[str, Dict] = {}
        self._user_assignments: Dict[str, Dict[int, str]] = defaultdict(dict)
        self._metrics: Dict[str, List[Dict]] = defaultdict(list)
        self._overrides: Dict[str, Dict[int, bool]] = defaultdict(dict)
        
        # Initialize default flags
        self._init_default_flags()
    
    def _init_default_flags(self):
        """Initialize default feature flags."""
        default_flags = [
            {
                "key": "dark_mode",
                "name": "Dark Mode",
                "description": "Enable dark mode theme",
                "status": FeatureStatus.ENABLED.value,
                "default_value": True
            },
            {
                "key": "ai_matching",
                "name": "AI Job Matching",
                "description": "AI-powered job matching for freelancers",
                "status": FeatureStatus.ENABLED.value,
                "default_value": True
            },
            {
                "key": "video_interviews",
                "name": "Video Interviews",
                "description": "Built-in video interview feature",
                "status": FeatureStatus.PERCENTAGE.value,
                "percentage": 50,
                "default_value": False
            },
            {
                "key": "smart_pricing",
                "name": "Smart Pricing Suggestions",
                "description": "AI-powered pricing recommendations",
                "status": FeatureStatus.TARGETED.value,
                "default_value": False,
                "targeting_rules": [
                    {"attribute": "user_type", "operator": "equals", "value": "freelancer"}
                ]
            },
            {
                "key": "team_features",
                "name": "Team Collaboration",
                "description": "Agency and team management features",
                "status": FeatureStatus.PERCENTAGE.value,
                "percentage": 25,
                "default_value": False
            },
            {
                "key": "escrow_v2",
                "name": "Advanced Escrow System",
                "description": "Enhanced escrow with milestone funding",
                "status": FeatureStatus.DISABLED.value,
                "default_value": False
            }
        ]
        
        for flag_config in default_flags:
            flag_id = f"flag_{secrets.token_hex(6)}"
            self._flags[flag_config["key"]] = {
                "id": flag_id,
                **flag_config,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
    
    # ===================
    # Feature Flag Methods
    # ===================
    
    async def create_flag(
        self,
        key: str,
        name: str,
        description: Optional[str] = None,
        status: FeatureStatus = FeatureStatus.DISABLED,
        default_value: bool = False,
        percentage: int = 0,
        targeting_rules: Optional[List[Dict]] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Create a new feature flag."""
        if key in self._flags:
            return {"error": "Flag key already exists"}
        
        flag_id = f"flag_{secrets.token_hex(8)}"
        
        flag = {
            "id": flag_id,
            "key": key,
            "name": name,
            "description": description or "",
            "status": status.value,
            "default_value": default_value,
            "percentage": percentage,
            "targeting_rules": targeting_rules or [],
            "metadata": metadata or {},
            "environments": {
                "development": True,
                "staging": True,
                "production": default_value
            },
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        self._flags[key] = flag
        
        return {"flag": flag, "status": "created"}
    
    async def get_flag(self, key: str) -> Optional[Dict[str, Any]]:
        """Get a feature flag."""
        return self._flags.get(key)
    
    async def update_flag(
        self,
        key: str,
        updates: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Update a feature flag."""
        flag = self._flags.get(key)
        if not flag:
            return {"error": "Flag not found"}
        
        allowed_updates = [
            "name", "description", "status", "default_value",
            "percentage", "targeting_rules", "metadata", "environments"
        ]
        
        for field in allowed_updates:
            if field in updates:
                flag[field] = updates[field]
        
        flag["updated_at"] = datetime.utcnow().isoformat()
        
        return {"flag": flag, "status": "updated"}
    
    async def delete_flag(self, key: str) -> bool:
        """Delete a feature flag."""
        if key in self._flags:
            del self._flags[key]
            return True
        return False
    
    async def is_enabled(
        self,
        key: str,
        user_id: Optional[int] = None,
        user_attributes: Optional[Dict[str, Any]] = None,
        environment: str = "production"
    ) -> bool:
        """
        Check if a feature is enabled for a user.
        
        Args:
            key: Feature flag key
            user_id: Optional user ID for targeting
            user_attributes: User attributes for targeting rules
            environment: Current environment
            
        Returns:
            Whether the feature is enabled
        """
        flag = self._flags.get(key)
        if not flag:
            return False
        
        # Check override
        if user_id and user_id in self._overrides.get(key, {}):
            return self._overrides[key][user_id]
        
        # Check environment
        env_enabled = flag.get("environments", {}).get(environment, flag["default_value"])
        if not env_enabled:
            return False
        
        status = FeatureStatus(flag["status"])
        
        if status == FeatureStatus.DISABLED:
            return False
        
        if status == FeatureStatus.ENABLED:
            return True
        
        if status == FeatureStatus.PERCENTAGE:
            if not user_id:
                return flag["default_value"]
            
            # Consistent hashing for percentage rollout
            hash_input = f"{key}:{user_id}"
            hash_value = int(hashlib.md5(hash_input.encode()).hexdigest(), 16)
            user_percentage = hash_value % 100
            
            return user_percentage < flag["percentage"]
        
        if status == FeatureStatus.TARGETED:
            if not user_attributes:
                return flag["default_value"]
            
            return self._evaluate_targeting(flag["targeting_rules"], user_attributes)
        
        if status == FeatureStatus.SCHEDULED:
            schedule = flag.get("schedule", {})
            now = datetime.utcnow()
            
            start = schedule.get("start")
            end = schedule.get("end")
            
            if start and datetime.fromisoformat(start) > now:
                return False
            if end and datetime.fromisoformat(end) < now:
                return False
            
            return True
        
        return flag["default_value"]
    
    async def set_override(
        self,
        key: str,
        user_id: int,
        enabled: bool
    ) -> Dict[str, Any]:
        """Set a user-specific override for a flag."""
        self._overrides[key][user_id] = enabled
        return {
            "key": key,
            "user_id": user_id,
            "enabled": enabled,
            "status": "override_set"
        }
    
    async def remove_override(
        self,
        key: str,
        user_id: int
    ) -> bool:
        """Remove a user override."""
        if key in self._overrides and user_id in self._overrides[key]:
            del self._overrides[key][user_id]
            return True
        return False
    
    async def get_all_flags(
        self,
        environment: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get all feature flags."""
        flags = list(self._flags.values())
        
        if environment:
            # Filter by environment
            flags = [
                f for f in flags 
                if f.get("environments", {}).get(environment, True)
            ]
        
        return flags
    
    async def get_user_flags(
        self,
        user_id: int,
        user_attributes: Optional[Dict[str, Any]] = None,
        environment: str = "production"
    ) -> Dict[str, bool]:
        """Get all flag values for a user."""
        result = {}
        
        for key in self._flags:
            result[key] = await self.is_enabled(
                key, user_id, user_attributes, environment
            )
        
        return result
    
    # ===================
    # A/B Testing Methods
    # ===================
    
    async def create_experiment(
        self,
        name: str,
        description: Optional[str] = None,
        variants: List[Dict[str, Any]] = None,
        targeting: Optional[Dict[str, Any]] = None,
        traffic_percentage: int = 100,
        metrics: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Create a new A/B test experiment."""
        experiment_id = f"exp_{secrets.token_hex(8)}"
        
        # Default variants
        if not variants:
            variants = [
                {"id": "control", "name": "Control", "weight": 50},
                {"id": "treatment", "name": "Treatment", "weight": 50}
            ]
        
        experiment = {
            "id": experiment_id,
            "name": name,
            "description": description or "",
            "status": ExperimentStatus.DRAFT.value,
            "variants": variants,
            "targeting": targeting or {},
            "traffic_percentage": traffic_percentage,
            "metrics": metrics or ["conversion"],
            "results": {v["id"]: {"participants": 0, "conversions": 0} 
                       for v in variants},
            "created_at": datetime.utcnow().isoformat(),
            "started_at": None,
            "ended_at": None
        }
        
        self._experiments[experiment_id] = experiment
        
        return {"experiment": experiment, "status": "created"}
    
    async def start_experiment(self, experiment_id: str) -> Dict[str, Any]:
        """Start an A/B test experiment."""
        experiment = self._experiments.get(experiment_id)
        if not experiment:
            return {"error": "Experiment not found"}
        
        experiment["status"] = ExperimentStatus.RUNNING.value
        experiment["started_at"] = datetime.utcnow().isoformat()
        
        return {"experiment_id": experiment_id, "status": "running"}
    
    async def pause_experiment(self, experiment_id: str) -> Dict[str, Any]:
        """Pause an A/B test experiment."""
        experiment = self._experiments.get(experiment_id)
        if not experiment:
            return {"error": "Experiment not found"}
        
        experiment["status"] = ExperimentStatus.PAUSED.value
        
        return {"experiment_id": experiment_id, "status": "paused"}
    
    async def complete_experiment(
        self,
        experiment_id: str,
        winning_variant: Optional[str] = None
    ) -> Dict[str, Any]:
        """Complete an A/B test experiment."""
        experiment = self._experiments.get(experiment_id)
        if not experiment:
            return {"error": "Experiment not found"}
        
        experiment["status"] = ExperimentStatus.COMPLETED.value
        experiment["ended_at"] = datetime.utcnow().isoformat()
        experiment["winning_variant"] = winning_variant
        
        return {
            "experiment_id": experiment_id,
            "status": "completed",
            "results": experiment["results"],
            "winning_variant": winning_variant
        }
    
    async def get_variant(
        self,
        experiment_id: str,
        user_id: int,
        user_attributes: Optional[Dict[str, Any]] = None
    ) -> Optional[Dict[str, Any]]:
        """Get the variant assigned to a user for an experiment."""
        experiment = self._experiments.get(experiment_id)
        if not experiment:
            return None
        
        # Check if experiment is running
        if experiment["status"] != ExperimentStatus.RUNNING.value:
            return None
        
        # Check targeting
        if experiment["targeting"]:
            if not user_attributes:
                return None
            if not self._evaluate_targeting(
                experiment["targeting"].get("rules", []), 
                user_attributes
            ):
                return None
        
        # Check traffic percentage
        traffic_hash = f"{experiment_id}:traffic:{user_id}"
        traffic_value = int(hashlib.md5(traffic_hash.encode()).hexdigest(), 16) % 100
        
        if traffic_value >= experiment["traffic_percentage"]:
            return None  # User not in experiment
        
        # Check for existing assignment
        if user_id in self._user_assignments.get(experiment_id, {}):
            variant_id = self._user_assignments[experiment_id][user_id]
            variant = next(
                (v for v in experiment["variants"] if v["id"] == variant_id), 
                None
            )
            return variant
        
        # Assign variant based on weights
        variant_hash = f"{experiment_id}:variant:{user_id}"
        variant_value = int(hashlib.md5(variant_hash.encode()).hexdigest(), 16) % 100
        
        cumulative_weight = 0
        assigned_variant = None
        
        for variant in experiment["variants"]:
            cumulative_weight += variant["weight"]
            if variant_value < cumulative_weight:
                assigned_variant = variant
                break
        
        if not assigned_variant:
            assigned_variant = experiment["variants"][-1]
        
        # Store assignment
        self._user_assignments[experiment_id][user_id] = assigned_variant["id"]
        
        # Track participation
        experiment["results"][assigned_variant["id"]]["participants"] += 1
        
        return assigned_variant
    
    async def track_conversion(
        self,
        experiment_id: str,
        user_id: int,
        metric: str = "conversion",
        value: float = 1.0
    ) -> Dict[str, Any]:
        """Track a conversion for an experiment."""
        experiment = self._experiments.get(experiment_id)
        if not experiment:
            return {"error": "Experiment not found"}
        
        # Get user's variant
        variant_id = self._user_assignments.get(experiment_id, {}).get(user_id)
        if not variant_id:
            return {"error": "User not in experiment"}
        
        # Track conversion
        if variant_id in experiment["results"]:
            experiment["results"][variant_id]["conversions"] += value
        
        # Store metric
        self._metrics[experiment_id].append({
            "user_id": user_id,
            "variant_id": variant_id,
            "metric": metric,
            "value": value,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        return {
            "experiment_id": experiment_id,
            "variant_id": variant_id,
            "metric": metric,
            "status": "tracked"
        }
    
    async def get_experiment_results(
        self,
        experiment_id: str
    ) -> Dict[str, Any]:
        """Get experiment results with statistical analysis."""
        experiment = self._experiments.get(experiment_id)
        if not experiment:
            return {"error": "Experiment not found"}
        
        results = experiment["results"]
        variants_analysis = []
        
        for variant in experiment["variants"]:
            variant_id = variant["id"]
            data = results.get(variant_id, {"participants": 0, "conversions": 0})
            
            participants = data["participants"]
            conversions = data["conversions"]
            conversion_rate = conversions / participants if participants > 0 else 0
            
            variants_analysis.append({
                "variant_id": variant_id,
                "name": variant["name"],
                "participants": participants,
                "conversions": conversions,
                "conversion_rate": conversion_rate,
                "confidence_interval": self._calculate_confidence_interval(
                    participants, conversions
                )
            })
        
        # Calculate statistical significance
        if len(variants_analysis) >= 2:
            control = variants_analysis[0]
            treatment = variants_analysis[1]
            
            significance = self._calculate_significance(control, treatment)
        else:
            significance = None
        
        return {
            "experiment_id": experiment_id,
            "name": experiment["name"],
            "status": experiment["status"],
            "variants": variants_analysis,
            "statistical_significance": significance,
            "sample_size_recommendation": self._recommend_sample_size(variants_analysis),
            "started_at": experiment["started_at"],
            "ended_at": experiment["ended_at"]
        }
    
    async def get_all_experiments(
        self,
        status: Optional[ExperimentStatus] = None
    ) -> List[Dict[str, Any]]:
        """Get all experiments."""
        experiments = list(self._experiments.values())
        
        if status:
            experiments = [e for e in experiments if e["status"] == status.value]
        
        return experiments
    
    # ===================
    # Helper Methods
    # ===================
    
    def _evaluate_targeting(
        self,
        rules: List[Dict],
        attributes: Dict[str, Any]
    ) -> bool:
        """Evaluate targeting rules against user attributes."""
        if not rules:
            return True
        
        for rule in rules:
            attr = rule.get("attribute")
            operator = rule.get("operator")
            value = rule.get("value")
            
            if attr not in attributes:
                return False
            
            user_value = attributes[attr]
            
            if operator == TargetOperator.EQUALS.value:
                if user_value != value:
                    return False
            elif operator == TargetOperator.NOT_EQUALS.value:
                if user_value == value:
                    return False
            elif operator == TargetOperator.CONTAINS.value:
                if value not in str(user_value):
                    return False
            elif operator == TargetOperator.IN_LIST.value:
                if user_value not in value:
                    return False
            elif operator == TargetOperator.NOT_IN_LIST.value:
                if user_value in value:
                    return False
            elif operator == TargetOperator.GREATER_THAN.value:
                if float(user_value) <= float(value):
                    return False
            elif operator == TargetOperator.LESS_THAN.value:
                if float(user_value) >= float(value):
                    return False
        
        return True
    
    def _calculate_confidence_interval(
        self,
        n: int,
        conversions: float,
        confidence: float = 0.95
    ) -> Dict[str, float]:
        """Calculate confidence interval for conversion rate."""
        if n == 0:
            return {"lower": 0, "upper": 0}
        
        p = conversions / n
        
        # Z-score for 95% confidence
        z = 1.96
        
        # Wilson score interval
        denominator = 1 + z**2/n
        center = (p + z**2/(2*n)) / denominator
        margin = z * ((p*(1-p)/n + z**2/(4*n**2))**0.5) / denominator
        
        return {
            "lower": max(0, center - margin),
            "upper": min(1, center + margin)
        }
    
    def _calculate_significance(
        self,
        control: Dict,
        treatment: Dict
    ) -> Dict[str, Any]:
        """Calculate statistical significance between variants."""
        n1 = control["participants"]
        n2 = treatment["participants"]
        
        if n1 == 0 or n2 == 0:
            return {"significant": False, "confidence": 0}
        
        p1 = control["conversion_rate"]
        p2 = treatment["conversion_rate"]
        
        # Pooled proportion
        p_pool = (p1*n1 + p2*n2) / (n1 + n2)
        
        # Standard error
        if p_pool == 0 or p_pool == 1:
            return {"significant": False, "confidence": 0}
        
        se = (p_pool * (1-p_pool) * (1/n1 + 1/n2)) ** 0.5
        
        if se == 0:
            return {"significant": False, "confidence": 0}
        
        # Z-score
        z = abs(p2 - p1) / se
        
        # Approximate confidence
        if z >= 2.58:
            confidence = 0.99
        elif z >= 1.96:
            confidence = 0.95
        elif z >= 1.645:
            confidence = 0.90
        else:
            confidence = 0
        
        return {
            "significant": confidence >= 0.95,
            "confidence": confidence,
            "z_score": z,
            "lift": (p2 - p1) / p1 if p1 > 0 else 0
        }
    
    def _recommend_sample_size(
        self,
        variants: List[Dict]
    ) -> Dict[str, Any]:
        """Recommend sample size for statistical power."""
        if len(variants) < 2:
            return {"recommended": 1000, "current": 0}
        
        control_rate = variants[0]["conversion_rate"]
        
        # For 80% power, 95% significance, 10% minimum detectable effect
        mde = 0.10
        alpha = 0.05
        power = 0.80
        
        # Simplified calculation
        baseline = control_rate if control_rate > 0 else 0.05
        
        recommended = int(
            2 * ((1.96 + 0.84) ** 2) * baseline * (1 - baseline) / (mde * baseline) ** 2
        )
        
        current = sum(v["participants"] for v in variants)
        
        return {
            "recommended_per_variant": recommended,
            "current_total": current,
            "progress": min(1.0, current / (recommended * 2))
        }


# Singleton instance
_feature_flags_service: Optional[FeatureFlagsService] = None


def get_feature_flags_service(db: Session) -> FeatureFlagsService:
    """Get or create feature flags service instance."""
    global _feature_flags_service
    if _feature_flags_service is None:
        _feature_flags_service = FeatureFlagsService(db)
    else:
        _feature_flags_service.db = db
    return _feature_flags_service
