"""Check users in database"""
from app.db.session import get_session_local
from app.models.user import User

SessionLocal = get_session_local()
db = SessionLocal()
users = db.query(User).all()
print(f"\nFound {len(users)} users in database:\n")
for u in users[:10]:
    print(f"  • {u.email:40} | role={u.role:10} | user_type={u.user_type:12} | active={u.is_active}")

db.close()
