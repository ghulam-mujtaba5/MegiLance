"""Test admin endpoint"""
import requests

# Login
login_response = requests.post(
    "http://127.0.0.1:8000/api/auth/login",
    json={"email": "admin@megilance.com", "password": "Admin@123"}
)

print(f"Login Status: {login_response.status_code}")
login_data = login_response.json()
token = login_data.get("access_token")
print(f"Token received: {token[:50] if token else 'None'}...")

# Test admin endpoint
if token:
    admin_response = requests.get(
        "http://127.0.0.1:8000/api/admin/dashboard/stats",
        headers={"Authorization": f"Bearer {token}"}
    )
    print(f"\nAdmin Dashboard Status: {admin_response.status_code}")
    print(f"Response: {admin_response.text[:300]}")
