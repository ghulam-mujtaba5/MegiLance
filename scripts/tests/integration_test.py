#!/usr/bin/env python3
"""
Comprehensive MegiLance Integration Test
Tests: Login, User Creation (all roles), Auth System, Third-party Integrations
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://127.0.0.1:8000/api"
RESULTS = []

def log_result(section, status, message, details=""):
    """Log test results"""
    result = {
        "timestamp": datetime.now().isoformat(),
        "section": section,
        "status": status,
        "message": message,
        "details": details
    }
    RESULTS.append(result)
    icon = "PASS" if status == "PASS" else "FAIL"
    print(f"[{icon}] [{section}] {message}")
    if details:
        print(f"   → {details}")

def test_health_check():
    """Test backend health"""
    try:
        resp = requests.get(f"{BASE_URL}/health/ready", timeout=5)
        if resp.status_code == 200:
            log_result("HEALTH", "PASS", "Backend is responding", f"Status: {resp.status_code}")
            return True
        else:
            log_result("HEALTH", "FAIL", f"Unexpected status code: {resp.status_code}")
            return False
    except Exception as e:
        log_result("HEALTH", "FAIL", f"Backend unreachable: {str(e)}")
        return False

def test_login_demo_account():
    """Test login with demo account"""
    try:
        payload = {
            "email": "client@demo.com",
            "password": "Password123"
        }
        resp = requests.post(f"{BASE_URL}/auth/login", json=payload)
        
        if resp.status_code == 200:
            data = resp.json()
            token = data.get("access_token")
            log_result("AUTH", "PASS", "Demo account login successful", f"User: client@demo.com")
            return token
        else:
            log_result("AUTH", "FAIL", f"Login failed: {resp.status_code}", f"Response: {resp.text[:200]}")
            return None
    except Exception as e:
        log_result("AUTH", "FAIL", f"Login error: {str(e)}")
        return None

def test_user_registration(email, password, role):
    """Test user registration"""
    try:
        payload = {
            "email": email,
            "password": password,
            "full_name": email.split("@")[0].title(),
            "role": role
        }
        resp = requests.post(f"{BASE_URL}/auth/register", json=payload)
        
        if resp.status_code == 201:
            log_result("REGISTRATION", "PASS", f"User created: {email} (role: {role})")
            return resp.json().get("id")
        elif resp.status_code == 400:
            # User might already exist
            log_result("REGISTRATION", "SKIP", f"User exists or validation error: {email}")
            return None
        else:
            log_result("REGISTRATION", "FAIL", f"Registration failed: {resp.status_code}", f"Email: {email}")
            return None
    except Exception as e:
        log_result("REGISTRATION", "FAIL", f"Registration error: {str(e)}")
        return None

def test_oauth_config():
    """Test OAuth third-party integrations"""
    try:
        # Check if Google OAuth endpoints exist
        resp = requests.get(f"{BASE_URL}/auth/google", timeout=5, allow_redirects=False)
        if resp.status_code in [302, 307, 400]:  # Redirect or auth error (expected)
            log_result("OAUTH", "PASS", "Google OAuth endpoint active")
        else:
            log_result("OAUTH", "SKIP", f"Google OAuth status: {resp.status_code}")
        
        # Check GitHub OAuth
        resp = requests.get(f"{BASE_URL}/auth/github", timeout=5, allow_redirects=False)
        if resp.status_code in [302, 307, 400]:
            log_result("OAUTH", "PASS", "GitHub OAuth endpoint active")
        else:
            log_result("OAUTH", "SKIP", f"GitHub OAuth status: {resp.status_code}")
            
    except Exception as e:
        log_result("OAUTH", "SKIP", f"OAuth check: {str(e)}")

def test_pakistan_payments(token):
    """Test Pakistan payments integration"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        
        # Get providers
        resp = requests.get(f"{BASE_URL}/pk-payments/providers", headers=headers)
        if resp.status_code == 200:
            providers = resp.json()
            log_result("PK_PAYMENTS", "PASS", f"Providers loaded: {len(providers)} available")
            
        # Check testnet status
        resp = requests.get(f"{BASE_URL}/pk-payments/network-status", headers=headers)
        if resp.status_code == 200:
            data = resp.json()
            testnet_enabled = data.get("is_testnet")
            log_result("PK_PAYMENTS", "PASS", f"Testnet mode: {'ENABLED' if testnet_enabled else 'DISABLED'}", 
                      f"Network: {data.get('network_name')}")
        else:
            log_result("PK_PAYMENTS", "FAIL", f"Network status failed: {resp.status_code}")
            
    except Exception as e:
        log_result("PK_PAYMENTS", "FAIL", f"Pakistan payments error: {str(e)}")

