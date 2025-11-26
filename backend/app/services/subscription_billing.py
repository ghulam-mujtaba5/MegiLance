# @AI-HINT: Subscription and billing management service for premium features and plans
"""
Subscription & Billing Service

Manages subscription plans, billing cycles, payment processing,
and premium feature access.
"""

from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from decimal import Decimal
from enum import Enum
import logging

from app.models.user import User

logger = logging.getLogger(__name__)


class PlanTier(str, Enum):
    FREE = "free"
    STARTER = "starter"
    PROFESSIONAL = "professional"
    BUSINESS = "business"
    ENTERPRISE = "enterprise"


class BillingCycle(str, Enum):
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    ANNUAL = "annual"


class PaymentStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"
    CANCELLED = "cancelled"


class SubscriptionStatus(str, Enum):
    ACTIVE = "active"
    CANCELLED = "cancelled"
    PAST_DUE = "past_due"
    TRIALING = "trialing"
    PAUSED = "paused"
    EXPIRED = "expired"


# Plan definitions with features
SUBSCRIPTION_PLANS = {
    PlanTier.FREE: {
        "name": "Free",
        "description": "Basic access for individuals",
        "price_monthly": Decimal("0.00"),
        "price_annual": Decimal("0.00"),
        "features": {
            "max_projects": 3,
            "max_proposals_per_month": 10,
            "max_file_storage_mb": 100,
            "priority_support": False,
            "analytics_access": False,
            "api_access": False,
            "custom_branding": False,
            "team_members": 0,
            "commission_rate": Decimal("15.0")
        }
    },
    PlanTier.STARTER: {
        "name": "Starter",
        "description": "Perfect for getting started",
        "price_monthly": Decimal("9.99"),
        "price_annual": Decimal("99.99"),
        "features": {
            "max_projects": 10,
            "max_proposals_per_month": 50,
            "max_file_storage_mb": 500,
            "priority_support": False,
            "analytics_access": True,
            "api_access": False,
            "custom_branding": False,
            "team_members": 0,
            "commission_rate": Decimal("12.0")
        }
    },
    PlanTier.PROFESSIONAL: {
        "name": "Professional",
        "description": "For serious freelancers",
        "price_monthly": Decimal("29.99"),
        "price_annual": Decimal("299.99"),
        "features": {
            "max_projects": 50,
            "max_proposals_per_month": 200,
            "max_file_storage_mb": 2000,
            "priority_support": True,
            "analytics_access": True,
            "api_access": True,
            "custom_branding": False,
            "team_members": 3,
            "commission_rate": Decimal("10.0")
        }
    },
    PlanTier.BUSINESS: {
        "name": "Business",
        "description": "For teams and agencies",
        "price_monthly": Decimal("79.99"),
        "price_annual": Decimal("799.99"),
        "features": {
            "max_projects": 200,
            "max_proposals_per_month": 500,
            "max_file_storage_mb": 10000,
            "priority_support": True,
            "analytics_access": True,
            "api_access": True,
            "custom_branding": True,
            "team_members": 10,
            "commission_rate": Decimal("8.0")
        }
    },
    PlanTier.ENTERPRISE: {
        "name": "Enterprise",
        "description": "Custom solutions for large organizations",
        "price_monthly": Decimal("299.99"),
        "price_annual": Decimal("2999.99"),
        "features": {
            "max_projects": -1,  # Unlimited
            "max_proposals_per_month": -1,  # Unlimited
            "max_file_storage_mb": 100000,
            "priority_support": True,
            "analytics_access": True,
            "api_access": True,
            "custom_branding": True,
            "team_members": -1,  # Unlimited
            "commission_rate": Decimal("5.0"),
            "dedicated_account_manager": True,
            "sla_guarantee": True,
            "custom_integrations": True
        }
    }
}


