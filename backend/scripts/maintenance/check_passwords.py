"""Check and fix user passwords in database"""
from app.db.session import get_db
from app.models import User
from app.core.security import get_password_hash
import bcrypt

def check_and_fix_passwords():
    db = next(get_db())
    
    # Check all users
    users = db.query(User).all()
    print(f"\nTotal users: {len(users)}\n")
    
    for user in users:
        print(f"Email: {user.email}")
        print(f"  User Type: {user.user_type}")
        print(f"  Hash (first 40): {user.hashed_password[:40]}...")
        
        # Try to verify with expected passwords
        expected_passwords = {
            "admin@megilance.com": "Admin@123",
            "freelancer1@example.com": "Demo123!",
            "freelancer2@example.com": "Demo123!",
            "freelancer3@example.com": "Demo123!",
            "freelancer4@example.com": "Demo123!",
            "client1@example.com": "Demo123!",
            "client2@example.com": "Demo123!",
            "client3@example.com": "Demo123!",
            "client4@example.com": "Demo123!"
        }
        
        if user.email in expected_passwords:
            password = expected_passwords[user.email]
            try:
                # Try to verify
                if bcrypt.checkpw(password.encode('utf-8'), user.hashed_password.encode('utf-8')):
                    print(f"  ✅ Password verification SUCCESS for {password}")
                else:
                    print(f"  ❌ Password verification FAILED - Fixing...")
                    # Fix the password
                    new_hash = get_password_hash(password)
                    user.hashed_password = new_hash
                    db.commit()
                    print(f"  ✅ Password updated successfully")
            except Exception as e:
                print(f"  ❌ Error: {e}")
                # Fix the password
                new_hash = get_password_hash(password)
                user.hashed_password = new_hash
                db.commit()
                print(f"  ✅ Password updated successfully")
        print()
    
    db.close()

if __name__ == "__main__":
    check_and_fix_passwords()
