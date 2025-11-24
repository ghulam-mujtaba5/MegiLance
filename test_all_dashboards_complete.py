"""
@AI-HINT: Comprehensive API testing script for all dashboards (Admin, Client, Freelancer)
Tests all features in-depth including authentication, CRUD operations, workflows, and edge cases
"""

import requests
import json
from typing import Dict, Any, List
from datetime import datetime

BASE_URL = "http://localhost:8000"
RESULTS: List[Dict[str, Any]] = []

class TestSession:
    """Manages test session with authentication"""
    def __init__(self, email: str, password: str, role: str):
        self.email = email
        self.password = password
        self.role = role
        self.access_token = None
        self.user_id = None
        
    def login(self) -> bool:
        """Authenticate and get access token"""
        try:
            response = requests.post(
                f"{BASE_URL}/api/auth/login",
                json={"email": self.email, "password": self.password}
            )
            if response.status_code == 200:
                data = response.json()
                self.access_token = data.get("access_token")
                self.user_id = data.get("user", {}).get("id")
                log_result(f"{self.role} Login", "✅ PASS", response.status_code, data)
                return True
            else:
                log_result(f"{self.role} Login", "❌ FAIL", response.status_code, response.text)
                return False
        except Exception as e:
            log_result(f"{self.role} Login", "❌ ERROR", None, str(e))
            return False
    
    def get_headers(self) -> Dict[str, str]:
        """Get authorization headers"""
        return {"Authorization": f"Bearer {self.access_token}"}


def log_result(test_name: str, status: str, status_code: int = None, data: Any = None):
    """Log test result"""
    result = {
        "timestamp": datetime.now().isoformat(),
        "test": test_name,
        "status": status,
        "status_code": status_code,
        "data": data if isinstance(data, (str, dict, list)) else str(data)
    }
    RESULTS.append(result)
    print(f"\n[{status}] {test_name} - Status: {status_code}")
    if isinstance(data, dict) and len(str(data)) < 500:
        print(f"    Response: {json.dumps(data, indent=2)}")


