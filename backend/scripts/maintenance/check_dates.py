"""Check datetime format in Turso"""
import asyncio
import os
import sys
sys.path.insert(0, os.path.dirname(__file__))
from dotenv import load_dotenv
load_dotenv()

from app.db.turso_client import TursoHttpClient

async def check_dates():
    client = TursoHttpClient(
        url=os.getenv("TURSO_DATABASE_URL"),
        auth_token=os.getenv("TURSO_AUTH_TOKEN")
    )
    
    try:
        result = await client.execute(
            "SELECT id, email, joined_at, created_at, typeof(joined_at), typeof(created_at) FROM users WHERE email = ?",
            ["admin@megilance.com"]
        )
        
        if result.rows:
            row = result.rows[0]
            print(f"User ID: {row[0]}")
            print(f"Email: {row[1]}")
            print(f"joined_at: {repr(row[2])} (type: {row[4]})")
            print(f"created_at: {repr(row[3])} (type: {row[5]})")
    finally:
        await client.close()

asyncio.run(check_dates())
