import asyncio
from app.db.turso_client import TursoHttpClient
from app.core.config import Settings

settings = Settings()

async def fix_roles():
    client = TursoHttpClient(settings.turso_database_url, settings.turso_auth_token)
    
    print("Fixing user roles...")
    
    # Fix admin user
    print("\n1. Updating admin user (ID=1) to role='admin'")
    await client.execute(
        "UPDATE users SET role = 'admin' WHERE id = 1",
        []
    )
    
    # Fix freelancers
    print("2. Updating freelancers (IDs 5-9) to role='freelancer'")
    await client.execute(
        "UPDATE users SET role = 'freelancer' WHERE id IN (5, 6, 7, 8, 9)",
        []
    )
    
    # Verify changes
    print("\n3. Verifying changes...")
    result = await client.execute(
        "SELECT id, email, name, role FROM users ORDER BY id",
        []
    )
    
    print("\nUpdated user roles:")
    print("-" * 80)
    print(f"{'ID':<4} {'Email':<30} {'Name':<25} {'Role':<10}")
    print("-" * 80)
    for row in result.rows:
        print(f"{row[0]:<4} {row[1]:<30} {row[2]:<25} {row[3]:<10}")
    print("-" * 80)
    
    await client.close()
    print("\n✅ Database roles fixed successfully!")

asyncio.run(fix_roles())
