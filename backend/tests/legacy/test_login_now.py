import requests
import json

url = "http://127.0.0.1:8000/api/auth/login"
payload = {
    "email": "admin@megilance.com",
    "password": "Admin@123"
}

try:
    response = requests.post(url, json=payload)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code == 200:
        print("\n✅ LOGIN SUCCESSFUL!")
        data = response.json()
        if "access_token" in data:
            print(f"✅ Access Token received: {data['access_token'][:50]}...")
        if "user" in data:
            print(f"✅ User data: {data['user']}")
    else:
        print(f"\n❌ LOGIN FAILED: {response.json()}")
except Exception as e:
    print(f"❌ Error: {e}")
