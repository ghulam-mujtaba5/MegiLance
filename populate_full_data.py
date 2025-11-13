import sys
sys.path.insert(0, '/app')
import bcrypt
from datetime import datetime, timedelta
from app.db.session import get_db
from app.models.user import User
from app.models.skill import Skill
from app.models.project import Project
from app.models.proposal import Proposal
from app.models.contract import Contract
from app.models.payment import Payment

db = next(get_db())

# Hash password
hashed = bcrypt.hashpw(b'password123', bcrypt.gensalt()).decode('utf-8')

print("=" * 80)
print("POPULATING COMPLETE DATA SET")
print("=" * 80)

# Clear existing data
print("\n🗑️  Clearing existing data...")
db.query(Payment).delete()
db.query(Contract).delete()
db.query(Proposal).delete()
db.query(Project).delete()
db.query(Skill).delete()
db.query(User).delete()
db.commit()

# 1. Create Users (10 total - mix of clients and freelancers)
print("\n👥 Creating users...")
users = [
    User(email='john.client@example.com', hashed_password=hashed, name='John Client', first_name='John', last_name='Client', 
         role='client', user_type='client', is_active=True, is_verified=True, location='New York, USA', account_balance=5000.0),
    User(email='sarah.client@example.com', hashed_password=hashed, name='Sarah Miller', first_name='Sarah', last_name='Miller',
         role='client', user_type='client', is_active=True, is_verified=True, location='London, UK', account_balance=3000.0),
    User(email='mike.client@example.com', hashed_password=hashed, name='Mike Johnson', first_name='Mike', last_name='Johnson',
         role='client', user_type='client', is_active=True, is_verified=True, location='Toronto, Canada', account_balance=8000.0),
    
    User(email='alex.dev@example.com', hashed_password=hashed, name='Alex Developer', first_name='Alex', last_name='Developer',
         role='freelancer', user_type='freelancer', is_active=True, is_verified=True, hourly_rate=75.0, location='San Francisco, USA',
         bio='Full-stack developer with 8 years experience in React, Node.js, and Python', account_balance=2500.0),
    User(email='emma.design@example.com', hashed_password=hashed, name='Emma Designer', first_name='Emma', last_name='Designer',
         role='freelancer', user_type='freelancer', is_active=True, is_verified=True, hourly_rate=60.0, location='Berlin, Germany',
         bio='UI/UX Designer specializing in modern web and mobile applications', account_balance=1800.0),
    User(email='raj.backend@example.com', hashed_password=hashed, name='Raj Kumar', first_name='Raj', last_name='Kumar',
         role='freelancer', user_type='freelancer', is_active=True, is_verified=True, hourly_rate=85.0, location='Mumbai, India',
         bio='Backend specialist - Python, FastAPI, PostgreSQL, Oracle, MongoDB', account_balance=3200.0),
    User(email='maria.frontend@example.com', hashed_password=hashed, name='Maria Garcia', first_name='Maria', last_name='Garcia',
         role='freelancer', user_type='freelancer', is_active=True, is_verified=True, hourly_rate=70.0, location='Madrid, Spain',
         bio='Frontend expert - React, Next.js, TypeScript, Tailwind CSS', account_balance=1500.0),
    User(email='chen.mobile@example.com', hashed_password=hashed, name='Chen Wei', first_name='Chen', last_name='Wei',
         role='freelancer', user_type='freelancer', is_active=True, is_verified=True, hourly_rate=80.0, location='Singapore',
         bio='Mobile app developer - React Native, Flutter, iOS, Android', account_balance=2100.0),
    User(email='lisa.ai@example.com', hashed_password=hashed, name='Lisa AI Expert', first_name='Lisa', last_name='Smith',
         role='freelancer', user_type='freelancer', is_active=True, is_verified=True, hourly_rate=95.0, location='Boston, USA',
         bio='AI/ML Engineer - Python, TensorFlow, PyTorch, Computer Vision', account_balance=4000.0),
    User(email='admin@megilance.com', hashed_password=hashed, name='Admin User', first_name='Admin', last_name='User',
         role='client', user_type='client', is_active=True, is_verified=True, location='Platform HQ', account_balance=10000.0)
]

for user in users:
    db.add(user)
db.commit()
print(f"✅ Created {len(users)} users")