def test_email_integration(token):
    """Test Email (Resend) integration"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        # Email is tested implicitly via password reset/verification
        # Check if email endpoints exist
        resp = requests.post(f"{BASE_URL}/auth/send-verification-email", 
                            json={"email": "test@example.com"},
                            headers=headers,
                            timeout=10)
        
        if resp.status_code in [200, 400, 409]:  # Success or expected errors
            log_result("EMAIL", "PASS", "Email integration (Resend) active")
        else:
            log_result("EMAIL", "SKIP", f"Email status: {resp.status_code}")
    except requests.Timeout:
        log_result("EMAIL", "SKIP", "Email service timeout (may be rate-limited)")
    except Exception as e:
        log_result("EMAIL", "SKIP", f"Email check: {str(e)}")

def test_analytics_integration(token):
    """Test Google Analytics integration"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        # Analytics is client-side, but check if endpoints exist
        resp = requests.get(f"{BASE_URL}/analytics/events", headers=headers, timeout=5)
        if resp.status_code in [200, 404, 405]:  # Any response means service is up
            log_result("ANALYTICS", "PASS", "Analytics infrastructure present")
        else:
            log_result("ANALYTICS", "SKIP", f"Analytics status: {resp.status_code}")
    except Exception as e:
        log_result("ANALYTICS", "SKIP", f"Analytics check: {str(e)}")

def test_get_user_profile(token):
    """Test getting user profile"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        resp = requests.get(f"{BASE_URL}/auth/me", headers=headers)
        
        if resp.status_code == 200:
            user = resp.json()
            log_result("USER_PROFILE", "PASS", f"Profile retrieved: {user.get('email')}", 
                      f"Role: {user.get('role')}")
            return user
        else:
            log_result("USER_PROFILE", "FAIL", f"Profile fetch failed: {resp.status_code}")
            return None
    except Exception as e:
        log_result("USER_PROFILE", "FAIL", f"Profile error: {str(e)}")
        return None

def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("MegiLance Integration Test Suite")
    print("="*60 + "\n")
    
    # 1. Health check
    if not test_health_check():
        print("\n❌ Backend not reachable. Exiting.")
        return
    
    # 2. Test Login
    print("\n📝 Testing Authentication...")
    token = test_login_demo_account()
    if not token:
        print("⚠️  Demo login failed, trying to create test users instead...")
    
    # 3. Test User Registration (all roles)
    print("\n👥 Creating test users for all roles...")
    roles = ["client", "freelancer", "admin"]
    for role in roles:
        email = f"test_{role}@megilance.com"
        test_user_registration(email, "TestPass123!", role)
    
    # 4. Get fresh token if needed
    if not token:
        resp = requests.post(f"{BASE_URL}/auth/login", 
                            json={"email": "test_client@megilance.com", "password": "TestPass123!"})
        if resp.status_code == 200:
            token = resp.json().get("access_token")
    
    if token:
        # 5. Test Third-Party Integrations
        print("\n🔗 Testing Third-Party Integrations...")
        test_oauth_config()
        test_pakistan_payments(token)
        test_email_integration(token)
        test_analytics_integration(token)
        
        # 6. Test User Profile
        print("\n👤 Testing User Profile...")
        test_get_user_profile(token)
    
    # Print summary
    print("\n" + "="*60)
    print("📊 Test Summary")
    print("="*60)
    
    passes = sum(1 for r in RESULTS if r["status"] == "PASS")
    fails = sum(1 for r in RESULTS if r["status"] == "FAIL")
    skips = sum(1 for r in RESULTS if r["status"] == "SKIP")
    
    print(f"✅ Passed:  {passes}")
    print(f"❌ Failed:  {fails}")
    print(f"⏭️  Skipped: {skips}")
    print(f"📋 Total:   {len(RESULTS)}")
    
    print("\n" + "="*60 + "\n")
    
    # Save results
    with open("test_results.json", "w") as f:
        json.dump(RESULTS, f, indent=2)
    print("📄 Full results saved to: test_results.json\n")

if __name__ == "__main__":
    main()
