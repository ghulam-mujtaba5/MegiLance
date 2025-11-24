"""Quick login test"""
import requests

response = requests.post(
    "http://127.0.0.1:8000/api/auth/login",
    json={"email": "admin@megilance.com", "password": "Admin@123"}
)

print(f"Status: {response.status_code}")
print(f"Response: {response.text}")
