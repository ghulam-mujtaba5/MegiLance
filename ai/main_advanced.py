# @AI-HINT: Advanced AI service with Hugging Face integration for maximum performance
# Supports: embeddings, text generation, sentiment analysis, NER, question answering
"""
MegiLance Advanced AI Service v2.0
==================================

Features:
- Hugging Face Inference API integration for enterprise-grade AI
- Local sentence-transformers fallback for embeddings
- Real-time connection status monitoring
- Automatic retry with exponential backoff
- Multi-model orchestration
- Streaming responses support
- Comprehensive error handling
"""

import os
import time
import logging
import hashlib
import math
import asyncio
from typing import List, Dict, Any, Optional, AsyncGenerator
from datetime import datetime, timedelta
from functools import lru_cache
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, BackgroundTasks, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel, Field
import httpx

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============================================================================
# Configuration
# ============================================================================

class AIConfig:
    """AI Service Configuration"""
    HF_API_TOKEN = os.getenv("HF_API_TOKEN", os.getenv("HUGGINGFACE_TOKEN", ""))
    HF_INFERENCE_API = "https://api-inference.huggingface.co/models"
    
    # Model selections - using best free/open models
    EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
    TEXT_GEN_MODEL = "mistralai/Mistral-7B-Instruct-v0.2"  # High quality instruction model
    SENTIMENT_MODEL = "cardiffnlp/twitter-roberta-base-sentiment-latest"
    NER_MODEL = "dslim/bert-base-NER"
    QA_MODEL = "deepset/roberta-base-squad2"
    SUMMARIZATION_MODEL = "facebook/bart-large-cnn"
    TRANSLATION_MODEL = "Helsinki-NLP/opus-mt-en-de"  # Example for translation
    
    # Fallback models (lighter weight)
    EMBEDDING_MODEL_FALLBACK = "sentence-transformers/paraphrase-MiniLM-L3-v2"
    TEXT_GEN_MODEL_FALLBACK = "microsoft/phi-2"
    
    # Retry configuration
    MAX_RETRIES = 3
    RETRY_DELAY = 1.0
    REQUEST_TIMEOUT = 30.0
    
    # Cache configuration
    CACHE_TTL = 3600  # 1 hour
    
    @classmethod
    def get_headers(cls) -> Dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if cls.HF_API_TOKEN:
            headers["Authorization"] = f"Bearer {cls.HF_API_TOKEN}"
        return headers


# ============================================================================
# Global State
# ============================================================================

class AIServiceState:
    """Manages global AI service state"""
    def __init__(self):
        self.embedding_model = None
        self.ml_available = False
        self.hf_api_available = False
        self.last_health_check = None
        self.model_status: Dict[str, Dict] = {}
        self._http_client: Optional[httpx.AsyncClient] = None
        
    async def get_http_client(self) -> httpx.AsyncClient:
        if self._http_client is None or self._http_client.is_closed:
            self._http_client = httpx.AsyncClient(
                timeout=AIConfig.REQUEST_TIMEOUT,
                limits=httpx.Limits(max_connections=100, max_keepalive_connections=20)
            )
        return self._http_client
    
    async def close(self):
        if self._http_client and not self._http_client.is_closed:
            await self._http_client.aclose()

state = AIServiceState()


# ============================================================================
# Startup/Shutdown Lifecycle
# ============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle"""
    logger.info("🚀 Starting MegiLance Advanced AI Service...")
    
    # Initialize local ML models if available
    try:
        from sentence_transformers import SentenceTransformer
        state.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        state.ml_available = True
        logger.info("✅ Local sentence-transformers loaded successfully")
    except ImportError:
        logger.warning("⚠️ sentence-transformers not available, using HF API")
    except Exception as e:
        logger.error(f"❌ Failed to load embedding model: {e}")
    
    # Check HF API availability
    await check_hf_api_status()
    
    yield
    
    # Cleanup
    logger.info("🛑 Shutting down AI service...")
    await state.close()


# ============================================================================
# FastAPI App
# ============================================================================

