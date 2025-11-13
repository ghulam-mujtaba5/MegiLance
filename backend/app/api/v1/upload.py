"""
@AI-HINT: File upload endpoints using Oracle Cloud Infrastructure (OCI) Object Storage.
Supports profile images, portfolio images, proposal attachments, and project files.
Compatible with OCI Always Free tier (10GB storage).
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, status
from sqlalchemy.orm import Session
import uuid
import os
from io import BytesIO

from app.core.security import get_current_active_user
from app.core.oci_storage import OCIStorageClient
from app.core.config import get_settings
from app.db.session import get_db
from app.models.user import User

router = APIRouter()

# Initialize OCI Storage client
oci_storage_client = OCIStorageClient()

# Allowed file extensions
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
ALLOWED_DOCUMENT_EXTENSIONS = {".pdf", ".doc", ".docx", ".txt", ".md"}
ALLOWED_EXTENSIONS = ALLOWED_IMAGE_EXTENSIONS | ALLOWED_DOCUMENT_EXTENSIONS

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


def validate_file(file: UploadFile, allowed_extensions: set) -> None:
    """Validate file extension and size"""
    # Ensure filename is a string for type checkers, then check extension
    filename: str = file.filename or ""
    ext = os.path.splitext(filename)[1].lower()
    if not filename or ext == "":
        raise HTTPException(status_code=400, detail="Invalid file or missing filename")

    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"File type not allowed. Allowed types: {', '.join(allowed_extensions)}"
        )
    
    # Check file size (if available)
    if hasattr(file, 'size') and file.size and file.size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size: {MAX_FILE_SIZE / 1024 / 1024}MB"
        )


@router.post("/profile-image", response_model=dict, status_code=status.HTTP_201_CREATED)
async def upload_profile_image(
    file: UploadFile = File(..., description="Profile image file"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Upload user profile image
    Replaces existing profile image if present
    """
    validate_file(file, ALLOWED_IMAGE_EXTENSIONS)
    
    # Generate unique filename
    filename: str = file.filename or ""
    ext = os.path.splitext(filename)[1]
    object_key = f"profile-images/{current_user.id}/{uuid.uuid4()}{ext}"
    
    # Upload to OCI Object Storage
    file_content = await file.read()
    file_obj = BytesIO(file_content)
    settings = get_settings()
    bucket_name = settings.oci_bucket_assets or "megilance-assets"
    object_url = oci_storage_client.upload_file(
        file_obj=file_obj,
        bucket_name=bucket_name,
        object_name=object_key
    )
    
    # TODO: Delete old profile image from OCI if exists
    # TODO: Update user.profile_image in database
    
    return {
        "message": "Profile image uploaded successfully",
        "url": object_url,
        "filename": file.filename,
        "object_key": object_key
    }


