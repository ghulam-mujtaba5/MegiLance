"""Test password verification"""
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# The hash in Turso for freelancer1
hash_in_db = "$2b$12$/a7xuoKlIJ7wI0GZuDpFFetKHbmOlAt7fJqR6nhQ1lW67KV/s.8Ea"
password = "Password123!"

print(f"Testing password verification...")
print(f"Password: {password}")
print(f"Hash: {hash_in_db[:30]}...")

try:
    result = pwd_context.verify(password, hash_in_db)
    print(f"✅ Verification result: {result}")
except Exception as e:
    print(f"❌ Error during verification: {e}")
    import traceback
    traceback.print_exc()

# Also test creating a new hash
print(f"\nCreating new hash...")
try:
    new_hash = pwd_context.hash(password)
    print(f"✅ New hash created: {new_hash[:30]}...")
    verify_new = pwd_context.verify(password, new_hash)
    print(f"✅ New hash verifies: {verify_new}")
except Exception as e:
    print(f"❌ Error creating hash: {e}")
    import traceback
    traceback.print_exc()
