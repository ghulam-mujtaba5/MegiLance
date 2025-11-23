"""
Complete API Testing Script for MegiLance
Tests all major user flows and API endpoints systematically
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000/api"

# Test results tracking
test_results = {
    "passed": [],
    "failed": [],
    "timestamp": datetime.now().isoformat()
}

def log_test(test_name, passed, details=""):
    """Log test result"""
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"{status}: {test_name}")
    if details:
        print(f"   Details: {details}")
    
    if passed:
        test_results["passed"].append(test_name)
    else:
        test_results["failed"].append({"test": test_name, "details": details})

def test_health_check():
    """Test health endpoints"""
    print("\n=== Testing Health Endpoints ===")
    
    try:
        # Live endpoint
        response = requests.get(f"{BASE_URL}/health/live")
        log_test("Health Live Endpoint", response.status_code == 200, f"Status: {response.status_code}")
        
        # Ready endpoint
        response = requests.get(f"{BASE_URL}/health/ready")
        log_test("Health Ready Endpoint", response.status_code == 200, f"Status: {response.status_code}")
    except Exception as e:
        log_test("Health Check", False, str(e))

def test_user_registration():
    """Test user registration"""
    print("\n=== Testing User Registration ===")
    
    test_users = [
        {
            "email": "admin@megilance.com",
            "password": "Admin@123456",
            "name": "Admin User",
            "user_type": "admin",
            "bio": "System Administrator"
        },
        {
            "email": "freelancer@megilance.com",
            "password": "Freelancer@123",
            "name": "John Freelancer",
            "user_type": "freelancer",
            "bio": "Full-stack developer with 5+ years experience",
            "skills": "Python, JavaScript, React, Node.js",
            "hourly_rate": 75.00,
            "location": "San Francisco, CA"
        },
        {
            "email": "client@megilance.com",
            "password": "Client@123",
            "name": "Sarah Client",
            "user_type": "client",
            "bio": "Tech startup founder",
            "location": "New York, NY"
        }
    ]
    
    for user in test_users:
        try:
            response = requests.post(f"{BASE_URL}/auth/register", json=user)
            
            if response.status_code == 201:
                data = response.json()
                log_test(f"Register {user['user_type']}: {user['email']}", True, f"User ID: {data.get('id')}")
                # Store user ID for later use
                user['id'] = data.get('id')
            elif response.status_code == 400 and "already registered" in response.text:
                log_test(f"Register {user['user_type']}: {user['email']}", True, "User already exists (OK)")
            else:
                log_test(f"Register {user['user_type']}: {user['email']}", False, f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            log_test(f"Register {user['user_type']}: {user['email']}", False, str(e))
    
    return test_users

def test_user_login(test_users):
    """Test user login and store tokens"""
    print("\n=== Testing User Login ===")
    
    authenticated_users = []
    
    for user in test_users:
        try:
            login_data = {
                "username": user["email"],  # FastAPI uses "username" field
                "password": user["password"]
            }
            
            response = requests.post(f"{BASE_URL}/auth/login", data=login_data)
            
            if response.status_code == 200:
                data = response.json()
                user['access_token'] = data.get('access_token')
                user['refresh_token'] = data.get('refresh_token')
                user['headers'] = {"Authorization": f"Bearer {user['access_token']}"}
                authenticated_users.append(user)
                log_test(f"Login {user['user_type']}: {user['email']}", True, "Token received")
            else:
                log_test(f"Login {user['user_type']}: {user['email']}", False, f"Status: {response.status_code}, Response: {response.text[:200]}")
        except Exception as e:
            log_test(f"Login {user['user_type']}: {user['email']}", False, str(e))
    
    return authenticated_users

def test_get_current_user(authenticated_users):
    """Test getting current user info"""
    print("\n=== Testing Get Current User ===")
    
    for user in authenticated_users:
        try:
            response = requests.get(f"{BASE_URL}/auth/me", headers=user['headers'])
            
            if response.status_code == 200:
                data = response.json()
                log_test(f"Get Current User: {user['email']}", True, f"Name: {data.get('name')}")
            else:
                log_test(f"Get Current User: {user['email']}", False, f"Status: {response.status_code}")
        except Exception as e:
            log_test(f"Get Current User: {user['email']}", False, str(e))

def test_project_creation(authenticated_users):
    """Test project creation by client"""
    print("\n=== Testing Project Creation ===")
    
    # Find client user
    client = next((u for u in authenticated_users if u['user_type'] == 'client'), None)
    
    if not client:
        log_test("Project Creation", False, "No client user authenticated")
        return None
    
    project_data = {
        "title": "Build a Modern Web Application",
        "description": "Need a full-stack developer to build a React + FastAPI application with user authentication, dashboard, and payment integration.",
        "category": "Web Development",
        "budget": 5000.00,
        "deadline": "2025-02-28",
        "required_skills": "React, FastAPI, PostgreSQL, Payment Integration"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/projects/", json=project_data, headers=client['headers'])
        
        if response.status_code == 201:
            data = response.json()
            project_id = data.get('id')
            log_test("Create Project", True, f"Project ID: {project_id}")
            return project_id
        else:
            log_test("Create Project", False, f"Status: {response.status_code}, Response: {response.text[:200]}")
            return None
    except Exception as e:
        log_test("Create Project", False, str(e))
        return None

def test_list_projects(authenticated_users):
    """Test listing projects"""
    print("\n=== Testing List Projects ===")
    
    freelancer = next((u for u in authenticated_users if u['user_type'] == 'freelancer'), None)
    
    if not freelancer:
        log_test("List Projects", False, "No freelancer user authenticated")
        return
    
    try:
        response = requests.get(f"{BASE_URL}/projects/", headers=freelancer['headers'])
        
        if response.status_code == 200:
            projects = response.json()
            log_test("List Projects", True, f"Found {len(projects)} projects")
        else:
            log_test("List Projects", False, f"Status: {response.status_code}")
    except Exception as e:
        log_test("List Projects", False, str(e))

def test_proposal_creation(authenticated_users, project_id):
    """Test proposal creation by freelancer"""
    print("\n=== Testing Proposal Creation ===")
    
    if not project_id:
        log_test("Proposal Creation", False, "No project available")
        return None
    
    freelancer = next((u for u in authenticated_users if u['user_type'] == 'freelancer'), None)
    
    if not freelancer:
        log_test("Proposal Creation", False, "No freelancer user authenticated")
        return None
    
    proposal_data = {
        "project_id": project_id,
        "cover_letter": "I am a seasoned full-stack developer with extensive experience in React and FastAPI. I've successfully delivered 20+ similar projects. I can complete this within your deadline with high quality.",
        "proposed_price": 4500.00,
        "estimated_duration": 30,
        "milestones": "Week 1-2: Setup and Authentication\nWeek 3-4: Dashboard and Core Features\nWeek 5: Payment Integration and Testing"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/proposals/", json=proposal_data, headers=freelancer['headers'])
        
        if response.status_code == 201:
            data = response.json()
            proposal_id = data.get('id')
            log_test("Create Proposal", True, f"Proposal ID: {proposal_id}")
            return proposal_id
        else:
            log_test("Create Proposal", False, f"Status: {response.status_code}, Response: {response.text[:200]}")
            return None
    except Exception as e:
        log_test("Create Proposal", False, str(e))
        return None

def test_skills_endpoints(authenticated_users):
    """Test skills management"""
    print("\n=== Testing Skills Endpoints ===")
    
    # Test list skills (public endpoint)
    try:
        response = requests.get(f"{BASE_URL}/skills/")
        log_test("List Skills", response.status_code == 200, f"Status: {response.status_code}")
    except Exception as e:
        log_test("List Skills", False, str(e))
    
    # Test list skill categories
    try:
        response = requests.get(f"{BASE_URL}/skills/categories")
        log_test("List Skill Categories", response.status_code == 200, f"Status: {response.status_code}")
    except Exception as e:
        log_test("List Skill Categories", False, str(e))

def test_search_functionality():
    """Test search endpoints"""
    print("\n=== Testing Search Functionality ===")
    
    try:
        # Test global search
        response = requests.get(f"{BASE_URL}/search/global?q=developer")
        log_test("Global Search", response.status_code == 200, f"Status: {response.status_code}")
        
        # Test autocomplete
        response = requests.get(f"{BASE_URL}/search/autocomplete?q=web")
        log_test("Search Autocomplete", response.status_code == 200, f"Status: {response.status_code}")
    except Exception as e:
        log_test("Search Endpoints", False, str(e))

def generate_test_report():
    """Generate and print final test report"""
    print("\n" + "="*60)
    print("FINAL TEST REPORT")
    print("="*60)
    print(f"Timestamp: {test_results['timestamp']}")
    print(f"\n✅ Tests Passed: {len(test_results['passed'])}")
    print(f"❌ Tests Failed: {len(test_results['failed'])}")
    
    total_tests = len(test_results['passed']) + len(test_results['failed'])
    pass_rate = (len(test_results['passed']) / total_tests * 100) if total_tests > 0 else 0
    print(f"📊 Pass Rate: {pass_rate:.1f}%")
    
    if test_results['failed']:
        print("\n❌ Failed Tests:")
        for failure in test_results['failed']:
            print(f"  - {failure['test']}")
            if failure['details']:
                print(f"    {failure['details']}")
    
    # Save report to file
    with open('test_report.json', 'w') as f:
        json.dump(test_results, f, indent=2)
    
    print("\n📄 Detailed report saved to: test_report.json")
    print("="*60)

def main():
    """Run all tests"""
    print("="*60)
    print("MegiLance API - Complete Testing Suite")
    print("="*60)
    print(f"Backend URL: {BASE_URL}")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Test sequence
    test_health_check()
    test_users = test_user_registration()
    authenticated_users = test_user_login(test_users)
    
    if authenticated_users:
        test_get_current_user(authenticated_users)
        project_id = test_project_creation(authenticated_users)
        test_list_projects(authenticated_users)
        
        if project_id:
            test_proposal_creation(authenticated_users, project_id)
        
        test_skills_endpoints(authenticated_users)
    
    test_search_functionality()
    
    # Generate final report
    generate_test_report()

if __name__ == "__main__":
    main()
