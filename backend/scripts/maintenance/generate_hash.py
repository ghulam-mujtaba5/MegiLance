"""
Generate correct hash for Admin@123
"""
import bcrypt

password = "Admin@123"
print(f"Password: {password}")

# Generate new hash
new_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
print(f"New hash: {new_hash.decode('utf-8')}")

# Verify it works
result = bcrypt.checkpw(password.encode('utf-8'), new_hash)
print(f"Verification: {result}")
