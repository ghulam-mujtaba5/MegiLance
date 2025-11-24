"""Check Turso user joined_at field"""
import asyncio
import os
from dotenv import load_dotenv

# Load environment
load_dotenv()

from app.db.turso_client import TursoHttpClient
from app.core.config import get_settings

async def main():
    settings = get_settings()
    print(f"Turso URL: {settings.turso_database_url}")
    print(f"Turso Token: {settings.turso_auth_token[:20] if settings.turso_auth_token else 'None'}...")
    
    client = TursoHttpClient(
        url=settings.turso_database_url,
        auth_token=settings.turso_auth_token
    )
    
    result = await client.execute(
        "SELECT id, email, name, role, user_type, joined_at, created_at FROM users WHERE email = ?",
        ["admin@megilance.com"]
    )
    
    if result.rows:
        row = result.rows[0]
        print("\nAdmin user in Turso:")
        print(f"  ID: {row[0]}")
        print(f"  Email: {row[1]}")
        print(f"  Name: {row[2]}")
        print(f"  Role: {row[3]}")
        print(f"  User Type: {row[4]}")
        print(f"  Joined At: {row[5]} (type: {type(row[5])})")
        print(f"  Created At: {row[6]} (type: {type(row[6])})")
    else:
        print("No admin user found")

asyncio.run(main())
