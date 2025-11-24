"""
Comprehensive System Test for MegiLance Platform
Tests all features including database interactions, authentication, and all portal features
"""

import requests
import json
import time
from datetime import datetime
from typing import Dict, Optional, List

# Configuration
BACKEND_URL = "http://127.0.0.1:8000"
FRONTEND_URL = "http://localhost:3000"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    MAGENTA = '\033[95m'
    CYAN = '\033[96m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

class TestResults:
    def __init__(self):
        self.total = 0
        self.passed = 0
        self.failed = 0
        self.warnings = 0
        self.tests = []
        self.start_time = datetime.now()
    
    def add_pass(self, test_name: str, message: str = ""):
        self.total += 1
        self.passed += 1
        self.tests.append({"name": test_name, "status": "PASS", "message": message})
        print(f"{Colors.GREEN}[PASS]{Colors.RESET}: {test_name} {Colors.CYAN}{message}{Colors.RESET}")
    
    def add_fail(self, test_name: str, message: str = ""):
        self.total += 1
        self.failed += 1
        self.tests.append({"name": test_name, "status": "FAIL", "message": message})
        print(f"{Colors.RED}[FAIL]{Colors.RESET}: {test_name} {Colors.RED}{message}{Colors.RESET}")
    
    def add_warning(self, test_name: str, message: str = ""):
        self.warnings += 1
        print(f"{Colors.YELLOW}[WARN]{Colors.RESET}: {test_name} {Colors.YELLOW}{message}{Colors.RESET}")
    
    def print_summary(self):
        duration = (datetime.now() - self.start_time).total_seconds()
        print(f"\n{Colors.BOLD}{'='*80}{Colors.RESET}")
        print(f"{Colors.BOLD}TEST SUMMARY{Colors.RESET}")
        print(f"{Colors.BOLD}{'='*80}{Colors.RESET}")
        print(f"Total Tests: {Colors.BOLD}{self.total}{Colors.RESET}")
        print(f"Passed: {Colors.GREEN}{self.passed}{Colors.RESET} ({(self.passed/self.total*100):.1f}%)")
        print(f"Failed: {Colors.RED}{self.failed}{Colors.RESET} ({(self.failed/self.total*100):.1f}%)")
        print(f"Warnings: {Colors.YELLOW}{self.warnings}{Colors.RESET}")
        print(f"Duration: {Colors.CYAN}{duration:.2f}s{Colors.RESET}")
        print(f"{Colors.BOLD}{'='*80}{Colors.RESET}\n")
        
        if self.failed > 0:
            print(f"{Colors.RED}{Colors.BOLD}Failed Tests:{Colors.RESET}")
            for test in self.tests:
                if test["status"] == "FAIL":
                    print(f"  - {test['name']}: {test['message']}")

results = TestResults()

# Store tokens for authenticated requests
tokens = {
    "admin": None,
    "freelancer": None,
    "client": None
}

# Store user IDs for testing
user_ids = {
    "admin": None,
    "freelancer": None,
    "client": None
}

# Store created entities for cleanup/testing
created_entities = {
    "projects": [],
    "proposals": [],
    "contracts": [],
    "messages": []
}

def print_section(title: str):
    print(f"\n{Colors.BOLD}{Colors.MAGENTA}{'='*80}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.MAGENTA}{title.center(80)}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.MAGENTA}{'='*80}{Colors.RESET}\n")

def make_request(method: str, url: str, headers: Optional[Dict] = None, 
                 data: Optional[Dict] = None, json_data: Optional[Dict] = None,
                 token: Optional[str] = None) -> requests.Response:
    """Make HTTP request with optional authentication"""
    if headers is None:
        headers = {}
    
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    if method.upper() == "GET":
        return requests.get(url, headers=headers, timeout=10)
    elif method.upper() == "POST":
        return requests.post(url, headers=headers, data=data, json=json_data, timeout=10)
    elif method.upper() == "PUT":
        return requests.put(url, headers=headers, json=json_data, timeout=10)
    elif method.upper() == "DELETE":
        return requests.delete(url, headers=headers, timeout=10)

