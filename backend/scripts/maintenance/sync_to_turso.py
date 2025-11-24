"""
Sync local SQLite database to Turso cloud database
"""
import sqlite3
import libsql_client
import os
import asyncio
from dotenv import load_dotenv

load_dotenv()

TURSO_URL = os.getenv('TURSO_DATABASE_URL')
TURSO_TOKEN = os.getenv('TURSO_AUTH_TOKEN')
LOCAL_DB = 'local.db'

async def sync_database():
    print("🔄 Starting database sync to Turso...")
    print(f"📊 Local DB: {LOCAL_DB}")
    print(f"☁️  Turso DB: {TURSO_URL}")

    # Connect to local SQLite
    local_conn = sqlite3.connect(LOCAL_DB)
    local_cursor = local_conn.cursor()

    # Connect to Turso
    turso_client = libsql_client.create_client(
        url=TURSO_URL,
        auth_token=TURSO_TOKEN
    )

    # Get all tables
    local_cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [row[0] for row in local_cursor.fetchall()]

    print(f"\n📋 Found {len(tables)} tables to sync")

    for table in tables:
        print(f"\n🔄 Syncing table: {table}")
        
        # Get table schema
        local_cursor.execute(f"SELECT sql FROM sqlite_master WHERE type='table' AND name='{table}';")
        create_table_sql = local_cursor.fetchone()[0]
        
        # Create table in Turso (if not exists)
        try:
            await turso_client.execute(f"DROP TABLE IF EXISTS {table}")
            await turso_client.execute(create_table_sql)
            print(f"  ✓ Table created in Turso")
        except Exception as e:
            print(f"  ⚠️  Error creating table: {e}")
            continue
        
        # Get all data
        local_cursor.execute(f"SELECT * FROM {table}")
        rows = local_cursor.fetchall()
        
        if len(rows) == 0:
            print(f"  ℹ️  No data to sync")
            continue
        
        # Get column names
        local_cursor.execute(f"PRAGMA table_info({table})")
        columns = [col[1] for col in local_cursor.fetchall()]
        
        # Insert data
        placeholders = ','.join(['?' for _ in columns])
        insert_sql = f"INSERT INTO {table} ({','.join(columns)}) VALUES ({placeholders})"
        
        success_count = 0
        for row in rows:
            try:
                await turso_client.execute(insert_sql, list(row))
                success_count += 1
            except Exception as e:
                print(f"  ⚠️  Error inserting row: {e}")
        
        print(f"  ✓ Synced {success_count}/{len(rows)} rows")

    local_conn.close()
    print("\n✅ Database sync complete!")

if __name__ == "__main__":
    asyncio.run(sync_database())
