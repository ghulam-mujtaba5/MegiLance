"""
API Testing Script for MegiLance Backend
Tests all critical endpoints and generates a report
"""
import requests
import json
from typing import Dict, List
from datetime import datetime

BASE_URL = "http://127.0.0.1:8000/api"

# Test credentials
ADMIN_CREDS = {"email": "admin@megilance.com", "password": "admin123"}
CLIENT_CREDS = {"email": "client@example.com", "password": "client123"}
FREELANCER_CREDS = {"email": "freelancer@example.com", "password": "freelancer123"}

class TestResult:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.skipped = 0
        self.details = []
    
    def add_pass(self, endpoint, message=""):
        self.passed += 1
        self.details.append({
            "status": "PASS",
            "endpoint": endpoint,
            "message": message
        })
        print(f"[PASS] {endpoint}")
    
    def add_fail(self, endpoint, error):
        self.failed += 1
        self.details.append({
            "status": "FAIL",
            "endpoint": endpoint,
            "error": str(error)
        })
        print(f"[FAIL] {endpoint} - {error}")
    
    def add_skip(self, endpoint, reason):
        self.skipped += 1
        self.details.append({
            "status": "SKIP",
            "endpoint": endpoint,
            "reason": reason
        })
        print(f"[SKIP] {endpoint} - {reason}")
    
    def summary(self):
        total = self.passed + self.failed + self.skipped
        print(f"\n{'='*60}")
        print(f"TEST SUMMARY")
        print(f"{'='*60}")
        print(f"Total Tests: {total}")
        print(f"[PASS] Passed: {self.passed} ({self.passed/total*100:.1f}%)")
        print(f"[FAIL] Failed: {self.failed} ({self.failed/total*100:.1f}%)")
        print(f"[SKIP] Skipped: {self.skipped} ({self.skipped/total*100:.1f}%)")
        print(f"{'='*60}\n")

def login(credentials: Dict) -> str:
    """Login and return access token"""
    login_data = {
        "email": credentials["email"],
        "password": credentials["password"]
    }
    print(f"\nDEBUG: Attempting login with: {credentials['email']}")
    print(f"DEBUG: Request URL: {BASE_URL}/auth/login")
    print(f"DEBUG: Request body: {login_data}")
    
    response = requests.post(
        f"{BASE_URL}/auth/login",
        json=login_data,
        headers={"Content-Type": "application/json"}
    )
    
    print(f"DEBUG: Response status: {response.status_code}")
    print(f"DEBUG: Response body: {response.text[:200]}")
    
    if response.status_code == 200:
        return response.json()["access_token"]
    raise Exception(f"Login failed: {response.text}")

def test_health_endpoints(result: TestResult):
    """Test health check endpoints"""
    print(f"\n{'='*60}")
    print("TESTING HEALTH ENDPOINTS")
    print(f"{'='*60}")
    
    try:
        response = requests.get(f"{BASE_URL}/health/live", timeout=30)
        if response.status_code == 200 and response.json().get("status") == "ok":
            result.add_pass("GET /health/live")
        else:
            result.add_fail("GET /health/live", f"Status: {response.status_code}")
    except Exception as e:
        result.add_fail("GET /health/live", e)
    
    try:
        response = requests.get(f"{BASE_URL}/health/ready", timeout=30)
        if response.status_code == 200:
            result.add_pass("GET /health/ready")
        else:
            result.add_fail("GET /health/ready", f"Status: {response.status_code}")
    except Exception as e:
        result.add_fail("GET /health/ready", e)

def test_auth_endpoints(result: TestResult):
    """Test authentication endpoints"""
    print(f"\n{'='*60}")
    print("TESTING AUTH ENDPOINTS")
    print(f"{'='*60}")
    
    # Test login
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json={
                "email": ADMIN_CREDS["email"],
                "password": ADMIN_CREDS["password"]
            },
            timeout=30
        )
        if response.status_code == 200 and "access_token" in response.json():
            result.add_pass("POST /auth/login")
        else:
            result.add_fail("POST /auth/login", f"Status: {response.status_code}")
    except Exception as e:
        result.add_fail("POST /auth/login", e)
    
    # Test me endpoint
    try:
        token = login(ADMIN_CREDS)
        response = requests.get(
            f"{BASE_URL}/auth/me",
            headers={"Authorization": f"Bearer {token}"},
            timeout=30
        )
        if response.status_code == 200:
            result.add_pass("GET /auth/me")
        else:
            result.add_fail("GET /auth/me", f"Status: {response.status_code}")
    except Exception as e:
        result.add_fail("GET /auth/me", e)