def test_admin_dashboard(session: TestSession):
    """Test all Admin dashboard features"""
    print("\n" + "="*80)
    print("TESTING ADMIN DASHBOARD - ALL FEATURES")
    print("="*80)
    
    headers = session.get_headers()
    
    # 1. Dashboard Overview
    try:
        resp = requests.get(f"{BASE_URL}/api/admin/dashboard", headers=headers)
        log_result("Admin Dashboard Overview", "✅ PASS" if resp.status_code == 200 else "❌ FAIL", resp.status_code, resp.json() if resp.status_code == 200 else resp.text)
    except Exception as e:
        log_result("Admin Dashboard Overview", "❌ ERROR", None, str(e))
    
    # 2. User Management - List all users
    try:
        resp = requests.get(f"{BASE_URL}/api/admin/users", headers=headers)
        log_result("Admin List Users", "✅ PASS" if resp.status_code == 200 else "❌ FAIL", resp.status_code, resp.json() if resp.status_code == 200 else resp.text)
    except Exception as e:
        log_result("Admin List Users", "❌ ERROR", None, str(e))
    
    # 3. User Management - Get specific user
    try:
        resp = requests.get(f"{BASE_URL}/api/admin/users/2", headers=headers)
        log_result("Admin Get User by ID", "✅ PASS" if resp.status_code == 200 else "❌ FAIL", resp.status_code, resp.json() if resp.status_code == 200 else resp.text)
    except Exception as e:
        log_result("Admin Get User by ID", "❌ ERROR", None, str(e))
    
    # 4. User Management - Suspend user
    try:
        resp = requests.post(f"{BASE_URL}/api/admin/users/2/suspend", headers=headers, json={"reason": "Testing suspension"})
        log_result("Admin Suspend User", "✅ PASS" if resp.status_code in [200, 204] else "❌ FAIL", resp.status_code, resp.json() if resp.status_code == 200 else resp.text)
    except Exception as e:
        log_result("Admin Suspend User", "❌ ERROR", None, str(e))
    
    # 5. User Management - Reactivate user
    try:
        resp = requests.post(f"{BASE_URL}/api/admin/users/2/reactivate", headers=headers)
        log_result("Admin Reactivate User", "✅ PASS" if resp.status_code in [200, 204] else "❌ FAIL", resp.status_code, resp.json() if resp.status_code == 200 else resp.text)
    except Exception as e:
        log_result("Admin Reactivate User", "❌ ERROR", None, str(e))
    
    # 6. Projects Management - List all projects
    try:
        resp = requests.get(f"{BASE_URL}/api/admin/projects", headers=headers)
        log_result("Admin List Projects", "✅ PASS" if resp.status_code == 200 else "❌ FAIL", resp.status_code, resp.json() if resp.status_code == 200 else resp.text)
    except Exception as e:
        log_result("Admin List Projects", "❌ ERROR", None, str(e))
    
    # 7. Payments Management - List all payments
    try:
        resp = requests.get(f"{BASE_URL}/api/admin/payments", headers=headers)
        log_result("Admin List Payments", "✅ PASS" if resp.status_code == 200 else "❌ FAIL", resp.status_code, resp.json() if resp.status_code == 200 else resp.text)
    except Exception as e:
        log_result("Admin List Payments", "❌ ERROR", None, str(e))
    
    # 8. Support Tickets - List all tickets
    try:
        resp = requests.get(f"{BASE_URL}/api/admin/support", headers=headers)
        log_result("Admin List Support Tickets", "✅ PASS" if resp.status_code == 200 else "❌ FAIL", resp.status_code, resp.json() if resp.status_code == 200 else resp.text)
    except Exception as e:
        log_result("Admin List Support Tickets", "❌ ERROR", None, str(e))
    
    # 9. AI Monitoring - Check AI usage
    try:
        resp = requests.get(f"{BASE_URL}/api/admin/ai-monitoring", headers=headers)
        log_result("Admin AI Monitoring", "✅ PASS" if resp.status_code == 200 else "❌ FAIL", resp.status_code, resp.json() if resp.status_code == 200 else resp.text)
    except Exception as e:
        log_result("Admin AI Monitoring", "❌ ERROR", None, str(e))
    
    # 10. Analytics - Get platform analytics
    try:
        resp = requests.get(f"{BASE_URL}/api/admin/analytics", headers=headers)
        log_result("Admin Analytics", "✅ PASS" if resp.status_code == 200 else "❌ FAIL", resp.status_code, resp.json() if resp.status_code == 200 else resp.text)
    except Exception as e:
        log_result("Admin Analytics", "❌ ERROR", None, str(e))


