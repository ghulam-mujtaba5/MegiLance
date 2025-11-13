"""Force reseed database with complete demo data"""
from app.db.session import SessionLocal
from app.models.user import User
from app.models.project import Project
from app.models.proposal import Proposal
from app.models.contract import Contract
from app.models.payment import Payment
from app.models.portfolio import PortfolioItem
from app.core.security import get_password_hash
from datetime import datetime, timedelta

db = SessionLocal()

# Clear existing proposals, contracts, payments
print("Clearing existing proposals, contracts, payments...")
db.query(Payment).delete()
db.query(Contract).delete()
db.query(Proposal).delete()
db.query(PortfolioItem).delete()
db.commit()

# Get users
client1 = db.query(User).filter(User.email == 'client1@example.com').first()
client2 = db.query(User).filter(User.email == 'client2@example.com').first()
client3 = db.query(User).filter(User.email == 'client3@example.com').first()
freelancer1 = db.query(User).filter(User.email == 'freelancer1@example.com').first()
freelancer2 = db.query(User).filter(User.email == 'freelancer2@example.com').first()

# Get projects
projects = db.query(Project).all()

if projects and freelancer1 and freelancer2:
    print(f"Creating proposals for {len(projects)} projects...")
    
    # Create proposals
    proposals = [
        Proposal(
            project_id=projects[0].id,
            freelancer_id=freelancer1.id,
            cover_letter="Excited to work on this project. I have 8 years of experience in full-stack development.",
            estimated_hours=120,
            hourly_rate=85.0,
            availability="1-2_weeks",
            status="submitted",
            created_at=datetime.utcnow() - timedelta(days=2),
            updated_at=datetime.utcnow() - timedelta(days=2)
        ),
        Proposal(
            project_id=projects[0].id,
            freelancer_id=freelancer2.id,
            cover_letter="I can deliver exceptional UI/UX design for your project.",
            estimated_hours=80,
            hourly_rate=70.0,
            availability="immediate",
            status="submitted",
            created_at=datetime.utcnow() - timedelta(days=1),
            updated_at=datetime.utcnow() - timedelta(days=1)
        ),
        Proposal(
            project_id=projects[1].id,
            freelancer_id=freelancer1.id,
            cover_letter="I specialize in backend API development with FastAPI and PostgreSQL.",
            estimated_hours=160,
            hourly_rate=85.0,
            availability="immediate",
            status="accepted",
            created_at=datetime.utcnow() - timedelta(days=5),
            updated_at=datetime.utcnow() - timedelta(days=3)
        ),
        Proposal(
            project_id=projects[2].id,
            freelancer_id=freelancer2.id,
            cover_letter="I'll create a beautiful, conversion-optimized landing page.",
            estimated_hours=40,
            hourly_rate=70.0,
            availability="immediate",
            status="accepted",
            created_at=datetime.utcnow() - timedelta(days=10),
            updated_at=datetime.utcnow() - timedelta(days=8)
        ),
    ]
    
    db.add_all(proposals)
    db.commit()
    print(f"✓ Created {len(proposals)} proposals")
    
    # Create contracts
    accepted_proposals = [p for p in proposals if p.status == 'accepted']
    contracts = []
    
    if len(accepted_proposals) >= 2:
        contracts = [
            Contract(
                project_id=accepted_proposals[0].project_id,
                client_id=client1.id,
                freelancer_id=accepted_proposals[0].freelancer_id,
                proposal_id=accepted_proposals[0].id,
                title="Backend API Development Contract",
                description="FastAPI backend development",
                contract_type="hourly",
                hourly_rate=85.0,
                total_amount=13600.0,
                start_date=datetime.utcnow() - timedelta(days=3),
                end_date=datetime.utcnow() + timedelta(days=53),
                status="active",
                terms_and_conditions="Standard freelance contract",
                created_at=datetime.utcnow() - timedelta(days=3),
                updated_at=datetime.utcnow() - timedelta(days=3)
            ),
            Contract(
                project_id=accepted_proposals[1].project_id,
                client_id=client1.id,
                freelancer_id=accepted_proposals[1].freelancer_id,
                proposal_id=accepted_proposals[1].id,
                title="Landing Page Design Contract",
                description="Modern landing page with animations",
                contract_type="fixed",
                total_amount=2800.0,
                start_date=datetime.utcnow() - timedelta(days=8),
                end_date=datetime.utcnow() + timedelta(days=20),
                status="active",
                terms_and_conditions="2 rounds of revisions included",
                created_at=datetime.utcnow() - timedelta(days=8),
                updated_at=datetime.utcnow() - timedelta(days=1)
            )
        ]
        
        db.add_all(contracts)
        db.commit()
        print(f"✓ Created {len(contracts)} contracts")
        
        # Create payments
        payments = [
            Payment(
                contract_id=contracts[0].id,
                payer_id=client1.id,
                payee_id=freelancer1.id,
                amount=4000.0,
                payment_type="milestone",
                status="completed",
                payment_method="stripe",
                transaction_id=f"txn_milestone1_{datetime.utcnow().strftime('%Y%m%d')}",
                description="Milestone 1: API Design & Setup",
                created_at=datetime.utcnow() - timedelta(hours=48),
                updated_at=datetime.utcnow() - timedelta(hours=47)
            ),
            Payment(
                contract_id=contracts[1].id,
                payer_id=client1.id,
                payee_id=freelancer2.id,
                amount=1400.0,
                payment_type="deposit",
                status="completed",
                payment_method="stripe",
                transaction_id=f"txn_deposit_{datetime.utcnow().strftime('%Y%m%d')}",
                description="50% upfront payment",
                created_at=datetime.utcnow() - timedelta(days=7),
                updated_at=datetime.utcnow() - timedelta(days=7)
            ),
            Payment(
                contract_id=contracts[0].id,
                payer_id=client1.id,
                payee_id=freelancer1.id,
                amount=4000.0,
                payment_type="milestone",
                status="pending",
                payment_method="stripe",
                description="Milestone 2: Core Endpoints (pending approval)",
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            ),
        ]
        
        db.add_all(payments)
        db.commit()
        print(f"✓ Created {len(payments)} payments")

    # Create portfolio items
    portfolio_items = [
        PortfolioItem(
            freelancer_id=freelancer1.id,
            title="E-commerce Platform - 500K Users",
            description="Built scalable e-commerce platform with React, Node.js, PostgreSQL",
            image_url="/portfolio/ecommerce.jpg",
            project_url="https://demo-ecommerce.example.com",
            created_at=datetime.utcnow() - timedelta(days=100),
            updated_at=datetime.utcnow() - timedelta(days=100)
        ),
        PortfolioItem(
            freelancer_id=freelancer1.id,
            title="AI Analytics Dashboard",
            description="Real-time analytics with ML predictions. FastAPI + React",
            image_url="/portfolio/analytics.jpg",
            created_at=datetime.utcnow() - timedelta(days=200),
            updated_at=datetime.utcnow() - timedelta(days=200)
        ),
        PortfolioItem(
            freelancer_id=freelancer2.id,
            title="SaaS Design System",
            description="Complete design system with 200+ components, dark mode",
            image_url="/portfolio/design-system.jpg",
            project_url="https://figma.com/designsystem",
            created_at=datetime.utcnow() - timedelta(days=150),
            updated_at=datetime.utcnow() - timedelta(days=150)
        ),
    ]
    
    db.add_all(portfolio_items)
    db.commit()
    print(f"✓ Created {len(portfolio_items)} portfolio items")

print("\n✅ Database seeding complete!")
print(f"""
📊 Summary:
   • Proposals: {db.query(Proposal).count()}
   • Contracts: {db.query(Contract).count()}
   • Payments: {db.query(Payment).count()}
   • Portfolio Items: {db.query(PortfolioItem).count()}
""")

db.close()
