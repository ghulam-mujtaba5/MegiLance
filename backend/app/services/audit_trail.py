# @AI-HINT: Comprehensive audit trail system for compliance and security
"""Audit Trail Service - Complete audit logging and compliance system."""

import logging
import hashlib
import json
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from enum import Enum
from collections import defaultdict

logger = logging.getLogger(__name__)


class AuditCategory(str, Enum):
    """Audit log categories."""
    AUTH = "authentication"
    USER = "user_management"
    PROJECT = "project"
    PROPOSAL = "proposal"
    CONTRACT = "contract"
    PAYMENT = "payment"
    MESSAGE = "message"
    FILE = "file"
    ADMIN = "admin"
    SYSTEM = "system"
    SECURITY = "security"
    DATA = "data_access"


class AuditAction(str, Enum):
    """Audit action types."""
    # Auth actions
    LOGIN = "login"
    LOGOUT = "logout"
    LOGIN_FAILED = "login_failed"
    PASSWORD_CHANGE = "password_change"
    PASSWORD_RESET = "password_reset"
    TWO_FACTOR_ENABLED = "2fa_enabled"
    TWO_FACTOR_DISABLED = "2fa_disabled"
    SESSION_REVOKED = "session_revoked"
    
    # User actions
    USER_CREATE = "user_create"
    USER_UPDATE = "user_update"
    USER_DELETE = "user_delete"
    USER_VERIFY = "user_verify"
    USER_SUSPEND = "user_suspend"
    USER_RESTORE = "user_restore"
    PROFILE_VIEW = "profile_view"
    
    # Project actions
    PROJECT_CREATE = "project_create"
    PROJECT_UPDATE = "project_update"
    PROJECT_DELETE = "project_delete"
    PROJECT_PUBLISH = "project_publish"
    PROJECT_CLOSE = "project_close"
    
    # Proposal actions
    PROPOSAL_SUBMIT = "proposal_submit"
    PROPOSAL_UPDATE = "proposal_update"
    PROPOSAL_WITHDRAW = "proposal_withdraw"
    PROPOSAL_ACCEPT = "proposal_accept"
    PROPOSAL_REJECT = "proposal_reject"
    
    # Contract actions
    CONTRACT_CREATE = "contract_create"
    CONTRACT_UPDATE = "contract_update"
    CONTRACT_COMPLETE = "contract_complete"
    CONTRACT_CANCEL = "contract_cancel"
    MILESTONE_CREATE = "milestone_create"
    MILESTONE_COMPLETE = "milestone_complete"
    
    # Payment actions
    PAYMENT_INITIATE = "payment_initiate"
    PAYMENT_COMPLETE = "payment_complete"
    PAYMENT_FAILED = "payment_failed"
    REFUND_INITIATE = "refund_initiate"
    REFUND_COMPLETE = "refund_complete"
    ESCROW_FUND = "escrow_fund"
    ESCROW_RELEASE = "escrow_release"
    WITHDRAWAL_REQUEST = "withdrawal_request"
    WITHDRAWAL_COMPLETE = "withdrawal_complete"
    
    # File actions
    FILE_UPLOAD = "file_upload"
    FILE_DOWNLOAD = "file_download"
    FILE_DELETE = "file_delete"
    FILE_SHARE = "file_share"
    
    # Admin actions
    ADMIN_ACCESS = "admin_access"
    USER_ROLE_CHANGE = "user_role_change"
    SETTING_CHANGE = "setting_change"
    DATA_EXPORT = "data_export"
    DATA_DELETE = "data_delete"
    
    # Security actions
    SUSPICIOUS_ACTIVITY = "suspicious_activity"
    RATE_LIMIT_HIT = "rate_limit_hit"
    PERMISSION_DENIED = "permission_denied"
    IP_BLOCKED = "ip_blocked"
    
    # Data access
    DATA_READ = "data_read"
    DATA_WRITE = "data_write"
    SEARCH_QUERY = "search_query"
    REPORT_GENERATE = "report_generate"


class AuditSeverity(str, Enum):
    """Audit log severity levels."""
    DEBUG = "debug"
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


