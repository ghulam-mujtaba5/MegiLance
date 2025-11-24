"""Quick Turso connectivity test"""
import os
import asyncio
from dotenv import load_dotenv

load_dotenv()

async def test_turso():
    try:
        from app.db.turso_client import TursoHttpClient
        
        url = os.getenv('TURSO_DATABASE_URL')
        token = os.getenv('TURSO_AUTH_TOKEN')
        
        print(f"[TEST] Turso URL: {url}")
        print(f"[TEST] Token length: {len(token) if token else 0}")
        
        client = TursoHttpClient(url=url, auth_token=token)
        result = await client.execute("SELECT COUNT(*) as count FROM users")
        
        print(f"[SUCCESS] Turso connected - Users: {result.rows[0][0]}")
        return True
    except Exception as e:
        print(f"[ERROR] Turso connection failed: {e}")
        return False

if __name__ == "__main__":
    success = asyncio.run(test_turso())
    exit(0 if success else 1)
