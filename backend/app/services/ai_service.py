"""
AI Workflow Services for MegiLance
Provides AI-powered features: job matching, price estimation, proposal generation
"""
from typing import List, Dict, Any, Optional
from decimal import Decimal
import os
import json
import logging
import httpx
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    print("[WARNING] OpenAI not installed - AI features will use rule-based fallbacks")

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
        from app.models.user import User
        from app.models.user_skill import UserSkill
        
        # Find freelancers
        freelancers = db.query(User).filter(User.user_type == 'Freelancer').all()
        
        # Prepare data for AI service
        freelancer_profiles = []
        freelancer_map = {}
        
        for f in freelancers:
            # Get skills (handle both UserSkill relation and JSON string)
            skills = []
            if f.skills and isinstance(f.skills, str):
                try:
                    skills = json.loads(f.skills)
                except:
                    skills = [f.skills] if f.skills else []
            else:
                # Fallback to UserSkill relation if populated
                user_skills = db.query(UserSkill).filter(UserSkill.user_id == f.id).all()
                skills = [us.skill.name for us in user_skills if us.skill]
            
            freelancer_profiles.append({
                "id": str(f.id),
                "name": f.name or "Unknown",
                "bio": f.bio or "",
                "skills": skills
            })
            freelancer_map[str(f.id)] = f

        # Try calling AI Microservice
        ai_service_url = os.getenv("AI_SERVICE_URL", "http://ai:8001")
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{ai_service_url}/ai/match",
                    json={
                        "job_description": job_description,
                        "required_skills": required_skills,
                        "freelancers": freelancer_profiles
                    },
                    timeout=5.0
                )
                if response.status_code == 200:
                    matches = response.json()
                    # Map back to return format
                    result = []
                    for m in matches:
                        f = freelancer_map.get(m["freelancer_id"])
                        if f:
                            result.append({
                                'freelancer_id': f.id,
                                'name': f.name,
                                'email': f.email,
                                'match_score': round(m["score"] * 100, 2),
                                'matching_skills': [], # AI service doesn't return this yet
                                'match_reasons': m.get("match_reasons", []),
                                'recommendation': 'Highly Recommended' if m["score"] > 0.7 else 'Good Match'
                            })
                    return result
        except Exception as e:
            logger.warning(f"AI Service unavailable: {e}. Falling back to local matching.")

        # Fallback: Local Rule-Based Matching
        matched = []
        req_skills_set = set(s.lower() for s in required_skills)
        
        for f_data in freelancer_profiles:
            f_id = f_data["id"]
            f_skills = set(s.lower() for s in f_data["skills"])
            
            # Jaccard Similarity for skills
            intersection = len(req_skills_set.intersection(f_skills))
            union = len(req_skills_set.union(f_skills))
            jaccard_score = intersection / union if union > 0 else 0
            
            # Simple bio keyword match
            bio_score = 0
            if f_data["bio"]:
                bio_lower = f_data["bio"].lower()
                keyword_hits = sum(1 for s in req_skills_set if s in bio_lower)
                bio_score = min(1.0, keyword_hits / len(req_skills_set)) if req_skills_set else 0
            
            # Weighted score
            final_score = (jaccard_score * 0.7) + (bio_score * 0.3)
            
            if final_score > 0.1: # Threshold
                f = freelancer_map[f_id]
                matched.append({
                    'freelancer_id': f.id,
                    'name': f.name,
                    'email': f.email,
                    'match_score': round(final_score * 100, 2),
                    'matching_skills': list(req_skills_set.intersection(f_skills)),
                    'recommendation': 'Good Match' if final_score > 0.5 else 'Potential Match'
                })
        
        matched.sort(key=lambda x: x['match_score'], reverse=True)
        return matched[:10]
    
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
        if not self.openai_api_key or not OPENAI_AVAILABLE:
            # Try calling local AI Microservice first
            ai_service_url = os.getenv("AI_SERVICE_URL", "http://ai:8001")
            try:
                prompt = f"Write a proposal for {job_title}. Skills: {', '.join(freelancer_skills)}."
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        f"{ai_service_url}/ai/generate",
                        json={"prompt": prompt, "max_length": 300},
                        timeout=10.0
                    )
                    if response.status_code == 200:
                        data = response.json()
                        if data.get("method") == "local_llm":
                            return {
                                'success': True,
                                'proposal_text': data["text"],
                                'method': 'local_ai',
                                'model': 'distilgpt2'
                            }
            except Exception as e:
                logger.warning(f"Local AI generation failed: {e}")

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
        if user.created_at and (datetime.now(timezone.utc) - user.created_at) < timedelta(days=7):
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
