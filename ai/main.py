# @AI-HINT: Ultra-lightweight AI service with smart fallbacks
# Optimized for 2GB free tier: Uses hash-based embeddings if ML unavailable

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
import logging
import hashlib
import math

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global models
embedding_model = None
ML_AVAILABLE = False

# Try importing ML libraries (optional)
try:
    from sentence_transformers import SentenceTransformer
    ML_AVAILABLE = True
    logger.info("sentence-transformers available")
except ImportError as e:
    logger.warning(f"ML libraries not available: {e}. Using smart fallbacks.")

app = FastAPI(
    title="MegiLance AI Service",
    description="AI-powered features for MegiLance platform",
    version="1.1.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Lazy load embedding model
def get_embedding_model():
    global embedding_model
    if ML_AVAILABLE and embedding_model is None:
        try:
            logger.info("Loading embedding model...")
            embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
            logger.info("✅ Embedding model loaded")
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
    return embedding_model

# Request Models
class EmbeddingRequest(BaseModel):
    text: str

class GenerateRequest(BaseModel):
    prompt: str
    max_length: int = 200
    temperature: float = 0.7

class SentimentRequest(BaseModel):
    text: str

class SkillExtractionRequest(BaseModel):
    text: str

class ProposalRequest(BaseModel):
    project_title: str
    project_description: str
    freelancer_name: str = "Professional"
    years_experience: int = 3

# Utility functions
def text_to_embedding(text: str, dim: int = 384) -> List[float]:
    """Generate deterministic embedding from text using hash"""
    # Create a deterministic but distributed embedding
    text_bytes = text.encode('utf-8')
    embeddings = []
    for i in range(dim):
        h = hashlib.md5(text_bytes + str(i).encode()).hexdigest()
        # Convert to float between -1 and 1
        val = (int(h[:8], 16) / 0xFFFFFFFF) * 2 - 1
        embeddings.append(round(val, 6))
    
    # Normalize to unit length
    magnitude = math.sqrt(sum(x*x for x in embeddings))
    if magnitude > 0:
        embeddings = [x / magnitude for x in embeddings]
    
    return embeddings

# Endpoints
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    model = get_embedding_model()
    return {
        "status": "healthy",
        "service": "megilance-ai",
        "version": "1.1.0",
        "ml_available": ML_AVAILABLE,
        "embedding_model_loaded": model is not None,
        "mode": "ml" if model else "fallback"
    }

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "MegiLance AI Service",
        "status": "operational",
        "version": "1.1.0",
        "endpoints": {
            "health": "/health",
            "embeddings": "/ai/embeddings",
            "generate": "/ai/generate",
            "sentiment": "/ai/sentiment",
            "skills": "/ai/extract-skills",
            "proposal": "/ai/generate-proposal"
        }
    }

@app.post("/ai/embeddings")
async def generate_embeddings(request: EmbeddingRequest):
    """Generate semantic embeddings"""
    model = get_embedding_model()
    
    if model:
        try:
            embedding = model.encode(request.text).tolist()
            return {
                "embedding": embedding,
                "dimensions": len(embedding),
                "method": "sentence-transformer"
            }
        except Exception as e:
            logger.error(f"Embedding failed: {e}")
    
    # Fallback: hash-based embeddings
    embedding = text_to_embedding(request.text)
    return {
        "embedding": embedding,
        "dimensions": 384,
        "method": "hash-based"
    }

@app.post("/ai/generate")
async def generate_text(request: GenerateRequest):
    """Generate text using template-based approach"""
    prompt_lower = request.prompt.lower()
    
    if "proposal" in prompt_lower or "project" in prompt_lower:
        text = """Thank you for considering my services for this project. 

I have carefully reviewed your requirements and I'm confident I can deliver exceptional results. With my expertise and attention to detail, I will ensure the project meets all specifications and exceeds your expectations.

I propose to complete this work with high quality standards, clear communication throughout, and timely delivery. I'm available to discuss any questions or specific requirements you may have.

Looking forward to working with you on this exciting project!"""
    elif "describe" in prompt_lower or "summary" in prompt_lower:
        text = "This is a professional description tailored to your requirements, highlighting key features and benefits that align with your project goals."
    elif "write" in prompt_lower:
        text = "Based on your request, here is a professional response that addresses your needs with clarity and attention to detail."
    else:
        text = f"I understand you're looking for: {request.prompt[:100]}. I can provide comprehensive assistance with this requirement and deliver quality results."
    
    if len(text) > request.max_length:
        text = text[:request.max_length] + "..."
        
    return {"text": text, "method": "template-based"}

