# @AI-HINT: Content moderation service for safety and compliance
"""Content Moderation Service - AI-powered content safety."""

import logging
import re
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from enum import Enum
from collections import defaultdict
import secrets

logger = logging.getLogger(__name__)


class ModerationContentType(str, Enum):
    """Content types for moderation."""
    TEXT = "text"
    IMAGE = "image"
    FILE = "file"
    PROFILE = "profile"
    PROJECT = "project"
    MESSAGE = "message"
    REVIEW = "review"


class ModerationResult(str, Enum):
    """Moderation result types."""
    APPROVED = "approved"
    FLAGGED = "flagged"
    REJECTED = "rejected"
    PENDING_REVIEW = "pending_review"


class ViolationType(str, Enum):
    """Types of content violations."""
    PROFANITY = "profanity"
    SPAM = "spam"
    HARASSMENT = "harassment"
    HATE_SPEECH = "hate_speech"
    ADULT_CONTENT = "adult_content"
    VIOLENCE = "violence"
    PERSONAL_INFO = "personal_info"
    SCAM = "scam"
    COPYRIGHT = "copyright"
    OTHER = "other"


class ReportStatus(str, Enum):
    """User report status."""
    PENDING = "pending"
    UNDER_REVIEW = "under_review"
    RESOLVED = "resolved"
    DISMISSED = "dismissed"


# Profanity word list (simplified)
PROFANITY_WORDS = {
    "badword1", "badword2", "spam", "scam", "fraud"
}

# Spam patterns
SPAM_PATTERNS = [
    r'buy\s+now',
    r'click\s+here',
    r'make\s+money\s+fast',
    r'work\s+from\s+home\s+\$\d+',
    r'(?:https?://)?(?:www\.)?(?:[a-z0-9-]+\.)+[a-z]{2,}(?:/[^\s]*)?(?:\s+){0,2}(?:https?://)?(?:www\.)?(?:[a-z0-9-]+\.)+[a-z]{2,}',  # Multiple links
]

# Personal info patterns
PII_PATTERNS = [
    r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b',  # Phone numbers
    r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',  # Emails (only flag in certain contexts)
    r'\b\d{3}[-]?\d{2}[-]?\d{4}\b',  # SSN
]


