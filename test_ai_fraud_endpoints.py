"""
API Testing Script for MegiLance AI and Fraud Detection Endpoints
"""
import requests
import json
from typing import Dict, List
from datetime import datetime

BASE_URL = "http://127.0.0.1:8000/api"

# Test credentials
ADMIN_CREDS = {"email": "admin@megilance.com", "password": "admin123"}
CLIENT_CREDS = {"email": "client@example.com", "password": "client123"}

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
    
    response = requests.post(
        f"{BASE_URL}/auth/login",
        json=login_data,
        headers={"Content-Type": "application/json"}
    )
    
    if response.status_code == 200:
        return response.json()["access_token"]
    raise Exception(f"Login failed: {response.text}")

def test_ai_endpoints(result: TestResult):
    """Test AI endpoints"""
    print(f"\n{'='*60}")
    print("TESTING AI ENDPOINTS")
    print(f"{'='*60}")
    
    # 1. Chatbot (Public)
    try:
        response = requests.post(
            f"{BASE_URL}/ai/chat",
            params={"message": "Hello, I need help with pricing"},
            timeout=30
        )
        if response.status_code == 200:
            result.add_pass("POST /ai/chat")
        else:
            result.add_fail("POST /ai/chat", f"Status: {response.status_code}")
    except Exception as e:
        result.add_fail("POST /ai/chat", e)

    # 2. Fraud Check (Public)
    try:
        # Send multiple keywords to trigger higher risk score
        # Logic: risk_score = min(len(detected_flags) * 15, 100)
        # Need > 30 for medium. 3 flags = 45.
        text = "Please send money via Western Union immediately. I need an advance payment. This is a risk free guarantee."
        
        response = requests.post(
            f"{BASE_URL}/ai/fraud-check",
            params={"text": text},
            timeout=30
        )
        if response.status_code == 200:
            data = response.json()
            print(f"DEBUG: Fraud check response: {data}")
            if data.get("risk_level") in ["high", "medium"]:
                result.add_pass("POST /ai/fraud-check (Detected fraud)")
            else:
                result.add_fail("POST /ai/fraud-check", f"Failed to detect fraud keywords. Response: {data}")
        else:
            result.add_fail("POST /ai/fraud-check", f"Status: {response.status_code} - {response.text}")
    except Exception as e:
        result.add_fail("POST /ai/fraud-check", e)

    # 3. Estimate Price (Authenticated)
    try:
        token = login(CLIENT_CREDS)
        headers = {"Authorization": f"Bearer {token}"}
        
        # Split params: Simple types in Query, List in Body
        query_params = {
            "category": "Web Development",
            "description": "Build a website",
            "complexity": "moderate",
            "estimated_hours": 40
        }
        
        # List goes in body
        body_data = ["Python", "React"] # Just the list, because the argument name is skills_required
        # Wait, if it's just List[str], FastAPI expects a JSON array as the body?
        # Or { "skills_required": [...] }?
        # If it's the ONLY body parameter, it might expect the list directly if embed=False (default).
        # But usually it's safer to wrap it if multiple body params. Here only one.
        # Let's try sending the list directly first.
        
        response = requests.post(
            f"{BASE_URL}/ai/estimate-price",
            params=query_params,
            json=body_data,
            headers=headers,
            timeout=30
        )
        
        if response.status_code == 200:
            result.add_pass("POST /ai/estimate-price")
        else:
            result.add_fail("POST /ai/estimate-price", f"Status: {response.status_code} - {response.text}")
            
    except Exception as e:
        result.add_fail("POST /ai/estimate-price", e)

def test_fraud_detection_endpoints(result: TestResult):
    """Test Fraud Detection endpoints"""
    print(f"\n{'='*60}")
    print("TESTING FRAUD DETECTION ENDPOINTS")
    print(f"{'='*60}")
    
    try:
        token = login(ADMIN_CREDS)
        headers = {"Authorization": f"Bearer {token}"}
        
        # 1. My Risk Profile
        response = requests.get(
            f"{BASE_URL}/fraud-detection/my-risk-profile",
            headers=headers,
            timeout=30
        )
        if response.status_code == 200:
            result.add_pass("GET /fraud-detection/my-risk-profile")
        else:
            result.add_fail("GET /fraud-detection/my-risk-profile", f"Status: {response.status_code} - {response.text}")
            
        # 2. Config Thresholds
        response = requests.get(
            f"{BASE_URL}/fraud-detection/config/thresholds",
            headers=headers,
            timeout=30
        )
        if response.status_code == 200:
            result.add_pass("GET /fraud-detection/config/thresholds")
        else:
            result.add_fail("GET /fraud-detection/config/thresholds", f"Status: {response.status_code}")

    except Exception as e:
        result.add_fail("Fraud Detection endpoints", e)

def main():
    print(f"\n{'='*60}")
    print("MEGILANCE AI & FRAUD TEST SUITE")
    print(f"Base URL: {BASE_URL}")
    print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*60}")
    
    result = TestResult()
    
    test_ai_endpoints(result)
    test_fraud_detection_endpoints(result)
    
    result.summary()

if __name__ == "__main__":
    main()
