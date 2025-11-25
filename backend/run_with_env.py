"""Simple script to run uvicorn with .env loaded"""
import os
from dotenv import load_dotenv

# Load .env file
load_dotenv()

# Print env vars to verify
print("=" * 60)
print("ENVIRONMENT VARIABLES:")
print(f"TURSO_DATABASE_URL: {os.getenv('TURSO_DATABASE_URL', 'NOT SET')[:50]}...")
print(f"TURSO_AUTH_TOKEN: {'SET' if os.getenv('TURSO_AUTH_TOKEN') else 'NOT SET'}")
print(f"DATABASE_URL: {os.getenv('DATABASE_URL', 'NOT SET')}")
print("=" * 60)

# Run uvicorn
import uvicorn
uvicorn.run("main:app", host="0.0.0.0", port=8000, log_level="info")
