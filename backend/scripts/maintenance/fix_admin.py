from app.core.security import get_password_hash
from app.db.session import SessionLocal
from app.models.user import User

db = SessionLocal()

admin = db.query(User).filter(User.email=='admin@megilance.com').first()
if admin:
    admin.user_type = 'Admin'
    admin.name = 'System Administrator'
    admin.hashed_password = get_password_hash('admin123')
    db.commit()
    print(f"✓ Admin updated: {admin.name} - Type: {admin.user_type}")
else:
    print("❌ Admin not found")

db.close()
