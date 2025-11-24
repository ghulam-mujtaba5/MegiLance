import requests
import json
from jose import jwt

BASE_URL = "http://127.0.0.1:8000"

# Login as freelancer
login_response = requests.post(
    f"{BASE_URL}/api/auth/login",
    json={"email": "freelancer1@example.com", "password": "freelancer123"}
)

print(f"Login status: {login_response.status_code}")
print(f"Login response: {json.dumps(login_response.json(), indent=2)}")

if login_response.status_code == 200:
    token = login_response.json()["access_token"]
    print(f"\n🔑 Freelancer Token (first 50 chars): {token[:50]}...")
    
    # Decode token to see payload (without verification for debugging)
    try:
        decoded = jwt.decode(token, options={"verify_signature": False})
        print(f"\n📦 Token Payload:")
        print(json.dumps(decoded, indent=2))
    except Exception as e:
        print(f"Error decoding token: {e}")
    
    # Try to access /me endpoint
    print(f"\n📡 Testing /api/auth/me endpoint...")
    me_response = requests.get(
        f"{BASE_URL}/api/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    print(f"Status: {me_response.status_code}")
    print(f"Response: {me_response.text}")
