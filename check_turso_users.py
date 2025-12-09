"""Check users in Turso database"""
import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from sqlalchemy import create_engine, text
from app.core.config import Settings

settings = Settings()

print("=" * 80)
print("🔍 Checking Users in Turso Database")
print("=" * 80)
print(f"Database URL: {settings.TURSO_DATABASE_URL[:50]}...")
print()

try:
    # Create engine with Turso connection
    engine = create_engine(
        settings.TURSO_DATABASE_URL,
        connect_args={
            "check_same_thread": False
        } if settings.TURSO_DATABASE_URL.startswith("sqlite") else {}
    )
    
    with engine.connect() as conn:
        # Get all users
        result = conn.execute(text("""
            SELECT id, email, full_name, user_type, is_active, created_at
            FROM users
            ORDER BY user_type, email
        """))
        
        users = result.fetchall()
        
        if not users:
            print("❌ No users found in database!")
        else:
            print(f"✅ Found {len(users)} users:\n")
            
            # Group by user type
            admins = []
            freelancers = []
            clients = []
            
            for user in users:
                user_id, email, full_name, user_type, is_active, created_at = user
                user_info = {
                    'id': user_id,
                    'email': email,
                    'name': full_name,
                    'type': user_type,
                    'active': is_active
                }
                
                if user_type == 'admin':
                    admins.append(user_info)
                elif user_type == 'freelancer':
                    freelancers.append(user_info)
                elif user_type == 'client':
                    clients.append(user_info)
            
            # Display by role
            print("👑 ADMIN ACCOUNTS:")
            if admins:
                for user in admins:
                    status = "✓" if user['active'] else "✗"
                    print(f"  {status} {user['email']:<40} | {user['name']}")
            else:
                print("  No admin accounts found")
            
            print("\n👨‍💻 FREELANCER ACCOUNTS:")
            if freelancers:
                for user in freelancers[:10]:  # Show first 10
                    status = "✓" if user['active'] else "✗"
                    print(f"  {status} {user['email']:<40} | {user['name']}")
                if len(freelancers) > 10:
                    print(f"  ... and {len(freelancers) - 10} more")
            else:
                print("  No freelancer accounts found")
            
            print("\n👔 CLIENT ACCOUNTS:")
            if clients:
                for user in clients[:10]:  # Show first 10
                    status = "✓" if user['active'] else "✗"
                    print(f"  {status} {user['email']:<40} | {user['name']}")
                if len(clients) > 10:
                    print(f"  ... and {len(clients) - 10} more")
            else:
                print("  No client accounts found")
            
            # Show recommended test accounts
            print("\n" + "=" * 80)
            print("💡 RECOMMENDED TEST ACCOUNTS FOR QUICK LOGIN:")
            print("=" * 80)
            
            # Find the best test accounts based on TEST_CREDENTIALS.md
            test_accounts = {
                'admin': 'admin.real@megilance.com',
                'freelancer': 'alex.fullstack@megilance.com',
                'client': 'sarah.tech@megilance.com'
            }
            
            for role, email in test_accounts.items():
                found = next((u for u in users if u[1] == email), None)
                if found:
                    print(f"  ✅ {role.upper():<12} | {email:<40} | Active: {found[4]}")
                else:
                    print(f"  ❌ {role.upper():<12} | {email:<40} | NOT FOUND")
            
            print("\n" + "=" * 80)
            print("📝 NOTE: All test accounts use password: Test123!@#")
            print("=" * 80)
            
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
