"""
@AI-HINT: Turso database synchronization and connection helper
This script helps sync and test Turso remote database connection
"""

import os
import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_path))

os.chdir(backend_path)

from app.core.config import get_settings
from app.db.turso_http import TursoHTTP
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_turso_http():
    """Test Turso HTTP API connection"""
    print("\n" + "=" * 70)
    print("🔌 MegiLance - Turso HTTP API Connection Test")
    print("=" * 70 + "\n")
    
    settings = get_settings()
    
    print("📋 Configuration:")
    print(f"   Environment: {settings.environment}")
    print(f"   Database URL: {settings.database_url}")
    
    if settings.turso_database_url and settings.turso_auth_token:
        print(f"   Turso URL: {settings.turso_database_url}")
        token_preview = settings.turso_auth_token[:30] + "..." if len(settings.turso_auth_token) > 30 else settings.turso_auth_token
        print(f"   Turso Token: {token_preview}")
    else:
        print("   Turso: ❌ Not configured")
        return False
    
    print("\n🔌 Testing Turso HTTP API connection...")
    
    try:
        # Get Turso client
        turso = TursoHTTP.get_instance()
        
        if turso._is_local:
            print("⚠️  Turso client is using local SQLite fallback")
            print(f"   Local DB: {turso._local_db_path}")
            return False
        
        # Test query
        result = turso.execute("SELECT 1 as test")
        
        if result and result.get("rows"):
            print("✅ Turso HTTP API connection successful!\n")
            
            # Get Turso version
            try:
                version_result = turso.execute("SELECT sqlite_version() as version")
                if version_result and version_result.get("rows"):
                    version = version_result["rows"][0][0]
                    print(f"📊 Database Info:")
                    print(f"   SQLite/libSQL Version: {version}")
            except Exception as e:
                logger.debug(f"Could not get version: {e}")
            
            # List tables
            try:
                tables_result = turso.execute(
                    "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
                )
                if tables_result and tables_result.get("rows"):
                    tables = [row[0] for row in tables_result["rows"]]
                    print(f"   Tables: {len(tables)} found")
                    if tables:
                        print(f"   {', '.join(tables[:5])}" + ("..." if len(tables) > 5 else ""))
                    else:
                        print("   No tables found - run 'alembic upgrade head' to initialize")
                else:
                    print("   Tables: None (run 'alembic upgrade head' to initialize)")
            except Exception as e:
                logger.debug(f"Could not list tables: {e}")
            
            print("\n" + "=" * 70)
            print("✅ Turso remote database is properly configured!")
            print("=" * 70 + "\n")
            return True
        else:
            print("❌ Test query returned unexpected result\n")
            return False
            
    except Exception as e:
        print(f"❌ Connection failed: {e}\n")
        print("💡 Troubleshooting:")
        print("   1. Verify TURSO_DATABASE_URL is correct")
        print("   2. Verify TURSO_AUTH_TOKEN is valid and not expired")
        print("   3. Check network connectivity")
        print("   4. Run: ./setup_turso.ps1 to refresh token\n")
        return False


if __name__ == "__main__":
    success = test_turso_http()
    sys.exit(0 if success else 1)
