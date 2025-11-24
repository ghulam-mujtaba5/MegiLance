"""
@AI-HINT: Complete database seeding script for MegiLance platform
Seeds all tables: Users (Admin/Client/Freelancer), Projects, Proposals, Contracts, Payments
"""
import sys
sys.path.insert(0, '/app')

from datetime import datetime, timedelta
from app.db.session import get_session_local
from app.models.user import User
from app.models.project import Project
from app.models.proposal import Proposal
from app.models.contract import Contract
from app.models.payment import Payment
from app.models.portfolio import PortfolioItem
from app.core.security import get_password_hash

SessionLocal = get_session_local()
db = SessionLocal()

try:
    print("🌱 Seeding MegiLance Database...")
    
    # Check if already seeded
    if db.query(User).filter(User.email == "admin@megilance.com").first():
        print("✓ Database already seeded!")
        sys.exit(0)
    
    # ===========================================
    # USERS - Admin, Clients, Freelancers
    # ===========================================
    print("\n👤 Creating Users...")
    
    # Super Admin
    admin = User(
        email="admin@megilance.com",
        hashed_password=get_password_hash("admin123"),
        is_active=True,
        name="System Administrator",
        user_type="Admin",
        bio="Platform administrator with full system access",
        location="Global",
        joined_at=datetime.utcnow()
    )
    
    # Clients
    clients = [
        User(
            email="client1@example.com",
            hashed_password=get_password_hash("password123"),
            is_active=True,
            name="Tech Corp",
            user_type="Client",
            bio="Innovative tech company building next-gen applications",
            location="San Francisco, CA",
            joined_at=datetime.utcnow()
        ),
        User(
            email="client2@example.com",
            hashed_password=get_password_hash("password123"),
            is_active=True,
            name="StartupHub Inc",
            user_type="Client",
            bio="Fast-growing startup seeking talented developers",
            location="Austin, TX",
            joined_at=datetime.utcnow()
        ),
        User(
            email="client3@example.com",
            hashed_password=get_password_hash("password123"),
            is_active=True,
            name="Enterprise Solutions",
            user_type="Client",
            bio="Enterprise software development company",
            location="New York, NY",
            joined_at=datetime.utcnow()
        )
    ]
    
    # Freelancers
    freelancers = [
        User(
            email="freelancer1@example.com",
            hashed_password=get_password_hash("password123"),
            is_active=True,
            name="Alice Johnson",
            user_type="Freelancer",
            bio="Full-stack developer specializing in React, Node.js, and AI integration. 8+ years experience.",
            skills="React,Node.js,Python,FastAPI,PostgreSQL,MongoDB,AWS,Docker",
            hourly_rate=85.0,
            profile_image_url="/avatars/alice.jpg",
            location="San Francisco, CA",
            joined_at=datetime.utcnow() - timedelta(days=365)
        ),
        User(
            email="freelancer2@example.com",
            hashed_password=get_password_hash("password123"),
            is_active=True,
            name="Bob Smith",
            user_type="Freelancer",
            bio="Senior UI/UX designer creating beautiful, accessible interfaces. Expert in Figma and design systems.",
            skills="UI/UX,Figma,Adobe XD,Prototyping,Design Systems,Accessibility",
            hourly_rate=70.0,
            profile_image_url="/avatars/bob.jpg",
            location="New York, NY",
            joined_at=datetime.utcnow() - timedelta(days=300)
        ),
        User(
            email="freelancer3@example.com",
            hashed_password=get_password_hash("password123"),
            is_active=True,
            name="Carol Martinez",
            user_type="Freelancer",
            bio="Machine Learning engineer with expertise in PyTorch, TensorFlow, and LLM fine-tuning.",
            skills="Machine Learning,Python,PyTorch,TensorFlow,NLP,Computer Vision",
            hourly_rate=95.0,
            profile_image_url="/avatars/carol.jpg",
            location="Seattle, WA",
            joined_at=datetime.utcnow() - timedelta(days=200)
        ),
        User(
            email="freelancer4@example.com",
            hashed_password=get_password_hash("password123"),
            is_active=True,
            name="David Chen",
            user_type="Freelancer",
            bio="Blockchain developer specializing in Ethereum, Solidity, and Web3 applications.",
            skills="Blockchain,Solidity,Web3,Ethereum,Smart Contracts,React",
            hourly_rate=100.0,
            profile_image_url="/avatars/david.jpg",
            location="Los Angeles, CA",
            joined_at=datetime.utcnow() - timedelta(days=150)
        ),
        User(
            email="freelancer5@example.com",
            hashed_password=get_password_hash("password123"),
            is_active=True,
            name="Emma Wilson",
            user_type="Freelancer",
            bio="Mobile app developer with React Native and Flutter experience. 50+ apps published.",
            skills="React Native,Flutter,Mobile Development,iOS,Android,TypeScript",
            hourly_rate=75.0,
            profile_image_url="/avatars/emma.jpg",
            location="Miami, FL",
            joined_at=datetime.utcnow() - timedelta(days=400)
        )
    ]
    
    db.add(admin)
    db.add_all(clients)
    db.add_all(freelancers)
    db.commit()
    print(f"✓ Created 1 admin, {len(clients)} clients, {len(freelancers)} freelancers")
    
    # ===========================================
    # PROJECTS
    # ===========================================
    print("\n📋 Creating Projects...")
    
    projects = [
        Project(
            title="AI-Powered Analytics Dashboard",
            description="Build a comprehensive analytics platform with real-time data visualization, ML-based predictions, and automated reporting. Must integrate with PostgreSQL and support 100K+ daily users.",
            category="Web Development",
            budget_type="Fixed",
            budget_min=15000.0,
            budget_max=25000.0,
            experience_level="Expert",
            estimated_duration="4-8 weeks",
            skills="React,Next.js,Python,FastAPI,PostgreSQL,Machine Learning,Data Visualization",
            client_id=clients[0].id,
            status="open",
            created_at=datetime.utcnow() - timedelta(days=5),
            updated_at=datetime.utcnow() - timedelta(days=5)
        ),
        Project(
            title="Mobile Banking App - React Native",
            description="Develop a secure mobile banking application with biometric authentication, real-time transactions, and budget tracking features.",
            category="Mobile Development",
            budget_type="Fixed",
            budget_min=20000.0,
            budget_max=30000.0,
            experience_level="Expert",
            estimated_duration="8-12 weeks",
            skills="React Native,TypeScript,Node.js,Security,Mobile Development",
            client_id=clients[1].id,
            status="open",
            created_at=datetime.utcnow() - timedelta(days=3),
            updated_at=datetime.utcnow() - timedelta(days=3)
        ),
        Project(
            title="NFT Marketplace Platform",
            description="Create a Web3 NFT marketplace with smart contracts, wallet integration, and auction features. Built on Ethereum blockchain.",
            category="Blockchain",
            budget_type="Fixed",
            budget_min=30000.0,
            budget_max=45000.0,
            experience_level="Expert",
            estimated_duration="8-12 weeks",
            skills="Blockchain,Solidity,Web3,React,Smart Contracts,Ethereum",
            client_id=clients[2].id,
            status="open",
            created_at=datetime.utcnow() - timedelta(days=7),
            updated_at=datetime.utcnow() - timedelta(days=7)
        ),
        Project(
            title="SaaS Product Landing Page Redesign",
            description="Modern, conversion-optimized landing page with animations, A/B testing setup, and mobile-first design.",
            category="UI/UX Design",
            budget_type="Fixed",
            budget_min=3000.0,
            budget_max=5000.0,
            experience_level="Intermediate",
            estimated_duration="1-4 weeks",
            skills="UI/UX,Figma,Web Design,Responsive Design",
            client_id=clients[0].id,
            status="in_progress",
            created_at=datetime.utcnow() - timedelta(days=20),
            updated_at=datetime.utcnow() - timedelta(days=1)
        ),
        Project(
            title="E-commerce Backend API - FastAPI",
            description="Build scalable REST API for e-commerce platform with inventory management, payment processing, and order tracking.",
            category="Backend Development",
            budget_type="Hourly",
            budget_min=50.0,
            budget_max=80.0,
            experience_level="Intermediate",
            estimated_duration="4-8 weeks",
            skills="Python,FastAPI,PostgreSQL,Redis,Docker,AWS",
            client_id=clients[1].id,
            status="open",
            created_at=datetime.utcnow() - timedelta(days=2),
            updated_at=datetime.utcnow() - timedelta(days=2)
        ),
        Project(
            title="AI Chatbot with GPT Integration",
            description="Develop intelligent customer service chatbot using OpenAI GPT-4, with context awareness and multi-language support.",
            category="AI/ML",
            budget_type="Fixed",
            budget_min=8000.0,
            budget_max=12000.0,
            experience_level="Expert",
            estimated_duration="4-8 weeks",
            skills="Python,Machine Learning,OpenAI,NLP,FastAPI",
            client_id=clients[2].id,
            status="open",
            created_at=datetime.utcnow() - timedelta(days=1),
            updated_at=datetime.utcnow() - timedelta(days=1)
        ),
        Project(
            title="DevOps Pipeline Setup - CI/CD",
            description="Configure complete DevOps pipeline with Docker, Kubernetes, GitHub Actions, and monitoring tools.",
            category="DevOps",
            budget_type="Hourly",
            budget_min=60.0,
            budget_max=90.0,
            experience_level="Expert",
            estimated_duration="1-4 weeks",
            skills="Docker,Kubernetes,AWS,CI/CD,Terraform,Monitoring",
            client_id=clients[0].id,
            status="completed",
            created_at=datetime.utcnow() - timedelta(days=60),
            updated_at=datetime.utcnow() - timedelta(days=30)
        ),
        Project(
            title="iOS Fitness Tracking App",
            description="Native iOS app for fitness tracking with HealthKit integration, workout plans, and social features.",
            category="Mobile Development",
            budget_type="Fixed",
            budget_min=12000.0,
            budget_max=18000.0,
            experience_level="Intermediate",
            estimated_duration="8-12 weeks",
            skills="iOS,Swift,HealthKit,Mobile Development,UI/UX",
            client_id=clients[1].id,
            status="open",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
    ]
    
    db.add_all(projects)
    db.commit()
    print(f"✓ Created {len(projects)} projects")
    
    # ===========================================
    # PROPOSALS
    # ===========================================
    print("\n💼 Creating Proposals...")
    
    proposals = [
        # Project 1 (AI Analytics Dashboard) - 3 proposals
        Proposal(
            project_id=projects[0].id,
            freelancer_id=freelancers[0].id,
            cover_letter="I'm excited about this AI analytics project. With 8 years of full-stack experience and deep expertise in React, FastAPI, and ML integration, I've built similar dashboards handling 500K+ users. I can deliver a scalable, real-time solution with predictive analytics.",
            estimated_hours=320,
            hourly_rate=85.0,
            bid_amount=320 * 85.0,
            availability="1-2_weeks",
            status="submitted",
            created_at=datetime.utcnow() - timedelta(days=4),
            updated_at=datetime.utcnow() - timedelta(days=4)
        ),
        Proposal(
            project_id=projects[0].id,
            freelancer_id=freelancers[2].id,
            cover_letter="As an ML engineer, I specialize in building AI-powered analytics systems. I'll implement advanced prediction models using PyTorch and create interactive visualizations with D3.js. My solutions are optimized for high-traffic applications.",
            estimated_hours=280,
            hourly_rate=95.0,
            bid_amount=280 * 95.0,
            availability="immediate",
            status="submitted",
            created_at=datetime.utcnow() - timedelta(days=3),
            updated_at=datetime.utcnow() - timedelta(days=3)
        ),
        
        # Project 2 (Mobile Banking App) - 2 proposals
        Proposal(
            project_id=projects[1].id,
            freelancer_id=freelancers[4].id,
            cover_letter="I've published 50+ React Native apps, including 3 fintech applications. I'm well-versed in biometric authentication, secure storage, and banking regulations. I can deliver a production-ready app with comprehensive security measures.",
            estimated_hours=480,
            hourly_rate=75.0,
            bid_amount=480 * 75.0,
            availability="1-2_weeks",
            status="accepted",
            created_at=datetime.utcnow() - timedelta(days=2),
            updated_at=datetime.utcnow() - timedelta(days=1)
        ),
        
        # Project 3 (NFT Marketplace) - 2 proposals
        Proposal(
            project_id=projects[2].id,
            freelancer_id=freelancers[3].id,
            cover_letter="As a blockchain specialist, I've developed 5 NFT marketplaces on Ethereum. I'll implement gas-optimized smart contracts, IPFS storage, and seamless wallet integration. My code passes rigorous security audits.",
            estimated_hours=400,
            hourly_rate=100.0,
            bid_amount=400 * 100.0,
            availability="immediate",
            status="submitted",
            created_at=datetime.utcnow() - timedelta(days=6),
            updated_at=datetime.utcnow() - timedelta(days=6)
        ),
        
        # Project 4 (Landing Page) - 2 proposals
        Proposal(
            project_id=projects[3].id,
            freelancer_id=freelancers[1].id,
            cover_letter="I'll create a stunning, high-converting landing page with modern animations and mobile-first design. My designs have improved client conversion rates by 40% on average. Includes A/B testing setup and analytics integration.",
            estimated_hours=60,
            hourly_rate=70.0,
            bid_amount=60 * 70.0,
            availability="immediate",
            status="accepted",
            created_at=datetime.utcnow() - timedelta(days=19),
            updated_at=datetime.utcnow() - timedelta(days=18)
        ),
        
        # Project 5 (E-commerce API) - 3 proposals
        Proposal(
            project_id=projects[4].id,
            freelancer_id=freelancers[0].id,
            cover_letter="I specialize in building scalable FastAPI backends. I'll implement a robust e-commerce API with Redis caching, async operations, and comprehensive testing. Includes Docker setup and CI/CD pipeline.",
            estimated_hours=200,
            hourly_rate=85.0,
            bid_amount=200 * 85.0,
            availability="1-2_weeks",
            status="submitted",
            created_at=datetime.utcnow() - timedelta(days=1),
            updated_at=datetime.utcnow() - timedelta(days=1)
        ),
        
        # Project 6 (AI Chatbot) - 2 proposals
        Proposal(
            project_id=projects[5].id,
            freelancer_id=freelancers[2].id,
            cover_letter="I've built 10+ AI chatbots using GPT-4 and custom fine-tuned models. I'll create an intelligent, context-aware chatbot with multi-language support and seamless integration with your existing systems.",
            estimated_hours=160,
            hourly_rate=95.0,
            bid_amount=160 * 95.0,
            availability="immediate",
            status="submitted",
            created_at=datetime.utcnow() - timedelta(hours=12),
            updated_at=datetime.utcnow() - timedelta(hours=12)
        ),
    ]
    
    db.add_all(proposals)
    db.commit()
    print(f"✓ Created {len(proposals)} proposals")
    
    # ===========================================
    # CONTRACTS
    # ===========================================
    print("\n📄 Creating Contracts...")
    
    # Get accepted proposals
    accepted_proposal_1 = proposals[3]  # Mobile Banking App
    accepted_proposal_2 = proposals[5]  # Landing Page
    
    contracts = [
        Contract(
            project_id=accepted_proposal_1.project_id,
            client_id=clients[1].id,
            freelancer_id=accepted_proposal_1.freelancer_id,
            winning_bid_id=accepted_proposal_1.id,
            description="Development of secure mobile banking application with biometric authentication",
            amount=36000.0,
            contract_amount=36000.0,
            start_date=datetime.utcnow() - timedelta(days=1),
            end_date=datetime.utcnow() + timedelta(days=83),
            status="active",
            terms="Standard freelance contract with NDA. Payment upon milestone completion.",
            created_at=datetime.utcnow() - timedelta(days=1),
            updated_at=datetime.utcnow() - timedelta(days=1)
        ),
        Contract(
            project_id=accepted_proposal_2.project_id,
            client_id=clients[0].id,
            freelancer_id=accepted_proposal_2.freelancer_id,
            winning_bid_id=accepted_proposal_2.id,
            description="Modern landing page redesign with A/B testing",
            amount=4200.0,
            contract_amount=4200.0,
            start_date=datetime.utcnow() - timedelta(days=18),
            end_date=datetime.utcnow() + timedelta(days=10),
            status="active",
            terms="2 rounds of revisions included. Source files provided.",
            created_at=datetime.utcnow() - timedelta(days=18),
            updated_at=datetime.utcnow() - timedelta(days=1)
        ),
        Contract(
            project_id=projects[6].id,
            client_id=clients[0].id,
            freelancer_id=freelancers[0].id,
            winning_bid_id=None,
            description="Complete CI/CD pipeline with Kubernetes and monitoring",
            amount=12750.0,
            contract_amount=12750.0,
            start_date=datetime.utcnow() - timedelta(days=60),
            end_date=datetime.utcnow() - timedelta(days=30),
            status="completed",
            terms="Hourly billing. 150 hours approved.",
            created_at=datetime.utcnow() - timedelta(days=60),
            updated_at=datetime.utcnow() - timedelta(days=30)
        )
    ]
    
    db.add_all(contracts)
    db.commit()
    print(f"✓ Created {len(contracts)} contracts")
    
    # ===========================================
    # PAYMENTS
    # ===========================================
    print("\n💳 Creating Payments...")
    
    payments = [
        # Contract 1 (Mobile Banking) - Milestone payment
        Payment(
            contract_id=contracts[0].id,
            from_user_id=clients[1].id,
            to_user_id=freelancers[4].id,
            amount=12000.0,
            freelancer_amount=12000.0 * 0.9, # 10% fee
            platform_fee=12000.0 * 0.1,
            payment_type="milestone",
            status="completed",
            payment_method="stripe",
            transaction_id="txn_mobile_milestone1_" + datetime.utcnow().strftime("%Y%m%d"),
            description="Milestone 1: UI Design & Authentication - Mobile Banking App",
            created_at=datetime.utcnow() - timedelta(hours=6),
            updated_at=datetime.utcnow() - timedelta(hours=5)
        ),
        
        # Contract 2 (Landing Page) - Deposit
        Payment(
            contract_id=contracts[1].id,
            from_user_id=clients[0].id,
            to_user_id=freelancers[1].id,
            amount=2100.0,
            freelancer_amount=2100.0 * 0.9,
            platform_fee=2100.0 * 0.1,
            payment_type="deposit",
            status="completed",
            payment_method="stripe",
            transaction_id="txn_landing_deposit_" + datetime.utcnow().strftime("%Y%m%d"),
            description="50% upfront payment - Landing Page Design",
            created_at=datetime.utcnow() - timedelta(days=17),
            updated_at=datetime.utcnow() - timedelta(days=17)
        ),
        
        # Contract 3 (DevOps) - Final payment (completed project)
        Payment(
            contract_id=contracts[2].id,
            from_user_id=clients[0].id,
            to_user_id=freelancers[0].id,
            amount=12750.0,
            freelancer_amount=12750.0 * 0.9,
            platform_fee=12750.0 * 0.1,
            payment_type="project", # "full" is not in Enum, using "project"
            status="completed",
            payment_method="stripe",
            transaction_id="txn_devops_final_" + datetime.utcnow().strftime("%Y%m%d"),
            description="Final payment for DevOps Pipeline Setup - 150 hours",
            created_at=datetime.utcnow() - timedelta(days=30),
            updated_at=datetime.utcnow() - timedelta(days=30)
        ),
        
        # Pending payment
        Payment(
            contract_id=contracts[1].id,
            from_user_id=clients[0].id,
            to_user_id=freelancers[1].id,
            amount=2100.0,
            freelancer_amount=2100.0 * 0.9,
            platform_fee=2100.0 * 0.1,
            payment_type="project", # "final" is not in Enum
            status="pending",
            payment_method="stripe",
            description="Final 50% payment - Landing Page Design (pending client approval)",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
    ]
    
    db.add_all(payments)
    db.commit()
    print(f"✓ Created {len(payments)} payments")
    
    # ===========================================
    # PORTFOLIO ITEMS
    # ===========================================
    print("\n🎨 Creating Portfolio Items...")
    
    portfolio_items = [
        PortfolioItem(
            freelancer_id=freelancers[0].id,
            title="AI Analytics Platform - Fortune 500",
            description="Built real-time analytics dashboard processing 10M+ events/day with ML predictions. Stack: React, FastAPI, PostgreSQL, Redis.",
            image_url="/portfolio/analytics-dashboard.jpg",
            project_url="https://demo-analytics.example.com",
            created_at=datetime.utcnow() - timedelta(days=100),
            updated_at=datetime.utcnow() - timedelta(days=100)
        ),
        PortfolioItem(
            freelancer_id=freelancers[0].id,
            title="E-commerce Microservices Architecture",
            description="Scalable e-commerce backend with 15 microservices, handling 100K orders/day. Docker + Kubernetes.",
            image_url="/portfolio/ecommerce-backend.jpg",
            created_at=datetime.utcnow() - timedelta(days=200),
            updated_at=datetime.utcnow() - timedelta(days=200)
        ),
        PortfolioItem(
            freelancer_id=freelancers[1].id,
            title="SaaS Product Design System",
            description="Complete design system with 200+ components, dark mode, accessibility focus. Used by 50+ developers.",
            image_url="/portfolio/design-system.jpg",
            project_url="https://figma.com/designsystem",
            created_at=datetime.utcnow() - timedelta(days=150),
            updated_at=datetime.utcnow() - timedelta(days=150)
        ),
        PortfolioItem(
            freelancer_id=freelancers[2].id,
            title="Computer Vision Product Categorization",
            description="ML model for automatic product categorization with 97% accuracy. PyTorch + FastAPI deployment.",
            image_url="/portfolio/cv-model.jpg",
            created_at=datetime.utcnow() - timedelta(days=80),
            updated_at=datetime.utcnow() - timedelta(days=80)
        ),
        PortfolioItem(
            freelancer_id=freelancers[3].id,
            title="DeFi Lending Protocol",
            description="Decentralized lending platform with $10M+ TVL. Solidity smart contracts audited by CertiK.",
            image_url="/portfolio/defi-platform.jpg",
            project_url="https://defi-demo.example.com",
            created_at=datetime.utcnow() - timedelta(days=120),
            updated_at=datetime.utcnow() - timedelta(days=120)
        ),
        PortfolioItem(
            freelancer_id=freelancers[4].id,
            title="Healthcare Telemedicine App",
            description="HIPAA-compliant telemedicine app with video consultations. React Native + WebRTC. 500K+ users.",
            image_url="/portfolio/telemedicine-app.jpg",
            created_at=datetime.utcnow() - timedelta(days=180),
            updated_at=datetime.utcnow() - timedelta(days=180)
        )
    ]
    
    db.add_all(portfolio_items)
    db.commit()
    print(f"✓ Created {len(portfolio_items)} portfolio items")
    
    # ===========================================
    # SUMMARY
    # ===========================================
    print("\n" + "="*60)
    print("✅ DATABASE SEEDING COMPLETE!")
    print("="*60)
    print(f"""
📊 Created:
   • 1 Admin user (admin@megilance.com / admin123)
   • {len(clients)} Client users
   • {len(freelancers)} Freelancer users
   • {len(projects)} Projects (open, in-progress, completed)
   • {len(proposals)} Proposals (submitted, accepted)
   • {len(contracts)} Contracts (active, completed)
   • {len(payments)} Payments (completed, pending)
   • {len(portfolio_items)} Portfolio items

🔑 Test Credentials:
   Admin:      admin@megilance.com / admin123
   Client:     client1@example.com / password123
   Freelancer: freelancer1@example.com / password123
""")
    
except Exception as e:
    print(f"\n❌ Error seeding database: {str(e)}")
    import traceback
    traceback.print_exc()
    db.rollback()
finally:
    db.close()
