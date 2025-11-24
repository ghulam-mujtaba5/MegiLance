#!/usr/bin/env python3
"""
MegiLance Comprehensive Testing Suite
Tests all backend endpoints, database connections, and feature functionality
"""

import requests
import json
from typing import Dict, List, Tuple
from datetime import datetime

# Configuration
BASE_URL = "http://127.0.0.1:8000"
FRONTEND_URL = "http://localhost:3000"

# Test credentials
ADMIN_CREDS = {"email": "admin@megilance.com", "password": "Admin@123"}
FREELANCER_CREDS = {"email": "freelancer1@megilance.com", "password": "Demo123!"}
CLIENT_CREDS = {"email": "client1@megilance.com", "password": "Demo123!"}

# Test results tracking
test_results = {
    "passed": [],
    "failed": [],
    "warnings": []
}

def log_test(name: str, status: str, message: str = ""):
    """Log test results"""
    timestamp = datetime.now().strftime("%H:%M:%S")
    status_icon = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
    print(f"{status_icon} [{timestamp}] {name}: {message}")
    
    if status == "PASS":
        test_results["passed"].append(name)
    elif status == "FAIL":
        test_results["failed"].append((name, message))
    else:
        test_results["warnings"].append((name, message))

def test_backend_health():
    """Test backend health endpoints"""
    print("\n🔍 Testing Backend Health...")
    
    try:
        # Test /api/health/live - expecting {"status": "ok"}
        response = requests.get(f"{BASE_URL}/api/health/live", timeout=5)
        if response.status_code == 200:
            log_test("Health Check (Live)", "PASS", f"Backend is alive: {response.json()}")
        else:
            log_test("Health Check (Live)", "FAIL", f"Status: {response.status_code}")
    except Exception as e:
        log_test("Health Check (Live)", "FAIL", str(e))
    
    try:
        # Test /api/health/ready - expecting {"status": "ready"}
        response = requests.get(f"{BASE_URL}/api/health/ready", timeout=5)
        if response.status_code == 200:
            log_test("Health Check (Ready)", "PASS", f"Backend is ready: {response.json()}")
        else:
            log_test("Health Check (Ready)", "FAIL", f"Status: {response.status_code}")
    except Exception as e:
        log_test("Health Check (Ready)", "FAIL", str(e))

def test_authentication():
    """Test authentication endpoints"""
    print("\n🔐 Testing Authentication...")
    
    tokens = {}
    
    # Test admin login
    try:
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json=ADMIN_CREDS,
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            if "access_token" in data and "refresh_token" in data:
                tokens["admin"] = data["access_token"]
                print(f"  🔑 Admin token (first 50 chars): {data['access_token'][:50]}...")
                log_test("Admin Login", "PASS", f"Token received, user: {data.get('user', {}).get('email')}")
            else:
                log_test("Admin Login", "FAIL", "No tokens in response")
        else:
            log_test("Admin Login", "FAIL", f"Status: {response.status_code}, {response.text}")
    except Exception as e:
        log_test("Admin Login", "FAIL", str(e))
    
    # Test freelancer login
    try:
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json=FREELANCER_CREDS,
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            if "access_token" in data:
                tokens["freelancer"] = data["access_token"]
                log_test("Freelancer Login", "PASS", f"Role: {data.get('user', {}).get('role')}")
            else:
                log_test("Freelancer Login", "FAIL", "No tokens in response")
        else:
            log_test("Freelancer Login", "FAIL", f"Status: {response.status_code}")
    except Exception as e:
        log_test("Freelancer Login", "FAIL", str(e))
    
    # Test client login
    try:
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json=CLIENT_CREDS,
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            if "access_token" in data:
                tokens["client"] = data["access_token"]
                log_test("Client Login", "PASS", f"Role: {data.get('user', {}).get('role')}")
            else:
                log_test("Client Login", "FAIL", "No tokens in response")
        else:
            log_test("Client Login", "FAIL", f"Status: {response.status_code}")
    except Exception as e:
        log_test("Client Login", "FAIL", str(e))
    
    return tokens

def test_protected_endpoints(tokens: Dict[str, str]):
    """Test protected endpoints with authentication"""
    print("\n🔒 Testing Protected Endpoints...")
    
    if "admin" in tokens:
        # Test /api/auth/me
        try:
            print(f"  🔑 Testing /me with admin token: {tokens['admin'][:50]}...")
            response = requests.get(
                f"{BASE_URL}/api/auth/me",
                headers={"Authorization": f"Bearer {tokens['admin']}"},
                timeout=5
            )
            print(f"  📡 Response status: {response.status_code}")
            if response.status_code == 200:
                user = response.json()
                print(f"  👤 User object: id={user.get('id')}, email={user.get('email')}, role={user.get('role')}, user_type={user.get('user_type')}")
                log_test("Get Current User (Admin)", "PASS", f"ID: {user.get('id')}, Role: {user.get('role')}")
            else:
                print(f"  ⚠️ Response body: {response.text[:200]}")
                log_test("Get Current User (Admin)", "FAIL", f"Status: {response.status_code}")
        except Exception as e:
            log_test("Get Current User (Admin)", "FAIL", str(e))
    
    if "freelancer" in tokens:
        try:
            response = requests.get(
                f"{BASE_URL}/api/auth/me",
                headers={"Authorization": f"Bearer {tokens['freelancer']}"},
                timeout=5
            )
            if response.status_code == 200:
                user = response.json()
                log_test("Get Current User (Freelancer)", "PASS", f"Role: {user.get('role')}")
            else:
                log_test("Get Current User (Freelancer)", "FAIL", f"Status: {response.status_code}")
        except Exception as e:
            log_test("Get Current User (Freelancer)", "FAIL", str(e))

