"""Check real users in Turso database - simple direct connection"""
import libsql_experimental as libsql

TURSO_DATABASE_URL = "libsql://megilance-db-megilance.aws-ap-south-1.turso.io"
TURSO_AUTH_TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NjUyMjY1NTksImlkIjoiZGVmMGE2NzYtMGZiNC00MDAzLTkyNmItMDhlYzA4NjY4MWFkIiwicmlkIjoiYTliOGUwMzctZGQwNi00NTRiLTlmYzgtNGFmMzcxYTg0ODdiIn0.qt4d8AZ587-_i6QWt8f2oUCXuN2w4w0m6YvveN_BSVRFJVH1GM9DL8TuxQfzptpt7HiGBlvGsnbq7zwRrYCyDA"

print("=" * 80)
print("🔍 Checking Real Users in Turso Database")
print("=" * 80)

try:
    # Connect to Turso
    url = TURSO_DATABASE_URL.replace("libsql://", "https://")
    conn = libsql.connect("megilance.db", sync_url=url, auth_token=TURSO_AUTH_TOKEN)
    conn.sync()
    
    cursor = conn.cursor()
    
    # Get all users
    cursor.execute("""
        SELECT id, email, full_name, user_type, is_active
        FROM users
        ORDER BY user_type, email
    """)
    
    users = cursor.fetchall()
    
    if not users:
        print("❌ No users found in database!")
    else:
        print(f"✅ Found {len(users)} users:\n")
        
        # Group by user type
        admins = []
        freelancers = []
        clients = []
        
        for user in users:
            user_id, email, full_name, user_type, is_active = user
            user_info = {
                'id': user_id,
                'email': email,
                'name': full_name,
                'type': user_type,
                'active': is_active
            }
            
            if user_type == 'admin':
                admins.append(user_info)
            elif user_type == 'freelancer':
                freelancers.append(user_info)
            elif user_type == 'client':
                clients.append(user_info)
        
        # Display by role
        print("👑 ADMIN ACCOUNTS:")
        if admins:
            for user in admins:
                status = "✓" if user['active'] else "✗"
                print(f"  {status} {user['email']:<40} | {user['name']}")
        else:
            print("  No admin accounts found")
        
        print("\n👨‍💻 FREELANCER ACCOUNTS (showing first 10):")
        if freelancers:
            for user in freelancers[:10]:
                status = "✓" if user['active'] else "✗"
                print(f"  {status} {user['email']:<40} | {user['name']}")
            if len(freelancers) > 10:
                print(f"  ... and {len(freelancers) - 10} more")
        else:
            print("  No freelancer accounts found")
        
        print("\n👔 CLIENT ACCOUNTS (showing first 10):")
        if clients:
            for user in clients[:10]:
                status = "✓" if user['active'] else "✗"
                print(f"  {status} {user['email']:<40} | {user['name']}")
            if len(clients) > 10:
                print(f"  ... and {len(clients) - 10} more")
        else:
            print("  No client accounts found")
        
        # Show recommended test accounts
        print("\n" + "=" * 80)
        print("💡 RECOMMENDED TEST ACCOUNTS FOR QUICK LOGIN:")
        print("=" * 80)
        
        # Find the best test accounts based on TEST_CREDENTIALS.md
        test_accounts = [
            ('admin', 'admin.real@megilance.com'),
            ('freelancer', 'alex.fullstack@megilance.com'),
            ('client', 'sarah.tech@megilance.com')
        ]
        
        print("\nIdeal accounts from TEST_CREDENTIALS.md:")
        for role, email in test_accounts:
            found = next((u for u in users if u[1] == email), None)
            if found:
                print(f"  ✅ {role.upper():<12} | {email:<40} | Active: {found[4]}")
            else:
                print(f"  ❌ {role.upper():<12} | {email:<40} | NOT FOUND")
        
        # Alternative: Show first available account of each type
        print("\nAlternative - First available account per role:")
        if admins:
            print(f"  👑 ADMIN:      {admins[0]['email']}")
        if freelancers:
            print(f"  👨‍💻 FREELANCER: {freelancers[0]['email']}")
        if clients:
            print(f"  👔 CLIENT:     {clients[0]['email']}")
        
        print("\n" + "=" * 80)
        print("📝 NOTE: Check actual passwords in database or TEST_CREDENTIALS.md")
        print("📝 Common test password: Test123!@#")
        print("=" * 80)
    
    conn.close()
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
    print("\n💡 TIP: Run 'pip install libsql-experimental' if not installed")
