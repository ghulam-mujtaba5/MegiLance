"""Test if get_turso_client() is working"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv()

from app.db.session import get_turso_client

print("Testing get_turso_client()...")
client = get_turso_client()

if client:
    print(f"✅ Turso client created successfully")
    print(f"   Type: {type(client)}")
    print(f"   Has execute method: {hasattr(client, 'execute')}")
else:
    print(f"❌ Failed to create Turso client")
    print(f"   TURSO_DATABASE_URL: {os.getenv('TURSO_DATABASE_URL')}")
    print(f"   TURSO_AUTH_TOKEN: {'SET' if os.getenv('TURSO_AUTH_TOKEN') else 'NOT SET'}")