class SubscriptionBillingService:
    """Service for managing subscriptions and billing"""
    
    def __init__(self, db: Session):
        self.db = db
    
    # Plan Management
    async def get_available_plans(self) -> List[Dict[str, Any]]:
        """Get all available subscription plans"""
        plans = []
        for tier, plan_data in SUBSCRIPTION_PLANS.items():
            plans.append({
                "tier": tier.value,
                "name": plan_data["name"],
                "description": plan_data["description"],
                "price_monthly": float(plan_data["price_monthly"]),
                "price_annual": float(plan_data["price_annual"]),
                "annual_savings": float(
                    plan_data["price_monthly"] * 12 - plan_data["price_annual"]
                ),
                "features": {
                    k: v if not isinstance(v, Decimal) else float(v)
                    for k, v in plan_data["features"].items()
                }
            })
        return plans
    
    async def get_plan_details(self, tier: PlanTier) -> Optional[Dict[str, Any]]:
        """Get detailed information about a specific plan"""
        if tier not in SUBSCRIPTION_PLANS:
            return None
        
        plan_data = SUBSCRIPTION_PLANS[tier]
        return {
            "tier": tier.value,
            **plan_data,
            "price_monthly": float(plan_data["price_monthly"]),
            "price_annual": float(plan_data["price_annual"]),
            "features": {
                k: v if not isinstance(v, Decimal) else float(v)
                for k, v in plan_data["features"].items()
            }
        }
    
    async def compare_plans(self, tier1: PlanTier, tier2: PlanTier) -> Dict[str, Any]:
        """Compare two subscription plans"""
        plan1 = SUBSCRIPTION_PLANS.get(tier1, {})
        plan2 = SUBSCRIPTION_PLANS.get(tier2, {})
        
        features1 = plan1.get("features", {})
        features2 = plan2.get("features", {})
        
        comparison = {
            "plan1": {"tier": tier1.value, "name": plan1.get("name", "")},
            "plan2": {"tier": tier2.value, "name": plan2.get("name", "")},
            "differences": {}
        }
        
        all_features = set(features1.keys()) | set(features2.keys())
        for feature in all_features:
            val1 = features1.get(feature)
            val2 = features2.get(feature)
            if val1 != val2:
                comparison["differences"][feature] = {
                    "plan1": val1 if not isinstance(val1, Decimal) else float(val1),
                    "plan2": val2 if not isinstance(val2, Decimal) else float(val2)
                }
        
        return comparison
    
    # Subscription Management
    async def get_user_subscription(self, user_id: int) -> Dict[str, Any]:
        """Get user's current subscription"""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return {"error": "User not found"}
        
        # Get subscription from user metadata or return free tier
        subscription_data = (user.profile_data or {}).get("subscription", {})
        
        if not subscription_data:
            return {
                "user_id": user_id,
                "tier": PlanTier.FREE.value,
                "status": SubscriptionStatus.ACTIVE.value,
                "billing_cycle": None,
                "current_period_start": None,
                "current_period_end": None,
                "features": SUBSCRIPTION_PLANS[PlanTier.FREE]["features"]
            }
        
        return subscription_data
    
    async def create_subscription(
        self,
        user_id: int,
        tier: PlanTier,
        billing_cycle: BillingCycle,
        payment_method_id: Optional[str] = None,
        trial_days: int = 0
    ) -> Dict[str, Any]:
        """Create a new subscription for user"""
        try:
            user = self.db.query(User).filter(User.id == user_id).first()
            if not user:
                return {"error": "User not found"}
            
            plan = SUBSCRIPTION_PLANS.get(tier)
            if not plan:
                return {"error": "Invalid plan tier"}
            
            now = datetime.utcnow()
            
            # Calculate period end based on billing cycle
            if trial_days > 0:
                period_end = now + timedelta(days=trial_days)
                status = SubscriptionStatus.TRIALING
            elif billing_cycle == BillingCycle.MONTHLY:
                period_end = now + timedelta(days=30)
                status = SubscriptionStatus.ACTIVE
            elif billing_cycle == BillingCycle.QUARTERLY:
                period_end = now + timedelta(days=90)
                status = SubscriptionStatus.ACTIVE
            else:  # Annual
                period_end = now + timedelta(days=365)
                status = SubscriptionStatus.ACTIVE
            
            subscription = {
                "subscription_id": f"sub_{user_id}_{now.strftime('%Y%m%d%H%M%S')}",
                "user_id": user_id,
                "tier": tier.value,
                "status": status.value,
                "billing_cycle": billing_cycle.value,
                "current_period_start": now.isoformat(),
                "current_period_end": period_end.isoformat(),
                "trial_end": (now + timedelta(days=trial_days)).isoformat() if trial_days > 0 else None,
                "payment_method_id": payment_method_id,
                "features": {
                    k: v if not isinstance(v, Decimal) else float(v)
                    for k, v in plan["features"].items()
                },
                "created_at": now.isoformat()
            }
            
            # Store in user profile
            profile_data = user.profile_data or {}
            profile_data["subscription"] = subscription
            user.profile_data = profile_data
            self.db.commit()
            
            return subscription
            
        except Exception as e:
            logger.error(f"Error creating subscription: {e}")
            self.db.rollback()
            return {"error": str(e)}
    
    async def upgrade_subscription(
        self,
        user_id: int,
        new_tier: PlanTier,
        prorate: bool = True
    ) -> Dict[str, Any]:
        """Upgrade user's subscription to a higher tier"""
        try:
            current_sub = await self.get_user_subscription(user_id)
            if "error" in current_sub:
                return current_sub
            
            current_tier = PlanTier(current_sub.get("tier", "free"))
            
            # Validate upgrade path
            tier_order = [PlanTier.FREE, PlanTier.STARTER, PlanTier.PROFESSIONAL, 
                        PlanTier.BUSINESS, PlanTier.ENTERPRISE]
            
            if tier_order.index(new_tier) <= tier_order.index(current_tier):
                return {"error": "Can only upgrade to a higher tier"}
            
            # Calculate prorated amount if applicable
            proration_credit = Decimal("0.00")
            if prorate and current_sub.get("current_period_end"):
                # Calculate unused days
                period_end = datetime.fromisoformat(current_sub["current_period_end"])
                remaining_days = (period_end - datetime.utcnow()).days
                if remaining_days > 0:
                    current_plan = SUBSCRIPTION_PLANS.get(current_tier, {})
                    daily_rate = current_plan.get("price_monthly", Decimal("0")) / 30
                    proration_credit = daily_rate * remaining_days
            
            # Create new subscription
            billing_cycle = BillingCycle(current_sub.get("billing_cycle", "monthly"))
            result = await self.create_subscription(
                user_id, new_tier, billing_cycle, 
                current_sub.get("payment_method_id")
            )
            
            if "error" not in result:
                result["proration_credit"] = float(proration_credit)
                result["upgraded_from"] = current_tier.value
            
            return result
            
        except Exception as e:
            logger.error(f"Error upgrading subscription: {e}")
            return {"error": str(e)}
    
    async def downgrade_subscription(
        self,
        user_id: int,
        new_tier: PlanTier,
        effective_at_period_end: bool = True
    ) -> Dict[str, Any]:
        """Downgrade user's subscription to a lower tier"""
        try:
            current_sub = await self.get_user_subscription(user_id)
            if "error" in current_sub:
                return current_sub
            
            current_tier = PlanTier(current_sub.get("tier", "free"))
            
            # Validate downgrade path
            tier_order = [PlanTier.FREE, PlanTier.STARTER, PlanTier.PROFESSIONAL,
                        PlanTier.BUSINESS, PlanTier.ENTERPRISE]
            
            if tier_order.index(new_tier) >= tier_order.index(current_tier):
                return {"error": "Can only downgrade to a lower tier"}
            
            if effective_at_period_end:
                # Schedule downgrade for end of current period
                user = self.db.query(User).filter(User.id == user_id).first()
                profile_data = user.profile_data or {}
                profile_data["subscription"]["scheduled_downgrade"] = {
                    "new_tier": new_tier.value,
                    "effective_date": current_sub.get("current_period_end")
                }
                user.profile_data = profile_data
                self.db.commit()
                
                return {
                    "message": "Downgrade scheduled",
                    "current_tier": current_tier.value,
                    "new_tier": new_tier.value,
                    "effective_date": current_sub.get("current_period_end")
                }
            else:
                # Immediate downgrade
                billing_cycle = BillingCycle(current_sub.get("billing_cycle", "monthly"))
                return await self.create_subscription(
                    user_id, new_tier, billing_cycle,
                    current_sub.get("payment_method_id")
                )
                
        except Exception as e:
            logger.error(f"Error downgrading subscription: {e}")
            return {"error": str(e)}
    
    async def cancel_subscription(
        self,
        user_id: int,
        reason: Optional[str] = None,
        immediate: bool = False
    ) -> Dict[str, Any]:
        """Cancel user's subscription"""
        try:
            user = self.db.query(User).filter(User.id == user_id).first()
            if not user:
                return {"error": "User not found"}
            
            profile_data = user.profile_data or {}
            subscription = profile_data.get("subscription", {})
            
            if not subscription or subscription.get("tier") == PlanTier.FREE.value:
                return {"error": "No active subscription to cancel"}
            
            now = datetime.utcnow()
            
            if immediate:
                subscription["status"] = SubscriptionStatus.CANCELLED.value
                subscription["cancelled_at"] = now.isoformat()
                subscription["tier"] = PlanTier.FREE.value
            else:
                subscription["cancel_at_period_end"] = True
                subscription["cancellation_scheduled_at"] = now.isoformat()
            
            subscription["cancellation_reason"] = reason
            profile_data["subscription"] = subscription
            user.profile_data = profile_data
            self.db.commit()
            
            return {
                "message": "Subscription cancelled" if immediate else "Cancellation scheduled",
                "effective_date": now.isoformat() if immediate else subscription.get("current_period_end"),
                "reason": reason
            }
            
        except Exception as e:
            logger.error(f"Error cancelling subscription: {e}")
            self.db.rollback()
            return {"error": str(e)}
    
    async def reactivate_subscription(self, user_id: int) -> Dict[str, Any]:
        """Reactivate a cancelled subscription"""
        try:
            user = self.db.query(User).filter(User.id == user_id).first()
            if not user:
                return {"error": "User not found"}
            
            profile_data = user.profile_data or {}
            subscription = profile_data.get("subscription", {})
            
            if subscription.get("cancel_at_period_end"):
                subscription["cancel_at_period_end"] = False
                subscription.pop("cancellation_scheduled_at", None)
                subscription.pop("cancellation_reason", None)
                profile_data["subscription"] = subscription
                user.profile_data = profile_data
                self.db.commit()
                return {"message": "Subscription reactivated", "subscription": subscription}
            
            return {"error": "Subscription is not scheduled for cancellation"}
            
        except Exception as e:
            logger.error(f"Error reactivating subscription: {e}")
            return {"error": str(e)}
    
    # Feature Access
    async def check_feature_access(
        self,
        user_id: int,
        feature: str
    ) -> Dict[str, Any]:
        """Check if user has access to a specific feature"""
        subscription = await self.get_user_subscription(user_id)
        if "error" in subscription:
            return {"has_access": False, "error": subscription["error"]}
        
        features = subscription.get("features", {})
        feature_value = features.get(feature)
        
        if feature_value is None:
            return {"has_access": False, "reason": "Feature not found"}
        
        if isinstance(feature_value, bool):
            return {"has_access": feature_value, "feature": feature}
        elif isinstance(feature_value, (int, float)):
            return {
                "has_access": feature_value != 0,
                "feature": feature,
                "limit": feature_value,
                "unlimited": feature_value == -1
            }
        
        return {"has_access": True, "feature": feature, "value": feature_value}
    
    async def get_feature_limits(self, user_id: int) -> Dict[str, Any]:
        """Get all feature limits for user's subscription"""
        subscription = await self.get_user_subscription(user_id)
        if "error" in subscription:
            return subscription
        
        return {
            "tier": subscription.get("tier"),
            "features": subscription.get("features", {}),
            "status": subscription.get("status")
        }
    
    # Billing History
    async def get_billing_history(
        self,
        user_id: int,
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """Get user's billing/invoice history"""
        # Placeholder - would query actual invoice/payment records
        return {
            "user_id": user_id,
            "invoices": [],
            "total_invoices": 0,
            "message": "Billing history storage not yet implemented"
        }
    
    async def get_upcoming_invoice(self, user_id: int) -> Dict[str, Any]:
        """Preview the next invoice"""
        subscription = await self.get_user_subscription(user_id)
        if "error" in subscription:
            return subscription
        
        tier = PlanTier(subscription.get("tier", "free"))
        if tier == PlanTier.FREE:
            return {"message": "No upcoming invoice for free tier"}
        
        plan = SUBSCRIPTION_PLANS[tier]
        billing_cycle = subscription.get("billing_cycle", "monthly")
        
        if billing_cycle == "annual":
            amount = plan["price_annual"]
        elif billing_cycle == "quarterly":
            amount = plan["price_monthly"] * 3 * Decimal("0.95")  # 5% quarterly discount
        else:
            amount = plan["price_monthly"]
        
        return {
            "user_id": user_id,
            "tier": tier.value,
            "billing_cycle": billing_cycle,
            "amount": float(amount),
            "currency": "USD",
            "next_billing_date": subscription.get("current_period_end"),
            "items": [
                {
                    "description": f"{plan['name']} Plan - {billing_cycle.capitalize()}",
                    "amount": float(amount)
                }
            ]
        }
    
    # Usage Tracking
    async def track_usage(
        self,
        user_id: int,
        usage_type: str,
        amount: int = 1
    ) -> Dict[str, Any]:
        """Track feature usage against limits"""
        limits = await self.get_feature_limits(user_id)
        if "error" in limits:
            return limits
        
        features = limits.get("features", {})
        limit_value = features.get(usage_type)
        
        if limit_value is None:
            return {"error": f"Unknown usage type: {usage_type}"}
        
        # Placeholder - would track actual usage
        return {
            "usage_type": usage_type,
            "amount_used": amount,
            "limit": limit_value,
            "unlimited": limit_value == -1,
            "remaining": None if limit_value == -1 else max(0, limit_value - amount)
        }
    
    async def get_usage_summary(self, user_id: int) -> Dict[str, Any]:
        """Get usage summary for current billing period"""
        limits = await self.get_feature_limits(user_id)
        if "error" in limits:
            return limits
        
        # Placeholder - would calculate actual usage
        return {
            "user_id": user_id,
            "tier": limits.get("tier"),
            "billing_period": {
                "start": None,
                "end": None
            },
            "usage": {
                "projects": {"used": 0, "limit": limits["features"].get("max_projects", 0)},
                "proposals": {"used": 0, "limit": limits["features"].get("max_proposals_per_month", 0)},
                "storage_mb": {"used": 0, "limit": limits["features"].get("max_file_storage_mb", 0)}
            }
        }


def get_subscription_billing_service(db: Session) -> SubscriptionBillingService:
    """Get subscription billing service instance"""
    return SubscriptionBillingService(db)
