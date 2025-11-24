"""
Verify Turso database content
"""
from app.db.session import get_engine, get_session_local
from sqlalchemy import text

print("🔍 Verifying Turso Database...")

engine = get_engine()
SessionLocal = get_session_local()
db = SessionLocal()

try:
    # Count records in key tables
    from app.models import User, Project, Proposal, Contract, Payment
    
    user_count = db.query(User).count()
    project_count = db.query(Project).count()
    proposal_count = db.query(Proposal).count()
    contract_count = db.query(Contract).count()
    payment_count = db.query(Payment).count()
    
    print(f"\n📊 Database Statistics:")
    print(f"  👤 Users: {user_count}")
    print(f"  📋 Projects: {project_count}")
    print(f"  💼 Proposals: {proposal_count}")
    print(f"  📄 Contracts: {contract_count}")
    print(f"  💳 Payments: {payment_count}")
    
    # Show sample users
    print(f"\n👤 Sample Users:")
    users = db.query(User).limit(5).all()
    for user in users:
        print(f"  - {user.email} ({user.user_type})")
    
    print("\n✅ Turso database is working correctly!")
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    
finally:
    db.close()
