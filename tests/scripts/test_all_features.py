"""
Comprehensive Feature Testing Script for MegiLance
Tests all API endpoints and identifies non-functional features
"""
import requests
import json
from typing import Dict, List, Tuple
import time

BASE_URL = "http://localhost:3000/backend/api"  # Frontend proxies to backend
FRONTEND_URL = "http://localhost:3000"

# Test credentials
ADMIN_CREDS = {"email": "admin@megilance.com", "password": "Admin@123"}
FREELANCER_CREDS = {"email": "freelancer1@example.com", "password": "Demo123!"}
CLIENT_CREDS = {"email": "client1@example.com", "password": "Demo123!"}

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

class FeatureTester:
    def __init__(self):
        self.results = {
            "working": [],
            "broken": [],
            "missing": []
        }
        self.tokens = {}
        
    def print_result(self, status: str, message: str, details: str = ""):
        if status == "PASS":
            print(f"{Colors.GREEN}[PASS]{Colors.END} {message}")
            self.results["working"].append({"feature": message, "details": details})
        elif status == "FAIL":
            print(f"{Colors.RED}[FAIL]{Colors.END} {message}")
            if details:
                print(f"       {Colors.YELLOW}Details: {details}{Colors.END}")
            self.results["broken"].append({"feature": message, "details": details})
        elif status == "MISS":
            print(f"{Colors.YELLOW}[MISS]{Colors.END} {message}")
            self.results["missing"].append({"feature": message, "details": details})
    
    def authenticate(self, role: str) -> bool:
        """Authenticate and store token"""
        creds = {"admin": ADMIN_CREDS, "freelancer": FREELANCER_CREDS, "client": CLIENT_CREDS}
        
        try:
            response = requests.post(f"{BASE_URL}/auth/login", json=creds[role], timeout=10)
            if response.status_code == 200:
                data = response.json()
                self.tokens[role] = data.get("access_token")
                self.print_result("PASS", f"{role.capitalize()} authentication", f"Token: {self.tokens[role][:20]}...")
                return True
            else:
                self.print_result("FAIL", f"{role.capitalize()} authentication", f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.print_result("FAIL", f"{role.capitalize()} authentication", str(e))
            return False
    
    def test_endpoint(self, method: str, endpoint: str, token: str = None, data: dict = None, expected_status: int = 200) -> Tuple[bool, dict]:
        """Test a single API endpoint"""
        headers = {"Authorization": f"Bearer {token}"} if token else {}
        url = f"{BASE_URL}{endpoint}"
        
        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=headers, timeout=10)
            elif method.upper() == "POST":
                response = requests.post(url, headers=headers, json=data, timeout=10)
            elif method.upper() == "PUT":
                response = requests.put(url, headers=headers, json=data, timeout=10)
            elif method.upper() == "DELETE":
                response = requests.delete(url, headers=headers, timeout=10)
            else:
                return False, {"error": "Invalid method"}
            
            if response.status_code == expected_status:
                return True, response.json() if response.text else {}
            else:
                return False, {"status": response.status_code, "text": response.text[:200]}
        except Exception as e:
            return False, {"error": str(e)}
    
    def test_health_endpoints(self):
        """Test health check endpoints"""
        print(f"\n{Colors.BLUE}=== Testing Health Endpoints ==={Colors.END}")
        
        success, data = self.test_endpoint("GET", "/health/live")
        self.print_result("PASS" if success else "FAIL", "Health - Live endpoint", str(data))
        
        success, data = self.test_endpoint("GET", "/health/ready")
        self.print_result("PASS" if success else "FAIL", "Health - Ready endpoint", str(data))
    
    def test_admin_endpoints(self):
        """Test all admin endpoints"""
        print(f"\n{Colors.BLUE}=== Testing Admin Portal Endpoints ==={Colors.END}")
        
        if not self.authenticate("admin"):
            print(f"{Colors.RED}Cannot test admin endpoints without authentication{Colors.END}")
            return
        
        token = self.tokens["admin"]
        
        # Dashboard
        success, data = self.test_endpoint("GET", "/admin/dashboard/stats", token)
        self.print_result("PASS" if success else "FAIL", "Admin - Dashboard stats", 
                         f"Users: {data.get('total_users', 'N/A')}" if success else str(data))
        
        # Users management
        success, data = self.test_endpoint("GET", "/admin/users", token)
        self.print_result("PASS" if success else "FAIL", "Admin - List users", 
                         f"Count: {len(data) if isinstance(data, list) else 'N/A'}" if success else str(data))
        
        success, data = self.test_endpoint("GET", "/admin/users?role=freelancer", token)
        self.print_result("PASS" if success else "FAIL", "Admin - Filter users by role", str(data)[:100] if success else str(data))
        
        # Projects management
        success, data = self.test_endpoint("GET", "/admin/projects", token)
        self.print_result("PASS" if success else "FAIL", "Admin - List projects", 
                         f"Count: {len(data) if isinstance(data, list) else 'N/A'}" if success else str(data))
        
        # Payments
        success, data = self.test_endpoint("GET", "/admin/payments", token)
        self.print_result("PASS" if success else "FAIL", "Admin - List payments", str(data)[:100] if success else str(data))
        
        # Analytics
        success, data = self.test_endpoint("GET", "/admin/analytics/overview", token)
        self.print_result("PASS" if success else "FAIL", "Admin - Analytics overview", str(data)[:100] if success else str(data))
        
        # Support tickets
        success, data = self.test_endpoint("GET", "/admin/support/tickets", token)
        self.print_result("PASS" if success else "FAIL", "Admin - Support tickets", str(data)[:100] if success else str(data))
        
        # AI Monitoring
        success, data = self.test_endpoint("GET", "/admin/ai/usage", token)
        self.print_result("PASS" if success else "FAIL", "Admin - AI usage monitoring", str(data)[:100] if success else str(data))
        
        # Settings
        success, data = self.test_endpoint("GET", "/admin/settings", token)
        self.print_result("PASS" if success else "FAIL", "Admin - Platform settings", str(data)[:100] if success else str(data))
    
    def test_client_endpoints(self):
        """Test all client endpoints"""
        print(f"\n{Colors.BLUE}=== Testing Client Portal Endpoints ==={Colors.END}")
        
        if not self.authenticate("client"):
            print(f"{Colors.RED}Cannot test client endpoints without authentication{Colors.END}")
            return
        
        token = self.tokens["client"]
        
        # Dashboard
        success, data = self.test_endpoint("GET", "/client/dashboard/stats", token)
        self.print_result("PASS" if success else "FAIL", "Client - Dashboard stats", str(data)[:100] if success else str(data))
        
        # Projects
        success, data = self.test_endpoint("GET", "/client/projects", token)
        self.print_result("PASS" if success else "FAIL", "Client - My projects", 
                         f"Count: {len(data) if isinstance(data, list) else 'N/A'}" if success else str(data))
        
        # Post job
        job_data = {
            "title": "Test Project",
            "description": "Testing project creation",
            "budget": 1000,
            "skills": ["Python", "FastAPI"]
        }
        success, data = self.test_endpoint("POST", "/client/projects", token, job_data, expected_status=201)
        self.print_result("PASS" if success else "FAIL", "Client - Post new job", str(data)[:100] if success else str(data))
        
        # Browse freelancers
        success, data = self.test_endpoint("GET", "/freelancers", token)
        self.print_result("PASS" if success else "FAIL", "Client - Browse freelancers", 
                         f"Count: {len(data) if isinstance(data, list) else 'N/A'}" if success else str(data))
        
        # Proposals
        success, data = self.test_endpoint("GET", "/client/proposals", token)
        self.print_result("PASS" if success else "FAIL", "Client - View proposals", str(data)[:100] if success else str(data))
        
        # Payments
        success, data = self.test_endpoint("GET", "/client/payments", token)
        self.print_result("PASS" if success else "FAIL", "Client - Payment history", str(data)[:100] if success else str(data))
        
        # Wallet
        success, data = self.test_endpoint("GET", "/client/wallet", token)
        self.print_result("PASS" if success else "FAIL", "Client - Wallet balance", str(data)[:100] if success else str(data))
    
    def test_freelancer_endpoints(self):
        """Test all freelancer endpoints"""
        print(f"\n{Colors.BLUE}=== Testing Freelancer Portal Endpoints ==={Colors.END}")
        
        if not self.authenticate("freelancer"):
            print(f"{Colors.RED}Cannot test freelancer endpoints without authentication{Colors.END}")
            return
        
        token = self.tokens["freelancer"]
        
        # Dashboard
        success, data = self.test_endpoint("GET", "/freelancer/dashboard/stats", token)
        self.print_result("PASS" if success else "FAIL", "Freelancer - Dashboard stats", str(data)[:100] if success else str(data))
        
        # Browse jobs
        success, data = self.test_endpoint("GET", "/freelancer/jobs", token)
        self.print_result("PASS" if success else "FAIL", "Freelancer - Browse jobs", 
                         f"Count: {len(data) if isinstance(data, list) else 'N/A'}" if success else str(data))
        
        # My projects
        success, data = self.test_endpoint("GET", "/freelancer/projects", token)
        self.print_result("PASS" if success else "FAIL", "Freelancer - My projects", str(data)[:100] if success else str(data))
        
        # Submit proposal
        proposal_data = {
            "project_id": 1,
            "cover_letter": "Test proposal",
            "bid_amount": 500,
            "delivery_time": 7
        }
        success, data = self.test_endpoint("POST", "/freelancer/proposals", token, proposal_data, expected_status=201)
        self.print_result("PASS" if success else "FAIL", "Freelancer - Submit proposal", str(data)[:100] if success else str(data))
        
        # Portfolio
        success, data = self.test_endpoint("GET", "/freelancer/portfolio", token)
        self.print_result("PASS" if success else "FAIL", "Freelancer - Portfolio", str(data)[:100] if success else str(data))
        
        # Skills
        success, data = self.test_endpoint("GET", "/freelancer/skills", token)
        self.print_result("PASS" if success else "FAIL", "Freelancer - Skills list", str(data)[:100] if success else str(data))
        
        # Earnings
        success, data = self.test_endpoint("GET", "/freelancer/earnings", token)
        self.print_result("PASS" if success else "FAIL", "Freelancer - Earnings", str(data)[:100] if success else str(data))
        
        # Wallet
        success, data = self.test_endpoint("GET", "/freelancer/wallet", token)
        self.print_result("PASS" if success else "FAIL", "Freelancer - Wallet balance", str(data)[:100] if success else str(data))
    
    def test_shared_features(self):
        """Test shared features (messages, notifications, profile)"""
        print(f"\n{Colors.BLUE}=== Testing Shared Features ==={Colors.END}")
        
        token = self.tokens.get("client")
        if not token:
            print(f"{Colors.YELLOW}Skipping shared features (no authentication){Colors.END}")
            return
        
        # Messages
        success, data = self.test_endpoint("GET", "/messages", token)
        self.print_result("PASS" if success else "FAIL", "Messages - Inbox", str(data)[:100] if success else str(data))
        
        # Notifications
        success, data = self.test_endpoint("GET", "/notifications", token)
        self.print_result("PASS" if success else "FAIL", "Notifications - List", str(data)[:100] if success else str(data))
        
        # Profile
        success, data = self.test_endpoint("GET", "/profile", token)
        self.print_result("PASS" if success else "FAIL", "Profile - View", str(data)[:100] if success else str(data))
        
        # Settings
        success, data = self.test_endpoint("GET", "/settings", token)
        self.print_result("PASS" if success else "FAIL", "Settings - User settings", str(data)[:100] if success else str(data))
    
    def test_ai_features(self):
        """Test AI-powered features"""
        print(f"\n{Colors.BLUE}=== Testing AI Features ==={Colors.END}")
        
        # Chatbot
        success, data = self.test_endpoint("POST", "/ai/chat", None, {"message": "Hello"})
        self.print_result("PASS" if success else "FAIL", "AI - Chatbot", str(data)[:100] if success else str(data))
        
        # Fraud detection
        success, data = self.test_endpoint("POST", "/ai/fraud-check", None, {"text": "Test project description"})
        self.print_result("PASS" if success else "FAIL", "AI - Fraud detection", str(data)[:100] if success else str(data))
        
        # Price estimator
        success, data = self.test_endpoint("POST", "/ai/estimate-price", None, {"description": "Build a website", "skills": ["React", "Node.js"]})
        self.print_result("PASS" if success else "FAIL", "AI - Price estimator", str(data)[:100] if success else str(data))
    
    def generate_report(self):
        """Generate comprehensive test report"""
        print(f"\n{Colors.BLUE}{'='*60}{Colors.END}")
        print(f"{Colors.BLUE}=== COMPREHENSIVE TEST REPORT ==={Colors.END}")
        print(f"{Colors.BLUE}{'='*60}{Colors.END}\n")
        
        total = len(self.results["working"]) + len(self.results["broken"]) + len(self.results["missing"])
        
        print(f"{Colors.GREEN}Working Features: {len(self.results['working'])}/{total}{Colors.END}")
        print(f"{Colors.RED}Broken Features: {len(self.results['broken'])}/{total}{Colors.END}")
        print(f"{Colors.YELLOW}Missing Features: {len(self.results['missing'])}/{total}{Colors.END}")
        
        if self.results["broken"]:
            print(f"\n{Colors.RED}=== BROKEN FEATURES REQUIRING FIXES ==={Colors.END}")
            for i, item in enumerate(self.results["broken"], 1):
                print(f"{i}. {item['feature']}")
                if item['details']:
                    print(f"   Issue: {item['details']}")
        
        if self.results["missing"]:
            print(f"\n{Colors.YELLOW}=== MISSING FEATURES TO IMPLEMENT ==={Colors.END}")
            for i, item in enumerate(self.results["missing"], 1):
                print(f"{i}. {item['feature']}")
        
        # Save to file
        with open("test_results.json", "w") as f:
            json.dump(self.results, f, indent=2)
        
        print(f"\n{Colors.BLUE}Full results saved to: test_results.json{Colors.END}")
    
    def run_all_tests(self):
        """Run all feature tests"""
        print(f"\n{Colors.BLUE}{'='*60}{Colors.END}")
        print(f"{Colors.BLUE}MegiLance Comprehensive Feature Testing{Colors.END}")
        print(f"{Colors.BLUE}{'='*60}{Colors.END}")
        
        self.test_health_endpoints()
        time.sleep(1)
        
        self.test_admin_endpoints()
        time.sleep(2)
        
        self.test_client_endpoints()
        time.sleep(2)
        
        self.test_freelancer_endpoints()
        time.sleep(2)
        
        self.test_shared_features()
        time.sleep(1)
        
        self.test_ai_features()
        
        self.generate_report()

if __name__ == "__main__":
    tester = FeatureTester()
    tester.run_all_tests()
