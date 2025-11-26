# @AI-HINT: KYC/Identity verification API endpoints
"""
Identity Verification API - REST endpoints for KYC verification workflow.

Endpoints for:
- Getting verification status
- Uploading documents
- Phone verification
- Admin document review
"""

from fastapi import APIRouter, Depends, HTTPException, Query, File, UploadFile, Form
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime
import logging

from app.db.session import get_db
from app.core.security import get_current_active_user
from app.models.user import User
from app.services.identity_verification import (
    IdentityVerificationService,
    get_verification_service,
    DocumentType,
    VerificationStatus,
    VerificationTier
)

logger = logging.getLogger(__name__)

router = APIRouter()


# ============================================================================
# Pydantic Schemas
# ============================================================================

class PhoneVerificationRequest(BaseModel):
    """Request to verify phone number."""
    phone_number: str = Field(..., min_length=10, max_length=20)

class PhoneVerifyCodeRequest(BaseModel):
    """Request to verify phone code."""
    phone_number: str
    verification_code: str = Field(..., min_length=6, max_length=6)

class DocumentReviewRequest(BaseModel):
    """Admin document review request."""
    approved: bool
    notes: Optional[str] = None
    rejection_reason: Optional[str] = None


# ============================================================================
# User Verification Endpoints
# ============================================================================

