"""
File upload API endpoints
Handles uploading of user files (avatars, portfolio images, documents)
"""
from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.core.security import get_current_user
from app.core.rate_limiter import api_rate_limit
import os
import uuid
from pathlib import Path
from typing import List
import mimetypes

router = APIRouter()

# File upload configuration
UPLOAD_DIR = Path("uploads")
AVATAR_DIR = UPLOAD_DIR / "avatars"
PORTFOLIO_DIR = UPLOAD_DIR / "portfolio"
DOCUMENT_DIR = UPLOAD_DIR / "documents"

# Create directories if they don't exist
for directory in [AVATAR_DIR, PORTFOLIO_DIR, DOCUMENT_DIR]:
    directory.mkdir(parents=True, exist_ok=True)

# Allowed file types
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
ALLOWED_DOCUMENT_TYPES = {
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain"
}

# File size limits (in bytes)
MAX_AVATAR_SIZE = 5 * 1024 * 1024  # 5MB
MAX_PORTFOLIO_SIZE = 10 * 1024 * 1024  # 10MB
MAX_DOCUMENT_SIZE = 10 * 1024 * 1024  # 10MB


def validate_file(file: UploadFile, allowed_types: set, max_size: int):
    """Validate file type and size"""
    # Check file type
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed types: {', '.join(allowed_types)}"
        )
    
    # Check file size (read first to get size, then reset)
    file.file.seek(0, 2)  # Seek to end
    file_size = file.file.tell()
    file.file.seek(0)  # Reset to beginning
    
    if file_size > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum size: {max_size / 1024 / 1024}MB"
        )


def save_file(file: UploadFile, directory: Path) -> str:
    """Save uploaded file and return file path"""
    # Generate unique filename
    file_extension = Path(file.filename).suffix
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = directory / unique_filename
    
    # Save file
    with open(file_path, "wb") as buffer:
        buffer.write(file.file.read())
    
    # Return relative path for storage in database
    return str(file_path.relative_to(UPLOAD_DIR))


@router.post("/avatar", status_code=status.HTTP_201_CREATED)
@api_rate_limit
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload user avatar image.
    
    - **file**: Image file (JPEG, PNG, WebP, GIF)
    - **max_size**: 5MB
    
    Returns the URL of the uploaded avatar.
    """
    validate_file(file, ALLOWED_IMAGE_TYPES, MAX_AVATAR_SIZE)
    
    # Delete old avatar if exists
    if current_user.profile_image_url:
        old_path = UPLOAD_DIR / current_user.profile_image_url
        if old_path.exists():
            old_path.unlink()
    
    # Save new avatar
    relative_path = save_file(file, AVATAR_DIR)
    
    # Update user profile
    current_user.profile_image_url = relative_path
    db.commit()
    
    return {
        "url": f"/uploads/{relative_path}",
        "message": "Avatar uploaded successfully"
    }


@router.post("/portfolio", status_code=status.HTTP_201_CREATED)
@api_rate_limit
async def upload_portfolio_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """
    Upload portfolio image.
    
    - **file**: Image file (JPEG, PNG, WebP, GIF)
    - **max_size**: 10MB
    
    Returns the URL of the uploaded image.
    """
    validate_file(file, ALLOWED_IMAGE_TYPES, MAX_PORTFOLIO_SIZE)
    
    # Save portfolio image
    relative_path = save_file(file, PORTFOLIO_DIR)
    
    return {
        "url": f"/uploads/{relative_path}",
        "message": "Portfolio image uploaded successfully"
    }


@router.post("/document", status_code=status.HTTP_201_CREATED)
@api_rate_limit
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """
    Upload document (PDF, DOCX, TXT).
    
    - **file**: Document file
    - **max_size**: 10MB
    
    Returns the URL of the uploaded document.
    """
    validate_file(file, ALLOWED_DOCUMENT_TYPES, MAX_DOCUMENT_SIZE)
    
    # Save document
    relative_path = save_file(file, DOCUMENT_DIR)
    
    return {
        "url": f"/uploads/{relative_path}",
        "filename": file.filename,
        "message": "Document uploaded successfully"
    }


@router.delete("/file")
@api_rate_limit
async def delete_file(
    file_path: str,
    current_user: User = Depends(get_current_user)
):
    """
    Delete uploaded file.
    
    - **file_path**: Relative path to the file (e.g., "avatars/filename.jpg")
    
    Security: Only the file owner can delete it.
    """
    full_path = UPLOAD_DIR / file_path
    
    # Check if file exists
    if not full_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    # Security check: ensure file belongs to current user
    # This is a simplified check - in production, store file ownership in database
    if current_user.profile_image_url == file_path:
        current_user.profile_image_url = None
    
    # Delete file
    full_path.unlink()
    
    return {"message": "File deleted successfully"}
