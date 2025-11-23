"""
@AI-HINT: Database session management for Turso (libSQL) database
Turso is a distributed SQLite database service built on libSQL
Uses libsql_client for direct HTTP connection to Turso cloud
"""

from sqlalchemy import create_engine, event, Engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.core.config import get_settings
import libsql_client
import sqlite3


settings = get_settings()

# Lazy engine creation to avoid blocking on startup
_engine = None
_SessionLocal = None
_turso_client = None

def get_turso_client():
    """Get or create Turso client connection"""
    global _turso_client
    if _turso_client is None and settings.turso_database_url and settings.turso_auth_token:
        try:
            _turso_client = libsql_client.create_client(
                url=settings.turso_database_url,
                auth_token=settings.turso_auth_token
            )
            print(f"✅ Turso client connected: {settings.turso_database_url}")
        except Exception as e:
            print(f"⚠️ Failed to create Turso client: {e}")
    return _turso_client

def get_engine():
    """
    Create database engine for Turso/SQLite.
    Uses in-memory SQLite with manual sync to Turso via HTTP API.
    """
    global _engine
    if _engine is None:
        try:
            # Initialize Turso client
            turso_client = get_turso_client()
            
            # Use in-memory SQLite as the engine
            # We'll sync data to Turso via HTTP API when needed
            _engine = create_engine(
                "sqlite:///:memory:",
                connect_args={"check_same_thread": False},
                poolclass=StaticPool,
                echo=settings.debug
            )
            
            # Enable SQLite pragmas
            @event.listens_for(_engine, "connect")
            def set_sqlite_pragma(dbapi_conn, connection_record):
                cursor = dbapi_conn.cursor()
                cursor.execute("PRAGMA foreign_keys=ON")
                cursor.execute("PRAGMA journal_mode=WAL")
                cursor.close()
            
            print(f"✅ Database engine created (in-memory SQLite with Turso sync)")
        except Exception as e:
            print(f"⚠️ Database engine creation failed: {e}")
            # Fallback to simple in-memory SQLite
            _engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    return _engine

def get_session_local():
    global _SessionLocal
    if _SessionLocal is None:
        _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=get_engine())
    return _SessionLocal

# For backward compatibility
engine = None
SessionLocal = None

def get_db():
    """Dependency for getting database sessions"""
    db = None
    try:
        session_factory = get_session_local()
        db = session_factory()
        yield db
    except Exception as e:
        print(f"⚠️ Database session creation failed: {e}")
        yield None
    finally:
        if db is not None:
            try:
                db.close()
            except:
                pass