@router.get("/status")
async def get_verification_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get current verification status for the authenticated user.
    
    Returns tier level, completed checks, and next tier requirements.
    """
    try:
        service = get_verification_service(db)
        
        status = await service.get_verification_status(current_user.id)
        
        return status
        
    except Exception as e:
        logger.error(f"Get verification status error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get verification status")


@router.get("/documents")
async def get_my_documents(
    document_type: Optional[str] = Query(None, description="Filter by document type"),
    status: Optional[str] = Query(None, description="Filter by status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all verification documents for the current user."""
    try:
        service = get_verification_service(db)
        
        # Parse document type
        doc_type = None
        if document_type:
            try:
                doc_type = DocumentType(document_type)
            except ValueError:
                raise HTTPException(status_code=400, detail=f"Invalid document type: {document_type}")
        
        # Parse status
        doc_status = None
        if status:
            try:
                doc_status = VerificationStatus(status)
            except ValueError:
                raise HTTPException(status_code=400, detail=f"Invalid status: {status}")
        
        documents = await service.get_documents(
            user_id=current_user.id,
            document_type=doc_type,
            status=doc_status
        )
        
        return {
            "documents": documents,
            "total": len(documents)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get documents error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get documents")


@router.post("/upload-document")
async def upload_verification_document(
    document_type: str = Form(..., description="Type of document"),
    file: UploadFile = File(..., description="Document file"),
    country: Optional[str] = Form(None),
    issue_date: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Upload a verification document (ID, passport, etc.).
    
    Supported types: passport, national_id, drivers_license, 
    utility_bill, bank_statement
    """
    try:
        # Validate document type
        try:
            doc_type = DocumentType(document_type)
        except ValueError:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid document type. Supported: {[t.value for t in DocumentType if t != DocumentType.SELFIE]}"
            )
        
        # Don't allow selfie through this endpoint
        if doc_type == DocumentType.SELFIE:
            raise HTTPException(
                status_code=400,
                detail="Use /upload-selfie endpoint for selfie verification"
            )
        
        # Read file
        file_data = await file.read()
        if not file_data:
            raise HTTPException(status_code=400, detail="Empty file")
        
        # Build metadata
        metadata = {}
        if country:
            metadata["country"] = country
        if issue_date:
            metadata["issue_date"] = issue_date
        
        service = get_verification_service(db)
        
        result = await service.upload_document(
            user_id=current_user.id,
            document_type=doc_type,
            file_data=file_data,
            filename=file.filename or "document",
            metadata=metadata
        )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload document error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to upload document")


@router.post("/upload-selfie")
async def upload_selfie_for_verification(
    file: UploadFile = File(..., description="Selfie image"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Upload selfie for face verification.
    
    The selfie will be compared against your ID document photo.
    Requires an approved ID document first.
    """
    try:
        # Read file
        file_data = await file.read()
        if not file_data:
            raise HTTPException(status_code=400, detail="Empty file")
        
        service = get_verification_service(db)
        
        # Check if user has an approved ID document
        documents = await service.get_documents(
            user_id=current_user.id,
            status=VerificationStatus.APPROVED
        )
        
        has_id = any(
            d["type"] in [DocumentType.PASSPORT.value, DocumentType.NATIONAL_ID.value, 
                         DocumentType.DRIVERS_LICENSE.value]
            for d in documents
        )
        
        if not has_id:
            raise HTTPException(
                status_code=400,
                detail="Please upload and get an ID document approved before selfie verification"
            )
        
        result = await service.upload_selfie(
            user_id=current_user.id,
            file_data=file_data,
            filename=file.filename or "selfie.jpg"
        )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload selfie error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to upload selfie")


# ============================================================================
# Phone Verification Endpoints
# ============================================================================

@router.post("/phone/send-code")
async def send_phone_verification_code(
    request: PhoneVerificationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Send verification code to phone number via SMS.
    
    Code is valid for 10 minutes.
    """
    try:
        service = get_verification_service(db)
        
        result = await service.send_phone_verification(
            user_id=current_user.id,
            phone_number=request.phone_number
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Send phone code error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to send verification code")


@router.post("/phone/verify")
async def verify_phone_code(
    request: PhoneVerifyCodeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Verify phone number with SMS code."""
    try:
        service = get_verification_service(db)
        
        result = await service.verify_phone(
            user_id=current_user.id,
            phone_number=request.phone_number,
            verification_code=request.verification_code
        )
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result.get("error", "Verification failed"))
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Verify phone error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to verify phone")


# ============================================================================
# Tier Information Endpoints
# ============================================================================

@router.get("/tiers")
async def get_verification_tiers():
    """
    Get information about all verification tiers.
    
    Returns requirements and benefits for each tier.
    """
    tiers = []
    
    for tier in VerificationTier:
        tier_info = {
            "tier": tier.value,
            "display_name": tier.value.replace("_", " ").title(),
            "requirements": IdentityVerificationService.TIER_REQUIREMENTS.get(tier, {}),
            "benefits": {
                VerificationTier.UNVERIFIED: {
                    "max_project_value": "$100",
                    "withdrawal_limit": "None",
                    "features": ["Browse projects", "View freelancers"]
                },
                VerificationTier.BASIC: {
                    "max_project_value": "$500",
                    "withdrawal_limit": "$100/day",
                    "features": ["Submit proposals", "Send messages", "Basic support"]
                },
                VerificationTier.STANDARD: {
                    "max_project_value": "$5,000",
                    "withdrawal_limit": "$1,000/day",
                    "features": ["Verified badge", "All Basic features", "Priority in search"]
                },
                VerificationTier.ENHANCED: {
                    "max_project_value": "$25,000",
                    "withdrawal_limit": "$5,000/day",
                    "features": ["All Standard features", "Priority support", "Featured placements"]
                },
                VerificationTier.PREMIUM: {
                    "max_project_value": "Unlimited",
                    "withdrawal_limit": "Unlimited",
                    "features": ["All Enhanced features", "Premium badge", "VIP support", "Profile highlight"]
                }
            }.get(tier, {})
        }
        tiers.append(tier_info)
    
    return {"tiers": tiers}


@router.get("/supported-documents")
async def get_supported_documents():
    """Get list of supported document types with requirements."""
    documents = []
    
    for doc_type in DocumentType:
        requirements = IdentityVerificationService.DOCUMENT_REQUIREMENTS.get(doc_type, {})
        documents.append({
            "type": doc_type.value,
            "display_name": doc_type.value.replace("_", " ").title(),
            "required_fields": requirements.get("required_fields", []),
            "max_age_days": requirements.get("max_age_days"),
            "accepted_formats": ["jpg", "jpeg", "png", "pdf"],
            "max_file_size": "10MB"
        })
    
    return {"documents": documents}


# ============================================================================
# Admin Endpoints
# ============================================================================

@router.get("/admin/pending-reviews")
async def get_pending_document_reviews(
    document_type: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get documents pending admin review.
    
    Admin only endpoint.
    """
    # Check admin role
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        service = get_verification_service(db)
        
        doc_type = None
        if document_type:
            try:
                doc_type = DocumentType(document_type)
            except ValueError:
                raise HTTPException(status_code=400, detail=f"Invalid document type: {document_type}")
        
        pending = await service.get_pending_reviews(
            limit=limit,
            document_type=doc_type
        )
        
        return {
            "pending_reviews": pending,
            "total": len(pending)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get pending reviews error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get pending reviews")


@router.post("/admin/review/{document_id}")
async def review_document(
    document_id: str,
    request: DocumentReviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Review and approve/reject a verification document.
    
    Admin only endpoint.
    """
    # Check admin role
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        service = get_verification_service(db)
        
        result = await service.admin_review_document(
            document_id=document_id,
            admin_id=current_user.id,
            approved=request.approved,
            notes=request.notes,
            rejection_reason=request.rejection_reason
        )
        
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Review document error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to review document")


@router.get("/admin/user/{user_id}")
async def get_user_verification_admin(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get verification status for any user.
    
    Admin only endpoint.
    """
    # Check admin role
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        service = get_verification_service(db)
        
        status = await service.get_verification_status(user_id)
        documents = await service.get_documents(user_id)
        
        return {
            "verification": status,
            "documents": documents
        }
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Get user verification error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get user verification")
