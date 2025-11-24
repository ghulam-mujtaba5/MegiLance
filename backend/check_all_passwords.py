import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

import asyncio
from app.db.turso_client import TursoHttpClient
from app.core.config import Settings

settings = Settings()

async def main():
    client = TursoHttpClient(settings.turso_database_url, settings.turso_auth_token)
    
    try:
        # Get all users
        result = await client.execute(
            "SELECT id, email, name, hashed_password, role FROM users WHERE email IN (?, ?, ?)",
            ["admin@megilance.com", "client1@example.com", "freelancer1@example.com"]
        )
        
        print("\n=== Password Hashes ===\n")
        for row in result.rows:
            print(f"Email: {row[1]}")
            print(f"Name: {row[2]}")
            print(f"Role: {row[4]}")
            print(f"Hash: {row[3]}")
            print()
            
    finally:
        await client.close()

if __name__ == "__main__":
    asyncio.run(main())
