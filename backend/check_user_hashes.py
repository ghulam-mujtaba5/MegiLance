#!/usr/bin/env python3
"""Check password hashes for specific users in Turso"""

from libsql_client import create_client_sync
import bcrypt

# Turso connection
client = create_client_sync(
    url='libsql://megilance-db-megilance.aws-ap-south-1.turso.io',
    auth_token='eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3MzE1MjU5MTEsImlkIjoiZjRhOWI4YmEtMDA1OC00NTJlLWI5OGQtZjJhOTY5YjQwYWIzIn0.0wlJYSrH8E7x6u5VG0KhoPkMBNlrPZwJ0SMpjnvrmZ48jPbM1RoF88C30TbCjTIxVP3kZ3BN4-3YeMmFk9DJCA'
)

print(f"bcrypt version: {bcrypt.__version__}")
print()

# Test password
password = "Password123!"

# Check specific users
emails = ['admin@megilance.com', 'client1@example.com', 'freelancer1@example.com']
result = client.execute(
    'SELECT email, hashed_password FROM users WHERE email IN (?, ?, ?)',
    emails
)

for row in result.rows:
    email = row[0]
    stored_hash = row[1]
    
    # Test verification
    try:
        can_verify = bcrypt.checkpw(password.encode(), stored_hash.encode())
        status = "✅ VALID" if can_verify else "❌ INVALID"
    except Exception as e:
        status = f"❌ ERROR: {e}"
    
    hash_preview = stored_hash[:60] + "..." if len(stored_hash) > 60 else stored_hash
    print(f"{email}:")
    print(f"  Hash: {hash_preview}")
    print(f"  Verification: {status}")
    print()

print(f"\nAll users should verify successfully with password: {password}")
