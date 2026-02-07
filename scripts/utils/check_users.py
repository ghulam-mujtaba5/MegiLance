import os
import sys

os.chdir(r'e:\MegiLance\backend')
sys.path.insert(0, r'e:\MegiLance\backend')

from sqlalchemy import create_engine, text

# Connect to database
engine = create_engine('sqlite:///./local_dev.db', connect_args={'check_same_thread': False})

print("=" * 60)
print("Checking users in database")
print("=" * 60)

try:
    with engine.connect() as conn:
        result = conn.execute(text('SELECT id, email, name, is_active, role FROM users'))
        print("\nExisting users:")
        for row in result:
            print(f"  ID: {row[0]}, Email: {row[1]}, Name: {row[2]}, Active: {row[3]}, Role: {row[4]}")
        
        # Check if client@demo.com exists
        demo_check = conn.execute(text("SELECT id FROM users WHERE email = 'client@demo.com'"))
        if demo_check.scalar():
            print("\n✓ Demo user client@demo.com already exists")
        else:
            print("\n✗ Demo user client@demo.com NOT found")
            print("\nNote: The model expects 'user_type' column but table has 'role' column")
            
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 60)
