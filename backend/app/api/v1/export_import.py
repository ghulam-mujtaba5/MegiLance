# @AI-HINT: Export/Import API endpoints for data portability
"""
Export/Import API - Data portability and backup endpoints.

Features:
- Full account data export
- Selective data export
- Data import from backup
- GDPR compliance tools
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime, timezone

from app.db.session import get_db
from app.core.security import get_current_active_user
from app.models.user import User
from app.services.export_import import ExportImportService, ExportFormat

router = APIRouter()


# Request/Response schemas
class ExportRequest(BaseModel):
    """Export request schema."""
    format: str = "json"  # json, csv
    include_profile: bool = True
    include_projects: bool = True
    include_proposals: bool = True
    include_messages: bool = True
    include_contracts: bool = True
    include_payments: bool = True
    include_reviews: bool = True
    include_files: bool = False  # Large, optional


class ImportRequest(BaseModel):
    """Import request schema."""
    data: dict
    merge_mode: str = "skip"  # skip, overwrite, merge


class DataDeletionRequest(BaseModel):
    """GDPR deletion request."""
    confirm: bool = False
    reason: Optional[str] = None


class ExportJobResponse(BaseModel):
    """Export job response."""
    job_id: str
    status: str
    format: str
    requested_at: datetime


# API Endpoints
@router.get("/formats")
async def get_export_formats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get available export formats."""
    return {
        "formats": [
            {
                "id": "json",
                "name": "JSON",
                "description": "Full structured data export",
                "supports_import": True
            },
            {
                "id": "csv",
                "name": "CSV",
                "description": "Spreadsheet-compatible format",
                "supports_import": False
            },
            {
                "id": "pdf",
                "name": "PDF",
                "description": "Human-readable report",
                "supports_import": False
            }
        ]
    }


@router.post("/export")
async def request_export(
    request: ExportRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Request full data export."""
    service = ExportImportService(db)
    
    try:
        export_format = ExportFormat(request.format)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid format. Supported: json, csv"
        )
    
    # Build data types list
    data_types = []
    if request.include_profile:
        data_types.append("profile")
    if request.include_projects:
        data_types.append("projects")
    if request.include_proposals:
        data_types.append("proposals")
    if request.include_messages:
        data_types.append("messages")
    if request.include_contracts:
        data_types.append("contracts")
    if request.include_payments:
        data_types.append("payments")
    if request.include_reviews:
        data_types.append("reviews")
    if request.include_files:
        data_types.append("files")
    
    job = await service.request_export(
        user_id=current_user.id,
        data_types=data_types,
        export_format=export_format
    )
    
    return job


@router.get("/export/status/{job_id}")
async def get_export_status(
    job_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Check export job status."""
    service = ExportImportService(db)
    
    status = await service.get_export_status(
        job_id=job_id,
        user_id=current_user.id
    )
    
    if not status:
        raise HTTPException(status_code=404, detail="Export job not found")
    
    return status


@router.get("/export/download/{job_id}")
async def download_export(
    job_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Download completed export."""
    service = ExportImportService(db)
    
    result = await service.download_export(
        job_id=job_id,
        user_id=current_user.id
    )
    
    if not result:
        raise HTTPException(
            status_code=404,
            detail="Export not found or not ready"
        )
    
    return result


@router.get("/export/history")
async def get_export_history(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get user's export history."""
    service = ExportImportService(db)
    
    history = await service.get_export_history(
        user_id=current_user.id,
        limit=limit
    )
    
    return {"exports": history}


@router.post("/import/validate")
async def validate_import(
    request: ImportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Validate import data before processing."""
    service = ExportImportService(db)
    
    validation = await service.validate_import_data(
        data=request.data,
        user_id=current_user.id
    )
    
    return validation


@router.post("/import")
async def import_data(
    request: ImportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Import data from backup."""
    service = ExportImportService(db)
    
    # First validate
    validation = await service.validate_import_data(
        data=request.data,
        user_id=current_user.id
    )
    
    if not validation.get("valid", False):
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Import validation failed",
                "errors": validation.get("errors", [])
            }
        )
    
    # Process import
    result = await service.import_data(
        user_id=current_user.id,
        data=request.data,
        merge_mode=request.merge_mode
    )
    
    return result


@router.post("/gdpr/request-deletion")
async def request_data_deletion(
    request: DataDeletionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Request account and data deletion (GDPR)."""
    if not request.confirm:
        raise HTTPException(
            status_code=400,
            detail="You must confirm deletion request"
        )
    
    service = ExportImportService(db)
    
    result = await service.request_deletion(
        user_id=current_user.id,
        reason=request.reason
    )
    
    return result


@router.get("/gdpr/my-data")
async def get_my_data_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get summary of all stored user data (GDPR)."""
    service = ExportImportService(db)
    
    summary = await service.get_data_summary(user_id=current_user.id)
    
    return summary


@router.post("/backup/schedule")
async def schedule_backup(
    frequency: str = "weekly",  # daily, weekly, monthly
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Schedule automatic backups."""
    valid_frequencies = ["daily", "weekly", "monthly"]
    if frequency not in valid_frequencies:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid frequency. Use: {valid_frequencies}"
        )
    
    service = ExportImportService(db)
    
    # Would implement backup scheduling
    return {
        "user_id": current_user.id,
        "frequency": frequency,
        "status": "scheduled",
        "next_backup": datetime.now(timezone.utc).isoformat()
    }


@router.delete("/backup/schedule")
async def cancel_backup_schedule(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Cancel scheduled backups."""
    return {
        "user_id": current_user.id,
        "status": "cancelled"
    }