def test_database_connection():
    """Test database connectivity via user query"""
    print("\n💾 Testing Database Connection...")
    
    try:
        # Test database by querying users endpoint (requires valid data in DB)
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json=ADMIN_CREDS,
            timeout=10
        )
        if response.status_code == 200:
            log_test("Database Connection", "PASS", "Successfully queried database via auth")
        else:
            log_test("Database Connection", "FAIL", "Could not authenticate (DB issue?)")
    except Exception as e:
        log_test("Database Connection", "FAIL", str(e))

def test_admin_endpoints(token: str):
    """Test admin-specific endpoints"""
    print("\n👑 Testing Admin Endpoints...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test get dashboard stats (admin endpoint)
    try:
        response = requests.get(
            f"{BASE_URL}/api/admin/dashboard/stats",
            headers=headers,
            timeout=10
        )
        if response.status_code == 200:
            stats = response.json()
            log_test("Admin: Dashboard Stats", "PASS", f"Total users: {stats.get('total_users', 0)}")
        else:
            log_test("Admin: Dashboard Stats", "FAIL", f"Status: {response.status_code}")
    except Exception as e:
        log_test("Admin: Dashboard Stats", "FAIL", str(e))

def test_projects_api(token: str):
    """Test projects API endpoints"""
    print("\n📋 Testing Projects API...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(
            f"{BASE_URL}/api/projects",
            headers=headers,
            timeout=10
        )
        if response.status_code == 200:
            projects = response.json()
            log_test("Projects: Get All", "PASS", f"Found {len(projects)} projects")
        else:
            log_test("Projects: Get All", "FAIL", f"Status: {response.status_code}")
    except Exception as e:
        log_test("Projects: Get All", "FAIL", str(e))

def test_frontend_accessibility():
    """Test frontend pages accessibility"""
    print("\n🌐 Testing Frontend Accessibility...")
    
    pages = [
        ("/", "Home Page"),
        ("/login", "Login Page"),
        ("/signup", "Signup Page"),
        ("/pricing", "Pricing Page"),
        ("/blog", "Blog Page"),
        ("/contact", "Contact Page"),
    ]
    
    for path, name in pages:
        try:
            response = requests.get(f"{FRONTEND_URL}{path}", timeout=5)
            if response.status_code == 200:
                log_test(f"Frontend: {name}", "PASS", f"Loaded successfully")
            else:
                log_test(f"Frontend: {name}", "FAIL", f"Status: {response.status_code}")
        except Exception as e:
            log_test(f"Frontend: {name}", "FAIL", str(e))

def test_api_documentation():
    """Test API documentation endpoints"""
    print("\n📚 Testing API Documentation...")
    
    try:
        response = requests.get(f"{BASE_URL}/api/docs", timeout=5)
        if response.status_code == 200:
            log_test("API Docs (Swagger)", "PASS", "Documentation accessible")
        else:
            log_test("API Docs (Swagger)", "FAIL", f"Status: {response.status_code}")
    except Exception as e:
        log_test("API Docs (Swagger)", "FAIL", str(e))
    
    try:
        response = requests.get(f"{BASE_URL}/api/openapi.json", timeout=5)
        if response.status_code == 200:
            log_test("OpenAPI Schema", "PASS", "Schema accessible")
        else:
            log_test("OpenAPI Schema", "FAIL", f"Status: {response.status_code}")
    except Exception as e:
        log_test("OpenAPI Schema", "FAIL", str(e))

def print_summary():
    """Print test summary"""
    print("\n" + "="*80)
    print("📊 TEST SUMMARY")
    print("="*80)
    
    total_tests = len(test_results["passed"]) + len(test_results["failed"]) + len(test_results["warnings"])
    passed = len(test_results["passed"])
    failed = len(test_results["failed"])
    warnings = len(test_results["warnings"])
    
    print(f"\nTotal Tests: {total_tests}")
    print(f"✅ Passed: {passed} ({passed/total_tests*100:.1f}%)")
    print(f"❌ Failed: {failed} ({failed/total_tests*100:.1f}%)")
    print(f"⚠️  Warnings: {warnings}")
    
    if test_results["failed"]:
        print("\n❌ Failed Tests:")
        for name, message in test_results["failed"]:
            print(f"  - {name}: {message}")
    
    if test_results["warnings"]:
        print("\n⚠️  Warnings:")
        for name, message in test_results["warnings"]:
            print(f"  - {name}: {message}")
    
    print("\n" + "="*80)
    
    if failed == 0:
        print("🎉 ALL TESTS PASSED! Platform is fully functional.")
    else:
        print(f"⚠️  {failed} tests failed. Review issues above.")
    
    print("="*80 + "\n")

def main():
    """Run all tests"""
    print("="*80)
    print("🧪 MegiLance Comprehensive Testing Suite")
    print("="*80)
    print(f"Backend: {BASE_URL}")
    print(f"Frontend: {FRONTEND_URL}")
    print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*80)
    
    # Run all test suites
    test_backend_health()
    test_database_connection()
    tokens = test_authentication()
    test_protected_endpoints(tokens)
    test_api_documentation()
    
    if "admin" in tokens:
        test_admin_endpoints(tokens["admin"])
    
    if "client" in tokens:
        test_projects_api(tokens["client"])
    
    test_frontend_accessibility()
    
    # Print summary
    print_summary()
    
    # Return exit code
    return 0 if len(test_results["failed"]) == 0 else 1

if __name__ == "__main__":
    exit(main())
