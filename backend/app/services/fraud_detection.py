# @AI-HINT: AI-powered fraud detection service with multi-signal analysis, velocity checks, and behavioral patterns
"""
Fraud Detection Service v2.0
Multi-signal fraud detection with behavioral analysis, velocity tracking,
content similarity detection, and configurable risk thresholds.
"""

from typing import Dict, Any, List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta, timezone
import logging
import json
import re

from app.models.user import User
from app.models.project import Project
from app.models.proposal import Proposal
from app.models.payment import Payment
from app.models.contract import Contract

logger = logging.getLogger(__name__)


class FraudDetectionService:
    """
    Multi-signal fraud detection service with:
    - Behavioral velocity tracking (rapid actions)
    - Content quality analysis
    - Financial pattern detection
    - Cross-entity correlation (user-project-proposal chains)
    - Configurable thresholds per risk category
    """

    RISK_LEVELS = {
        'low': (0, 25),
        'medium': (25, 50),
        'high': (50, 75),
        'critical': (75, 100),
    }

    # Configurable thresholds
    THRESHOLDS = {
        'max_proposals_per_hour': 10,
        'max_projects_per_hour': 5,
        'max_proposals_per_day': 50,
        'min_account_age_days': 1,
        'min_description_length': 50,
        'min_cover_letter_length': 50,
        'max_budget_amount': 100000,
        'min_budget_amount': 10,
        'bid_over_budget_ratio': 2.0,
        'bid_under_budget_ratio': 0.2,
        'max_disputed_payments': 2,
        'max_failed_payments': 3,
        'high_cancellation_rate': 0.4,
    }

    # Suspicious content patterns (case-insensitive)
    SUSPICIOUS_PATTERNS = [
        (r'\b(hack|hacking|exploit)\b', 15, 'security_threat'),
        (r'\b(illegal|illicit|unlawful)\b', 20, 'illegal_activity'),
        (r'\b(password\s*crack|brute\s*force)\b', 25, 'security_threat'),
        (r'\b(money\s*launder|launder)\b', 25, 'financial_crime'),
        (r'\b(counterfeit|fake\s*id|forged)\b', 20, 'identity_fraud'),
        (r'\b(phishing|scam)\b', 20, 'phishing'),
        (r'\b(guaranteed\s*return|get\s*rich\s*quick)\b', 15, 'scam'),
        (r'(western\s*union|moneygram|wire\s*transfer\s*only)\b', 15, 'payment_scam'),
    ]

    def __init__(self, db: Session):
        self.db = db

    async def analyze_user(self, user_id: int) -> Dict[str, Any]:
        """Comprehensive user fraud analysis with multi-signal scoring."""
        try:
            user = self.db.query(User).filter(User.id == user_id).first()
            if not user:
                return {'error': 'User not found'}

            risk_score = 0
            flags = []
            signals: Dict[str, Dict[str, Any]] = {}

            # 1. Account age signal
            account_age = self._check_account_age(user)
            risk_score += account_age['score']
            flags.extend(account_age['flags'])
            signals['account_age'] = account_age

            # 2. Verification signal
            verification = self._check_verification(user)
            risk_score += verification['score']
            flags.extend(verification['flags'])
            signals['verification'] = verification

            # 3. Profile completeness signal
            profile = self._check_profile_completeness(user)
            risk_score += profile['score']
            flags.extend(profile['flags'])
            signals['profile'] = profile

            # 4. Activity velocity
            velocity = await self._analyze_velocity(user_id)
            risk_score += velocity['score']
            flags.extend(velocity['flags'])
            signals['velocity'] = velocity

            # 5. Payment history
            payment = await self._analyze_payment_history(user_id)
            risk_score += payment['score']
            flags.extend(payment['flags'])
            signals['payment'] = payment

            # 6. Contract completion rate
            completion = self._analyze_completion_rate(user_id)
            risk_score += completion['score']
            flags.extend(completion['flags'])
            signals['completion'] = completion

            # 7. Content quality across proposals
            content = self._analyze_content_patterns(user_id)
            risk_score += content['score']
            flags.extend(content['flags'])
            signals['content'] = content

            risk_score = min(risk_score, 100)
            risk_level = self._get_risk_level(risk_score)

            return {
                'user_id': user_id,
                'risk_score': risk_score,
                'risk_level': risk_level,
                'flags': flags,
                'signals': signals,
                'recommendations': self._get_recommendations(risk_level, flags),
                'analyzed_at': datetime.now(timezone.utc).isoformat(),
            }

        except Exception as e:
            logger.error(f"Error analyzing user fraud risk: {e}")
            return {'error': str(e)}

    def _check_account_age(self, user: User) -> Dict[str, Any]:
        """Score based on account age."""
        score = 0
        flags = []
        try:
            age_days = (datetime.now(timezone.utc) - user.created_at).days
        except (TypeError, AttributeError):
            age_days = 999

        if age_days < 1:
            score += 20
            flags.append('Very new account (< 1 day old)')
        elif age_days < 7:
            score += 8
            flags.append('New account (< 1 week old)')
        elif age_days < 30:
            score += 3

        return {'score': score, 'flags': flags, 'age_days': age_days}

    def _check_verification(self, user: User) -> Dict[str, Any]:
        """Score based on verification status."""
        score = 0
        flags = []
        if not getattr(user, 'is_verified', False):
            score += 12
            flags.append('Unverified account')
        if not getattr(user, 'email_verified', getattr(user, 'is_verified', False)):
            score += 5
            flags.append('Email not verified')
        return {'score': score, 'flags': flags}

    def _check_profile_completeness(self, user: User) -> Dict[str, Any]:
        """Score based on profile data quality."""
        score = 0
        flags = []
        missing = []

        profile_data = {}
        if user.profile_data:
            try:
                profile_data = json.loads(user.profile_data) if isinstance(user.profile_data, str) else (user.profile_data or {})
            except (json.JSONDecodeError, TypeError, ValueError):
                profile_data = {}

        bio = getattr(user, 'bio', None) or profile_data.get('bio', '')
        skills = getattr(user, 'skills', None) or profile_data.get('skills', '')

        if not bio:
            missing.append('bio')
        if not skills:
            missing.append('skills')
        if not getattr(user, 'location', None):
            missing.append('location')
        if not getattr(user, 'profile_image_url', None):
            missing.append('profile_image')

        if len(missing) >= 3:
            score += 12
            flags.append(f'Largely incomplete profile (missing: {", ".join(missing)})')
        elif len(missing) >= 1:
            score += 5
            flags.append(f'Partial profile (missing: {", ".join(missing)})')

        return {'score': score, 'flags': flags, 'missing_fields': missing}

    async def _analyze_velocity(self, user_id: int) -> Dict[str, Any]:
        """Detect rapid/burst activity patterns."""
        score = 0
        flags = []

        now = datetime.now(timezone.utc)
        one_hour_ago = now - timedelta(hours=1)
        one_day_ago = now - timedelta(days=1)

        # Proposals per hour
        proposals_1h = self.db.query(Proposal).filter(
            Proposal.freelancer_id == user_id,
            Proposal.created_at >= one_hour_ago,
        ).count()

        if proposals_1h > self.THRESHOLDS['max_proposals_per_hour']:
            score += 20
            flags.append(f'Rapid proposal submissions ({proposals_1h} in 1 hour)')
        elif proposals_1h > self.THRESHOLDS['max_proposals_per_hour'] // 2:
            score += 8
            flags.append(f'Elevated proposal rate ({proposals_1h} in 1 hour)')

        # Proposals per day
        proposals_24h = self.db.query(Proposal).filter(
            Proposal.freelancer_id == user_id,
            Proposal.created_at >= one_day_ago,
        ).count()

        if proposals_24h > self.THRESHOLDS['max_proposals_per_day']:
            score += 15
            flags.append(f'Very high daily proposal volume ({proposals_24h} in 24 hours)')

        # Projects per hour (clients)
        projects_1h = self.db.query(Project).filter(
            Project.client_id == user_id,
            Project.created_at >= one_hour_ago,
        ).count()

        if projects_1h > self.THRESHOLDS['max_projects_per_hour']:
            score += 15
            flags.append(f'Rapid project creation ({projects_1h} in 1 hour)')

        return {'score': score, 'flags': flags, 'proposals_1h': proposals_1h, 'proposals_24h': proposals_24h}

    async def _analyze_payment_history(self, user_id: int) -> Dict[str, Any]:
        """Analyze payment patterns for financial red flags."""
        score = 0
        flags = []

        disputed = self.db.query(Payment).filter(
            Payment.from_user_id == user_id,
            Payment.status == 'disputed',
        ).count()

        if disputed > self.THRESHOLDS['max_disputed_payments']:
            score += 25
            flags.append(f'Multiple disputed payments ({disputed})')
        elif disputed > 0:
            score += 8
            flags.append(f'Has disputed payment(s) ({disputed})')

        failed = self.db.query(Payment).filter(
            Payment.from_user_id == user_id,
            Payment.status == 'failed',
        ).count()

        if failed > self.THRESHOLDS['max_failed_payments']:
            score += 15
            flags.append(f'Multiple failed payments ({failed})')

        # Check for unusual payment amounts
        recent_payments = self.db.query(Payment).filter(
            Payment.from_user_id == user_id,
            Payment.created_at >= datetime.now(timezone.utc) - timedelta(days=30),
        ).all()

        if recent_payments:
            amounts = [p.amount for p in recent_payments if p.amount]
            if amounts:
                avg_amount = sum(amounts) / len(amounts)
                outliers = [a for a in amounts if a > avg_amount * 5]
                if outliers:
                    score += 10
                    flags.append(f'Unusual payment amount spike detected ({len(outliers)} outlier(s))')

        return {'score': score, 'flags': flags, 'disputed': disputed, 'failed': failed}

    def _analyze_completion_rate(self, user_id: int) -> Dict[str, Any]:
        """Analyze contract completion vs cancellation rate."""
        score = 0
        flags = []

        total_contracts = self.db.query(Contract).filter(
            (Contract.freelancer_id == user_id) | (Contract.client_id == user_id)
        ).count()

        if total_contracts == 0:
            return {'score': 0, 'flags': [], 'completion_rate': None}

        cancelled = self.db.query(Contract).filter(
            ((Contract.freelancer_id == user_id) | (Contract.client_id == user_id)),
            Contract.status == 'cancelled',
        ).count()

        cancellation_rate = cancelled / total_contracts if total_contracts > 0 else 0

        if cancellation_rate > self.THRESHOLDS['high_cancellation_rate'] and total_contracts >= 3:
            score += 15
            flags.append(f'High cancellation rate ({cancellation_rate:.0%} of {total_contracts} contracts)')
        elif cancellation_rate > 0.25 and total_contracts >= 5:
            score += 8
            flags.append(f'Elevated cancellation rate ({cancellation_rate:.0%})')

        return {'score': score, 'flags': flags, 'completion_rate': 1 - cancellation_rate, 'total_contracts': total_contracts}

    def _analyze_content_patterns(self, user_id: int) -> Dict[str, Any]:
        """Analyze proposals/projects for suspicious content patterns."""
        score = 0
        flags = []

        # Check recent proposals for suspicious patterns
        recent_proposals = self.db.query(Proposal).filter(
            Proposal.freelancer_id == user_id,
        ).order_by(Proposal.created_at.desc()).limit(20).all()

        # Detect copy-paste proposals (high text similarity)
        cover_letters = [p.cover_letter for p in recent_proposals if p.cover_letter and len(p.cover_letter) > 30]
        if len(cover_letters) >= 3:
            duplicate_count = self._detect_duplicates(cover_letters)
            if duplicate_count >= 3:
                score += 15
                flags.append(f'Detected {duplicate_count} near-duplicate proposals (possible copy-paste spam)')
            elif duplicate_count >= 2:
                score += 5
                flags.append('Some proposals appear very similar')

        # Check for suspicious keywords in user content
        all_text = ' '.join(cover_letters)
        for pattern, pattern_score, fraud_type in self.SUSPICIOUS_PATTERNS:
            if re.search(pattern, all_text, re.IGNORECASE):
                score += min(pattern_score, 10)  # Cap per-pattern contribution
                flags.append(f'Suspicious content detected ({fraud_type})')
                break  # Only flag once for content

        return {'score': score, 'flags': flags}

    def _detect_duplicates(self, texts: List[str]) -> int:
        """Simple duplicate detection using character-level overlap."""
        duplicates = 0
        for i in range(len(texts)):
            for j in range(i + 1, len(texts)):
                a, b = texts[i].lower().strip(), texts[j].lower().strip()
                if len(a) < 30 or len(b) < 30:
                    continue
                # Use substring overlap ratio
                shorter = min(len(a), len(b))
                longer = max(len(a), len(b))
                if shorter / longer > 0.8:
                    # Check character-level similarity
                    matches = sum(1 for ca, cb in zip(a, b) if ca == cb)
                    similarity = matches / shorter
                    if similarity > 0.85:
                        duplicates += 1
        return duplicates

    async def analyze_project(self, project_id: int) -> Dict[str, Any]:
        """Analyze project for fraudulent characteristics with multi-signal scoring."""
        try:
            project = self.db.query(Project).filter(Project.id == project_id).first()
            if not project:
                return {'error': 'Project not found'}

            risk_score = 0
            flags = []
            signals: Dict[str, Dict[str, Any]] = {}

            # 1. Content analysis
            content = self._analyze_project_content(project)
            risk_score += content['score']
            flags.extend(content['flags'])
            signals['content'] = content

            # 2. Budget reasonableness
            budget = self._analyze_budget(project)
            risk_score += budget['score']
            flags.extend(budget['flags'])
            signals['budget'] = budget

            # 3. Client reputation
            client_risk = await self.analyze_user(project.client_id)
            client_score = 0
            if isinstance(client_risk, dict) and client_risk.get('risk_level') in ['high', 'critical']:
                client_score = 20
                flags.append('Client has elevated fraud risk')
            elif isinstance(client_risk, dict) and client_risk.get('risk_level') == 'medium':
                client_score = 8
            signals['client'] = {'score': client_score, 'risk_level': client_risk.get('risk_level', 'unknown')}
            risk_score += client_score

            risk_score = min(risk_score, 100)
            risk_level = self._get_risk_level(risk_score)

            return {
                'project_id': project_id,
                'risk_score': risk_score,
                'risk_level': risk_level,
                'flags': flags,
                'signals': signals,
                'recommendations': self._get_recommendations(risk_level, flags),
                'analyzed_at': datetime.now(timezone.utc).isoformat(),
            }

        except Exception as e:
            logger.error(f"Error analyzing project fraud risk: {e}")
            return {'error': str(e)}

    def _analyze_project_content(self, project: Project) -> Dict[str, Any]:
        """Analyze project title and description for red flags."""
        score = 0
        flags = []

        description = project.description or ''
        title = project.title or ''
        combined = f"{title} {description}".lower()

        # Suspicious pattern matching
        for pattern, pattern_score, fraud_type in self.SUSPICIOUS_PATTERNS:
            if re.search(pattern, combined, re.IGNORECASE):
                score += pattern_score
                flags.append(f'Suspicious content: {fraud_type}')

        # Description quality
        if len(description) < self.THRESHOLDS['min_description_length']:
            score += 8
            flags.append('Very short or missing project description')

        # Check for excessive urgency signals
        urgency_words = ['urgent', 'asap', 'immediately', 'right now', 'today only']
        urgency_count = sum(1 for w in urgency_words if w in combined)
        if urgency_count >= 3:
            score += 10
            flags.append('Excessive urgency language detected')

        return {'score': score, 'flags': flags}

    def _analyze_budget(self, project: Project) -> Dict[str, Any]:
        """Analyze budget for reasonableness."""
        score = 0
        flags = []

        if project.budget_max and project.budget_max > self.THRESHOLDS['max_budget_amount']:
            score += 15
            flags.append(f'Unusually high budget (${project.budget_max:,.0f})')
        elif project.budget_max and project.budget_max < self.THRESHOLDS['min_budget_amount']:
            score += 12
            flags.append(f'Unusually low budget (${project.budget_max:,.0f})')

        # Check for suspicious budget ranges
        if project.budget_min and project.budget_max:
            if project.budget_max > project.budget_min * 20:
                score += 8
                flags.append('Very wide budget range (potentially misleading)')

        return {'score': score, 'flags': flags}

    async def analyze_proposal(self, proposal_id: int) -> Dict[str, Any]:
        """Analyze proposal for suspicious activity with multi-signal scoring."""
        try:
            proposal = self.db.query(Proposal).filter(Proposal.id == proposal_id).first()
            if not proposal:
                return {'error': 'Proposal not found'}

            risk_score = 0
            flags = []
            signals: Dict[str, Dict[str, Any]] = {}

            # 1. Bid amount analysis
            bid = self._analyze_bid_amount(proposal)
            risk_score += bid['score']
            flags.extend(bid['flags'])
            signals['bid'] = bid

            # 2. Cover letter quality
            cover = self._analyze_cover_letter(proposal)
            risk_score += cover['score']
            flags.extend(cover['flags'])
            signals['cover_letter'] = cover

            # 3. Freelancer reputation
            freelancer_risk = await self.analyze_user(proposal.freelancer_id)
            freelancer_score = 0
            if isinstance(freelancer_risk, dict) and freelancer_risk.get('risk_level') in ['high', 'critical']:
                freelancer_score = 20
                flags.append('Freelancer has elevated fraud risk')
            elif isinstance(freelancer_risk, dict) and freelancer_risk.get('risk_level') == 'medium':
                freelancer_score = 5
            signals['freelancer'] = {'score': freelancer_score, 'risk_level': freelancer_risk.get('risk_level', 'unknown')}
            risk_score += freelancer_score

            risk_score = min(risk_score, 100)
            risk_level = self._get_risk_level(risk_score)

            return {
                'proposal_id': proposal_id,
                'risk_score': risk_score,
                'risk_level': risk_level,
                'flags': flags,
                'signals': signals,
                'recommendations': self._get_recommendations(risk_level, flags),
                'analyzed_at': datetime.now(timezone.utc).isoformat(),
            }

        except Exception as e:
            logger.error(f"Error analyzing proposal fraud risk: {e}")
            return {'error': str(e)}

    def _analyze_bid_amount(self, proposal: Proposal) -> Dict[str, Any]:
        """Analyze bid amount relative to project budget."""
        score = 0
        flags = []
        project = proposal.project

        if project and project.budget_max and proposal.bid_amount:
            ratio = proposal.bid_amount / project.budget_max
            if ratio > self.THRESHOLDS['bid_over_budget_ratio']:
                score += 18
                flags.append(f'Bid {ratio:.1f}x higher than project budget')
            elif ratio < self.THRESHOLDS['bid_under_budget_ratio']:
                score += 12
                flags.append(f'Suspiciously low bid ({ratio:.0%} of budget)')

        return {'score': score, 'flags': flags}

    def _analyze_cover_letter(self, proposal: Proposal) -> Dict[str, Any]:
        """Analyze cover letter quality and content."""
        score = 0
        flags = []
        letter = proposal.cover_letter or ''

        if len(letter) < self.THRESHOLDS['min_cover_letter_length']:
            score += 8
            flags.append('Very short or missing cover letter')

        # Check for suspicious patterns in cover letter
        for pattern, pattern_score, fraud_type in self.SUSPICIOUS_PATTERNS:
            if re.search(pattern, letter, re.IGNORECASE):
                score += min(pattern_score, 10)
                flags.append(f'Suspicious content in cover letter ({fraud_type})')
                break

        return {'score': score, 'flags': flags}

    def _get_risk_level(self, risk_score: int) -> str:
        """Determine risk level from score."""
        for level, (min_score, max_score) in self.RISK_LEVELS.items():
            if min_score <= risk_score <= max_score:
                return level
        return 'critical'

    def _get_recommendations(self, risk_level: str, flags: List[str]) -> List[str]:
        """Get actionable recommendations based on risk level and flags."""
        recommendations = []

        if risk_level == 'low':
            recommendations.append('Continue standard monitoring')
        elif risk_level == 'medium':
            recommendations.append('Increase monitoring frequency')
            if any('unverified' in f.lower() for f in flags):
                recommendations.append('Prompt user to complete verification')
            if any('incomplete' in f.lower() or 'missing' in f.lower() for f in flags):
                recommendations.append('Encourage profile completion for trust score improvement')
        elif risk_level == 'high':
            recommendations.append('Require additional identity verification')
            recommendations.append('Limit transaction amounts temporarily')
            recommendations.append('Flag for manual review')
            if any('payment' in f.lower() for f in flags):
                recommendations.append('Hold pending payouts for review')
        elif risk_level == 'critical':
            recommendations.append('URGENT: Suspend account pending investigation')
            recommendations.append('Block all financial transactions')
            recommendations.append('Preserve all evidence and activity logs')
            recommendations.append('Escalate to fraud team immediately')

        return recommendations


# Enum types for the API
from enum import Enum

class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class FraudType(str, Enum):
    PAYMENT = "payment"
    IDENTITY = "identity"
    ACCOUNT_TAKEOVER = "account_takeover"
    FAKE_REVIEW = "fake_review"
    MANIPULATION = "manipulation"
    SPAM = "spam"
    PHISHING = "phishing"


class AlertStatus(str, Enum):
    OPEN = "open"
    INVESTIGATING = "investigating"
    RESOLVED = "resolved"
    FALSE_POSITIVE = "false_positive"


def get_fraud_detection_service(db: Session) -> FraudDetectionService:
    """Get fraud detection service instance"""
    return FraudDetectionService(db)
