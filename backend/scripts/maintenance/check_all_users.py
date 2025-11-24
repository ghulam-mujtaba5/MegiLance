from app.core.database import get_turso_client
import json

client = get_turso_client()
result = client.execute('''
    SELECT id, email, role, user_type, joined_at, created_at 
    FROM users 
    WHERE email IN ("admin@megilance.com", "freelancer1@example.com", "client1@example.com")
''')

print("Users in Turso:")
print(json.dumps([dict(zip(['id', 'email', 'role', 'user_type', 'joined_at', 'created_at'], row)) for row in result.rows], indent=2))
