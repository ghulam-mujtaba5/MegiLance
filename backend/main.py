# @AI-HINT: This is the main entry point for the MegiLance FastAPI backend.

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
# Temporarily disabled WebSocket for debugging
# from app.core.websocket import socket_app, websocket_manager
from app.db.init_db import init_db
from app.db.session import get_engine


settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    description="MegiLance backend API - A comprehensive freelancing platform with AI-powered features and blockchain-based payments",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# Add rate limiting state to app - TEMPORARILY DISABLED FOR DEBUGGING
# app.state.limiter = limiter

# Add rate limit exception handler - TEMPORARILY DISABLED FOR DEBUGGING
# app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

# Mount Socket.IO app for WebSocket support - TEMPORARILY DISABLED FOR DEBUGGING
# app.mount("/ws", socket_app)


@app.on_event("startup")
async def on_startup():
    try:
        engine = get_engine()
        init_db(engine)
        print("[OK] Database initialized successfully")
        print("[INFO] Using remote Turso database directly (no local cache)")
    except Exception as e:
        print(f"[WARNING] Database initialization failed: {e}")
        print("[WARNING] App will continue but database-dependent features will not work")


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
    print(f"\n❌❌❌ UNHANDLED EXCEPTION ❌❌❌")
    print(f"Request: {request.method} {request.url}")
    print(f"Exception Type: {type(exc).__name__}")
    print(f"Exception Message: {str(exc)}")
    print(f"Traceback:\n{error_details}")
    print(f"❌❌❌ END EXCEPTION ❌❌❌\n")
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "error_type": type(exc).__name__}
    )


@app.get("/")
def root():
    # Force reload trigger
    return {"message": "Welcome to the MegiLance API!", "version": "1.0.1"}


@app.get("/api")
def api_root():
    return {
        "message": "MegiLance API - Hot Reload Test",
        "version": "1.0.0",
        "docs": "/api/docs",
        "redoc": "/api/redoc"
    }


app.include_router(api_router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    import logging
    logging.basicConfig(level=logging.DEBUG)
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="debug")