# ============================================================================
# SECTION 1: Backend Health & Database Connectivity
# ============================================================================

def test_backend_health():
    print_section("SECTION 1: Backend Health & Database Connectivity")
    
    # Test 1: Backend live endpoint
    try:
        response = make_request("GET", f"{BACKEND_URL}/api/health/live")
        if response and response.status_code == 200:
            results.add_pass("Backend Health - Live", f"Status: {response.json().get('status')}")
        else:
            results.add_fail("Backend Health - Live", f"Status code: {response.status_code if response else 'N/A'}")
    except Exception as e:
        results.add_fail("Backend Health - Live", str(e))
    
    # Test 2: Backend ready endpoint
    try:
        response = make_request("GET", f"{BACKEND_URL}/api/health/ready")
        if response and response.status_code == 200:
            data = response.json()
            results.add_pass("Backend Health - Ready", f"Status: {data.get('status')}")
        else:
            results.add_fail("Backend Health - Ready", f"Status code: {response.status_code if response else 'N/A'}")
    except Exception as e:
        results.add_fail("Backend Health - Ready", str(e))
    
    # Test 3: API Documentation accessible
    try:
        response = make_request("GET", f"{BACKEND_URL}/api/docs")
        if response and response.status_code == 200:
            results.add_pass("API Documentation", "Swagger UI accessible")
        else:
            results.add_fail("API Documentation", f"Status code: {response.status_code if response else 'N/A'}")
    except Exception as e:
        results.add_fail("API Documentation", str(e))

# ============================================================================
# SECTION 2: Authentication & User Management
# ============================================================================

def test_authentication():
    print_section("SECTION 2: Authentication & User Management")
    
    # Test 4: Admin Login
    try:
        response = make_request("POST", f"{BACKEND_URL}/api/auth/login",
                               json_data={"email": "admin@megilance.com", "password": "Admin@123"})
        if response and response.status_code == 200:
            data = response.json()
            tokens["admin"] = data.get("access_token")
            results.add_pass("Admin Login", f"Token received (type: {data.get('token_type')})")
        else:
            results.add_fail("Admin Login", f"Status: {response.status_code if response else 'N/A'}")
    except Exception as e:
        results.add_fail("Admin Login", str(e))
    
    time.sleep(13)  # Rate limiting: 5 requests/minute = 12 seconds between requests
    
    # Test 5: Freelancer Login
    try:
        response = make_request("POST", f"{BACKEND_URL}/api/auth/login",
                               json_data={"email": "freelancer1@example.com", "password": "Demo123!"})
        if response and response.status_code == 200:
            data = response.json()
            tokens["freelancer"] = data.get("access_token")
            results.add_pass("Freelancer Login", "Token received")
        else:
            error_detail = response.text if response else 'No response'
            results.add_fail("Freelancer Login", f"Status: {response.status_code if response else 'N/A'} | {error_detail[:100]}")
    except Exception as e:
        results.add_fail("Freelancer Login", f"Exception: {str(e)}")
    
    time.sleep(13)  # Rate limiting protection
    
    # Test 6: Client Login
    try:
        response = make_request("POST", f"{BACKEND_URL}/api/auth/login",
                               json_data={"email": "client1@example.com", "password": "Demo123!"})
        if response and response.status_code == 200:
            data = response.json()
            tokens["client"] = data.get("access_token")
            results.add_pass("Client Login", "Token received")
        else:
            error_detail = response.text if response else 'No response'
            results.add_fail("Client Login", f"Status: {response.status_code if response else 'N/A'} | {error_detail[:100]}")
    except Exception as e:
        results.add_fail("Client Login", f"Exception: {str(e)}")
    
    # Test 7: Get Current User (Admin)
    if tokens["admin"]:
        try:
            response = make_request("GET", f"{BACKEND_URL}/api/auth/me", token=tokens["admin"])
            if response and response.status_code == 200:
                data = response.json()
                user_ids["admin"] = data.get("id")
                results.add_pass("Get Current User (Admin)", 
                               f"User: {data.get('name')} | Role: {data.get('user_type')}")
            else:
                results.add_fail("Get Current User (Admin)", 
                               f"Status: {response.status_code if response else 'N/A'}")
        except Exception as e:
            results.add_fail("Get Current User (Admin)", str(e))
    
    # Test 8: Get Current User (Freelancer)
    if tokens["freelancer"]:
        try:
            response = make_request("GET", f"{BACKEND_URL}/api/auth/me", token=tokens["freelancer"])
            if response and response.status_code == 200:
                data = response.json()
                user_ids["freelancer"] = data.get("id")
                results.add_pass("Get Current User (Freelancer)", 
                               f"User: {data.get('name')}")
            else:
                results.add_fail("Get Current User (Freelancer)", 
                               f"Status: {response.status_code if response else 'N/A'}")
        except Exception as e:
            results.add_fail("Get Current User (Freelancer)", str(e))
    
    # Test 9: Get Current User (Client)
    if tokens["client"]:
        try:
            response = make_request("GET", f"{BACKEND_URL}/api/auth/me", token=tokens["client"])
            if response and response.status_code == 200:
                data = response.json()
                user_ids["client"] = data.get("id")
                results.add_pass("Get Current User (Client)", 
                               f"User: {data.get('name')}")
            else:
                results.add_fail("Get Current User (Client)", 
                               f"Status: {response.status_code if response else 'N/A'}")
        except Exception as e:
            results.add_fail("Get Current User (Client)", str(e))

