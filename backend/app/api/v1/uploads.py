"""
@AI-HINT: File upload API endpoints - Turso HTTP only
Handles uploading of user files (avatars, portfolio images, documents)
"""
from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, status
from app.db.turso_http import execute_query, to_str
from app.core.security import get_current_user
from app.core.rate_limiter import api_rate_limit
import os
import uuid
from pathlib import Path
from datetime import datetime

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


def save_uploaded_file(file: UploadFile, directory: Path) -> str:
    """Save uploaded file and return file path"""
    # Generate unique filename
    file_extension = Path(file.filename).suffix if file.filename else ""
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
    current_user: dict = Depends(get_current_user)
):
    """
    Upload user avatar image.
    
    - **file**: Image file (JPEG, PNG, WebP, GIF)
    - **max_size**: 5MB
    
    Returns the URL of the uploaded avatar.
    """
    validate_file(file, ALLOWED_IMAGE_TYPES, MAX_AVATAR_SIZE)
    
    # Get current avatar
    result = execute_query(
        "SELECT profile_image_url FROM users WHERE id = ?",
        [current_user['id']]
    )
    
    old_avatar = None
    if result and result.get("rows"):
        old_avatar = to_str(result["rows"][0][0])
    
    # Delete old avatar if exists
    if old_avatar:
        old_path = UPLOAD_DIR / old_avatar
        if old_path.exists():
            old_path.unlink()
    
    # Save new avatar
    relative_path = save_uploaded_file(file, AVATAR_DIR)
    
    # Update user profile
    execute_query(
        "UPDATE users SET profile_image_url = ?, updated_at = ? WHERE id = ?",
        [relative_path, datetime.utcnow().isoformat(), current_user['id']]
    )
    
    return {
        "url": f"/uploads/{relative_path}",
        "message": "Avatar uploaded successfully"
    }


@router.post("/portfolio", status_code=status.HTTP_201_CREATED)
@api_rate_limit
async def upload_portfolio_image(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Upload portfolio image.
    
    - **file**: Image file (JPEG, PNG, WebP, GIF)
    - **max_size**: 10MB
    
    Returns the URL of the uploaded image.
    """
    validate_file(file, ALLOWED_IMAGE_TYPES, MAX_PORTFOLIO_SIZE)
    
    # Save portfolio image
    relative_path = save_uploaded_file(file, PORTFOLIO_DIR)
    
    return {
        "url": f"/uploads/{relative_path}",
        "message": "Portfolio image uploaded successfully"
    }


@router.post("/document", status_code=status.HTTP_201_CREATED)
@api_rate_limit
async def upload_document(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Upload document (PDF, DOCX, TXT).
    
    - **file**: Document file
    - **max_size**: 10MB
    
    Returns the URL of the uploaded document.
    """
    validate_file(file, ALLOWED_DOCUMENT_TYPES, MAX_DOCUMENT_SIZE)
    
    # Save document
    relative_path = save_uploaded_file(file, DOCUMENT_DIR)
    
    return {
        "url": f"/uploads/{relative_path}",
        "filename": file.filename,
        "message": "Document uploaded successfully"
    }


@router.delete("/file")
@api_rate_limit
async def delete_uploaded_file(
    file_path: str,
    current_user: dict = Depends(get_current_user)
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
    
    # Get user's current profile image
    result = execute_query(
        "SELECT profile_image_url FROM users WHERE id = ?",
        [current_user['id']]
    )
    
    user_image = None
    if result and result.get("rows"):
        user_image = to_str(result["rows"][0][0])
    
    # Security check: ensure file belongs to current user
    if user_image == file_path:
        # Clear the profile image reference
        execute_query(
            "UPDATE users SET profile_image_url = NULL, updated_at = ? WHERE id = ?",
            [datetime.utcnow().isoformat(), current_user['id']]
        )
    
    # Delete file
    full_path.unlink()
    
    return {"message": "File deleted successfully"}
