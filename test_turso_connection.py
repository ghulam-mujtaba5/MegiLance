"""
@AI-HINT: Test Turso database connection for MegiLance backend
Verifies that Turso remote database is properly configured and accessible
"""

import os
import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_path))

from app.core.config import get_settings
from app.db.session import get_engine
from sqlalchemy import text
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_turso_connection():
    """Test connection to Turso database"""
    print("\n" + "=" * 70)
    print("🧪 MegiLance - Turso Database Connection Test")
    print("=" * 70 + "\n")
    
    # Load settings
    settings = get_settings()
    
    print("📋 Configuration:")
    print(f"   Environment: {settings.environment}")
    print(f"   Database URL: {settings.database_url}")
    
    if settings.turso_database_url:
        print(f"   Turso URL: {settings.turso_database_url}")
        print(f"   Turso Token: {'✅ Configured' if settings.turso_auth_token else '❌ Missing'}")
    else:
        print("   Turso URL: ❌ Not configured")
        print("\n⚠️  WARNING: Turso is not configured!")
        print("   The backend will use local SQLite database.")
        print("\n💡 To setup Turso:")
        print("   1. Run: ./setup_turso.ps1")
        print("   2. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in backend/.env\n")
        return False
    
    print("\n🔌 Testing database connection...")
    
    try:
        # Get engine
        engine = get_engine()
        
        # Test connection
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1 as test"))
            row = result.fetchone()
            
            if row and row[0] == 1:
                print("✅ Connection successful!\n")
                
                # Try to get some info
                try:
                    result = conn.execute(text("SELECT sqlite_version()"))
                    version = result.fetchone()
                    print(f"📊 Database Info:")
                    print(f"   SQLite/libSQL Version: {version[0]}")
                except Exception as e:
                    logger.debug(f"Could not get version: {e}")
                
                # Check if tables exist
                try:
                    result = conn.execute(text(
                        "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
                    ))
                    tables = [row[0] for row in result.fetchall()]
                    
                    if tables:
                        print(f"   Tables: {len(tables)} found")
                        print(f"   {', '.join(tables[:5])}" + ("..." if len(tables) > 5 else ""))
                    else:
                        print("   Tables: None (run 'alembic upgrade head' to initialize)")
                except Exception as e:
                    logger.debug(f"Could not list tables: {e}")
                
                print("\n" + "=" * 70)
                print("✅ Turso database is properly configured and connected!")
                print("=" * 70 + "\n")
                return True
            else:
                print("❌ Connection test failed\n")
                return False
                
    except Exception as e:
        print(f"❌ Connection failed: {e}\n")
        print("💡 Troubleshooting:")
        print("   1. Verify TURSO_DATABASE_URL is correct")
        print("   2. Verify TURSO_AUTH_TOKEN is valid")
        print("   3. Check network connectivity")
        print("   4. Run: ./setup_turso.ps1\n")
        return False


if __name__ == "__main__":
    success = test_turso_connection()
    sys.exit(0 if success else 1)