@app.post("/ai/sentiment")
async def analyze_sentiment(request: SentimentRequest):
    """Analyze sentiment using keyword-based approach"""
    text_lower = request.text.lower()
    
    positive_words = ['excellent', 'great', 'good', 'amazing', 'awesome', 'wonderful', 
                     'fantastic', 'love', 'best', 'perfect', 'outstanding', 'brilliant',
                     'satisfied', 'happy', 'pleased', 'impressed', 'recommend', 'professional']
    negative_words = ['bad', 'poor', 'terrible', 'awful', 'horrible', 'worst', 'hate',
                     'disappointed', 'unsatisfied', 'unprofessional', 'late', 'never',
                     'waste', 'refund', 'scam', 'avoid']
    
    positive_count = sum(1 for word in positive_words if word in text_lower)
    negative_count = sum(1 for word in negative_words if word in text_lower)
    
    if positive_count > negative_count:
        sentiment = "POSITIVE"
        score = min(0.95, 0.6 + (positive_count * 0.1))
    elif negative_count > positive_count:
        sentiment = "NEGATIVE"
        score = min(0.95, 0.6 + (negative_count * 0.1))
    else:
        sentiment = "NEUTRAL"
        score = 0.5
    
    return {"label": sentiment, "score": round(score, 2)}

@app.post("/ai/extract-skills")
async def extract_skills(request: SkillExtractionRequest):
    """Extract skills from text"""
    skill_categories = {
        "programming": ["python", "javascript", "typescript", "java", "c++", "c#", "ruby", "go", "rust", "php"],
        "web": ["html", "css", "react", "vue", "angular", "node.js", "django", "flask", "fastapi", "nextjs"],
        "mobile": ["ios", "android", "flutter", "react native", "swift", "kotlin"],
        "database": ["sql", "mysql", "postgresql", "mongodb", "redis", "elasticsearch"],
        "cloud": ["aws", "azure", "gcp", "docker", "kubernetes", "terraform"],
        "data": ["machine learning", "deep learning", "tensorflow", "pytorch", "pandas", "numpy"],
        "design": ["figma", "sketch", "adobe xd", "photoshop", "illustrator", "ui/ux"]
    }
    
    text_lower = request.text.lower()
    found_skills = []
    
    for category, skills in skill_categories.items():
        for skill in skills:
            if skill in text_lower and skill not in [s["skill"] for s in found_skills]:
                found_skills.append({
                    "skill": skill,
                    "category": category,
                    "confidence": 0.9
                })
    
    return {
        "skills": [s["skill"] for s in found_skills],
        "details": found_skills,
        "total": len(found_skills)
    }

@app.post("/ai/generate-proposal")
async def generate_proposal(request: ProposalRequest):
    """Generate professional proposal"""
    desc_lower = request.project_description.lower()
    
    if "web" in desc_lower or "website" in desc_lower:
        expertise = "web development"
    elif "mobile" in desc_lower or "app" in desc_lower:
        expertise = "mobile development"
    elif "data" in desc_lower:
        expertise = "data solutions"
    else:
        expertise = "software development"
    
    proposal = f"""Dear Hiring Manager,

I am excited to apply for the "{request.project_title}" project. With {request.years_experience}+ years of experience in {expertise}, I am confident I can deliver outstanding results.

I have carefully reviewed your requirements and believe my skills align perfectly with what you're looking for. My approach focuses on:

• Clear communication and regular updates
• High-quality deliverables that exceed expectations
• On-time delivery within budget

I would love to discuss this opportunity further and learn more about your specific needs.

Best regards,
{request.freelancer_name}"""

    return {
        "proposal": proposal,
        "word_count": len(proposal.split()),
        "expertise_detected": expertise
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 7860))
    uvicorn.run(app, host="0.0.0.0", port=port)
