#!/usr/bin/env python3
"""
Test all API endpoints with populated data - Windows compatible version
"""
import requests
import json
import sys
import io

# Force UTF-8 encoding for Windows console
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

BASE_URL = "http://localhost:8000/api"

def test_health():
    """Test health endpoints"""
    print("\n[HEALTH] Testing Health Endpoints...")
    try:
        response = requests.get(f"{BASE_URL}/health/live")
        print(f"  /health/live: {response.status_code} - {response.json()}")
        
        response = requests.get(f"{BASE_URL}/health/ready")
        print(f"  /health/ready: {response.status_code} - {response.json()}")
        return True
    except Exception as e:
        print(f"  ERROR: {e}")
        return False

def test_auth():
    """Test authentication endpoints"""
    print("\n[AUTH] Testing Authentication...")
    
    try:
        # Login as client
        response = requests.post(f"{BASE_URL}/auth/login", json={
            "email": "client1@example.com",
            "password": "password123"
        })
        print(f"  Client Login: {response.status_code}")
        if response.status_code != 200:
            print(f"    ERROR: {response.text}")
            return None, None
            
        client_data = response.json()
        print(f"    User: {client_data['user']['name']} ({client_data['user']['user_type']})")
        
        # Login as freelancer
        response = requests.post(f"{BASE_URL}/auth/login", json={
            "email": "freelancer1@example.com",
            "password": "password123"
        })
        print(f"  Freelancer Login: {response.status_code}")
        if response.status_code != 200:
            print(f"    ERROR: {response.text}")
            return None, None
            
        freelancer_data = response.json()
        print(f"    User: {freelancer_data['user']['name']} ({freelancer_data['user']['user_type']})")
        
        return client_data['access_token'], freelancer_data['access_token']
    except Exception as e:
        print(f"  ERROR: {e}")
        return None, None

def test_projects(token):
    """Test project endpoints"""
    print("\n[PROJECTS] Testing Project Endpoints...")
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        # Get all projects
        response = requests.get(f"{BASE_URL}/projects", headers=headers)
        print(f"  GET /projects: {response.status_code}")
        if response.status_code == 200:
            projects = response.json()
            print(f"    Found {len(projects)} projects")
            if projects:
                print(f"    Sample: {projects[0]['title']}")
        else:
            print(f"    ERROR: {response.text}")
        return response.status_code == 200
    except Exception as e:
        print(f"  ERROR: {e}")
        return False

def test_proposals(token):
    """Test proposal endpoints"""
    print("\n[PROPOSALS] Testing Proposal Endpoints...")
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        # Get all proposals
        response = requests.get(f"{BASE_URL}/proposals", headers=headers)
        print(f"  GET /proposals: {response.status_code}")
        if response.status_code == 200:
            proposals = response.json()
            print(f"    Found {len(proposals)} proposals")
        else:
            print(f"    ERROR: {response.text}")
        return response.status_code == 200
    except Exception as e:
        print(f"  ERROR: {e}")
        return False

def test_contracts(token):
    """Test contract endpoints"""
    print("\n[CONTRACTS] Testing Contract Endpoints...")
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        # Get all contracts
        response = requests.get(f"{BASE_URL}/contracts", headers=headers)
        print(f"  GET /contracts: {response.status_code}")
        if response.status_code == 200:
            contracts = response.json()
            print(f"    Found {len(contracts)} contracts")
        else:
            print(f"    ERROR: {response.text}")
        return response.status_code == 200
    except Exception as e:
        print(f"  ERROR: {e}")
        return False

def test_payments(token):
    """Test payment endpoints"""
    print("\n[PAYMENTS] Testing Payment Endpoints...")
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        # Get all payments
        response = requests.get(f"{BASE_URL}/payments", headers=headers)
        print(f"  GET /payments: {response.status_code}")
        if response.status_code == 200:
            payments = response.json()
            print(f"    Found {len(payments)} payments")
        else:
            print(f"    ERROR: {response.text}")
        return response.status_code == 200
    except Exception as e:
        print(f"  ERROR: {e}")
        return False

def test_skills():
    """Test skills endpoints"""
    print("\n[SKILLS] Testing Skills Endpoints...")
    
    try:
        # Get all skills
        response = requests.get(f"{BASE_URL}/skills")
        print(f"  GET /skills: {response.status_code}")
        if response.status_code == 200:
            skills = response.json()
            print(f"    Found {len(skills)} skills")
            if skills:
                print(f"    Categories: {set([s.get('category', 'N/A') for s in skills])}")
        else:
            print(f"    ERROR: {response.text}")
        return response.status_code == 200
    except Exception as e:
        print(f"  ERROR: {e}")
        return False

def main():
    print("="*80)
    print("API ENDPOINT TESTING")
    print("="*80)
    
    results = {"passed": 0, "failed": 0}
    
    # Test health
    if test_health():
        results["passed"] += 1
    else:
        results["failed"] += 1
    
    # Test auth and get tokens
    client_token, freelancer_token = test_auth()
    if client_token and freelancer_token:
        results["passed"] += 1
    else:
        results["failed"] += 1
        print("\n[ERROR] Authentication failed. Cannot continue with protected endpoints.")
        return
    
    # Test protected endpoints
    tests = [
        (test_projects, client_token),
        (test_proposals, freelancer_token),
        (test_contracts, client_token),
        (test_payments, client_token),
        (test_skills, None)
    ]
    
    for test_func, token in tests:
        if token is not None:
            success = test_func(token)
        else:
            success = test_func()
        
        if success:
            results["passed"] += 1
        else:
            results["failed"] += 1
    
    # Print summary
    print("\n" + "="*80)
    print("SUMMARY")
    print("="*80)
    print(f"[PASS] Passed: {results['passed']}")
    print(f"[FAIL] Failed: {results['failed']}")
    print("="*80)

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"\n[ERROR] Fatal error during testing: {e}")
        import traceback
        traceback.print_exc()
