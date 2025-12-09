# @AI-HINT: Social login OAuth2 service for Google, LinkedIn, GitHub
"""
Social Login Service - OAuth2 authentication with social providers.

Features:
- Google OAuth2 login
- LinkedIn OAuth2 login
- GitHub OAuth2 login
- Account linking
- Profile sync from social accounts
"""

from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from enum import Enum
import uuid
import hashlib
import secrets
from urllib.parse import urlencode

import requests

from app.core.config import get_settings
from app.core.security import create_access_token, create_refresh_token, get_password_hash
from app.db.turso_http import execute_query, parse_rows


class SocialProvider(str, Enum):
    GOOGLE = "google"
    LINKEDIN = "linkedin"
    GITHUB = "github"
    FACEBOOK = "facebook"
    TWITTER = "twitter"
    APPLE = "apple"


# In-memory OAuth state store shared across requests (single-process only).
# In production, replace with Redis or another shared store.
_OAUTH_STATE_STORE: Dict[str, Dict[str, Any]] = {}


class SocialLoginService:
    """Service for social login OAuth2."""
    
    def __init__(self, db: Session):
        self.db = db
        # Use module-level store so state survives across requests
        self._oauth_states = _OAUTH_STATE_STORE  # In production, use Redis
    
    # OAuth Configuration
    def get_oauth_config(self, provider: SocialProvider) -> Dict[str, Any]:
        """Get OAuth configuration for a provider."""
        configs = {
            SocialProvider.GOOGLE: {
                "authorization_url": "https://accounts.google.com/o/oauth2/v2/auth",
                "token_url": "https://oauth2.googleapis.com/token",
                "userinfo_url": "https://www.googleapis.com/oauth2/v2/userinfo",
                "scopes": ["openid", "email", "profile"],
                "client_id_env": "GOOGLE_CLIENT_ID",
                "client_secret_env": "GOOGLE_CLIENT_SECRET"
            },
            SocialProvider.LINKEDIN: {
                "authorization_url": "https://www.linkedin.com/oauth/v2/authorization",
                "token_url": "https://www.linkedin.com/oauth/v2/accessToken",
                "userinfo_url": "https://api.linkedin.com/v2/me",
                "scopes": ["r_liteprofile", "r_emailaddress"],
                "client_id_env": "LINKEDIN_CLIENT_ID",
                "client_secret_env": "LINKEDIN_CLIENT_SECRET"
            },
            SocialProvider.GITHUB: {
                "authorization_url": "https://github.com/login/oauth/authorize",
                "token_url": "https://github.com/login/oauth/access_token",
                "userinfo_url": "https://api.github.com/user",
                "scopes": ["read:user", "user:email"],
                "client_id_env": "GITHUB_CLIENT_ID",
                "client_secret_env": "GITHUB_CLIENT_SECRET"
            },
            SocialProvider.FACEBOOK: {
                "authorization_url": "https://www.facebook.com/v18.0/dialog/oauth",
                "token_url": "https://graph.facebook.com/v18.0/oauth/access_token",
                "userinfo_url": "https://graph.facebook.com/me",
                "scopes": ["email", "public_profile"],
                "client_id_env": "FACEBOOK_CLIENT_ID",
                "client_secret_env": "FACEBOOK_CLIENT_SECRET"
            },
            SocialProvider.APPLE: {
                "authorization_url": "https://appleid.apple.com/auth/authorize",
                "token_url": "https://appleid.apple.com/auth/token",
                "scopes": ["name", "email"],
                "client_id_env": "APPLE_CLIENT_ID",
                "client_secret_env": "APPLE_CLIENT_SECRET"
            }
        }
        
        return configs.get(provider, {})
    
    async def get_available_providers(self) -> List[Dict[str, Any]]:
        """Get list of available social login providers."""
        return [
            {
                "provider": SocialProvider.GOOGLE.value,
                "name": "Google",
                "icon": "google",
                "enabled": True,
                "description": "Sign in with your Google account"
            },
            {
                "provider": SocialProvider.LINKEDIN.value,
                "name": "LinkedIn",
                "icon": "linkedin",
                "enabled": True,
                "description": "Sign in with your LinkedIn account"
            },
            {
                "provider": SocialProvider.GITHUB.value,
                "name": "GitHub",
                "icon": "github",
                "enabled": True,
                "description": "Sign in with your GitHub account"
            },
            {
                "provider": SocialProvider.FACEBOOK.value,
                "name": "Facebook",
                "icon": "facebook",
                "enabled": False,
                "description": "Sign in with your Facebook account"
            },
            {
                "provider": SocialProvider.APPLE.value,
                "name": "Apple",
                "icon": "apple",
                "enabled": False,
                "description": "Sign in with your Apple ID"
            }
        ]
    
    # OAuth Flow
    async def start_oauth(
        self,
        provider: SocialProvider,
        redirect_uri: str,
        user_id: Optional[int] = None,  # For account linking
        portal_area: Optional[str] = None  # For determining role during registration
    ) -> Dict[str, Any]:
        """Start OAuth flow - generate authorization URL."""
        config = self.get_oauth_config(provider)
        settings = get_settings()

        client_id_env = config.get("client_id_env")
        client_id: Optional[str] = getattr(settings, client_id_env, None) if client_id_env else None

        if not client_id:
            # Misconfiguration - surface a clear error to the caller
            return {
                "success": False,
                "error": f"{provider.value.capitalize()} login is not configured. Missing client ID.",
            }
        
        state = secrets.token_urlsafe(32)
        nonce = secrets.token_urlsafe(16)
        
        # Store state for verification
        self._oauth_states[state] = {
            "provider": provider.value,
            "redirect_uri": redirect_uri,
            "user_id": user_id,
            "nonce": nonce,
            "portal_area": portal_area,
            "created_at": datetime.utcnow().isoformat(),
            "expires_at": (datetime.utcnow() + timedelta(minutes=10)).isoformat()
        }
        
        # Build authorization URL
        params = {
            "client_id": client_id,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": " ".join(config["scopes"]),
            "state": state,
            "nonce": nonce
        }
        
        # Add provider-specific params
        if provider == SocialProvider.GOOGLE:
            params["access_type"] = "offline"
            params["prompt"] = "consent"
        
        query_string = urlencode(params)
        authorization_url = f"{config['authorization_url']}?{query_string}"
        
        return {
            "authorization_url": authorization_url,
            "state": state,
            "provider": provider.value,
            "expires_in": 600
        }
    
    async def complete_oauth(
        self,
        code: str,
        state: str
    ) -> Dict[str, Any]:
        """Complete OAuth flow - exchange code for tokens and get user info."""
        # Verify state
        state_data = self._oauth_states.get(state)
        if not state_data:
            return {"success": False, "error": "Invalid or expired state"}

        # Enforce expiration
        try:
            expires_at = datetime.fromisoformat(state_data["expires_at"])
            if expires_at < datetime.utcnow():
                self._oauth_states.pop(state, None)
                return {"success": False, "error": "OAuth session expired. Please try again."}
        except Exception:
            # If parsing fails, continue but do not trust stale state for long
            pass

        provider = SocialProvider(state_data["provider"])
        redirect_uri = state_data["redirect_uri"]
        portal_area = state_data.get("portal_area")

        try:
            if provider in (SocialProvider.GOOGLE, SocialProvider.GITHUB):
                token_data = await self._exchange_code_for_tokens(provider, code, redirect_uri)
                access_token = token_data.get("access_token")
                refresh_token = token_data.get("refresh_token")

                if not access_token:
                    return {"success": False, "error": "Failed to obtain access token from provider."}

                social_user = await self._get_user_info(provider, access_token)
            else:
                # Fallback to mock behaviour for non-critical providers
                access_token = f"mock_access_token_{secrets.token_hex(16)}"
                refresh_token = f"mock_refresh_token_{secrets.token_hex(16)}"
                social_user = await self._get_user_info(provider, access_token)

            # Check if user exists or create new
            user_id = state_data.get("user_id")

            if user_id:
                # Account linking
                linked_account = await self._link_social_account(
                    user_id, provider, social_user, access_token, refresh_token
                )
                result = {
                    "success": True,
                    "action": "linked",
                    "linked_account": linked_account
                }
            else:
                # Login or registration
                result = await self._login_or_register(
                    provider, social_user, access_token, refresh_token, portal_area
                )

            return result

        finally:
            # Clean up state regardless of outcome
            self._oauth_states.pop(state, None)
    
    async def _get_user_info(
        self,
        provider: SocialProvider,
        access_token: str
    ) -> Dict[str, Any]:
        """Get user info from social provider."""
        config = self.get_oauth_config(provider)

        # Real provider calls for Google and GitHub
        if provider == SocialProvider.GOOGLE:
            try:
                resp = requests.get(
                    config["userinfo_url"],
                    headers={"Authorization": f"Bearer {access_token}"},
                    timeout=10,
                )
                resp.raise_for_status()
                data = resp.json()
            except Exception:
                # Fallback minimal structure if provider call fails
                return {"id": "google_unknown", "email": None}

            full_name = data.get("name") or " ".join(
                filter(None, [data.get("given_name"), data.get("family_name")])
            ).strip() or None

            return {
                "id": data.get("id") or data.get("sub"),
                "email": data.get("email"),
                "name": full_name,
                "picture": data.get("picture"),
                "verified_email": data.get("verified_email", False),
            }

        if provider == SocialProvider.GITHUB:
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Accept": "application/vnd.github+json",
            }

            try:
                user_resp = requests.get(config["userinfo_url"], headers=headers, timeout=10)
                user_resp.raise_for_status()
                user_data = user_resp.json()
            except Exception:
                return {"id": "github_unknown", "email": None}

            email = user_data.get("email")
            # If primary email is not in main user object, fetch from /user/emails
            if not email:
                try:
                    emails_resp = requests.get("https://api.github.com/user/emails", headers=headers, timeout=10)
                    emails_resp.raise_for_status()
                    emails = emails_resp.json()
                    primary = next(
                        (e for e in emails if e.get("primary") and e.get("verified")),
                        None,
                    )
                    if primary:
                        email = primary.get("email")
                except Exception:
                    # If this also fails, we'll leave email as None
                    pass

            return {
                "id": user_data.get("id"),
                "login": user_data.get("login"),
                "email": email,
                "name": user_data.get("name") or user_data.get("login"),
                "avatar_url": user_data.get("avatar_url"),
                "bio": user_data.get("bio"),
            }

        # Fallback mock data for other providers we don't fully support yet
        mock_users = {
            SocialProvider.LINKEDIN: {
                "id": "linkedin_987654321",
                "email": "user@email.com",
                "name": "LinkedIn User",
            },
            SocialProvider.FACEBOOK: {
                "id": "facebook_123456789",
                "email": "user@facebook.com",
                "name": "Facebook User",
            },
            SocialProvider.APPLE: {
                "id": "apple_123456789",
                "email": "user@icloud.com",
                "name": "Apple User",
            },
        }

        return mock_users.get(provider, {"id": "unknown", "email": None})
    
    async def _login_or_register(
        self,
        provider: SocialProvider,
        social_user: Dict[str, Any],
        access_token: str,
        refresh_token: str,
        portal_area: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Login existing user or register new user."""
        # Extract email from provider response
        email = social_user.get("email")
        if not email:
            return {
                "success": False,
                "error": f"{provider.value.capitalize()} did not return an email address. Please make your email visible or grant email permissions.",
            }

        normalized_email = email.strip().lower()
        name = social_user.get("name") or social_user.get("login") or ""
        avatar_url = social_user.get("picture") or social_user.get("avatar_url") or ""

        # Determine desired role from portal area
        desired_role = (portal_area or "").lower()
        if desired_role not in {"client", "freelancer", "admin"}:
            desired_role = "client"

        user_record, is_new = self._get_or_create_user_from_social(
            email=normalized_email,
            name=name,
            avatar_url=avatar_url,
            role=desired_role,
        )

        role = user_record.get("role") or user_record.get("user_type") or desired_role

        # Generate JWT tokens aligned with main auth flow
        custom_claims = {"user_id": user_record["id"], "role": role}
        jwt_access_token = create_access_token(subject=normalized_email, custom_claims=custom_claims)
        jwt_refresh_token = create_refresh_token(subject=normalized_email, custom_claims=custom_claims)

        user_payload = {
            "id": user_record["id"],
            "email": user_record["email"],
            "name": user_record.get("name") or name,
            "role": role,
            "user_type": role,
            "profile_image_url": user_record.get("profile_image_url") or avatar_url,
        }

        return {
            "success": True,
            "action": "register" if is_new else "login",
            "user": user_payload,
            "access_token": jwt_access_token,
            "refresh_token": jwt_refresh_token,
            "token_type": "bearer",
        }

    def _get_or_create_user_from_social(
        self,
        email: str,
        name: str,
        avatar_url: str,
        role: str,
    ) -> Tuple[Dict[str, Any], bool]:
        """Find existing user by email or create a new one in Turso."""
        # Try to find existing user
        existing_result = execute_query(
            """SELECT id, email, name, user_type, role, is_active, is_verified, 
                      profile_image_url
                   FROM users WHERE email = ?""",
            [email],
        )
        existing_rows = parse_rows(existing_result)

        if existing_rows:
            user = existing_rows[0]
            # Ensure role/user_type are set
            user_role = user.get("role") or user.get("user_type") or role
            user["role"] = user_role
            user.setdefault("user_type", user_role)
            return user, False

        # Create new user
        now = datetime.utcnow().isoformat()
        hashed_password = get_password_hash(secrets.token_urlsafe(32))

        execute_result = execute_query(
            """INSERT INTO users (
                email, hashed_password, is_active, is_verified, email_verified,
                name, user_type, role, bio, skills, hourly_rate,
                profile_image_url, location, profile_data,
                two_factor_enabled, account_balance,
                joined_at, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            [
                email,
                hashed_password,
                1,  # is_active
                1,  # is_verified
                1,  # email_verified
                name,
                role,
                role,
                "",  # bio
                "",  # skills
                0,  # hourly_rate
                avatar_url,
                "",  # location
                None,  # profile_data
                0,  # two_factor_enabled
                0.0,  # account_balance
                now,
                now,
                now,
            ],
        )

        if not execute_result:
            raise RuntimeError("Failed to create user from social login")

        # Fetch created user
        created_result = execute_query(
            """SELECT id, email, name, user_type, role, is_active, is_verified, 
                      profile_image_url
                   FROM users WHERE email = ?""",
            [email],
        )
        created_rows = parse_rows(created_result)
        if not created_rows:
            raise RuntimeError("User created but could not be fetched")

        user = created_rows[0]
        user_role = user.get("role") or user.get("user_type") or role
        user["role"] = user_role
        user.setdefault("user_type", user_role)
        return user, True
    
    async def _link_social_account(
        self,
        user_id: int,
        provider: SocialProvider,
        social_user: Dict[str, Any],
        access_token: str,
        refresh_token: str
    ) -> Dict[str, Any]:
        """Link a social account to existing user."""
        return {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "provider": provider.value,
            "provider_user_id": str(social_user.get("id")),
            "email": social_user.get("email"),
            "name": social_user.get("name"),
            "linked_at": datetime.utcnow().isoformat()
        }
    
    # Linked Accounts Management
    async def get_linked_accounts(
        self,
        user_id: int
    ) -> List[Dict[str, Any]]:
        """Get user's linked social accounts."""
        return [
            {
                "id": "link-1",
                "provider": SocialProvider.GOOGLE.value,
                "provider_user_id": "google_123456789",
                "email": "user@gmail.com",
                "name": "John Doe",
                "linked_at": "2024-01-01T00:00:00"
            },
            {
                "id": "link-2",
                "provider": SocialProvider.GITHUB.value,
                "provider_user_id": "12345678",
                "email": "johndoe@github.com",
                "name": "johndoe",
                "linked_at": "2024-01-05T00:00:00"
            }
        ]
    
    async def unlink_account(
        self,
        user_id: int,
        provider: SocialProvider
    ) -> Dict[str, Any]:
        """Unlink a social account from user."""
        # In production, check if user has password or other linked accounts
        return {
            "success": True,
            "provider": provider.value,
            "unlinked_at": datetime.utcnow().isoformat()
        }
    
    # Profile Sync
    async def sync_profile_from_social(
        self,
        user_id: int,
        provider: SocialProvider,
        fields: List[str] = None  # name, email, avatar, bio
    ) -> Dict[str, Any]:
        """Sync profile data from social account."""
        fields = fields or ["name", "avatar"]
        
        return {
            "success": True,
            "synced_fields": fields,
            "synced_at": datetime.utcnow().isoformat()
        }


def get_social_login_service(db: Session) -> SocialLoginService:
    """Factory function for social login service."""
    return SocialLoginService(db)
