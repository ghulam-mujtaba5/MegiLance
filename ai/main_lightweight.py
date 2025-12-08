# @AI-HINT: Ultra-lightweight AI service that uses Hugging Face Inference API
# No model loading required - uses serverless inference

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import httpx
import logging
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="MegiLance AI Service",
    description="AI-powered features using HF Inference API",
    version="2.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
GENERATION_MODEL = "google/flan-t5-small"
SENTIMENT_MODEL = "distilbert-base-uncased-finetuned-sst-2-english"

# HF Token (optional, increases rate limits)
HF_TOKEN = os.getenv("HF_TOKEN", "")

class EmbeddingRequest(BaseModel):
    text: str

class GenerateRequest(BaseModel):
    prompt: str
    max_length: int = 100
    temperature: float = 0.7

class SentimentRequest(BaseModel):
    text: str

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "megilance-ai", "version": "2.0.0", "mode": "inference-api"}

@app.get("/")
async def root():
    return {"message": "MegiLance AI Service (Inference API Mode)", "status": "running"}

@app.post("/ai/embeddings")
async def generate_embeddings(request: EmbeddingRequest):
    """Generate embeddings using HF Inference API"""
    url = f"https://api-inference.huggingface.co/models/{EMBEDDING_MODEL}"
    headers = {"Authorization": f"Bearer {HF_TOKEN}"} if HF_TOKEN else {}
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, headers=headers, json={"inputs": request.text})
            
            if response.status_code == 200:
                embedding = response.json()
                # HF returns different formats, normalize
                if isinstance(embedding, list) and len(embedding) > 0:
                    if isinstance(embedding[0], list):
                        embedding = embedding[0]
                    return {"embedding": embedding, "dimensions": len(embedding)}
                return {"embedding": embedding, "dimensions": len(embedding) if isinstance(embedding, list) else 0}
            else:
                logger.error(f"HF API error: {response.status_code} {response.text}")
                raise HTTPException(status_code=response.status_code, detail=response.text)
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Model is loading, please retry in 20s")
    except Exception as e:
        logger.error(f"Embedding error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ai/generate")
async def generate_text(request: GenerateRequest):
    """Generate text using HF Inference API"""
    url = f"https://api-inference.huggingface.co/models/{GENERATION_MODEL}"
    headers = {"Authorization": f"Bearer {HF_TOKEN}"} if HF_TOKEN else {}
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                url, 
                headers=headers, 
                json={
                    "inputs": request.prompt,
                    "parameters": {
                        "max_length": request.max_length,
                        "temperature": request.temperature
                    }
                }
            )
            
            if response.status_code == 200:
                result = response.json()
                text = result[0]["generated_text"] if isinstance(result, list) else result.get("generated_text", "")
                return {"text": text, "method": "flan-t5-small-api"}
            else:
                raise HTTPException(status_code=response.status_code, detail=response.text)
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Model is loading, please retry in 20s")
    except Exception as e:
        logger.error(f"Generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ai/sentiment")
async def analyze_sentiment(request: SentimentRequest):
    """Analyze sentiment using HF Inference API"""
    url = f"https://api-inference.huggingface.co/models/{SENTIMENT_MODEL}"
    headers = {"Authorization": f"Bearer {HF_TOKEN}"} if HF_TOKEN else {}
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, headers=headers, json={"inputs": request.text})
            
            if response.status_code == 200:
                result = response.json()
                return result[0][0] if isinstance(result, list) else result
            else:
                raise HTTPException(status_code=response.status_code, detail=response.text)
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Model is loading, please retry in 20s")
    except Exception as e:
        logger.error(f"Sentiment error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=7860)
