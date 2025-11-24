"""
Test login endpoint
"""
import requests

url = "http://127.0.0.1:8000/api/auth/login"
data = {
    "username": "admin@megilance.com",
    "password": "Admin@123"
}

print(f"🔍 Testing login endpoint")
print(f"   URL: {url}")
print(f"   Email: {data['username']}")

try:
    response = requests.post(url, data=data)
    print(f"\n📡 Response status: {response.status_code}")
    print(f"   Response: {response.text}")
    
    if response.status_code == 200:
        json_data = response.json()
        print(f"\n✅ ✅ ✅ LOGIN SUCCESSFUL! ✅ ✅ ✅")
        print(f"   Access token: {json_data.get('access_token', '')[:50]}...")
        print(f"   Token type: {json_data.get('token_type', '')}")
    else:
        print(f"\n❌ Login failed")
except Exception as e:
    print(f"\n❌ Error: {e}")
