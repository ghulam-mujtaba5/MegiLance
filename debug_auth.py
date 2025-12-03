import sqlite3
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    if isinstance(hashed_password, bytes):
        hashed_password = hashed_password.decode('utf-8')
    return pwd_context.verify(plain_password, hashed_password)

def debug_auth():
    conn = sqlite3.connect('backend/local_dev.db')
    cursor = conn.cursor()
    
    cursor.execute("SELECT email, hashed_password FROM users WHERE email = 'admin@megilance.com'")
    row = cursor.fetchone()
    
    if row:
        email, hashed = row
        print(f"User: {email}")
        print(f"Hashed Password (DB): {hashed}")
        print(f"Type: {type(hashed)}")
        
        test_pass = "Password123!"
        is_valid = verify_password(test_pass, hashed)
        print(f"Verify '{test_pass}': {is_valid}")
        
        # Generate new hash to compare
        new_hash = pwd_context.hash(test_pass)
        print(f"New Hash for '{test_pass}': {new_hash}")
        
    else:
        print("User not found")
        
    conn.close()

if __name__ == "__main__":
    debug_auth()
