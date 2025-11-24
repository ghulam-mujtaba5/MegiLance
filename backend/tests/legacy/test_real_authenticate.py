"""
Test authenticate_user function directly as used by the backend
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv()

from sqlalchemy.orm import Session
from app.db.session import get_engine, get_session_local
from app.core.security import authenticate_user

# Create a real DB session like the endpoint does
SessionLocal = get_session_local()
db = SessionLocal()

try:
    print("Testing authenticate_user with real DB session...")
    user = authenticate_user(db, "admin@megilance.com", "Admin@123")
    
    if user:
        print(f"\n✅ LOGIN SUCCESSFUL!")
        print(f"   User ID: {user.id}")
        print(f"   Email: {user.email}")
        print(f"   Name: {user.name if hasattr(user, 'name') else 'N/A'}")
        print(f"   Role: {user.role if hasattr(user, 'role') else 'N/A'}")
        print(f"   Active: {user.is_active}")
    else:
        print(f"\n❌ LOGIN FAILED - authenticate_user returned None")
finally:
    db.close()
