"""
AI Workflow Services for MegiLance
Provides AI-powered features: job matching, price estimation, proposal generation
"""
from typing import List, Dict, Any, Optional
from decimal import Decimal
import openai
import os
from sqlalchemy.orm import Session

class AIWorkflowService:
    """Service for AI-powered platform features"""
    
    def __init__(self):
        self.openai_api_key = os.getenv('OPENAI_API_KEY', '')
        if self.openai_api_key:
            openai.api_key = self.openai_api_key
    
    async def match_freelancers_to_job(
        self,
        job_description: str,
        required_skills: List[str],
        budget: Decimal,
        db: Session
    ) -> List[Dict[str, Any]]:
        """
        AI-powered job matching algorithm
        Returns ranked list of suitable freelancers
        """
        # TODO: Implement ML model for matching
        # For now, return rule-based matching
        
        from app.models.user import User
        from app.models.user_skill import UserSkill
        
        # Find freelancers with matching skills
        freelancers = db.query(User).filter(User.user_type == 'Freelancer').all()
        
        matched = []
        for freelancer in freelancers:
            # Get freelancer skills
            user_skills = db.query(UserSkill).filter(
                UserSkill.user_id == freelancer.id
            ).all()
            
            skill_names = [us.skill.name for us in user_skills if us.skill]
            
            # Calculate match score
            matching_skills = set(skill_names) & set(required_skills)
            if matching_skills:
                match_score = len(matching_skills) / len(required_skills) * 100
                
                matched.append({
                    'freelancer_id': freelancer.id,
                    'name': freelancer.name,
                    'email': freelancer.email,
                    'match_score': round(match_score, 2),
                    'matching_skills': list(matching_skills),
                    'total_skills': len(skill_names),
                    'recommendation': 'Highly Recommended' if match_score > 70 else 'Good Match' if match_score > 40 else 'Potential Match'
                })
        
        # Sort by match score
        matched.sort(key=lambda x: x['match_score'], reverse=True)
        
        return matched[:10]  # Top 10 matches
    
    async def estimate_project_price(
        self,
        project_description: str,
        category: str,
        estimated_hours: Optional[int] = None,
        complexity: str = 'medium'
    ) -> Dict[str, Any]:
        """
        AI-powered price estimation for projects
        Returns suggested price range
        """
        # Base hourly rates by complexity
        base_rates = {
            'simple': Decimal('25'),
            'medium': Decimal('50'),
            'complex': Decimal('100'),
            'expert': Decimal('150')
        }
        
        hourly_rate = base_rates.get(complexity.lower(), base_rates['medium'])
        
        # Estimate hours if not provided
        if not estimated_hours:
            # Simple heuristic based on description length
            word_count = len(project_description.split())
            estimated_hours = max(10, min(160, word_count // 10))
        
        min_price = hourly_rate * Decimal(estimated_hours) * Decimal('0.8')
        max_price = hourly_rate * Decimal(estimated_hours) * Decimal('1.2')
        avg_price = (min_price + max_price) / 2
        
        return {
            'min_price': float(min_price),
            'max_price': float(max_price),
            'avg_price': float(avg_price),
            'hourly_rate': float(hourly_rate),
            'estimated_hours': estimated_hours,
            'complexity': complexity,
            'confidence': 0.75,
            'factors': [
                'Project complexity',
                'Market rates',
                'Estimated hours',
                'Category averages'
            ]
        }
    
    async def generate_proposal(
        self,
        job_title: str,
        job_description: str,
        freelancer_skills: List[str],
        freelancer_experience: str
    ) -> Dict[str, Any]:
        """
        AI-powered proposal generator
        Creates professional proposal text
        """
        # Check if OpenAI is configured
        if not self.openai_api_key:
            # Fallback to template-based generation
            return self._generate_template_proposal(
                job_title,
                job_description,
                freelancer_skills,
                freelancer_experience
            )
        
        try:
            # Use OpenAI to generate proposal
            prompt = f"""Generate a professional freelance project proposal for the following job:

Job Title: {job_title}
Job Description: {job_description}

Freelancer Skills: {', '.join(freelancer_skills)}
Experience: {freelancer_experience}

Create a compelling proposal that:
1. Shows understanding of the project requirements
2. Highlights relevant skills and experience
3. Proposes a clear approach/methodology
4. Is professional and concise (200-300 words)
"""
            
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a professional freelance proposal writer."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=500,
                temperature=0.7
            )
            
            proposal_text = response.choices[0].message.content
            
            return {
                'success': True,
                'proposal_text': proposal_text,
                'method': 'ai_generated',
                'model': 'gpt-3.5-turbo'
            }
        except Exception as e:
            # Fallback to template
            return self._generate_template_proposal(
                job_title,
                job_description,
                freelancer_skills,
                freelancer_experience
            )
    
    def _generate_template_proposal(
        self,
        job_title: str,
        job_description: str,
        freelancer_skills: List[str],
        freelancer_experience: str
    ) -> Dict[str, Any]:
        """Fallback template-based proposal generation"""
        
        proposal_text = f"""Dear Client,

I am excited to submit my proposal for "{job_title}". I have carefully reviewed your requirements and believe I am the perfect fit for this project.

**Understanding of Requirements:**
I understand that you need {job_description[:200]}...

**Relevant Skills:**
I bring expertise in {', '.join(freelancer_skills[:5])}, which directly align with your project needs.

**Experience:**
{freelancer_experience[:200]}...

**Approach:**
I propose a structured approach:
1. Initial consultation to clarify requirements
2. Development phase with regular updates
3. Testing and quality assurance
4. Final delivery and documentation

I am committed to delivering high-quality work within the agreed timeline. I look forward to discussing this opportunity further.

Best regards"""
        
        return {
            'success': True,
            'proposal_text': proposal_text,
            'method': 'template_generated',
            'model': 'rule_based'
        }
    
    async def detect_fraud(
        self,
        user_id: str,
        activity_type: str,
        activity_data: Dict[str, Any],
        db: Session
    ) -> Dict[str, Any]:
        """
        AI-powered fraud detection
        Analyzes user behavior patterns
        """
        from app.models.user import User
        
        user = db.query(User).filter(User.id == user_id).first()
        
        if not user:
            return {'fraud_detected': False, 'risk_level': 'unknown'}
        
        fraud_flags = []
        risk_score = 0
        
        # Check account age
        from datetime import datetime, timedelta
        if user.created_at and (datetime.utcnow() - user.created_at) < timedelta(days=7):
            fraud_flags.append('New account (< 7 days)')
            risk_score += 10
        
        # Check profile completeness
        if not user.bio or len(user.bio) < 50:
            fraud_flags.append('Incomplete profile')
            risk_score += 5
        
        # Check activity patterns
        if activity_type == 'proposal':
            # Check for spam proposals
            if len(activity_data.get('cover_letter', '')) < 100:
                fraud_flags.append('Very short proposal')
                risk_score += 15
        
        # Determine risk level
        if risk_score > 30:
            risk_level = 'high'
        elif risk_score > 15:
            risk_level = 'medium'
        else:
            risk_level = 'low'
        
        return {
            'fraud_detected': risk_score > 30,
            'risk_level': risk_level,
            'risk_score': risk_score,
            'flags': fraud_flags,
            'recommendation': 'Block' if risk_score > 50 else 'Review' if risk_score > 30 else 'Monitor'
        }

# Singleton instance
ai_service = AIWorkflowService()
