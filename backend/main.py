# @AI-HINT: This is the main entry point for the MegiLance FastAPI backend.

import logging
import json
import time
import uuid
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.api.routers import api_router
from app.core.config import get_settings
from app.core.rate_limit import limiter
from app.db.init_db import init_db
from app.db.session import get_engine
from sqlalchemy import text

# Configure logging
class JsonFormatter(logging.Formatter):
    def format(self, record):
        base = {
            "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(record.created)),
            "level": record.levelname,
            "logger": record.name,
            "msg": record.getMessage(),
        }
        if hasattr(record, 'request_id'):
            base["request_id"] = record.request_id
        if hasattr(record, 'path'):
            base["path"] = record.path
        return json.dumps(base)

handler = logging.StreamHandler()
handler.setFormatter(JsonFormatter())
logger = logging.getLogger("megilance")
logger.setLevel(logging.INFO)
logger.handlers = [handler]
logger.propagate = False

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    try:
        engine = get_engine()
        if engine is not None:
            init_db(engine)
            logger.info("startup.database_initialized")
        else:
            from app.db.turso_http import execute_query
            result = execute_query("SELECT 1")
            if result:
                logger.info("startup.database_initialized via Turso HTTP API")
            else:
                logger.warning("startup.turso_http_test_failed")
        logger.info("startup.mongodb_disabled - using Turso/SQLite only")
    except Exception as e:
        logger.error(f"startup.database_failed error={e}")
    yield
    # Shutdown
    logger.info("shutdown.complete")


app = FastAPI(
    title="MegiLance API",
    description="""
    MegiLance Backend API
    
    AI-Powered Freelancing Platform connecting top talent with global opportunities.
    
    Key Features:
    - AI-Powered Freelancer Matching
    - Blockchain-Based Escrow Payments
    - Secure Authentication & Role Management
    - Real-time Messaging & Notifications
    - Gig Marketplace & Seller Tiers
    - Multi-Currency Payment Support
    """,
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    # Disable automatic redirect for trailing slashes to prevent 308 redirects
    # that can cause issues with POST requests
    redirect_slashes=False
)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
class RequestIDMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        request_id = request.headers.get("X-Request-Id") or str(uuid.uuid4())
        start = time.time()
        response = None
        try:
            response = await call_next(request)
            return response
        finally:
            duration_ms = int((time.time() - start) * 1000)
            extra = logging.LoggerAdapter(logger, {"request_id": request_id, "path": request.url.path})
            extra.info(f"request.complete duration_ms={duration_ms} status={response.status_code if response else 'error'}")
            response_headers = getattr(response, 'headers', None)
            if response_headers is not None:
                response.headers["X-Request-Id"] = request_id

app.add_middleware(RequestIDMiddleware)

# Configure CORS - restrict in production
cors_origins = settings.backend_cors_origins
if settings.environment == "production":
    if "*" in cors_origins:
        logger.warning("SECURITY: CORS wildcard (*) detected in production - restricting to localhost only")
        cors_origins = ["http://localhost:3000"]  # Force safe default
    elif not cors_origins:
        logger.error("CRITICAL: No CORS origins configured in production")
        raise ValueError("CORS origins must be explicitly configured in production")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],  # Restrict headers
    expose_headers=["X-Request-Id", "X-Total-Count"],
    max_age=3600,
)


# Add security headers middleware
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        # Add security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        # Allow Swagger UI CDN resources for API docs
        response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; img-src 'self' data: https://fastapi.tiangolo.com"
        if settings.environment == "production":
            # In production, set secure cookie flags
            response.headers["Set-Cookie"] = "Path=/; Secure; HttpOnly; SameSite=Strict"
        return response


app.add_middleware(SecurityHeadersMiddleware)


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()}
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    import traceback
    error_details = traceback.format_exc()
    logger.error(f"unhandled_exception type={type(exc).__name__} message={str(exc)} traceback={error_details.replace(chr(10), ' | ')}")
    
    # SECURITY: Never expose internal error details in production
    if settings.environment == "production":
        return JSONResponse(
            status_code=500,
            content={"detail": "An internal server error occurred. Please try again later."}
        )
    
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "error_type": type(exc).__name__}
    )


@app.get("/")
def root():
    return {"message": "Welcome to the MegiLance API!", "version": "1.0.0"}


@app.get("/api")
def api_root():
    return {
        "message": "MegiLance API",
        "version": "1.0.0",
        "docs": "/api/docs",
        "redoc": "/api/redoc"
    }

@app.get("/api/health/live")
def health_live():
    return {"status": "ok"}

@app.get("/api/health/ready")
def health_ready():
    engine = get_engine()
    try:
        if engine is not None:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            return {"status": "ready", "db": "ok", "driver": "sqlalchemy"}
        else:
            # Using Turso HTTP API
            from app.db.turso_http import execute_query
            result = execute_query("SELECT 1")
            if result is not None:
                return {"status": "ready", "db": "ok", "driver": "turso_http"}
            else:
                return JSONResponse(status_code=503, content={"status": "degraded", "db_error": "Turso HTTP query failed"})
    except Exception as e:
        logger.error(f"health.ready_failed error={e}")
        # SECURITY: Don't leak database error details in production
        error_detail = str(e) if settings.environment != "production" else "Database connection failed"
        return JSONResponse(status_code=503, content={"status": "degraded", "db_error": error_detail})


from fastapi.staticfiles import StaticFiles
import os

# ... existing imports ...

app.include_router(api_router, prefix="/api")

# Mount uploads directory
uploads_dir = os.path.join(os.path.dirname(__file__), "uploads")
if not os.path.exists(uploads_dir):
    os.makedirs(uploads_dir)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
