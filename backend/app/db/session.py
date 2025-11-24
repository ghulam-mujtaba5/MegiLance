"""
@AI-HINT: Database session management for Turso (libSQL) database
Turso is a distributed SQLite database service built on libSQL
Uses custom HTTP client for direct connection to Turso cloud
"""

from sqlalchemy import create_engine, event, Engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.core.config import get_settings
from app.db.turso_client import TursoHttpClient
import sqlite3


settings = get_settings()

# Lazy engine creation to avoid blocking on startup
_engine = None
_SessionLocal = None
_turso_client = None

def get_turso_client():
    """Get or create Turso HTTP client connection"""
    global _turso_client
    if _turso_client is None and settings.turso_database_url and settings.turso_auth_token:
        try:
            _turso_client = TursoHttpClient(
                url=settings.turso_database_url,
                auth_token=settings.turso_auth_token
            )
            print(f"[OK] Turso HTTP client created: {settings.turso_database_url}")
        except Exception as e:
            print(f"[WARNING] Failed to create Turso client: {e}")
    return _turso_client

def get_engine():
    """
    Create database engine.
    Uses the configured `database_url` (file:... for local sqlite) if provided.
    Note: Turso (libsql://) requires a compatible SQLAlchemy dialect/driver
    (e.g. sqlalchemy-libsql). If you run with `DATABASE_URL` pointing at Turso,
    ensure the appropriate driver is installed in the environment.
    """
    global _engine
    if _engine is None:
        try:
            # Prefer explicit TURSO_DATABASE_URL if provided; fallback to settings.database_url; else local file sqlite for persistence
            db_url = (
                settings.turso_database_url
                or settings.database_url
                or "sqlite:///./local_dev.db"
            )
            print(f"[OK] Database engine created: {db_url}")
            connect_args = {}
            if db_url.startswith("file:") or db_url.startswith("sqlite"):
                connect_args = {"check_same_thread": False}
            _engine = create_engine(
                db_url,
                connect_args=connect_args,
                poolclass=StaticPool if db_url.startswith("sqlite") else None,
                echo=settings.debug
            )

            # If using sqlite, enable recommended pragmas
            if db_url.startswith("sqlite") or db_url.startswith("file:"):
                @event.listens_for(_engine, "connect")
                def set_sqlite_pragma(dbapi_conn, connection_record):
                    cursor = dbapi_conn.cursor()
                    try:
                        cursor.execute("PRAGMA foreign_keys=ON")
                        cursor.execute("PRAGMA journal_mode=WAL")
                    finally:
                        cursor.close()
        except Exception as e:
            print(f"⚠️ Database engine creation failed: {e}")
            _engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    return _engine

def get_session_local():
    global _SessionLocal
    if _SessionLocal is None:
        _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=get_engine())
    return _SessionLocal

# Note: previous implementation synced Turso -> local cache (turso_cache.db).
# That local cache has been removed from the workflow. Use the Turso client
# (`get_turso_client()`) directly when you need to run SQL against the remote DB.

# For backward compatibility
engine = None
SessionLocal = None

def get_db():
    """Dependency for getting database sessions"""
    print(f"\n📊 GET_DB: Creating session...")
    session_factory = get_session_local()
    db = session_factory()
    print(f"   Session created: {db}")
    try:
        yield db
        print(f"   [OK] Session completed successfully")
    except Exception as e:
        print(f"   [ERROR] Session error: {e}")
        db.rollback()
        raise
    finally:
        print(f"   [INFO] Closing session")
        db.close()
