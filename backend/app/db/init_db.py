import subprocess
import sys
from pathlib import Path
from sqlalchemy import Engine, inspect
from app.db.base import Base
from app.models import user, project, proposal, contract, portfolio, payment  # noqa: F401  ensure models are imported
# Import all other models to ensure they're registered with Base
from app.models import (
    skill, user_skill, message, conversation, notification, review, dispute,
    milestone, session, audit_log, escrow, time_entry, invoice, category,
    favorite, tag, project_tag, support_ticket, refund, scope_change,
    analytics, embedding, verification
)  # noqa: F401


def init_db(engine: Engine) -> None:
    """Initialize database: create tables if they don't exist.
    
    If engine is None, skip SQLAlchemy table creation (using Turso HTTP API).
    """
    
    if engine is None:
        print("[INFO] SQLAlchemy engine not available - using Turso HTTP API (tables managed externally)")
        return
    
    try:
        # Check if critical tables exist
        inspector = inspect(engine)
        existing_tables = inspector.get_table_names()
        
        # List of critical tables that MUST exist
        critical_tables = ['users', 'projects', 'proposals', 'contracts', 'payments', 'skills', 'categories']
        missing_critical = [t for t in critical_tables if t not in existing_tables]
        
        if missing_critical:
            print(f"[INFO] Missing critical tables: {missing_critical}")
            print("[INFO] Creating database tables...")
            Base.metadata.create_all(bind=engine)
            print("[OK] Database tables created successfully")
        else:
            print(f"[OK] Database already initialized ({len(existing_tables)} tables found)")
            
    except Exception as e:
        print(f"[WARNING] Database initialization error: {e}")
        print("[WARNING] Attempting to create tables anyway...")
        try:
            Base.metadata.create_all(bind=engine)
            print("[OK] Database tables created")
        except Exception as create_error:
            print(f"[ERROR] Failed to create tables: {create_error}")