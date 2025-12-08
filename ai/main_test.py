# @AI-HINT: Minimal test version - no ML, just API structure
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="MegiLance AI Service - Test", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class EmbeddingRequest(BaseModel):
    text: str

class GenerateRequest(BaseModel):
    prompt: str
    max_length: int = 100
    temperature: float = 0.7

@app.get("/")
async def root():
    return {"message": "MegiLance AI Service - Test Mode", "status": "running"}

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "test-mode", "version": "0.1.0"}

@app.post("/ai/embeddings")
async def embeddings(request: EmbeddingRequest):
    # Return mock 384-dimensional vector
    import hashlib
    hash_val = int(hashlib.md5(request.text.encode()).hexdigest(), 16)
    vector = [(hash_val >> i) % 100 / 100.0 for i in range(384)]
    return {"embedding": vector, "dimensions": 384, "method": "mock"}

@app.post("/ai/generate")
async def generate(request: GenerateRequest):
    return {"text": f"Test response for: {request.prompt[:50]}...", "method": "mock"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=7860)