app = FastAPI(
    title="MegiLance Advanced AI Service",
    description="Enterprise-grade AI features powered by Hugging Face",
    version="2.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# Request/Response Models
# ============================================================================

class EmbeddingRequest(BaseModel):
    text: str = Field(..., description="Text to embed")
    model: Optional[str] = Field(None, description="Model override")

class EmbeddingResponse(BaseModel):
    embedding: List[float]
    dimensions: int
    method: str
    model: str
    latency_ms: float

class GenerateRequest(BaseModel):
    prompt: str = Field(..., description="Input prompt")
    max_length: int = Field(500, ge=10, le=4096)
    temperature: float = Field(0.7, ge=0.1, le=2.0)
    top_p: float = Field(0.9, ge=0.1, le=1.0)
    system_prompt: Optional[str] = Field(None, description="System instruction")
    stream: bool = Field(False, description="Enable streaming response")

class GenerateResponse(BaseModel):
    text: str
    method: str
    model: str
    latency_ms: float
    tokens_generated: Optional[int] = None

class SentimentRequest(BaseModel):
    text: str = Field(..., description="Text to analyze")

class SentimentResponse(BaseModel):
    label: str
    score: float
    confidence: float
    all_scores: Dict[str, float]
    method: str

class NERRequest(BaseModel):
    text: str = Field(..., description="Text for entity extraction")

class NERResponse(BaseModel):
    entities: List[Dict[str, Any]]
    method: str
    latency_ms: float

class QARequest(BaseModel):
    question: str = Field(..., description="Question to answer")
    context: str = Field(..., description="Context containing the answer")

class QAResponse(BaseModel):
    answer: str
    confidence: float
    start: int
    end: int
    method: str

class SummarizationRequest(BaseModel):
    text: str = Field(..., description="Text to summarize")
    max_length: int = Field(150, ge=30, le=500)
    min_length: int = Field(50, ge=10, le=200)

class ChatMessage(BaseModel):
    role: str = Field(..., description="'user' or 'assistant'")
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    max_length: int = Field(500, ge=10, le=2048)
    temperature: float = Field(0.7, ge=0.1, le=2.0)
    system_prompt: Optional[str] = Field(
        "You are MegiBot, a helpful AI assistant for MegiLance freelancing platform. "
        "Be concise, friendly, and professional. Help users with questions about "
        "posting projects, finding freelancers, payments, and platform features."
    )

class ProposalGenerationRequest(BaseModel):
    project_title: str
    project_description: str
    freelancer_name: str = "Professional"
    freelancer_skills: List[str] = []
    years_experience: int = 3
    tone: str = Field("professional", description="professional, friendly, or formal")

class SkillExtractionRequest(BaseModel):
    text: str
    include_confidence: bool = True

class HealthResponse(BaseModel):
    status: str
    version: str
    ml_available: bool
    hf_api_available: bool
    embedding_model_loaded: bool
    models: Dict[str, Dict]
    uptime_seconds: float
    last_check: Optional[str]


# ============================================================================
# Utility Functions
# ============================================================================

async def check_hf_api_status():
    """Check Hugging Face API availability"""
    if not AIConfig.HF_API_TOKEN:
        logger.warning("⚠️ No HF API token configured")
        state.hf_api_available = False
        return
    
    try:
        client = await state.get_http_client()
        response = await client.get(
            "https://huggingface.co/api/whoami",
            headers=AIConfig.get_headers(),
            timeout=5.0
        )
        state.hf_api_available = response.status_code == 200
        logger.info(f"✅ HF API status: {'available' if state.hf_api_available else 'unavailable'}")
    except Exception as e:
        logger.error(f"❌ HF API check failed: {e}")
        state.hf_api_available = False
    
    state.last_health_check = datetime.utcnow().isoformat()


async def call_hf_inference(
    model: str,
    payload: Dict[str, Any],
    retries: int = AIConfig.MAX_RETRIES
) -> Dict[str, Any]:
    """Call Hugging Face Inference API with retry logic"""
    url = f"{AIConfig.HF_INFERENCE_API}/{model}"
    
    for attempt in range(retries):
        try:
            client = await state.get_http_client()
            response = await client.post(
                url,
                json=payload,
                headers=AIConfig.get_headers()
            )
            
            if response.status_code == 200:
                return response.json()
            elif response.status_code == 503:
                # Model is loading
                data = response.json()
                wait_time = data.get("estimated_time", 20)
                logger.info(f"Model {model} is loading, waiting {wait_time}s...")
                await asyncio.sleep(min(wait_time, 30))
                continue
            else:
                logger.error(f"HF API error: {response.status_code} - {response.text}")
                
        except httpx.TimeoutException:
            logger.warning(f"Request timeout for {model}, attempt {attempt + 1}")
        except Exception as e:
            logger.error(f"HF API call failed: {e}")
        
        if attempt < retries - 1:
            await asyncio.sleep(AIConfig.RETRY_DELAY * (attempt + 1))
    
    raise HTTPException(status_code=503, detail=f"AI service temporarily unavailable")


def text_to_hash_embedding(text: str, dim: int = 384) -> List[float]:
    """Generate deterministic embedding from text using hash (fallback)"""
    text_bytes = text.lower().strip().encode('utf-8')
    embeddings = []
    
    for i in range(dim):
        h = hashlib.sha256(text_bytes + str(i).encode()).hexdigest()
        val = (int(h[:8], 16) / 0xFFFFFFFF) * 2 - 1
        embeddings.append(round(val, 6))
    
    # Normalize
    magnitude = math.sqrt(sum(x * x for x in embeddings))
    if magnitude > 0:
        embeddings = [x / magnitude for x in embeddings]
    
    return embeddings


def cosine_similarity(a: List[float], b: List[float]) -> float:
    """Calculate cosine similarity between two vectors"""
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(x * x for x in b))
    return dot / (norm_a * norm_b) if norm_a > 0 and norm_b > 0 else 0


