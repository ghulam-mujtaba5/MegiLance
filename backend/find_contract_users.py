#!/usr/bin/env python3
"""Find user emails for contract 2"""
import os
import sys
sys.path.insert(0, '/app')

import oracledb

# Connect to database
conn = oracledb.connect(
    user='ADMIN',
    password=os.getenv('DB_PASSWORD', 'MegiLance2024!Oracle'),
    dsn='(description= (retry_count=20)(retry_delay=3)(address=(protocol=tcps)(port=1521)(host=adb.us-ashburn-1.oraclecloud.com))(connect_data=(service_name=g0f61c9a3cf2ae2_megilanceai_high.adb.oraclecloud.com))(security=(ssl_server_dn_match=yes)))'
)

cursor = conn.cursor()

# Query contract 2 with user details
cursor.execute("""
    SELECT 
        c.id, c.project_id, c.status,
        u_client.id, u_client.email, u_client.name, u_client.role,
        u_freelancer.id, u_freelancer.email, u_freelancer.name, u_freelancer.role
    FROM contracts c
    JOIN users u_client ON c.client_id = u_client.id
    JOIN users u_freelancer ON c.freelancer_id = u_freelancer.id
    WHERE c.id = 2
""")

row = cursor.fetchone()
if row:
    print(f"\nContract {row[0]}:")
    print(f"  Project ID: {row[1]}")
    print(f"  Status: {row[2]}")
    print(f"\n  Client:")
    print(f"    ID: {row[3]}")
    print(f"    Email: {row[4]}")
    print(f"    Name: {row[5]}")
    print(f"    Role: {row[6]}")
    print(f"\n  Freelancer:")
    print(f"    ID: {row[7]}")
    print(f"    Email: {row[8]}")
    print(f"    Name: {row[9]}")
    print(f"    Role: {row[10]}")
else:
    print("Contract 2 not found")

cursor.close()
conn.close()
