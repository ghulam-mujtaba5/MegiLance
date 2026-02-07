import requests
import json

TURSO_DATABASE_URL = 'https://megilance-db-megilance.aws-ap-south-1.turso.io'
TURSO_AUTH_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NjUyMjY1NTksImlkIjoiZGVmMGE2NzYtMGZiNC00MDAzLTkyNmItMDhlYzA4NjY4MWFkIiwicmlkIjoiYTliOGUwMzctZGQwNi00NTRiLTlmYzgtNGFmMzcxYTg0ODdiIn0.qt4d8AZ587-_i6QWt8f2oUCXuN2w4w0m6YvveN_BSVRFJVH1GM9DL8TuxQfzptpt7HiGBlvGsnbq7zwRrYCyDA'

payload = {
    'requests': [
        {'type': 'execute', 'stmt': {'sql': "SELECT id, email, is_active, user_type, role, hashed_password FROM users WHERE email LIKE '%admin%' OR user_type = 'Admin' OR role = 'admin'", 'args': []}},
        {'type': 'close'}
    ]
}

response = requests.post(f'{TURSO_DATABASE_URL}/v2/pipeline', json=payload, headers={'Authorization': f'Bearer {TURSO_AUTH_TOKEN}', 'Content-Type': 'application/json'})
data = response.json()

results = data.get('results', [])
if results and results[0].get('type') == 'ok':
    result = results[0].get('response', {}).get('result', {})
    if result.get('rows'):
        print('Admin users FOUND:')
        cols = [c['name'] for c in result['cols']]
        for row in result['rows']:
            user_data = {}
            for i, val in enumerate(row):
                user_data[cols[i]] = val.get('value', 'NULL')
            print(json.dumps(user_data, indent=2))
    else:
        print('NO ADMIN USERS FOUND')
else:
    print('Query failed:', data)
