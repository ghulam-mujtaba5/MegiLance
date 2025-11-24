#!/usr/bin/env python3
"""
Create all database tables directly using SQLAlchemy create_all()
This bypasses Alembic and creates tables from the models
"""
import os
import sys
from sqlalchemy import text
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add current directory to path to allow imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.base import Base
# Import all models to ensure they are registered
from app.models import *
from app.db.session import get_engine

print("\n🔨 Creating all database tables...")

# Use the engine from the app configuration
engine = get_engine()
print(f"📊 Engine: {engine.url}")

# Import all models so they're registered with Base
print("\n📦 Loaded models:")
for table_name in Base.metadata.tables:
    print(f"  - {table_name}")

# Create all tables
try:
    Base.metadata.create_all(bind=engine, checkfirst=True)
    print("\n✅ All tables created successfully!")
    
    # Verify
    with engine.connect() as conn:
        # Check for tables - query depends on DB type
        if "sqlite" in str(engine.url) or "libsql" in str(engine.url):
            result = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table';"))
        else:
            # Postgres/Oracle/etc
            result = conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema='public'"))
            
        tables = [row[0] for row in result]
        print(f"\n📊 Total tables in database: {len(tables)}")
        for table in tables:
            print(f"  ✓ {table}")
    
    print("\n🎉 Database schema ready!")
    
except Exception as e:
    print(f"\n❌ Error creating tables: {e}")
    # Don't exit, just print error

