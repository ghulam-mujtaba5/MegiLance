"""
Fix admin password in Turso database
"""
import bcrypt
from sqlalchemy import create_engine, text
from app.core.config import get_settings

settings = get_settings()

# Create the correct password hash
password = "password123"
salt = bcrypt.gensalt()
password_hash = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

print(f"New password hash for 'password123': {password_hash}")

# Connect to Turso
engine = create_engine(settings.database_url, connect_args={"check_same_thread": False})

with engine.connect() as conn:
    # Update admin user's password
    result = conn.execute(
        text("UPDATE users SET password_hash = :hash WHERE email = 'admin@megilance.com'"),
        {"hash": password_hash}
    )
    conn.commit()
    
    print(f"✅ Updated {result.rowcount} user(s)")
    
    # Verify
    user = conn.execute(
        text("SELECT email, role FROM users WHERE email = 'admin@megilance.com'")
    ).fetchone()
    
    if user:
        print(f"✅ Verified user exists: {user[0]} ({user[1]})")
    else:
        print("❌ User not found!")

print("\n🔐 Password updated successfully. You can now login with:")
print("   Email: admin@megilance.com")
print("   Password: password123")