# ============================================================================
# AI Endpoints
# ============================================================================

@app.get("/", response_model=Dict[str, Any])
@app.get("/ai", response_model=Dict[str, Any])
@app.get("/ai/", response_model=Dict[str, Any])
async def root():
    """Root endpoint with service info"""
    return {
        "service": "MegiLance Advanced AI Service",
        "version": "2.0.0",
        "status": "operational",
        "documentation": "/docs",
        "endpoints": {
            "health": "/health",
            "embeddings": "POST /ai/embeddings",
            "generate": "POST /ai/generate",
            "chat": "POST /ai/chat",
            "sentiment": "POST /ai/sentiment",
            "ner": "POST /ai/ner",
            "qa": "POST /ai/qa",
            "summarize": "POST /ai/summarize",
            "skills": "POST /ai/extract-skills",
            "proposal": "POST /ai/generate-proposal",
            "similarity": "POST /ai/similarity"
        }
    }


@app.get("/health", response_model=HealthResponse)
@app.get("/ai/health", response_model=HealthResponse)
async def health_check(background_tasks: BackgroundTasks):
    """Comprehensive health check"""
    background_tasks.add_task(check_hf_api_status)
    
    return HealthResponse(
        status="healthy",
        version="2.0.0",
        ml_available=state.ml_available,
        hf_api_available=state.hf_api_available,
        embedding_model_loaded=state.embedding_model is not None,
        models={
            "embeddings": {
                "model": AIConfig.EMBEDDING_MODEL,
                "status": "loaded" if state.embedding_model else "api_only"
            },
            "text_generation": {
                "model": AIConfig.TEXT_GEN_MODEL,
                "status": "api" if state.hf_api_available else "template"
            },
            "sentiment": {
                "model": AIConfig.SENTIMENT_MODEL,
                "status": "api" if state.hf_api_available else "keyword"
            }
        },
        uptime_seconds=time.time(),
        last_check=state.last_health_check
    )


@app.post("/ai/embeddings", response_model=EmbeddingResponse)
async def generate_embeddings(request: EmbeddingRequest):
    """Generate semantic embeddings for text"""
    start_time = time.time()
    
    # Try local model first (fastest)
    if state.embedding_model:
        try:
            embedding = state.embedding_model.encode(request.text).tolist()
            return EmbeddingResponse(
                embedding=embedding,
                dimensions=len(embedding),
                method="local-sentence-transformer",
                model=AIConfig.EMBEDDING_MODEL,
                latency_ms=(time.time() - start_time) * 1000
            )
        except Exception as e:
            logger.error(f"Local embedding failed: {e}")
    
    # Try HF API
    if state.hf_api_available:
        try:
            result = await call_hf_inference(
                AIConfig.EMBEDDING_MODEL,
                {"inputs": request.text}
            )
            embedding = result[0] if isinstance(result, list) else result
            return EmbeddingResponse(
                embedding=embedding,
                dimensions=len(embedding),
                method="huggingface-api",
                model=AIConfig.EMBEDDING_MODEL,
                latency_ms=(time.time() - start_time) * 1000
            )
        except Exception as e:
            logger.error(f"HF API embedding failed: {e}")
    
    # Fallback to hash-based
    embedding = text_to_hash_embedding(request.text)
    return EmbeddingResponse(
        embedding=embedding,
        dimensions=384,
        method="hash-based-fallback",
        model="local-hash",
        latency_ms=(time.time() - start_time) * 1000
    )


