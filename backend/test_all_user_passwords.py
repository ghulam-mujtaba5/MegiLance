"""
Test which passwords work for each test user
"""
import asyncio
import os
from dotenv import load_dotenv
from app.core.security import verify_password
from app.db.turso_client import TursoHttpClient

load_dotenv()

TURSO_URL = os.getenv("TURSO_DATABASE_URL")
TURSO_TOKEN = os.getenv("TURSO_AUTH_TOKEN")

async def test_passwords():
    client = TursoHttpClient(TURSO_URL, TURSO_TOKEN)
    
    test_users = {
        "admin@megilance.com": ["Admin@123", "Admin123", "admin", "password123", "Demo123!"],
        "client1@example.com": ["password123", "Demo123!", "client123", "Client@123"],
        "freelancer1@example.com": ["password123", "Demo123!", "freelancer123", "Freelancer@123"]
    }
    
    for email, passwords in test_users.items():
        result = await client.execute(
            "SELECT id, email, hashed_password FROM users WHERE email = ?",
            [email]
        )
        
        if result.rows:
            stored_hash = result.rows[0][2]
            print(f"\n📧 {email}")
            print(f"   Hash: {stored_hash[:50]}...")
            
            for pwd in passwords:
                is_valid = verify_password(pwd, stored_hash)
                status = "✅ VALID" if is_valid else "❌ invalid"
                print(f"   Password '{pwd}': {status}")
        else:
            print(f"\n❌ User not found: {email}")
    
    await client.close()

if __name__ == "__main__":
    asyncio.run(test_passwords())
