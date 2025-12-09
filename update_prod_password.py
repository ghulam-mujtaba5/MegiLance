import requests
import json

TURSO_DATABASE_URL = "https://megilance-db-megilance.aws-ap-south-1.turso.io"
TURSO_AUTH_TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NjUyMjY1NTksImlkIjoiZGVmMGE2NzYtMGZiNC00MDAzLTkyNmItMDhlYzA4NjY4MWFkIiwicmlkIjoiYTliOGUwMzctZGQwNi00NTRiLTlmYzgtNGFmMzcxYTg0ODdiIn0.qt4d8AZ587-_i6QWt8f2oUCXuN2w4w0m6YvveN_BSVRFJVH1GM9DL8TuxQfzptpt7HiGBlvGsnbq7zwRrYCyDA"

def execute_query(sql, args=None):
    url = f"{TURSO_DATABASE_URL}/v2/pipeline"
    headers = {
        "Authorization": f"Bearer {TURSO_AUTH_TOKEN}",
        "Content-Type": "application/json"
    }
    
    formatted_args = []
    if args:
        for arg in args:
            if arg is None:
                formatted_args.append({"type": "null", "value": None})
            elif isinstance(arg, int):
                formatted_args.append({"type": "integer", "value": str(arg)})
            elif isinstance(arg, float):
                formatted_args.append({"type": "float", "value": str(arg)})
            else:
                formatted_args.append({"type": "text", "value": str(arg)})
    
    payload = {
        "requests": [
            {
                "type": "execute",
                "stmt": {
                    "sql": sql,
                    "args": formatted_args
                }
            },
            {
                "type": "close"
            }
        ]
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        data = response.json()
        results = data.get("results", [])
        if results and results[0].get("type") == "ok":
            return results[0].get("response", {}).get("result", {})
        else:
            print(f"Error in response: {data}")
            return None
    except Exception as e:
        print(f"Request failed: {e}")
        return None

def update_password(email, new_hash):
    print(f"Updating password for: {email}")
    result = execute_query(
        "UPDATE users SET hashed_password = ? WHERE email = ?",
        [new_hash, email]
    )
    print("Update executed.")

if __name__ == "__main__":
    new_hash = "$2b$12$6Yxro5brPRbI6FSZwQc5.ef44k5ERl.4fxaCqIM7KuV9L/FTahIW6"
    update_password("freelancer1@example.com", new_hash)
