"""Test password verification against Turso hash"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

import asyncio
from passlib.context import CryptContext
from app.db.turso_client import TursoHttpClient
from app.core.config import Settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
settings = Settings()

async def test_password():
    client = TursoHttpClient(settings.turso_database_url, settings.turso_auth_token)
    
    try:
        # Get admin user
        result = await client.execute(
            "SELECT email, hashed_password FROM users WHERE email = ?",
            ["admin@megilance.com"]
        )
        
        if result.rows:
            email, hashed = result.rows[0]
            print(f"Email: {email}")
            print(f"Hash from DB: {hashed[:60]}...")
            
            # Test password
            password = "Admin@123"
            is_valid = pwd_context.verify(password, hashed)
            
            print(f"\nPassword '{password}': {'VALID' if is_valid else 'INVALID'}")
            
            # Try other passwords
            for pwd in ["admin", "Admin123", "admin@123"]:
                valid = pwd_context.verify(pwd, hashed)
                print(f"Password '{pwd}': {'VALID' if valid else 'invalid'}")
        else:
            print("❌ Admin not found!")
            
    finally:
        await client.close()

if __name__ == "__main__":
    asyncio.run(test_password())