def test_client_dashboard(session: TestSession):
    """Test all Client dashboard features"""
    print("\n" + "="*80)
    print("TESTING CLIENT DASHBOARD - ALL FEATURES")
    print("="*80)
    
    headers = session.get_headers()
    
    # 1. Client Dashboard Overview
    try:
        resp = requests.get(f"{BASE_URL}/api/client/dashboard", headers=headers)
        log_result("Client Dashboard Overview", "✅ PASS" if resp.status_code == 200 else "❌ FAIL", resp.status_code, resp.json() if resp.status_code == 200 else resp.text)
    except Exception as e:
        log_result("Client Dashboard Overview", "❌ ERROR", None, str(e))
    
    # 2. Projects - List my projects
    try:
        resp = requests.get(f"{BASE_URL}/api/client/projects", headers=headers)
        log_result("Client List Projects", "✅ PASS" if resp.status_code == 200 else "❌ FAIL", resp.status_code, resp.json() if resp.status_code == 200 else resp.text)
    except Exception as e:
        log_result("Client List Projects", "❌ ERROR", None, str(e))
    
    # 3. Projects - Create new project
    try:
        project_data = {
            "title": "Test Project - Automated Testing",
            "description": "This is a test project created during comprehensive testing",
            "budget": 5000.00,
            "category": "Web Development",
            "skills_required": ["Python", "FastAPI", "React"],
            "duration_estimate": "2-3 months"
        }
        resp = requests.post(f"{BASE_URL}/api/client/projects", headers=headers, json=project_data)
        log_result("Client Create Project", "✅ PASS" if resp.status_code in [200, 201] else "❌ FAIL", resp.status_code, resp.json() if resp.status_code in [200, 201] else resp.text)
    except Exception as e:
        log_result("Client Create Project", "❌ ERROR", None, str(e))
    
    # 4. Proposals - List received proposals
    try:
        resp = requests.get(f"{BASE_URL}/api/client/proposals", headers=headers)
        log_result("Client List Proposals", "✅ PASS" if resp.status_code == 200 else "❌ FAIL", resp.status_code, resp.json() if resp.status_code == 200 else resp.text)
    except Exception as e:
        log_result("Client List Proposals", "❌ ERROR", None, str(e))
    
    # 5. Freelancers - Browse available freelancers
    try:
        resp = requests.get(f"{BASE_URL}/api/client/freelancers", headers=headers)
        log_result("Client Browse Freelancers", "✅ PASS" if resp.status_code == 200 else "❌ FAIL", resp.status_code, resp.json() if resp.status_code == 200 else resp.text)
    except Exception as e:
        log_result("Client Browse Freelancers", "❌ ERROR", None, str(e))
    
    # 6. Freelancers - Search with filters
    try:
        resp = requests.get(f"{BASE_URL}/api/client/freelancers?skills=python&min_rating=4", headers=headers)
        log_result("Client Search Freelancers", "✅ PASS" if resp.status_code == 200 else "❌ FAIL", resp.status_code, resp.json() if resp.status_code == 200 else resp.text)
    except Exception as e:
        log_result("Client Search Freelancers", "❌ ERROR", None, str(e))
    
    # 7. Contracts - List active contracts
    try:
        resp = requests.get(f"{BASE_URL}/api/client/contracts", headers=headers)
        log_result("Client List Contracts", "✅ PASS" if resp.status_code == 200 else "❌ FAIL", resp.status_code, resp.json() if resp.status_code == 200 else resp.text)
    except Exception as e:
        log_result("Client List Contracts", "❌ ERROR", None, str(e))
    
    # 8. Payments - List payment history
    try:
        resp = requests.get(f"{BASE_URL}/api/client/payments", headers=headers)
        log_result("Client Payment History", "✅ PASS" if resp.status_code == 200 else "❌ FAIL", resp.status_code, resp.json() if resp.status_code == 200 else resp.text)
    except Exception as e:
        log_result("Client Payment History", "❌ ERROR", None, str(e))
    
    # 9. Messages - List conversations
    try:
        resp = requests.get(f"{BASE_URL}/api/messages", headers=headers)
        log_result("Client Messages", "✅ PASS" if resp.status_code == 200 else "❌ FAIL", resp.status_code, resp.json() if resp.status_code == 200 else resp.text)
    except Exception as e:
        log_result("Client Messages", "❌ ERROR", None, str(e))
    
    # 10. Notifications - Get notifications
    try:
        resp = requests.get(f"{BASE_URL}/api/notifications", headers=headers)
        log_result("Client Notifications", "✅ PASS" if resp.status_code == 200 else "❌ FAIL", resp.status_code, resp.json() if resp.status_code == 200 else resp.text)
    except Exception as e:
        log_result("Client Notifications", "❌ ERROR", None, str(e))


