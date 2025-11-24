"""
Final test - authenticate via security.py
"""
import sys
sys.path.insert(0, ".")

from app.core.security import verify_password
from app.db.turso_client import TursoHttpClient
from app.core.config import get_settings
import asyncio

async def test():
    settings = get_settings()
    client = TursoHttpClient(settings.turso_database_url, settings.turso_auth_token)
    
    print("🔍 Testing Turso authentication with custom client")
    
    result = await client.execute(
        "SELECT id, email, hashed_password, name, role, is_active FROM users WHERE email = ?",
        ["admin@megilance.com"]
    )
    
    if result.rows:
        row = result.rows[0]
        print(f"\n✅ User found:")
        print(f"   Email: {row[1]}")
        print(f"   Hash: {row[2]}")
        
        # Test password
        password_valid = verify_password("Admin@123", row[2])
        print(f"\n🔐 Password verification: {password_valid}")
        
        if password_valid:
            print("\n✅ ✅ ✅ LOGIN WILL WORK! ✅ ✅ ✅")
        else:
            print("\n❌ Password verification failed")
    else:
        print("❌ No user found")
    
    await client.close()

if __name__ == "__main__":
    asyncio.run(test())
