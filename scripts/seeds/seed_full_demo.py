#!/usr/bin/env python3
"""
@AI-HINT: Comprehensive database seeding script for MegiLance platform.
Seeds users, projects, proposals, contracts, payments, reviews, and messages
to create a fully functional demo environment.
"""
import os
import sys
import random
from datetime import datetime, timedelta

os.chdir(r'e:\MegiLance\backend')
sys.path.insert(0, r'e:\MegiLance\backend')

from app.db.turso_http import execute_query
from app.core.security import get_password_hash

# Demo data constants
DEMO_PASSWORD = "Password123"
NUM_CLIENTS = 5
NUM_FREELANCERS = 10
NUM_PROJECTS = 15
NUM_PROPOSALS_PER_PROJECT = 3
NUM_CONTRACTS = 8
NUM_REVIEWS = 12
NUM_MESSAGES = 20

# Realistic names
FIRST_NAMES = ["Alex", "Sarah", "Michael", "Emily", "David", "Jessica", "Chris", "Amanda", "Daniel", "Sophia",
               "James", "Olivia", "Robert", "Emma", "William", "Ava", "John", "Mia", "Richard", "Isabella"]
LAST_NAMES = ["Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Smith",
              "Anderson", "Taylor", "Thomas", "Moore", "Jackson", "Martin", "Lee", "Thompson", "White", "Harris"]

# Skills and categories
SKILLS_LIST = ["React", "Node.js", "Python", "Django", "FastAPI", "TypeScript", "PostgreSQL", "MongoDB", 
               "AWS", "Docker", "Kubernetes", "Machine Learning", "Data Science", "UI/UX Design", 
               "Figma", "Adobe XD", "Flutter", "Swift", "Kotlin", "Java", "C#", ".NET", "PHP", "Laravel",
               "WordPress", "Shopify", "SEO", "Content Writing", "Copywriting", "Video Editing"]

CATEGORIES = ["Web Development", "Mobile App Development", "Data Science", "UI/UX Design", "DevOps", 
              "Machine Learning", "E-commerce", "Backend Development", "Frontend Development", "Full Stack"]

JOB_TITLES = ["Full Stack Developer", "Senior React Developer", "Python Backend Engineer", "UI/UX Designer",
              "Mobile App Developer", "Data Scientist", "DevOps Engineer", "WordPress Expert", 
              "E-commerce Specialist", "Machine Learning Engineer"]

PROJECT_TITLES = [
    "E-commerce Platform Development",
    "Mobile App for Healthcare Startup",
    "AI-Powered Chatbot Integration",
    "Corporate Website Redesign",
    "SaaS Dashboard Development",
    "Real-time Analytics Platform",
    "Social Media Marketing Tool",
    "Inventory Management System",
    "Online Learning Platform",
    "CRM System Implementation",
    "Payment Gateway Integration",
    "Cloud Migration Project",
    "API Development and Documentation",
    "Data Pipeline Automation",
    "Custom WordPress Theme",
]

BIOS = [
    "Experienced developer with 5+ years building scalable web applications.",
    "Passionate about clean code and user-centric design.",
    "Full stack expert specializing in React and Node.js ecosystems.",
    "Data scientist with expertise in machine learning and analytics.",
    "Creative designer focused on intuitive user experiences.",
    "DevOps engineer automating infrastructure at scale.",
    "Mobile developer building beautiful iOS and Android apps.",
    "Backend specialist with strong database optimization skills.",
    "E-commerce expert with Shopify and WooCommerce expertise.",
    "Technical lead with experience managing distributed teams.",
]

def get_random_name():
    return f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"

def get_random_skills(count=5):
    return ",".join(random.sample(SKILLS_LIST, min(count, len(SKILLS_LIST))))

def get_random_date(days_back=180):
    return (datetime.now() - timedelta(days=random.randint(0, days_back))).isoformat()

