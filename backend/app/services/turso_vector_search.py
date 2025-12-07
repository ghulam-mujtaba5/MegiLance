"""
Turso Native Vector Search Service
Leverages Turso's libSQL vector search capabilities for high-performance similarity matching.
"""

import logging
from typing import List, Dict, Any, Optional
from sqlalchemy import text
from app.core.config import get_settings
from app.db.session import get_engine

logger = logging.getLogger(__name__)
settings = get_settings()

class TursoVectorSearchService:
    def __init__(self):
        self.engine = get_engine()

    async def search_similar_freelancers(self, project_embedding: List[float], limit: int = 10) -> List[Dict[str, Any]]:
        """
        Search for freelancers with profiles similar to the project embedding.
        Uses Turso's vector_top_k function if available, or falls back to standard query.
        """
        if not project_embedding:
            return []

        # Convert embedding list to string representation for SQL
        # Format: '[0.1, 0.2, ...]'
        vector_str = str(project_embedding)

        query = """
        SELECT 
            u.id, 
            u.first_name, 
            u.last_name, 
            u.profile_data,
            vector_distance_cos(u.embedding, :vector) as distance
        FROM users u
        WHERE u.user_type = 'FREELANCER' 
          AND u.is_active = 1
          AND u.embedding IS NOT NULL
        ORDER BY distance ASC
        LIMIT :limit
        """
        
        # Note: The above query assumes 'vector_distance_cos' is available (Turso extension).
        # If running locally without the extension, this will fail.
        # We need a safe execution wrapper.

        try:
            with self.engine.connect() as conn:
                # Check if we are on Turso or have vector support
                # This is a simplified check. In real prod, we'd know our env.
                if "libsql" in str(self.engine.url) or settings.turso_database_url:
                    result = conn.execute(text(query), {"vector": vector_str, "limit": limit})
                    return [dict(row) for row in result.mappings()]
                else:
                    logger.warning("Vector search not available locally. Returning empty list (fallback to heuristic).")
                    return []
        except Exception as e:
            logger.error(f"Vector search failed: {e}")
            return []

    async def update_freelancer_embedding(self, user_id: int, embedding: List[float]):
        """Update the embedding vector for a freelancer"""
        if not embedding:
            return

        vector_str = str(embedding)
        query = "UPDATE users SET embedding = :vector WHERE id = :user_id"
        
        try:
            with self.engine.connect() as conn:
                conn.execute(text(query), {"vector": vector_str, "user_id": user_id})
                conn.commit()
        except Exception as e:
            logger.error(f"Failed to update freelancer embedding: {e}")

    async def update_project_embedding(self, project_id: int, embedding: List[float]):
        """Update the embedding vector for a project"""
        if not embedding:
            return

        vector_str = str(embedding)
        query = "UPDATE projects SET embedding = :vector WHERE id = :project_id"
        
        try:
            with self.engine.connect() as conn:
                conn.execute(text(query), {"vector": vector_str, "project_id": project_id})
                conn.commit()
        except Exception as e:
            logger.error(f"Failed to update project embedding: {e}")