@router.post("/portfolio-image", response_model=dict, status_code=status.HTTP_201_CREATED)
async def upload_portfolio_image(
    file: UploadFile = File(..., description="Portfolio image file"),
    portfolio_item_id: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Upload portfolio item image
    Freelancers only
    """
    if not current_user.user_type or current_user.user_type.lower() != "freelancer":
        raise HTTPException(status_code=403, detail="Only freelancers can upload portfolio images")
    
    validate_file(file, ALLOWED_IMAGE_EXTENSIONS)
    
    # Generate unique filename
    filename: str = file.filename or ""
    ext = os.path.splitext(filename)[1]
    portfolio_path = f"portfolio/{current_user.id}"
    if portfolio_item_id:
        portfolio_path += f"/{portfolio_item_id}"
    object_key = f"{portfolio_path}/{uuid.uuid4()}{ext}"
    
    # Upload to OCI Object Storage
    file_content = await file.read()
    file_obj = BytesIO(file_content)
    settings = get_settings()
    bucket_name = settings.oci_bucket_assets or "megilance-assets"
    object_url = oci_storage_client.upload_file(
        file_obj=file_obj,
        bucket_name=bucket_name,
        object_name=object_key
    )
    
    return {
        "message": "Portfolio image uploaded successfully",
        "url": object_url,
        "filename": file.filename,
        "object_key": object_key
    }


@router.post("/proposal-attachment", response_model=dict, status_code=status.HTTP_201_CREATED)
async def upload_proposal_attachment(
    file: UploadFile = File(..., description="Proposal attachment"),
    proposal_id: str = Form(..., description="Proposal ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Upload proposal attachment (PDF, documents)
    Freelancers only
    """
    if not current_user.user_type or current_user.user_type.lower() != "freelancer":
        raise HTTPException(status_code=403, detail="Only freelancers can upload proposal attachments")
    
    validate_file(file, ALLOWED_DOCUMENT_EXTENSIONS)
    
    # Generate unique filename
    filename: str = file.filename or ""
    ext = os.path.splitext(filename)[1]
    object_key = f"proposals/{proposal_id}/attachments/{uuid.uuid4()}{ext}"
    
    # Upload to OCI Object Storage
    file_content = await file.read()
    file_obj = BytesIO(file_content)
    settings = get_settings()
    bucket_name = settings.oci_bucket_uploads or "megilance-uploads"
    object_url = oci_storage_client.upload_file(
        file_obj=file_obj,
        bucket_name=bucket_name,
        object_name=object_key
    )
    
    # TODO: Add attachment to proposal.attachments JSON field
    
    return {
        "message": "Proposal attachment uploaded successfully",
        "url": object_url,
        "filename": file.filename,
        "object_key": object_key
    }


@router.post("/project-file", response_model=dict, status_code=status.HTTP_201_CREATED)
async def upload_project_file(
    file: UploadFile = File(..., description="Project file"),
    project_id: str = Form(..., description="Project ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Upload project-related files
    Both clients and freelancers can upload to projects they're involved in
    """
    validate_file(file, ALLOWED_EXTENSIONS)
    
    # TODO: Verify user is part of the project (client or accepted freelancer)
    
    # Generate unique filename
    filename: str = file.filename or ""
    ext = os.path.splitext(filename)[1]
    object_key = f"projects/{project_id}/files/{current_user.id}/{uuid.uuid4()}{ext}"
    
    # Upload to OCI Object Storage
    file_content = await file.read()
    file_obj = BytesIO(file_content)
    settings = get_settings()
    bucket_name = settings.oci_bucket_uploads or "megilance-uploads"
    object_url = oci_storage_client.upload_file(
        file_obj=file_obj,
        bucket_name=bucket_name,
        object_name=object_key
    )
    
    return {
        "message": "Project file uploaded successfully",
        "url": object_url,
        "filename": file.filename,
        "object_key": object_key
    }


@router.post("/batch", response_model=dict, status_code=status.HTTP_201_CREATED)
async def upload_multiple_files(
    files: List[UploadFile] = File(..., description="Multiple files"),
    file_type: str = Form(..., description="Type: profile, portfolio, proposal, project"),
    reference_id: Optional[str] = Form(None, description="Related entity ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Upload multiple files at once
    """
    if len(files) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 files per batch")
    
    # Determine allowed extensions based on file type
    if file_type in ["profile", "portfolio"]:
        allowed_exts = ALLOWED_IMAGE_EXTENSIONS
    else:
        allowed_exts = ALLOWED_EXTENSIONS
    
    uploaded_files = []
    
    for file in files:
        validate_file(file, allowed_exts)

        filename: str = file.filename or ""
        ext = os.path.splitext(filename)[1]
        object_key = f"{file_type}/{current_user.id}"
        if reference_id:
            object_key += f"/{reference_id}"
        object_key += f"/{uuid.uuid4()}{ext}"

        file_content = await file.read()
        file_obj = BytesIO(file_content)
        settings = get_settings()
        bucket_name = settings.oci_bucket_uploads or "megilance-uploads"
        object_url = oci_storage_client.upload_file(
            file_obj=file_obj,
            bucket_name=bucket_name,
            object_name=object_key
        )

        uploaded_files.append({
            "filename": filename,
            "url": object_url,
            "object_key": object_key
        })
    
    return {
        "message": f"Uploaded {len(uploaded_files)} files successfully",
        "files": uploaded_files
    }


@router.delete("/file", response_model=dict)
async def delete_file(
    object_key: str = Query(..., description="Object storage key"),
    bucket: str = Query("uploads", description="Bucket name: assets or uploads"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete a file from OCI Object Storage
    Users can only delete their own files
    """
    # Verify the file belongs to the current user
    if f"/{current_user.id}/" not in object_key and current_user.user_type != "Admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete this file")
    
    settings = get_settings()
    bucket_name = (settings.oci_bucket_assets if bucket == "assets" else settings.oci_bucket_uploads) or ("megilance-assets" if bucket == "assets" else "megilance-uploads")
    
    success = oci_storage_client.delete_file(bucket_name=bucket_name, object_name=object_key)
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete file")
    
    return {
        "message": "File deleted successfully",
        "object_key": object_key
    }


@router.get("/presigned-url", response_model=dict)
async def get_presigned_url(
    object_key: str = Query(..., description="Object storage key"),
    bucket: str = Query("uploads", description="Bucket name: assets or uploads"),
    expiration: int = Query(3600, description="URL expiration in seconds"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Generate pre-authenticated request URL for secure file download
    """
    settings = get_settings()
    bucket_name = (settings.oci_bucket_assets if bucket == "assets" else settings.oci_bucket_uploads) or ("megilance-assets" if bucket == "assets" else "megilance-uploads")
    
    presigned_url = oci_storage_client.generate_presigned_url(
        bucket_name=bucket_name,
        object_name=object_key,
        expiration=expiration
    )
    
    if not presigned_url:
        raise HTTPException(status_code=404, detail="File not found or failed to generate URL")
    
    return {
        "url": presigned_url,
        "expiration": expiration,
        "object_key": object_key
    }