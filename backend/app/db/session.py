"""
@AI-HINT: Database session management - SQLite for dev, Turso for production
Supports both SQLite local development and Turso remote database.
"""

from sqlalchemy import create_engine, event, Engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool, StaticPool
from app.core.config import get_settings
import logging
from typing import Optional

logger = logging.getLogger(__name__)
settings = get_settings()

# Lazy engine creation to avoid blocking on startup
_engine = None
_SessionLocal = None


def get_engine():
    """
    Create and return database engine.
    
    Uses Turso if configured, otherwise falls back to SQLite for local development.
    """
    global _engine
    if _engine is None:
        try:
            # Check if Turso is configured
            if settings.turso_database_url and settings.turso_auth_token:
                # Verify sqlalchemy-libsql is installed
                try:
                    import sqlalchemy_libsql
                except ImportError:
                    print("[WARNING] sqlalchemy-libsql not installed, falling back to SQLite")
                    raise ImportError("sqlalchemy-libsql not installed")
                
                # Construct Turso URL with auth token
                base_url = settings.turso_database_url
                auth_token = settings.turso_auth_token
                
                # Add auth token as query parameter if not already present
                if "authToken" not in base_url and "?" not in base_url:
                    db_url = f"{base_url}?authToken={auth_token}"
                elif "authToken" not in base_url:
                    db_url = f"{base_url}&authToken={auth_token}"
                else:
                    db_url = base_url
                
                logger.info(f"[TURSO] Connecting to: {base_url.split('?')[0]}")
                print(f"[TURSO] Connecting to: {base_url.split('?')[0]}")
                
                _engine = create_engine(
                    db_url,
                    connect_args={},
                    poolclass=QueuePool,
                    echo=settings.debug,
                    pool_pre_ping=True,
                    pool_recycle=3600,
                )
                
                logger.info("[TURSO] Database engine created successfully")
            else:
                # Fallback to SQLite for local development
                db_url = getattr(settings, 'database_url', None) or "sqlite:///./local_dev.db"
                logger.info(f"[SQLITE] Using local database: {db_url}")
                print(f"[SQLITE] Using local database: {db_url}")
                
                _engine = create_engine(
                    db_url,
                    connect_args={"check_same_thread": False} if "sqlite" in db_url else {},
                    poolclass=StaticPool if "sqlite" in db_url else QueuePool,
                    echo=settings.debug,
                )
                
                logger.info("[SQLITE] Database engine created successfully")
            
        except ImportError as ie:
            # SQLite fallback when sqlalchemy-libsql is not installed
            db_url = getattr(settings, 'database_url', None) or "sqlite:///./local_dev.db"
            logger.info(f"[SQLITE] Falling back to local database: {db_url}")
            print(f"[SQLITE] Using local database: {db_url}")
            
            _engine = create_engine(
                db_url,
                connect_args={"check_same_thread": False},
                poolclass=StaticPool,
                echo=settings.debug,
            )
        except Exception as e:
            logger.error(f"Failed to create database engine: {e}")
            # Final fallback to SQLite
            db_url = "sqlite:///./local_dev.db"
            print(f"[SQLITE] Emergency fallback to: {db_url}")
            
            _engine = create_engine(
                db_url,
                connect_args={"check_same_thread": False},
                poolclass=StaticPool,
                echo=False,
            )

    return _engine


def get_session_local():
    """Get or create session factory"""
    global _SessionLocal
    if _SessionLocal is None:
        _SessionLocal = sessionmaker(
            autocommit=False,
            autoflush=False,
            bind=get_engine(),
            expire_on_commit=False,
        )
    return _SessionLocal


def get_db():
    """Dependency for getting database sessions"""
    try:
        session_factory = get_session_local()
        if session_factory is None:
            logger.error("get_db: session_factory is None")
            raise Exception("session_factory is None")
            
        db = session_factory()
        if db is None:
            logger.error("get_db: db session is None")
            raise Exception("db session is None")
            
        yield db
    except Exception as e:
        logger.error(f"Database session error: {e}")
        if 'db' in locals() and db:
            db.rollback()
        raise
    finally:
        if 'db' in locals() and db:
            db.close()


# Legacy compatibility
engine = None
SessionLocal = None


def get_turso_client():
    """Get Turso HTTP client if configured for production"""
    if settings.environment != "production":
        return None
    if not settings.turso_database_url or not settings.turso_auth_token:
        return None
    try:
        from app.db.turso_http import get_turso_http
        return get_turso_http()
    except Exception as e:
        logger.warning(f"Failed to get Turso client: {e}")
        return None


def execute_query(query: str, params: dict = None):
    """Execute a raw SQL query using Turso client or local database"""
    try:
        # Try Turso client first if configured
        turso_client = get_turso_client()
        if turso_client and settings.turso_database_url:
            result = turso_client.execute(query, params or {})
            return result
    except Exception as e:
        print(f"[WARNING] Turso query failed: {e}, falling back to local DB")
    
    # Fallback to local database
    engine = get_engine()
    with engine.connect() as conn:
        if params:
            result = conn.execute(text(query), params)
        else:
            result = conn.execute(text(query))
        conn.commit()
        
        # Return results if it's a SELECT query
        if query.strip().upper().startswith('SELECT'):
            return [dict(row) for row in result.mappings()]
        return result