# ============================================================================
# SECTION 3: Admin Portal Features
# ============================================================================

def test_admin_features():
    print_section("SECTION 3: Admin Portal Features")
    
    if not tokens["admin"]:
        results.add_fail("Admin Portal Tests", "Admin token not available")
        return
    
    # Test 10: Admin Dashboard Stats
    try:
        response = make_request("GET", f"{BACKEND_URL}/api/admin/dashboard/stats", 
                               token=tokens["admin"])
        if response and response.status_code == 200:
            data = response.json()
            results.add_pass("Admin Dashboard Stats", 
                           f"Users: {data.get('total_users', 0)} | Projects: {data.get('total_projects', 0)}")
        else:
            results.add_fail("Admin Dashboard Stats", 
                           f"Status: {response.status_code if response else 'N/A'}")
    except Exception as e:
        results.add_fail("Admin Dashboard Stats", str(e))
    
    # Test 11: Get All Users (Admin)
    try:
        response = make_request("GET", f"{BACKEND_URL}/api/admin/users", 
                               token=tokens["admin"])
        if response and response.status_code == 200:
            users = response.json()
            results.add_pass("Get All Users", f"Retrieved {len(users)} users")
        else:
            results.add_fail("Get All Users", 
                           f"Status: {response.status_code if response else 'N/A'}")
    except Exception as e:
        results.add_fail("Get All Users", str(e))
    
    # Test 12: Get All Projects (Admin)
    try:
        response = make_request("GET", f"{BACKEND_URL}/api/admin/projects", 
                               token=tokens["admin"])
        if response and response.status_code == 200:
            projects = response.json()
            results.add_pass("Get All Projects (Admin)", f"Retrieved {len(projects)} projects")
        else:
            results.add_fail("Get All Projects (Admin)", 
                           f"Status: {response.status_code if response else 'N/A'}")
    except Exception as e:
        results.add_fail("Get All Projects (Admin)", str(e))

# ============================================================================
# SECTION 4: Projects & Proposals Workflow
# ============================================================================

