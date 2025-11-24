#!/usr/bin/env python3
"""Test admin login credentials"""

import asyncio
from app.core.security import verify_password
from app.db.session import get_turso_client

async def test_admin():
    client = get_turso_client()
    result = await client.execute(
        'SELECT id, email, hashed_password, role, user_type, is_active FROM users WHERE email = ?',
        ['admin@megilance.com']
    )
    
    if result.rows:
        row = result.rows[0]
        print(f"\n✅ Admin User Found:")
        print(f"   ID: {row[0]}")
        print(f"   Email: {row[1]}")
        print(f"   Role: {row[3]}")
        print(f"   User Type: {row[4]}")
        print(f"   Active: {row[5]}")
        print(f"   Hash (first 60 chars): {row[2][:60]}...")
        
        test_password = "Admin@123"
        is_valid = verify_password(test_password, row[2])
        print(f"\n🔑 Password Test:")
        print(f"   Testing password: {test_password}")
        print(f"   Result: {'✅ VALID' if is_valid else '❌ INVALID'}")
        
        # Try alternative passwords
        alternatives = ["admin123", "Admin123", "Admin123!", "admin@123"]
        print(f"\n🔍 Testing alternative passwords:")
        for alt_pass in alternatives:
            is_valid = verify_password(alt_pass, row[2])
            print(f"   {alt_pass}: {'✅ VALID' if is_valid else '❌ INVALID'}")
    else:
        print("❌ Admin user not found")

if __name__ == "__main__":
    asyncio.run(test_admin())
