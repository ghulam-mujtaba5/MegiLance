import subprocess
import sys
from pathlib import Path
from sqlalchemy import Engine
from app.db.base import Base
from app.models import user, project, proposal, contract, portfolio, payment  # noqa: F401  ensure models are imported


def init_db(engine: Engine) -> None:
    """Initialize database: run migrations and create tables."""
    
    # Run Alembic migrations on startup (for production)
    try:
        alembic_ini = Path(__file__).parent.parent.parent / "alembic.ini"
        if alembic_ini.exists():
            print("🔄 Running database migrations...")
            result = subprocess.run(
                [sys.executable, "-m", "alembic", "upgrade", "head"],
                cwd=str(alembic_ini.parent),
                capture_output=True,
                text=True
            )
            if result.returncode == 0:
                print("✅ Migrations completed successfully")
            else:
                print(f"⚠️ Migration warning: {result.stderr}")
                # Continue anyway - tables might already exist
    except Exception as e:
        print(f"⚠️ Could not run migrations: {e}")
        print("Falling back to create_all()")
    
    # Fallback: Create tables directly (useful for development)
    Base.metadata.create_all(bind=engine)
    
    # Import and run seed function
    from app.db.seed_db import seed_database
    seed_database()