#!/usr/bin/env python3
"""Update all user passwords synchronously - NO ASYNC, NO UNICODE"""

import bcrypt
from libsql_client import create_client_sync

print(f"bcrypt version: {bcrypt.__version__}")

# Connect to Turso (sync)
client = create_client_sync(
    url='libsql://megilance-db-megilance.aws-ap-south-1.turso.io',
    auth_token='eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3MzE1MjU5MTEsImlkIjoiZjRhOWI4YmEtMDA1OC00NTJlLWI5OWQtZjJhOTY5YjQwYWIzIn0.0wlJYSrH8E7x6u5VG0KhoPkMBNlrPZwJ0SMpjnvrmZ48jPbM1RoF88C30TbCjTIxVP3kZ3BN4-3YeMmFk9DJCA'
)

# Password for all users
password = "Password123!"
print(f"Password: {password}")
print()

# Get all users
result = client.execute("SELECT email FROM users")

success_count = 0
fail_count = 0

for row in result.rows:
    email = row[0]
    
    try:
        # Generate fresh hash
        fresh_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode('utf-8')
        
        # Update in Turso
        client.execute(
            "UPDATE users SET hashed_password = ? WHERE email = ?",
            [fresh_hash, email]
        )
        
        print(f"[OK] {email}")
        success_count += 1
        
    except Exception as e:
        print(f"[FAIL] {email}: {e}")
        fail_count += 1

print()
print(f"Success: {success_count}, Failed: {fail_count}")
print(f"All users password: {password}")
