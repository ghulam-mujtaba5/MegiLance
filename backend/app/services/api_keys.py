# @AI-HINT: API key management service - developer API key generation and management
"""API Keys Service - Developer API Key Management."""

import uuid
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session


class APIKeyService:
    """Service for managing developer API keys."""
    
    # API key scopes
    SCOPES = {
        "read": "Read-only access to public resources",
        "write": "Create and update resources",
        "delete": "Delete resources",
        "admin": "Full administrative access",
        "projects": "Access project endpoints",
        "users": "Access user endpoints",
        "payments": "Access payment endpoints",
        "analytics": "Access analytics endpoints",
        "webhooks": "Manage webhooks"
    }
    
    # Rate limits by key tier
    TIER_LIMITS = {
        "free": {"requests_per_minute": 60, "requests_per_day": 1000},
        "basic": {"requests_per_minute": 300, "requests_per_day": 10000},
        "premium": {"requests_per_minute": 1000, "requests_per_day": 100000},
        "enterprise": {"requests_per_minute": 5000, "requests_per_day": 1000000}
    }
    
    # Key prefix for identification
    KEY_PREFIX = "megilance_"
    
    def __init__(self):
        # In-memory storage
        self._api_keys: Dict[str, Dict] = {}  # key_hash -> key_data
        self._user_keys: Dict[str, List[str]] = {}  # user_id -> [key_hashes]
        self._usage: Dict[str, Dict] = {}  # key_hash -> usage_stats
    
    def _generate_api_key(self) -> tuple:
        """Generate a new API key and its hash."""
        # Generate random key
        key_bytes = secrets.token_bytes(32)
        key = self.KEY_PREFIX + secrets.token_urlsafe(32)
        
        # Create hash for storage
        key_hash = hashlib.sha256(key.encode()).hexdigest()
        
        return key, key_hash
    
    def _hash_key(self, api_key: str) -> str:
        """Hash an API key for lookup."""
        return hashlib.sha256(api_key.encode()).hexdigest()
    
    async def create_api_key(
        self,
        db: Session,
        user_id: str,
        name: str,
        scopes: List[str],
        tier: str = "free",
        expires_in_days: Optional[int] = 365,
        ip_whitelist: Optional[List[str]] = None,
        description: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create a new API key.
        
        Args:
            user_id: Owner of the API key
            name: Display name for the key
            scopes: List of permission scopes
            tier: Rate limit tier
            expires_in_days: Days until expiration (None for no expiration)
            ip_whitelist: List of allowed IP addresses
            description: Optional description
        """
        # Validate scopes
        invalid_scopes = [s for s in scopes if s not in self.SCOPES]
        if invalid_scopes:
            raise ValueError(f"Invalid scopes: {invalid_scopes}")
        
        if tier not in self.TIER_LIMITS:
            raise ValueError(f"Invalid tier. Must be one of: {list(self.TIER_LIMITS.keys())}")
        
        # Check user's key limit (max 10 per user)
        user_keys = self._user_keys.get(user_id, [])
        active_keys = [k for k in user_keys if self._api_keys.get(k, {}).get("is_active", False)]
        if len(active_keys) >= 10:
            raise ValueError("Maximum API key limit (10) reached")
        
        # Generate key
        api_key, key_hash = self._generate_api_key()
        
        # Calculate expiration
        expires_at = None
        if expires_in_days:
            expires_at = (datetime.now(timezone.utc) + timedelta(days=expires_in_days)).isoformat()
        
        key_data = {
            "id": str(uuid.uuid4()),
            "key_hash": key_hash,
            "key_prefix": api_key[:20] + "...",  # Show prefix for identification
            "user_id": user_id,
            "name": name,
            "description": description,
            "scopes": scopes,
            "tier": tier,
            "rate_limits": self.TIER_LIMITS[tier],
            "ip_whitelist": ip_whitelist or [],
            "is_active": True,
            "last_used_at": None,
            "total_requests": 0,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "expires_at": expires_at,
            "rotated_from": None
        }
        
        # Store key
        self._api_keys[key_hash] = key_data
        
        if user_id not in self._user_keys:
            self._user_keys[user_id] = []
        self._user_keys[user_id].append(key_hash)
        
        # Initialize usage tracking
        self._usage[key_hash] = {
            "requests_today": 0,
            "requests_this_minute": 0,
            "minute_window_start": datetime.now(timezone.utc).isoformat(),
            "day_window_start": datetime.now(timezone.utc).date().isoformat()
        }
        
        return {
            "success": True,
            "api_key": api_key,  # Only returned once!
            "key_data": {
                "id": key_data["id"],
                "name": key_data["name"],
                "scopes": key_data["scopes"],
                "tier": key_data["tier"],
                "expires_at": key_data["expires_at"],
                "key_prefix": key_data["key_prefix"]
            },
            "warning": "Save this API key securely. It won't be shown again!"
        }
    
    async def get_user_keys(
        self,
        db: Session,
        user_id: str,
        include_inactive: bool = False
    ) -> Dict[str, Any]:
        """Get all API keys for a user."""
        user_key_hashes = self._user_keys.get(user_id, [])
        
        keys = []
        for key_hash in user_key_hashes:
            key_data = self._api_keys.get(key_hash)
            if key_data:
                if include_inactive or key_data["is_active"]:
                    # Don't include the actual key or full hash
                    safe_data = {
                        "id": key_data["id"],
                        "name": key_data["name"],
                        "description": key_data["description"],
                        "key_prefix": key_data["key_prefix"],
                        "scopes": key_data["scopes"],
                        "tier": key_data["tier"],
                        "is_active": key_data["is_active"],
                        "last_used_at": key_data["last_used_at"],
                        "total_requests": key_data["total_requests"],
                        "created_at": key_data["created_at"],
                        "expires_at": key_data["expires_at"]
                    }
                    keys.append(safe_data)
        
        # Sort by created_at descending
        keys.sort(key=lambda x: x["created_at"], reverse=True)
        
        return {
            "api_keys": keys,
            "total": len(keys),
            "active": len([k for k in keys if k["is_active"]])
        }
    
    async def validate_api_key(
        self,
        db: Session,
        api_key: str,
        required_scope: Optional[str] = None,
        client_ip: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Validate an API key and check permissions.
        
        Returns validation result with user_id if valid.
        """
        key_hash = self._hash_key(api_key)
        key_data = self._api_keys.get(key_hash)
        
        if not key_data:
            return {
                "valid": False,
                "error": "Invalid API key"
            }
        
        # Check if active
        if not key_data["is_active"]:
            return {
                "valid": False,
                "error": "API key is inactive"
            }
        
        # Check expiration
        if key_data["expires_at"]:
            expires = datetime.fromisoformat(key_data["expires_at"])
            if datetime.now(timezone.utc) > expires:
                return {
                    "valid": False,
                    "error": "API key has expired"
                }
        
        # Check IP whitelist
        if key_data["ip_whitelist"] and client_ip:
            if client_ip not in key_data["ip_whitelist"]:
                return {
                    "valid": False,
                    "error": "IP address not whitelisted"
                }
        
        # Check scope
        if required_scope and required_scope not in key_data["scopes"]:
            return {
                "valid": False,
                "error": f"API key lacks required scope: {required_scope}"
            }
        
        # Check rate limits
        rate_limit_result = await self._check_rate_limit(key_hash, key_data["tier"])
        if not rate_limit_result["allowed"]:
            return {
                "valid": False,
                "error": rate_limit_result["error"],
                "retry_after": rate_limit_result.get("retry_after")
            }
        
        # Update usage
        key_data["last_used_at"] = datetime.now(timezone.utc).isoformat()
        key_data["total_requests"] += 1
        
        return {
            "valid": True,
            "user_id": key_data["user_id"],
            "scopes": key_data["scopes"],
            "tier": key_data["tier"],
            "rate_limits": {
                "remaining_per_minute": rate_limit_result["remaining_per_minute"],
                "remaining_per_day": rate_limit_result["remaining_per_day"]
            }
        }
    
    async def _check_rate_limit(self, key_hash: str, tier: str) -> Dict[str, Any]:
        """Check and update rate limits."""
        limits = self.TIER_LIMITS[tier]
        usage = self._usage.get(key_hash, {})
        
        now = datetime.now(timezone.utc)
        
        # Reset minute window if needed
        minute_start = usage.get("minute_window_start")
        if minute_start:
            minute_start_dt = datetime.fromisoformat(minute_start)
            if (now - minute_start_dt).total_seconds() >= 60:
                usage["requests_this_minute"] = 0
                usage["minute_window_start"] = now.isoformat()
        else:
            usage["minute_window_start"] = now.isoformat()
        
        # Reset day window if needed
        day_start = usage.get("day_window_start")
        if day_start and day_start != now.date().isoformat():
            usage["requests_today"] = 0
            usage["day_window_start"] = now.date().isoformat()
        elif not day_start:
            usage["day_window_start"] = now.date().isoformat()
        
        # Check limits
        if usage.get("requests_this_minute", 0) >= limits["requests_per_minute"]:
            return {
                "allowed": False,
                "error": "Rate limit exceeded (per minute)",
                "retry_after": 60,
                "remaining_per_minute": 0,
                "remaining_per_day": limits["requests_per_day"] - usage.get("requests_today", 0)
            }
        
        if usage.get("requests_today", 0) >= limits["requests_per_day"]:
            return {
                "allowed": False,
                "error": "Rate limit exceeded (per day)",
                "retry_after": 86400,
                "remaining_per_minute": 0,
                "remaining_per_day": 0
            }
        
        # Increment counters
        usage["requests_this_minute"] = usage.get("requests_this_minute", 0) + 1
        usage["requests_today"] = usage.get("requests_today", 0) + 1
        
        self._usage[key_hash] = usage
        
        return {
            "allowed": True,
            "remaining_per_minute": limits["requests_per_minute"] - usage["requests_this_minute"],
            "remaining_per_day": limits["requests_per_day"] - usage["requests_today"]
        }
    
    async def revoke_api_key(
        self,
        db: Session,
        user_id: str,
        key_id: str
    ) -> Dict[str, Any]:
        """Revoke an API key."""
        user_key_hashes = self._user_keys.get(user_id, [])
        
        for key_hash in user_key_hashes:
            key_data = self._api_keys.get(key_hash)
            if key_data and key_data["id"] == key_id:
                key_data["is_active"] = False
                key_data["revoked_at"] = datetime.now(timezone.utc).isoformat()
                
                return {
                    "success": True,
                    "message": f"API key '{key_data['name']}' has been revoked"
                }
        
        raise ValueError("API key not found")
    
    async def rotate_api_key(
        self,
        db: Session,
        user_id: str,
        key_id: str
    ) -> Dict[str, Any]:
        """
        Rotate an API key (create new, revoke old).
        
        The old key remains active for 24 hours to allow migration.
        """
        user_key_hashes = self._user_keys.get(user_id, [])
        
        for key_hash in user_key_hashes:
            key_data = self._api_keys.get(key_hash)
            if key_data and key_data["id"] == key_id:
                # Create new key with same settings
                new_key_result = await self.create_api_key(
                    db=db,
                    user_id=user_id,
                    name=f"{key_data['name']} (rotated)",
                    scopes=key_data["scopes"],
                    tier=key_data["tier"],
                    expires_in_days=365,
                    ip_whitelist=key_data["ip_whitelist"],
                    description=key_data["description"]
                )
                
                # Mark old key for delayed revocation
                key_data["pending_revocation"] = True
                key_data["revocation_time"] = (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat()
                
                # Link new key to old
                new_key_hash = self._hash_key(new_key_result["api_key"])
                if new_key_hash in self._api_keys:
                    self._api_keys[new_key_hash]["rotated_from"] = key_id
                
                return {
                    "success": True,
                    "new_api_key": new_key_result["api_key"],
                    "new_key_data": new_key_result["key_data"],
                    "old_key_valid_until": key_data["revocation_time"],
                    "warning": "Old key will be revoked in 24 hours. Migrate to the new key."
                }
        
        raise ValueError("API key not found")
    
    async def update_api_key(
        self,
        db: Session,
        user_id: str,
        key_id: str,
        updates: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Update API key settings (name, scopes, IP whitelist)."""
        user_key_hashes = self._user_keys.get(user_id, [])
        
        for key_hash in user_key_hashes:
            key_data = self._api_keys.get(key_hash)
            if key_data and key_data["id"] == key_id:
                allowed_updates = ["name", "description", "scopes", "ip_whitelist"]
                
                for key, value in updates.items():
                    if key in allowed_updates:
                        if key == "scopes":
                            invalid = [s for s in value if s not in self.SCOPES]
                            if invalid:
                                raise ValueError(f"Invalid scopes: {invalid}")
                        key_data[key] = value
                
                return {
                    "success": True,
                    "key_data": {
                        "id": key_data["id"],
                        "name": key_data["name"],
                        "scopes": key_data["scopes"],
                        "ip_whitelist": key_data["ip_whitelist"]
                    }
                }
        
        raise ValueError("API key not found")
    
    async def get_key_usage(
        self,
        db: Session,
        user_id: str,
        key_id: str
    ) -> Dict[str, Any]:
        """Get detailed usage statistics for an API key."""
        user_key_hashes = self._user_keys.get(user_id, [])
        
        for key_hash in user_key_hashes:
            key_data = self._api_keys.get(key_hash)
            if key_data and key_data["id"] == key_id:
                usage = self._usage.get(key_hash, {})
                limits = self.TIER_LIMITS[key_data["tier"]]
                
                return {
                    "key_id": key_id,
                    "name": key_data["name"],
                    "tier": key_data["tier"],
                    "usage": {
                        "total_requests": key_data["total_requests"],
                        "requests_today": usage.get("requests_today", 0),
                        "requests_this_minute": usage.get("requests_this_minute", 0),
                        "last_used_at": key_data["last_used_at"]
                    },
                    "limits": {
                        "per_minute": limits["requests_per_minute"],
                        "per_day": limits["requests_per_day"],
                        "remaining_per_minute": limits["requests_per_minute"] - usage.get("requests_this_minute", 0),
                        "remaining_per_day": limits["requests_per_day"] - usage.get("requests_today", 0)
                    }
                }
        
        raise ValueError("API key not found")
    
    async def get_available_scopes(self, db: Session) -> Dict[str, Any]:
        """Get all available API scopes."""
        return {
            "scopes": self.SCOPES,
            "tiers": {
                tier: {
                    "limits": limits,
                    "description": f"{limits['requests_per_minute']} req/min, {limits['requests_per_day']} req/day"
                }
                for tier, limits in self.TIER_LIMITS.items()
            }
        }


# Singleton instance
api_key_service = APIKeyService()
