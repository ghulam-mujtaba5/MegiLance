"""Check password verification for test users"""
import asyncio
from app.core.security import verify_password
from app.db.session import get_turso_client

async def check_passwords():
    client = get_turso_client()
    
    # Get admin user
    result = await client.execute(
        "SELECT email, hashed_password FROM users WHERE email IN (?, ?, ?)",
        ["admin@megilance.com", "client1@example.com", "freelancer1@example.com"]
    )
    
    print("\nPassword Verification Test:")
    print("=" * 60)
    
    test_password = "Password123!"
    
    for row in result.rows:
        email = row[0]
        hashed = row[1]
        
        # Convert bytes to string if needed
        if isinstance(hashed, bytes):
            hashed = hashed.decode('utf-8')
        
        is_valid = verify_password(test_password, hashed)
        
        print(f"\nEmail: {email}")
        print(f"Hash type: {type(hashed)}")
        print(f"Hash (first 50): {hashed[:50]}...")
        print(f"Password 'Password123!' valid: {is_valid}")

if __name__ == "__main__":
    asyncio.run(check_passwords())