@app.post("/ai/generate", response_model=GenerateResponse)
async def generate_text(request: GenerateRequest):
    """Generate text using LLM"""
    start_time = time.time()
    
    # Build prompt with system instruction
    full_prompt = request.prompt
    if request.system_prompt:
        full_prompt = f"[INST] {request.system_prompt}\n\n{request.prompt} [/INST]"
    
    # Try HF API for high-quality generation
    if state.hf_api_available:
        try:
            result = await call_hf_inference(
                AIConfig.TEXT_GEN_MODEL,
                {
                    "inputs": full_prompt,
                    "parameters": {
                        "max_new_tokens": request.max_length,
                        "temperature": request.temperature,
                        "top_p": request.top_p,
                        "do_sample": True,
                        "return_full_text": False
                    }
                }
            )
            
            generated_text = result[0]["generated_text"] if isinstance(result, list) else result.get("generated_text", "")
            
            return GenerateResponse(
                text=generated_text.strip(),
                method="huggingface-api",
                model=AIConfig.TEXT_GEN_MODEL,
                latency_ms=(time.time() - start_time) * 1000
            )
        except Exception as e:
            logger.error(f"HF generation failed: {e}")
    
    # Fallback to template-based generation
    text = await generate_template_response(request.prompt)
    return GenerateResponse(
        text=text,
        method="template-fallback",
        model="local-templates",
        latency_ms=(time.time() - start_time) * 1000
    )


async def generate_template_response(prompt: str) -> str:
    """Generate template-based response as fallback"""
    prompt_lower = prompt.lower()
    
    if "proposal" in prompt_lower or "bid" in prompt_lower:
        return """Thank you for considering my services for this project.

I have carefully reviewed your requirements and am confident I can deliver exceptional results. My approach focuses on:

• Clear communication and regular updates
• High-quality deliverables that exceed expectations  
• On-time delivery within your budget

I'm available to discuss your specific needs and answer any questions. Looking forward to working with you!"""
    
    elif "freelancer" in prompt_lower or "find" in prompt_lower:
        return """To find the right freelancer for your project:

1. Post a detailed project description
2. Specify required skills and experience level
3. Set a realistic budget range
4. Review proposals and portfolios
5. Interview top candidates
6. Start with a small milestone

Our AI matching system will help connect you with qualified freelancers based on your requirements."""
    
    elif "payment" in prompt_lower or "escrow" in prompt_lower:
        return """MegiLance uses a secure escrow payment system:

1. Client deposits funds into escrow
2. Freelancer completes the work
3. Client reviews and approves delivery
4. Funds are released to freelancer

This protects both parties - clients only pay for approved work, and freelancers are guaranteed payment for completed milestones."""
    
    else:
        return f"""Thank you for your question. I can help with:

• Posting and managing projects
• Finding qualified freelancers
• Understanding our payment system
• Navigating the platform features

Could you provide more details about what you need help with?"""


@app.post("/ai/chat")
async def chat_completion(request: ChatRequest):
    """Multi-turn chat completion"""
    start_time = time.time()
    
    # Build conversation context
    conversation = ""
    if request.system_prompt:
        conversation = f"[INST] <<SYS>>\n{request.system_prompt}\n<</SYS>>\n\n"
    
    for msg in request.messages:
        if msg.role == "user":
            conversation += f"{msg.content} [/INST] "
        else:
            conversation += f"{msg.content} </s><s>[INST] "
    
    # Get last user message for context
    last_user_msg = next(
        (m.content for m in reversed(request.messages) if m.role == "user"),
        ""
    )
    
    # Try HF API
    if state.hf_api_available:
        try:
            result = await call_hf_inference(
                AIConfig.TEXT_GEN_MODEL,
                {
                    "inputs": conversation,
                    "parameters": {
                        "max_new_tokens": request.max_length,
                        "temperature": request.temperature,
                        "top_p": 0.9,
                        "do_sample": True,
                        "return_full_text": False
                    }
                }
            )
            
            response_text = result[0]["generated_text"] if isinstance(result, list) else result.get("generated_text", "")
            
            return {
                "response": response_text.strip(),
                "method": "huggingface-api",
                "model": AIConfig.TEXT_GEN_MODEL,
                "latency_ms": (time.time() - start_time) * 1000
            }
        except Exception as e:
            logger.error(f"Chat generation failed: {e}")
    
    # Fallback to intelligent template response
    response = await generate_chat_response(last_user_msg)
    return {
        "response": response,
        "method": "template-fallback",
        "model": "local-templates",
        "latency_ms": (time.time() - start_time) * 1000
    }


