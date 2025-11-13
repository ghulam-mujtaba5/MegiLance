from app.core.security import get_password_hash
from app.db.session import SessionLocal
from app.models.user import User

db = SessionLocal()

# Update admin password
admin = db.query(User).filter(User.email=='admin@megilance.com').first()
if admin:
    admin.hashed_password = get_password_hash('admin123')
    db.commit()
    print("✓ Admin password updated to: admin123")
else:
    print("❌ Admin not found")

# Update client1 password
client = db.query(User).filter(User.email=='client1@example.com').first()
if client:
    client.hashed_password = get_password_hash('password123')
    db.commit()
    print("✓ Client1 password updated to: password123")
else:
    print("❌ Client1 not found")

# Update freelancer1 password
freelancer = db.query(User).filter(User.email=='freelancer1@example.com').first()
if freelancer:
    freelancer.hashed_password = get_password_hash('password123')
    db.commit()
    print("✓ Freelancer1 password updated to: password123")
else:
    print("❌ Freelancer1 not found")

db.close()
