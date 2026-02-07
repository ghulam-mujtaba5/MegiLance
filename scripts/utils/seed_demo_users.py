#!/usr/bin/env python3
import os
import sys

os.chdir(r'e:\MegiLance\backend')
sys.path.insert(0, r'e:\MegiLance\backend')

from app.db.session import get_engine
from sqlalchemy import text
from app.core.security import get_password_hash

engine = get_engine()

print("=" * 60)
print("User Database Check")
print("=" * 60)

try:
    with engine.connect() as conn:
        # Get existing users
        result = conn.execute(text("SELECT id, email, hashed_password FROM users"))
        users = result.fetchall()
        print(f"\nFound {len(users)} users:")
        for user_id, email, pwd_hash in users:
            password_sample = pwd_hash[:20] + "..." if pwd_hash else "NONE"
            print(f"  ID: {user_id}, Email: {email}, Hash: {password_sample}")
        
        # Check for demo user
        print("\nLooking for demo user: client@demo.com")
        result = conn.execute(text("SELECT id FROM users WHERE email = 'client@demo.com'"))
        demo_user = result.scalar()
        
        if not demo_user:
            print("✗ Demo user not found - creating it now...")
            hashed = get_password_hash("Password123")
            
            # Insert demo client
            conn.execute(text("""
                INSERT INTO users (email, hashed_password, is_active, name, role, user_type, joined_at, created_at)
                VALUES (?, ?, 1, 'Demo Client', 'client', 'client', datetime('now'), datetime('now'))
            """), [("client@demo.com", hashed)])
            
            # Insert demo freelancer
            conn.execute(text("""
                INSERT INTO users (email, hashed_password, is_active, name, role, user_type, hourly_rate, joined_at, created_at)
                VALUES (?, ?, 1, 'Demo Freelancer', 'freelancer', 'freelancer', 50.0, datetime('now'), datetime('now'))
            """), [("freelancer@demo.com", hashed)])
            
            # Insert demo admin
            conn.execute(text("""
                INSERT INTO users (email, hashed_password, is_active, name, role, user_type, joined_at, created_at)
                VALUES (?, ?, 1, 'Demo Admin', 'admin', 'admin', datetime('now'), datetime('now'))
            """), [("admin@demo.com", hashed)])
            
            conn.commit()
            print("✓ Demo users created successfully!")
            print("\nDemo accounts:")
            print("  1. client@demo.com (Client)")
            print("  2. freelancer@demo.com (Freelancer)")
            print("  3. admin@demo.com (Admin)")
            print("  Password: Password123")
        else:
            print(f"✓ Demo user exists with ID: {demo_user}")
            
except Exception as e:
    print(f"\n✗ Error: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 60)
