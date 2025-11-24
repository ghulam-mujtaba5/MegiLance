"""
Test script to verify Turso authentication directly
"""
import asyncio
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

from app.core.config import get_settings
from app.db.session import get_turso_client
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def test_turso_auth():
    settings = get_settings()
    print(f"🔍 Testing Turso Authentication")
    print(f"   Database: {settings.turso_database_url}")
    
    client = get_turso_client()
    if not client:
        print("❌ Failed to get Turso client")
        return
    
    print("✅ Turso client connected")
    
    # Query for admin user
    email = "admin@megilance.com"
    try:
        result = await client.execute(
            "SELECT id, email, hashed_password, full_name, role, is_active FROM users WHERE email = ?",
            [email]
        )
        
        print(f"\n📊 Query result type: {type(result)}")
        print(f"   Result: {result}")
        
        if hasattr(result, 'rows') and result.rows:
            row = result.rows[0]
            print(f"\n✅ User found:")
            print(f"   ID: {row[0]}")
            print(f"   Email: {row[1]}")
            print(f"   Full Name: {row[3]}")
            print(f"   Role: {row[4]}")
            print(f"   Active: {row[5]}")
            print(f"   Hash: {row[2][:50]}...")
            
            # Test password verification
            test_password = "Admin@123"
            print(f"\n🔐 Testing password: {test_password}")
            
            try:
                password_valid = pwd_context.verify(test_password, row[2])
                print(f"   Password valid: {password_valid}")
                
                if password_valid:
                    print(f"\n✅ ✅ ✅ AUTHENTICATION SUCCESSFUL! ✅ ✅ ✅")
                else:
                    print(f"\n❌ Password verification failed")
                    print(f"   Expected hash format: $2b$...")
                    print(f"   Actual hash: {row[2][:80]}")
            except Exception as e:
                print(f"❌ Password verification error: {e}")
        else:
            print(f"❌ No user found with email: {email}")
            print(f"   Result attributes: {dir(result)}")
    except Exception as e:
        print(f"❌ Query failed: {e}")
        import traceback
        traceback.print_exc()
    finally:
        # Close the client properly
        if hasattr(client, 'close'):
            await client.close()
        print(f"\n✅ Test completed")

if __name__ == "__main__":
    asyncio.run(test_turso_auth())
