"""Quick test of updated DevQuickLogin credentials"""
import requests
import json

BASE_URL = "http://localhost:8000/api"

# Test credentials from updated DevQuickLogin component (working credentials)
test_accounts = [
    {
        'role': 'Admin',
        'email': 'admin@megilance.com',
        'password': 'Admin@123'
    },
    {
        'role': 'Freelancer', 
        'email': 'freelancer1@example.com',
        'password': 'Freelancer@123'
    },
    {
        'role': 'Client',
        'email': 'client1@example.com',
        'password': 'Client@123'
    }
]

print("=" * 80)
print("🧪 Testing Updated DevQuickLogin Credentials")
print("=" * 80)

all_passed = True

for account in test_accounts:
    role = account['role']
    email = account['email']
    password = account['password']
    
    print(f"\n{'='*80}")
    print(f"Testing {role}: {email}")
    print(f"{'='*80}")
    
    try:
        # Test login
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json={"email": email, "password": password},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            token = data.get('access_token')
            
            print(f"✅ Login successful!")
            print(f"   Token: {token[:50]}..." if token else "   No token received")
            
            # Test /me endpoint to verify role
            if token:
                me_response = requests.get(
                    f"{BASE_URL}/auth/me",
                    headers={"Authorization": f"Bearer {token}"},
                    timeout=10
                )
                
                if me_response.status_code == 200:
                    user_data = me_response.json()
                    print(f"   User Type: {user_data.get('user_type')}")
                    print(f"   Full Name: {user_data.get('full_name')}")
                    print(f"   Email: {user_data.get('email')}")
                    
                    # Verify role matches
                    expected_role = role.lower()
                    actual_role = user_data.get('user_type', '').lower()
                    
                    if expected_role == actual_role:
                        print(f"   ✅ Role verification PASSED")
                    else:
                        print(f"   ❌ Role mismatch: expected '{expected_role}', got '{actual_role}'")
                        all_passed = False
                else:
                    print(f"   ❌ /me endpoint failed: {me_response.status_code}")
                    all_passed = False
        else:
            print(f"❌ Login FAILED!")
            print(f"   Status: {response.status_code}")
            print(f"   Response: {response.text[:200]}")
            all_passed = False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        all_passed = False

print(f"\n{'='*80}")
if all_passed:
    print("✅✅✅ ALL TESTS PASSED! DevQuickLogin credentials are working! ✅✅✅")
else:
    print("❌ SOME TESTS FAILED - Please check the output above")
print(f"{'='*80}\n")
