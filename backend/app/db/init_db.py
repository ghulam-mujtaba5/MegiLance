import subprocess
import sys
from pathlib import Path
from sqlalchemy import Engine, inspect
from app.db.base import Base
from app.models import user, project, proposal, contract, portfolio, payment  # noqa: F401  ensure models are imported


def init_db(engine: Engine) -> None:
    """Initialize database: create tables if they don't exist."""
    
    try:
        # Check if tables exist
        inspector = inspect(engine)
        existing_tables = inspector.get_table_names()
        
        if not existing_tables:
            print("📊 Creating database tables...")
            Base.metadata.create_all(bind=engine)
            print("✅ Database tables created successfully")
        else:
            print(f"✅ Database already initialized ({len(existing_tables)} tables found)")
            
    except Exception as e:
        print(f"⚠️ Database initialization error: {e}")
        print("⚠️ Attempting to create tables anyway...")
        try:
            Base.metadata.create_all(bind=engine)
            print("✅ Database tables created")
        except Exception as create_error:
            print(f"❌ Failed to create tables: {create_error}")