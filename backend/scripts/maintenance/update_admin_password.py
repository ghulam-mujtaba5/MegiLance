"""
Update admin password in Turso with correct hash
"""
import asyncio
from app.db.turso_client import TursoHttpClient
from app.core.config import get_settings
import bcrypt

async def update_password():
    settings = get_settings()
    client = TursoHttpClient(settings.turso_database_url, settings.turso_auth_token)
    
    # Generate correct hash
    password = "Admin@123"
    new_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    print(f"🔐 Updating admin password in Turso")
    print(f"   New hash: {new_hash}")
    
    # Update in Turso
    result = await client.execute(
        "UPDATE users SET hashed_password = ? WHERE email = ?",
        [new_hash, "admin@megilance.com"]
    )
    
    print(f"\n✅ Update result: {result}")
    
    # Verify
    verify_result = await client.execute(
        "SELECT email, hashed_password FROM users WHERE email = ?",
        ["admin@megilance.com"]
    )
    
    if verify_result.rows:
        row = verify_result.rows[0]
        print(f"\n✅ Verification:")
        print(f"   Email: {row[0]}")
        print(f"   Hash: {row[1]}")
        
        # Test it
        test_result = bcrypt.checkpw(password.encode('utf-8'), row[1].encode('utf-8'))
        print(f"   Password test: {test_result}")
        
        if test_result:
            print(f"\n✅ ✅ ✅ PASSWORD UPDATED SUCCESSFULLY! ✅ ✅ ✅")
    
    await client.close()

if __name__ == "__main__":
    asyncio.run(update_password())
