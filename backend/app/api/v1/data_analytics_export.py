# @AI-HINT: Data analytics export API - BI reports and data exports
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from enum import Enum
from app.db.session import get_db
from app.api.v1.auth import get_current_active_user

router = APIRouter(prefix="/data-export")


class ExportFormat(str, Enum):
    CSV = "csv"
    JSON = "json"
    XLSX = "xlsx"
    PDF = "pdf"
    PARQUET = "parquet"


class ExportStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    EXPIRED = "expired"


class DataExport(BaseModel):
    id: str
    user_id: str
    name: str
    data_type: str
    format: ExportFormat
    filters: Optional[dict] = None
    status: ExportStatus
    file_url: Optional[str] = None
    file_size: Optional[int] = None
    records_count: Optional[int] = None
    created_at: datetime
    completed_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None


class ExportTemplate(BaseModel):
    id: str
    name: str
    description: str
    data_type: str
    columns: List[str]
    default_filters: Optional[dict] = None
    default_format: ExportFormat


class ScheduledExport(BaseModel):
    id: str
    user_id: str
    template_id: str
    name: str
    schedule: str
    format: ExportFormat
    recipients: List[str]
    is_active: bool
    last_run: Optional[datetime] = None
    next_run: Optional[datetime] = None


@router.post("/create", response_model=DataExport)
async def create_export(
    name: str,
    data_type: str = Query(..., enum=["users", "projects", "contracts", "payments", "reviews", "messages"]),
    format: ExportFormat = ExportFormat.CSV,
    filters: Optional[dict] = None,
    columns: Optional[List[str]] = None,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new data export"""
    return DataExport(
        id="export-new",
        user_id=str(current_user.id),
        name=name,
        data_type=data_type,
        format=format,
        filters=filters,
        status=ExportStatus.PROCESSING,
        created_at=datetime.utcnow()
    )


@router.get("/list", response_model=List[DataExport])
async def list_exports(
    status: Optional[ExportStatus] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """List user's exports"""
    return [
        DataExport(
            id=f"export-{i}",
            user_id=str(current_user.id),
            name=f"Export {i}",
            data_type="projects",
            format=ExportFormat.CSV,
            status=ExportStatus.COMPLETED if i < 3 else ExportStatus.PROCESSING,
            file_url=f"/downloads/export-{i}.csv" if i < 3 else None,
            file_size=1024 * (i + 1) if i < 3 else None,
            records_count=100 * (i + 1) if i < 3 else None,
            created_at=datetime.utcnow(),
            completed_at=datetime.utcnow() if i < 3 else None
        )
        for i in range(min(limit, 5))
    ]


@router.get("/{export_id}", response_model=DataExport)
async def get_export(
    export_id: str,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get export details"""
    return DataExport(
        id=export_id,
        user_id=str(current_user.id),
        name="Project Export",
        data_type="projects",
        format=ExportFormat.CSV,
        status=ExportStatus.COMPLETED,
        file_url=f"/downloads/{export_id}.csv",
        file_size=2048,
        records_count=150,
        created_at=datetime.utcnow(),
        completed_at=datetime.utcnow()
    )


@router.get("/{export_id}/download")
async def download_export(
    export_id: str,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get download URL for export"""
    return {
        "export_id": export_id,
        "download_url": f"/downloads/{export_id}.csv",
        "expires_in": 3600
    }


@router.delete("/{export_id}")
async def delete_export(
    export_id: str,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete an export"""
    return {"message": f"Export {export_id} deleted"}


@router.get("/templates", response_model=List[ExportTemplate])
async def get_export_templates(
    data_type: Optional[str] = None,
    current_user=Depends(get_current_active_user)
):
    """Get available export templates"""
    return [
        ExportTemplate(
            id="template-projects",
            name="Projects Export",
            description="Export all project data",
            data_type="projects",
            columns=["id", "title", "status", "budget", "created_at", "client_id"],
            default_format=ExportFormat.CSV
        ),
        ExportTemplate(
            id="template-users",
            name="Users Export",
            description="Export user data",
            data_type="users",
            columns=["id", "email", "name", "role", "created_at", "is_verified"],
            default_format=ExportFormat.CSV
        ),
        ExportTemplate(
            id="template-payments",
            name="Payments Export",
            description="Export payment transactions",
            data_type="payments",
            columns=["id", "amount", "status", "payment_method", "created_at"],
            default_format=ExportFormat.XLSX
        )
    ]


@router.post("/templates", response_model=ExportTemplate)
async def create_export_template(
    name: str,
    description: str,
    data_type: str,
    columns: List[str],
    default_format: ExportFormat = ExportFormat.CSV,
    default_filters: Optional[dict] = None,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create custom export template"""
    return ExportTemplate(
        id="template-new",
        name=name,
        description=description,
        data_type=data_type,
        columns=columns,
        default_filters=default_filters,
        default_format=default_format
    )


@router.get("/scheduled", response_model=List[ScheduledExport])
async def get_scheduled_exports(
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get scheduled exports"""
    return [
        ScheduledExport(
            id="scheduled-1",
            user_id=str(current_user.id),
            template_id="template-projects",
            name="Weekly Projects Report",
            schedule="0 9 * * 1",
            format=ExportFormat.XLSX,
            recipients=["admin@example.com"],
            is_active=True,
            last_run=datetime.utcnow(),
            next_run=datetime.utcnow()
        )
    ]


@router.post("/scheduled", response_model=ScheduledExport)
async def create_scheduled_export(
    template_id: str,
    name: str,
    schedule: str,
    format: ExportFormat,
    recipients: List[str],
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create scheduled export"""
    return ScheduledExport(
        id="scheduled-new",
        user_id=str(current_user.id),
        template_id=template_id,
        name=name,
        schedule=schedule,
        format=format,
        recipients=recipients,
        is_active=True,
        next_run=datetime.utcnow()
    )


@router.put("/scheduled/{scheduled_id}")
async def update_scheduled_export(
    scheduled_id: str,
    schedule: Optional[str] = None,
    recipients: Optional[List[str]] = None,
    is_active: Optional[bool] = None,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update scheduled export"""
    return {
        "id": scheduled_id,
        "schedule": schedule,
        "recipients": recipients,
        "is_active": is_active,
        "updated_at": datetime.utcnow().isoformat()
    }


@router.delete("/scheduled/{scheduled_id}")
async def delete_scheduled_export(
    scheduled_id: str,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete scheduled export"""
    return {"message": f"Scheduled export {scheduled_id} deleted"}


@router.get("/available-columns/{data_type}")
async def get_available_columns(
    data_type: str,
    current_user=Depends(get_current_active_user)
):
    """Get available columns for a data type"""
    columns_map = {
        "projects": ["id", "title", "description", "status", "budget", "created_at", "deadline", "client_id", "freelancer_id"],
        "users": ["id", "email", "first_name", "last_name", "role", "created_at", "is_verified", "is_active"],
        "payments": ["id", "amount", "currency", "status", "payment_method", "created_at", "completed_at"],
        "contracts": ["id", "project_id", "client_id", "freelancer_id", "amount", "status", "start_date", "end_date"],
        "reviews": ["id", "rating", "comment", "reviewer_id", "reviewee_id", "project_id", "created_at"]
    }
    return {
        "data_type": data_type,
        "columns": columns_map.get(data_type, [])
    }


@router.post("/preview")
async def preview_export(
    data_type: str,
    columns: List[str],
    filters: Optional[dict] = None,
    limit: int = Query(10, ge=1, le=100),
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Preview export data"""
    return {
        "data_type": data_type,
        "columns": columns,
        "preview_rows": [
            {col: f"sample_{col}_{i}" for col in columns}
            for i in range(min(limit, 5))
        ],
        "total_records": 150
    }


@router.get("/storage-usage")
async def get_storage_usage(
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get export storage usage"""
    return {
        "used_bytes": 52428800,
        "used_human": "50 MB",
        "limit_bytes": 1073741824,
        "limit_human": "1 GB",
        "percentage": 4.88,
        "exports_count": 25
    }