# 2. Create Skills (15 total)
print("\n🎯 Creating skills...")
skills = [
    Skill(name='React', category='Frontend', description='React.js framework for building user interfaces', is_active=True, sort_order=1),
    Skill(name='Next.js', category='Frontend', description='React framework for production applications', is_active=True, sort_order=2),
    Skill(name='Python', category='Backend', description='Python programming language', is_active=True, sort_order=3),
    Skill(name='FastAPI', category='Backend', description='Modern Python web framework', is_active=True, sort_order=4),
    Skill(name='Node.js', category='Backend', description='JavaScript runtime for server-side development', is_active=True, sort_order=5),
    Skill(name='PostgreSQL', category='Database', description='Advanced open-source relational database', is_active=True, sort_order=6),
    Skill(name='MongoDB', category='Database', description='NoSQL document database', is_active=True, sort_order=7),
    Skill(name='UI/UX Design', category='Design', description='User interface and experience design', is_active=True, sort_order=8),
    Skill(name='Figma', category='Design', description='Collaborative design tool', is_active=True, sort_order=9),
    Skill(name='TypeScript', category='Programming', description='Typed superset of JavaScript', is_active=True, sort_order=10),
    Skill(name='Docker', category='DevOps', description='Container platform', is_active=True, sort_order=11),
    Skill(name='AWS', category='Cloud', description='Amazon Web Services cloud platform', is_active=True, sort_order=12),
    Skill(name='Machine Learning', category='AI', description='AI and machine learning', is_active=True, sort_order=13),
    Skill(name='React Native', category='Mobile', description='Mobile app development framework', is_active=True, sort_order=14),
    Skill(name='Blockchain', category='Web3', description='Blockchain and smart contracts', is_active=True, sort_order=15),
]

for skill in skills:
    db.add(skill)
db.commit()
print(f"✅ Created {len(skills)} skills")

# Get user IDs
john = db.query(User).filter(User.email == 'john.client@example.com').first()
sarah = db.query(User).filter(User.email == 'sarah.client@example.com').first()
mike = db.query(User).filter(User.email == 'mike.client@example.com').first()
alex = db.query(User).filter(User.email == 'alex.dev@example.com').first()
emma = db.query(User).filter(User.email == 'emma.design@example.com').first()
raj = db.query(User).filter(User.email == 'raj.backend@example.com').first()
maria = db.query(User).filter(User.email == 'maria.frontend@example.com').first()
chen = db.query(User).filter(User.email == 'chen.mobile@example.com').first()
lisa = db.query(User).filter(User.email == 'lisa.ai@example.com').first()

# 3. Create Projects (8 total)
print("\n📋 Creating projects...")
projects = [
    Project(title='E-commerce Website Redesign', description='Complete redesign of our e-commerce platform with modern UI/UX',
            category='Web Development', budget_type='Fixed', budget_min=3000, budget_max=5000,
            experience_level='Intermediate', estimated_duration='1-3 months', 
            skills='["React", "Next.js", "TypeScript", "UI/UX Design"]',
            client_id=john.id, status='open', created_at=datetime.utcnow() - timedelta(days=5)),
    
    Project(title='Mobile App for Food Delivery', description='iOS and Android app for restaurant food delivery service',
            category='Mobile Development', budget_type='Fixed', budget_min=8000, budget_max=12000,
            experience_level='Expert', estimated_duration='3-6 months',
            skills='["React Native", "Node.js", "MongoDB"]',
            client_id=sarah.id, status='open', created_at=datetime.utcnow() - timedelta(days=3)),
    
    Project(title='AI Chatbot Integration', description='Integrate AI-powered chatbot into existing customer support system',
            category='AI/ML', budget_type='Hourly', budget_min=50, budget_max=100,
            experience_level='Expert', estimated_duration='1-3 months',
            skills='["Python", "Machine Learning", "FastAPI"]',
            client_id=mike.id, status='open', created_at=datetime.utcnow() - timedelta(days=2)),
    
    Project(title='Backend API Development', description='RESTful API for inventory management system',
            category='Backend Development', budget_type='Fixed', budget_min=2500, budget_max=4000,
            experience_level='Intermediate', estimated_duration='1-2 months',
            skills='["Python", "FastAPI", "PostgreSQL"]',
            client_id=john.id, status='in_progress', created_at=datetime.utcnow() - timedelta(days=15)),
    
    Project(title='Landing Page Design', description='Modern landing page for SaaS product launch',
            category='Design', budget_type='Fixed', budget_min=1200, budget_max=2000,
            experience_level='Entry', estimated_duration='Less than 1 month',
            skills='["UI/UX Design", "Figma", "React"]',
            client_id=sarah.id, status='open', created_at=datetime.utcnow() - timedelta(days=1)),
    
    Project(title='Database Migration to Cloud', description='Migrate on-premise database to AWS RDS',
            category='DevOps', budget_type='Hourly', budget_min=75, budget_max=120,
            experience_level='Expert', estimated_duration='1-2 months',
            skills='["AWS", "PostgreSQL", "Docker"]',
            client_id=mike.id, status='open', created_at=datetime.utcnow() - timedelta(hours=12)),
    
    Project(title='Blockchain Smart Contract', description='Develop and deploy smart contracts for NFT marketplace',
            category='Blockchain', budget_type='Fixed', budget_min=5000, budget_max=8000,
            experience_level='Expert', estimated_duration='2-3 months',
            skills='["Blockchain", "Python", "React"]',
            client_id=john.id, status='open', created_at=datetime.utcnow() - timedelta(hours=6)),
    
    Project(title='Admin Dashboard Development', description='React dashboard with analytics and reporting',
            category='Frontend Development', budget_type='Fixed', budget_min=3500, budget_max=5500,
            experience_level='Intermediate', estimated_duration='1-2 months',
            skills='["React", "TypeScript", "Node.js"]',
            client_id=sarah.id, status='completed', created_at=datetime.utcnow() - timedelta(days=45)),
]

