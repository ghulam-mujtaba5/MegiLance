"""Check if freelancer exists in Turso"""
import asyncio
from dotenv import load_dotenv
load_dotenv()

from app.db.turso_client import TursoHttpClient
from app.core.config import get_settings

async def main():
    settings = get_settings()
    client = TursoHttpClient(
        url=settings.turso_database_url,
        auth_token=settings.turso_auth_token
    )
    
    # Check freelancer
    result = await client.execute(
        "SELECT id, email, name, role, user_type FROM users WHERE email = ?",
        ["freelancer1@example.com"]
    )
    
    if result.rows:
        print("\nFreelancer user found:")
        for i, col in enumerate(["id", "email", "name", "role", "user_type"]):
            print(f"  {col}: {result.rows[0][i]}")
    else:
        print("\n❌ No freelancer user found!")
    
    # Check client
    result2 = await client.execute(
        "SELECT id, email, name, role, user_type FROM users WHERE email = ?",
        ["client1@example.com"]
    )
    
    if result2.rows:
        print("\nClient user found:")
        for i, col in enumerate(["id", "email", "name", "role", "user_type"]):
            print(f"  {col}: {result2.rows[0][i]}")
    else:
        print("\n❌ No client user found!")

asyncio.run(main())
