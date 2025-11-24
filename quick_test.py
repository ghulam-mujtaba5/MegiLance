"""
Quick test to verify all endpoints are working
Tests without AI features
"""
import requests
import json

BASE_URL = "http://localhost:3000/backend/api"

def test_admin_flow():
    print("\n=== Testing Admin Flow ===")
    
    # 1. Login as admin
    print("1. Logging in as admin...")
    response = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "admin@megilance.com",
        "password": "Admin@123"
    })
    
    if response.status_code != 200:
        print(f"❌ Login failed: {response.status_code} - {response.text}")
        return
    
    token = response.json()["access_token"]
    print(f"✅ Login successful - Token: {token[:30]}...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Test dashboard stats
    print("\n2. Testing dashboard stats...")
    response = requests.get(f"{BASE_URL}/admin/dashboard/stats", headers=headers)
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"   ✅ Total users: {data['total_users']}")
        print(f"   ✅ Total projects: {data['total_projects']}")
    else:
        print(f"   ❌ Error: {response.text[:200]}")
    
    # 3. Test users list
    print("\n3. Testing users list...")
    response = requests.get(f"{BASE_URL}/admin/users", headers=headers)
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"   ✅ Total users: {data.get('total', 0)}")
    else:
        print(f"   ❌ Error: {response.text[:200]}")
    
    # 4. Test projects list
    print("\n4. Testing projects list...")
    response = requests.get(f"{BASE_URL}/admin/projects", headers=headers)
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"   ✅ Total projects: {data.get('total', 0)}")
    else:
        print(f"   ❌ Error: {response.text[:200]}")
    
    # 5. Test payments list
    print("\n5. Testing payments list...")
    response = requests.get(f"{BASE_URL}/admin/payments", headers=headers)
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"   ✅ Total payments: {data.get('total', 0)}")
    else:
        print(f"   ❌ Error: {response.text[:200]}")
    
    # 6. Test analytics
    print("\n6. Testing analytics...")
    response = requests.get(f"{BASE_URL}/admin/analytics/overview", headers=headers)
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"   ✅ Analytics: {json.dumps(data, indent=2)}")
    else:
        print(f"   ❌ Error: {response.text[:200]}")

def test_user_passwords():
    """Test if we can login with different users"""
    print("\n=== Testing User Authentication ===")
    
    users = [
        ("admin@megilance.com", "Admin@123", "Admin"),
        ("client1@example.com", "Demo123!", "Client"),
        ("freelancer1@example.com", "Demo123!", "Freelancer"),
    ]
    
    for email, password, role in users:
        print(f"\nTesting {role}: {email}")
        response = requests.post(f"{BASE_URL}/auth/login", json={
            "email": email,
            "password": password
        })
        
        if response.status_code == 200:
            print(f"   ✅ Login successful")
        else:
            print(f"   ❌ Login failed: {response.status_code} - {response.text[:100]}")

def test_client_dashboard():
    """Test client dashboard after fixing authentication"""
    print("\n=== Testing Client Dashboard ===")
    
    # Try to login
    response = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "client1@example.com",
        "password": "Demo123!"
    })
    
    if response.status_code != 200:
        print(f"❌ Client login failed - skipping dashboard test")
        print(f"   Error: {response.text[:200]}")
        return
    
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test dashboard stats
    response = requests.get(f"{BASE_URL}/client/dashboard/stats", headers=headers)
    print(f"Dashboard stats: {response.status_code}")
    if response.status_code == 200:
        print(f"✅ Client dashboard working: {response.json()}")
    else:
        print(f"❌ Error: {response.text[:200]}")

def test_freelancer_dashboard():
    """Test freelancer dashboard after fixing authentication"""
    print("\n=== Testing Freelancer Dashboard ===")
    
    # Try to login
    response = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "freelancer1@example.com",
        "password": "Demo123!"
    })
    
    if response.status_code != 200:
        print(f"❌ Freelancer login failed - skipping dashboard test")
        print(f"   Error: {response.text[:200]}")
        return
    
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test dashboard stats
    response = requests.get(f"{BASE_URL}/freelancer/dashboard/stats", headers=headers)
    print(f"Dashboard stats: {response.status_code}")
    if response.status_code == 200:
        print(f"✅ Freelancer dashboard working: {response.json()}")
    else:
        print(f"❌ Error: {response.text[:200]}")

if __name__ == "__main__":
    print("="*60)
    print("MegiLance Quick API Test (No AI)")
    print("="*60)
    
    test_user_passwords()
    test_admin_flow()
    test_client_dashboard()
    test_freelancer_dashboard()
    
    print("\n" + "="*60)
    print("Test Complete")
    print("="*60)
