# Quick test script to check proposal submission
import requests

# Login
login_response = requests.post(
    "http://localhost:8000/api/auth/login",
    json={"email": "alex.fullstack@megilance.com", "password": "Test123!@#"}
)
token = login_response.json()["access_token"]
print(f"Got token: {token[:50]}...")

# Check user info
headers = {"Authorization": f"Bearer {token}"}
me = requests.get("http://localhost:8000/api/auth/me", headers=headers)
print(f"User type: {me.json().get('user_type')}")

# Submit proposal
proposal_data = {
    "project_id": 61,
    "cover_letter": "I am very interested in this project and have extensive experience with React and Node.js. I have completed over 50 similar projects and can deliver high quality work within the specified timeframe.",
    "bid_amount": 750,
    "estimated_hours": 40,
    "hourly_rate": 50,
    "availability": "full-time"
}

response = requests.post(
    "http://localhost:8000/api/proposals/",
    json=proposal_data,
    headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
)

print(f"Status: {response.status_code}")
print(f"Response: {response.text}")
