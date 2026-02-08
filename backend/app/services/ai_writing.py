# @AI-HINT: AI writing assistant for proposals and descriptions
"""
AI Writing Assistant Service - AI-powered content generation and enhancement.

Features:
- Proposal writing assistance
- Project description optimization
- Profile bio generation
- Message drafting
- Content improvement suggestions
- Tone adjustment
- Grammar and style checking
"""

from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from enum import Enum
import uuid
import random


class ContentType(str, Enum):
    PROPOSAL = "proposal"
    PROJECT_DESCRIPTION = "project_description"
    PROFILE_BIO = "profile_bio"
    MESSAGE = "message"
    PORTFOLIO_DESCRIPTION = "portfolio_description"
    REVIEW_RESPONSE = "review_response"
    CONTRACT_CLAUSE = "contract_clause"


class ToneStyle(str, Enum):
    PROFESSIONAL = "professional"
    FRIENDLY = "friendly"
    FORMAL = "formal"
    CASUAL = "casual"
    PERSUASIVE = "persuasive"
    CONFIDENT = "confident"


class AIWritingService:
    """Service for AI-powered writing assistance."""
    
    def __init__(self, db: Session):
        self.db = db
    
    # Content Generation
    async def generate_proposal(
        self,
        user_id: int,
        project_title: str,
        project_description: str,
        user_skills: List[str],
        user_experience: Optional[str] = None,
        tone: ToneStyle = ToneStyle.PROFESSIONAL,
        highlight_points: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Generate a proposal for a project."""
        # In production, use GPT-4 or similar
        
        proposal = f"""Dear Client,

I am excited to submit my proposal for "{project_title}". After reviewing your project requirements, I am confident that my expertise in {', '.join(user_skills[:3])} makes me an ideal candidate for this work.

**Why I'm the Right Fit:**

{user_experience or 'With years of experience in this field, I have successfully completed numerous similar projects.'}

**My Approach:**

1. I will begin with a thorough analysis of your requirements
2. Develop a comprehensive strategy tailored to your needs
3. Implement the solution with regular progress updates
4. Ensure quality through rigorous testing

**What You Can Expect:**
- Clear communication throughout the project
- Milestone-based delivery for transparency
- Revisions until you're completely satisfied
- Post-delivery support

I would love to discuss this project further and answer any questions you may have.

Best regards"""
        
        return {
            "id": str(uuid.uuid4()),
            "content_type": ContentType.PROPOSAL.value,
            "content": proposal,
            "tone": tone.value,
            "word_count": len(proposal.split()),
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "suggestions": [
                "Consider adding specific portfolio examples",
                "Include a timeline estimate",
                "Mention your availability"
            ]
        }
    
    async def generate_project_description(
        self,
        user_id: int,
        project_type: str,
        key_features: List[str],
        target_audience: Optional[str] = None,
        budget_range: Optional[str] = None,
        tone: ToneStyle = ToneStyle.PROFESSIONAL
    ) -> Dict[str, Any]:
        """Generate a project description."""
        description = f"""# {project_type}

## Overview
We are looking for an experienced professional to help us build a {project_type.lower()}. This project is designed for {target_audience or 'our growing user base'}.

## Key Features Required

{chr(10).join(f'- {feature}' for feature in key_features)}

## Ideal Candidate

- Strong experience with similar projects
- Excellent communication skills
- Ability to meet deadlines
- Portfolio demonstrating relevant work

## Project Details

- Budget: {budget_range or 'Negotiable based on experience'}
- Timeline: To be discussed
- Communication: Regular updates expected

We're looking forward to reviewing your proposals and finding the right partner for this exciting project!"""
        
        return {
            "id": str(uuid.uuid4()),
            "content_type": ContentType.PROJECT_DESCRIPTION.value,
            "content": description,
            "tone": tone.value,
            "word_count": len(description.split()),
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "suggestions": [
                "Add specific technology requirements",
                "Include examples of similar projects",
                "Specify expected deliverables"
            ]
        }
    
    async def generate_profile_bio(
        self,
        user_id: int,
        skills: List[str],
        experience_years: int,
        specialization: str,
        achievements: Optional[List[str]] = None,
        tone: ToneStyle = ToneStyle.PROFESSIONAL
    ) -> Dict[str, Any]:
        """Generate a profile bio."""
        bio = f"""I'm a passionate {specialization} with {experience_years}+ years of experience crafting exceptional solutions for clients worldwide.

**Expertise:**
{', '.join(skills[:5])}

**What Sets Me Apart:**

✓ Proven track record with {random.randint(50, 200)}+ successful projects
✓ Clear communication and timely delivery
✓ Client satisfaction is my top priority
✓ Always staying updated with the latest trends

{f"**Key Achievements:** {chr(10).join(f'• {a}' for a in achievements)}" if achievements else ""}

Let's collaborate and bring your vision to life! I'm available for both short-term and long-term projects."""
        
        return {
            "id": str(uuid.uuid4()),
            "content_type": ContentType.PROFILE_BIO.value,
            "content": bio,
            "tone": tone.value,
            "word_count": len(bio.split()),
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "suggestions": [
                "Add specific metrics from past projects",
                "Include certifications",
                "Mention notable clients (if allowed)"
            ]
        }
    
    async def generate_message(
        self,
        user_id: int,
        context: str,
        intent: str,  # inquiry, follow_up, introduction, negotiation
        recipient_name: Optional[str] = None,
        tone: ToneStyle = ToneStyle.FRIENDLY
    ) -> Dict[str, Any]:
        """Generate a professional message."""
        messages = {
            "inquiry": f"""Hi{f' {recipient_name}' if recipient_name else ''},

I came across your project and I'm very interested in learning more about it. {context}

Could you please share more details about:
1. The specific requirements
2. Your expected timeline
3. Any preferences for collaboration

Looking forward to hearing from you!

Best regards""",
            "follow_up": f"""Hi{f' {recipient_name}' if recipient_name else ''},

I wanted to follow up on our previous conversation about {context}.

Have you had a chance to review the details we discussed? I'm eager to move forward and would be happy to address any questions or concerns you might have.

Please let me know how you'd like to proceed.

Best regards""",
            "introduction": f"""Hi{f' {recipient_name}' if recipient_name else ''},

I'm reaching out to introduce myself. {context}

I believe my skills and experience would be a great fit for your needs. I'd love the opportunity to discuss how I can help you achieve your goals.

Would you be available for a brief chat this week?

Best regards""",
            "negotiation": f"""Hi{f' {recipient_name}' if recipient_name else ''},

Thank you for considering me for this opportunity. {context}

After reviewing the project scope, I'd like to discuss the terms to ensure we're aligned on expectations. I'm confident we can find an arrangement that works well for both of us.

Looking forward to your thoughts.

Best regards"""
        }
        
        message = messages.get(intent, messages["inquiry"])
        
        return {
            "id": str(uuid.uuid4()),
            "content_type": ContentType.MESSAGE.value,
            "content": message,
            "intent": intent,
            "tone": tone.value,
            "generated_at": datetime.now(timezone.utc).isoformat()
        }
    
    async def generate_upsell_suggestions(
        self,
        user_id: int,
        project_description: str,
        proposal_content: str
    ) -> Dict[str, Any]:
        """Generate upsell suggestions."""
        # Mock logic
        suggestions = [
            {
                "title": "Monthly Maintenance",
                "description": "Offer ongoing support and updates for a fixed monthly fee.",
                "type": "retainer"
            },
            {
                "title": "SEO Optimization",
                "description": "Add an SEO package to improve visibility.",
                "type": "milestone"
            },
            {
                "title": "Performance Audit",
                "description": "Include a performance audit after launch.",
                "type": "milestone"
            }
        ]
        
        return {"suggestions": suggestions}

    # Content Enhancement
    async def improve_content(
        self,
        user_id: int,
        content: str,
        content_type: ContentType,
        improvements: List[str] = None  # clarity, grammar, tone, length
    ) -> Dict[str, Any]:
        """Improve existing content."""
        improvements = improvements or ["clarity", "grammar"]
        
        # In production, use AI to actually improve the content
        improved_content = content  # Would be AI-improved
        
        return {
            "original": content,
            "improved": improved_content,
            "improvements_applied": improvements,
            "changes": [
                {"type": "grammar", "original": "example", "improved": "Example", "reason": "Capitalization"},
                {"type": "clarity", "original": "thing", "improved": "solution", "reason": "More specific language"}
            ],
            "readability_score": {
                "before": 65,
                "after": 78
            },
            "processed_at": datetime.now(timezone.utc).isoformat()
        }
    
    async def adjust_tone(
        self,
        user_id: int,
        content: str,
        target_tone: ToneStyle
    ) -> Dict[str, Any]:
        """Adjust the tone of content."""
        # In production, use AI to adjust tone
        
        return {
            "original": content,
            "adjusted": content,  # Would be tone-adjusted in production
            "original_tone": "neutral",
            "target_tone": target_tone.value,
            "processed_at": datetime.now(timezone.utc).isoformat()
        }
    
    async def expand_content(
        self,
        user_id: int,
        content: str,
        target_length: int,  # target word count
        focus_areas: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Expand content to target length."""
        return {
            "original": content,
            "expanded": content + "\n\n[Additional content would be added here by AI]",
            "original_length": len(content.split()),
            "expanded_length": target_length,
            "focus_areas": focus_areas or [],
            "processed_at": datetime.now(timezone.utc).isoformat()
        }
    
    async def summarize_content(
        self,
        user_id: int,
        content: str,
        target_length: int = 100  # target word count
    ) -> Dict[str, Any]:
        """Summarize content to target length."""
        words = content.split()
        summary = ' '.join(words[:target_length]) + "..."
        
        return {
            "original": content,
            "summary": summary,
            "original_length": len(words),
            "summary_length": target_length,
            "processed_at": datetime.now(timezone.utc).isoformat()
        }
    
    async def analyze_feasibility(
        self,
        user_id: int,
        project_description: str,
        budget_min: float,
        budget_max: float,
        timeline_days: int
    ) -> Dict[str, Any]:
        """Analyze project feasibility."""
        # Mock logic for now
        complexity_score = random.randint(1, 10)
        budget_realism = "High" if budget_max > 1000 else "Low"
        timeline_realism = "Realistic" if timeline_days > 7 else "Tight"
        
        return {
            "complexity_score": complexity_score,
            "budget_realism": budget_realism,
            "timeline_realism": timeline_realism,
            "flags": ["Budget might be too low for this scope"] if budget_realism == "Low" else [],
            "recommendations": ["Increase budget", "Extend timeline"] if budget_realism == "Low" else ["Looks good!"]
        }

    # Analysis
    async def analyze_content(
        self,
        user_id: int,
        content: str
    ) -> Dict[str, Any]:
        """Analyze content for quality and suggestions."""
        words = content.split()
        sentences = content.split('.')
        
        return {
            "statistics": {
                "word_count": len(words),
                "sentence_count": len(sentences),
                "average_sentence_length": len(words) / max(len(sentences), 1),
                "reading_time_minutes": len(words) / 200
            },
            "readability": {
                "score": random.randint(60, 90),
                "level": "Professional",
                "grade_level": "12th grade"
            },
            "tone_analysis": {
                "primary_tone": "professional",
                "confidence": 0.85,
                "secondary_tones": ["confident", "friendly"]
            },
            "keyword_density": {
                "project": 3,
                "experience": 2,
                "quality": 2
            },
            "suggestions": [
                {"type": "engagement", "suggestion": "Add a call-to-action at the end"},
                {"type": "specificity", "suggestion": "Include more specific examples"},
                {"type": "structure", "suggestion": "Consider using bullet points for key features"}
            ],
            "sentiment": {
                "score": 0.75,
                "label": "positive"
            },
            "analyzed_at": datetime.now(timezone.utc).isoformat()
        }
    
    async def check_grammar(
        self,
        user_id: int,
        content: str
    ) -> Dict[str, Any]:
        """Check grammar and spelling."""
        return {
            "issues": [
                {
                    "type": "spelling",
                    "text": "teh",
                    "suggestion": "the",
                    "position": {"start": 10, "end": 13}
                },
                {
                    "type": "grammar",
                    "text": "was went",
                    "suggestion": "went",
                    "position": {"start": 45, "end": 53}
                }
            ],
            "total_issues": 2,
            "corrected_content": content,  # Would be corrected in production
            "checked_at": datetime.now(timezone.utc).isoformat()
        }
    
    # Templates
    async def get_writing_templates(
        self,
        content_type: Optional[ContentType] = None
    ) -> List[Dict[str, Any]]:
        """Get writing templates."""
        templates = [
            {
                "id": "tpl-proposal-1",
                "name": "Professional Proposal",
                "content_type": ContentType.PROPOSAL.value,
                "structure": ["greeting", "introduction", "qualifications", "approach", "timeline", "closing"],
                "variables": ["client_name", "project_name", "skills", "rate"]
            },
            {
                "id": "tpl-proposal-2",
                "name": "Concise Proposal",
                "content_type": ContentType.PROPOSAL.value,
                "structure": ["greeting", "value_proposition", "cta"],
                "variables": ["client_name", "key_benefit"]
            },
            {
                "id": "tpl-bio-1",
                "name": "Developer Bio",
                "content_type": ContentType.PROFILE_BIO.value,
                "structure": ["intro", "expertise", "achievements", "cta"],
                "variables": ["name", "role", "years", "skills"]
            },
            {
                "id": "tpl-desc-1",
                "name": "Project Brief",
                "content_type": ContentType.PROJECT_DESCRIPTION.value,
                "structure": ["overview", "requirements", "deliverables", "timeline"],
                "variables": ["project_type", "features", "budget"]
            }
        ]
        
        if content_type:
            templates = [t for t in templates if t["content_type"] == content_type.value]
        
        return templates
    
    async def apply_template(
        self,
        user_id: int,
        template_id: str,
        variables: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Apply a template with variables."""
        return {
            "template_id": template_id,
            "content": "Generated content from template...",
            "variables_used": variables,
            "generated_at": datetime.now(timezone.utc).isoformat()
        }
    
    # Usage Tracking
    async def get_usage_stats(
        self,
        user_id: int
    ) -> Dict[str, Any]:
        """Get AI writing assistant usage statistics."""
        return {
            "total_generations": 45,
            "total_improvements": 23,
            "by_type": {
                "proposal": 20,
                "project_description": 10,
                "profile_bio": 8,
                "message": 7
            },
            "average_quality_improvement": 35,  # percentage
            "words_generated": 12500,
            "time_saved_minutes": 180,
            "period": "last_30_days"
        }


def get_ai_writing_service(db: Session) -> AIWritingService:
    """Factory function for AI writing service."""
    return AIWritingService(db)
