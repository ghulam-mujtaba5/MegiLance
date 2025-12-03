#!/usr/bin/env python3
"""
Comprehensive API Endpoint Testing Script
Tests all MegiLance API endpoints with real Turso database
"""
import httpx
import json
from datetime import datetime

BASE_URL = "http://localhost:8000/api"
RESULTS = []

def log_result(endpoint: str, method: str, status: str, details: str = ""):
    RESULTS.append({
        "endpoint": endpoint,
        "method": method,
        "status": status,
        "details": details
    })
    icon = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
    print(f"{icon} [{method}] {endpoint} - {status} {details}")

def test_endpoint(method: str, endpoint: str, token: str = None, data: dict = None, expected_status: int = 200):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    # Ensure trailing slash for GET requests (FastAPI redirect issue)
    if method == "GET" and not endpoint.endswith("/") and "?" not in endpoint:
        endpoint = endpoint + "/"
    
    try:
        if method == "GET":
            response = httpx.get(f"{BASE_URL}{endpoint}", headers=headers, timeout=30, follow_redirects=True)
        elif method == "POST":
            response = httpx.post(f"{BASE_URL}{endpoint}", headers=headers, json=data, timeout=30)
        elif method == "PUT":
            response = httpx.put(f"{BASE_URL}{endpoint}", headers=headers, json=data, timeout=30)
        elif method == "DELETE":
            response = httpx.delete(f"{BASE_URL}{endpoint}", headers=headers, timeout=30)
        else:
            return None, "Invalid method"
        
        if response.status_code == expected_status:
            log_result(endpoint, method, "PASS", f"Status: {response.status_code}")
            return response.json() if response.content else {}, None
        else:
            log_result(endpoint, method, "FAIL", f"Expected {expected_status}, got {response.status_code}")
            return None, response.text
    except Exception as e:
        log_result(endpoint, method, "FAIL", str(e))
        return None, str(e)

def main():
    print("=" * 60)
    print("MegiLance API Comprehensive Testing")
    print(f"Started: {datetime.now().isoformat()}")
    print("=" * 60)
    
    # ==================== HEALTH CHECKS ====================
    print("\n📍 HEALTH ENDPOINTS")
    test_endpoint("GET", "/health/ready")
    test_endpoint("GET", "/health/live")
    
    # ==================== AUTH ENDPOINTS ====================
    print("\n🔐 AUTHENTICATION ENDPOINTS")
    
    # Login as Freelancer
    login_data = {"email": "freelancer1@example.com", "password": "Test123!"}
    res, err = test_endpoint("POST", "/auth/login", data=login_data)
    freelancer_token = res.get("access_token") if res else None
    
    # Login as Client
    login_data = {"email": "client1@example.com", "password": "Test123!"}
    res, err = test_endpoint("POST", "/auth/login", data=login_data)
    client_token = res.get("access_token") if res else None
    
    # Login as Admin
    login_data = {"email": "admin@megilance.com", "password": "Test123!"}
    res, err = test_endpoint("POST", "/auth/login", data=login_data)
    admin_token = res.get("access_token") if res else None
    
    # Test /me endpoint
    test_endpoint("GET", "/auth/me", token=freelancer_token)
    test_endpoint("GET", "/auth/me", token=client_token)
    test_endpoint("GET", "/auth/me", token=admin_token)
    
    # ==================== USER ENDPOINTS ====================
    print("\n👤 USER ENDPOINTS")
    test_endpoint("GET", "/users", token=admin_token)
    test_endpoint("GET", "/users?limit=5", token=admin_token)
    test_endpoint("GET", "/users/1", token=admin_token)
    test_endpoint("GET", "/users/5", token=freelancer_token)  # Freelancer viewing own profile
    
    # ==================== PROJECT ENDPOINTS ====================
    print("\n📋 PROJECT ENDPOINTS")
    test_endpoint("GET", "/projects")
    test_endpoint("GET", "/projects?limit=10")
    test_endpoint("GET", "/projects?status=open")
    res, err = test_endpoint("GET", "/projects/1")
    
    # ==================== PROPOSAL ENDPOINTS ====================
    print("\n💼 PROPOSAL ENDPOINTS")
    test_endpoint("GET", "/proposals", token=freelancer_token)
    test_endpoint("GET", "/proposals/1", token=freelancer_token)
    
    # ==================== CONTRACT ENDPOINTS ====================
    print("\n📄 CONTRACT ENDPOINTS")
    test_endpoint("GET", "/contracts", token=freelancer_token)
    test_endpoint("GET", "/contracts", token=client_token)
    
    # ==================== MESSAGE ENDPOINTS ====================
    print("\n💬 MESSAGE ENDPOINTS")
    test_endpoint("GET", "/messages", token=freelancer_token)
    test_endpoint("GET", "/conversations", token=freelancer_token)
    
    # ==================== PAYMENT ENDPOINTS ====================
    print("\n💰 PAYMENT ENDPOINTS")
    test_endpoint("GET", "/payments", token=freelancer_token)
    test_endpoint("GET", "/payments/wallet", token=freelancer_token)
    
    # ==================== NOTIFICATION ENDPOINTS ====================
    print("\n🔔 NOTIFICATION ENDPOINTS")
    test_endpoint("GET", "/notifications", token=freelancer_token)
    
    # ==================== REVIEW ENDPOINTS ====================
    print("\n⭐ REVIEW ENDPOINTS")
    test_endpoint("GET", "/reviews", token=freelancer_token)
    
    # ==================== PORTFOLIO ENDPOINTS ====================
    print("\n🖼️ PORTFOLIO ENDPOINTS")
    test_endpoint("GET", "/portfolio", token=freelancer_token)
    
    # ==================== SKILL ENDPOINTS ====================
    print("\n🏷️ SKILL ENDPOINTS")
    test_endpoint("GET", "/skills")
    
    # ==================== CATEGORY ENDPOINTS ====================
    print("\n📁 CATEGORY ENDPOINTS")
    test_endpoint("GET", "/categories")
    
    # ==================== ANALYTICS ENDPOINTS ====================
    print("\n📊 ANALYTICS ENDPOINTS")
    test_endpoint("GET", "/analytics/freelancer", token=freelancer_token)
    test_endpoint("GET", "/analytics/client", token=client_token)
    
    # ==================== ADMIN ENDPOINTS ====================
    print("\n🔧 ADMIN ENDPOINTS")
    test_endpoint("GET", "/admin/stats", token=admin_token)
    test_endpoint("GET", "/admin/users", token=admin_token)
    
    # ==================== SEARCH ENDPOINTS ====================
    print("\n🔍 SEARCH ENDPOINTS")
    test_endpoint("GET", "/search/projects?q=web")
    test_endpoint("GET", "/search/freelancers?q=developer")
    
    # ==================== SUMMARY ====================
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for r in RESULTS if r["status"] == "PASS")
    failed = sum(1 for r in RESULTS if r["status"] == "FAIL")
    warnings = sum(1 for r in RESULTS if r["status"] == "WARN")
    
    print(f"✅ Passed: {passed}")
    print(f"❌ Failed: {failed}")
    print(f"⚠️ Warnings: {warnings}")
    print(f"Total: {len(RESULTS)}")
    
    # Save results
    with open("api_test_results.json", "w") as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "summary": {"passed": passed, "failed": failed, "warnings": warnings, "total": len(RESULTS)},
            "results": RESULTS
        }, f, indent=2)
    
    print(f"\nResults saved to api_test_results.json")
    
    return passed, failed

if __name__ == "__main__":
    main()
