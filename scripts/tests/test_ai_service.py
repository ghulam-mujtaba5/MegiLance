import httpx
import asyncio
import sys

async def test_ai_service():
    url = "https://Megilance-megilance-ai-service.hf.space"
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Test health
            health = await client.get(f"{url}/health")
            print(f"✅ Health Check: {health.json()}")
            
            # Test embeddings
            embed_resp = await client.post(
                f"{url}/ai/embeddings",
                json={"text": "Python developer with React experience"}
            )
            embed_data = embed_resp.json()
            print(f"✅ Embeddings: {embed_data['dimensions']} dimensions via {embed_data['method']}")
            
            # Test generation
            gen_resp = await client.post(
                f"{url}/ai/generate",
                json={"prompt": "Write a brief proposal", "max_length": 100}
            )
            gen_data = gen_resp.json()
            print(f"✅ Generation: {gen_data['text'][:80]}...")
            
            print("\n🎉 All AI service endpoints working!")
            return True
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    result = asyncio.run(test_ai_service())
    sys.exit(0 if result else 1)