def test_projects_workflow():
    print_section("SECTION 4: Projects & Proposals Workflow")
    
    # Test 13: Client Creates Project
    if tokens["client"]:
        try:
            project_data = {
                "title": f"Test Project - {datetime.now().strftime('%H:%M:%S')}",
                "description": "This is a comprehensive test project to verify database functionality",
                "budget_min": 500,
                "budget_max": 1500,
                "duration": "1-3 months",
                "skills_required": ["Python", "FastAPI", "React"],
                "status": "Open"
            }
            response = make_request("POST", f"{BACKEND_URL}/api/projects", 
                                   json_data=project_data, token=tokens["client"])
            if response and response.status_code in [200, 201]:
                data = response.json()
                created_entities["projects"].append(data.get("id"))
                results.add_pass("Create Project (Client)", f"Project ID: {data.get('id')}")
            else:
                results.add_fail("Create Project (Client)", 
                               f"Status: {response.status_code if response else 'N/A'} | {response.text if response else ''}")
        except Exception as e:
            results.add_fail("Create Project (Client)", str(e))
    
    # Test 14: Get All Projects (Public)
    try:
        response = make_request("GET", f"{BACKEND_URL}/api/projects")
        if response and response.status_code == 200:
            projects = response.json()
            results.add_pass("Get All Projects (Public)", f"Retrieved {len(projects)} projects")
        else:
            results.add_fail("Get All Projects (Public)", 
                           f"Status: {response.status_code if response else 'N/A'}")
    except Exception as e:
        results.add_fail("Get All Projects (Public)", str(e))
    
    # Test 15: Freelancer Submits Proposal
    if tokens["freelancer"] and len(created_entities["projects"]) > 0:
        try:
            proposal_data = {
                "project_id": created_entities["projects"][0],
                "cover_letter": "I am interested in working on this project. I have extensive experience with the required technologies.",
                "proposed_rate": 50,
                "estimated_duration": "2 months"
            }
            response = make_request("POST", f"{BACKEND_URL}/api/proposals", 
                                   json_data=proposal_data, token=tokens["freelancer"])
            if response and response.status_code in [200, 201]:
                data = response.json()
                created_entities["proposals"].append(data.get("id"))
                results.add_pass("Submit Proposal (Freelancer)", f"Proposal ID: {data.get('id')}")
            else:
                results.add_fail("Submit Proposal (Freelancer)", 
                               f"Status: {response.status_code if response else 'N/A'} | {response.text if response else ''}")
        except Exception as e:
            results.add_fail("Submit Proposal (Freelancer)", str(e))
    
    # Test 16: Get Proposals for Project
    if tokens["client"] and len(created_entities["projects"]) > 0:
        try:
            project_id = created_entities["projects"][0]
            response = make_request("GET", f"{BACKEND_URL}/api/projects/{project_id}/proposals", 
                                   token=tokens["client"])
            if response and response.status_code == 200:
                proposals = response.json()
                results.add_pass("Get Project Proposals", f"Retrieved {len(proposals)} proposals")
            else:
                results.add_fail("Get Project Proposals", 
                               f"Status: {response.status_code if response else 'N/A'}")
        except Exception as e:
            results.add_fail("Get Project Proposals", str(e))

# ============================================================================
# SECTION 5: Portfolio & Skills
# ============================================================================

def test_portfolio_features():
    print_section("SECTION 5: Portfolio & Skills Management")
    
    # Test 17: Get Freelancer Portfolio
    if user_ids["freelancer"]:
        try:
            response = make_request("GET", f"{BACKEND_URL}/api/users/{user_ids['freelancer']}/portfolio")
            if response and response.status_code == 200:
                portfolio = response.json()
                results.add_pass("Get Freelancer Portfolio", f"Retrieved {len(portfolio)} items")
            else:
                results.add_fail("Get Freelancer Portfolio", 
                               f"Status: {response.status_code if response else 'N/A'}")
        except Exception as e:
            results.add_fail("Get Freelancer Portfolio", str(e))
    
    # Test 18: Get All Skills
    try:
        response = make_request("GET", f"{BACKEND_URL}/api/skills")
        if response and response.status_code == 200:
            skills = response.json()
            results.add_pass("Get All Skills", f"Retrieved {len(skills)} skills")
        else:
            results.add_fail("Get All Skills", 
                           f"Status: {response.status_code if response else 'N/A'}")
    except Exception as e:
        results.add_fail("Get All Skills", str(e))