def test_user_endpoints(result: TestResult):
    """Test user management endpoints"""
    print(f"\n{'='*60}")
    print("TESTING USER ENDPOINTS")
    print(f"{'='*60}")
    
    try:
        token = login(ADMIN_CREDS)
        headers = {"Authorization": f"Bearer {token}"}
        
        # Get users list
        response = requests.get(f"{BASE_URL}/users/", headers=headers, timeout=30)
        if response.status_code == 200:
            result.add_pass("GET /users/")
        else:
            result.add_fail("GET /users/", f"Status: {response.status_code}")
        
        # Get specific user
        response = requests.get(f"{BASE_URL}/users/1", headers=headers, timeout=30)
        if response.status_code == 200:
            result.add_pass("GET /users/{id}")
        else:
            result.add_fail("GET /users/{id}", f"Status: {response.status_code}")
            
    except Exception as e:
        result.add_fail("User endpoints", e)

def test_project_endpoints(result: TestResult):
    """Test project endpoints"""
    print(f"\n{'='*60}")
    print("TESTING PROJECT ENDPOINTS")
    print(f"{'='*60}")
    
    try:
        token = login(CLIENT_CREDS)
        headers = {"Authorization": f"Bearer {token}"}
        
        # Get projects
        response = requests.get(f"{BASE_URL}/projects/", headers=headers, timeout=30)
        if response.status_code == 200:
            result.add_pass("GET /projects/")
        else:
            result.add_fail("GET /projects/", f"Status: {response.status_code}")
        
        # Create project
        project_data = {
            "title": "Test Project API",
            "description": "Testing project creation",
            "budget_type": "fixed",
            "budget_min": 100,
            "budget_max": 500,
            "experience_level": "intermediate",
            "estimated_duration": "1-3 months",
            "category": "Web Development",
            "skills": ["Python", "FastAPI"]
        }
        response = requests.post(
            f"{BASE_URL}/projects/",
            headers=headers,
            json=project_data,
            timeout=30
        )
        if response.status_code in [200, 201]:
            result.add_pass("POST /projects/")
            project_id = response.json().get("id")
            
            # Get specific project (with auth headers)
            response = requests.get(f"{BASE_URL}/projects/{project_id}", headers=headers, timeout=30)
            if response.status_code == 200:
                result.add_pass("GET /projects/{id}")
            else:
                result.add_fail("GET /projects/{id}", f"Status: {response.status_code}")
        else:
            result.add_fail("POST /projects/", f"Status: {response.status_code}, {response.text}")
            
    except Exception as e:
        result.add_fail("Project endpoints", e)

def test_payment_endpoints(result: TestResult):
    """Test payment endpoints"""
    print(f"\n{'='*60}")
    print("TESTING PAYMENT ENDPOINTS")
    print(f"{'='*60}")
    
    try:
        token = login(CLIENT_CREDS)
        headers = {"Authorization": f"Bearer {token}"}
        
        # Get payments
        response = requests.get(f"{BASE_URL}/payments/", headers=headers, timeout=30)
        if response.status_code == 200:
            result.add_pass("GET /payments/")
        else:
            result.add_fail("GET /payments/", f"Status: {response.status_code}")
            
    except Exception as e:
        result.add_fail("Payment endpoints", e)

