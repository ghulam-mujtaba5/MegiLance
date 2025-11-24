"""Quick login test"""
import time
import requests

# Wait for server
time.sleep(3)

url = "http://127.0.0.1:8000/api/auth/login"
data = {"username": "admin@megilance.com", "password": "Admin@123"}

try:
    print("🔍 Testing login...")
    r = requests.post(url, data=data, timeout=5)
    print(f"✅ Status: {r.status_code}")
    if r.status_code == 200:
        json_data = r.json()
        print(f"✅ ✅ ✅ LOGIN SUCCESSFUL! ✅ ✅ ✅")
        print(f"Access token: {json_data.get('access_token', '')[:50]}...")
    else:
        print(f"Response: {r.text[:300]}")
except Exception as e:
    print(f"❌ Error: {e}")
