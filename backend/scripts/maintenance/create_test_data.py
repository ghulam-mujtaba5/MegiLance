"""
Create comprehensive test data for testing new API endpoints
This script creates contracts, projects, and other required test data.
"""
import sys
sys.path.insert(0, '/app')

import json
from datetime import datetime, timedelta
from app.db.session import SessionLocal
from app.models import User, Project, Contract, Tag
from app.core.security import get_password_hash

db = SessionLocal()

try:
    print("🧪 Creating test data for API testing...\n")
    
    # Get or create test users
    print("1️⃣ Setting up test users...")
    client = db.query(User).filter(User.email == "client@example.com").first()
    if not client:
        client = User(
            email="client@example.com",
            name="Test Client",
            hashed_password=get_password_hash("password123"),
            role="client",
            is_active=True,
            account_balance=10000.00
        )
        db.add(client)
        db.commit()
        print("   ✅ Created test client")
    else:
        # Ensure client has balance
        if client.account_balance < 1000:
            client.account_balance = 10000.00
            db.commit()
        print("   ✅ Using existing client")
    
    freelancer = db.query(User).filter(User.email == "freelancer@example.com").first()
    if not freelancer:
        freelancer = User(
            email="freelancer@example.com",
            name="Test Freelancer",
            hashed_password=get_password_hash("password123"),
            role="freelancer",
            is_active=True,
            hourly_rate=50.00
        )
        db.add(freelancer)
        db.commit()
        print("   ✅ Created test freelancer")
    else:
        # Ensure freelancer has hourly rate
        if not freelancer.hourly_rate:
            freelancer.hourly_rate = 50.00
            db.commit()
        print("   ✅ Using existing freelancer")
    
    # Create test project
    print("\n2️⃣ Creating test project...")
    project = db.query(Project).filter(Project.client_id == client.id).first()
    if not project:
        project = Project(
            title="Test Project for API Testing",
            description="This is a test project for validating new API endpoints",
            category="Web Development",
            budget_type="hourly",
            budget_min=40.00,
            budget_max=60.00,
            skills=json.dumps(["Python", "FastAPI", "Turso", "libSQL"]),  # Updated skill set (legacy Oracle removed)
            status="open",
            client_id=client.id,
            experience_level="intermediate"
        )
        db.add(project)
        db.commit()
        print(f"   ✅ Created project ID: {project.id}")
    else:
        print(f"   ✅ Using existing project ID: {project.id}")
    
    # Create test contract
    print("\n3️⃣ Creating test contract...")
    contract = db.query(Contract).filter(
        Contract.project_id == project.id,
        Contract.freelancer_id == freelancer.id
    ).first()
    
    if not contract:
        contract = Contract(
            project_id=project.id,
            client_id=client.id,
            freelancer_id=freelancer.id,
            title="Test Contract for API Testing",
            description="Test contract for validating time tracking, invoices, and escrow APIs",
            budget=5000.00,
            payment_type="hourly",
            hourly_rate=50.00,
            status="active",
            start_date=datetime.utcnow(),
            end_date=datetime.utcnow() + timedelta(days=30)
        )
        db.add(contract)
        db.commit()
        print(f"   ✅ Created contract ID: {contract.id}")
    else:
        # Make sure contract is active
        if contract.status != "active":
            contract.status = "active"
            db.commit()
        print(f"   ✅ Using existing contract ID: {contract.id}")
    
    # Fix invalid tags
    print("\n4️⃣ Fixing invalid tags...")
    invalid_tags = db.query(Tag).filter(
        ~Tag.type.in_(['skill', 'priority', 'location', 'budget', 'general'])
    ).all()
    
    if invalid_tags:
        for tag in invalid_tags:
            print(f"   - Fixing '{tag.name}': {tag.type} → general")
            tag.type = 'general'
        db.commit()
        print(f"   ✅ Fixed {len(invalid_tags)} tags")
    else:
        print("   ✅ All tags have valid types")
    
    # Summary
    print("\n" + "="*60)
    print("📊 TEST DATA SUMMARY")
    print("="*60)
    print(f"Client ID:      {client.id} ({client.email})")
    print(f"Client Balance: ${client.account_balance:.2f}")
    print(f"Freelancer ID:  {freelancer.id} ({freelancer.email})")
    print(f"Hourly Rate:    ${freelancer.hourly_rate:.2f}/hour")
    print(f"Project ID:     {project.id}")
    print(f"Contract ID:    {contract.id}")
    print(f"Contract Status:{contract.status}")
    print("="*60)
    
    print("\n✅ Test data creation complete!")
    print("\n🚀 You can now run: .\\test-new-apis.ps1")
    
    # Update test script with correct IDs
    print(f"\n💡 Update test script with these IDs:")
    print(f"   CONTRACT_ID = {contract.id}")
    print(f"   PROJECT_ID = {project.id}")
    print(f"   CLIENT_ID = {client.id}")
    print(f"   FREELANCER_ID = {freelancer.id}")
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
    db.rollback()
finally:
    db.close()
