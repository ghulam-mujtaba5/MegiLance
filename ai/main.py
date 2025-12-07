# @AI-HINT: Production-ready AI service main entry point
# FastAPI-based AI service with health checks and integration with backend

from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import os
import logging
import numpy as np
from contextlib import asynccontextmanager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global models
embedding_model = None
generator_pipeline = None
sentiment_pipeline = None

# Try importing ML libraries
try:
    from sentence_transformers import SentenceTransformer
    from transformers import pipeline
    ML_AVAILABLE = True
except ImportError as e:
    logger.warning(f"ML libraries not found: {e}. AI features will run in degraded mode.")
    ML_AVAILABLE = False

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load models on startup
    global embedding_model, generator_pipeline, sentiment_pipeline
    if ML_AVAILABLE:
        try:
            logger.info("Loading embedding model (all-MiniLM-L6-v2)...")
            # Small, fast, high-quality embeddings (384 dim)
            embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
            logger.info("Embedding model loaded.")
            
            logger.info("Loading text generation model (flan-t5-small)...")
            # Instruction-tuned model, better for proposals/tasks than GPT2
            generator_pipeline = pipeline("text2text-generation", model="google/flan-t5-small")
            logger.info("Text generation model loaded.")

            logger.info("Loading sentiment model...")
            sentiment_pipeline = pipeline("sentiment-analysis", model="distilbert-base-uncased-finetuned-sst-2-english")
            logger.info("Sentiment model loaded.")
        except Exception as e:
            logger.error(f"Failed to load ML models: {e}")
    yield
    # Clean up on shutdown
    embedding_model = None
    generator_pipeline = None
    sentiment_pipeline = None

app = FastAPI(
    title="MegiLance AI Service",
    description="AI-powered features for MegiLance platform (Embeddings, Generation, Sentiment)",
    version="2.0.0",
    lifespan=lifespan
)

# CORS configuration
origins = os.getenv("CORS_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Models ---

class EmbeddingRequest(BaseModel):
    text: str

class EmbeddingResponse(BaseModel):
    embedding: List[float]
    dimensions: int

class GenerateRequest(BaseModel):
    prompt: str
    max_length: int = 200
    temperature: float = 0.7

class SentimentRequest(BaseModel):
    text: str

# --- Endpoints ---

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "megilance-ai",
        "version": "2.0.0",
        "ml_available": ML_AVAILABLE,
        "models": {
            "embeddings": "all-MiniLM-L6-v2" if embedding_model else "unavailable",
            "generation": "google/flan-t5-small" if generator_pipeline else "unavailable",
            "sentiment": "distilbert" if sentiment_pipeline else "unavailable"
        }
    }

@app.post("/ai/embeddings", response_model=EmbeddingResponse)
async def generate_embeddings(request: EmbeddingRequest):
    """Generate vector embeddings for semantic search"""
    if not embedding_model:
        raise HTTPException(status_code=503, detail="Embedding model not loaded")
    
    try:
        # Generate embedding
        embedding = embedding_model.encode(request.text).tolist()
        return {
            "embedding": embedding,
            "dimensions": len(embedding)
        }
    except Exception as e:
        logger.error(f"Embedding generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ai/generate")
async def generate_text(request: GenerateRequest):
    """Generate text using instruction-tuned model"""
    if not generator_pipeline:
        # Fallback if model fails
        return {"text": "AI service is currently initializing. Please try again in a moment.", "method": "fallback"}
    
    try:
        # Flan-T5 is text2text, so we pass the prompt directly
        response = generator_pipeline(
            request.prompt, 
            max_length=request.max_length, 
            do_sample=True,
            temperature=request.temperature
        )
        return {
            "text": response[0]['generated_text'],
            "method": "flan-t5-small"
        }
    except Exception as e:
        logger.error(f"Generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ai/sentiment")
async def analyze_sentiment(request: SentimentRequest):
    """Analyze sentiment of text"""
    if not sentiment_pipeline:
        raise HTTPException(status_code=503, detail="Sentiment model not loaded")
    
    try:
        result = sentiment_pipeline(request.text)[0]
        return result
    except Exception as e:
        logger.error(f"Sentiment analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

        "status": "healthy",
        "service": "megilance-ai",
        "version": "1.0.0",
        "ml_available": ML_AVAILABLE
    }

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "MegiLance AI Service",
        "status": "operational",
        "endpoints": {
            "health": "/health",
            "analyze": "/ai/analyze",
            "match": "/ai/match"
        }
    }

