"""Final password fix - Update Turso with bcrypt 3.2.2 hashes"""
import asyncio
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

import bcrypt
from app.db.turso_client import TursoHttpClient
from app.core.config import Settings

async def main():
    settings = Settings()
    client = TursoHttpClient(settings.turso_database_url, settings.turso_auth_token)
    
    print(f"bcrypt version: {bcrypt.__version__}")
    print("Generating password hashes with bcrypt {}\n".format(bcrypt.__version__))
    
    # Generate hashes for each password
    pwd = "Password123!"
    hash1 = bcrypt.hashpw(pwd.encode(), bcrypt.gensalt()).decode('utf-8')
    
    print(f"Password: {pwd}")
    print(f"Hash sample: {hash1[:60]}...")
    print(f"Verification test: {bcrypt.checkpw(pwd.encode(), hash1.encode())}\n")
    
    try:
        # Update each user individually with fresh hash
        users = [
            ("admin@megilance.com", pwd),
            ("client1@example.com", pwd),
            ("client2@example.com", pwd),
            ("client3@example.com", pwd),
            ("freelancer1@example.com", pwd),
            ("freelancer2@example.com", pwd),
            ("freelancer3@example.com", pwd),
            ("freelancer4@example.com", pwd),
            ("freelancer5@example.com", pwd),
        ]
        
        for email, password in users:
            # Generate fresh hash for each user to ensure uniqueness
            fresh_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode('utf-8')
            await client.execute(
                "UPDATE users SET hashed_password = ? WHERE email = ?",
                [fresh_hash, email]
            )
            print(f"✅ Updated: {email}")
        
        print(f"\n✅ Successfully updated all {len(users)} user passwords!")
        print(f"\nAll users now have password: {pwd}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        raise
    finally:
        await client.close()

if __name__ == "__main__":
    asyncio.run(main())
