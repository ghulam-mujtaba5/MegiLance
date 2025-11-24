import sqlite3
import os

db_path = "local.db"

if not os.path.exists(db_path):
    print(f"❌ Database file {db_path} not found!")
    exit(1)

print(f"✅ Database file found: {db_path}")
print(f"📊 Size: {os.path.getsize(db_path) / 1024:.2f} KB")

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Get all tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    
    print(f"\n📋 Found {len(tables)} tables:")
    for table in tables:
        table_name = table[0]
        cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
        count = cursor.fetchone()[0]
        print(f"  - {table_name}: {count} rows")
        
    # Show users
    print("\n👤 Users:")
    cursor.execute("SELECT id, email, user_type, name FROM users")
    users = cursor.fetchall()
    for user in users:
        print(f"  - ID: {user[0]}, Email: {user[1]}, Type: {user[2]}, Name: {user[3]}")

    conn.close()
    
except Exception as e:
    print(f"❌ Error inspecting database: {e}")