class AuditTrailService:
    """
    Comprehensive audit trail and logging system.
    
    Provides tamper-evident logging, compliance reporting,
    and security monitoring capabilities.
    """
    
    # Actions that require extra scrutiny
    HIGH_RISK_ACTIONS = [
        AuditAction.PASSWORD_CHANGE,
        AuditAction.TWO_FACTOR_DISABLED,
        AuditAction.USER_DELETE,
        AuditAction.PAYMENT_INITIATE,
        AuditAction.REFUND_INITIATE,
        AuditAction.WITHDRAWAL_REQUEST,
        AuditAction.ADMIN_ACCESS,
        AuditAction.DATA_EXPORT,
        AuditAction.DATA_DELETE,
        AuditAction.USER_ROLE_CHANGE
    ]
    
    # Default retention days by category
    RETENTION_DAYS = {
        AuditCategory.AUTH: 365,
        AuditCategory.PAYMENT: 2555,  # 7 years for financial
        AuditCategory.ADMIN: 2555,
        AuditCategory.SECURITY: 730,
        AuditCategory.DATA: 365,
        "default": 180
    }
    
    def __init__(self, db: Session):
        self.db = db
        
        # In-memory stores
        self._audit_logs: List[Dict] = []
        self._log_index: Dict[str, int] = {}  # id -> index
        self._user_logs: Dict[int, List[str]] = defaultdict(list)
        self._category_logs: Dict[str, List[str]] = defaultdict(list)
        
        # Hash chain for tamper detection
        self._last_hash: str = "genesis"
    
    async def log(
        self,
        user_id: Optional[int],
        action: AuditAction,
        category: AuditCategory,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        severity: AuditSeverity = AuditSeverity.INFO,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Log an audit event.
        
        Args:
            user_id: User who performed the action
            action: Type of action performed
            category: Category of the action
            resource_type: Type of resource affected
            resource_id: ID of resource affected
            details: Additional action details
            ip_address: Client IP address
            user_agent: Client user agent string
            severity: Log severity level
            metadata: Additional metadata
            
        Returns:
            Created audit log entry
        """
        log_id = f"audit_{secrets.token_hex(12)}"
        timestamp = datetime.now(timezone.utc)
        
        # Create log entry
        entry = {
            "id": log_id,
            "user_id": user_id,
            "action": action.value,
            "category": category.value,
            "resource_type": resource_type,
            "resource_id": resource_id,
            "details": details or {},
            "ip_address": ip_address,
            "user_agent": user_agent,
            "severity": severity.value,
            "metadata": metadata or {},
            "timestamp": timestamp.isoformat(),
            "hash": None,
            "previous_hash": self._last_hash
        }
        
        # Calculate hash for tamper detection
        entry["hash"] = self._calculate_hash(entry)
        self._last_hash = entry["hash"]
        
        # Store log
        log_index = len(self._audit_logs)
        self._audit_logs.append(entry)
        self._log_index[log_id] = log_index
        
        # Index by user and category
        if user_id:
            self._user_logs[user_id].append(log_id)
        self._category_logs[category.value].append(log_id)
        
        # Check for high-risk action alerts
        if action in self.HIGH_RISK_ACTIONS:
            await self._trigger_high_risk_alert(entry)
        
        logger.debug(f"Audit log: {action.value} by user {user_id}")
        
        return entry
    
    async def get_logs(
        self,
        user_id: Optional[int] = None,
        category: Optional[AuditCategory] = None,
        action: Optional[AuditAction] = None,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        severity: Optional[AuditSeverity] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        ip_address: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> Dict[str, Any]:
        """Query audit logs with filters."""
        # Start with all logs or filtered by user/category
        if user_id:
            log_ids = self._user_logs.get(user_id, [])
            logs = [self._audit_logs[self._log_index[lid]] for lid in log_ids]
        elif category:
            log_ids = self._category_logs.get(category.value, [])
            logs = [self._audit_logs[self._log_index[lid]] for lid in log_ids]
        else:
            logs = self._audit_logs.copy()
        
        # Apply filters
        if action:
            logs = [l for l in logs if l["action"] == action.value]
        
        if resource_type:
            logs = [l for l in logs if l["resource_type"] == resource_type]
        
        if resource_id:
            logs = [l for l in logs if l["resource_id"] == resource_id]
        
        if severity:
            logs = [l for l in logs if l["severity"] == severity.value]
        
        if ip_address:
            logs = [l for l in logs if l["ip_address"] == ip_address]
        
        if start_date:
            logs = [l for l in logs 
                   if datetime.fromisoformat(l["timestamp"]) >= start_date]
        
        if end_date:
            logs = [l for l in logs 
                   if datetime.fromisoformat(l["timestamp"]) <= end_date]
        
        # Sort by timestamp (newest first)
        logs.sort(key=lambda x: x["timestamp"], reverse=True)
        
        total = len(logs)
        logs = logs[offset:offset + limit]
        
        return {
            "logs": logs,
            "total": total,
            "limit": limit,
            "offset": offset,
            "has_more": offset + limit < total
        }
    
    async def get_user_activity(
        self,
        user_id: int,
        days: int = 30
    ) -> Dict[str, Any]:
        """Get user activity summary."""
        start_date = datetime.now(timezone.utc) - timedelta(days=days)
        
        result = await self.get_logs(
            user_id=user_id,
            start_date=start_date,
            limit=1000
        )
        
        logs = result["logs"]
        
        # Summarize activity
        activity = {
            "total_actions": len(logs),
            "by_category": defaultdict(int),
            "by_action": defaultdict(int),
            "by_day": defaultdict(int),
            "unique_ips": set(),
            "last_login": None,
            "last_activity": None,
            "high_risk_actions": []
        }
        
        for log in logs:
            activity["by_category"][log["category"]] += 1
            activity["by_action"][log["action"]] += 1
            
            date_key = log["timestamp"][:10]  # YYYY-MM-DD
            activity["by_day"][date_key] += 1
            
            if log["ip_address"]:
                activity["unique_ips"].add(log["ip_address"])
            
            if log["action"] == AuditAction.LOGIN.value and not activity["last_login"]:
                activity["last_login"] = log["timestamp"]
            
            if not activity["last_activity"]:
                activity["last_activity"] = log["timestamp"]
            
            # Check for high risk
            try:
                action_enum = AuditAction(log["action"])
                if action_enum in self.HIGH_RISK_ACTIONS:
                    activity["high_risk_actions"].append({
                        "action": log["action"],
                        "timestamp": log["timestamp"],
                        "details": log["details"]
                    })
            except ValueError:
                pass
        
        activity["unique_ips"] = list(activity["unique_ips"])
        activity["by_category"] = dict(activity["by_category"])
        activity["by_action"] = dict(activity["by_action"])
        activity["by_day"] = dict(activity["by_day"])
        
        return activity
    
    async def verify_integrity(
        self,
        start_index: int = 0,
        end_index: Optional[int] = None
    ) -> Dict[str, Any]:
        """Verify audit log integrity (detect tampering)."""
        if end_index is None:
            end_index = len(self._audit_logs)
        
        logs = self._audit_logs[start_index:end_index]
        
        issues = []
        previous_hash = logs[0]["previous_hash"] if logs else "genesis"
        
        for i, log in enumerate(logs):
            # Verify hash chain
            if log["previous_hash"] != previous_hash:
                issues.append({
                    "index": start_index + i,
                    "log_id": log["id"],
                    "issue": "Hash chain broken",
                    "expected_previous": previous_hash,
                    "actual_previous": log["previous_hash"]
                })
            
            # Verify log hash
            expected_hash = self._calculate_hash(log)
            if log["hash"] != expected_hash:
                issues.append({
                    "index": start_index + i,
                    "log_id": log["id"],
                    "issue": "Log hash mismatch (possible tampering)",
                    "expected_hash": expected_hash,
                    "actual_hash": log["hash"]
                })
            
            previous_hash = log["hash"]
        
        return {
            "verified_count": len(logs),
            "integrity_valid": len(issues) == 0,
            "issues": issues
        }
    
    async def export_logs(
        self,
        format: str = "json",
        filters: Optional[Dict[str, Any]] = None,
        include_hashes: bool = False
    ) -> Dict[str, Any]:
        """Export audit logs for compliance."""
        # Get filtered logs
        result = await self.get_logs(**(filters or {}), limit=10000)
        logs = result["logs"]
        
        if not include_hashes:
            # Remove internal hash data for export
            logs = [{k: v for k, v in log.items() 
                    if k not in ["hash", "previous_hash"]} for log in logs]
        
        # Add export metadata
        export = {
            "export_date": datetime.now(timezone.utc).isoformat(),
            "total_records": len(logs),
            "format": format,
            "filters_applied": filters,
            "logs": logs
        }
        
        # Log the export action
        await self.log(
            user_id=None,  # Would be admin user
            action=AuditAction.DATA_EXPORT,
            category=AuditCategory.ADMIN,
            details={
                "format": format,
                "record_count": len(logs),
                "filters": filters
            },
            severity=AuditSeverity.WARNING
        )
        
        return export
    
    async def get_statistics(
        self,
        days: int = 30
    ) -> Dict[str, Any]:
        """Get audit log statistics."""
        start_date = datetime.now(timezone.utc) - timedelta(days=days)
        
        result = await self.get_logs(start_date=start_date, limit=10000)
        logs = result["logs"]
        
        stats = {
            "period_days": days,
            "total_events": len(logs),
            "by_category": defaultdict(int),
            "by_action": defaultdict(int),
            "by_severity": defaultdict(int),
            "by_day": defaultdict(int),
            "unique_users": set(),
            "unique_ips": set(),
            "high_risk_count": 0,
            "failed_auth_count": 0
        }
        
        for log in logs:
            stats["by_category"][log["category"]] += 1
            stats["by_action"][log["action"]] += 1
            stats["by_severity"][log["severity"]] += 1
            
            date_key = log["timestamp"][:10]
            stats["by_day"][date_key] += 1
            
            if log["user_id"]:
                stats["unique_users"].add(log["user_id"])
            if log["ip_address"]:
                stats["unique_ips"].add(log["ip_address"])
            
            if log["action"] == AuditAction.LOGIN_FAILED.value:
                stats["failed_auth_count"] += 1
            
            try:
                action_enum = AuditAction(log["action"])
                if action_enum in self.HIGH_RISK_ACTIONS:
                    stats["high_risk_count"] += 1
            except ValueError:
                pass
        
        stats["unique_users"] = len(stats["unique_users"])
        stats["unique_ips"] = len(stats["unique_ips"])
        stats["by_category"] = dict(stats["by_category"])
        stats["by_action"] = dict(stats["by_action"])
        stats["by_severity"] = dict(stats["by_severity"])
        stats["by_day"] = dict(stats["by_day"])
        
        return stats
    
    async def cleanup_old_logs(
        self,
        category: Optional[AuditCategory] = None
    ) -> Dict[str, Any]:
        """Clean up logs past retention period."""
        deleted_count = 0
        now = datetime.now(timezone.utc)
        
        logs_to_keep = []
        
        for log in self._audit_logs:
            log_category = log["category"]
            retention_days = self.RETENTION_DAYS.get(
                AuditCategory(log_category) if log_category in [c.value for c in AuditCategory] else None,
                self.RETENTION_DAYS["default"]
            )
            
            log_date = datetime.fromisoformat(log["timestamp"])
            age_days = (now - log_date).days
            
            if age_days <= retention_days:
                logs_to_keep.append(log)
            else:
                deleted_count += 1
        
        # Rebuild indexes
        self._audit_logs = logs_to_keep
        self._log_index = {log["id"]: i for i, log in enumerate(self._audit_logs)}
        
        # Rebuild user and category indexes
        self._user_logs = defaultdict(list)
        self._category_logs = defaultdict(list)
        
        for log in self._audit_logs:
            if log["user_id"]:
                self._user_logs[log["user_id"]].append(log["id"])
            self._category_logs[log["category"]].append(log["id"])
        
        return {
            "deleted_count": deleted_count,
            "remaining_count": len(self._audit_logs)
        }
    
    async def get_security_alerts(
        self,
        hours: int = 24
    ) -> Dict[str, Any]:
        """Get recent security-related events."""
        start_date = datetime.now(timezone.utc) - timedelta(hours=hours)
        
        result = await self.get_logs(
            category=AuditCategory.SECURITY,
            start_date=start_date,
            limit=500
        )
        
        security_logs = result["logs"]
        
        # Also get auth failures
        auth_result = await self.get_logs(
            action=AuditAction.LOGIN_FAILED,
            start_date=start_date,
            limit=500
        )
        
        # Merge and deduplicate
        all_security = {l["id"]: l for l in security_logs + auth_result["logs"]}
        
        alerts = {
            "period_hours": hours,
            "total_alerts": len(all_security),
            "failed_logins": len(auth_result["logs"]),
            "by_ip": defaultdict(int),
            "by_action": defaultdict(int),
            "events": list(all_security.values())[:100]
        }
        
        for log in all_security.values():
            if log["ip_address"]:
                alerts["by_ip"][log["ip_address"]] += 1
            alerts["by_action"][log["action"]] += 1
        
        # Find suspicious IPs (many failed attempts)
        alerts["suspicious_ips"] = [
            ip for ip, count in alerts["by_ip"].items() if count >= 5
        ]
        
        alerts["by_ip"] = dict(alerts["by_ip"])
        alerts["by_action"] = dict(alerts["by_action"])
        
        return alerts
    
    def _calculate_hash(self, entry: Dict) -> str:
        """Calculate hash for log entry (excluding hash field)."""
        data_to_hash = {
            k: v for k, v in entry.items() if k != "hash"
        }
        data_string = json.dumps(data_to_hash, sort_keys=True)
        return hashlib.sha256(data_string.encode()).hexdigest()
    
    async def _trigger_high_risk_alert(self, entry: Dict) -> None:
        """Trigger alert for high-risk actions."""
        # Would integrate with alerting system (email, Slack, etc.)
        logger.warning(
            f"High-risk action detected: {entry['action']} "
            f"by user {entry['user_id']} from {entry['ip_address']}"
        )


# Singleton instance
_audit_service: Optional[AuditTrailService] = None


def get_audit_service(db: Session) -> AuditTrailService:
    """Get or create audit service instance."""
    global _audit_service
    if _audit_service is None:
        _audit_service = AuditTrailService(db)
    else:
        _audit_service.db = db
    return _audit_service
