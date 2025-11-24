import asyncio
import os
from dotenv import load_dotenv
from app.db.turso_client import TursoHttpClient
from passlib.context import CryptContext

load_dotenv()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def check_user():
    client = TursoHttpClient(
        os.getenv("TURSO_DATABASE_URL"),
        os.getenv("TURSO_AUTH_TOKEN")
    )
    
    try:
        # Query user
        result = await client.execute(
            "SELECT id, email, name, hashed_password, role, is_active FROM users WHERE email = ?",
            ["admin@megilance.com"]
        )
        
        if result.rows:
            user = result.rows[0]
            print(f"✅ User found in Turso:")
            print(f"  ID: {user[0]}")
            print(f"  Email: {user[1]}")
            print(f"  Name: {user[2]}")
            print(f"  Role: {user[4]}")
            print(f"  Active: {user[5]}")
            print(f"  Hash: {user[3]}")
            
            # Test password
            password = "Admin@123"
            verify = pwd_context.verify(password, user[3])  # hashed_password is index 3
            print(f"\n🔐 Password verification: {verify}")
            
            if not verify:
                print("\n❌ Password does NOT match!")
                print("Generating correct hash...")
                correct_hash = pwd_context.hash(password)
                print(f"Correct hash should be: {correct_hash}")
        else:
            print("❌ User not found in Turso!")
    finally:
        await client.close()

asyncio.run(check_user())