class ContentModerationService:
    """
    Content moderation service.
    
    Provides AI-powered content safety checks and reporting.
    """
    
    # TODO: migrate in-memory stores to database for persistence and scalability
    _MAX_LOGS = 5000
    _MAX_REPORTS = 2000
    _MAX_VIOLATIONS_PER_USER = 100

    def __init__(self, db: Session):
        self.db = db
        self._moderation_logs: List[Dict[str, Any]] = []
        self._reports: Dict[str, Dict[str, Any]] = {}
        self._user_violations: Dict[int, List[Dict[str, Any]]] = defaultdict(list)
        self._user_reputation: Dict[int, float] = defaultdict(lambda: 100.0)
        self._blocked_users: Dict[int, datetime] = {}
    
    async def moderate_text(
        self,
        text: str,
        content_type: ModerationContentType,
        user_id: Optional[int] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Analyze text content for violations.
        
        Args:
            text: Text to analyze
            content_type: Type of content
            user_id: Author user ID
            context: Additional context
            
        Returns:
            Moderation result
        """
        violations = []
        risk_score = 0.0
        
        # Check profanity
        profanity_found = self._check_profanity(text)
        if profanity_found:
            violations.append({
                "type": ViolationType.PROFANITY.value,
                "severity": "medium",
                "details": f"Found {len(profanity_found)} profane words"
            })
            risk_score += 30.0
        
        # Check spam patterns
        spam_matches = self._check_spam(text)
        if spam_matches:
            violations.append({
                "type": ViolationType.SPAM.value,
                "severity": "high",
                "details": "Content matches spam patterns"
            })
            risk_score += 50.0
        
        # Check for PII
        pii_found = self._check_pii(text, content_type)
        if pii_found:
            violations.append({
                "type": ViolationType.PERSONAL_INFO.value,
                "severity": "medium",
                "details": "Contains personal information"
            })
            risk_score += 20.0
        
        # Check for scam indicators
        if self._check_scam_indicators(text):
            violations.append({
                "type": ViolationType.SCAM.value,
                "severity": "high",
                "details": "Contains potential scam indicators"
            })
            risk_score += 60.0
        
        # Determine result
        if risk_score >= 70:
            result = ModerationResult.REJECTED
        elif risk_score >= 40:
            result = ModerationResult.PENDING_REVIEW
        elif risk_score >= 20:
            result = ModerationResult.FLAGGED
        else:
            result = ModerationResult.APPROVED
        
        # Log moderation
        log_entry = {
            "id": f"mod_{secrets.token_urlsafe(8)}",
            "content_type": content_type.value,
            "user_id": user_id,
            "result": result.value,
            "risk_score": risk_score,
            "violations": violations,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        self._moderation_logs.append(log_entry)
        if len(self._moderation_logs) > self._MAX_LOGS:
            self._moderation_logs = self._moderation_logs[-self._MAX_LOGS:]
        
        # Track user violations
        if user_id and violations:
            await self._track_user_violation(user_id, violations, risk_score)
        
        return {
            "result": result.value,
            "risk_score": risk_score,
            "violations": violations,
            "requires_review": result in [ModerationResult.PENDING_REVIEW, ModerationResult.FLAGGED],
            "action_taken": self._get_action_message(result)
        }
    
    async def report_content(
        self,
        reporter_id: int,
        reported_user_id: int,
        content_type: ModerationContentType,
        content_id: str,
        violation_type: ViolationType,
        description: str
    ) -> Dict[str, Any]:
        """Submit a user report."""
        report_id = f"report_{secrets.token_urlsafe(12)}"
        
        report = {
            "id": report_id,
            "reporter_id": reporter_id,
            "reported_user_id": reported_user_id,
            "content_type": content_type.value,
            "content_id": content_id,
            "violation_type": violation_type.value,
            "description": description,
            "status": ReportStatus.PENDING.value,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "resolved_at": None,
            "resolution": None,
            "moderator_notes": None
        }
        
        if len(self._reports) >= self._MAX_REPORTS:
            oldest_key = next(iter(self._reports))
            del self._reports[oldest_key]
        self._reports[report_id] = report
        
        logger.info(f"Content report submitted: {report_id}")
        
        return report
    
    async def get_report(
        self,
        report_id: str
    ) -> Optional[Dict[str, Any]]:
        """Get report details."""
        return self._reports.get(report_id)
    
    async def list_reports(
        self,
        status: Optional[ReportStatus] = None,
        user_id: Optional[int] = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """List reports with filters."""
        reports = list(self._reports.values())
        
        if status:
            reports = [r for r in reports if r["status"] == status.value]
        
        if user_id:
            reports = [r for r in reports if r["reported_user_id"] == user_id]
        
        # Sort by creation date descending
        reports.sort(key=lambda x: x["created_at"], reverse=True)
        
        return reports[:limit]
    
    async def resolve_report(
        self,
        report_id: str,
        resolution: str,
        moderator_notes: Optional[str] = None,
        take_action: bool = False
    ) -> Optional[Dict[str, Any]]:
        """Resolve a report."""
        report = self._reports.get(report_id)
        
        if not report:
            return None
        
        report["status"] = ReportStatus.RESOLVED.value
        report["resolved_at"] = datetime.now(timezone.utc).isoformat()
        report["resolution"] = resolution
        report["moderator_notes"] = moderator_notes
        
        # Take action against user if needed
        if take_action:
            user_id = report["reported_user_id"]
            await self._apply_penalty(user_id, report["violation_type"])
        
        return report
    
    async def get_user_reputation(
        self,
        user_id: int
    ) -> Dict[str, Any]:
        """Get user's reputation score."""
        reputation = self._user_reputation[user_id]
        violations = self._user_violations.get(user_id, [])
        
        # Calculate trust level
        if reputation >= 90:
            trust_level = "excellent"
        elif reputation >= 70:
            trust_level = "good"
        elif reputation >= 50:
            trust_level = "fair"
        elif reputation >= 30:
            trust_level = "poor"
        else:
            trust_level = "untrusted"
        
        return {
            "user_id": user_id,
            "reputation_score": reputation,
            "trust_level": trust_level,
            "total_violations": len(violations),
            "recent_violations": violations[-5:],
            "is_blocked": user_id in self._blocked_users
        }
    
    async def is_user_blocked(
        self,
        user_id: int
    ) -> Dict[str, Any]:
        """Check if user is blocked."""
        if user_id not in self._blocked_users:
            return {"blocked": False}
        
        block_until = self._blocked_users[user_id]
        
        if datetime.now(timezone.utc) > block_until:
            del self._blocked_users[user_id]
            return {"blocked": False}
        
        return {
            "blocked": True,
            "blocked_until": block_until.isoformat(),
            "remaining_seconds": (block_until - datetime.now(timezone.utc)).seconds
        }
    
    async def get_moderation_stats(self) -> Dict[str, Any]:
        """Get moderation statistics."""
        total = len(self._moderation_logs)
        
        by_result = defaultdict(int)
        by_violation = defaultdict(int)
        
        for log in self._moderation_logs:
            by_result[log["result"]] += 1
            for v in log["violations"]:
                by_violation[v["type"]] += 1
        
        pending_reports = sum(
            1 for r in self._reports.values()
            if r["status"] == ReportStatus.PENDING.value
        )
        
        return {
            "total_moderations": total,
            "by_result": dict(by_result),
            "by_violation_type": dict(by_violation),
            "pending_reports": pending_reports,
            "total_reports": len(self._reports),
            "blocked_users": len(self._blocked_users)
        }
    
    def _check_profanity(self, text: str) -> List[str]:
        """Check text for profanity."""
        words = text.lower().split()
        found = []
        
        for word in words:
            # Remove punctuation
            clean_word = re.sub(r'[^\w]', '', word)
            if clean_word in PROFANITY_WORDS:
                found.append(clean_word)
        
        return found
    
    def _check_spam(self, text: str) -> List[str]:
        """Check text for spam patterns."""
        matches = []
        text_lower = text.lower()
        
        for pattern in SPAM_PATTERNS:
            if re.search(pattern, text_lower, re.IGNORECASE):
                matches.append(pattern)
        
        return matches
    
    def _check_pii(
        self,
        text: str,
        content_type: ModerationContentType
    ) -> List[str]:
        """Check for personal information."""
        # Only flag PII in public contexts
        if content_type not in [ModerationContentType.PROJECT, ModerationContentType.PROFILE, ModerationContentType.REVIEW]:
            return []
        
        found = []
        for pattern in PII_PATTERNS:
            matches = re.findall(pattern, text)
            if matches:
                found.extend(matches)
        
        return found
    
    def _check_scam_indicators(self, text: str) -> bool:
        """Check for scam indicators."""
        scam_phrases = [
            "send money",
            "wire transfer",
            "western union",
            "gift card",
            "advance payment",
            "pay upfront",
            "too good to be true",
            "guaranteed income",
            "work from home $",
            "make money fast"
        ]
        
        text_lower = text.lower()
        return any(phrase in text_lower for phrase in scam_phrases)
    
    async def _track_user_violation(
        self,
        user_id: int,
        violations: List[Dict[str, Any]],
        risk_score: float
    ) -> None:
        """Track user violations and update reputation."""
        for violation in violations:
            violations_list = self._user_violations[user_id]
            if len(violations_list) >= self._MAX_VIOLATIONS_PER_USER:
                self._user_violations[user_id] = violations_list[-self._MAX_VIOLATIONS_PER_USER + 1:]
            self._user_violations[user_id].append({
                **violation,
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
        
        # Reduce reputation based on risk score
        penalty = risk_score / 10.0
        self._user_reputation[user_id] = max(0, self._user_reputation[user_id] - penalty)
        
        # Check for automatic blocking
        if self._user_reputation[user_id] < 20:
            self._blocked_users[user_id] = datetime.now(timezone.utc) + timedelta(days=7)
            logger.warning(f"User {user_id} auto-blocked due to low reputation")
    
    async def _apply_penalty(
        self,
        user_id: int,
        violation_type: str
    ) -> None:
        """Apply penalty to user."""
        # Reduce reputation
        penalties = {
            ViolationType.PROFANITY.value: 10,
            ViolationType.SPAM.value: 20,
            ViolationType.HARASSMENT.value: 30,
            ViolationType.HATE_SPEECH.value: 40,
            ViolationType.SCAM.value: 50,
            ViolationType.ADULT_CONTENT.value: 25,
        }
        
        penalty = penalties.get(violation_type, 15)
        self._user_reputation[user_id] = max(0, self._user_reputation[user_id] - penalty)
        
        # Block if too many violations
        recent_violations = [
            v for v in self._user_violations[user_id]
            if datetime.fromisoformat(v["timestamp"]) > datetime.now(timezone.utc) - timedelta(days=30)
        ]
        
        if len(recent_violations) >= 5:
            self._blocked_users[user_id] = datetime.now(timezone.utc) + timedelta(days=30)
    
    def _get_action_message(self, result: ModerationResult) -> str:
        """Get action message for result."""
        messages = {
            ModerationResult.APPROVED: "Content approved",
            ModerationResult.FLAGGED: "Content flagged for potential issues",
            ModerationResult.REJECTED: "Content rejected - violates community guidelines",
            ModerationResult.PENDING_REVIEW: "Content held for manual review"
        }
        return messages.get(result, "Unknown")


# Singleton instance
_moderation_service: Optional[ContentModerationService] = None


def get_moderation_service(db: Session) -> ContentModerationService:
    """Get or create moderation service instance."""
    global _moderation_service
    if _moderation_service is None:
        _moderation_service = ContentModerationService(db)
    else:
        _moderation_service.db = db
    return _moderation_service
