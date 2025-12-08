"""
@AI-HINT: Database session management - Consolidated to SQLite for dev, Turso for production
Supports both local SQLite (development) and Turso (production)
"""

from sqlalchemy import create_engine, event, Engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool, QueuePool
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
    
    Supports both local SQLite (development) and Turso (production).
    Falls back to SQLite if Turso is not configured.
    """
    global _engine
    if _engine is None:
        try:
            # Check if Turso is configured (production mode)
            if settings.turso_database_url and settings.turso_auth_token:
                # Verify sqlalchemy-libsql is installed
                try:
                    import sqlalchemy_libsql
                except ImportError:
                    logger.warning(
                        "sqlalchemy-libsql not installed, falling back to SQLite. "
                        "Install with: pip install sqlalchemy-libsql"
                    )
                    raise ImportError("sqlalchemy-libsql not available")
                
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
                
                logger.info(f"✅ Connecting to Turso remote database: {base_url.split('?')[0]}")
                pool_class = QueuePool
                connect_args = {}
            else:
                # Use local SQLite for development
                db_url = settings.database_url or "sqlite:///./local_dev.db"
                print(f"[DB] Using local SQLite: {db_url}")
                logger.info(f"✅ Using local SQLite database: {db_url}")
                pool_class = StaticPool
                connect_args = {"check_same_thread": False}
            
            _engine = create_engine(
                db_url,
                connect_args=connect_args,
                poolclass=pool_class,
                echo=settings.debug,
                pool_pre_ping=True,  # Verify connections before using
                pool_recycle=3600,   # Recycle connections hourly
            )

            # Enable SQLite optimizations for development
            if db_url.startswith("sqlite") or db_url.startswith("file:"):
                @event.listens_for(_engine, "connect")
                def set_sqlite_pragma(dbapi_conn, connection_record):
                    try:
                        cursor = dbapi_conn.cursor()
                        cursor.execute("PRAGMA foreign_keys=ON")
                        cursor.execute("PRAGMA journal_mode=WAL")
                        cursor.execute("PRAGMA synchronous=NORMAL")
                        cursor.close()
                    except Exception as e:
                        logger.warning(f"Failed to set SQLite PRAGMA: {e}")
            
            logger.info("✅ Database engine created successfully")
            
        except Exception as e:
            logger.error(f"❌ Failed to create database engine: {e}")
            raise RuntimeError(f"Database connection failed: {e}")

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
