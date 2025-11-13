"""Quick database seeding - optimized for speed"""
from app.db.session import SessionLocal
from app.models.user import User
from app.models.proposal import Proposal
from app.models.contract import Contract
from app.models.payment import Payment
from datetime import datetime, timedelta

db = SessionLocal()

print("Quick seeding started...")

# Get users
clients = db.query(User).filter(User.user_type == 'Client').all()
freelancers = db.query(User).filter(User.user_type == 'Freelancer').all()

if not clients or not freelancers:
    print("No users found! Run user seed first.")
    exit(1)

# Clear existing (delete in correct order for foreign keys)
db.query(Payment).delete()
db.query(Contract).delete()
db.query(Proposal).delete()
db.commit()

# Get first project
from app.models.project import Project
projects = db.query(Project).limit(3).all()

if not projects:
    print("No projects found!")
    exit(1)

# Create 3 proposals quickly
proposals = []
for i, proj in enumerate(projects):
    prop = Proposal(
        project_id=proj.id,
        freelancer_id=freelancers[i % len(freelancers)].id,
        cover_letter=f"Quick proposal {i+1}",
        estimated_hours=100,
        hourly_rate=75.0,
        availability="immediate",
        status="submitted",
        created_at=datetime.utcnow()
    )
    proposals.append(prop)

db.add_all(proposals)
db.commit()
print(f"✓ Created {len(proposals)} proposals")

# Create 2 contracts
contracts = []
for i in range(2):
    contract = Contract(
        project_id=projects[i].id,
        client_id=clients[i % len(clients)].id,
        freelancer_id=freelancers[i % len(freelancers)].id,
        proposal_id=proposals[i].id if i < len(proposals) else None,
        title=f"Contract {i+1}",
        description="Quick contract",
        contract_type="fixed",
        total_amount=5000.0,
        start_date=datetime.utcnow(),
        end_date=datetime.utcnow() + timedelta(days=30),
        status="active",
        created_at=datetime.utcnow()
    )
    contracts.append(contract)

db.add_all(contracts)
db.commit()
print(f"✓ Created {len(contracts)} contracts")

# Create 3 payments
payments = []
for i, contract in enumerate(contracts):
    payment = Payment(
        contract_id=contract.id,
        payer_id=contract.client_id,
        payee_id=contract.freelancer_id,
        amount=2500.0,
        payment_type="milestone",
        status="completed",
        payment_method="stripe",
        transaction_id=f"txn_{i}_{datetime.utcnow().timestamp()}",
        description=f"Payment {i+1}",
        created_at=datetime.utcnow()
    )
    payments.append(payment)

db.add_all(payments)
db.commit()
print(f"✓ Created {len(payments)} payments")

db.close()
print("\n✅ Quick seed complete!")
