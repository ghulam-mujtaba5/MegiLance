"""
Vector Embedding Service
Generates vector embeddings for text using the external AI microservice.
Uses all-MiniLM-L6-v2 (384 dimensions) via the /ai/embeddings endpoint.
"""

import logging
from typing import List, Optional
import os
import httpx

logger = logging.getLogger(__name__)

class VectorEmbeddingService:
    def __init__(self):
        self.ai_service_url = os.getenv("AI_SERVICE_URL", "http://localhost:7860")

    async def generate_embedding(self, text: str) -> List[float]:
        """
        Generate a vector embedding for the given text by calling the AI service.
        Returns a list of floats (the vector).
        """
        if not text:
            return []
            
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.ai_service_url}/ai/embeddings",
                    json={"text": text},
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return data.get("embedding", [])
                else:
                    logger.error(f"AI Service returned {response.status_code}: {response.text}")
                    # Fallback to mock if AI service is down (to prevent app crash)
                    return self._generate_mock_embedding(text)
                    
        except Exception as e:
            logger.error(f"Error generating embedding: {e}")
            return self._generate_mock_embedding(text)

    def _generate_mock_embedding(self, text: str) -> List[float]:
        """Fallback mock embedding (deterministic hash)"""
        import hashlib
        hash_object = hashlib.md5(text.encode())
        hash_int = int(hash_object.hexdigest(), 16)
        
        # Generate pseudo-random vector (384 dimensions to match MiniLM)
        vector = []
        for i in range(384):
            val = ((hash_int >> (i % 16)) & 1) * 2 - 1 # -1 or 1
            vector.append(float(val) * 0.01)
        return vector

    async def generate_profile_embedding(self, profile_data: dict) -> List[float]:
        """
        Generate a combined embedding for a user profile.
        Combines skills, bio, and title.
        """
        text_parts = [
            profile_data.get('title', ''),
            profile_data.get('bio', ''),
            " ".join(profile_data.get('skills', []))
        ]
        combined_text = " ".join(filter(None, text_parts))
        return await self.generate_embedding(combined_text)

    async def generate_project_embedding(self, project_data: dict) -> List[float]:
        """
        Generate a combined embedding for a project.
        Combines title, description, and required skills.
        """
        text_parts = [
            project_data.get('title', ''),
            project_data.get('description', ''),
            " ".join(project_data.get('skills_required', []))
        ]
        combined_text = " ".join(filter(None, text_parts))
        return await self.generate_embedding(combined_text)
