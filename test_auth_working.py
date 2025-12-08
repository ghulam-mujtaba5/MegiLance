"""
Test script to verify user registration and login work correctly
"""
import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000/api"

def test_registration():
    """Test user registration"""
    print("\n=== Testing User Registration ===")
    
    # Generate unique email
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    test_user = {
        "email": f"testuser{timestamp}@megilance.com",
        "password": "SecurePass123!",
        "name": "Test User",
        "user_type": "freelancer",
        "bio": "Test freelancer for FYP demo",
        "skills": "Python, JavaScript, React",
        "hourly_rate": 50.0
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/auth/register",
            json=test_user,
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 201:
            data = response.json()
            print(f"✅ Registration successful!")
            print(f"User ID: {data.get('id')}")
            print(f"Email: {data.get('email')}")
            print(f"Name: {data.get('name')}")
            return test_user
        else:
            print(f"❌ Registration failed")
            print(f"Response: {response.text}")
            return None
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend. Is it running on port 8000?")
        print("   Run: cd backend; python -m uvicorn main:app --reload --port 8000")
        return None
    except Exception as e:
        print(f"❌ Error: {e}")
        return None


def test_login(credentials):
    """Test user login"""
    if not credentials:
        print("\n⚠️  Skipping login test - no user credentials")
        return
        
    print("\n=== Testing User Login ===")
    
    login_data = {
        "email": credentials["email"],
        "password": credentials["password"]
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json=login_data,
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Login successful!")
            print(f"Access Token: {data.get('access_token')[:50]}...")
            print(f"User: {data.get('user', {}).get('name')}")
            print(f"User Type: {data.get('user', {}).get('user_type')}")
            return data
        else:
            print(f"❌ Login failed")
            print(f"Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return None


def test_protected_endpoint(token_data):
    """Test accessing protected endpoint"""
    if not token_data:
        print("\n⚠️  Skipping protected endpoint test - no token")
        return
        
    print("\n=== Testing Protected Endpoint (/auth/me) ===")
    
    headers = {
        "Authorization": f"Bearer {token_data['access_token']}"
    }
    
    try:
        response = requests.get(
            f"{BASE_URL}/auth/me",
            headers=headers,
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Protected endpoint accessible!")
            print(f"Current User: {data.get('name')} ({data.get('email')})")
            print(f"Account Balance: ${data.get('account_balance', 0):.2f}")
        else:
            print(f"❌ Access denied")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")


if __name__ == "__main__":
    print("=" * 60)
    print("MegiLance Authentication Test Suite")
    print("=" * 60)
    
    # Test registration
    user_creds = test_registration()
    
    # Test login
    token_data = test_login(user_creds)
    
    # Test protected endpoint
    test_protected_endpoint(token_data)
    
    print("\n" + "=" * 60)
    print("✅ All authentication tests complete!")
    print("=" * 60)
