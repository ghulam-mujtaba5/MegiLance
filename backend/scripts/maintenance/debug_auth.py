"""Debug authentication flow step by step"""
import asyncio
import os
from dotenv import load_dotenv
from app.db.turso_client import TursoHttpClient
from passlib.context import CryptContext

load_dotenv()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def debug_auth():
    email = "admin@megilance.com"
    password = "Admin@123"
    
    client = TursoHttpClient(
        os.getenv("TURSO_DATABASE_URL"),
        os.getenv("TURSO_AUTH_TOKEN")
    )
    
    try:
        print(f"🔍 Step 1: Query Turso for user...")
        result = await client.execute(
            "SELECT id, email, hashed_password, name, role, is_active FROM users WHERE email = ?",
            [email]
        )
        
        if not result.rows:
            print(f"❌ No user found with email: {email}")
            return
        
        row = result.rows[0]
        print(f"✅ User found!")
        print(f"   ID: {row[0]}")
        print(f"   Email: {row[1]}")
        print(f"   Name: {row[3]}")
        print(f"   Role: {row[4]}")
        print(f"   Active: {row[5]}")
        print(f"   Hash: {row[2]}")
        
        print(f"\n🔐 Step 2: Verify password...")
        print(f"   Password: {password}")
        print(f"   Hash: {row[2]}")
        
        is_valid = pwd_context.verify(password, row[2])
        print(f"   Result: {is_valid}")
        
        if is_valid:
            print(f"\n✅ AUTHENTICATION SUCCESSFUL!")
            print(f"\n📝 Expected User object:")
            print(f"   id={row[0]}")
            print(f"   email={row[1]}")
            print(f"   full_name={row[3]}")
            print(f"   role={row[4]}")
            print(f"   is_active={bool(row[5])}")
        else:
            print(f"\n❌ PASSWORD VERIFICATION FAILED")
            print(f"\nGenerating new hash to check...")
            new_hash = pwd_context.hash(password)
            print(f"New hash: {new_hash}")
            print(f"Verify with new hash: {pwd_context.verify(password, new_hash)}")
            
    finally:
        await client.close()

if __name__ == "__main__":
    asyncio.run(debug_auth())
