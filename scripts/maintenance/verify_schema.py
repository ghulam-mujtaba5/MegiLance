import sys
sys.path.insert(0, '/app')
from sqlalchemy import inspect
from app.db.session import engine
from app.models.user import User
from app.models.project import Project
from app.models.proposal import Proposal
from app.models.contract import Contract
from app.models.payment import Payment
from app.models.skill import Skill

inspector = inspect(engine)

print("=" * 80)
print("DATABASE SCHEMA VERIFICATION")
print("=" * 80)

# Check all tables exist
tables = inspector.get_table_names()
print(f"\n📋 Tables in database ({len(tables)}):")
for t in sorted(tables):
    print(f"  ✓ {t}")

# Check USERS table structure
print("\n" + "=" * 80)
print("USERS Table Schema:")
print("=" * 80)
cols = inspector.get_columns('USERS')
for c in cols:
    nullable = "NULL" if c['nullable'] else "NOT NULL"
    print(f"  {c['name']:30} {str(c['type']):25} {nullable}")

# Verify primary models can be queried
from app.db.session import get_db
db = next(get_db())

print("\n" + "=" * 80)
print("DATA VERIFICATION:")
print("=" * 80)
print(f"  Users:     {db.query(User).count()}")
print(f"  Skills:    {db.query(Skill).count()}")
print(f"  Projects:  {db.query(Project).count()}")
print(f"  Proposals: {db.query(Proposal).count()}")
print(f"  Contracts: {db.query(Contract).count()}")
print(f"  Payments:  {db.query(Payment).count()}")

print("\n" + "=" * 80)
print("Sample User:")
print("=" * 80)
user = db.query(User).first()
if user:
    print(f"  ID:        {user.id}")
    print(f"  Email:     {user.email}")
    print(f"  Name:      {user.name}")
    print(f"  Type:      {user.user_type}")
    print(f"  Active:    {user.is_active}")
    print(f"  Verified:  {user.is_verified}")

print("\n✅ Schema verification complete!")
