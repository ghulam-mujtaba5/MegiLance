import asyncio
import aiohttp
import json

async def test_login():
    url = "http://127.0.0.1:8000/api/auth/login"
    data = {
        "email": "freelancer1@example.com",
        "password": "Password123!"
    }
    
    print(f"Testing login: {data['email']}")
    print(f"POST {url}")
    print(f"Body: {json.dumps(data, indent=2)}\n")
    
    async with aiohttp.ClientSession() as session:
        async with session.post(url, json=data) as response:
            status = response.status
            text = await response.text()
            
            print(f"Status: {status}")
            print(f"Response: {text}\n")
            
            if status == 200:
                print("✅ Login successful!")
                result = json.loads(text)
                print(f"User: {result['user']['name']} ({result['user']['email']})")
                print(f"Role: {result['user']['role']}")
            else:
                print("❌ Login failed!")

asyncio.run(test_login())
