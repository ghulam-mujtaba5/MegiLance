"""
Test Turso API via direct HTTP requests
"""
import asyncio
import aiohttp
import json
from app.core.config import get_settings

async def test_turso_http():
    settings = get_settings()
    url = settings.turso_database_url.replace('libsql://', 'https://') 
    print(f"🔍 Testing Turso via HTTP")
    print(f"   URL: {url}")
    
    # Prepare SQL query
    sql = "SELECT id, email, hashed_password, name, role, is_active FROM users WHERE email = ?"
    params = ["admin@megilance.com"]
    
    # Make HTTP request to Turso
    async with aiohttp.ClientSession() as session:
        async with session.post(
            url,
            headers={
                "Authorization": f"Bearer {settings.turso_auth_token}",
                "Content-Type": "application/json"
            },
            json={
                "statements": [{
                    "q": sql,
                    "params": params
                }]
            }
        ) as response:
            print(f"\n📡 Response status: {response.status}")
            text = await response.text()
            print(f"   Response body: {text[:500]}...")
            
            if response.status == 200:
                data = json.loads(text)
                print(f"\n✅ Response JSON:")
                print(json.dumps(data, indent=2))
                
                # Try to extract results
                if isinstance(data, list) and len(data) > 0:
                    result = data[0]
                    if "results" in result:
                        rows = result["results"].get("rows", [])
                        if rows:
                            row = rows[0]
                            print(f"\n✅ ✅ User found:")
                            print(f"   Hash: {row[2]}")
                    elif "error" in result:
                        print(f"❌ Error: {result['error']}")
            else:
                print(f"❌ HTTP error: {response.status}")

if __name__ == "__main__":
    asyncio.run(test_turso_http())
