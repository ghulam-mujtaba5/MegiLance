"""
@AI-HINT: Check all users in Turso database and verify their passwords
"""

import asyncio
import os
from dotenv import load_dotenv
import httpx

load_dotenv(dotenv_path="backend/.env")

TURSO_URL = os.getenv("TURSO_DATABASE_URL")
TURSO_TOKEN = os.getenv("TURSO_AUTH_TOKEN")

async def check_users():
    """Check all users in database"""
    async with httpx.AsyncClient() as client:
        # Query to get all users
        response = await client.post(
            f"{TURSO_URL}/v2/pipeline",
            headers={"Authorization": f"Bearer {TURSO_TOKEN}"},
            json={
                "requests": [
                    {
                        "type": "execute",
                        "stmt": {
                            "sql": "SELECT id, email, role, is_active, hashed_password FROM users WHERE email IN ('admin@megilance.com', 'client1@example.com', 'freelancer1@example.com')"
                        }
                    }
                ]
            }
        )
        
        data = response.json()
        print(f"Response status: {response.status_code}")
        print(f"Response data: {data}")
        
        if "results" in data and len(data["results"]) > 0:
            result = data["results"][0]["response"]["result"]
            cols = result["cols"]
            rows = result["rows"]
            
            print("\n" + "="*80)
            print("USERS IN DATABASE")
            print("="*80)
            
            for row in rows:
                user = dict(zip(cols, row))
                print(f"\nEmail: {user['email']}")
                print(f"Role: {user['role']}")
                print(f"Active: {user['is_active']}")
                print(f"Password Hash: {user['hashed_password'][:60]}...")
        else:
            print("No users found or error in response")

asyncio.run(check_users())