def test_freelancer_dashboard(session: TestSession):
    """Test all Freelancer dashboard features"""
    print("\n" + "="*80)
    print("TESTING FREELANCER DASHBOARD - ALL FEATURES")
    print("="*80)
    
    headers = session.get_headers()
    
    # 1. Freelancer Dashboard Overview
    try:
        resp = requests.get(f"{BASE_URL}/api/freelancer/dashboard", headers=headers)
        log_result("Freelancer Dashboard Overview", "✅ PASS" if resp.status_code == 200 else "❌ FAIL", resp.status_code, resp.json() if resp.status_code == 200 else resp.text)
    except Exception as e:
        log_result("Freelancer Dashboard Overview", "❌ ERROR", None, str(e))
    
    # 2. Profile - Get profile
    try:
        resp = requests.get(f"{BASE_URL}/api/freelancer/profile", headers=headers)
        log_result("Freelancer Get Profile", "✅ PASS" if resp.status_code == 200 else "❌ FAIL", resp.status_code, resp.json() if resp.status_code == 200 else resp.text)
    except Exception as e:
        log_result("Freelancer Get Profile", "❌ ERROR", None, str(e))
    
    # 3. Profile - Update profile
    try:
        profile_data = {
            "title": "Full Stack Developer",
            "bio": "Experienced developer specializing in Python and React",
            "hourly_rate": 50.00,
            "skills": ["Python", "FastAPI", "React", "PostgreSQL"]
        }
        resp = requests.put(f"{BASE_URL}/api/freelancer/profile", headers=headers, json=profile_data)
        log_result("Freelancer Update Profile", "✅ PASS" if resp.status_code == 200 else "❌ FAIL", resp.status_code, resp.json() if resp.status_code == 200 else resp.text)
    except Exception as e:
        log_result("Freelancer Update Profile", "❌ ERROR", None, str(e))
    
    # 4. Portfolio - List portfolio items
    try:
        resp = requests.get(f"{BASE_URL}/api/freelancer/portfolio", headers=headers)
        log_result("Freelancer List Portfolio", "✅ PASS" if resp.status_code == 200 else "❌ FAIL", resp.status_code, resp.json() if resp.status_code == 200 else resp.text)
    except Exception as e:
        log_result("Freelancer List Portfolio", "❌ ERROR", None, str(e))
    
    # 5. Portfolio - Add portfolio item
    try:
        portfolio_data = {
            "title": "E-commerce Platform",
            "description": "Built a full-stack e-commerce platform with payment integration",
            "technologies": ["Python", "React", "Stripe"],
            "project_url": "https://example.com",
            "completion_date": "2024-01-15"
        }
        resp = requests.post(f"{BASE_URL}/api/freelancer/portfolio", headers=headers, json=portfolio_data)
        log_result("Freelancer Add Portfolio", "✅ PASS" if resp.status_code in [200, 201] else "❌ FAIL", resp.status_code, resp.json() if resp.status_code in [200, 201] else resp.text)
    except Exception as e:
        log_result("Freelancer Add Portfolio", "❌ ERROR", None, str(e))
    
    # 6. Jobs - Browse available jobs
    try:
        resp = requests.get(f"{BASE_URL}/api/freelancer/jobs", headers=headers)
        log_result("Freelancer Browse Jobs", "✅ PASS" if resp.status_code == 200 else "❌ FAIL", resp.status_code, resp.json() if resp.status_code == 200 else resp.text)
    except Exception as e:
        log_result("Freelancer Browse Jobs", "❌ ERROR", None, str(e))
    
    # 7. Jobs - Search with filters
    try:
        resp = requests.get(f"{BASE_URL}/api/freelancer/jobs?category=Web+Development&min_budget=1000", headers=headers)
        log_result("Freelancer Search Jobs", "✅ PASS" if resp.status_code == 200 else "❌ FAIL", resp.status_code, resp.json() if resp.status_code == 200 else resp.text)
    except Exception as e:
        log_result("Freelancer Search Jobs", "❌ ERROR", None, str(e))
    
    # 8. Proposals - List my proposals
    try:
        resp = requests.get(f"{BASE_URL}/api/freelancer/proposals", headers=headers)
        log_result("Freelancer List Proposals", "✅ PASS" if resp.status_code == 200 else "❌ FAIL", resp.status_code, resp.json() if resp.status_code == 200 else resp.text)
    except Exception as e:
        log_result("Freelancer List Proposals", "❌ ERROR", None, str(e))
    
    # 9. Contracts - List active contracts
    try:
        resp = requests.get(f"{BASE_URL}/api/freelancer/contracts", headers=headers)
        log_result("Freelancer List Contracts", "✅ PASS" if resp.status_code == 200 else "❌ FAIL", resp.status_code, resp.json() if resp.status_code == 200 else resp.text)
    except Exception as e:
        log_result("Freelancer List Contracts", "❌ ERROR", None, str(e))
    
    # 10. Earnings - Get earnings overview
    try:
        resp = requests.get(f"{BASE_URL}/api/freelancer/earnings", headers=headers)
        log_result("Freelancer Earnings", "✅ PASS" if resp.status_code == 200 else "❌ FAIL", resp.status_code, resp.json() if resp.status_code == 200 else resp.text)
    except Exception as e:
        log_result("Freelancer Earnings", "❌ ERROR", None, str(e))


