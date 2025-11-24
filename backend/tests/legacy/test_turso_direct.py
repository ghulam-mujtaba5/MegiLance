"""Test Turso direct connection and query users"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

import asyncio
from app.db.turso_client import TursoHttpClient
from app.core.config import Settings

settings = Settings()

async def test_turso():
    client = TursoHttpClient(settings.turso_database_url, settings.turso_auth_token)
    
    try:
        print(f"🔗 Connecting to: {settings.turso_database_url[:60]}...")
        
        # Query users
        result = await client.execute("SELECT id, email, role, user_type, is_active FROM users LIMIT 10")
        
        print(f"\n📊 Found {len(result.rows)} users:\n")
        for row in result.rows:
            print(f"ID: {row[0]}, Email: {row[1]}, Role: {row[2]}, UserType: {row[3]}, Active: {row[4]}")
        
        # Test admin specifically
        print(f"\n🔍 Checking for admin@megilance.com...")
        admin_result = await client.execute(
            "SELECT id, email, hashed_password, role, user_type FROM users WHERE email = ?",
            ["admin@megilance.com"]
        )
        
        if admin_result.rows:
            row = admin_result.rows[0]
            print(f"✅ Admin found!")
            print(f"   ID: {row[0]}")
            print(f"   Email: {row[1]}")
            print(f"   Full hash: {row[2] if row[2] else 'None'}")
            print(f"   Role: {row[3]}")
            print(f"   UserType: {row[4]}")
        else:
            print(f"❌ Admin NOT found in Turso!")
            
    finally:
        await client.close()

if __name__ == "__main__":
    asyncio.run(test_turso())
