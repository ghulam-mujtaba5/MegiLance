#!/usr/bin/env python3
"""
Seed the local_dev.db with realistic demo data for all portals
"""
import sqlite3
import hashlib
import os
from datetime import datetime, timedelta
import random

# Use the correct database
DB_PATH = os.path.join(os.path.dirname(__file__), "backend", "local_dev.db")

def hash_password(password: str) -> str:
    """Simple hash for demo purposes"""
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    return pwd_context.hash(password)

def main():
    print(f"Seeding database: {DB_PATH}")
    
    if not os.path.exists(DB_PATH):
        print(f"ERROR: Database not found at {DB_PATH}")
        return
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Check current counts
    cursor.execute("SELECT COUNT(*) FROM users")
    user_count = cursor.fetchone()[0]
    print(f"Current users: {user_count}")
    
    if user_count < 10:
        print("Adding demo users...")
        
        # Hash password once
        password_hash = hash_password("Demo123!")
        
        # Demo users with different roles
        demo_users = [
            # Clients
            ("client1@demo.com", password_hash, "Alice", "Johnson", "client", "Technology company CEO looking for talent", True),
            ("client2@demo.com", password_hash, "Bob", "Smith", "client", "Startup founder seeking developers", True),
            ("client3@demo.com", password_hash, "Carol", "Williams", "client", "Marketing agency director", True),
            # Freelancers
            ("freelancer1@demo.com", password_hash, "David", "Brown", "freelancer", "Full-stack developer with 8 years experience", True),
            ("freelancer2@demo.com", password_hash, "Emma", "Davis", "freelancer", "UI/UX designer specializing in mobile apps", True),
            ("freelancer3@demo.com", password_hash, "Frank", "Miller", "freelancer", "DevOps engineer and cloud architect", True),
            ("freelancer4@demo.com", password_hash, "Grace", "Wilson", "freelancer", "Data scientist and ML engineer", True),
            ("freelancer5@demo.com", password_hash, "Henry", "Taylor", "freelancer", "Backend developer, Python expert", True),
            # Admin
            ("admin@demo.com", password_hash, "Admin", "User", "admin", "Platform administrator", True),
        ]
        
        for email, pwd, first, last, role, bio, verified in demo_users:
            cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
            if not cursor.fetchone():
                cursor.execute("""
                    INSERT INTO users (email, hashed_password, first_name, last_name, role, bio, is_active, is_verified, email_verified, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, datetime('now'), datetime('now'))
                """, (email, pwd, first, last, role, bio, verified, verified))
                print(f"  Added user: {email} ({role})")
        
        conn.commit()
    
    # Get user IDs
    cursor.execute("SELECT id, email, role FROM users")
    users = cursor.fetchall()
    user_map = {row[1]: {"id": row[0], "role": row[2]} for row in users}
    
    clients = [u for u in users if u[2] == "client"]
    freelancers = [u for u in users if u[2] == "freelancer"]
    
    print(f"Clients: {len(clients)}, Freelancers: {len(freelancers)}")
    
    # Check projects
    cursor.execute("SELECT COUNT(*) FROM projects")
    project_count = cursor.fetchone()[0]
    
    if project_count < 10 and clients:
        print("Adding demo projects...")
        
        projects_data = [
            ("E-commerce Platform Development", "Build a complete e-commerce platform with React and Node.js", 5000, 15000, "open", "React,Node.js,MongoDB,Stripe"),
            ("Mobile App UI/UX Design", "Design a modern mobile app for iOS and Android", 2000, 5000, "open", "Figma,UI/UX,Mobile Design"),
            ("Data Analytics Dashboard", "Create a real-time analytics dashboard with Python", 3000, 8000, "open", "Python,Pandas,Plotly,SQL"),
            ("Cloud Infrastructure Setup", "Set up AWS infrastructure with Terraform", 4000, 10000, "open", "AWS,Terraform,Docker,Kubernetes"),
            ("Machine Learning Model", "Build a recommendation system using ML", 6000, 12000, "open", "Python,TensorFlow,Scikit-learn"),
            ("WordPress Website", "Create a professional business website", 1000, 3000, "open", "WordPress,PHP,CSS"),
            ("API Development", "Build RESTful APIs for mobile app", 3000, 7000, "in_progress", "Python,FastAPI,PostgreSQL"),
            ("Logo and Brand Design", "Complete brand identity design", 500, 2000, "open", "Illustrator,Photoshop,Branding"),
            ("SEO Optimization", "Improve website SEO and rankings", 1000, 3000, "completed", "SEO,Google Analytics,Content"),
            ("Video Editing", "Edit promotional videos for marketing", 800, 2500, "open", "Premiere Pro,After Effects"),
        ]
        
        for title, desc, budget_min, budget_max, status, skills in projects_data:
            client = random.choice(clients)
            cursor.execute("SELECT id FROM projects WHERE title = ?", (title,))
            if not cursor.fetchone():
                cursor.execute("""
                    INSERT INTO projects (client_id, title, description, budget_min, budget_max, status, skills, category, budget_type, experience_level, estimated_duration, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, 'Technology', 'fixed', 'intermediate', '1-3 months', datetime('now'), datetime('now'))
                """, (client[0], title, desc, budget_min, budget_max, status, skills))
                print(f"  Added project: {title}")
        
        conn.commit()
    
    # Get project IDs
    cursor.execute("SELECT id, client_id, title, status FROM projects")
    projects = cursor.fetchall()
    
    # Check proposals
    cursor.execute("SELECT COUNT(*) FROM proposals")
    proposal_count = cursor.fetchone()[0]
    
    if proposal_count < 15 and projects and freelancers:
        print("Adding demo proposals...")
        
        proposal_texts = [
            "I have extensive experience with similar projects and can deliver high-quality work on time.",
            "As a specialist in this area, I can bring innovative solutions to your project.",
            "I've reviewed your requirements carefully and am confident I can exceed your expectations.",
            "My portfolio demonstrates expertise in exactly what you're looking for.",
            "I can start immediately and maintain clear communication throughout the project.",
        ]
        
        for project in projects[:7]:  # Add proposals to first 7 projects
            for _ in range(random.randint(2, 4)):
                freelancer = random.choice(freelancers)
                cursor.execute("SELECT id FROM proposals WHERE project_id = ? AND freelancer_id = ?", (project[0], freelancer[0]))
                if not cursor.fetchone():
                    bid = random.randint(1000, 8000)
                    status = random.choice(["pending", "pending", "pending", "accepted", "rejected"])
                    cursor.execute("""
                        INSERT INTO proposals (project_id, freelancer_id, cover_letter, proposed_rate, status, created_at, updated_at)
                        VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
                    """, (project[0], freelancer[0], random.choice(proposal_texts), bid, status))
        
        conn.commit()
        print(f"  Added proposals")
    
    # Check contracts
    cursor.execute("SELECT COUNT(*) FROM contracts")
    contract_count = cursor.fetchone()[0]
    
    if contract_count < 5 and projects and freelancers:
        print("Adding demo contracts...")
        
        for project in projects[:3]:  # Create contracts for first 3 projects
            freelancer = random.choice(freelancers)
            cursor.execute("SELECT id FROM contracts WHERE project_id = ?", (project[0],))
            if not cursor.fetchone():
                amount = random.randint(2000, 10000)
                platform_fee = amount * 0.1  # 10% fee
                status = random.choice(["active", "active", "completed"])
                cursor.execute("""
                    INSERT INTO contracts (project_id, client_id, freelancer_id, amount, contract_amount, platform_fee, contract_type, currency, status, terms, start_date, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, 'fixed', 'USD', ?, 'Standard contract terms apply', datetime('now', '-30 days'), datetime('now'), datetime('now'))
                """, (project[0], project[1], freelancer[0], amount, amount, platform_fee, status))
                print(f"  Added contract for project {project[0]}")
        
        conn.commit()
    
    # Check payments
    cursor.execute("SELECT COUNT(*) FROM payments")
    payment_count = cursor.fetchone()[0]
    
    if payment_count < 10:
        print("Adding demo payments...")
        
        cursor.execute("SELECT id, client_id, freelancer_id, amount FROM contracts")
        contracts = cursor.fetchall()
        
        for contract in contracts:
            for i in range(random.randint(1, 3)):
                amount = contract[3] / 3
                platform_fee = amount * 0.1
                freelancer_amount = amount - platform_fee
                status = random.choice(["completed", "completed", "pending"])
                days_ago = random.randint(1, 60)
                cursor.execute("""
                    INSERT INTO payments (contract_id, from_user_id, to_user_id, amount, platform_fee, freelancer_amount, payment_type, status, payment_method, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, 'milestone', ?, 'card', datetime('now', ? || ' days'), datetime('now'))
                """, (contract[0], contract[1], contract[2], amount, platform_fee, freelancer_amount, status, f"-{days_ago}"))
        
        conn.commit()
        print(f"  Added payments")
    
    # Check reviews
    cursor.execute("SELECT COUNT(*) FROM reviews")
    review_count = cursor.fetchone()[0]
    
    if review_count < 5:
        print("Adding demo reviews...")
        
        cursor.execute("SELECT id, client_id, freelancer_id FROM contracts WHERE status = 'completed'")
        completed_contracts = cursor.fetchall()
        
        review_texts = [
            "Excellent work! Highly professional and delivered on time.",
            "Great communication and quality results. Would hire again.",
            "Very skilled professional. Exceeded my expectations.",
            "Good work overall. Some minor delays but quality was great.",
            "Outstanding service and attention to detail.",
        ]
        
        for contract in completed_contracts:
            cursor.execute("SELECT id FROM reviews WHERE contract_id = ?", (contract[0],))
            if not cursor.fetchone():
                cursor.execute("""
                    INSERT INTO reviews (contract_id, reviewer_id, reviewee_id, rating, comment, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
                """, (contract[0], contract[1], contract[2], random.randint(4, 5), random.choice(review_texts)))
        
        conn.commit()
        print(f"  Added reviews")
    
    # Final counts
    cursor.execute("SELECT COUNT(*) FROM users")
    print(f"\nFinal counts:")
    print(f"  Users: {cursor.fetchone()[0]}")
    cursor.execute("SELECT COUNT(*) FROM projects")
    print(f"  Projects: {cursor.fetchone()[0]}")
    cursor.execute("SELECT COUNT(*) FROM proposals")
    print(f"  Proposals: {cursor.fetchone()[0]}")
    cursor.execute("SELECT COUNT(*) FROM contracts")
    print(f"  Contracts: {cursor.fetchone()[0]}")
    cursor.execute("SELECT COUNT(*) FROM payments")
    print(f"  Payments: {cursor.fetchone()[0]}")
    cursor.execute("SELECT COUNT(*) FROM reviews")
    print(f"  Reviews: {cursor.fetchone()[0]}")
    
    conn.close()
    print("\nSeeding complete!")

if __name__ == "__main__":
    main()
