#!/usr/bin/env python3
"""
Test all API endpoints with populated data
"""
import requests
import json

BASE_URL = "http://localhost:8000/api"

def test_health():
    """Test health endpoints"""
    print("\n🏥 Testing Health Endpoints...")
    response = requests.get(f"{BASE_URL}/health/live")
    print(f"  /health/live: {response.status_code} - {response.json()}")
    
    response = requests.get(f"{BASE_URL}/health/ready")
    print(f"  /health/ready: {response.status_code} - {response.json()}")

def test_auth():
    """Test authentication endpoints"""
    print("\n🔐 Testing Auth Endpoints...")
    
    # Login as client
    response = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "john.client@example.com",
        "password": "password123"
    })
    print(f"  Client Login: {response.status_code}")
    client_data = response.json()
    print(f"    User: {client_data['user']['name']} ({client_data['user']['user_type']})")
    
    # Login as freelancer
    response = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "alex.dev@example.com",
        "password": "password123"
    })
    print(f"  Freelancer Login: {response.status_code}")
    freelancer_data = response.json()
    print(f"    User: {freelancer_data['user']['name']} ({freelancer_data['user']['user_type']})")
    
    return client_data['access_token'], freelancer_data['access_token']

def test_projects(token):
    """Test project endpoints"""
    print("\n📋 Testing Project Endpoints...")
    headers = {"Authorization": f"Bearer {token}"}
    
    # Get all projects
    response = requests.get(f"{BASE_URL}/projects", headers=headers)
    print(f"  GET /projects: {response.status_code}")
    if response.status_code == 200:
        projects = response.json()
        print(f"    Total projects: {len(projects) if isinstance(projects, list) else 'N/A'}")
        if isinstance(projects, list) and len(projects) > 0:
            proj = projects[0]
            print(f"    Sample: {proj.get('title', 'N/A')[:50]}...")
    else:
        print(f"    Response: {response.text[:200]}")

def test_proposals(token):
    """Test proposal endpoints"""
    print("\n📝 Testing Proposal Endpoints...")
    headers = {"Authorization": f"Bearer {token}"}
    
    # Try to get proposals
    response = requests.get(f"{BASE_URL}/proposals", headers=headers)
    print(f"  GET /proposals: {response.status_code}")
    if response.status_code == 200:
        proposals = response.json()
        print(f"    Total proposals: {len(proposals) if isinstance(proposals, list) else 'N/A'}")
    else:
        print(f"    Response: {response.text[:200]}")

def test_contracts(token):
    """Test contract endpoints"""
    print("\n📄 Testing Contract Endpoints...")
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(f"{BASE_URL}/contracts", headers=headers)
    print(f"  GET /contracts: {response.status_code}")
    if response.status_code == 200:
        contracts = response.json()
        print(f"    Total contracts: {len(contracts) if isinstance(contracts, list) else 'N/A'}")
    else:
        print(f"    Response: {response.text[:200]}")

def test_payments(token):
    """Test payment endpoints"""
    print("\n💰 Testing Payment Endpoints...")
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(f"{BASE_URL}/payments", headers=headers)
    print(f"  GET /payments: {response.status_code}")
    if response.status_code == 200:
        payments = response.json()
        print(f"    Total payments: {len(payments) if isinstance(payments, list) else 'N/A'}")
    else:
        print(f"    Response: {response.text[:200]}")

def test_skills(token):
    """Test skills endpoints"""
    print("\n🎯 Testing Skills Endpoints...")
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(f"{BASE_URL}/skills", headers=headers)
    print(f"  GET /skills: {response.status_code}")
    if response.status_code == 200:
        skills = response.json()
        print(f"    Total skills: {len(skills) if isinstance(skills, list) else 'N/A'}")
        if isinstance(skills, list) and len(skills) > 0:
            print(f"    Sample skills: {', '.join([s.get('name', 'N/A') for s in skills[:5]])}")
    else:
        print(f"    Response: {response.text[:200]}")

if __name__ == "__main__":
    print("=" * 80)
    print("API ENDPOINT TESTING")
    print("=" * 80)
    
    try:
        # Test health
        test_health()
        
        # Test auth and get tokens
        client_token, freelancer_token = test_auth()
        
        # Test endpoints with tokens
        test_projects(client_token)
        test_proposals(freelancer_token)
        test_contracts(client_token)
        test_payments(freelancer_token)
        test_skills(client_token)
        
        print("\n" + "=" * 80)
        print("✅ API TESTING COMPLETE")
        print("=" * 80)
except Exception as e:
    print(f"\n[ERROR] Error during testing: {e}")
    import traceback
    traceback.print_exc()