#!/usr/bin/env python3
"""
Comprehensive AI Features Testing Script for FYP Evaluation
Tests all auto-detect and AI-powered features
"""
import requests
import json
from typing import Dict, Any

BASE_URL = "http://localhost:8000/api"
TEST_PASSWORD = "Password123"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'

def print_test(name: str):
    print(f"\n{Colors.BLUE}{'='*60}{Colors.RESET}")
    print(f"{Colors.BLUE}Testing: {name}{Colors.RESET}")
    print(f"{Colors.BLUE}{'='*60}{Colors.RESET}")

def print_success(msg: str):
    print(f"{Colors.GREEN}✓ {msg}{Colors.RESET}")

def print_error(msg: str):
    print(f"{Colors.RED}✗ {msg}{Colors.RESET}")

def print_info(msg: str):
    print(f"{Colors.YELLOW}ℹ {msg}{Colors.RESET}")

def login(email: str, password: str = TEST_PASSWORD) -> Dict[str, str]:
    """Login and return headers with auth token"""
    response = requests.post(
        f"{BASE_URL}/auth/login",
        json={"email": email, "password": password}
    )
    if response.status_code == 200:
        token = response.json()["access_token"]
        print_success(f"Logged in as {email}")
        return {"Authorization": f"Bearer {token}"}
    else:
        print_error(f"Login failed: {response.status_code}")
        print_error(response.text)
        return {}

def test_ai_matching():
    """Test AI-powered project-freelancer matching"""
    print_test("AI Matching Engine")
    
    # Login as client
    client_headers = login("client@demo.com")
    if not client_headers:
        return
    
    # Get projects
    response = requests.get(f"{BASE_URL}/projects/", headers=client_headers)
    if response.status_code == 200:
        projects = response.json()
        print_success(f"Found {len(projects)} projects")
        
        if projects:
            project_id = projects[0].get('id')
            print_info(f"Testing matching for project ID: {project_id}")
            
            # Test freelancer recommendations
            match_response = requests.get(
                f"{BASE_URL}/matching/freelancers/{project_id}",
                headers=client_headers
            )
            
            if match_response.status_code == 200:
                matches = match_response.json()
                print_success(f"AI Matching returned {matches.get('total', 0)} freelancers")
                
                if matches.get('recommendations'):
                    for idx, match in enumerate(matches['recommendations'][:3], 1):
                        score = match.get('match_score', 0)
                        name = match.get('freelancer_name', 'Unknown')
                        print_info(f"  {idx}. {name} - Match Score: {score:.2%}")
                else:
                    print_info("No recommendations found")
            else:
                print_error(f"Matching API error: {match_response.status_code}")
                print_error(match_response.text)
    else:
        print_error(f"Failed to get projects: {response.status_code}")

def test_skill_extraction():
    """Test NLP-based skill extraction"""
    print_test("Skill Extraction (NLP)")
    
    client_headers = login("client@demo.com")
    if not client_headers:
        return
    
    test_text = """
    We need a full-stack developer proficient in React, Node.js, and PostgreSQL.
    Experience with TypeScript, Docker, and AWS is required.
    Knowledge of GraphQL and Redis would be a plus.
    """
    
    try:
        response = requests.post(
            f"{BASE_URL}/ai-advanced/extract-skills",
            headers=client_headers,
            json={"text": test_text}
        )
        
        if response.status_code == 200:
            result = response.json()
            skills = result.get('skills', [])
            print_success(f"Extracted {len(skills)} skills from text")
            for skill in skills[:10]:
                print_info(f"  • {skill.get('name')} (confidence: {skill.get('confidence', 0):.2%})")
        else:
            print_error(f"Skill extraction failed: {response.status_code}")
            print_error(response.text[:200])
    except Exception as e:
        print_error(f"Exception: {str(e)}")

def test_project_categorization():
    """Test automatic project categorization"""
    print_test("Project Auto-Categorization")
    
    client_headers = login("client@demo.com")
    if not client_headers:
        return
    
    test_description = """
    Looking for a UI/UX designer to create a modern mobile app interface.
    The app is for iOS and Android. Need wireframes, mockups, and prototypes.
    Experience with Figma and Adobe XD required.
    """
    
    try:
        response = requests.post(
            f"{BASE_URL}/ai-advanced/categorize-project",
            headers=client_headers,
            json={"description": test_description, "title": "Mobile App UI/UX Design"}
        )
        
        if response.status_code == 200:
            result = response.json()
            print_success(f"Category: {result.get('category', 'Unknown')}")
            print_info(f"Confidence: {result.get('confidence', 0):.2%}")
            print_info(f"Subcategories: {', '.join(result.get('subcategories', []))}")
        else:
            print_error(f"Categorization failed: {response.status_code}")
    except Exception as e:
        print_error(f"Exception: {str(e)}")

