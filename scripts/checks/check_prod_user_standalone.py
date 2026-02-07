import requests
import json

TURSO_DATABASE_URL = "https://megilance-db-megilance.aws-ap-south-1.turso.io" # Note: libsql:// -> https:// for HTTP API
TURSO_AUTH_TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NjUyMjY1NTksImlkIjoiZGVmMGE2NzYtMGZiNC00MDAzLTkyNmItMDhlYzA4NjY4MWFkIiwicmlkIjoiYTliOGUwMzctZGQwNi00NTRiLTlmYzgtNGFmMzcxYTg0ODdiIn0.qt4d8AZ587-_i6QWt8f2oUCXuN2w4w0m6YvveN_BSVRFJVH1GM9DL8TuxQfzptpt7HiGBlvGsnbq7zwRrYCyDA"

def execute_query(sql, args=None):
    url = f"{TURSO_DATABASE_URL}/v2/pipeline"
    headers = {
        "Authorization": f"Bearer {TURSO_AUTH_TOKEN}",
        "Content-Type": "application/json"
    }
    
    # Format args for Turso HTTP API
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
        
        # Extract result from pipeline response
        results = data.get("results", [])
        if results and results[0].get("type") == "ok":
            return results[0].get("response", {}).get("result", {})
        else:
            print(f"Error in response: {data}")
            return None
            
    except Exception as e:
        print(f"Request failed: {e}")
        if hasattr(e, 'response') and e.response:
            print(f"Response content: {e.response.text}")
        return None

def check_user(email):
    print(f"Checking user: {email}")
    result = execute_query(
        "SELECT id, email, is_active, is_verified, user_type, role, hashed_password FROM users WHERE email = ?",
        [email]
    )
    
    if result and result.get("rows"):
        print("User found:")
        cols = [c["name"] for c in result["cols"]]
        for row in result["rows"]:
            data = {}
            for i, val in enumerate(row):
                data[cols[i]] = val["value"]
            print(json.dumps(data, indent=2))
    else:
        print("User NOT found")

if __name__ == "__main__":
    check_user("freelancer1@example.com")
