"""
Initialize Turso database with schema using CLI
"""
import subprocess
import sys
from pathlib import Path

# Read SQL schema from local.db
import sqlite3

print("📊 Extracting schema from local database...")
local_conn = sqlite3.connect('local.db')
cursor = local_conn.cursor()

# Get all table creation SQL
cursor.execute("SELECT sql FROM sqlite_master WHERE type='table' AND sql IS NOT NULL;")
table_sqls = [row[0] for row in cursor.fetchall()]

print(f"Found {len(table_sqls)} tables to create")

# Create schema file
schema_file = Path('turso_schema.sql')
with open(schema_file, 'w') as f:
    for sql in table_sqls:
        f.write(sql + ';\n\n')

print(f"✅ Schema saved to {schema_file}")

# Apply schema to Turso
print("\n🚀 Applying schema to Turso database...")
result = subprocess.run(
    ['turso', 'db', 'shell', 'megilance-db', '.read turso_schema.sql'],
    capture_output=True,
    text=True
)

if result.returncode == 0:
    print("✅ Schema applied successfully!")
else:
    print(f"❌ Error: {result.stderr}")

# Now sync data
print("\n📤 Syncing data to Turso...")

# Get all data
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = [row[0] for row in cursor.fetchall()]

for table in tables:
    cursor.execute(f"SELECT * FROM {table}")
    rows = cursor.fetchall()
    
    if len(rows) == 0:
        print(f"  ⏭️  {table}: no data")
        continue
    
    # Get column info
    cursor.execute(f"PRAGMA table_info({table})")
    columns = [col[1] for col in cursor.fetchall()]
    
    print(f"  🔄 {table}: {len(rows)} rows...")
    
    for row in rows:
        # Create INSERT statement
        values = []
        for val in row:
            if val is None:
                values.append('NULL')
            elif isinstance(val, str):
                # Escape single quotes
                escaped = val.replace("'", "''")
                values.append(f"'{escaped}'")
            else:
                values.append(str(val))
        
        insert_sql = f"INSERT INTO {table} ({','.join(columns)}) VALUES ({','.join(values)});"
        
        result = subprocess.run(
            ['turso', 'db', 'shell', 'megilance-db', insert_sql],
            capture_output=True,
            text=True
        )
        
        if result.returncode != 0:
            print(f"    ⚠️  Error inserting row: {result.stderr[:100]}")
            break

local_conn.close()
print("\n✅ Database initialization complete!")
print("\n🔍 Verify with: turso db shell megilance-db 'SELECT COUNT(*) FROM users;'")