@app.post("/ai/analyze")
async def analyze_content(request: AnalyzeRequest):
    """
    Analyze content to extract keywords and sentiment.
    """
    text = request.text
    
    # Simple heuristic analysis
    word_count = len(text.split())
    sentiment_score = 0.0
    sentiment_label = "NEUTRAL"
    
    # Basic keyword extraction
    keywords = []
    
    if ML_AVAILABLE:
        try:
            # Sentiment Analysis
            if sentiment_pipeline:
                # Truncate text to 512 tokens approx (chars/4) to avoid errors
                truncated_text = text[:2000] 
                result = sentiment_pipeline(truncated_text)[0]
                sentiment_label = result['label']
                # Convert to -1 to 1 scale
                score = result['score']
                if sentiment_label == 'NEGATIVE':
                    sentiment_score = -score
                else:
                    sentiment_score = score

            # Keyword Extraction (TF-IDF)
            # We need a corpus to make TF-IDF meaningful, but for single doc we can just use frequency
            # or if we had a reference corpus.
            # For now, let's stick to the frequency method but make it robust
            from collections import Counter
            import re
            
            # Remove common stop words (simplified list)
            stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'}
            
            words = re.findall(r'\w+', text.lower())
            words = [w for w in words if len(w) > 3 and w not in stop_words]
            
            common = Counter(words).most_common(10)
            keywords = [w[0] for w in common]
            
        except Exception as e:
            logger.error(f"Analysis error: {e}")
            keywords = ["error"]
            
    return {
        "sentiment_score": sentiment_score,
        "sentiment_label": sentiment_label,
        "complexity_score": min(1.0, word_count / 1000),
        "keywords": keywords,
        "word_count": word_count
    }

@app.post("/ai/generate")
async def generate_text(request: GenerateRequest):
    """
    Generate text using a local LLM.
    """
    if not ML_AVAILABLE or not generator_pipeline:
        return {"text": "AI generation unavailable. Please configure ML libraries.", "method": "fallback"}
    
    try:
        # Generate text
        output = generator_pipeline(request.prompt, max_length=request.max_length, num_return_sequences=1)
        generated_text = output[0]['generated_text']
        return {"text": generated_text, "method": "local_llm"}
    except Exception as e:
        logger.error(f"Generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ai/match", response_model=List[MatchResult])
async def match_freelancers(request: MatchRequest):
    """
    Match freelancers to a job description using Cosine Similarity on TF-IDF vectors.
    """
    if not request.freelancers:
        return []

    if not ML_AVAILABLE:
        # Fallback: Simple skill overlap
        results = []
        req_skills = set(s.lower() for s in request.required_skills)
        for f in request.freelancers:
            f_skills = set(s.lower() for s in f.skills)
            overlap = len(req_skills.intersection(f_skills))
            score = overlap / len(req_skills) if req_skills else 0
            results.append(MatchResult(
                freelancer_id=f.id,
                score=score,
                match_reasons=[f"Matched {overlap} skills"]
            ))
        return sorted(results, key=lambda x: x.score, reverse=True)

    try:
        # Prepare corpus
        # Doc 0 is the Job Description
        # Docs 1..N are Freelancers (Bio + Skills)
        
        job_text = f"{request.job_description} {' '.join(request.required_skills)}"
        
        freelancer_texts = []
        for f in request.freelancers:
            # Boost skills by repeating them
            skills_text = " ".join(f.skills) * 3 
            freelancer_texts.append(f"{f.bio} {skills_text}")
            
        corpus = [job_text] + freelancer_texts
        
        # Vectorize
        vectorizer = TfidfVectorizer(stop_words='english')
        tfidf_matrix = vectorizer.fit_transform(corpus)
        
        # Calculate Cosine Similarity
        # similarity of job (index 0) with all others
        cosine_sim = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:]).flatten()
        
        results = []
        for i, score in enumerate(cosine_sim):
            freelancer = request.freelancers[i]
            
            # Hybrid score: 70% Content Match + 30% Skill Overlap
            req_skills = set(s.lower() for s in request.required_skills)
            f_skills = set(s.lower() for s in freelancer.skills)
            skill_overlap = len(req_skills.intersection(f_skills))
            skill_score = skill_overlap / len(req_skills) if req_skills else 0
            
            final_score = (score * 0.7) + (skill_score * 0.3)
            
            reasons = []
            if skill_overlap > 0:
                reasons.append(f"Matches {skill_overlap} required skills")
            if score > 0.3:
                reasons.append("Strong profile text match")
                
            results.append(MatchResult(
                freelancer_id=freelancer.id,
                score=float(final_score),
                match_reasons=reasons
            ))
            
        # Sort by score descending
        return sorted(results, key=lambda x: x.score, reverse=True)
        
    except Exception as e:
        logger.error(f"Matching error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)