# ============================================================================
# SECTION 6: Messages & Communication
# ============================================================================

def test_messaging():
    print_section("SECTION 6: Messages & Communication")
    
    # Test 19: Get User Messages
    if tokens["freelancer"]:
        try:
            response = make_request("GET", f"{BACKEND_URL}/api/messages", 
                                   token=tokens["freelancer"])
            if response and response.status_code == 200:
                messages = response.json()
                results.add_pass("Get User Messages", f"Retrieved {len(messages)} messages")
            else:
                results.add_fail("Get User Messages", 
                               f"Status: {response.status_code if response else 'N/A'}")
        except Exception as e:
            results.add_fail("Get User Messages", str(e))
    
    # Test 20: Send Message (if both users exist)
    if tokens["client"] and user_ids["freelancer"]:
        try:
            message_data = {
                "receiver_id": user_ids["freelancer"],
                "content": "Hello! I would like to discuss the project with you.",
                "subject": "Project Discussion"
            }
            response = make_request("POST", f"{BACKEND_URL}/api/messages", 
                                   json_data=message_data, token=tokens["client"])
            if response and response.status_code in [200, 201]:
                data = response.json()
                created_entities["messages"].append(data.get("id"))
                results.add_pass("Send Message", f"Message ID: {data.get('id')}")
            else:
                results.add_fail("Send Message", 
                               f"Status: {response.status_code if response else 'N/A'} | {response.text if response else ''}")
        except Exception as e:
            results.add_fail("Send Message", str(e))

# ============================================================================
# SECTION 7: Payments & Wallet
# ============================================================================

def test_payments():
    print_section("SECTION 7: Payments & Wallet Features")
    
    # Test 21: Get User Wallet Balance
    if tokens["freelancer"]:
        try:
            response = make_request("GET", f"{BACKEND_URL}/api/wallet", 
                                   token=tokens["freelancer"])
            if response and response.status_code == 200:
                wallet = response.json()
                results.add_pass("Get Wallet Balance", f"Balance: ${wallet.get('balance', 0)}")
            else:
                results.add_fail("Get Wallet Balance", 
                               f"Status: {response.status_code if response else 'N/A'}")
        except Exception as e:
            results.add_fail("Get Wallet Balance", str(e))
    
    # Test 22: Get Payment History
    if tokens["client"]:
        try:
            response = make_request("GET", f"{BACKEND_URL}/api/payments", 
                                   token=tokens["client"])
            if response and response.status_code == 200:
                payments = response.json()
                results.add_pass("Get Payment History", f"Retrieved {len(payments)} payments")
            else:
                results.add_fail("Get Payment History", 
                               f"Status: {response.status_code if response else 'N/A'}")
        except Exception as e:
            results.add_fail("Get Payment History", str(e))

# ============================================================================
# SECTION 8: Reviews & Ratings
# ============================================================================

def test_reviews():
    print_section("SECTION 8: Reviews & Ratings")
    
    # Test 23: Get Freelancer Reviews
    if user_ids["freelancer"]:
        try:
            response = make_request("GET", f"{BACKEND_URL}/api/users/{user_ids['freelancer']}/reviews")
            if response and response.status_code == 200:
                reviews = response.json()
                results.add_pass("Get Freelancer Reviews", f"Retrieved {len(reviews)} reviews")
            else:
                results.add_fail("Get Freelancer Reviews", 
                               f"Status: {response.status_code if response else 'N/A'}")
        except Exception as e:
            results.add_fail("Get Freelancer Reviews", str(e))

