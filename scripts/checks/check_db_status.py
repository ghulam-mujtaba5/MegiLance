import os
import sys

os.chdir(r'e:\MegiLance\backend')
sys.path.insert(0, r'e:\MegiLance\backend')

from sqlalchemy import create_engine, text
from app.core.security import get_password_hash

# Connect to database
engine = create_engine('sqlite:///./local_dev.db', connect_args={'check_same_thread': False})

print("=" * 60)
print("Database Status Check")
print("=" * 60)

try:
    with engine.connect() as conn:
        # Check tables
        result = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table'"))
        tables = [row[0] for row in result]
        print(f"\n✓ Tables found: {len(tables)}")
        
        if 'user' in tables:
            # Check user count
            result = conn.execute(text('SELECT COUNT(*) FROM user'))
            count = result.scalar()
            print(f"✓ Users in database: {count}")
            
            # Show users
            if count > 0:
                result = conn.execute(text('SELECT id, email, is_active FROM user LIMIT 5'))
                print(f"\nExisting users:")
                for row in result:
                    print(f"  - ID: {row[0]}, Email: {row[1]}, Active: {row[2]}")
            else:
                print("\n⚠️  No users found - need to seed database")
                print("\nCreating demo user: client@demo.com / Password123")
                
                # Hash password
                hashed = get_password_hash("Password123")
                
                # Insert user
                conn.execute(text("""
                    INSERT INTO user (email, hashed_password, is_active, name, user_type, joined_at)
                    VALUES (?, ?, 1, 'Demo Client', 'client', datetime('now'))
                """), [("client@demo.com", hashed)])
                
                conn.commit()
                print("✓ Demo user created!")
        else:
            print("✗ User table not found!")
            
except Exception as e:
    print(f"✗ Error: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 60)