for project in projects:
    db.add(project)
db.commit()
print(f"✅ Created {len(projects)} projects")

# Get project IDs
proj1 = db.query(Project).filter(Project.title == 'E-commerce Website Redesign').first()
proj2 = db.query(Project).filter(Project.title == 'Mobile App for Food Delivery').first()
proj3 = db.query(Project).filter(Project.title == 'AI Chatbot Integration').first()
proj4 = db.query(Project).filter(Project.title == 'Backend API Development').first()
proj5 = db.query(Project).filter(Project.title == 'Landing Page Design').first()
proj6 = db.query(Project).filter(Project.title == 'Database Migration to Cloud').first()
proj7 = db.query(Project).filter(Project.title == 'Admin Dashboard Development').first()

# 4. Create Proposals (12 total)
print("\n📝 Creating proposals...")
proposals = [
    # For E-commerce project
    Proposal(project_id=proj1.id, freelancer_id=alex.id,
             cover_letter='I have 8 years of experience building e-commerce platforms. My recent project increased conversion by 45%.',
             estimated_hours=160, hourly_rate=75.0, bid_amount=160*75.0, availability='immediate',
             status='submitted', created_at=datetime.utcnow() - timedelta(days=4)),
    
    Proposal(project_id=proj1.id, freelancer_id=maria.id,
             cover_letter='Frontend specialist with expertise in React and Next.js. I can deliver a modern, responsive design.',
             estimated_hours=140, hourly_rate=70.0, bid_amount=140*70.0, availability='1-2_weeks',
             status='submitted', created_at=datetime.utcnow() - timedelta(days=3)),
    
    # For Mobile App project
    Proposal(project_id=proj2.id, freelancer_id=chen.id,
             cover_letter='Mobile development expert with 6 published apps. Specialized in food delivery platforms.',
             estimated_hours=320, hourly_rate=80.0, bid_amount=320*80.0, availability='immediate',
             status='accepted', created_at=datetime.utcnow() - timedelta(days=2)),
    
    Proposal(project_id=proj2.id, freelancer_id=alex.id,
             cover_letter='Full-stack developer capable of handling both mobile and backend development.',
             estimated_hours=350, hourly_rate=75.0, bid_amount=350*75.0, availability='1-2_weeks',
             status='submitted', created_at=datetime.utcnow() - timedelta(days=1)),
    
    # For AI Chatbot project
    Proposal(project_id=proj3.id, freelancer_id=lisa.id,
             cover_letter='AI/ML specialist with experience in NLP and chatbot development. Built 5 production chatbots.',
             estimated_hours=200, hourly_rate=95.0, bid_amount=200*95.0, availability='immediate',
             status='submitted', created_at=datetime.utcnow() - timedelta(hours=36)),
    
    Proposal(project_id=proj3.id, freelancer_id=raj.id,
             cover_letter='Backend expert familiar with AI integration. Can build robust API infrastructure.',
             estimated_hours=180, hourly_rate=85.0, bid_amount=180*85.0, availability='1-2_weeks',
             status='submitted', created_at=datetime.utcnow() - timedelta(hours=24)),
    
    # For Backend API project (in progress)
    Proposal(project_id=proj4.id, freelancer_id=raj.id,
             cover_letter='Python/FastAPI specialist. Built 20+ production APIs with PostgreSQL.',
             estimated_hours=120, hourly_rate=85.0, bid_amount=120*85.0, availability='immediate',
             status='accepted', created_at=datetime.utcnow() - timedelta(days=14)),
    
    # For Landing Page project
    Proposal(project_id=proj5.id, freelancer_id=emma.id,
             cover_letter='UI/UX designer with portfolio of 50+ landing pages. Average conversion rate: 8.5%',
             estimated_hours=60, hourly_rate=60.0, bid_amount=60*60.0, availability='immediate',
             status='submitted', created_at=datetime.utcnow() - timedelta(hours=18)),
    
    Proposal(project_id=proj5.id, freelancer_id=maria.id,
             cover_letter='Frontend developer and designer. Can handle both design and implementation.',
             estimated_hours=70, hourly_rate=70.0, bid_amount=70*70.0, availability='immediate',
             status='submitted', created_at=datetime.utcnow() - timedelta(hours=12)),
    
    # For Database Migration project
    Proposal(project_id=proj6.id, freelancer_id=raj.id,
             cover_letter='Experienced with AWS migrations. Migrated 15+ databases to cloud with zero downtime.',
             estimated_hours=100, hourly_rate=85.0, bid_amount=100*85.0, availability='1-2_weeks',
             status='submitted', created_at=datetime.utcnow() - timedelta(hours=8)),
    
    # For completed Dashboard project
    Proposal(project_id=proj7.id, freelancer_id=alex.id,
             cover_letter='Full-stack developer with dashboard expertise. Recent project handles 100K+ users.',
             estimated_hours=150, hourly_rate=75.0, bid_amount=150*75.0, availability='immediate',
             status='accepted', created_at=datetime.utcnow() - timedelta(days=44)),
    
    Proposal(project_id=proj7.id, freelancer_id=maria.id,
             cover_letter='React specialist. Built 10+ admin dashboards with complex data visualization.',
             estimated_hours=160, hourly_rate=70.0, bid_amount=160*70.0, availability='immediate',
             status='submitted', created_at=datetime.utcnow() - timedelta(days=43)),
]

