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
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from enum import Enum
import uuid
import hashlib
import secrets


class SocialProvider(str, Enum):
    GOOGLE = "google"
    LINKEDIN = "linkedin"
    GITHUB = "github"
    FACEBOOK = "facebook"
    TWITTER = "twitter"
    APPLE = "apple"


class SocialLoginService:
    """Service for social login OAuth2."""
    
    def __init__(self, db: Session):
        self.db = db
        self._oauth_states = {}  # In production, use Redis
    
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
        user_id: Optional[int] = None  # For account linking
    ) -> Dict[str, Any]:
        """Start OAuth flow - generate authorization URL."""
        config = self.get_oauth_config(provider)
        
        state = secrets.token_urlsafe(32)
        nonce = secrets.token_urlsafe(16)
        
        # Store state for verification
        self._oauth_states[state] = {
            "provider": provider.value,
            "redirect_uri": redirect_uri,
            "user_id": user_id,
            "nonce": nonce,
            "created_at": datetime.utcnow().isoformat(),
            "expires_at": (datetime.utcnow() + timedelta(minutes=10)).isoformat()
        }
        
        # Build authorization URL
        params = {
            "client_id": f"{{${config['client_id_env']}}}",
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
        
        query_string = "&".join(f"{k}={v}" for k, v in params.items())
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
        
        provider = SocialProvider(state_data["provider"])
        
        # In production, exchange code for tokens via HTTP request
        # Mock token exchange
        access_token = f"mock_access_token_{secrets.token_hex(16)}"
        refresh_token = f"mock_refresh_token_{secrets.token_hex(16)}"
        
        # Mock user info from provider
        social_user = await self._get_user_info(provider, access_token)
        
        # Check if user exists or create new
        user_id = state_data.get("user_id")
        
        if user_id:
            # Account linking
            linked_account = await self._link_social_account(
                user_id, provider, social_user, access_token, refresh_token
            )
            return {
                "success": True,
                "action": "linked",
                "linked_account": linked_account
            }
        else:
            # Login or registration
            result = await self._login_or_register(
                provider, social_user, access_token, refresh_token
            )
            return result
        
        # Clean up state
        del self._oauth_states[state]
    
    async def _get_user_info(
        self,
        provider: SocialProvider,
        access_token: str
    ) -> Dict[str, Any]:
        """Get user info from social provider."""
        # In production, make actual API calls
        
        mock_users = {
            SocialProvider.GOOGLE: {
                "id": "google_123456789",
                "email": "user@gmail.com",
                "name": "John Doe",
                "given_name": "John",
                "family_name": "Doe",
                "picture": "https://lh3.googleusercontent.com/a/photo.jpg",
                "verified_email": True
            },
            SocialProvider.LINKEDIN: {
                "id": "linkedin_987654321",
                "email": "user@email.com",
                "firstName": {"localized": {"en_US": "John"}},
                "lastName": {"localized": {"en_US": "Doe"}},
                "profilePicture": {"displayImage": "https://linkedin.com/photo.jpg"}
            },
            SocialProvider.GITHUB: {
                "id": 12345678,
                "login": "johndoe",
                "email": "johndoe@github.com",
                "name": "John Doe",
                "avatar_url": "https://avatars.githubusercontent.com/u/12345678",
                "bio": "Full-stack developer"
            }
        }
        
        return mock_users.get(provider, {"id": "unknown", "email": "unknown@example.com"})
    
    async def _login_or_register(
        self,
        provider: SocialProvider,
        social_user: Dict[str, Any],
        access_token: str,
        refresh_token: str
    ) -> Dict[str, Any]:
        """Login existing user or register new user."""
        # Extract email from provider response
        email = social_user.get("email")
        
        # In production, check database for existing user
        # For now, simulate login/registration
        
        user = {
            "id": 1,
            "email": email,
            "name": social_user.get("name") or social_user.get("login"),
            "avatar": social_user.get("picture") or social_user.get("avatar_url"),
            "is_new": False  # Would be True if newly registered
        }
        
        # Generate JWT tokens
        jwt_access_token = f"jwt_access_{secrets.token_hex(32)}"
        jwt_refresh_token = f"jwt_refresh_{secrets.token_hex(32)}"
        
        return {
            "success": True,
            "action": "login" if not user["is_new"] else "register",
            "user": user,
            "access_token": jwt_access_token,
            "refresh_token": jwt_refresh_token,
            "token_type": "bearer"
        }
    
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