def test_common_features(session: TestSession):
    """Test features common to all roles"""
    print("\n" + "="*80)
    print(f"TESTING COMMON FEATURES - {session.role}")
    print("="*80)
    
    headers = session.get_headers()
    
    # 1. Profile settings
    try:
        resp = requests.get(f"{BASE_URL}/api/user/profile", headers=headers)
        log_result(f"{session.role} User Profile", "✅ PASS" if resp.status_code == 200 else "❌ FAIL", resp.status_code, resp.json() if resp.status_code == 200 else resp.text)
    except Exception as e:
        log_result(f"{session.role} User Profile", "❌ ERROR", None, str(e))
    
    # 2. Notifications
    try:
        resp = requests.get(f"{BASE_URL}/api/notifications", headers=headers)
        log_result(f"{session.role} Notifications", "✅ PASS" if resp.status_code == 200 else "❌ FAIL", resp.status_code, resp.json() if resp.status_code == 200 else resp.text)
    except Exception as e:
        log_result(f"{session.role} Notifications", "❌ ERROR", None, str(e))
    
    # 3. Messages
    try:
        resp = requests.get(f"{BASE_URL}/api/messages", headers=headers)
        log_result(f"{session.role} Messages", "✅ PASS" if resp.status_code == 200 else "❌ FAIL", resp.status_code, resp.json() if resp.status_code == 200 else resp.text)
    except Exception as e:
        log_result(f"{session.role} Messages", "❌ ERROR", None, str(e))
    
    # 4. Search
    try:
        resp = requests.get(f"{BASE_URL}/api/search?q=python", headers=headers)
        log_result(f"{session.role} Search", "✅ PASS" if resp.status_code == 200 else "❌ FAIL", resp.status_code, resp.json() if resp.status_code == 200 else resp.text)
    except Exception as e:
        log_result(f"{session.role} Search", "❌ ERROR", None, str(e))


def save_results():
    """Save test results to file"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"test_results_{timestamp}.json"
    
    # Calculate statistics
    total_tests = len(RESULTS)
    passed_tests = len([r for r in RESULTS if "✅ PASS" in r["status"]])
    failed_tests = len([r for r in RESULTS if "❌ FAIL" in r["status"]])
    error_tests = len([r for r in RESULTS if "❌ ERROR" in r["status"]])
    
    summary = {
        "timestamp": timestamp,
        "total_tests": total_tests,
        "passed": passed_tests,
        "failed": failed_tests,
        "errors": error_tests,
        "pass_rate": f"{(passed_tests/total_tests*100):.2f}%" if total_tests > 0 else "0%",
        "results": RESULTS
    }
    
    with open(filename, 'w') as f:
        json.dump(summary, f, indent=2)
    
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    print(f"Total Tests: {total_tests}")
    print(f"✅ Passed: {passed_tests}")
    print(f"❌ Failed: {failed_tests}")
    print(f"❌ Errors: {error_tests}")
    print(f"Pass Rate: {summary['pass_rate']}")
    print(f"\nResults saved to: {filename}")
    print("="*80)


def main():
    """Main test execution"""
    print("\n" + "="*80)
    print("COMPREHENSIVE API TESTING - ALL DASHBOARDS")
    print("="*80)
    
    # Test Admin Dashboard
    admin = TestSession("admin@megilance.com", "Admin@123", "Admin")
    if admin.login():
        test_admin_dashboard(admin)
        test_common_features(admin)
    
    # Test Client Dashboard
    client = TestSession("client1@example.com", "Password123!", "Client")
    if client.login():
        test_client_dashboard(client)
        test_common_features(client)
    
    # Test Freelancer Dashboard
    freelancer = TestSession("freelancer1@example.com", "Password123!", "Freelancer")
    if freelancer.login():
        test_freelancer_dashboard(freelancer)
        test_common_features(freelancer)
    
    # Save results
    save_results()


if __name__ == "__main__":
    main()
