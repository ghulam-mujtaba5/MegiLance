"""Check hash format in Turso database"""
import asyncio
import sys
sys.path.insert(0, 'E:\\MegiLance\\backend')

from app.db.session import get_turso_client

async def check_hash():
    client = get_turso_client()
    try:
        result = await client.execute("SELECT email, hashed_password FROM users WHERE email = 'admin@megilance.com' LIMIT 1")
        if result.rows:
            email = result.rows[0][0]
            hash_value = result.rows[0][1]
            print(f"Email: {email}")
            print(f"Hash type: {type(hash_value)}")
            print(f"Hash value (first 50 chars): {str(hash_value)[:50]}")
            if isinstance(hash_value, bytes):
                print("✓ Hash is bytes - needs decoding")
                print(f"Decoded: {hash_value.decode('utf-8')[:50]}")
            else:
                print("✓ Hash is already string")
    finally:
        await client.close()

asyncio.run(check_hash())