for proposal in proposals:
    db.add(proposal)
db.commit()
print(f"✅ Created {len(proposals)} proposals")

# Get accepted proposals
accepted_mobile = db.query(Proposal).filter(Proposal.project_id == proj2.id, Proposal.status == 'accepted').first()
accepted_backend = db.query(Proposal).filter(Proposal.project_id == proj4.id, Proposal.status == 'accepted').first()
accepted_dashboard = db.query(Proposal).filter(Proposal.project_id == proj7.id, Proposal.status == 'accepted').first()

# 5. Create Contracts (3 total)
print("\n📄 Creating contracts...")
contracts = [
    Contract(project_id=proj2.id, freelancer_id=chen.id, client_id=sarah.id,
             winning_bid_id=accepted_mobile.id, amount=10000.0, contract_amount=10000.0, platform_fee=1000.0,
             status='active', start_date=datetime.utcnow() - timedelta(days=1),
             description='Mobile app development for food delivery platform',
             terms='{"milestones": 4, "payment_schedule": "milestone_based", "revision_rounds": 2}',
             created_at=datetime.utcnow() - timedelta(days=1)),
    
    Contract(project_id=proj4.id, freelancer_id=raj.id, client_id=john.id,
             winning_bid_id=accepted_backend.id, amount=3200.0, contract_amount=3200.0, platform_fee=320.0,
             status='active', start_date=datetime.utcnow() - timedelta(days=13),
             description='Backend API development for inventory system',
             terms='{"milestones": 3, "payment_schedule": "milestone_based", "revision_rounds": 1}',
             created_at=datetime.utcnow() - timedelta(days=13)),
    
    Contract(project_id=proj7.id, freelancer_id=alex.id, client_id=sarah.id,
             winning_bid_id=accepted_dashboard.id, amount=4500.0, contract_amount=4500.0, platform_fee=450.0,
             status='completed', start_date=datetime.utcnow() - timedelta(days=43),
             end_date=datetime.utcnow() - timedelta(days=3),
             description='Admin dashboard with analytics',
             terms='{"milestones": 3, "payment_schedule": "milestone_based", "revision_rounds": 2}',
             created_at=datetime.utcnow() - timedelta(days=43)),
]

