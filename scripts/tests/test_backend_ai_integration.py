import sys
import os
sys.path.insert(0, 'backend')
os.environ['AI_SERVICE_URL'] = 'https://Megilance-megilance-ai-service.hf.space'

import asyncio
from app.services.vector_embeddings import VectorEmbeddingService

async def test_backend_embeddings():
    service = VectorEmbeddingService()
    
    print("Testing Backend Vector Embedding Service...")
    print(f"AI Service URL: {service.ai_service_url}")
    
    # Test single embedding
    embedding = await service.generate_embedding("Full-stack developer with Python and React")
    print(f"✅ Generated embedding with {len(embedding)} dimensions")
    print(f"   First 5 values: {embedding[:5]}")
    
    # Test profile embedding
    profile_data = {
        'title': 'Senior Python Developer',
        'bio': 'Expert in Django and FastAPI with 7 years experience',
        'skills': ['Python', 'Django', 'FastAPI', 'PostgreSQL']
    }
    profile_embedding = await service.generate_profile_embedding(profile_data)
    print(f"✅ Profile embedding: {len(profile_embedding)} dimensions")
    
    # Test project embedding
    project_data = {
        'title': 'E-commerce Website',
        'description': 'Build a modern e-commerce platform with payment integration',
        'skills_required': ['React', 'Node.js', 'MongoDB', 'Stripe']
    }
    project_embedding = await service.generate_project_embedding(project_data)
    print(f"✅ Project embedding: {len(project_embedding)} dimensions")
    
    print("\n🎉 Backend integration with AI service working!")

if __name__ == "__main__":
    asyncio.run(test_backend_embeddings())
