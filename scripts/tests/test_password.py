import os
import sys

os.chdir(r'e:\MegiLance\backend')
sys.path.insert(0, r'e:\MegiLance\backend')

from app.core.security import verify_password, get_password_hash
from app.db.session import get_engine
from sqlalchemy import text

print("=" * 60)
print("Password Verification Test")
print("=" * 60)

# Get the hashed password from database
with get_engine().connect() as conn:
    result = conn.execute(text("SELECT hashed_password FROM users WHERE email = 'client@demo.com'"))
    hashed = result.scalar()

print(f'\nHash from DB: {hashed[:30]}...')

# Test with Password123
test_pass = 'Password123'
is_valid = verify_password(test_pass, hashed)
print(f'verify_password("{test_pass}", hash) = {is_valid}')

# Hash a fresh Password123 for comparison
fresh_hash = get_password_hash(test_pass)
print(f'Fresh hash of Password123: {fresh_hash[:30]}...')
print(f'Are they same? {fresh_hash == hashed}')

if is_valid:
    print("\n✓ Password verification works!")
else:
    print("\n✗ Password verification FAILED!")
    print("This might explain why login fails")

print("\n" + "=" * 60)
