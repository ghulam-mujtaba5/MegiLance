import asyncio
from app.db.turso_client import TursoHttpClient
from app.core.config import Settings

settings = Settings()

async def check():
    client = TursoHttpClient(settings.turso_database_url, settings.turso_auth_token)
    result = await client.execute(
        'SELECT id, email, hashed_password FROM users WHERE email = ?',
        ['freelancer1@example.com']
    )
    print("Result:", result.rows)
    await client.close()

asyncio.run(check())
