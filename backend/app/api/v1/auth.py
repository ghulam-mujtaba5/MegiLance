from typing import Any, Dict
import json

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.core.security import (
    authenticate_user,
    create_access_token,
    create_refresh_token,
    decode_token,
    get_current_active_user,
    get_password_hash,
    verify_password,
)
from app.core.rate_limit import (
    auth_rate_limit,
    password_reset_rate_limit,
    email_rate_limit,
    api_rate_limit,
)
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import AuthResponse, LoginRequest, RefreshTokenRequest, Token
from app.schemas.user import UserCreate, UserRead, UserUpdate
from app.schemas.two_factor import (
    TwoFactorSetupResponse,
    TwoFactorVerifyRequest,
    TwoFactorLoginRequest,
    TwoFactorStatusResponse,
    TwoFactorDisableRequest,
    TwoFactorRegenerateBackupCodesResponse,
)
from app.schemas.email_verification import (
    EmailVerificationRequest,
    EmailVerificationResponse,
    ResendVerificationResponse,
)
from app.schemas.password_reset import (
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    ResetPasswordRequest,
    ResetPasswordResponse,
    ValidateResetTokenRequest,
    ValidateResetTokenResponse,
)
from app.services.two_factor_service import two_factor_service
from app.services.email_verification_service import email_verification_service
from app.services.password_reset_service import password_reset_service
from app.services.email_service import email_service
from app.core.config import get_settings


router = APIRouter()


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
@auth_rate_limit()
def register_user(request: Request, payload: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user and send email verification
    
    Creates a new user account and sends verification email.
    User must verify email before accessing certain features.
    """
    exists = db.query(User).filter(User.email == payload.email).first()
    if exists:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    hashed_password = get_password_hash(payload.password)
    user = User(
        email=payload.email,
        hashed_password=hashed_password,
        is_active=payload.is_active,
        name=payload.name,
        user_type=payload.user_type,
        bio=payload.bio,
        skills=payload.skills,
        hourly_rate=payload.hourly_rate,
        profile_image_url=payload.profile_image_url,
        location=payload.location,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Generate verification token and send email
    verification_token = email_verification_service.create_verification_token(db, user)
    settings = get_settings()
    verification_url = f"{settings.FRONTEND_URL}/verify-email?token={verification_token}"
    
    try:
        email_service.send_verification_email(
            to_email=user.email,
            user_name=user.name or "User",
            verification_url=verification_url
        )
    except Exception as e:
        # Log error but don't fail registration
        print(f"Failed to send verification email: {e}")
    
    # Send welcome email
    try:
        email_service.send_welcome_email(
            to_email=user.email,
            user_name=user.name or "User"
        )
    except Exception as e:
        print(f"Failed to send welcome email: {e}")
    
    return user


@router.post("/login", response_model=AuthResponse)
@auth_rate_limit()
def login_user(request: Request, credentials: LoginRequest, db: Session = Depends(get_db)):
    """
    User login endpoint with 2FA support
    
    If user has 2FA enabled, returns requires_2fa=True and a temporary token.
    Client must then call POST /auth/2fa/verify with the temporary token and TOTP code.
    """
    user = authenticate_user(db, credentials.email, credentials.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")

    # Check if 2FA is enabled
    if user.two_factor_enabled:
        # Create temporary token for 2FA verification (short expiry - 5 minutes)
        temp_claims = {"user_id": user.id, "temp_2fa": True}
        temp_token = create_access_token(subject=user.email, custom_claims=temp_claims, expires_delta_minutes=5)
        
        return AuthResponse(
            access_token=temp_token,
            refresh_token="",  # No refresh token until 2FA verified
            user=UserRead.from_orm(user),
            requires_2fa=True,
            message="Two-factor authentication required. Please provide your TOTP code."
        )

    # No 2FA - proceed with normal login
    custom_claims: Dict[str, Any] = {"user_id": user.id, "role": user.user_type or ""}
    access_token = create_access_token(subject=user.email, custom_claims=custom_claims)
    refresh_token = create_refresh_token(subject=user.email, custom_claims=custom_claims)

    return AuthResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserRead.from_orm(user),
    )


@router.post("/refresh", response_model=Token)
def refresh_token(request: RefreshTokenRequest):
    try:
        payload = decode_token(request.refresh_token)
    except Exception:  # noqa: B902 - FastAPI converts to HTTPException below
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    if payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    subject = payload.get("sub")
    if not subject:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    custom_claims = {k: v for k, v in payload.items() if k not in {"exp", "sub", "type", "iat", "nbf"}}
    access_token = create_access_token(subject=subject, custom_claims=custom_claims)
    refresh_token = create_refresh_token(subject=subject, custom_claims=custom_claims)
    return Token(access_token=access_token, refresh_token=refresh_token)


@router.get("/me", response_model=UserRead)
def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user


@router.put("/me", response_model=UserRead)
def update_user_me(
    update_payload: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    update_data = update_payload.model_dump(exclude_unset=True, exclude_none=True)

    if "password" in update_data:
        update_data["hashed_password"] = get_password_hash(update_data.pop("password"))

    for key, value in update_data.items():
        if key == "email":
            existing = db.query(User).filter(User.email == value, User.id != current_user.id).first()
            if existing:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already in use")
        setattr(current_user, key, value)

    db.commit()
    db.refresh(current_user)
    return current_user


# ===== Two-Factor Authentication Endpoints =====

@router.post("/2fa/setup", response_model=TwoFactorSetupResponse)
def setup_2fa(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Initialize 2FA setup for the current user
    
    Returns QR code, secret, and backup codes.
    User must verify with a TOTP token to enable 2FA.
    """
    if current_user.two_factor_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Two-factor authentication is already enabled"
        )
    
    setup_data = two_factor_service.setup_2fa_for_user(db, current_user)
    
    return TwoFactorSetupResponse(
        secret=setup_data["secret"],
        qr_code=setup_data["qr_code"],
        backup_codes=setup_data["backup_codes"],
        provisioning_uri=setup_data["provisioning_uri"]
    )