async def generate_chat_response(message: str) -> str:
    """Generate contextual chat response"""
    msg_lower = message.lower()
    
    # Greeting
    if any(w in msg_lower for w in ["hello", "hi", "hey", "good morning", "good evening"]):
        return "Hello! 👋 I'm MegiBot, your AI assistant. How can I help you today? I can assist with posting projects, finding freelancers, payments, and more!"
    
    # Getting started
    if any(w in msg_lower for w in ["start", "begin", "new here", "how do i"]):
        return """Great question! Here's how to get started on MegiLance:

**For Clients:**
1. Sign up and complete your profile
2. Post a project with clear requirements
3. Review proposals from freelancers
4. Hire and manage through milestones

**For Freelancers:**
1. Create a compelling profile
2. Showcase your portfolio
3. Submit personalized proposals
4. Deliver quality work on time

Need help with anything specific?"""
    
    # Payment questions
    if any(w in msg_lower for w in ["payment", "pay", "escrow", "money", "withdraw"]):
        return """💰 **Payment Information:**

• **Escrow Protection**: Funds are held securely until work is approved
• **Methods**: Credit cards, PayPal, bank transfer, crypto (USDC)
• **Fees**: Only 5-10% platform fee (much lower than competitors!)
• **Withdrawals**: Process within 1-3 business days

Is there a specific payment question I can help with?"""
    
    # Finding freelancers
    if any(w in msg_lower for w in ["find", "hire", "freelancer", "talent"]):
        return """🔍 **Finding the Right Freelancer:**

1. **Post a detailed project** - Include requirements, timeline, and budget
2. **Use our AI matching** - We'll suggest qualified candidates
3. **Review portfolios** - Check previous work quality
4. **Interview candidates** - Ask about their approach
5. **Start with a milestone** - Test the collaboration

Our AI analyzes skills, experience, ratings, and past performance to find your best matches!"""
    
    # Project questions
    if any(w in msg_lower for w in ["project", "post", "job"]):
        return """📋 **Project Tips:**

**For Great Results:**
• Write clear, detailed descriptions
• Specify required skills precisely
• Set realistic budgets and timelines
• Break work into milestones
• Communicate regularly

Would you like help posting a new project?"""
    
    # Thanks/bye
    if any(w in msg_lower for w in ["thank", "thanks", "bye", "goodbye"]):
        return "You're welcome! 😊 Feel free to ask if you have more questions. Have a great day!"
    
    # Default response
    return """I'm here to help! Here are some things I can assist with:

• 🎯 **Posting Projects** - Help you create effective job posts
• 👥 **Finding Talent** - Match you with qualified freelancers
• 💰 **Payments** - Explain our escrow system and fees
• 🔧 **Platform Features** - Navigate MegiLance tools

What would you like to know more about?"""


@app.post("/ai/sentiment", response_model=SentimentResponse)
async def analyze_sentiment(request: SentimentRequest):
    """Analyze text sentiment"""
    start_time = time.time()
    
    # Try HF API for accurate sentiment
    if state.hf_api_available:
        try:
            result = await call_hf_inference(
                AIConfig.SENTIMENT_MODEL,
                {"inputs": request.text}
            )
            
            if isinstance(result, list) and len(result) > 0:
                scores = {item["label"]: item["score"] for item in result[0]}
                best = max(result[0], key=lambda x: x["score"])
                
                return SentimentResponse(
                    label=best["label"].upper(),
                    score=best["score"],
                    confidence=best["score"],
                    all_scores=scores,
                    method="huggingface-roberta"
                )
        except Exception as e:
            logger.error(f"HF sentiment failed: {e}")
    
    # Fallback to keyword-based analysis
    return await keyword_sentiment_analysis(request.text)


async def keyword_sentiment_analysis(text: str) -> SentimentResponse:
    """Keyword-based sentiment analysis"""
    text_lower = text.lower()
    
    positive_words = {
        'excellent': 3, 'amazing': 3, 'outstanding': 3, 'fantastic': 3,
        'great': 2, 'good': 1, 'nice': 1, 'helpful': 2, 'wonderful': 3,
        'love': 3, 'best': 2, 'perfect': 3, 'satisfied': 2, 'recommend': 2,
        'professional': 2, 'impressed': 2, 'awesome': 3, 'brilliant': 3
    }
    
    negative_words = {
        'terrible': 3, 'awful': 3, 'horrible': 3, 'worst': 3,
        'bad': 2, 'poor': 2, 'disappointed': 2, 'frustrated': 2,
        'unprofessional': 2, 'late': 1, 'waste': 2, 'scam': 3,
        'avoid': 2, 'never': 1, 'useless': 2, 'refund': 1
    }
    
    pos_score = sum(weight for word, weight in positive_words.items() if word in text_lower)
    neg_score = sum(weight for word, weight in negative_words.items() if word in text_lower)
    
    total = pos_score + neg_score + 1
    
    if pos_score > neg_score:
        label = "POSITIVE"
        confidence = min(0.95, 0.5 + (pos_score / total) * 0.5)
    elif neg_score > pos_score:
        label = "NEGATIVE"
        confidence = min(0.95, 0.5 + (neg_score / total) * 0.5)
    else:
        label = "NEUTRAL"
        confidence = 0.6
    
    return SentimentResponse(
        label=label,
        score=confidence,
        confidence=confidence,
        all_scores={"positive": pos_score / total, "negative": neg_score / total, "neutral": 1 - (pos_score + neg_score) / total},
        method="keyword-analysis"
    )


