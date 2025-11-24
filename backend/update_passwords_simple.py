"""Simple password update for all users"""
import asyncio
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from app.db.turso_client import TursoHttpClient
from app.core.config import Settings
import bcrypt

async def main():
    settings = Settings()
    client = TursoHttpClient(settings.turso_database_url, settings.turso_auth_token)
    
    try:
        pwd = "Password123!"
        hash_pwd = bcrypt.hashpw(pwd.encode(), bcrypt.gensalt()).decode('utf-8')
        
        print(f"bcrypt: {bcrypt.__version__}, Password: {pwd}, Hash: {hash_pwd[:50]}...")
        
        # Update ALL users
        for email in ["admin@megilance.com", "client1@example.com", "client2@example.com", "client3@example.com", 
                      "freelancer1@example.com", "freelancer2@example.com", "freelancer3@example.com", 
                      "freelancer4@example.com", "freelancer5@example.com"]:
            await client.execute("UPDATE users SET hashed_password = ? WHERE email = ?", [hash_pwd, email])
            print(f"✅ {email}")
        
        print(f"\n✅ All 9 users updated!")
    finally:
        await client.close()

asyncio.run(main())