def seed_users():
    """Seed demo users"""
    print("\n📧 Seeding users...")
    hashed = get_password_hash(DEMO_PASSWORD)
    users_created = 0
    
    # Create main demo accounts
    demo_accounts = [
        ("client@demo.com", "Demo Client", "Client", "client", 0),
        ("freelancer@demo.com", "Demo Freelancer", "Freelancer", "freelancer", 75),
        ("admin@demo.com", "Demo Admin", "Admin", "admin", 0),
    ]
    
    for email, name, role, user_type, hourly_rate in demo_accounts:
        result = execute_query("SELECT id FROM users WHERE email = ?", [email])
        if not result or not result.get("rows"):
            execute_query("""
                INSERT INTO users (email, hashed_password, is_active, is_verified, name, role, user_type, hourly_rate, 
                                   bio, skills, location, account_balance, joined_at, created_at)
                VALUES (?, ?, 1, 1, ?, ?, ?, ?, ?, ?, ?, 1000.0, datetime('now'), datetime('now'))
            """, [email, hashed, name, role, user_type, hourly_rate, 
                  random.choice(BIOS), get_random_skills(5), "Remote"])
            users_created += 1
            print(f"  ✓ Created {email}")
    
    # Create additional clients
    for i in range(NUM_CLIENTS):
        email = f"client{i+1}@demo.com"
        result = execute_query("SELECT id FROM users WHERE email = ?", [email])
        if not result or not result.get("rows"):
            name = get_random_name()
            execute_query("""
                INSERT INTO users (email, hashed_password, is_active, is_verified, name, role, user_type, 
                                   bio, location, account_balance, joined_at, created_at)
                VALUES (?, ?, 1, 1, ?, 'client', 'Client', ?, ?, ?, datetime('now'), datetime('now'))
            """, [email, hashed, name, f"Looking for talented freelancers for my projects.", 
                  random.choice(["New York", "London", "San Francisco", "Berlin", "Singapore"]),
                  random.randint(1000, 10000)])
            users_created += 1
    
    # Create additional freelancers
    for i in range(NUM_FREELANCERS):
        email = f"freelancer{i+1}@demo.com"
        result = execute_query("SELECT id FROM users WHERE email = ?", [email])
        if not result or not result.get("rows"):
            name = get_random_name()
            hourly = random.randint(30, 150)
            execute_query("""
                INSERT INTO users (email, hashed_password, is_active, is_verified, name, role, user_type, 
                                   bio, skills, hourly_rate, location, account_balance, joined_at, created_at)
                VALUES (?, ?, 1, ?, ?, 'freelancer', 'Freelancer', ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
            """, [email, hashed, name, random.choice([0, 1]), random.choice(BIOS), get_random_skills(6), hourly,
                  random.choice(["Remote", "USA", "UK", "Germany", "India", "Pakistan", "Canada"]),
                  random.randint(0, 5000)])
            users_created += 1
    
    print(f"  ✓ Created {users_created} users total")
    return users_created

def get_user_ids():
    """Get all user IDs by type"""
    client_result = execute_query("SELECT id FROM users WHERE user_type IN ('Client', 'client') LIMIT 20")
    freelancer_result = execute_query("SELECT id FROM users WHERE user_type IN ('Freelancer', 'freelancer') LIMIT 20")
    
    def extract_ids(result):
        if not result or not result.get("rows"):
            return []
        return [row[0].get("value") for row in result["rows"] if row[0].get("type") != "null"]
    
    return extract_ids(client_result), extract_ids(freelancer_result)