def test_portal_endpoints(result: TestResult):
    """Test portal endpoints"""
    print(f"\n{'='*60}")
    print("TESTING PORTAL ENDPOINTS")
    print(f"{'='*60}")
    
    # Client portal
    try:
        token = login(CLIENT_CREDS)
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.get(f"{BASE_URL}/portal/client/dashboard/stats", headers=headers, timeout=30)
        if response.status_code == 200:
            result.add_pass("GET /portal/client/dashboard/stats")
        else:
            result.add_fail("GET /portal/client/dashboard/stats", f"Status: {response.status_code}")
        
        response = requests.get(f"{BASE_URL}/portal/client/wallet", headers=headers, timeout=30)
        if response.status_code == 200:
            data = response.json()
            if "pending_payments" in data:
                result.add_pass("GET /portal/client/wallet (pending_payments implemented)")
            else:
                result.add_fail("GET /portal/client/wallet", "Missing pending_payments field")
        else:
            result.add_fail("GET /portal/client/wallet", f"Status: {response.status_code}")
            
    except Exception as e:
        result.add_fail("Client portal endpoints", e)
    
    # Freelancer portal
    try:
        token = login(FREELANCER_CREDS)
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.get(f"{BASE_URL}/portal/freelancer/dashboard/stats", headers=headers, timeout=30)
        if response.status_code == 200:
            data = response.json()
            if "average_rating" in data:
                result.add_pass("GET /portal/freelancer/dashboard/stats (rating system implemented)")
            else:
                result.add_fail("GET /portal/freelancer/dashboard/stats", "Missing average_rating")
        else:
            result.add_fail("GET /portal/freelancer/dashboard/stats", f"Status: {response.status_code}")
        
        response = requests.get(f"{BASE_URL}/portal/freelancer/portfolio", headers=headers, timeout=30)
        if response.status_code == 200:
            data = response.json()
            if "portfolio_items" in data and not data.get("message"):
                result.add_pass("GET /portal/freelancer/portfolio (portfolio implemented)")
            else:
                result.add_fail("GET /portal/freelancer/portfolio", "Not fully implemented")
        else:
            result.add_fail("GET /portal/freelancer/portfolio", f"Status: {response.status_code}")
            
    except Exception as e:
        result.add_fail("Freelancer portal endpoints", e)

def test_admin_endpoints(result: TestResult):
    """Test admin endpoints"""
    print(f"\n{'='*60}")
    print("TESTING ADMIN ENDPOINTS")
    print(f"{'='*60}")
    
    try:
        token = login(ADMIN_CREDS)
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.get(f"{BASE_URL}/admin/dashboard/overview", headers=headers, timeout=30)
        if response.status_code == 200:
            result.add_pass("GET /admin/dashboard/overview")
        else:
            result.add_fail("GET /admin/dashboard/overview", f"Status: {response.status_code}")
        
        response = requests.get(f"{BASE_URL}/admin/dashboard/top-freelancers", headers=headers, timeout=30)
        if response.status_code == 200:
            data = response.json()
            if len(data) > 0 and "average_rating" in data[0]:
                result.add_pass("GET /admin/dashboard/top-freelancers (rating system implemented)")
            else:
                result.add_pass("GET /admin/dashboard/top-freelancers")
        else:
            result.add_fail("GET /admin/dashboard/top-freelancers", f"Status: {response.status_code}")
            
    except Exception as e:
        result.add_fail("Admin endpoints", e)

def save_report(result: TestResult):
    """Save test report to file"""
    report = {
        "timestamp": datetime.now().isoformat(),
        "summary": {
            "total": result.passed + result.failed + result.skipped,
            "passed": result.passed,
            "failed": result.failed,
            "skipped": result.skipped,
            "pass_rate": f"{result.passed/(result.passed + result.failed + result.skipped)*100:.1f}%"
        },
        "details": result.details
    }
    
    with open("api_test_report.json", "w") as f:
        json.dump(report, f, indent=2)
    
    print(f"\nReport saved to api_test_report.json")

def main():
    print(f"\n{'='*60}")
    print("MEGILANCE API TEST SUITE")
    print(f"Base URL: {BASE_URL}")
    print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*60}")
    
    result = TestResult()
    
    # Run all tests
    test_health_endpoints(result)
    test_auth_endpoints(result)
    test_user_endpoints(result)
    test_project_endpoints(result)
    test_payment_endpoints(result)
    test_portal_endpoints(result)
    test_admin_endpoints(result)
    
    # Show summary
    result.summary()
    
    # Save report
    save_report(result)

if __name__ == "__main__":
    main()
