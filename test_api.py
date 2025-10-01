import requests
import json

# Test the login endpoint
login_url = "http://localhost:8000/api/auth/login"
login_data = {
    "email": "client1@example.com",
    "password": "password123"
}

print("Attempting to login...")
response = requests.post(login_url, json=login_data)

if response.status_code == 200:
    login_result = response.json()
    print("Login successful!")
    print("Response:", json.dumps(login_result, indent=2))
    
    # Extract the access token
    access_token = login_result.get("access_token")
    if access_token:
        print(f"\nAccess token: {access_token}")
        
        # Test the client projects endpoint
        projects_url = "http://localhost:8000/api/client/projects"
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/json"
        }
        
        print("\nFetching client projects...")
        projects_response = requests.get(projects_url, headers=headers)
        
        if projects_response.status_code == 200:
            projects_data = projects_response.json()
            print("Projects fetched successfully!")
            print("Projects data:", json.dumps(projects_data, indent=2))
        else:
            print(f"Failed to fetch projects. Status code: {projects_response.status_code}")
            print("Response:", projects_response.text)
    else:
        print("No access token found in login response")
else:
    print(f"Login failed. Status code: {response.status_code}")
    print("Response:", response.text)