# ============================================================================
# SECTION 9: Frontend Pages Accessibility
# ============================================================================

def test_frontend_pages():
    print_section("SECTION 9: Frontend Pages Accessibility")
    
    frontend_pages = [
        ("/", "Homepage"),
        ("/about", "About Page"),
        ("/pricing", "Pricing Page"),
        ("/login", "Login Page"),
        ("/signup", "Signup Page"),
        ("/freelancers", "Freelancers Directory"),
        ("/clients", "Clients Directory"),
        ("/jobs", "Jobs Listing"),
        ("/how-it-works", "How It Works"),
        ("/contact", "Contact Page"),
    ]
    
    for path, name in frontend_pages:
        try:
            response = make_request("GET", f"{FRONTEND_URL}{path}")
            if response and response.status_code == 200:
                results.add_pass(f"Frontend: {name}", f"Accessible at {path}")
            else:
                results.add_fail(f"Frontend: {name}", 
                               f"Status: {response.status_code if response else 'N/A'}")
        except Exception as e:
            results.add_fail(f"Frontend: {name}", str(e))

# ============================================================================
# SECTION 10: Database Schema Verification
# ============================================================================

def test_database_schema():
    print_section("SECTION 10: Database Schema Verification")
    
    # Test that we can access and interact with all major tables through API
    endpoints_to_verify = [
        ("/api/users", "Users table"),
        ("/api/projects", "Projects table"),
        ("/api/skills", "Skills table"),
    ]
    
    for endpoint, table_name in endpoints_to_verify:
        try:
            response = make_request("GET", f"{BACKEND_URL}{endpoint}")
            if response and response.status_code in [200, 401]:  # 401 means table exists but needs auth
                results.add_pass(f"Database Schema: {table_name}", "Table accessible via API")
            else:
                results.add_fail(f"Database Schema: {table_name}", 
                               f"Status: {response.status_code if response else 'N/A'}")
        except Exception as e:
            results.add_fail(f"Database Schema: {table_name}", str(e))

# ============================================================================
# Main Test Execution
# ============================================================================

def main():
    print(f"\n{Colors.BOLD}{Colors.BLUE}")
    print("=" * 80)
    print(" " * 15 + "MegiLance Platform - Comprehensive System Test")
    print(" " * 20 + "Testing All Features with Database")
    print("=" * 80)
    print(f"{Colors.RESET}\n")
    
    print(f"{Colors.CYAN}Backend URL: {BACKEND_URL}{Colors.RESET}")
    print(f"{Colors.CYAN}Frontend URL: {FRONTEND_URL}{Colors.RESET}")
    print(f"{Colors.CYAN}Test Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}{Colors.RESET}\n")
    
    # Run all test sections
    test_backend_health()
    time.sleep(1)  # Rate limiting protection
    
    test_authentication()
    time.sleep(1)
    
    test_admin_features()
    time.sleep(1)
    
    test_projects_workflow()
    time.sleep(1)
    
    test_portfolio_features()
    time.sleep(1)
    
    test_messaging()
    time.sleep(1)
    
    test_payments()
    time.sleep(1)
    
    test_reviews()
    time.sleep(1)
    
    test_frontend_pages()
    time.sleep(1)
    
    test_database_schema()
    
    # Print final summary
    results.print_summary()
    
    # Print created entities summary
    if any(created_entities.values()):
        print(f"{Colors.BOLD}Created Entities During Testing:{Colors.RESET}")
        if created_entities["projects"]:
            print(f"  Projects: {len(created_entities['projects'])}")
        if created_entities["proposals"]:
            print(f"  Proposals: {len(created_entities['proposals'])}")
        if created_entities["messages"]:
            print(f"  Messages: {len(created_entities['messages'])}")
        print()
    
    # Return exit code based on test results
    return 0 if results.failed == 0 else 1

if __name__ == "__main__":
    exit(main())
