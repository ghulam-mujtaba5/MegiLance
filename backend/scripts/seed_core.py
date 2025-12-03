# @AI-HINT: Core seed data for essential tables
"""
Seed data script for Users, Skills, Projects, Proposals, Contracts, and Payments
Run this script BEFORE seed_new_features.py
"""

from sqlalchemy.orm import Session
from app.db.session import get_session_local
from app.models import (
    User, Skill, Project, Proposal, Contract, Payment, Milestone, Conversation, Message
)
from app.core.security import get_password_hash
from datetime import datetime, timedelta
import random

def seed_users(db: Session):
    """Create initial users"""
    print("Seeding users...")
    
    # Admin
    admin = db.query(User).filter(User.email == "admin@megilance.com").first()
    if not admin:
        admin = User(
            email="admin@megilance.com",
            hashed_password=get_password_hash("admin123"),
            first_name="Admin",
            last_name="User",
            name="Admin User",
            user_type="admin",
            is_active=True,
            is_verified=True,
            joined_at=datetime.utcnow(),
            account_balance=0.0
        )
        db.add(admin)
    
    # Client
    client = db.query(User).filter(User.email == "client@example.com").first()
    if not client:
        client = User(
            email="client@example.com",
            hashed_password=get_password_hash("client123"),
            first_name="John",
            last_name="Client",
            name="John Client",
            user_type="client",
            is_active=True,
            is_verified=True,
            joined_at=datetime.utcnow(),
            account_balance=5000.0,
            location="New York, USA",
            bio="Tech entrepreneur looking for talent."
        )
        db.add(client)
        
    # Freelancer
    freelancer = db.query(User).filter(User.email == "freelancer@example.com").first()
    if not freelancer:
        freelancer = User(
            email="freelancer@example.com",
            hashed_password=get_password_hash("freelancer123"),
            first_name="Jane",
            last_name="Dev",
            name="Jane Dev",
            user_type="freelancer",
            is_active=True,
            is_verified=True,
            joined_at=datetime.utcnow(),
            account_balance=150.0,
            hourly_rate=50.0,
            location="London, UK",
            bio="Full stack developer with 5 years of experience."
        )
        db.add(freelancer)
    
    db.commit()
    print("✅ Users seeded")

def seed_skills(db: Session):
    """Create initial skills"""
    print("Seeding skills...")
    
    skills_list = [
        {"name": "Python", "category": "Backend"},
        {"name": "React", "category": "Frontend"},
        {"name": "FastAPI", "category": "Backend"},
        {"name": "PostgreSQL", "category": "Database"},
        {"name": "Docker", "category": "DevOps"},
        {"name": "AWS", "category": "Cloud"},
        {"name": "TypeScript", "category": "Frontend"},
        {"name": "Next.js", "category": "Frontend"},
    ]
    
    for skill_data in skills_list:
        skill = db.query(Skill).filter(Skill.name == skill_data["name"]).first()
        if not skill:
            skill = Skill(
                name=skill_data["name"],
                category=skill_data["category"],
                is_active=True,
                sort_order=0
            )
            db.add(skill)
            
    db.commit()
    print("✅ Skills seeded")

def seed_projects(db: Session):
    """Create initial projects"""
    print("Seeding projects...")
    
    client = db.query(User).filter(User.email == "client@example.com").first()
    if not client:
        print("⚠️ Client not found, skipping projects")
        return

    projects_data = [
        {
            "title": "E-commerce Platform",
            "description": "Build a full-featured e-commerce platform using Next.js and FastAPI.",
            "category": "Web Development",
            "budget_type": "fixed",
            "budget_min": 3000.0,
            "budget_max": 5000.0,
            "experience_level": "expert",
            "estimated_duration": "3-6 months",
            "skills": "React, FastAPI, PostgreSQL",
            "status": "open"
        },
        {
            "title": "Mobile App MVP",
            "description": "Create an MVP for a social networking app.",
            "category": "Mobile Development",
            "budget_type": "hourly",
            "budget_min": 40.0,
            "budget_max": 80.0,
            "experience_level": "intermediate",
            "estimated_duration": "1-3 months",
            "skills": "React Native, Firebase",
            "status": "open"
        }
    ]
    
    for p_data in projects_data:
        project = db.query(Project).filter(Project.title == p_data["title"]).first()
        if not project:
            project = Project(
                client_id=client.id,
                **p_data
            )
            db.add(project)
            
    db.commit()
    print("✅ Projects seeded")

def seed_proposals(db: Session):
    """Create initial proposals"""
    print("Seeding proposals...")
    
    freelancer = db.query(User).filter(User.email == "freelancer@example.com").first()
    project = db.query(Project).first()
    
    if not freelancer or not project:
        print("⚠️ Freelancer or Project not found, skipping proposals")
        return
        
    proposal = db.query(Proposal).filter(Proposal.project_id == project.id, Proposal.freelancer_id == freelancer.id).first()
    if not proposal:
        proposal = Proposal(
            project_id=project.id,
            freelancer_id=freelancer.id,
            cover_letter="I am the perfect fit for this project. I have extensive experience with the required stack.",
            estimated_hours=100,
            bid_amount=5000.0,
            hourly_rate=50.0,
            availability="immediate",
            status="submitted"
        )
        db.add(proposal)
        
    db.commit()
    print("✅ Proposals seeded")

def seed_contracts(db: Session):
    """Create initial contracts"""
    print("Seeding contracts...")
    
    client = db.query(User).filter(User.email == "client@example.com").first()
    freelancer = db.query(User).filter(User.email == "freelancer@example.com").first()
    project = db.query(Project).first()
    proposal = db.query(Proposal).first()
    
    if not client or not freelancer or not project or not proposal:
        print("⚠️ Dependencies missing, skipping contracts")
        return
        
    contract = db.query(Contract).filter(Contract.project_id == project.id).first()
    if not contract:
        contract = Contract(
            project_id=project.id,
            freelancer_id=freelancer.id,
            client_id=client.id,
            winning_bid_id=proposal.id,
            amount=4000.0,
            contract_amount=4000.0,
            platform_fee=400.0,
            status="active",
            start_date=datetime.utcnow(),
            description="Contract for E-commerce Platform",
            terms="Standard terms apply."
        )
        db.add(contract)
        db.flush() # Get ID
        
        # Add milestones
        milestone1 = Milestone(
            contract_id=contract.id,
            title="Phase 1: Design",
            description="Complete UI/UX design",
            amount=1000.0,
            due_date=datetime.utcnow() + timedelta(days=14),
            status="pending",
            order_index=1
        )
        db.add(milestone1)
        
    db.commit()
    print("✅ Contracts seeded")

def main():
    """Main seed function"""
    print("\n🌱 Starting core database seeding...\n")
    
    SessionLocal = get_session_local()
    db = SessionLocal()
    try:
        seed_users(db)
        seed_skills(db)
        seed_projects(db)
        seed_proposals(db)
        seed_contracts(db)
        
        print("\n✅ Core database seeding completed successfully!\n")
        
    except Exception as e:
        print(f"\n❌ Error during seeding: {str(e)}\n")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    main()
