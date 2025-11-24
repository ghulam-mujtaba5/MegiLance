"""
Sync Turso data to local SQLite database
"""
import asyncio
from libsql_client import create_client
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

async def main():
    # Connect to Turso
    turso_url = os.getenv("TURSO_DATABASE_URL", "").replace('libsql://', 'https://')
    turso_token = os.getenv("TURSO_AUTH_TOKEN", "")
    
    print(f"🔄 Connecting to Turso...")
    turso_client = create_client(url=turso_url, auth_token=turso_token)
    
    # Connect to local SQLite
    local_engine = create_engine("sqlite:///./turso_cache.db", connect_args={"check_same_thread": False})
    
    #  Create tables if they don't exist
    from app.db.base import Base
    Base.metadata.create_all(bind=local_engine)
    print(f"✅ Local database tables created")
    
    print(f"📥 Fetching users from Turso...")
    result = await turso_client.execute("SELECT * FROM users")
    
    print(f"✅ Found {len(result.rows)} users in Turso")
    
    # Sync to local
    with local_engine.connect() as conn:
        # Clear existing users
        conn.execute(text("DELETE FROM users"))
        
        # Insert Turso users
        for row in result.rows:
            columns = result.columns
            values = {columns[i]: row[i] for i in range(len(columns))}
            
            placeholders = ', '.join([f':{col}' for col in columns])
            cols = ', '.join(columns)
            sql = f"INSERT INTO users ({cols}) VALUES ({placeholders})"
            conn.execute(text(sql), values)
        
        conn.commit()
        print(f"✅ Synced {len(result.rows)} users to local cache")

if __name__ == "__main__":
    asyncio.run(main())
