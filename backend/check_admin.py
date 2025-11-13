from app.core.security import verify_password
from app.db.session import SessionLocal
from app.models.user import User

db = SessionLocal()
admin = db.query(User).filter(User.email=='admin@megilance.com').first()

if admin:
    print(f"Admin found: {admin.name}")
    print(f"Email: {admin.email}")
    print(f"Password matches 'admin123': {verify_password('admin123', admin.hashed_password)}")
else:
    print("Admin not found")