@router.post("/2fa/enable", status_code=status.HTTP_200_OK)
def enable_2fa(
    request: TwoFactorVerifyRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Enable 2FA after setup by verifying a TOTP token
    
    User must have called /2fa/setup first and scanned the QR code.
    """
    if current_user.two_factor_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Two-factor authentication is already enabled"
        )
    
    if not current_user.two_factor_secret:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please initialize 2FA setup first by calling /auth/2fa/setup"
        )
    
    success = two_factor_service.enable_2fa(db, current_user, request.token)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code. Please try again."
        )
    
    return {"message": "Two-factor authentication enabled successfully"}


@router.post("/2fa/verify", response_model=AuthResponse)
def verify_2fa_login(
    request: TwoFactorLoginRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),  # Uses temp token from login
):
    """
    Complete login with 2FA verification
    
    After initial login returns requires_2fa=True, call this endpoint
    with the temporary token and TOTP code to get full access.
    """
    # Verify this is a temp 2FA token
    # (get_current_active_user already validates the token)
    
    if not current_user.two_factor_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Two-factor authentication is not enabled for this account"
        )
    
    # Verify the 2FA token
    success = two_factor_service.verify_2fa_login(
        current_user, 
        request.token, 
        db,
        is_backup_code=request.is_backup_code
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication code"
        )
    
    # 2FA verified - issue full access tokens
    custom_claims: Dict[str, Any] = {"user_id": current_user.id, "role": current_user.user_type or ""}
    access_token = create_access_token(subject=current_user.email, custom_claims=custom_claims)
    refresh_token = create_refresh_token(subject=current_user.email, custom_claims=custom_claims)
    
    return AuthResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserRead.from_orm(current_user),
        message="Login successful"
    )


@router.get("/2fa/status", response_model=TwoFactorStatusResponse)
def get_2fa_status(
    current_user: User = Depends(get_current_active_user),
):
    """Get current user's 2FA status"""
    backup_codes_count = 0
    if current_user.two_factor_backup_codes:
        try:
            codes = json.loads(current_user.two_factor_backup_codes)
            backup_codes_count = len(codes)
        except json.JSONDecodeError:
            pass
    
    return TwoFactorStatusResponse(
        enabled=current_user.two_factor_enabled,
        has_backup_codes=bool(current_user.two_factor_backup_codes),
        backup_codes_remaining=backup_codes_count if current_user.two_factor_enabled else None
    )


@router.post("/2fa/disable", status_code=status.HTTP_200_OK)
def disable_2fa(
    request: TwoFactorDisableRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Disable 2FA for current user (requires password confirmation)
    """
    if not current_user.two_factor_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Two-factor authentication is not enabled"
        )
    
    # Verify password
    if not verify_password(request.password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password"
        )
    
    two_factor_service.disable_2fa(db, current_user)
    
    return {"message": "Two-factor authentication disabled successfully"}


@router.post("/2fa/regenerate-backup-codes", response_model=TwoFactorRegenerateBackupCodesResponse)
def regenerate_backup_codes(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Regenerate backup codes (invalidates old codes)
    
    Use this if user has used all backup codes or lost them.
    """
    if not current_user.two_factor_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Two-factor authentication is not enabled"
        )
    
    # Generate new backup codes
    plain_codes, hashed_codes = two_factor_service.generate_backup_codes()
    
    # Store new hashed codes
    current_user.two_factor_backup_codes = json.dumps(hashed_codes)
    db.commit()
    
    return TwoFactorRegenerateBackupCodesResponse(
        backup_codes=plain_codes,
        message="Your old backup codes have been invalidated. Save these new codes in a secure location."
    )


# ===== Email Verification Endpoints =====

@router.post("/verify-email", response_model=EmailVerificationResponse)
def verify_email(
    request: EmailVerificationRequest,
    db: Session = Depends(get_db),
):
    """
    Verify user's email address using token from email
    
    This is a public endpoint - users can verify without being logged in.
    Token is sent to their email after registration.
    """
    user = email_verification_service.verify_email(db, request.token)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token"
        )
    
    return EmailVerificationResponse(
        message="Email verified successfully. You can now log in.",
        email_verified=True
    )


