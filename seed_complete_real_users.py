#!/usr/bin/env python3
"""
Seed the database with complete, real user data for comprehensive testing
Creates fully functional accounts with:
- Complete profiles (bio, skills, location, hourly rate)
- Projects with milestones and deliverables
- Proposals and contracts
- Messages and conversations
- Payments and reviews
- Notifications
"""
import sqlite3
import os
from datetime import datetime, timedelta
from passlib.context import CryptContext

DB_PATH = os.path.join(os.path.dirname(__file__), "backend", "local_dev.db")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def main():
    print(f"🚀 Seeding database with complete real user data: {DB_PATH}")
    
    if not os.path.exists(DB_PATH):
        print(f"❌ ERROR: Database not found at {DB_PATH}")
        return
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Password for all test accounts
    test_password = "Test123!@#"
    hashed_pwd = hash_password(test_password)
    
    print(f"\n🔐 All test accounts use password: {test_password}\n")
    
    # ========== STEP 1: Create Complete User Accounts ==========
    print("👤 Creating complete user accounts...")
    
    test_users = [
        # CLIENTS with complete profiles
        {
            "email": "sarah.tech@megilance.com",
            "password": hashed_pwd,
            "first_name": "Sarah",
            "last_name": "Tech",
            "role": "client",
            "bio": "CTO of TechStart Inc. Looking for talented developers to build our next-generation SaaS platform. We value quality, communication, and long-term partnerships.",
            "company": "TechStart Inc.",
            "location": "San Francisco, CA",
            "phone": "+1-415-555-0101",
            "hourly_rate": None,
            "skills": None,
            "is_verified": True,
            "email_verified": True
        },
        {
            "email": "michael.ventures@megilance.com",
            "password": hashed_pwd,
            "first_name": "Michael",
            "last_name": "Ventures",
            "role": "client",
            "bio": "Serial entrepreneur and investor. Currently building a fintech startup and need expertise in blockchain, mobile apps, and UI/UX design.",
            "company": "Ventures Capital LLC",
            "location": "New York, NY",
            "phone": "+1-212-555-0202",
            "hourly_rate": None,
            "skills": None,
            "is_verified": True,
            "email_verified": True
        },
        
        # FREELANCERS with complete profiles
        {
            "email": "alex.fullstack@megilance.com",
            "password": hashed_pwd,
            "first_name": "Alex",
            "last_name": "Rodriguez",
            "role": "freelancer",
            "bio": "Senior Full-Stack Developer with 10+ years experience. Specialized in React, Node.js, Python, AWS. Built 50+ successful projects. Available for long-term contracts.",
            "company": None,
            "location": "Austin, TX",
            "phone": "+1-512-555-0303",
            "hourly_rate": 120.00,
            "skills": "React,Node.js,Python,TypeScript,AWS,Docker,PostgreSQL,MongoDB,Redis,GraphQL",
            "is_verified": True,
            "email_verified": True
        },
        {
            "email": "emma.designer@megilance.com",
            "password": hashed_pwd,
            "first_name": "Emma",
            "last_name": "Williams",
            "role": "freelancer",
            "bio": "Award-winning UI/UX Designer. Expert in Figma, Adobe XD, user research, and design systems. Created interfaces for Fortune 500 companies. Let's build something beautiful!",
            "company": None,
            "location": "Los Angeles, CA",
            "phone": "+1-310-555-0404",
            "hourly_rate": 95.00,
            "skills": "UI/UX Design,Figma,Adobe XD,Sketch,Prototyping,User Research,Design Systems,Mobile Design",
            "is_verified": True,
            "email_verified": True
        },
        {
            "email": "james.devops@megilance.com",
            "password": hashed_pwd,
            "first_name": "James",
            "last_name": "Chen",
            "role": "freelancer",
            "bio": "DevOps Engineer & Cloud Architect. AWS Certified Solutions Architect. Terraform, Kubernetes, CI/CD pipelines. Help companies scale from startup to enterprise.",
            "company": None,
            "location": "Seattle, WA",
            "phone": "+1-206-555-0505",
            "hourly_rate": 130.00,
            "skills": "AWS,Kubernetes,Docker,Terraform,Jenkins,GitLab CI,Ansible,Linux,Python,Bash",
            "is_verified": True,
            "email_verified": True
        },
        {
            "email": "sophia.data@megilance.com",
            "password": hashed_pwd,
            "first_name": "Sophia",
            "last_name": "Martinez",
            "role": "freelancer",
            "bio": "Data Scientist & ML Engineer. PhD in Computer Science. Built ML models for healthcare, finance, and e-commerce. TensorFlow, PyTorch, scikit-learn expert.",
            "company": None,
            "location": "Boston, MA",
            "phone": "+1-617-555-0606",
            "hourly_rate": 140.00,
            "skills": "Python,Machine Learning,TensorFlow,PyTorch,Pandas,NumPy,SQL,Data Analysis,NLP,Computer Vision",
            "is_verified": True,
            "email_verified": True
        },
        
        # ADMIN
        {
            "email": "admin.real@megilance.com",
            "password": hashed_pwd,
            "first_name": "Admin",
            "last_name": "Master",
            "role": "admin",
            "bio": "Platform administrator with full access to all features and tools.",
            "company": "MegiLance",
            "location": "Remote",
            "phone": "+1-555-555-9999",
            "hourly_rate": None,
            "skills": None,
            "is_verified": True,
            "email_verified": True
        }
    ]
    
    user_ids = {}
    for user_data in test_users:
        cursor.execute("SELECT id FROM users WHERE email = ?", (user_data["email"],))
        existing = cursor.fetchone()
        
        if existing:
            user_ids[user_data["email"]] = existing[0]
            print(f"  ✓ User exists: {user_data['email']}")
        else:
            # Build profile_data JSON
            import json
            profile_data = json.dumps({
                "company": user_data.get("company"),
                "phone": user_data.get("phone"),
                "timezone": "America/Los_Angeles",
                "availability": "Full-time" if user_data["role"] == "freelancer" else None
            })
            
            cursor.execute("""
                INSERT INTO users (
                    email, hashed_password, first_name, last_name, name, role, bio,
                    location, hourly_rate, skills, profile_data,
                    is_active, is_verified, email_verified, two_factor_enabled, account_balance,
                    joined_at, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, 0, 0.0, datetime('now'), datetime('now'), datetime('now'))
            """, (
                user_data["email"], user_data["password"], user_data["first_name"],
                user_data["last_name"], f"{user_data['first_name']} {user_data['last_name']}",
                user_data["role"], user_data["bio"],
                user_data["location"], user_data["hourly_rate"], user_data["skills"],
                profile_data,
                user_data["is_verified"], user_data["email_verified"]
            ))
            user_ids[user_data["email"]] = cursor.lastrowid
            print(f"  ✓ Created: {user_data['email']} ({user_data['role']})")
    
    conn.commit()
    
    # ========== STEP 2: Create Projects with Milestones ==========
    print("\n📋 Creating projects with milestones...")
    
    client_sarah = user_ids["sarah.tech@megilance.com"]
    client_michael = user_ids["michael.ventures@megilance.com"]
    
    projects_data = [
        {
            "client_id": client_sarah,
            "title": "SaaS Dashboard Development - React + Node.js",
            "description": "Build a comprehensive admin dashboard for our SaaS platform. Features include: user management, analytics, billing integration (Stripe), real-time notifications, and role-based access control. Must be responsive and accessible.",
            "category": "Web Development",
            "budget_type": "fixed",
            "budget_min": 8000,
            "budget_max": 12000,
            "experience_level": "expert",
            "estimated_duration": "2-3 months",
            "skills": "React,Node.js,TypeScript,PostgreSQL,Stripe,WebSockets,Redis",
            "status": "in_progress"
        },
        {
            "client_id": client_sarah,
            "title": "Mobile App UI/UX Design - iOS & Android",
            "description": "Design a modern, intuitive mobile app interface for our productivity tool. Need complete user flows, wireframes, high-fidelity mockups, and interactive prototypes. Must follow iOS and Android design guidelines.",
            "category": "Design",
            "budget_type": "fixed",
            "budget_min": 4000,
            "budget_max": 6000,
            "experience_level": "intermediate",
            "estimated_duration": "1-2 months",
            "skills": "UI/UX Design,Figma,Mobile Design,Prototyping",
            "status": "in_progress"
        },
        {
            "client_id": client_michael,
            "title": "AWS Infrastructure Setup with Kubernetes",
            "description": "Set up production-ready AWS infrastructure using Terraform. Requirements: EKS cluster, RDS database, ElastiCache, S3 buckets, CloudFront CDN, monitoring with CloudWatch, CI/CD pipeline with GitHub Actions.",
            "category": "DevOps",
            "budget_type": "hourly",
            "budget_min": 5000,
            "budget_max": 8000,
            "experience_level": "expert",
            "estimated_duration": "3-4 weeks",
            "skills": "AWS,Kubernetes,Terraform,Docker,CI/CD",
            "status": "open"
        },
        {
            "client_id": client_michael,
            "title": "Machine Learning Recommendation System",
            "description": "Build a recommendation engine for our e-commerce platform. Need collaborative filtering, content-based filtering, and hybrid approach. Must handle 100k+ users and 1M+ products efficiently.",
            "category": "Data Science",
            "budget_type": "fixed",
            "budget_min": 10000,
            "budget_max": 15000,
            "experience_level": "expert",
            "estimated_duration": "2-3 months",
            "skills": "Python,Machine Learning,TensorFlow,PostgreSQL,Redis",
            "status": "open"
        }
    ]
    
    project_ids = []
    for proj in projects_data:
        cursor.execute("""
            INSERT INTO projects (
                client_id, title, description, category, budget_type,
                budget_min, budget_max, experience_level, estimated_duration,
                skills, status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        """, (
            proj["client_id"], proj["title"], proj["description"],
            proj["category"], proj["budget_type"], proj["budget_min"],
            proj["budget_max"], proj["experience_level"],
            proj["estimated_duration"], proj["skills"], proj["status"]
        ))
        project_ids.append(cursor.lastrowid)
        print(f"  ✓ Created project: {proj['title'][:50]}...")
    
    conn.commit()
    
    # ========== STEP 3: Create Proposals ==========
    print("\n📝 Creating proposals...")
    
    freelancer_alex = user_ids["alex.fullstack@megilance.com"]
    freelancer_emma = user_ids["emma.designer@megilance.com"]
    freelancer_james = user_ids["james.devops@megilance.com"]
    freelancer_sophia = user_ids["sophia.data@megilance.com"]
    
    proposals_data = [
        {
            "project_id": project_ids[0],  # SaaS Dashboard
            "freelancer_id": freelancer_alex,
            "cover_letter": "Hi Sarah, I'm excited about your SaaS dashboard project! I have 10+ years building React/Node.js applications and have delivered similar dashboards for 3 SaaS companies. I can implement all features including Stripe integration, real-time notifications, and RBAC. My approach: 1) Architecture planning, 2) Backend API development, 3) Frontend implementation, 4) Testing & deployment. Timeline: 10 weeks. Let's discuss!",
            "bid_amount": 10000,
            "estimated_hours": 200,
            "hourly_rate": 50,
            "availability": "Full-time (40 hrs/week)",
            "status": "accepted",
            "is_draft": False
        },
        {
            "project_id": project_ids[1],  # Mobile UI/UX
            "freelancer_id": freelancer_emma,
            "cover_letter": "Hello Sarah! I'm a UI/UX designer with 8 years experience designing mobile apps. I've created interfaces for Fortune 500 companies and startups. For your project, I'll deliver: complete user flows, wireframes, high-fidelity mockups in Figma, interactive prototypes, and design system documentation. I follow iOS Human Interface Guidelines and Material Design principles. Portfolio: [link]. Available to start immediately!",
            "bid_amount": 5000,
            "estimated_hours": 100,
            "hourly_rate": 50,
            "availability": "Part-time (20 hrs/week)",
            "status": "accepted",
            "is_draft": False
        },
        {
            "project_id": project_ids[2],  # AWS Infrastructure
            "freelancer_id": freelancer_james,
            "cover_letter": "Hi Michael, I'm an AWS Certified Solutions Architect with 12 years DevOps experience. I've set up similar infrastructure for multiple fintech companies. I'll use Terraform for IaC, implement auto-scaling, disaster recovery, and comprehensive monitoring. Security best practices included. Can start next week and deliver in 3 weeks. References available.",
            "bid_amount": 6500,
            "estimated_hours": 130,
            "hourly_rate": 50,
            "availability": "Full-time (40 hrs/week)",
            "status": "pending",
            "is_draft": False
        },
        {
            "project_id": project_ids[3],  # ML Recommendation
            "freelancer_id": freelancer_sophia,
            "cover_letter": "Hello Michael! I'm a Data Scientist with PhD in CS and 9 years ML experience. I've built recommendation systems for e-commerce platforms handling millions of users. My approach: 1) Data analysis & feature engineering, 2) Model development (collaborative + content-based), 3) A/B testing framework, 4) Production deployment with monitoring. I use TensorFlow and optimize for performance. Let's create an amazing recommendation engine!",
            "bid_amount": 12000,
            "estimated_hours": 240,
            "hourly_rate": 50,
            "availability": "Full-time (40 hrs/week)",
            "status": "pending",
            "is_draft": False
        }
    ]
    
    proposal_ids = []
    for prop in proposals_data:
        cursor.execute("""
            INSERT INTO proposals (
                project_id, freelancer_id, cover_letter, bid_amount,
                estimated_hours, hourly_rate, availability, status, is_draft,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        """, (
            prop["project_id"], prop["freelancer_id"], prop["cover_letter"],
            prop["bid_amount"], prop["estimated_hours"], prop["hourly_rate"],
            prop["availability"], prop["status"], prop["is_draft"]
        ))
        proposal_ids.append(cursor.lastrowid)
        print(f"  ✓ Created proposal from freelancer {prop['freelancer_id']}")
    
    conn.commit()
    
    # ========== STEP 4: Create Contracts with Milestones ==========
    print("\n📄 Creating contracts with milestones...")
    
    contracts_data = [
        {
            "project_id": project_ids[0],
            "client_id": client_sarah,
            "freelancer_id": freelancer_alex,
            "winning_bid_id": proposal_ids[0],
            "contract_type": "fixed",
            "contract_amount": 10000,
            "platform_fee": 1000,
            "currency": "USD",
            "status": "active",
            "description": "Full-stack development of SaaS dashboard with all specified features",
            "terms": "Payment released upon milestone completion. 14-day review period. Code ownership transfers to client upon final payment.",
            "milestones": [
                {"title": "Backend API Development", "amount": 3000, "due_date": 14, "status": "completed"},
                {"title": "Frontend Dashboard Implementation", "amount": 4000, "due_date": 35, "status": "in_progress"},
                {"title": "Testing & Deployment", "amount": 3000, "due_date": 70, "status": "pending"}
            ]
        },
        {
            "project_id": project_ids[1],
            "client_id": client_sarah,
            "freelancer_id": freelancer_emma,
            "winning_bid_id": proposal_ids[1],
            "contract_type": "fixed",
            "contract_amount": 5000,
            "platform_fee": 500,
            "currency": "USD",
            "status": "active",
            "description": "Complete UI/UX design for mobile app (iOS & Android)",
            "terms": "Design files delivered in Figma. Includes 2 rounds of revisions. Final files include design system documentation.",
            "milestones": [
                {"title": "User Research & Wireframes", "amount": 1500, "due_date": 14, "status": "completed"},
                {"title": "High-Fidelity Mockups", "amount": 2000, "due_date": 28, "status": "in_progress"},
                {"title": "Interactive Prototype & Design System", "amount": 1500, "due_date": 42, "status": "pending"}
            ]
        }
    ]
    
    contract_ids = []
    for contract in contracts_data:
        cursor.execute("""
            INSERT INTO contracts (
                project_id, client_id, freelancer_id, winning_bid_id,
                contract_type, amount, contract_amount, platform_fee, currency,
                status, description, terms, start_date,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-15 days'), datetime('now'), datetime('now'))
        """, (
            contract["project_id"], contract["client_id"],
            contract["freelancer_id"], contract["winning_bid_id"],
            contract["contract_type"], contract["contract_amount"], contract["contract_amount"],
            contract["platform_fee"], contract["currency"],
            contract["status"], contract["description"], contract["terms"]
        ))
        contract_id = cursor.lastrowid
        contract_ids.append(contract_id)
        print(f"  ✓ Created contract {contract_id}")
        
        # Add milestones
        for idx, milestone in enumerate(contract["milestones"], 1):
            cursor.execute("""
                INSERT INTO milestones (
                    contract_id, title, description, amount, due_date, status, order_index,
                    created_at, updated_at
                ) VALUES (?, ?, ?, ?, datetime('now', '+' || ? || ' days'), ?, ?, datetime('now'), datetime('now'))
            """, (
                contract_id, milestone["title"],
                f"Milestone: {milestone['title']}", milestone["amount"],
                milestone["due_date"], milestone["status"], idx
            ))
            print(f"    • Milestone: {milestone['title']} (${milestone['amount']}) - {milestone['status']}")
    
    conn.commit()
    
    # ========== STEP 5: Create Payments ==========
    print("\n💰 Creating payments...")
    
    # Payment for completed milestone
    cursor.execute("""
        INSERT INTO payments (
            contract_id, from_user_id, to_user_id, amount, platform_fee,
            freelancer_amount, payment_type, payment_method, status,
            description, processed_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'milestone', 'card', 'completed',
                  'Payment for Backend API Development milestone',
                  datetime('now', '-5 days'), datetime('now', '-5 days'), datetime('now'))
    """, (
        contract_ids[0], client_sarah, freelancer_alex,
        3000, 300, 2700
    ))
    print(f"  ✓ Created payment: $3000 (Sarah → Alex)")
    
    cursor.execute("""
        INSERT INTO payments (
            contract_id, from_user_id, to_user_id, amount, platform_fee,
            freelancer_amount, payment_type, payment_method, status,
            description, processed_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'milestone', 'card', 'completed',
                  'Payment for User Research & Wireframes milestone',
                  datetime('now', '-3 days'), datetime('now', '-3 days'), datetime('now'))
    """, (
        contract_ids[1], client_sarah, freelancer_emma,
        1500, 150, 1350
    ))
    print(f"  ✓ Created payment: $1500 (Sarah → Emma)")
    
    conn.commit()
    
    # ========== STEP 6: Create Reviews ==========
    print("\n⭐ Creating reviews...")
    
    cursor.execute("""
        INSERT INTO reviews (
            contract_id, reviewer_id, reviewee_id, rating, comment, is_public,
            created_at, updated_at
        ) VALUES (?, ?, ?, 5,
                  'Excellent work! Alex delivered high-quality code, communicated clearly, and completed the milestone ahead of schedule. Looking forward to the next milestone!',
                  1, datetime('now', '-4 days'), datetime('now'))
    """, (contract_ids[0], client_sarah, freelancer_alex))
    print(f"  ✓ Created review: Sarah → Alex (5 stars)")
    
    conn.commit()
    
    # ========== STEP 7: Create Conversations & Messages ==========
    print("\n💬 Creating conversations and messages...")
    
    # Conversation between Sarah and Alex
    cursor.execute("""
        INSERT INTO conversations (
            client_id, freelancer_id, title, status, last_message_at, is_archived,
            created_at, updated_at
        ) VALUES (?, ?, 'SaaS Dashboard Project Discussion', 'active', datetime('now', '-2 hours'), 0, datetime('now', '-10 days'), datetime('now'))
    """, (client_sarah, freelancer_alex))
    conv_id_1 = cursor.lastrowid
    
    messages = [
        (conv_id_1, client_sarah, freelancer_alex, "Hi Alex! I reviewed the backend API and it looks great. Can you add the email notification feature to the next milestone?", "-10 days"),
        (conv_id_1, freelancer_alex, client_sarah, "Thanks Sarah! Absolutely, I can add email notifications using SendGrid. I'll include it in the Frontend Dashboard milestone.", "-9 days"),
        (conv_id_1, client_sarah, freelancer_alex, "Perfect! Also, can we schedule a call next week to discuss the admin panel features?", "-9 days"),
        (conv_id_1, freelancer_alex, client_sarah, "Sure! I'm available Tuesday or Thursday afternoon. What works for you?", "-8 days"),
        (conv_id_1, client_sarah, freelancer_alex, "Thursday at 2 PM works. I'll send a calendar invite.", "-8 days"),
        (conv_id_1, freelancer_alex, client_sarah, "Great! I'll prepare a demo of the current progress to show you.", "-7 days"),
        (conv_id_1, client_sarah, freelancer_alex, "Looking forward to it! By the way, the dashboard looks amazing so far. The UI is exactly what we wanted.", "-2 hours"),
    ]
    
    for conv_id, sender_id, receiver_id, content, time_offset in messages:
        cursor.execute("""
            INSERT INTO messages (
                conversation_id, sender_id, receiver_id, content, is_read, is_deleted, message_type,
                sent_at, created_at
            ) VALUES (?, ?, ?, ?, 1, 0, 'text', datetime('now', ?), datetime('now', ?))
        """, (conv_id, sender_id, receiver_id, content, time_offset, time_offset))
    
    print(f"  ✓ Created conversation with {len(messages)} messages (Sarah ↔ Alex)")
    
    # Conversation between Sarah and Emma
    cursor.execute("""
        INSERT INTO conversations (
            client_id, freelancer_id, title, status, last_message_at, is_archived,
            created_at, updated_at
        ) VALUES (?, ?, 'Mobile App Design Discussion', 'active', datetime('now', '-1 day'), 0, datetime('now', '-12 days'), datetime('now'))
    """, (client_sarah, freelancer_emma))
    conv_id_2 = cursor.lastrowid
    
    messages2 = [
        (conv_id_2, client_sarah, freelancer_emma, "Hi Emma! I love the wireframes. The user flow is very intuitive.", "-12 days"),
        (conv_id_2, freelancer_emma, client_sarah, "Thank you Sarah! I'm glad you like it. I'll start working on the high-fidelity mockups now.", "-11 days"),
        (conv_id_2, client_sarah, freelancer_emma, "Great! Could you also create a dark mode version?", "-11 days"),
        (conv_id_2, freelancer_emma, client_sarah, "Absolutely! I'll include both light and dark mode in the mockups.", "-10 days"),
        (conv_id_2, freelancer_emma, client_sarah, "Hi Sarah, I've uploaded the first set of mockups to Figma. Can you review and share your feedback?", "-1 day"),
    ]
    
    for conv_id, sender_id, receiver_id, content, time_offset in messages2:
        cursor.execute("""
            INSERT INTO messages (
                conversation_id, sender_id, receiver_id, content, is_read, is_deleted, message_type,
                sent_at, created_at
            ) VALUES (?, ?, ?, ?, 0, 0, 'text', datetime('now', ?), datetime('now', ?))
        """, (conv_id, sender_id, receiver_id, content, time_offset, time_offset))
    
    print(f"  ✓ Created conversation with {len(messages2)} messages (Sarah ↔ Emma)")
    
    conn.commit()
    
    # ========== STEP 8: Create Notifications ==========
    print("\n🔔 Creating notifications...")
    
    notifications = [
        (freelancer_alex, "payment_received", "Payment Received", "You received $2,700 for Backend API Development milestone", False, "-5 days"),
        (client_sarah, "milestone_completed", "Milestone Completed", "Alex Rodriguez completed 'Backend API Development' milestone", True, "-6 days"),
        (freelancer_emma, "message_received", "New Message", "Sarah Tech sent you a message", False, "-1 day"),
        (freelancer_alex, "message_received", "New Message", "Sarah Tech sent you a message", False, "-2 hours"),
        (client_sarah, "proposal_received", "New Proposal", "James Chen submitted a proposal for 'AWS Infrastructure Setup'", False, "-3 days"),
        (freelancer_james, "proposal_submitted", "Proposal Submitted", "Your proposal for 'AWS Infrastructure Setup' was submitted", True, "-3 days"),
    ]
    
    for user_id, notif_type, title, message, is_read, time_offset in notifications:
        cursor.execute("""
            INSERT INTO notifications (
                user_id, notification_type, title, content, is_read, priority,
                created_at
            ) VALUES (?, ?, ?, ?, ?, 'medium', datetime('now', ?))
        """, (user_id, notif_type, title, message, is_read, time_offset))
    
    print(f"  ✓ Created {len(notifications)} notifications")
    
    conn.commit()
    
    # ========== FINAL STATS ==========
    print("\n" + "="*60)
    print("✅ DATABASE SEEDING COMPLETE!")
    print("="*60)
    
    cursor.execute("SELECT COUNT(*) FROM users")
    print(f"👥 Total Users: {cursor.fetchone()[0]}")
    
    cursor.execute("SELECT COUNT(*) FROM projects")
    print(f"📋 Total Projects: {cursor.fetchone()[0]}")
    
    cursor.execute("SELECT COUNT(*) FROM proposals")
    print(f"📝 Total Proposals: {cursor.fetchone()[0]}")
    
    cursor.execute("SELECT COUNT(*) FROM contracts")
    print(f"📄 Total Contracts: {cursor.fetchone()[0]}")
    
    cursor.execute("SELECT COUNT(*) FROM milestones")
    print(f"🎯 Total Milestones: {cursor.fetchone()[0]}")
    
    cursor.execute("SELECT COUNT(*) FROM payments")
    print(f"💰 Total Payments: {cursor.fetchone()[0]}")
    
    cursor.execute("SELECT COUNT(*) FROM reviews")
    print(f"⭐ Total Reviews: {cursor.fetchone()[0]}")
    
    cursor.execute("SELECT COUNT(*) FROM messages")
    print(f"💬 Total Messages: {cursor.fetchone()[0]}")
    
    cursor.execute("SELECT COUNT(*) FROM notifications")
    print(f"🔔 Total Notifications: {cursor.fetchone()[0]}")
    
    print("\n" + "="*60)
    print("🔐 TEST CREDENTIALS (Password: Test123!@#)")
    print("="*60)
    print("\n📧 CLIENTS:")
    print("  • sarah.tech@megilance.com")
    print("  • michael.ventures@megilance.com")
    print("\n👨‍💻 FREELANCERS:")
    print("  • alex.fullstack@megilance.com (Full-Stack Developer)")
    print("  • emma.designer@megilance.com (UI/UX Designer)")
    print("  • james.devops@megilance.com (DevOps Engineer)")
    print("  • sophia.data@megilance.com (Data Scientist)")
    print("\n👑 ADMIN:")
    print("  • admin.real@megilance.com")
    print("\n" + "="*60)
    
    conn.close()

if __name__ == "__main__":
    main()
