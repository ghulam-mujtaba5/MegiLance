"""Test AI service integration with Hugging Face."""
import os
import asyncio
import httpx

os.environ["AI_SERVICE_URL"] = "https://Megilance-megilance-ai-service.hf.space"

async def test_ai_service():
    ai_service_url = os.getenv("AI_SERVICE_URL")
    print(f"Testing AI Service at: {ai_service_url}")
    
    try:
        async with httpx.AsyncClient() as client:
            # Test health endpoint
            print("\n1. Testing health endpoint...")
            response = await client.get(f"{ai_service_url}/health", timeout=10.0)
            print(f"Health check: {response.status_code}")
            print(f"Response: {response.json()}")
            
            # Test AI generation
            print("\n2. Testing AI generation...")
            prompt = "How can I find the best freelancers on MegiLance?"
            response = await client.post(
                f"{ai_service_url}/ai/generate",
                json={"prompt": prompt, "max_length": 100},
                timeout=30.0
            )
            print(f"Generate status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"Method: {data.get('method')}")
                print(f"Response: {data.get('text', 'No text')}")
            else:
                print(f"Error: {response.text}")
                
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_ai_service())
