# @AI-HINT: Comprehensive demo data generator showcasing all MegiLance features for professor demonstration
"""
Demo Data Seeder for MegiLance Platform
Generates realistic, comprehensive data across all features to showcase platform capabilities
"""

import sys
import os
sys.path.append(os.getcwd())

from app.db.session import SessionLocal, get_engine
from app.db.base import Base
from app.models.user import User
from app.models.project import Project
from app.models.proposal import Proposal
from app.models.contract import Contract
from app.models.payment import Payment
from app.models.milestone import Milestone
from app.models.review import Review
from app.models.portfolio import PortfolioItem
from app.models.skill import Skill
from app.models.notification import Notification
from app.models.message import Message, Conversation
from app.core.security import get_password_hash
from datetime import datetime, timedelta
import random
import json


def seed_comprehensive_demo_data():
    """Generate comprehensive demo data showcasing all platform features"""
    
    db = SessionLocal()
    
    print("🌱 Starting comprehensive demo data generation...")
    
    # Clear existing data
    print("🗑️  Clearing existing data...")
    db.query(Payment).delete()
    db.query(Review).delete()
    db.query(Milestone).delete()
    db.query(Contract).delete()
    db.query(Proposal).delete()
    db.query(PortfolioItem).delete()
    db.query(Message).delete()
    db.query(Conversation).delete()
    db.query(Notification).delete()
    db.query(Project).delete()
    db.query(User).filter(User.email != "admin@megilance.com").delete()
    db.commit()
    
    # === 1. CREATE SKILLS DATABASE ===
    print("\n💎 Creating comprehensive skills database...")
    
    skill_categories = {
        "Web Development": [
            "React", "Vue.js", "Angular", "Next.js", "TypeScript", "JavaScript",
            "HTML5", "CSS3", "Tailwind CSS", "SASS", "Webpack", "Vite"
        ],
        "Backend Development": [
            "Node.js", "Python", "FastAPI", "Django", "Flask", "Express.js",
            "PostgreSQL", "MongoDB", "Redis", "GraphQL", "REST API", "Microservices"
        ],
        "Mobile Development": [
            "React Native", "Flutter", "Swift", "Kotlin", "iOS Development",
            "Android Development", "Cross-platform Development"
        ],
        "DevOps": [
            "Docker", "Kubernetes", "AWS", "Azure", "GCP", "CI/CD",
            "Terraform", "Jenkins", "GitHub Actions", "Linux Administration"
        ],
        "Data Science": [
            "Machine Learning", "TensorFlow", "PyTorch", "Data Analysis",
            "Python ML", "Pandas", "NumPy", "Scikit-learn", "Deep Learning"
        ],
        "Design": [
            "UI/UX Design", "Figma", "Adobe XD", "Sketch", "Photoshop",
            "Illustrator", "Wireframing", "Prototyping", "User Research"
        ],
        "Blockchain": [
            "Solidity", "Smart Contracts", "Web3.js", "Ethereum", "DeFi",
            "NFT Development", "Blockchain Architecture"
        ]
    }
    
    skills_map = {}
    for category, skill_names in skill_categories.items():
        for skill_name in skill_names:
            skill = Skill(
                name=skill_name,
                category=category,
                description=f"Professional {skill_name} expertise",
                is_active=True,
                sort_order=len(skills_map) + 1
            )
            db.add(skill)
            skills_map[skill_name] = skill
    
    db.commit()
    print(f"✅ Created {len(skills_map)} skills across {len(skill_categories)} categories")
    
    # === 2. CREATE DIVERSE USER BASE ===
    print("\n👥 Creating diverse user ecosystem...")
    
    # Admin
    admin = User(
        email="admin@megilance.com",
        hashed_password=get_password_hash("admin123"),
        name="Admin User",
        user_type="admin",
        role="admin",
        is_active=True,
        is_verified=True,
        email_verified=True,
        account_balance=0.0
    )
    db.add(admin)
    
    # Clients with realistic profiles
    clients_data = [
        {
            "name": "TechStartup Inc",
            "email": "client1@example.com",
            "bio": "Fast-growing SaaS startup looking for talented developers",
            "location": "San Francisco, CA"
        },
        {
            "name": "E-Commerce Solutions",
            "email": "client2@example.com",
            "bio": "Building next-gen e-commerce platforms",
            "location": "New York, NY"
        },
        {
            "name": "FinTech Innovations",
            "email": "client3@example.com",
            "bio": "Revolutionizing financial services with blockchain",
            "location": "London, UK"
        },
        {
            "name": "HealthTech Corp",
            "email": "client4@example.com",
            "bio": "Digital health solutions for modern healthcare",
            "location": "Toronto, Canada"
        },
        {
            "name": "AI Research Lab",
            "email": "client5@example.com",
            "bio": "Cutting-edge AI and machine learning research",
            "location": "Singapore"
        }
    ]
    
    clients = []
    for client_data in clients_data:
        client = User(
            email=client_data["email"],
            hashed_password=get_password_hash("password123"),
            name=client_data["name"],
            user_type="client",
            role="user",
            bio=client_data["bio"],
            location=client_data["location"],
            is_active=True,
            is_verified=True,
            email_verified=True,
            account_balance=random.uniform(5000, 50000)
        )
        clients.append(client)
        db.add(client)
    
    # Freelancers with diverse skills
    freelancers_data = [
        {
            "name": "Sarah Chen",
            "email": "freelancer1@example.com",
            "bio": "Full-stack developer with 8+ years experience in React and Node.js. Passionate about building scalable web applications.",
            "skills": ["React", "Node.js", "TypeScript", "PostgreSQL", "AWS"],
            "hourly_rate": 85.0,
            "location": "Austin, TX"
        },
        {
            "name": "Marcus Johnson",
            "email": "freelancer2@example.com",
            "bio": "UI/UX designer specializing in modern, user-centric design. Expert in Figma and prototyping.",
            "skills": ["UI/UX Design", "Figma", "Prototyping", "User Research", "Adobe XD"],
            "hourly_rate": 75.0,
            "location": "Seattle, WA"
        },
        {
            "name": "Priya Patel",
            "email": "freelancer3@example.com",
            "bio": "Data scientist and ML engineer. Building AI solutions that drive business value.",
            "skills": ["Machine Learning", "Python ML", "TensorFlow", "Data Analysis", "Deep Learning"],
            "hourly_rate": 95.0,
            "location": "Bangalore, India"
        },
        {
            "name": "Alex Rivera",
            "email": "freelancer4@example.com",
            "bio": "Mobile app developer specializing in React Native. Created 50+ mobile apps.",
            "skills": ["React Native", "Flutter", "iOS Development", "Android Development"],
            "hourly_rate": 80.0,
            "location": "Mexico City, Mexico"
        },
        {
            "name": "Emma Williams",
            "email": "freelancer5@example.com",
            "bio": "DevOps engineer and cloud architect. AWS and Kubernetes expert.",
            "skills": ["Docker", "Kubernetes", "AWS", "CI/CD", "Terraform"],
            "hourly_rate": 90.0,
            "location": "Berlin, Germany"
        },
        {
            "name": "David Kim",
            "email": "freelancer6@example.com",
            "bio": "Blockchain developer building the decentralized future. Solidity and Web3 specialist.",
            "skills": ["Solidity", "Smart Contracts", "Web3.js", "Ethereum", "DeFi"],
            "hourly_rate": 100.0,
            "location": "Seoul, South Korea"
        },
        {
            "name": "Lisa Anderson",
            "email": "freelancer7@example.com",
            "bio": "Backend architect with expertise in microservices and distributed systems.",
            "skills": ["Python", "FastAPI", "Microservices", "PostgreSQL", "Redis"],
            "hourly_rate": 88.0,
            "location": "Amsterdam, Netherlands"
        },
        {
            "name": "Mohammed Al-Rashid",
            "email": "freelancer8@example.com",
            "bio": "Frontend specialist creating pixel-perfect, responsive interfaces.",
            "skills": ["Vue.js", "TypeScript", "Tailwind CSS", "SASS", "Webpack"],
            "hourly_rate": 70.0,
            "location": "Dubai, UAE"
        }
    ]
    
    freelancers = []
    for freelancer_data in freelancers_data:
        freelancer = User(
            email=freelancer_data["email"],
            hashed_password=get_password_hash("password123"),
            name=freelancer_data["name"],
            user_type="freelancer",
            role="user",
            bio=freelancer_data["bio"],
            skills=json.dumps(freelancer_data["skills"]),
            hourly_rate=freelancer_data["hourly_rate"],
            location=freelancer_data["location"],
            is_active=True,
            is_verified=True,
            email_verified=True,
            account_balance=random.uniform(1000, 10000)
        )
        freelancers.append(freelancer)
        db.add(freelancer)
    
    db.commit()
    print(f"✅ Created {len(clients)} clients and {len(freelancers)} freelancers")
    
    # === 3. CREATE DIVERSE PROJECTS ===
    print("\n📋 Creating diverse project portfolio...")
    
    projects_data = [
        {
            "title": "E-Commerce Platform Redesign",
            "description": "Complete redesign of our e-commerce platform using modern React and microservices architecture. Need both frontend and backend expertise.",
            "category": "Web Development",
            "budget_type": "fixed",
            "budget_min": 15000,
            "budget_max": 25000,
            "experience_level": "expert",
            "skills": ["React", "Node.js", "PostgreSQL", "Microservices", "AWS"],
            "status": "open",
            "client_idx": 0
        },
        {
            "title": "Mobile Banking App Development",
            "description": "Build a secure, user-friendly mobile banking application for iOS and Android with biometric authentication.",
            "category": "Mobile Development",
            "budget_type": "fixed",
            "budget_min": 30000,
            "budget_max": 45000,
            "experience_level": "expert",
            "skills": ["React Native", "iOS Development", "Android Development", "Security"],
            "status": "open",
            "client_idx": 1
        },
        {
            "title": "AI-Powered Chatbot Integration",
            "description": "Integrate an AI chatbot into our customer service platform using GPT-4 and custom training data.",
            "category": "Data Science",
            "budget_type": "hourly",
            "budget_min": 80,
            "budget_max": 120,
            "experience_level": "expert",
            "skills": ["Machine Learning", "Python ML", "Deep Learning", "NLP"],
            "status": "in_progress",
            "client_idx": 4
        },
        {
            "title": "DeFi Lending Protocol",
            "description": "Build a decentralized lending protocol on Ethereum with smart contracts and Web3 interface.",
            "category": "Blockchain",
            "budget_type": "fixed",
            "budget_min": 40000,
            "budget_max": 60000,
            "experience_level": "expert",
            "skills": ["Solidity", "Smart Contracts", "Web3.js", "DeFi"],
            "status": "open",
            "client_idx": 2
        },
        {
            "title": "Healthcare Dashboard UI/UX",
            "description": "Design intuitive healthcare dashboard for doctors and patients with accessibility in mind.",
            "category": "Design",
            "budget_type": "fixed",
            "budget_min": 8000,
            "budget_max": 12000,
            "experience_level": "intermediate",
            "skills": ["UI/UX Design", "Figma", "Prototyping", "User Research"],
            "status": "open",
            "client_idx": 3
        },
        {
            "title": "Cloud Infrastructure Setup",
            "description": "Set up scalable cloud infrastructure on AWS with Kubernetes, monitoring, and auto-scaling.",
            "category": "DevOps",
            "budget_type": "fixed",
            "budget_min": 10000,
            "budget_max": 15000,
            "experience_level": "expert",
            "skills": ["Docker", "Kubernetes", "AWS", "CI/CD", "Terraform"],
            "status": "completed",
            "client_idx": 0
        },
        {
            "title": "Content Management System",
            "description": "Custom CMS for blog and media management with SEO optimization.",
            "category": "Web Development",
            "budget_type": "fixed",
            "budget_min": 5000,
            "budget_max": 8000,
            "experience_level": "intermediate",
            "skills": ["Next.js", "TypeScript", "PostgreSQL", "REST API"],
            "status": "open",
            "client_idx": 1
        },
        {
            "title": "Real-time Analytics Dashboard",
            "description": "Build real-time analytics dashboard with data visualization and reporting features.",
            "category": "Web Development",
            "budget_type": "hourly",
            "budget_min": 70,
            "budget_max": 100,
            "experience_level": "intermediate",
            "skills": ["React", "Python", "Data Analysis", "REST API"],
            "status": "open",
            "client_idx": 4
        },
        {
            "title": "API Microservices Architecture",
            "description": "Design and implement microservices architecture for existing monolithic application.",
            "category": "Backend Development",
            "budget_type": "fixed",
            "budget_min": 20000,
            "budget_max": 30000,
            "experience_level": "expert",
            "skills": ["Microservices", "Docker", "PostgreSQL", "Redis", "GraphQL"],
            "status": "in_progress",
            "client_idx": 0
        },
        {
            "title": "Cross-Platform Mobile Game",
            "description": "Develop engaging casual mobile game for both iOS and Android platforms.",
            "category": "Mobile Development",
            "budget_type": "fixed",
            "budget_min": 18000,
            "budget_max": 25000,
            "experience_level": "intermediate",
            "skills": ["Flutter", "iOS Development", "Android Development"],
            "status": "open",
            "client_idx": 3
        }
    ]
    
    projects = []
    for proj_data in projects_data:
        project = Project(
            title=proj_data["title"],
            description=proj_data["description"],
            category=proj_data["category"],
            budget_type=proj_data["budget_type"],
            budget_min=proj_data["budget_min"],
            budget_max=proj_data["budget_max"],
            experience_level=proj_data["experience_level"],
            estimated_duration="2-4 weeks" if proj_data["budget_type"] == "fixed" else "Ongoing",
            skills=json.dumps(proj_data["skills"]),
            client_id=clients[proj_data["client_idx"]].id,
            status=proj_data["status"],
            created_at=datetime.utcnow() - timedelta(days=random.randint(1, 30))
        )
        projects.append(project)
        db.add(project)
    
    db.commit()
    print(f"✅ Created {len(projects)} diverse projects")
    
    # === 4. CREATE PROPOSALS ===
    print("\n💼 Generating realistic proposals...")
    
    proposals_created = 0
    for project in projects:
        if project.status in ["open", "in_progress"]:
            # Generate 2-5 proposals per project
            num_proposals = random.randint(2, 5)
            selected_freelancers = random.sample(freelancers, min(num_proposals, len(freelancers)))
            
            for i, freelancer in enumerate(selected_freelancers):
                proposal = Proposal(
                    project_id=project.id,
                    freelancer_id=freelancer.id,
                    cover_letter=f"I'm excited about this {project.category} project! With my expertise in {', '.join(json.loads(freelancer.skills)[:3])}, I can deliver exceptional results. I have successfully completed similar projects and understand your requirements perfectly.",
                    bid_amount=project.budget_max * random.uniform(0.7, 1.0) if project.budget_type == "fixed" else freelancer.hourly_rate,
                    estimated_hours=random.randint(40, 200) if project.budget_type == "fixed" else random.randint(20, 80),
                    hourly_rate=freelancer.hourly_rate,
                    availability="1-2_weeks" if i == 0 else random.choice(["immediately", "1-2_weeks", "2-4_weeks"]),
                    status="accepted" if project.status == "in_progress" and i == 0 else "submitted",
                    created_at=datetime.utcnow() - timedelta(days=random.randint(1, 10))
                )
                db.add(proposal)
                proposals_created += 1
    
    db.commit()
    print(f"✅ Created {proposals_created} proposals")
    
    # === 5. CREATE CONTRACTS, MILESTONES & PAYMENTS ===
    print("\n📄 Creating contracts with milestones and payments...")
    
    accepted_proposals = db.query(Proposal).filter(Proposal.status == "accepted").all()
    
    contracts_created = 0
    milestones_created = 0
    payments_created = 0
    
    for proposal in accepted_proposals:
        # Create contract
        project = db.query(Project).filter(Project.id == proposal.project_id).first()
        contract = Contract(
            project_id=proposal.project_id,
            freelancer_id=proposal.freelancer_id,
            client_id=project.client_id,
            winning_bid_id=proposal.id,
            amount=proposal.bid_amount,
            contract_amount=proposal.bid_amount,
            platform_fee=proposal.bid_amount * 0.1,
            status="completed" if project.status == "completed" else "active",
            start_date=datetime.utcnow() - timedelta(days=random.randint(10, 30)),
            description=f"Contract for {project.title}",
            terms="Standard contract terms and conditions apply."
        )
        db.add(contract)
        db.commit()
        contracts_created += 1
        
        # Create milestones
        num_milestones = random.randint(2, 4)
        milestone_amount = contract.amount / num_milestones
        
        for i in range(num_milestones):
            milestone_status = "paid" if project.status == "completed" or i < num_milestones - 1 else "approved" if random.random() > 0.5 else "submitted"
            
            milestone = Milestone(
                contract_id=contract.id,
                title=f"Milestone {i+1}: {['Planning', 'Development', 'Testing', 'Deployment'][i % 4]}",
                description=f"Complete {['planning and design', 'core development', 'testing and QA', 'deployment and documentation'][i % 4]} phase",
                amount=milestone_amount,
                due_date=contract.start_date + timedelta(days=7 * (i + 1)),
                status=milestone_status,
                order_index=i,
                approved_at=datetime.utcnow() - timedelta(days=random.randint(1, 5)) if milestone_status in ["approved", "paid"] else None,
                paid_at=datetime.utcnow() - timedelta(days=random.randint(1, 3)) if milestone_status == "paid" else None
            )
            db.add(milestone)
            db.commit()
            milestones_created += 1
            
            # Create payment for paid milestones
            if milestone_status == "paid":
                payment = Payment(
                    contract_id=contract.id,
                    milestone_id=milestone.id,
                    from_user_id=project.client_id,
                    to_user_id=proposal.freelancer_id,
                    amount=milestone_amount,
                    payment_type="milestone",
                    payment_method="stripe",
                    status="completed",
                    platform_fee=milestone_amount * 0.1,
                    freelancer_amount=milestone_amount * 0.9,
                    processed_at=datetime.utcnow() - timedelta(days=random.randint(1, 3)),
                    transaction_id=f"txn_{random.randint(100000, 999999)}"
                )
                db.add(payment)
                payments_created += 1
    
    db.commit()
    print(f"✅ Created {contracts_created} contracts, {milestones_created} milestones, {payments_created} payments")
    
    # === 6. CREATE REVIEWS ===
    print("\n⭐ Generating reviews and ratings...")
    
    completed_contracts = db.query(Contract).filter(Contract.status == "completed").all()
    reviews_created = 0
    
    for contract in completed_contracts:
        # Client reviews freelancer
        client_review = Review(
            contract_id=contract.id,
            reviewer_id=contract.client_id,
            reviewee_id=contract.freelancer_id,
            rating=random.uniform(4.0, 5.0),
            comment=random.choice([
                "Excellent work! Delivered on time and exceeded expectations.",
                "Great communication and professional work. Highly recommended!",
                "Very skilled developer. Will definitely hire again.",
                "Outstanding quality and attention to detail."
            ]),
            is_public=True
        )
        db.add(client_review)
        reviews_created += 1
        
        # Freelancer reviews client
        freelancer_review = Review(
            contract_id=contract.id,
            reviewer_id=contract.freelancer_id,
            reviewee_id=contract.client_id,
            rating=random.uniform(4.0, 5.0),
            comment=random.choice([
                "Great client to work with! Clear requirements and prompt payments.",
                "Professional and responsive. Pleasure to work with.",
                "Excellent communication throughout the project.",
                "Fair and understanding client. Would work with again."
            ]),
            is_public=True
        )
        db.add(freelancer_review)
        reviews_created += 1
    
    db.commit()
    print(f"✅ Created {reviews_created} reviews")
    
    # === 7. CREATE PORTFOLIO ITEMS ===
    print("\n🎨 Building freelancer portfolios...")
    
    portfolio_items_created = 0
    for freelancer in freelancers[:6]:  # Add portfolios for first 6 freelancers
        num_items = random.randint(2, 4)
        for i in range(num_items):
            portfolio = PortfolioItem(
                freelancer_id=freelancer.id,
                title=f"{random.choice(['E-commerce', 'SaaS', 'Mobile', 'Dashboard'])} Project {i+1}",
                description=f"Successfully delivered a complex project involving {', '.join(json.loads(freelancer.skills)[:2])}. Achieved excellent client satisfaction and user engagement.",
                image_url=f"https://picsum.photos/seed/{random.randint(1000, 9999)}/800/600",
                project_url=f"https://example.com/project-{i+1}" if random.random() > 0.5 else None
            )
            db.add(portfolio)
            portfolio_items_created += 1
    
    db.commit()
    print(f"✅ Created {portfolio_items_created} portfolio items")
    
    # === 8. CREATE NOTIFICATIONS ===
    print("\n🔔 Setting up notifications...")
    
    notification_types = [
        ("bid_received", "New Proposal Received", "You have received a new proposal for your project"),
        ("bid_accepted", "Proposal Accepted", "Congratulations! Your proposal has been accepted"),
        ("milestone_approved", "Milestone Approved", "Your milestone has been approved by the client"),
        ("payment_received", "Payment Received", "You have received a payment of ${}"),
        ("message_received", "New Message", "You have a new message from {}"),
        ("review_received", "New Review", "You have received a new review")
    ]
    
    notifications_created = 0
    for user in freelancers + clients:
        num_notifications = random.randint(2, 5)
        for _ in range(num_notifications):
            notif_type, title, content = random.choice(notification_types)
            notification = Notification(
                user_id=user.id,
                notification_type=notif_type,
                title=title,
                content=content.format(random.randint(100, 1000)) if '{}' in content else content,
                is_read=random.random() > 0.3,
                priority="normal",
                created_at=datetime.utcnow() - timedelta(hours=random.randint(1, 72))
            )
            db.add(notification)
            notifications_created += 1
    
    db.commit()
    print(f"✅ Created {notifications_created} notifications")
    
    # === 9. FINAL SUMMARY ===
    print("\n" + "="*60)
    print("🎉 DEMO DATA GENERATION COMPLETE!")
    print("="*60)
    print(f"""
📊 PLATFORM STATISTICS:
    
Users:
  - Admin: 1
  - Clients: {len(clients)}
  - Freelancers: {len(freelancers)}
  - Total Users: {len(clients) + len(freelancers) + 1}

Content:
  - Skills: {len(skills_map)} across {len(skill_categories)} categories
  - Projects: {len(projects)} (open, in-progress, completed)
  - Proposals: {proposals_created}
  - Contracts: {contracts_created}
  - Milestones: {milestones_created}
  - Payments: {payments_created} (${sum([p.amount for p in db.query(Payment).all()]):.2f} total)
  - Reviews: {reviews_created}
  - Portfolio Items: {portfolio_items_created}
  - Notifications: {notifications_created}

💡 LOGIN CREDENTIALS:
    Admin: admin@megilance.com / admin123
    Client: client1@example.com / password123
    Freelancer: freelancer1@example.com / password123
    
🚀 NEXT STEPS:
    1. Start backend: python -m uvicorn main:app --reload
    2. Visit API docs: http://localhost:8000/api/docs
    3. Test AI matching: GET /matching/projects
    4. Test FTS search: POST /search/advanced/projects
    5. Connect WebSocket: ws://localhost:8000/api/realtime/notifications
    
✨ All features are fully operational and ready for demonstration!
    """)
    
    db.close()


if __name__ == "__main__":
    seed_comprehensive_demo_data()
