#!/usr/bin/env python3
"""
Check what users exist in Turso and try different login combinations
"""
import requests
import json

BASE_URL = "http://127.0.0.1:8000"

# Try different combinations
test_logins = [
    {"email": "admin@megilance.com", "password": "Admin@123", "label": "Admin (current working)"},
    {"email": "freelancer1@megilance.com", "password": "Demo123!", "label": "Freelancer (Demo123!)"},
    {"email": "freelancer1@megilance.com", "password": "Password123!", "label": "Freelancer (Password123!)"},
    {"email": "freelancer1@example.com", "password": "Password123!", "label": "Freelancer (example.com)"},
    {"email": "client1@megilance.com", "password": "Demo123!", "label": "Client (Demo123!)"},
    {"email": "client1@megilance.com", "password": "Password123!", "label": "Client (Password123!)"},
]

print("🔐 Testing different login combinations:\n")

for login in test_logins:
    try:
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": login["email"], "password": login["password"]},
            timeout=5
        )
        if response.status_code == 200:
            data = response.json()
            print(f"✅ {login['label']}: SUCCESS")
            print(f"   User: {data.get('user', {}).get('email')}, Type: {data.get('user', {}).get('user_type')}")
        else:
            print(f"❌ {login['label']}: FAILED ({response.status_code})")
    except Exception as e:
        print(f"❌ {login['label']}: ERROR - {e}")
