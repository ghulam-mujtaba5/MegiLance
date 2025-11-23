"""
@AI-HINT: Database session management for Turso (libSQL) database
Turso is a distributed SQLite database service built on libSQL
For local development, uses SQLite file. For production, uses Turso cloud database.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import get_settings


settings = get_settings()

# Lazy engine creation to avoid blocking on startup
_engine = None
_SessionLocal = None

def get_engine():
    """
    Create database engine for Turso/SQLite.
    Uses libSQL protocol for Turso cloud databases or file:// for local SQLite.
    """
    global _engine
    if _engine is None:
        try:
            # Determine database URL
            db_url = settings.database_url
            
            # If Turso URL is provided with auth token, use it
            if settings.turso_database_url and settings.turso_auth_token:
                # libSQL URL format: libsql://[database-name]-[org].turso.io
                db_url = settings.turso_database_url
                connect_args = {
                    "check_same_thread": False,
                    "uri": True
                }
                # Note: libsql-client handles auth token via environment or direct connection
            else:
                # Local SQLite file for development
                connect_args = {
                    "check_same_thread": False
                }
            
            _engine = create_engine(
                db_url,
                pool_pre_ping=True,
                connect_args=connect_args,
                echo=settings.debug
            )
            print(f"✅ Database engine created: {db_url.split('?')[0]}")
        except Exception as e:
            print(f"⚠️ Database engine creation failed: {e}")
            # Fallback to in-memory SQLite
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
