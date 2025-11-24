#!/usr/bin/env python3
"""Update all user passwords with bcrypt 3.2.2 - NO UNICODE"""

import asyncio
import bcrypt
from libsql_client import create_client

async def main():
    print(f"bcrypt version: {bcrypt.__version__}")
    
    # Connect to Turso
    client = create_client(
        url='libsql://megilance-db-megilance.aws-ap-south-1.turso.io',
        auth_token='eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3MzE1MjU5MTEsImlkIjoiZjRhOWI4YmEtMDA1OC00NTJlLWI5OGQtZjJhOTY5YjQwYWIzIn0.0wlJYSrH8E7x6u5VG0KhoPkMBNlrPZwJ0SMpjnvrmZ48jPbM1RoF88C30TbCjTIxVP3kZ3BN4-3YeMmFk9DJCA'
    )
    
    # Password to use for all users
    password = "Password123!"
    print(f"Setting all users to password: {password}")
    print()
    
    # Get all users
    result = await client.execute("SELECT email FROM users")
    
    success_count = 0
    fail_count = 0
    
    for row in result.rows:
        email = row[0]
        
        try:
            # Generate fresh hash with bcrypt 3.2.2
            fresh_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode('utf-8')
            
            # Update in Turso
            await client.execute(
                "UPDATE users SET hashed_password = ? WHERE email = ?",
                [fresh_hash, email]
            )
            
            print(f"[OK] Updated: {email}")
            success_count += 1
            
        except Exception as e:
            print(f"[FAIL] {email}: {e}")
            fail_count += 1
    
    print()
    print(f"Summary: {success_count} successful, {fail_count} failed")
    print(f"All users now use password: {password}")
    
    await client.close()

if __name__ == "__main__":
    asyncio.run(main())