@router.post("/resend-verification", response_model=ResendVerificationResponse)
@email_rate_limit()
def resend_verification_email(
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Resend email verification link to current user
    
    User must be logged in but not yet verified.
    """
    if current_user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already verified"
        )
    
    # Generate new verification token
    verification_token = email_verification_service.resend_verification_email(db, current_user)
    settings = get_settings()
    verification_url = f"{settings.FRONTEND_URL}/verify-email?token={verification_token}"
    
    try:
        email_service.send_verification_email(
            to_email=current_user.email,
            user_name=current_user.name or "User",
            verification_url=verification_url
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send verification email. Please try again later."
        )
    
    return ResendVerificationResponse(
        message="Verification email sent successfully. Please check your inbox."
    )


# ===== Password Reset Endpoints =====

@router.post("/forgot-password", response_model=ForgotPasswordResponse)
@password_reset_rate_limit()
def forgot_password(
    request: Request,
    request_body: ForgotPasswordRequest,
    db: Session = Depends(get_db),
):
    """
    Initiate password reset flow
    
    Sends password reset email if account exists.
    Always returns success message (don't leak account existence).
    """
    user = db.query(User).filter(User.email == request_body.email).first()
    
    # Always return success (don't reveal if email exists)
    success_message = "If an account with that email exists, a password reset link has been sent."
    
    if user:
        # Generate reset token
        reset_token, expiry = password_reset_service.create_reset_token(db, user)
        settings = get_settings()
        reset_url = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"
        
        try:
            email_service.send_password_reset_email(
                to_email=user.email,
                user_name=user.name or "User",
                reset_url=reset_url
            )
        except Exception as e:
            # Log error but don't fail (don't reveal email existence)
            print(f"Failed to send password reset email: {e}")
    
    return ForgotPasswordResponse(message=success_message)


@router.post("/reset-password", response_model=ResetPasswordResponse)
@auth_rate_limit()
def reset_password(
    request: Request,
    request_body: ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    """
    Reset password using token from email
    
    Public endpoint - validates token and updates password.
    """
    user = password_reset_service.validate_reset_token(db, request_body.token)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    # Hash new password
    new_password_hash = get_password_hash(request_body.new_password)
    
    # Reset password
    password_reset_service.reset_password(db, user, new_password_hash)
    
    return ResetPasswordResponse(
        message="Password reset successfully. You can now log in with your new password."
    )


@router.post("/validate-reset-token", response_model=ValidateResetTokenResponse)
def validate_reset_token(
    request: ValidateResetTokenRequest,
    db: Session = Depends(get_db),
):
    """
    Validate a password reset token without using it
    
    Useful for checking token validity before showing reset form.
    """
    user = password_reset_service.validate_reset_token(db, request.token)
    
    if not user:
        return ValidateResetTokenResponse(
            valid=False,
            message="Invalid or expired reset token"
        )
    
    return ValidateResetTokenResponse(
        valid=True,
        message="Token is valid"
    )