#!/usr/bin/env python3
"""
@AI-HINT: Seed test users directly into Turso production database
Run this script to create the necessary demo accounts for MegiLance
"""
import os
import sys
import json
from datetime import datetime, timedelta
from passlib.context import CryptContext
import requests

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

# Turso configuration - get from environment or use defaults
TURSO_DATABASE_URL = os.environ.get(
    "TURSO_DATABASE_URL", 
    "libsql://megilance-db-megilance.aws-ap-south-1.turso.io"
).replace("libsql://", "https://")

TURSO_AUTH_TOKEN = os.environ.get(
    "TURSO_AUTH_TOKEN",
    "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NjUyMjY1NTksImlkIjoiZGVmMGE2NzYtMGZiNC00MDAzLTkyNmItMDhlYzA4NjY4MWFkIiwicmlkIjoiYTliOGUwMzctZGQwNi00NTRiLTlmYzgtNGFmMzcxYTg0ODdiIn0.qt4d8AZ587-_i6QWt8f2oUCXuN2w4w0m6YvveN_BSVRFJVH1GM9DL8TuxQfzptpt7HiGBlvGsnbq7zwRrYCyDA"
)

if not TURSO_DATABASE_URL.endswith("/"):
    TURSO_DATABASE_URL += "/"

# Password hasher
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def execute_turso(sql: str, params: list = None):
    """Execute SQL against Turso HTTP API"""
    if params is None:
        params = []
    
    response = requests.post(
        TURSO_DATABASE_URL,
        headers={
            "Authorization": f"Bearer {TURSO_AUTH_TOKEN}",
            "Content-Type": "application/json"
        },
        json={
            "statements": [{
                "q": sql,
                "params": params
            }]
        },
        timeout=30
    )
    
    if response.status_code != 200:
        print(f"Error: {response.status_code} - {response.text}")
        return None
    
    data = response.json()
    if data and len(data) > 0:
        return data[0].get("results", {})
    return {}


def check_user_exists(email: str) -> bool:
    """Check if a user already exists"""
    result = execute_turso("SELECT id FROM users WHERE email = ?", [email])
    if result and result.get("rows"):
        return True
    return False


def seed_users():
    """Seed test users into Turso database"""
    print("🚀 Seeding test users into Turso database...")
    print(f"   Database: {TURSO_DATABASE_URL[:50]}...")
    
    # Test password for all accounts
    test_password = "Test123!@#"
    hashed_pwd = hash_password(test_password)
    now = datetime.utcnow().isoformat()
    
    print(f"\n🔐 All test accounts use password: {test_password}\n")
    
    users = [
        # Client - Sarah Tech
        {
            "email": "sarah.tech@megilance.com",
            "name": "Sarah Tech",
            "user_type": "client",
            "bio": "CTO of TechStart Inc. Looking for talented developers to build our next-generation SaaS platform.",
            "skills": "",
            "hourly_rate": 0,
            "profile_image_url": "https://i.pravatar.cc/150?u=sarah.tech@megilance.com",
            "location": "San Francisco, CA",
        },
        # Freelancer - Alex Rodriguez
        {
            "email": "alex.fullstack@megilance.com",
            "name": "Alex Rodriguez",
            "user_type": "freelancer",
            "bio": "Senior Full-Stack Developer with 10+ years experience. Specialized in React, Node.js, Python, AWS.",
            "skills": "React,Node.js,Python,TypeScript,AWS,Docker,PostgreSQL",
            "hourly_rate": 120.00,
            "profile_image_url": "https://i.pravatar.cc/150?u=alex.fullstack@megilance.com",
            "location": "Austin, TX",
        },
        # Admin
        {
            "email": "admin.real@megilance.com",
            "name": "Admin Master",
            "user_type": "admin",
            "bio": "Platform administrator with full access to all features.",
            "skills": "",
            "hourly_rate": 0,
            "profile_image_url": "https://i.pravatar.cc/150?u=admin.real@megilance.com",
            "location": "Remote",
        },
    ]
    
    created_count = 0
    
    for user in users:
        email = user["email"]
        
        # Check if user exists
        if check_user_exists(email):
            print(f"   ⏭️  {email} - Already exists, updating password...")
            # Update the password for existing user
            execute_turso(
                "UPDATE users SET hashed_password = ?, is_active = 1, is_verified = 1, email_verified = 1, updated_at = ? WHERE email = ?",
                [hashed_pwd, now, email]
            )
            continue
        
        print(f"   ✨ Creating {email}...")
        
        # Insert new user
        result = execute_turso(
            """INSERT INTO users (
                email, hashed_password, is_active, is_verified, email_verified,
                name, user_type, role, bio, skills, hourly_rate,
                profile_image_url, location, two_factor_enabled, account_balance,
                joined_at, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            [
                email,
                hashed_pwd,
                1,  # is_active
                1,  # is_verified
                1,  # email_verified
                user["name"],
                user["user_type"],
                user["user_type"],  # role = user_type
                user["bio"],
                user["skills"],
                user["hourly_rate"],
                user["profile_image_url"],
                user["location"],
                0,  # two_factor_enabled
                0.0,  # account_balance
                now,  # joined_at
                now,  # created_at
                now,  # updated_at
            ]
        )
        
        if result is not None:
            created_count += 1
            print(f"      ✅ Created successfully")
        else:
            print(f"      ❌ Failed to create")
    
    print(f"\n✅ Done! Created {created_count} new users.")
    print(f"\n🧪 Test Credentials:")
    print(f"   ────────────────────────────────────")
    print(f"   Client:     sarah.tech@megilance.com")
    print(f"   Freelancer: alex.fullstack@megilance.com")
    print(f"   Admin:      admin.real@megilance.com")
    print(f"   Password:   {test_password}")
    print(f"   ────────────────────────────────────")


if __name__ == "__main__":
    seed_users()
