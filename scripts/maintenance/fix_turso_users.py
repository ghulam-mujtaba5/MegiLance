"""
Create/Update test users in Turso database with correct passwords
Run this from the MegiLance root directory
"""
import os
import sys
import asyncio
from libsql_client import create_client_sync
import bcrypt
from datetime import datetime

# Turso configuration
TURSO_DATABASE_URL = os.getenv("TURSO_DATABASE_URL", "libsql://megilance-db-megilance.aws-ap-south-1.turso.io")
TURSO_AUTH_TOKEN = os.getenv("TURSO_AUTH_TOKEN", "")

def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def create_test_users():
    """Create or update test users with correct passwords"""
    
    # Connect to Turso using sync client
    client = create_client_sync(
        url=TURSO_DATABASE_URL,
        auth_token=TURSO_AUTH_TOKEN
    )
    
    test_users = [
        {
            "email": "admin@megilance.com",
            "password": "Admin@123",
            "name": "Admin User",
            "user_type": "Admin",
            "role": "admin"
        },
        {
            "email": "freelancer1@example.com",
            "password": "Demo123!",
            "name": "Freelancer One",
            "user_type": "Freelancer",
            "role": "freelancer"
        },
        {
            "email": "freelancer2@example.com",
            "password": "Demo123!",
            "name": "Freelancer Two",
            "user_type": "Freelancer",
            "role": "freelancer"
        },
        {
            "email": "freelancer3@example.com",
            "password": "Demo123!",
            "name": "Freelancer Three",
            "user_type": "Freelancer",
            "role": "freelancer"
        },
        {
            "email": "freelancer4@example.com",
            "password": "Demo123!",
            "name": "Freelancer Four",
            "user_type": "Freelancer",
            "role": "freelancer"
        },
        {
            "email": "client1@example.com",
            "password": "Demo123!",
            "name": "Client One",
            "user_type": "Client",
            "role": "client"
        },
        {
            "email": "client2@example.com",
            "password": "Demo123!",
            "name": "Client Two",
            "user_type": "Client",
            "role": "client"
        },
        {
            "email": "client3@example.com",
            "password": "Demo123!",
            "name": "Client Three",
            "user_type": "Client",
            "role": "client"
        },
        {
            "email": "client4@example.com",
            "password": "Demo123!",
            "name": "Client Four",
            "user_type": "Client",
            "role": "client"
        }
    ]
    
    print("🔄 Updating test users in Turso database...\n")
    
    for user_data in test_users:
        email = user_data["email"]
        password = user_data["password"]
        hashed_pw = hash_password(password)
        
        # Check if user exists
        result = client.execute(
            "SELECT id, email FROM users WHERE email = ?",
            [email]
        )
        
        if result.rows:
            # Update existing user
            user_id = result.rows[0][0]
            client.execute(
                """UPDATE users SET 
                   hashed_password = ?,
                   name = ?,
                   user_type = ?,
                   role = ?,
                   is_active = 1,
                   updated_at = ?
                   WHERE email = ?""",
                [
                    hashed_pw,
                    user_data["name"],
                    user_data["user_type"],
                    user_data["role"],
                    datetime.utcnow().isoformat(),
                    email
                ]
            )
            print(f"✅ Updated user: {email} (ID: {user_id})")
        else:
            # Create new user
            client.execute(
                """INSERT INTO users (
                    email, hashed_password, name, user_type, role,
                    is_active, is_verified, email_verified,
                    joined_at, created_at, updated_at, account_balance
                ) VALUES (?, ?, ?, ?, ?, 1, 1, 1, ?, ?, ?, 0.0)""",
                [
                    email,
                    hashed_pw,
                    user_data["name"],
                    user_data["user_type"],
                    user_data["role"],
                    datetime.utcnow().isoformat(),
                    datetime.utcnow().isoformat(),
                    datetime.utcnow().isoformat()
                ]
            )
            print(f"✅ Created user: {email}")
        
        # Verify password works
        verify_result = client.execute(
            "SELECT hashed_password FROM users WHERE email = ?",
            [email]
        )
        if verify_result.rows:
            stored_hash = verify_result.rows[0][0]
            if bcrypt.checkpw(password.encode('utf-8'), stored_hash.encode('utf-8')):
                print(f"   ✓ Password verification successful for {email}")
            else:
                print(f"   ✗ Password verification FAILED for {email}")
        print()
    
    # Show final user count
    result = client.execute("SELECT COUNT(*) FROM users")
    total_users = result.rows[0][0]
    print(f"\n📊 Total users in database: {total_users}")
    print("\n✅ All test users updated successfully!")
    print("\n" + "="*60)
    print("TEST CREDENTIALS:")
    print("="*60)
    print("Admin:       admin@megilance.com / Admin@123")
    print("Freelancer:  freelancer1@example.com / Demo123!")
    print("Client:      client1@example.com / Demo123!")
    print("="*60)

if __name__ == "__main__":
    try:
        create_test_users()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