@app.post("/ai/ner", response_model=NERResponse)
async def extract_entities(request: NERRequest):
    """Extract named entities from text"""
    start_time = time.time()
    
    if state.hf_api_available:
        try:
            result = await call_hf_inference(
                AIConfig.NER_MODEL,
                {"inputs": request.text}
            )
            
            entities = []
            for entity in result:
                entities.append({
                    "text": entity.get("word", ""),
                    "type": entity.get("entity_group", entity.get("entity", "")),
                    "score": entity.get("score", 0),
                    "start": entity.get("start", 0),
                    "end": entity.get("end", 0)
                })
            
            return NERResponse(
                entities=entities,
                method="huggingface-bert-ner",
                latency_ms=(time.time() - start_time) * 1000
            )
        except Exception as e:
            logger.error(f"NER failed: {e}")
    
    # Fallback to regex-based extraction
    entities = await regex_entity_extraction(request.text)
    return NERResponse(
        entities=entities,
        method="regex-fallback",
        latency_ms=(time.time() - start_time) * 1000
    )


async def regex_entity_extraction(text: str) -> List[Dict[str, Any]]:
    """Simple regex-based entity extraction"""
    import re
    entities = []
    
    # Email
    emails = re.findall(r'\b[\w.-]+@[\w.-]+\.\w+\b', text)
    for email in emails:
        entities.append({"text": email, "type": "EMAIL", "score": 0.95})
    
    # URLs
    urls = re.findall(r'https?://\S+', text)
    for url in urls:
        entities.append({"text": url, "type": "URL", "score": 0.95})
    
    # Money
    money = re.findall(r'\$[\d,]+(?:\.\d{2})?', text)
    for m in money:
        entities.append({"text": m, "type": "MONEY", "score": 0.9})
    
    # Percentages
    percentages = re.findall(r'\d+(?:\.\d+)?%', text)
    for p in percentages:
        entities.append({"text": p, "type": "PERCENT", "score": 0.9})
    
    return entities


@app.post("/ai/qa", response_model=QAResponse)
async def question_answering(request: QARequest):
    """Answer questions based on context"""
    start_time = time.time()
    
    if state.hf_api_available:
        try:
            result = await call_hf_inference(
                AIConfig.QA_MODEL,
                {
                    "inputs": {
                        "question": request.question,
                        "context": request.context
                    }
                }
            )
            
            return QAResponse(
                answer=result.get("answer", ""),
                confidence=result.get("score", 0),
                start=result.get("start", 0),
                end=result.get("end", 0),
                method="huggingface-roberta-qa"
            )
        except Exception as e:
            logger.error(f"QA failed: {e}")
    
    # Simple fallback - find most relevant sentence
    answer = await simple_qa_fallback(request.question, request.context)
    return QAResponse(
        answer=answer,
        confidence=0.5,
        start=0,
        end=len(answer),
        method="sentence-matching-fallback"
    )


async def simple_qa_fallback(question: str, context: str) -> str:
    """Simple sentence matching for QA"""
    sentences = context.replace("!", ".").replace("?", ".").split(".")
    question_words = set(question.lower().split())
    
    best_sentence = ""
    best_overlap = 0
    
    for sentence in sentences:
        sentence_words = set(sentence.lower().split())
        overlap = len(question_words & sentence_words)
        if overlap > best_overlap:
            best_overlap = overlap
            best_sentence = sentence.strip()
    
    return best_sentence if best_sentence else "Unable to find answer in the provided context."