for contract in contracts:
    db.add(contract)
db.commit()
print(f"✅ Created {len(contracts)} contracts")

# Get contract IDs
cont_mobile = db.query(Contract).filter(Contract.project_id == proj2.id).first()
cont_backend = db.query(Contract).filter(Contract.project_id == proj4.id).first()
cont_dashboard = db.query(Contract).filter(Contract.project_id == proj7.id).first()

# 6. Create Payments (6 total)
print("\n💰 Creating payments...")
payments = [
    # Completed dashboard - all paid
    Payment(contract_id=cont_dashboard.id, from_user_id=sarah.id, to_user_id=alex.id,
            amount=1500.0, payment_type='project', payment_method='USDC', status='completed',
            transaction_id='TXN-DASH-001', platform_fee=150.0, freelancer_amount=1350.0,
            description='Milestone 1: Design mockups', processed_at=datetime.utcnow() - timedelta(days=40),
            created_at=datetime.utcnow() - timedelta(days=42)),
    
    Payment(contract_id=cont_dashboard.id, from_user_id=sarah.id, to_user_id=alex.id,
            amount=1500.0, payment_type='project', payment_method='USDC', status='completed',
            transaction_id='TXN-DASH-002', platform_fee=150.0, freelancer_amount=1350.0,
            description='Milestone 2: Core functionality', processed_at=datetime.utcnow() - timedelta(days=25),
            created_at=datetime.utcnow() - timedelta(days=27)),
    
    Payment(contract_id=cont_dashboard.id, from_user_id=sarah.id, to_user_id=alex.id,
            amount=1500.0, payment_type='project', payment_method='USDC', status='completed',
            transaction_id='TXN-DASH-003', platform_fee=150.0, freelancer_amount=1350.0,
            description='Milestone 3: Final delivery', processed_at=datetime.utcnow() - timedelta(days=3),
            created_at=datetime.utcnow() - timedelta(days=5)),
    
    # Backend API - 1 payment made, 1 pending
    Payment(contract_id=cont_backend.id, from_user_id=john.id, to_user_id=raj.id,
            amount=1200.0, payment_type='project', payment_method='USDC', status='completed',
            transaction_id='TXN-API-001', platform_fee=120.0, freelancer_amount=1080.0,
            description='Milestone 1: Database schema', processed_at=datetime.utcnow() - timedelta(days=8),
            created_at=datetime.utcnow() - timedelta(days=10)),
    
    Payment(contract_id=cont_backend.id, from_user_id=john.id, to_user_id=raj.id,
            amount=1000.0, payment_type='project', payment_method='USDC', status='pending',
            platform_fee=100.0, freelancer_amount=900.0,
            description='Milestone 2: API endpoints',
            created_at=datetime.utcnow() - timedelta(days=2)),
    
    # Mobile app - deposit payment
    Payment(contract_id=cont_mobile.id, from_user_id=sarah.id, to_user_id=chen.id,
            amount=2500.0, payment_type='project', payment_method='USDC', status='completed',
            transaction_id='TXN-MOB-001', platform_fee=250.0, freelancer_amount=2250.0,
            description='Initial deposit - 25%', processed_at=datetime.utcnow() - timedelta(hours=18),
            created_at=datetime.utcnow() - timedelta(days=1)),
]

for payment in payments:
    db.add(payment)
db.commit()
print(f"✅ Created {len(payments)} payments")

print("\n" + "=" * 80)
print("DATA POPULATION COMPLETE!")
print("=" * 80)
print(f"\n📊 Final counts:")
print(f"  Users:     {db.query(User).count()}")
print(f"  Skills:    {db.query(Skill).count()}")
print(f"  Projects:  {db.query(Project).count()}")
print(f"  Proposals: {db.query(Proposal).count()}")
print(f"  Contracts: {db.query(Contract).count()}")
print(f"  Payments:  {db.query(Payment).count()}")
print("\n✅ Database fully populated with realistic test data!")
