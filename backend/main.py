# @AI-HINT: This is the main entry point for the MegiLance FastAPI backend.

import logging
import json
import time
import uuid
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

app = FastAPI(
    title=settings.app_name,
    description="MegiLance backend API - A comprehensive freelancing platform with AI-powered features and blockchain-based payments",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

@app.on_event("startup")
async def on_startup():
    try:
        engine = get_engine()
        init_db(engine)
        logger.info("startup.database_initialized")
    except Exception as e:
        logger.error(f"startup.database_failed error={e}")


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
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "error_type": type(exc).__name__}
    )


@app.get("/")
def root():
    return {"message": "Welcome to the MegiLance API!", "version": "1.0.1"}


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
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "ready", "db": "ok"}
    except Exception as e:
        logger.error(f"health.ready_failed error={e}")
        return JSONResponse(status_code=503, content={"status": "degraded", "db_error": str(e)})


app.include_router(api_router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