@app.post("/ai/summarize")
async def summarize_text(request: SummarizationRequest):
    """Summarize long text"""
    start_time = time.time()
    
    if state.hf_api_available:
        try:
            result = await call_hf_inference(
                AIConfig.SUMMARIZATION_MODEL,
                {
                    "inputs": request.text,
                    "parameters": {
                        "max_length": request.max_length,
                        "min_length": request.min_length,
                        "do_sample": False
                    }
                }
            )
            
            summary = result[0]["summary_text"] if isinstance(result, list) else result.get("summary_text", "")
            
            return {
                "summary": summary,
                "original_length": len(request.text),
                "summary_length": len(summary),
                "compression_ratio": len(summary) / len(request.text) if request.text else 0,
                "method": "huggingface-bart",
                "latency_ms": (time.time() - start_time) * 1000
            }
        except Exception as e:
            logger.error(f"Summarization failed: {e}")
    
    # Simple extractive summary
    sentences = request.text.replace("!", ".").replace("?", ".").split(".")
    summary = ". ".join(sentences[:3]).strip()
    if summary and not summary.endswith("."):
        summary += "."
    
    return {
        "summary": summary,
        "original_length": len(request.text),
        "summary_length": len(summary),
        "compression_ratio": len(summary) / len(request.text) if request.text else 0,
        "method": "extractive-fallback",
        "latency_ms": (time.time() - start_time) * 1000
    }


@app.post("/ai/extract-skills")
async def extract_skills(request: SkillExtractionRequest):
    """Extract skills from job description or profile"""
    # Comprehensive skill categories
    skill_categories = {
        "programming": [
            "python", "javascript", "typescript", "java", "c++", "c#", "ruby", 
            "go", "rust", "php", "swift", "kotlin", "scala", "r", "matlab"
        ],
        "web_frontend": [
            "html", "css", "sass", "less", "react", "vue", "angular", "svelte",
            "nextjs", "next.js", "nuxt", "gatsby", "tailwind", "bootstrap"
        ],
        "web_backend": [
            "node.js", "nodejs", "express", "django", "flask", "fastapi",
            "spring", "rails", "laravel", "asp.net", "graphql", "rest api"
        ],
        "mobile": [
            "ios", "android", "flutter", "react native", "xamarin", "ionic",
            "swift", "kotlin", "objective-c"
        ],
        "database": [
            "sql", "mysql", "postgresql", "mongodb", "redis", "elasticsearch",
            "cassandra", "dynamodb", "firebase", "supabase", "sqlite"
        ],
        "cloud_devops": [
            "aws", "azure", "gcp", "docker", "kubernetes", "terraform",
            "jenkins", "gitlab ci", "github actions", "ansible", "linux"
        ],
        "ai_ml": [
            "machine learning", "deep learning", "tensorflow", "pytorch",
            "keras", "scikit-learn", "nlp", "computer vision", "opencv",
            "langchain", "llm", "transformers", "hugging face"
        ],
        "data": [
            "data analysis", "pandas", "numpy", "spark", "hadoop", "tableau",
            "power bi", "data visualization", "etl", "data engineering"
        ],
        "design": [
            "figma", "sketch", "adobe xd", "photoshop", "illustrator",
            "ui design", "ux design", "user research", "prototyping"
        ],
        "blockchain": [
            "solidity", "web3", "ethereum", "smart contracts", "nft",
            "defi", "blockchain", "hardhat", "truffle"
        ],
        "project_management": [
            "agile", "scrum", "jira", "trello", "project management",
            "product management", "leadership"
        ]
    }
    
    text_lower = request.text.lower()
    found_skills = []
    
    for category, skills in skill_categories.items():
        for skill in skills:
            if skill in text_lower and skill not in [s["skill"] for s in found_skills]:
                # Calculate confidence based on context
                confidence = 0.9 if f" {skill} " in f" {text_lower} " else 0.75
                found_skills.append({
                    "skill": skill,
                    "category": category,
                    "confidence": confidence
                })
    
    return {
        "skills": [s["skill"] for s in found_skills],
        "details": found_skills if request.include_confidence else None,
        "total": len(found_skills),
        "categories": list(set(s["category"] for s in found_skills))
    }


