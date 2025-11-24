"""Quick admin endpoint test"""
import requests
import time

print("Waiting 5 seconds for rate limit...")
time.sleep(5)

print("\n1. Testing admin login...")
response = requests.post(
    "http://127.0.0.1:8000/api/auth/login",
    json={"email": "admin@megilance.com", "password": "Admin@123"}
)

print(f"   Status: {response.status_code}")

if response.status_code == 200:
    data = response.json()
    token = data.get("access_token")
    print(f"   ✅ Got token: {token[:50]}...")
    
    print("\n2. Testing /me endpoint...")
    me_response = requests.get(
        "http://127.0.0.1:8000/api/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    print(f"   Status: {me_response.status_code}")
    if me_response.status_code == 200:
        user = me_response.json()
        print(f"   User: id={user.get('id')}, email={user.get('email')}, user_type={user.get('user_type')}")
    
    print("\n3. Testing admin dashboard...")
    admin_response = requests.get(
        "http://127.0.0.1:8000/api/admin/dashboard/stats",
        headers={"Authorization": f"Bearer {token}"}
    )
    print(f"   Status: {admin_response.status_code}")
    if admin_response.status_code == 200:
        print(f"   ✅ Success! Stats: {admin_response.json()}")
    else:
        print(f"   ❌ Failed: {admin_response.text}")
else:
    print(f"   ❌ Login failed: {response.text}")
