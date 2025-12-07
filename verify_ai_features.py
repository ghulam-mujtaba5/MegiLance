"""
Verification script for AI Features (Price, Rate, Fraud, Matching)
"""
import requests
import json
import sys

BASE_URL = "http://localhost:8000"

def print_result(name, status, details=""):
    symbol = "✓" if status else "✗"
    color = "\033[92m" if status else "\033[91m"
    reset = "\033[0m"
    print(f"{color}{symbol} {name}{reset} {details}")

def test_endpoint(name, method, url, headers=None, data=None, expected_status=200):
    try:
        if method == "GET":
            r = requests.get(url, headers=headers, timeout=10)
        elif method == "POST":
            r = requests.post(url, headers=headers, json=data, timeout=10)
        
        success = r.status_code == expected_status
        details = f"({r.status_code})"
        if not success:
            try:
                details += f" - {r.json()}"
            except:
                details += f" - {r.text[:100]}"
        
        print_result(name, success, details)
        return r if success else None
    except Exception as e:
        print_result(name, False, f"ERROR: {e}")
        return None

def main():
    print("=" * 60)
    print("AI Features Verification")
    print("=" * 60)
    
    # 1. Authenticate
    print("\n--- Authentication ---")
    login_response = test_endpoint(
        "Login as Client", 
        "POST", 
        f"{BASE_URL}/api/auth/login", 
        data={"email": "client@demo.com", "password": "Password123"}
    )
    
    if not login_response:
        print("Cannot proceed without authentication.")
        sys.exit(1)
        
    token = login_response.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. AI Price Estimation
    print("\n--- AI Price Estimation ---")
    price_data = {
        "title": "Build a React Native App",
        "description": "I need a mobile app for my e-commerce store. It should support iOS and Android.",
        "category": "Mobile Development",
        "skills": ["React Native", "iOS", "Android", "API Integration"],
        "experience_level": "intermediate"
    }
    r = test_endpoint(
        "Estimate Project Price", 
        "POST", 
        f"{BASE_URL}/api/ai/estimate-price", 
        headers=headers, 
        data=price_data
    )
    if r:
        print(f"  Response: {json.dumps(r.json(), indent=2)}")

    # 3. AI Rate Estimation
    print("\n--- AI Rate Estimation ---")
    rate_data = {
        "skills": ["Python", "FastAPI", "Machine Learning"],
        "experience_years": 5,
        "category": "Data Science",
        "location": "Remote"
    }
    r = test_endpoint(
        "Estimate Freelancer Rate", 
        "POST", 
        f"{BASE_URL}/api/ai/estimate-rate", 
        headers=headers, 
        data=rate_data
    )
    if r:
        print(f"  Response: {json.dumps(r.json(), indent=2)}")

    # 4. Fraud Detection
    print("\n--- Fraud Detection ---")
    fraud_data = {
        "content": "I can do this project. Please contact me at scammer@fake.com or telegram @scam.",
        "user_id": 1,
        "context_type": "proposal"
    }
    r = test_endpoint(
        "Check Proposal for Fraud", 
        "POST", 
        f"{BASE_URL}/api/fraud/check-proposal", 
        headers=headers, 
        data=fraud_data
    )
    if r:
        print(f"  Response: {json.dumps(r.json(), indent=2)}")

    # 5. AI Matching
    print("\n--- AI Matching ---")
    r = test_endpoint(
        "Get Recommendations", 
        "GET", 
        f"{BASE_URL}/api/matching/recommendations?limit=3", 
        headers=headers
    )
    if r:
        print(f"  Response: {json.dumps(r.json(), indent=2)}")

    print("\n" + "=" * 60)
    print("Verification Complete")
    print("=" * 60)

if __name__ == "__main__":
    main()
