"""Check if test users exist"""
import asyncio
import sys
sys.path.insert(0, 'E:\\MegiLance\\backend')

from app.db.session import get_turso_client

async def check_users():
    client = get_turso_client()
    try:
        # Check all users
        result = await client.execute("SELECT id, email, name, user_type, is_active FROM users")
        print(f"Total users: {len(result.rows)}\n")
        
        for row in result.rows:
            print(f"ID: {row[0]} | Email: {row[1]} | Name: {row[2]} | Type: {row[3]} | Active: {row[4]}")
        
        # Check specifically for test users
        print("\n" + "="*80)
        test_emails = [
            "admin@megilance.com",
            "freelancer1@megilance.com",
            "client1@megilance.com"
        ]
        
        for email in test_emails:
            result = await client.execute("SELECT id, email, name, user_type FROM users WHERE email = ?", [email])
            if result.rows:
                print(f"✓ Found: {email} - {result.rows[0][2]} ({result.rows[0][3]})")
            else:
                print(f"✗ Not found: {email}")
                
    finally:
        await client.close()

asyncio.run(check_users())
