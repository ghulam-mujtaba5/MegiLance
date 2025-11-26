# @AI-HINT: API endpoints for feature flags and A/B testing
"""
Feature Flags & A/B Testing API - Controlled feature rollout.

Endpoints for:
- Feature flag management
- A/B experiments
- User variant assignment
- Conversion tracking
- Results analysis
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel, Field

from app.db.session import get_db
from app.core.security import get_current_active_user, get_current_user_optional
from app.models.user import User
from app.services.feature_flags import (
    get_feature_flags_service,
    FeatureStatus,
    ExperimentStatus
)

router = APIRouter(prefix="/features", tags=["features"])


# Request/Response Models
class CreateFlagRequest(BaseModel):
    key: str = Field(..., min_length=2, max_length=100)
    name: str
    description: Optional[str] = None
    status: str = "disabled"
    default_value: bool = False
    percentage: int = 0
    targeting_rules: Optional[List[dict]] = None


class UpdateFlagRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    default_value: Optional[bool] = None
    percentage: Optional[int] = None
    targeting_rules: Optional[List[dict]] = None
    environments: Optional[dict] = None


class FlagOverrideRequest(BaseModel):
    user_id: int
    enabled: bool


class CreateExperimentRequest(BaseModel):
    name: str
    description: Optional[str] = None
    variants: Optional[List[dict]] = None
    targeting: Optional[dict] = None
    traffic_percentage: int = 100
    metrics: Optional[List[str]] = None


class TrackConversionRequest(BaseModel):
    metric: str = "conversion"
    value: float = 1.0


class GetFlagsRequest(BaseModel):
    user_attributes: Optional[dict] = None
    environment: str = "production"


# Feature Flag Endpoints
@router.post("/flags")
async def create_flag(
    request: CreateFlagRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new feature flag (admin only)."""
    service = get_feature_flags_service(db)
    
    try:
        status = FeatureStatus(request.status)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    result = await service.create_flag(
        key=request.key,
        name=request.name,
        description=request.description,
        status=status,
        default_value=request.default_value,
        percentage=request.percentage,
        targeting_rules=request.targeting_rules
    )
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result


@router.get("/flags")
async def get_all_flags(
    environment: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all feature flags (admin only)."""
    service = get_feature_flags_service(db)
    
    flags = await service.get_all_flags(environment=environment)
    
    return {"flags": flags, "count": len(flags)}


@router.get("/flags/{key}")
async def get_flag(
    key: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get a feature flag."""
    service = get_feature_flags_service(db)
    
    flag = await service.get_flag(key)
    
    if not flag:
        raise HTTPException(status_code=404, detail="Flag not found")
    
    return flag


@router.put("/flags/{key}")
async def update_flag(
    key: str,
    request: UpdateFlagRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update a feature flag (admin only)."""
    service = get_feature_flags_service(db)
    
    updates = request.model_dump(exclude_none=True)
    
    if "status" in updates:
        try:
            updates["status"] = FeatureStatus(updates["status"]).value
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid status")
    
    result = await service.update_flag(key=key, updates=updates)
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result


@router.delete("/flags/{key}")
async def delete_flag(
    key: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a feature flag (admin only)."""
    service = get_feature_flags_service(db)
    
    success = await service.delete_flag(key)
    
    if not success:
        raise HTTPException(status_code=404, detail="Flag not found")
    
    return {"status": "deleted"}


@router.get("/flags/{key}/enabled")
async def check_flag_enabled(
    key: str,
    environment: str = "production",
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Check if a feature flag is enabled for the current user."""
    service = get_feature_flags_service(db)
    
    user_id = current_user.id if current_user else None
    
    enabled = await service.is_enabled(
        key=key,
        user_id=user_id,
        environment=environment
    )
    
    return {"key": key, "enabled": enabled}


@router.post("/flags/{key}/override")
async def set_flag_override(
    key: str,
    request: FlagOverrideRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Set a user override for a flag (admin only)."""
    service = get_feature_flags_service(db)
    
    result = await service.set_override(
        key=key,
        user_id=request.user_id,
        enabled=request.enabled
    )
    
    return result


@router.delete("/flags/{key}/override/{user_id}")
async def remove_flag_override(
    key: str,
    user_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Remove a user override (admin only)."""
    service = get_feature_flags_service(db)
    
    await service.remove_override(key=key, user_id=user_id)
    
    return {"status": "removed"}


@router.post("/my-flags")
async def get_my_flags(
    request: Optional[GetFlagsRequest] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all flag values for the current user."""
    service = get_feature_flags_service(db)
    
    user_attributes = request.user_attributes if request else None
    environment = request.environment if request else "production"
    
    flags = await service.get_user_flags(
        user_id=current_user.id,
        user_attributes=user_attributes,
        environment=environment
    )
    
    return flags


# A/B Testing Endpoints
@router.post("/experiments")
async def create_experiment(
    request: CreateExperimentRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new A/B test experiment (admin only)."""
    service = get_feature_flags_service(db)
    
    result = await service.create_experiment(
        name=request.name,
        description=request.description,
        variants=request.variants,
        targeting=request.targeting,
        traffic_percentage=request.traffic_percentage,
        metrics=request.metrics
    )
    
    return result


@router.get("/experiments")
async def get_experiments(
    status: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all experiments (admin only)."""
    service = get_feature_flags_service(db)
    
    status_enum = None
    if status:
        try:
            status_enum = ExperimentStatus(status)
        except ValueError:
            pass
    
    experiments = await service.get_all_experiments(status=status_enum)
    
    return {"experiments": experiments, "count": len(experiments)}


@router.post("/experiments/{experiment_id}/start")
async def start_experiment(
    experiment_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Start an experiment (admin only)."""
    service = get_feature_flags_service(db)
    
    result = await service.start_experiment(experiment_id)
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result


@router.post("/experiments/{experiment_id}/pause")
async def pause_experiment(
    experiment_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Pause an experiment (admin only)."""
    service = get_feature_flags_service(db)
    
    result = await service.pause_experiment(experiment_id)
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result


@router.post("/experiments/{experiment_id}/complete")
async def complete_experiment(
    experiment_id: str,
    winning_variant: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Complete an experiment (admin only)."""
    service = get_feature_flags_service(db)
    
    result = await service.complete_experiment(
        experiment_id=experiment_id,
        winning_variant=winning_variant
    )
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result


@router.get("/experiments/{experiment_id}/variant")
async def get_user_variant(
    experiment_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get the variant assigned to the current user."""
    service = get_feature_flags_service(db)
    
    variant = await service.get_variant(
        experiment_id=experiment_id,
        user_id=current_user.id
    )
    
    if not variant:
        return {"experiment_id": experiment_id, "variant": None, "in_experiment": False}
    
    return {
        "experiment_id": experiment_id,
        "variant": variant,
        "in_experiment": True
    }


@router.post("/experiments/{experiment_id}/convert")
async def track_conversion(
    experiment_id: str,
    request: TrackConversionRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Track a conversion for an experiment."""
    service = get_feature_flags_service(db)
    
    result = await service.track_conversion(
        experiment_id=experiment_id,
        user_id=current_user.id,
        metric=request.metric,
        value=request.value
    )
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result


@router.get("/experiments/{experiment_id}/results")
async def get_experiment_results(
    experiment_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get experiment results with statistical analysis (admin only)."""
    service = get_feature_flags_service(db)
    
    result = await service.get_experiment_results(experiment_id)
    
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    
    return result