def seed_projects():
    """Seed demo projects"""
    print("\n📁 Seeding projects...")
    client_ids, _ = get_user_ids()
    if not client_ids:
        print("  ✗ No clients found, skipping projects")
        return 0
    
    projects_created = 0
    statuses = ["open", "in_progress", "completed", "open", "open"]  # Weight towards open
    
    for i, title in enumerate(PROJECT_TITLES[:NUM_PROJECTS]):
        result = execute_query("SELECT id FROM projects WHERE title = ?", [title])
        if not result or not result.get("rows"):
            client_id = random.choice(client_ids)
            budget_min = random.randint(500, 5000)
            budget_max = budget_min + random.randint(500, 5000)
            status = random.choice(statuses)
            
            execute_query("""
                INSERT INTO projects (title, description, category, budget_type, budget_min, budget_max,
                                      experience_level, estimated_duration, skills, client_id, status, 
                                      created_at, updated_at)
                VALUES (?, ?, ?, 'Fixed', ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, [
                title,
                f"Looking for an experienced professional to help with {title.lower()}. This project requires expertise in modern technologies and best practices.",
                random.choice(CATEGORIES),
                budget_min, budget_max,
                random.choice(["Entry", "Intermediate", "Expert"]),
                random.choice(["Less than 1 week", "1-2 weeks", "2-4 weeks", "1-3 months"]),
                get_random_skills(4),
                client_id,
                status,
                get_random_date(90),
                get_random_date(30)
            ])
            projects_created += 1
    
    print(f"  ✓ Created {projects_created} projects")
    return projects_created

def seed_proposals():
    """Seed demo proposals"""
    print("\n📝 Seeding proposals...")
    _, freelancer_ids = get_user_ids()
    if not freelancer_ids:
        print("  ✗ No freelancers found, skipping proposals")
        return 0
    
    project_result = execute_query("SELECT id, budget_min, budget_max FROM projects WHERE status = 'open' LIMIT 15")
    if not project_result or not project_result.get("rows"):
        print("  ✗ No open projects found, skipping proposals")
        return 0
    
    proposals_created = 0
    statuses = ["submitted", "submitted", "accepted", "rejected", "draft"]
    
    for row in project_result["rows"]:
        project_id = row[0].get("value")
        budget_min = float(row[1].get("value") or 500)
        budget_max = float(row[2].get("value") or 2000)
        
        # Create multiple proposals per project
        for _ in range(min(NUM_PROPOSALS_PER_PROJECT, len(freelancer_ids))):
            freelancer_id = random.choice(freelancer_ids)
            
            # Check if proposal already exists
            check_result = execute_query(
                "SELECT id FROM proposals WHERE project_id = ? AND freelancer_id = ?",
                [project_id, freelancer_id]
            )
            if check_result and check_result.get("rows"):
                continue
            
            bid = random.randint(int(budget_min), int(budget_max))
            status = random.choice(statuses)
            
            execute_query("""
                INSERT INTO proposals (project_id, freelancer_id, cover_letter, bid_amount, 
                                       estimated_hours, hourly_rate, availability, status, is_draft,
                                       created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, [
                project_id, freelancer_id,
                f"I'm excited to work on this project. With my experience in similar projects, I can deliver high-quality results within your timeline and budget.",
                bid,
                random.randint(20, 200),
                random.randint(30, 100),
                "Available immediately",
                status,
                1 if status == "draft" else 0,
                get_random_date(60),
                get_random_date(30)
            ])
            proposals_created += 1
    
    print(f"  ✓ Created {proposals_created} proposals")
    return proposals_created

def seed_contracts():
    """Seed demo contracts"""
    print("\n📋 Seeding contracts...")
    client_ids, freelancer_ids = get_user_ids()
    if not client_ids or not freelancer_ids:
        print("  ✗ Missing users, skipping contracts")
        return 0
    
    project_result = execute_query("SELECT id, client_id, budget_max FROM projects LIMIT 10")
    if not project_result or not project_result.get("rows"):
        print("  ✗ No projects found, skipping contracts")
        return 0
    
    contracts_created = 0
    statuses = ["active", "active", "completed", "pending", "completed"]
    
    for row in project_result["rows"][:NUM_CONTRACTS]:
        project_id = row[0].get("value")
        client_id = row[1].get("value")
        amount = float(row[2].get("value") or 2000)
        
        # Check if contract exists
        check_result = execute_query("SELECT id FROM contracts WHERE project_id = ?", [project_id])
        if check_result and check_result.get("rows"):
            continue
        
        freelancer_id = random.choice(freelancer_ids)
        status = random.choice(statuses)
        
        execute_query("""
            INSERT INTO contracts (project_id, freelancer_id, client_id, amount, status,
                                   description, start_date, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, [
            project_id, freelancer_id, client_id, amount, status,
            "Contract for project delivery with agreed milestones and terms.",
            get_random_date(60),
            get_random_date(60),
            get_random_date(10)
        ])
        contracts_created += 1
    
    print(f"  ✓ Created {contracts_created} contracts")
    return contracts_created

def seed_payments():
    """Seed demo payments"""
    print("\n💳 Seeding payments...")
    
    contract_result = execute_query("SELECT id, client_id, freelancer_id, amount FROM contracts LIMIT 15")
    if not contract_result or not contract_result.get("rows"):
        print("  ✗ No contracts found, skipping payments")
        return 0
    
    payments_created = 0
    statuses = ["completed", "completed", "pending", "completed"]
    
    for row in contract_result["rows"]:
        contract_id = row[0].get("value")
        client_id = row[1].get("value")
        freelancer_id = row[2].get("value")
        amount = float(row[3].get("value") or 1000)
        
        # Create 1-3 payments per contract
        num_payments = random.randint(1, 3)
        payment_amount = amount / num_payments
        
        for _ in range(num_payments):
            status = random.choice(statuses)
            execute_query("""
                INSERT INTO payments (contract_id, from_user_id, to_user_id, amount, status, 
                                      payment_type, description, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, [
                contract_id, client_id, freelancer_id, payment_amount, status,
                random.choice(["milestone", "full", "hourly"]),
                f"Payment for project milestone",
                get_random_date(45),
                get_random_date(10)
            ])
            payments_created += 1
    
    print(f"  ✓ Created {payments_created} payments")
    return payments_created

def seed_reviews():
    """Seed demo reviews"""
    print("\n⭐ Seeding reviews...")
    
    contract_result = execute_query("""
        SELECT id, client_id, freelancer_id, project_id FROM contracts 
        WHERE status = 'completed' LIMIT 10
    """)
    if not contract_result or not contract_result.get("rows"):
        print("  ✗ No completed contracts found, skipping reviews")
        return 0
    
    reviews_created = 0
    
    for row in contract_result["rows"]:
        contract_id = row[0].get("value")
        client_id = row[1].get("value")
        freelancer_id = row[2].get("value")
        project_id = row[3].get("value")
        
        # Client reviews freelancer
        check = execute_query("SELECT id FROM reviews WHERE reviewer_id = ? AND reviewee_id = ?", 
                             [client_id, freelancer_id])
        if not check or not check.get("rows"):
            rating = random.uniform(3.5, 5.0)
            execute_query("""
                INSERT INTO reviews (reviewer_id, reviewee_id, project_id, contract_id, rating, comment, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, [
                client_id, freelancer_id, project_id, contract_id, round(rating, 1),
                random.choice([
                    "Excellent work! Delivered on time and exceeded expectations.",
                    "Great communication and quality work. Would hire again.",
                    "Professional freelancer with strong technical skills.",
                    "Good work overall. Minor revisions needed but responsive.",
                    "Outstanding performance! Highly recommended."
                ]),
                get_random_date(30)
            ])
            reviews_created += 1
        
        # Freelancer reviews client
        check = execute_query("SELECT id FROM reviews WHERE reviewer_id = ? AND reviewee_id = ?", 
                             [freelancer_id, client_id])
        if not check or not check.get("rows"):
            rating = random.uniform(4.0, 5.0)
            execute_query("""
                INSERT INTO reviews (reviewer_id, reviewee_id, project_id, contract_id, rating, comment, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, [
                freelancer_id, client_id, project_id, contract_id, round(rating, 1),
                random.choice([
                    "Great client! Clear requirements and timely payments.",
                    "Professional and responsive. Enjoyed working together.",
                    "Clear communication and fair expectations.",
                    "Good project scope. Payment was on time.",
                    "Excellent client experience. Would work with again."
                ]),
                get_random_date(30)
            ])
            reviews_created += 1
    
    print(f"  ✓ Created {reviews_created} reviews")
    return reviews_created

def seed_conversations_and_messages():
    """Seed demo conversations and messages"""
    print("\n💬 Seeding conversations and messages...")
    
    contract_result = execute_query("SELECT client_id, freelancer_id FROM contracts LIMIT 8")
    if not contract_result or not contract_result.get("rows"):
        print("  ✗ No contracts found, skipping messages")
        return 0
    
    messages_created = 0
    
    message_samples = [
        "Hi! I saw your proposal and I'm interested in discussing the project further.",
        "Thank you for reaching out! I'd be happy to discuss the requirements.",
        "When would you be available for a quick call?",
        "I can start working on this next week. Does that work for you?",
        "I've completed the first milestone. Please review when you have a chance.",
        "Looks great! I've approved the payment for this milestone.",
        "Quick question about the design specifications...",
        "Sure, let me clarify that for you.",
        "The project is progressing well. Here's my latest update.",
        "Thanks for the update! Keep up the good work.",
    ]
    
    for row in contract_result["rows"]:
        client_id = row[0].get("value")
        freelancer_id = row[1].get("value")
        
        if not client_id or not freelancer_id:
            continue
        
        # Check if conversation exists
        check = execute_query("""
            SELECT id FROM conversations 
            WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)
        """, [client_id, freelancer_id, freelancer_id, client_id])
        
        if check and check.get("rows"):
            conv_id = check["rows"][0][0].get("value")
        else:
            # Create conversation
            execute_query("""
                INSERT INTO conversations (user1_id, user2_id, status, created_at, updated_at)
                VALUES (?, ?, 'active', datetime('now'), datetime('now'))
            """, [client_id, freelancer_id])
            
            conv_check = execute_query("""
                SELECT id FROM conversations WHERE user1_id = ? AND user2_id = ?
            """, [client_id, freelancer_id])
            if conv_check and conv_check.get("rows"):
                conv_id = conv_check["rows"][0][0].get("value")
            else:
                continue
        
        # Add messages to conversation
        for i in range(random.randint(3, 6)):
            sender_id = client_id if i % 2 == 0 else freelancer_id
            execute_query("""
                INSERT INTO messages (conversation_id, sender_id, content, sent_at, is_read)
                VALUES (?, ?, ?, ?, ?)
            """, [
                conv_id, sender_id,
                random.choice(message_samples),
                get_random_date(random.randint(0, 30)),
                random.choice([0, 1])
            ])
            messages_created += 1
    
    print(f"  ✓ Created {messages_created} messages")
    return messages_created

def main():
    print("=" * 60)
    print("🚀 MegiLance Full Demo Data Seeding")
    print("=" * 60)
    print(f"\nThis will create realistic demo data for testing.")
    print(f"Default password for all accounts: {DEMO_PASSWORD}")
    print("-" * 60)
    
    try:
        # Seed in order of dependencies
        seed_users()
        seed_projects()
        seed_proposals()
        seed_contracts()
        seed_payments()
        seed_reviews()
        seed_conversations_and_messages()
        
        print("\n" + "=" * 60)
        print("✅ Demo data seeding completed successfully!")
        print("=" * 60)
        print("\n📌 Demo Accounts:")
        print("  • client@demo.com (Client)")
        print("  • freelancer@demo.com (Freelancer)")
        print("  • admin@demo.com (Admin)")
        print(f"  • Password: {DEMO_PASSWORD}")
        print("\n" + "=" * 60)
        
    except Exception as e:
        print(f"\n❌ Error during seeding: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
