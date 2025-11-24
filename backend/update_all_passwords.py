import asyncio
from passlib.context import CryptContext
from app.db.turso_client import TursoHttpClient
from app.core.config import Settings

settings = Settings()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def update_passwords():
    client = TursoHttpClient(settings.turso_database_url, settings.turso_auth_token)
    
    # Generate hash for Password123!
    password = "Password123!"
    hashed_password = pwd_context.hash(password)
    
    print(f"Updating all user passwords to: {password}")
    print(f"Hash: {hashed_password[:50]}...\n")
    
    # Update freelancers and clients
    print("Updating freelancers (IDs 5-9) and clients (IDs 2-4)...")
    await client.execute(
        "UPDATE users SET hashed_password = ? WHERE id IN (2, 3, 4, 5, 6, 7, 8, 9)",
        [hashed_password]
    )
    
    # Verify admin still has correct password
    print("\nVerifying users...")
    result = await client.execute(
        "SELECT id, email, name, role FROM users ORDER BY id",
        []
    )
    
    print("\nUpdated users:")
    print("-" * 60)
    for row in result.rows:
        print(f"ID {row[0]}: {row[1]} ({row[3]}) - Password123!")
    print("-" * 60)
    
    await client.close()
    print("\n✅ All passwords updated to 'Password123!'")

asyncio.run(update_passwords())