def test_fraud_detection():
    """Test fraud detection system"""
    print_test("Fraud Detection")
    
    client_headers = login("client@demo.com")
    if not client_headers:
        return
    
    # Get a project to test
    response = requests.get(f"{BASE_URL}/projects/", headers=client_headers)
    if response.status_code == 200:
        projects = response.json()
        if projects:
            project_id = projects[0].get('id')
            
            try:
                fraud_response = requests.post(
                    f"{BASE_URL}/ai-advanced/detect-fraud",
                    headers=client_headers,
                    json={"project_id": project_id}
                )
                
                if fraud_response.status_code == 200:
                    result = fraud_response.json()
                    is_fraud = result.get('is_fraud', False)
                    confidence = result.get('confidence', 0)
                    
                    if is_fraud:
                        print_error(f"⚠ Fraud detected! Confidence: {confidence:.2%}")
                    else:
                        print_success(f"✓ Legitimate project (confidence: {confidence:.2%})")
                    
                    factors = result.get('fraud_factors', {})
                    for factor, score in factors.items():
                        print_info(f"  {factor}: {score:.2%}")
                else:
                    print_error(f"Fraud detection failed: {fraud_response.status_code}")
            except Exception as e:
                print_error(f"Exception: {str(e)}")

def test_smart_recommendations():
    """Test personalized project recommendations for freelancers"""
    print_test("Smart Recommendations")
    
    freelancer_headers = login("freelancer@demo.com")
    if not freelancer_headers:
        return
    
    try:
        response = requests.get(
            f"{BASE_URL}/matching/projects/recommended",
            headers=freelancer_headers
        )
        
        if response.status_code == 200:
            result = response.json()
            recommendations = result.get('recommendations', [])
            print_success(f"Found {len(recommendations)} recommended projects")
            
            for idx, rec in enumerate(recommendations[:3], 1):
                title = rec.get('project_title', 'Unknown')
                score = rec.get('match_score', 0)
                print_info(f"  {idx}. {title} - Match: {score:.2%}")
        else:
            print_error(f"Recommendations failed: {response.status_code}")
            print_error(response.text[:200])
    except Exception as e:
        print_error(f"Exception: {str(e)}")

def test_ai_writing_assistant():
    """Test AI writing assistant features"""
    print_test("AI Writing Assistant")
    
    freelancer_headers = login("freelancer@demo.com")
    if not freelancer_headers:
        return
    
    try:
        # Test proposal generation
        response = requests.post(
            f"{BASE_URL}/ai-writing/generate-proposal",
            headers=freelancer_headers,
            json={
                "project_description": "Build a React e-commerce website",
                "freelancer_experience": "5 years of React development",
                "tone": "professional"
            }
        )
        
        if response.status_code == 200:
            result = response.json()
            proposal = result.get('proposal', '')
            print_success(f"Generated proposal ({len(proposal)} characters)")
            print_info(f"Preview: {proposal[:150]}...")
        else:
            print_error(f"AI writing failed: {response.status_code}")
    except Exception as e:
        print_error(f"Exception: {str(e)}")

def test_quality_assessment():
    """Test quality assessment features"""
    print_test("Quality Assessment")
    
    freelancer_headers = login("freelancer@demo.com")
    if not freelancer_headers:
        return
    
    test_code = """
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)
    """
    
    try:
        response = requests.post(
            f"{BASE_URL}/ai-advanced/assess-quality",
            headers=freelancer_headers,
            json={"content": test_code, "content_type": "code"}
        )
        
        if response.status_code == 200:
            result = response.json()
            score = result.get('quality_score', 0)
            print_success(f"Quality Score: {score:.2%}")
            
            feedback = result.get('feedback', [])
            for item in feedback[:5]:
                print_info(f"  • {item}")
        else:
            print_error(f"Quality assessment failed: {response.status_code}")
    except Exception as e:
        print_error(f"Exception: {str(e)}")

def main():
    """Run all AI feature tests"""
    print(f"\n{Colors.GREEN}{'='*60}{Colors.RESET}")
    print(f"{Colors.GREEN}MegiLance AI Features Test Suite - FYP Evaluation{Colors.RESET}")
    print(f"{Colors.GREEN}{'='*60}{Colors.RESET}")
    
    # Test all features
    test_ai_matching()
    test_skill_extraction()
    test_project_categorization()
    test_fraud_detection()
    test_smart_recommendations()
    test_ai_writing_assistant()
    test_quality_assessment()
    
    print(f"\n{Colors.GREEN}{'='*60}{Colors.RESET}")
    print(f"{Colors.GREEN}Test Suite Complete!{Colors.RESET}")
    print(f"{Colors.GREEN}{'='*60}{Colors.RESET}\n")

if __name__ == "__main__":
    main()
