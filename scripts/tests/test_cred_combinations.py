"""Test old vs new credentials"""
import requests

BASE_URL = "http://localhost:8000/api"

print("=" * 80)
print("🔍 Testing Various Credential Combinations")
print("=" * 80)

# Test various combinations
test_combos = [
    # Old credentials from component
    ("admin@megilance.com", "Admin@123", "Old Admin"),
    ("freelancer1@example.com", "Freelancer@123", "Old Freelancer"),
    ("client1@example.com", "Client@123", "Old Client"),
    
    # New credentials from TEST_CREDENTIALS.md
    ("admin.real@megilance.com", "Test123!@#", "New Admin"),
    ("alex.fullstack@megilance.com", "Test123!@#", "New Freelancer"),
    ("sarah.tech@megilance.com", "Test123!@#", "New Client"),
    
    # Alternative passwords
    ("admin.real@megilance.com", "Admin@123", "Admin alt password"),
    ("alex.fullstack@megilance.com", "Freelancer@123", "Freelancer alt password"),
]

for email, password, label in test_combos:
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json={"email": email, "password": password},
            timeout=5
        )
        
        if response.status_code == 200:
            data = response.json()
            user_type = data.get('user', {}).get('user_type', 'Unknown')
            print(f"✅ {label:<30} | {email:<35} | {password:<20} | Type: {user_type}")
        else:
            print(f"❌ {label:<30} | {email:<35} | Status: {response.status_code}")
            
    except Exception as e:
        print(f"❌ {label:<30} | Error: {e}")

print("=" * 80)
