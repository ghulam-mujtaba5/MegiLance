#!/usr/bin/env python3
"""
Direct SQLite seeding script - bypasses the app's database layer
to avoid locking issues.
"""

import sqlite3
import random
from datetime import datetime, timedelta
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

DB_PATH = "backend/local_dev.db"
PASSWORD = "Password123"

# Sample data
SKILLS = ["Python", "JavaScript", "React", "Node.js", "TypeScript", "Next.js", 
          "FastAPI", "Django", "PostgreSQL", "MongoDB", "AWS", "Docker"]

PROJECT_TITLES = [
    "E-commerce Website Development",
    "Mobile App Backend API",
    "Data Analytics Dashboard",
    "Real-time Chat Application",
    "AI/ML Integration Project",
    "WordPress Custom Theme",
    "React Native Mobile App",
    "Cloud Infrastructure Setup",
]

def get_hashed_password():
    return pwd_context.hash(PASSWORD)

def seed_database():
    print("=" * 60)
    print("🚀 MegiLance Direct Database Seeding")
    print("=" * 60)
    
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA foreign_keys = OFF")  # Disable FK constraints temporarily
    cursor = conn.cursor()
    
    hashed = get_hashed_password()
    now = datetime.now().isoformat()
    
    # Clear existing data (optional, comment out to append)
    print("\n🧹 Clearing existing demo data...")
    cursor.execute("DELETE FROM messages WHERE 1=1")
    cursor.execute("DELETE FROM conversations WHERE 1=1")
    cursor.execute("DELETE FROM reviews WHERE 1=1")
    cursor.execute("DELETE FROM payments WHERE 1=1")
    cursor.execute("DELETE FROM contracts WHERE 1=1")
    cursor.execute("DELETE FROM proposals WHERE 1=1")
    cursor.execute("DELETE FROM projects WHERE 1=1")
    cursor.execute("DELETE FROM users WHERE email LIKE '%demo.com'")
    conn.commit()
    
    # ===================== USERS =====================
    print("\n📧 Seeding users...")
    users_data = [
        # Main demo accounts
        ("client@demo.com", "Demo", "Client", "client", "Client", 0, "Looking for talented developers", "", "New York"),
        ("freelancer@demo.com", "Demo", "Freelancer", "freelancer", "Freelancer", 85, "Full-stack developer with 5+ years experience", "Python,React,TypeScript,FastAPI,Next.js,AWS", "Remote"),
        ("admin@demo.com", "Demo", "Admin", "admin", "Admin", 0, "Platform administrator", "", "Remote"),
        # Additional clients
        ("client1@demo.com", "John", "Smith", "client", "Client", 0, "Tech startup founder seeking developers", "", "San Francisco"),
        ("client2@demo.com", "Sarah", "Johnson", "client", "Client", 0, "Marketing agency owner", "", "London"),
        ("client3@demo.com", "Michael", "Chen", "client", "Client", 0, "E-commerce business owner", "", "Singapore"),
        # Additional freelancers
        ("freelancer1@demo.com", "Alice", "Developer", "freelancer", "Freelancer", 75, "React specialist", "React,TypeScript,Next.js,Node.js", "Remote"),
        ("freelancer2@demo.com", "Bob", "Coder", "freelancer", "Freelancer", 95, "Backend expert", "Python,FastAPI,PostgreSQL,Docker,AWS", "USA"),
        ("freelancer3@demo.com", "Carol", "Designer", "freelancer", "Freelancer", 65, "UI/UX Designer", "Figma,UI/UX,CSS,JavaScript", "UK"),
        ("freelancer4@demo.com", "David", "Stack", "freelancer", "Freelancer", 110, "Full-stack architect", "Python,React,Node.js,MongoDB,AWS,Docker", "Germany"),
        ("freelancer5@demo.com", "Emma", "Data", "freelancer", "Freelancer", 90, "Data scientist", "Python,Machine Learning,TensorFlow,SQL", "Remote"),
    ]
    
    user_ids = {}
    for email, first, last, role, user_type, hourly, bio, skills, location in users_data:
        cursor.execute("""
            INSERT INTO users (
                email, hashed_password, first_name, last_name, name, role, user_type,
                is_active, is_verified, email_verified, two_factor_enabled,
                bio, skills, hourly_rate, location, account_balance,
                joined_at, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1, 1, 0, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (email, hashed, first, last, f"{first} {last}", role, user_type, 
              bio, skills, hourly, location, random.randint(500, 5000), now, now, now))
        user_ids[email] = cursor.lastrowid
        print(f"  ✓ Created {email}")
    
    conn.commit()
    print(f"  Total: {len(users_data)} users created")
    
    # Get user IDs
    client_ids = [user_ids[e] for e in user_ids if "client" in e.lower()]
    freelancer_ids = [user_ids[e] for e in user_ids if "freelancer" in e.lower()]
    
    # ===================== PROJECTS =====================
    print("\n📁 Seeding projects...")
    project_ids = []
    for i, title in enumerate(PROJECT_TITLES):
        client_id = random.choice(client_ids)
        status = random.choice(["open", "in_progress", "completed", "open", "open"])  # Weighted toward open
        budget_min = random.randint(500, 2000)
        budget_max = budget_min + random.randint(500, 3000)
        skills = ",".join(random.sample(SKILLS, 3))
        
        cursor.execute("""
            INSERT INTO projects (
                title, description, client_id, status, 
                category, budget_type, budget_min, budget_max, 
                experience_level, estimated_duration, skills,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (title, f"We need an experienced developer to build a {title.lower()}. Looking for someone with strong communication skills and attention to detail.",
              client_id, status, "Web Development", "fixed", budget_min, budget_max,
              "intermediate", f"{random.randint(2, 8)} weeks", skills,
              now, now))
        project_ids.append(cursor.lastrowid)
        print(f"  ✓ Created: {title[:40]}...")
    
    conn.commit()
    print(f"  Total: {len(project_ids)} projects created")
    
    # ===================== PROPOSALS =====================
    print("\n📝 Seeding proposals...")
    proposal_count = 0
    proposal_ids = []
    for project_id in project_ids:
        # Each project gets 1-3 proposals
        for _ in range(random.randint(1, 3)):
            freelancer_id = random.choice(freelancer_ids)
            status = random.choice(["pending", "accepted", "rejected", "pending", "pending"])
            bid = random.randint(800, 4000)
            
            # Check if this freelancer already proposed to this project
            cursor.execute("SELECT id FROM proposals WHERE project_id = ? AND freelancer_id = ?", 
                          (project_id, freelancer_id))
            if cursor.fetchone():
                continue
                
            cursor.execute("""
                INSERT INTO proposals (
                    project_id, freelancer_id, status, bid_amount,
                    cover_letter, estimated_hours, hourly_rate, availability, is_draft,
                    created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
            """, (project_id, freelancer_id, status, bid,
                  "I'm excited to work on this project! I have extensive experience with similar projects and can deliver high-quality results within your timeline.",
                  random.randint(20, 80), random.randint(50, 120), "immediate", now, now))
            proposal_ids.append((cursor.lastrowid, project_id, freelancer_id, status, bid))
            proposal_count += 1
    
    conn.commit()
    print(f"  Total: {proposal_count} proposals created")
    
    # ===================== CONTRACTS =====================
    print("\n📋 Seeding contracts...")
    contract_count = 0
    contract_data = []
    
    # Get accepted proposals
    accepted = [p for p in proposal_ids if p[3] == "accepted"]
    
    for proposal_id, project_id, freelancer_id, _, bid in accepted[:5]:
        # Get the client for this project
        cursor.execute("SELECT client_id FROM projects WHERE id = ?", (project_id,))
        row = cursor.fetchone()
        if not row:
            continue
        client_id = row[0]
        
        status = random.choice(["active", "completed", "completed", "active"])
        
        cursor.execute("""
            INSERT INTO contracts (
                project_id, client_id, freelancer_id, winning_bid_id,
                status, amount, contract_amount, platform_fee,
                contract_type, currency, terms, start_date, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (project_id, client_id, freelancer_id, proposal_id,
              status, bid, bid, bid * 0.1, "fixed", "USD",
              "Standard project terms apply. Payment upon milestone completion.",
              now, now, now))
        contract_data.append((cursor.lastrowid, project_id, client_id, freelancer_id, status, bid))
        contract_count += 1
    
    conn.commit()
    print(f"  Total: {contract_count} contracts created")
    
    # ===================== PAYMENTS =====================
    print("\n💳 Seeding payments...")
    payment_count = 0
    
    for contract_id, project_id, client_id, freelancer_id, status, amount in contract_data:
        if status == "completed":
            # Completed contracts have full payment
            cursor.execute("""
                INSERT INTO payments (
                    contract_id, from_user_id, to_user_id, amount, status,
                    payment_type, payment_method, platform_fee, freelancer_amount,
                    description, created_at, updated_at
                ) VALUES (?, ?, ?, ?, 'completed', 'project', 'escrow', ?, ?, ?, ?, ?)
            """, (contract_id, client_id, freelancer_id, amount,
                  amount * 0.1, amount * 0.9, "Final payment for completed project", now, now))
            payment_count += 1
        elif status == "active":
            # Active contracts have milestone payments
            milestone_amount = amount * 0.3
            cursor.execute("""
                INSERT INTO payments (
                    contract_id, from_user_id, to_user_id, amount, status,
                    payment_type, payment_method, platform_fee, freelancer_amount,
                    description, created_at, updated_at
                ) VALUES (?, ?, ?, ?, 'completed', 'milestone', 'escrow', ?, ?, ?, ?, ?)
            """, (contract_id, client_id, freelancer_id, milestone_amount,
                  milestone_amount * 0.1, milestone_amount * 0.9, "First milestone payment", now, now))
            payment_count += 1
    
    conn.commit()
    print(f"  Total: {payment_count} payments created")
    
    # ===================== REVIEWS =====================
    print("\n⭐ Seeding reviews...")
    review_count = 0
    
    for contract_id, project_id, client_id, freelancer_id, status, _ in contract_data:
        if status == "completed":
            # Client reviews freelancer
            cursor.execute("""
                INSERT INTO reviews (
                    contract_id, reviewer_id, reviewee_id,
                    rating, comment, is_public, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, 1, ?, ?)
            """, (contract_id, client_id, freelancer_id,
                  random.randint(4, 5), "Excellent work! Very professional and delivered on time. Highly recommended!",
                  now, now))
            review_count += 1
            
            # Freelancer reviews client
            cursor.execute("""
                INSERT INTO reviews (
                    contract_id, reviewer_id, reviewee_id,
                    rating, comment, is_public, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, 1, ?, ?)
            """, (contract_id, freelancer_id, client_id,
                  random.randint(4, 5), "Great client to work with. Clear requirements and timely communication.",
                  now, now))
            review_count += 1
    
    conn.commit()
    print(f"  Total: {review_count} reviews created")
    
    # ===================== CONVERSATIONS & MESSAGES =====================
    print("\n💬 Seeding conversations and messages...")
    msg_count = 0
    
    for contract_id, project_id, client_id, freelancer_id, status, _ in contract_data[:3]:
        # Create a conversation
        cursor.execute("""
            INSERT INTO conversations (
                project_id, client_id, freelancer_id, title, status,
                last_message_at, created_at, updated_at, is_archived
            ) VALUES (?, ?, ?, ?, 'active', ?, ?, ?, 0)
        """, (project_id, client_id, freelancer_id, "Project Discussion", now, now, now))
        conv_id = cursor.lastrowid
        
        # Add some messages
        messages = [
            (client_id, freelancer_id, "Hi! Thanks for accepting the project. Looking forward to working with you!"),
            (freelancer_id, client_id, "Thank you! I've reviewed the requirements and I'm ready to start. Any specific priorities?"),
            (client_id, freelancer_id, "Let's start with the main dashboard. I'll share the design files today."),
            (freelancer_id, client_id, "Perfect! I'll begin setting up the project structure in the meantime."),
        ]
        
        for sender_id, receiver_id, content in messages:
            cursor.execute("""
                INSERT INTO messages (
                    conversation_id, sender_id, receiver_id, content, is_read,
                    message_type, is_deleted, sent_at, created_at
                ) VALUES (?, ?, ?, ?, 1, 'text', 0, ?, ?)
            """, (conv_id, sender_id, receiver_id, content, now, now))
            msg_count += 1
    
    conn.commit()
    print(f"  Total: {msg_count} messages created")
    
    # Close connection
    conn.execute("PRAGMA foreign_keys = ON")
    conn.close()
    
    print("\n" + "=" * 60)
    print("✅ Database seeding completed!")
    print("=" * 60)
    print("\n📌 Demo Accounts (Password: Password123)")
    print("  • client@demo.com     - Client account")
    print("  • freelancer@demo.com - Freelancer account")
    print("  • admin@demo.com      - Admin account")
    print("=" * 60)

if __name__ == "__main__":
    seed_database()