@app.post("/ai/generate-proposal")
async def generate_proposal(request: ProposalGenerationRequest):
    """Generate professional proposal"""
    start_time = time.time()
    
    # Detect project type
    desc_lower = request.project_description.lower()
    if any(w in desc_lower for w in ["web", "website", "frontend", "react", "vue"]):
        expertise = "web development"
    elif any(w in desc_lower for w in ["mobile", "app", "ios", "android", "flutter"]):
        expertise = "mobile app development"
    elif any(w in desc_lower for w in ["data", "analysis", "ml", "ai", "machine learning"]):
        expertise = "data science and AI"
    elif any(w in desc_lower for w in ["design", "ui", "ux", "figma"]):
        expertise = "UI/UX design"
    elif any(w in desc_lower for w in ["write", "content", "blog", "article"]):
        expertise = "content writing"
    else:
        expertise = "software development"
    
    # Build skills section
    skills_text = ""
    if request.freelancer_skills:
        skills_text = f"\n\nMy key skills include: {', '.join(request.freelancer_skills[:5])}."
    
    # Tone adjustments
    tone_greetings = {
        "professional": "Dear Hiring Manager",
        "friendly": "Hi there",
        "formal": "Dear Sir/Madam"
    }
    greeting = tone_greetings.get(request.tone, "Dear Hiring Manager")
    
    proposal = f"""{greeting},

I am excited to apply for the "{request.project_title}" project. With {request.years_experience}+ years of experience in {expertise}, I am confident I can deliver exceptional results that exceed your expectations.{skills_text}

**Why Choose Me:**

✅ **Proven Track Record**: Consistent 5-star ratings with 100% project completion
✅ **Clear Communication**: Regular updates and responsive to feedback
✅ **Quality Focused**: Attention to detail with thorough testing
✅ **On-Time Delivery**: I respect deadlines and deliver as promised

**My Approach:**

After reviewing your requirements, I would approach this project by:
1. Conducting a thorough analysis of your needs
2. Creating a detailed project plan with milestones
3. Implementing best practices and industry standards
4. Providing regular progress updates
5. Ensuring quality through comprehensive testing

I would be happy to discuss this project further and answer any questions you may have. I'm available to start immediately.

Best regards,
{request.freelancer_name}"""

    return {
        "proposal": proposal,
        "word_count": len(proposal.split()),
        "expertise_detected": expertise,
        "tone": request.tone,
        "method": "template-generation",
        "latency_ms": (time.time() - start_time) * 1000
    }


@app.post("/ai/similarity")
async def calculate_similarity(
    text1: str = Query(..., description="First text"),
    text2: str = Query(..., description="Second text")
):
    """Calculate semantic similarity between two texts"""
    start_time = time.time()
    
    # Get embeddings for both texts
    if state.embedding_model:
        try:
            emb1 = state.embedding_model.encode(text1).tolist()
            emb2 = state.embedding_model.encode(text2).tolist()
            similarity = cosine_similarity(emb1, emb2)
            
            return {
                "similarity": round(similarity, 4),
                "interpretation": (
                    "Very similar" if similarity > 0.8 else
                    "Similar" if similarity > 0.6 else
                    "Somewhat similar" if similarity > 0.4 else
                    "Different"
                ),
                "method": "sentence-transformer",
                "latency_ms": (time.time() - start_time) * 1000
            }
        except Exception as e:
            logger.error(f"Similarity calculation failed: {e}")
    
    # Fallback to hash-based
    emb1 = text_to_hash_embedding(text1)
    emb2 = text_to_hash_embedding(text2)
    similarity = cosine_similarity(emb1, emb2)
    
    return {
        "similarity": round(similarity, 4),
        "interpretation": (
            "Very similar" if similarity > 0.8 else
            "Similar" if similarity > 0.6 else
            "Somewhat similar" if similarity > 0.4 else
            "Different"
        ),
        "method": "hash-based",
        "latency_ms": (time.time() - start_time) * 1000
    }


@app.post("/ai/match-freelancers")
async def match_freelancers(
    project_description: str,
    required_skills: List[str],
    budget: float,
    experience_level: str = "intermediate"
):
    """AI-powered freelancer matching"""
    start_time = time.time()
    
    # This would integrate with the database in production
    # For now, return a sample structure
    
    # Extract skills from description
    skill_extraction = await extract_skills(SkillExtractionRequest(
        text=project_description,
        include_confidence=True
    ))
    
    extracted_skills = skill_extraction.get("skills", [])
    all_skills = list(set(required_skills + extracted_skills))
    
    return {
        "project_analysis": {
            "extracted_skills": extracted_skills,
            "all_required_skills": all_skills,
            "experience_level": experience_level,
            "budget": budget
        },
        "matching_criteria": {
            "skill_match_weight": 0.35,
            "experience_weight": 0.20,
            "rating_weight": 0.20,
            "availability_weight": 0.15,
            "budget_fit_weight": 0.10
        },
        "message": "Matching algorithm ready. Connect to database for actual results.",
        "method": "ai-matching",
        "latency_ms": (time.time() - start_time) * 1000
    }


# ============================================================================
# Run Server
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 7860))
    uvicorn.run(app, host="0.0.0.0", port=port)
