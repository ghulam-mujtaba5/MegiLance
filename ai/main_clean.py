# @AI-HINT: Lightweight AI service with real embeddings, template-based generation
# Optimized for 2GB free tier: Only loads sentence-transformers (80MB model)

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import os
import logging
from contextlib import asynccontextmanager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global models
embedding_model = None

# Try importing ML libraries
try:
    from sentence_transformers import SentenceTransformer
    ML_AVAILABLE = True
except ImportError as e:
    logger.warning(f"ML libraries not found: {e}. Using fallback.")
    ML_AVAILABLE = False

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load only the embedding model on startup
    global embedding_model
    if ML_AVAILABLE:
        try:
            logger.info("Loading embedding model (all-MiniLM-L6-v2)...")
            embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
            logger.info("✅ Embedding model loaded")
        except Exception as e:
            logger.error(f"Failed to load embedding model: {e}")
    yield
    embedding_model = None

app = FastAPI(
    title="MegiLance AI Service",
    description="AI-powered features for MegiLance platform",
    version="1.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request Models
class EmbeddingRequest(BaseModel):
    text: str

class GenerateRequest(BaseModel):
    prompt: str
    max_length: int = 200
    temperature: float = 0.7

class SentimentRequest(BaseModel):
    text: str

# Endpoints
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "megilance-ai",
        "version": "1.0.0",
        "ml_available": ML_AVAILABLE,
        "embedding_model_loaded": embedding_model is not None
    }

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "MegiLance AI Service",
        "status": "operational",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "embeddings": "/ai/embeddings",
            "generate": "/ai/generate",
            "sentiment": "/ai/sentiment"
        }
    }

@app.post("/ai/embeddings")
async def generate_embeddings(request: EmbeddingRequest):
    """Generate real semantic embeddings using sentence-transformers"""
    if not embedding_model:
        # Fallback: hash-based mock embeddings
        import hashlib
        hash_val = int(hashlib.md5(request.text.encode()).hexdigest(), 16)
        vector = [(hash_val >> i) % 100 / 100.0 for i in range(384)]
        return {"embedding": vector, "dimensions": 384, "method": "fallback"}
    
    try:
        embedding = embedding_model.encode(request.text).tolist()
        return {
            "embedding": embedding,
            "dimensions": len(embedding),
            "method": "sentence-transformer"
        }
    except Exception as e:
        logger.error(f"Embedding generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ai/generate")
async def generate_text(request: GenerateRequest):
    """Generate text using template-based approach"""
    try:
        prompt_lower = request.prompt.lower()
        
        if "proposal" in prompt_lower or "project" in prompt_lower:
            text = f"""Thank you for considering my services for this project. 

I have carefully reviewed your requirements and I'm confident I can deliver exceptional results. With my expertise and attention to detail, I will ensure the project meets all specifications and exceeds your expectations.

I propose to complete this work with high quality standards, clear communication throughout, and timely delivery. I'm available to discuss any questions or specific requirements you may have.

Looking forward to working with you on this exciting project!"""
        elif "describe" in prompt_lower or "summary" in prompt_lower:
            text = "This is a professional description tailored to your requirements, highlighting key features and benefits that align with your project goals."
        elif "write" in prompt_lower:
            text = f"Based on your request, here is a professional response that addresses your needs with clarity and attention to detail."
        else:
            text = f"I understand you're looking for: {request.prompt[:100]}. I can provide comprehensive assistance with this requirement and deliver quality results."
        
        if len(text) > request.max_length:
            text = text[:request.max_length] + "..."
            
        return {"text": text, "method": "template-based"}
    except Exception as e:
        logger.error(f"Generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ai/sentiment")
async def analyze_sentiment(request: SentimentRequest):
    """Analyze sentiment using keyword-based approach"""
    try:
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
            score = min(0.9, 0.6 + (positive_count * 0.1))
        elif negative_count > positive_count:
            sentiment = "NEGATIVE"
            score = min(0.9, 0.6 + (negative_count * 0.1))
        else:
            sentiment = "POSITIVE" if len(text_lower) > 50 else "NEUTRAL"
            score = 0.5
        
        return {"label": sentiment, "score": score}
    except Exception as e:
        logger.error(f"Sentiment analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 7860))
    uvicorn.run(app, host="0.0.0.0", port=port)
