"""
Fix password hashes in Turso database
"""
import asyncio
from libsql_client import create_client
from passlib.context import CryptContext
import os
from dotenv import load_dotenv

load_dotenv()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def main():
    # Connect to Turso
    turso_url = os.getenv("TURSO_DATABASE_URL", "").replace('libsql://', 'https://')
    turso_token = os.getenv("TURSO_AUTH_TOKEN", "")
    
    print(f"🔄 Connecting to Turso...")
    turso_client = create_client(url=turso_url, auth_token=turso_token)
    
    # Get all users
    print(f"📥 Fetching users from Turso...")
    result = await turso_client.execute("SELECT id, email FROM users")
    
    print(f"✅ Found {len(result.rows)} users")
    
    # Update each user's password
    new_hash = pwd_context.hash("password123")
    print(f"🔑 New hash: {new_hash}")
    
    for row in result.rows:
        user_id = row[0]
        email = row[1]
        
        print(f"   Updating user {email}...")
        await turso_client.execute(
            "UPDATE users SET hashed_password = ? WHERE id = ?",
            [new_hash, user_id]
        )
    
    print(f"✅ Updated all user passwords")

if __name__ == "__main__":
    asyncio.run(main())
