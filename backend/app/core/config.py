from functools import lru_cache
from typing import Optional

from pydantic import AnyUrl
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "MegiLance API"
    environment: str = "development"
    backend_cors_origins: list[str] = ["*"]

    # Database - Turso (libSQL) Database as a Service
    # Format: libsql://your-database.turso.io?authToken=your-token
    # Or local development: file:./local.db
    database_url: str = "file:./local.db"
    turso_database_url: Optional[str] = None
    turso_auth_token: Optional[str] = None
    
    # Path to mounted JSON data directory (for mock/admin/demo endpoints)
    json_data_dir: str = "/data/db"
    
    # Security & JWT
    secret_key: str = "megilance_secret_key_for_jwt_tokens"
    access_token_expire_minutes: int = 30
    refresh_token_expire_minutes: int = 60 * 24 * 7  # 7 days
    jwt_algorithm: str = "HS256"
    
    # File Storage (Simple local storage or can be upgraded to cloud storage like S3/Cloudflare R2)
    upload_dir: str = "./uploads"
    max_upload_size: int = 10 * 1024 * 1024  # 10MB
    
    # AI Service
    ai_service_url: Optional[str] = "http://localhost:8001"
    openai_api_key: Optional[str] = None
    
    # Email & Notifications
    ses_region: Optional[str] = None
    ses_from_email: Optional[str] = None
    sns_topic_arn: Optional[str] = None
    
    # SMTP Configuration for Email Service
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    FROM_EMAIL: str = "noreply@megilance.com"
    FROM_NAME: str = "MegiLance"
    FRONTEND_URL: str = "http://localhost:3000"
    
    # Blockchain & Payments
    circle_api_key: Optional[str] = None
    blockchain_provider_url: Optional[str] = None
    usdc_contract_address: Optional[str] = None
    
    # Stripe Payment Configuration
    STRIPE_SECRET_KEY: Optional[str] = None
    STRIPE_PUBLISHABLE_KEY: Optional[str] = None
    STRIPE_WEBHOOK_SECRET: Optional[str] = None
    STRIPE_PLATFORM_FEE_PERCENT: float = 10.0  # Platform fee percentage (default 10%)
    
    # Monitoring
    sentry_dsn: Optional[str] = None
    log_level: str = "INFO"
    
    # Additional settings from .env
    debug: bool = False
    allowed_origins: str = "*"
    jwt_secret_key: Optional[str] = None
    refresh_token_expire_days: int = 7
    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = None
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None
    email_from: Optional[str] = None
    redis_host: Optional[str] = None
    redis_port: Optional[int] = None
    redis_db: Optional[int] = None

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache
def get_settings() -> Settings:
    return Settings()