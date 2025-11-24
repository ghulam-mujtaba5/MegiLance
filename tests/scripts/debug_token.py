"""Quick script to debug JWT tokens"""
import jwt
import requests
import json

# Get a token
response = requests.post(
    "http://127.0.0.1:8000/api/auth/login",
    json={"email": "admin@megilance.com", "password": "Admin@123"}
)

if response.status_code == 200:
    data = response.json()
    token = data["access_token"]
    print(f"Token: {token[:80]}...\n")
    
    # Decode without verification to see contents
    decoded = jwt.decode(token, options={"verify_signature": False})
    print("Token contents:")
    print(json.dumps(decoded, indent=2))
    
    # Try to use it
    print("\n" + "="*60)
    print("Testing token with /api/auth/me endpoint:")
    me_response = requests.get(
        "http://127.0.0.1:8000/api/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    print(f"Status: {me_response.status_code}")
    print(f"Response: {me_response.text}")
else:
    print(f"Login failed: {response.status_code} - {response.text}")
