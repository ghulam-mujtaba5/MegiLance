"""Test database passwords directly"""
import libsql_client
from passlib.context import CryptContext
import os

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Turso configuration
turso_url = os.getenv("TURSO_DATABASE_URL", "libsql://megilance-db-megilance.aws-ap-south-1.turso.io")
turso_token = os.getenv("TURSO_AUTH_TOKEN", "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3MzExODMyODQsImlkIjoiOGY1ZTM2M2UtYTA4ZC00YzYzLTgxNTctMTk1YjU1Y2Q3YzlmIn0.g6wjUPrQ-KlRBlNXr_r6_NWdkJy-vRZVuQd8zy0aKuCwgZx6d3_2lUXZ2mVgTOIrBCVlm8rVMrbBcXWHDVCZDw")

client = libsql_client.create_client_sync(
    url=turso_url,
    auth_token=turso_token
)

# Query users
result = client.execute("SELECT id, email, name, user_type, hashed_password FROM users LIMIT 10")

print("\n" + "="*80)
print("Users in Turso Database")
print("="*80)

if not result.rows:
    print("❌ No users found!")
else:
    for row in result.rows:
        user_id = row[0]
        email = row[1]
        name = row[2]
        user_type = row[3]
        hashed_pass = row[4]
        
        print(f"\nID: {user_id}")
        print(f"Email: {email}")
        print(f"Name: {name}")
        print(f"Role: {user_type}")
        print(f"Hash: {hashed_pass[:30] if hashed_pass else 'NULL'}...")
        
        # Test passwords
        test_passwords = {
            'admin@megilance.com': ['Admin@123', 'Demo123!', 'admin123', 'password'],
            'client1@example.com': ['password123', 'Demo123!', 'client123', 'password'],
            'freelancer1@example.com': ['password123', 'Demo123!', 'freelancer123', 'password']
        }
        
        if email in test_passwords:
            print(f"Testing passwords:")
            for pwd in test_passwords[email]:
                try:
                    result_match = pwd_context.verify(pwd, hashed_pass)
                    print(f"  {pwd:20} -> {'✅ MATCH' if result_match else '❌ No match'}")
                except Exception as e:
                    print(f"  {pwd:20} -> ❌ Error: {e}")

client.close()
