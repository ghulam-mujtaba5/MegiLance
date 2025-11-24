"""
Standalone authentication test that mimics the exact flow
"""
import asyncio
import os
import sys
from dotenv import load_dotenv

# Add backend to path
sys.path.insert(0, os.path.dirname(__file__))

load_dotenv()

from app.db.turso_client import TursoHttpClient
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def test_login_flow():
    """Test the exact same flow as authenticate_user"""
    email = "admin@megilance.com"
    password = "Admin@123"
    
    turso_client = TursoHttpClient(
        url=os.getenv("TURSO_DATABASE_URL"),
        auth_token=os.getenv("TURSO_AUTH_TOKEN")
    )
    
    try:
        print(f"\n🔍 AUTHENTICATE_USER SIMULATION:")
        print(f"   Email: {email}")
        print(f"   🌐 Querying Turso directly...")
        
        result = await turso_client.execute(
            "SELECT id, email, hashed_password, name, role, is_active FROM users WHERE email = ?",
            [email]
        )
        
        if result.rows:
            row = result.rows[0]
            print(f"   ✅ User found in Turso")
            print(f"   Row data: ID={row[0]}, Email={row[1]}, Name={row[3]}, Role={row[4]}, Active={row[5]}")
            print(f"   Hash preview: {row[2][:30] if row[2] else 'None'}...")
            
            password_valid = pwd_context.verify(password, row[2])
            print(f"   Password valid: {password_valid}")
            
            if password_valid:
                print(f"   ✅ Authentication successful via Turso")
                print(f"\n📝 Would create User object with:")
                print(f"      id={row[0]}")
                print(f"      email={row[1]}")
                print(f"      name={row[3]}")
                print(f"      role={row[4]}")
                print(f"      is_active={bool(row[5])}")
                print(f"\n✅✅✅ LOGIN SHOULD WORK! ✅✅✅")
                return True
            else:
                print(f"   ❌ Password verification failed")
                return False
        else:
            print(f"   ❌ No user with email {email} in Turso")
            return False
            
    finally:
        await turso_client.close()

if __name__ == "__main__":
    result = asyncio.run(test_login_flow())
    sys.exit(0 if result else 1)
