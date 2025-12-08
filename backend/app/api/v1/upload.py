"""
@AI-HINT: File upload endpoints using local file storage - Turso HTTP only
Supports profile images, portfolio images, proposal attachments, and project files.
Can be easily upgraded to cloud storage (S3/R2/Cloudflare) later.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, status
import uuid
import os

from app.core.security import get_current_active_user
from app.core.storage import save_file, delete_file, get_file_url
from app.db.turso_http import execute_query, to_str
from datetime import datetime

router = APIRouter()

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
    current_user = Depends(get_current_active_user)
):
    """
    Upload user profile image
    Replaces existing profile image if present
    """
    validate_file(file, ALLOWED_IMAGE_EXTENSIONS)
    
    # Generate unique filename
    filename: str = file.filename or ""
    ext = os.path.splitext(filename)[1]
    file_path = f"profile-images/{current_user['id']}/{uuid.uuid4()}{ext}"
    
    # Save to local storage
    file_content = await file.read()
    saved_path = save_file(file_content, file_path)
    file_url = get_file_url(saved_path)
    
    # Get current profile image
    result = execute_query(
        "SELECT profile_image FROM users WHERE id = ?",
        [current_user['id']]
    )
    
    old_image = None
    if result and result.get("rows"):
        old_image = to_str(result["rows"][0][0])
    
    # Delete old profile image if exists
    if old_image:
        try:
            delete_file(old_image)
            print(f"[UPLOAD] Deleted old profile image: {old_image}")
        except Exception as e:
            print(f"[WARNING] Failed to delete old profile image: {str(e)}")
    
    # Update user.profile_image in database
    execute_query(
        "UPDATE users SET profile_image = ?, updated_at = ? WHERE id = ?",
        [saved_path, datetime.utcnow().isoformat(), current_user['id']]
    )
    print(f"[UPLOAD] Updated profile image for user {current_user['id']}")
    
    return {
        "message": "Profile image uploaded successfully",
        "url": file_url,
        "filename": file.filename,
        "file_path": saved_path
    }


@router.post("/portfolio-image", response_model=dict, status_code=status.HTTP_201_CREATED)
async def upload_portfolio_image(
    file: UploadFile = File(..., description="Portfolio image file"),
    portfolio_item_id: Optional[str] = Form(None),
    current_user = Depends(get_current_active_user)
):
    """
    Upload portfolio item image
    Freelancers only
    """
    user_type = current_user.get("user_type", "").lower()
    if user_type != "freelancer":
        raise HTTPException(status_code=403, detail="Only freelancers can upload portfolio images")
    
    validate_file(file, ALLOWED_IMAGE_EXTENSIONS)
    
    # Generate unique filename
    filename: str = file.filename or ""
    ext = os.path.splitext(filename)[1]
    portfolio_path = f"portfolio/{current_user['id']}"
    if portfolio_item_id:
        portfolio_path += f"/{portfolio_item_id}"
    file_path = f"{portfolio_path}/{uuid.uuid4()}{ext}"
    
    # Save to local storage
    file_content = await file.read()
    saved_path = save_file(file_content, file_path)
    file_url = get_file_url(saved_path)
    
    return {
        "message": "Portfolio image uploaded successfully",
        "url": file_url,
        "filename": file.filename,
        "file_path": saved_path
    }


@router.post("/proposal-attachment", response_model=dict, status_code=status.HTTP_201_CREATED)
async def upload_proposal_attachment(
    file: UploadFile = File(..., description="Proposal attachment"),
    proposal_id: str = Form(..., description="Proposal ID"),
    current_user = Depends(get_current_active_user)
):
    """
    Upload proposal attachment (PDF, documents)
    Freelancers only
    """
    user_type = current_user.get("user_type", "").lower()
    if user_type != "freelancer":
        raise HTTPException(status_code=403, detail="Only freelancers can upload proposal attachments")
    
    validate_file(file, ALLOWED_DOCUMENT_EXTENSIONS)
    
    # Generate unique filename
    filename: str = file.filename or ""
    ext = os.path.splitext(filename)[1]
    file_path = f"proposals/{proposal_id}/attachments/{uuid.uuid4()}{ext}"
    
    # Save to local storage
    file_content = await file.read()
    saved_path = save_file(file_content, file_path)
    file_url = get_file_url(saved_path)
    
    # Check proposal exists and belongs to user
    import json
    
    proposal_result = execute_query(
        "SELECT id, freelancer_id, attachments FROM proposals WHERE id = ?",
        [int(proposal_id)]
    )
    
    if proposal_result and proposal_result.get("rows"):
        row = proposal_result["rows"][0]
        freelancer_id = row[1].get("value") if row[1].get("type") != "null" else None
        
        if freelancer_id != current_user['id']:
            raise HTTPException(status_code=403, detail="Not authorized to upload attachments to this proposal")
        
        # Parse existing attachments or initialize empty list
        attachments_str = to_str(row[2])
        attachments = json.loads(attachments_str) if attachments_str else []
        attachments.append({
            "filename": file.filename,
            "url": file_url,
            "file_path": saved_path,
            "uploaded_at": datetime.utcnow().isoformat()
        })
        
        execute_query(
            "UPDATE proposals SET attachments = ? WHERE id = ?",
            [json.dumps(attachments), int(proposal_id)]
        )
        print(f"[UPLOAD] Added attachment to proposal {proposal_id}")
    else:
        print(f"[WARNING] Proposal {proposal_id} not found, attachment saved but not linked")
    
    return {
        "message": "Proposal attachment uploaded successfully",
        "url": file_url,
        "filename": file.filename,
        "file_path": saved_path
    }


@router.post("/project-file", response_model=dict, status_code=status.HTTP_201_CREATED)
async def upload_project_file(
    file: UploadFile = File(..., description="Project file"),
    project_id: str = Form(..., description="Project ID"),
    current_user = Depends(get_current_active_user)
):
    """
    Upload project-related files
    Both clients and freelancers can upload to projects they're involved in
    """
    validate_file(file, ALLOWED_EXTENSIONS)
    
    # Verify user is part of the project
    project_result = execute_query(
        "SELECT id, client_id FROM projects WHERE id = ?",
        [int(project_id)]
    )
    
    if not project_result or not project_result.get("rows"):
        raise HTTPException(status_code=404, detail="Project not found")
    
    project_row = project_result["rows"][0]
    client_id = project_row[1].get("value") if project_row[1].get("type") != "null" else None
    
    is_client = client_id == current_user['id']
    
    # Check if accepted freelancer
    proposal_result = execute_query(
        "SELECT id FROM proposals WHERE project_id = ? AND freelancer_id = ? AND status = 'accepted'",
        [int(project_id), current_user['id']]
    )
    is_accepted_freelancer = bool(proposal_result and proposal_result.get("rows"))
    
    user_type = current_user.get("user_type", "").lower()
    is_admin = user_type == "admin"
    
    if not is_client and not is_accepted_freelancer and not is_admin:
        raise HTTPException(status_code=403, detail="Not authorized to upload files to this project")
    
    # Generate unique filename
    filename: str = file.filename or ""
    ext = os.path.splitext(filename)[1]
    file_path = f"projects/{project_id}/files/{current_user['id']}/{uuid.uuid4()}{ext}"
    
    # Save to local storage
    file_content = await file.read()
    saved_path = save_file(file_content, file_path)
    file_url = get_file_url(saved_path)
    
    return {
        "message": "Project file uploaded successfully",
        "url": file_url,
        "filename": file.filename,
        "file_path": saved_path
    }


@router.post("/batch", response_model=dict, status_code=status.HTTP_201_CREATED)
async def upload_multiple_files(
    files: List[UploadFile] = File(..., description="Multiple files"),
    file_type: str = Form(..., description="Type: profile, portfolio, proposal, project"),
    reference_id: Optional[str] = Form(None, description="Related entity ID"),
    current_user = Depends(get_current_active_user)
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
        file_path = f"{file_type}/{current_user['id']}"
        if reference_id:
            file_path += f"/{reference_id}"
        file_path += f"/{uuid.uuid4()}{ext}"

        file_content = await file.read()
        saved_path = save_file(file_content, file_path)
        file_url = get_file_url(saved_path)

        uploaded_files.append({
            "filename": filename,
            "url": file_url,
            "file_path": saved_path
        })
    
    return {
        "message": f"Uploaded {len(uploaded_files)} files successfully",
        "files": uploaded_files
    }


@router.delete("/file", response_model=dict)
async def delete_uploaded_file(
    file_path: str = Query(..., description="File path to delete"),
    current_user = Depends(get_current_active_user)
):
    """
    Delete a file from local storage
    Users can only delete their own files
    """
    user_type = current_user.get("user_type", "").lower()
    is_admin = user_type == "admin"
    
    # Verify the file belongs to the current user
    if f"/{current_user['id']}/" not in file_path and not is_admin:
        raise HTTPException(status_code=403, detail="Not authorized to delete this file")
    
    success = delete_file(file_path)
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete file")
    
    return {
        "message": "File deleted successfully",
        "file_path": file_path
    }


@router.get("/file-url", response_model=dict)
async def get_file_access_url(
    file_path: str = Query(..., description="File path"),
    current_user = Depends(get_current_active_user)
):
    """
    Get file URL for secure file access
    """
    file_url = get_file_url(file_path)
    
    if not file_url:
        raise HTTPException(status_code=404, detail="File not found or failed to generate URL")
    
    return {
        "url": file_url,
        "file_path": file_path
    }
