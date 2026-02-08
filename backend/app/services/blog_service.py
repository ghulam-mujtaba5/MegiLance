from typing import List, Optional
from datetime import datetime, timezone
from fastapi import HTTPException

try:
    from bson import ObjectId
    BSON_AVAILABLE = True
except ImportError:
    BSON_AVAILABLE = False
    # Dummy ObjectId for when MongoDB is not available
    class ObjectId:
        def __init__(self, *args, **kwargs):
            pass

try:
    from app.db.mongodb import get_database
    MONGODB_AVAILABLE = True
except ImportError:
    MONGODB_AVAILABLE = False
    def get_database():
        return None

from app.schemas.blog import BlogPostCreate, BlogPostUpdate, BlogPostInDB

class BlogService:
    @staticmethod
    async def get_collection():
        try:
            db = await get_database()
        except TypeError:
            # get_database is not async when MongoDB unavailable
            db = get_database()
        if db is None:
            raise HTTPException(status_code=503, detail="Blog service unavailable (MongoDB not connected)")
        return db["posts"]

    @staticmethod
    def calculate_reading_time(content: str) -> int:
        words_per_minute = 200
        words = len(content.split())
        return max(1, round(words / words_per_minute))

    @staticmethod
    async def create_post(post: BlogPostCreate) -> BlogPostInDB:
        collection = await BlogService.get_collection()
        post_dict = post.model_dump()
        post_dict["created_at"] = datetime.now(timezone.utc)
        post_dict["updated_at"] = datetime.now(timezone.utc)
        post_dict["reading_time"] = BlogService.calculate_reading_time(post.content)
        
        result = await collection.insert_one(post_dict)
        post_dict["_id"] = str(result.inserted_id)
        
        return BlogPostInDB(**post_dict)

    @staticmethod
    async def get_post(post_id: str) -> Optional[BlogPostInDB]:
        collection = await BlogService.get_collection()
        try:
            oid = ObjectId(post_id)
        except:
            return None
            
        post = await collection.find_one({"_id": oid})
        if post:
            post["_id"] = str(post["_id"])
            return BlogPostInDB(**post)
        return None

    @staticmethod
    async def get_post_by_slug(slug: str) -> Optional[BlogPostInDB]:
        collection = await BlogService.get_collection()
        post = await collection.find_one({"slug": slug})
        if post:
            post["_id"] = str(post["_id"])
            return BlogPostInDB(**post)
        return None

    @staticmethod
    async def get_posts(skip: int = 0, limit: int = 10, is_published: Optional[bool] = None, is_news_trend: Optional[bool] = None) -> List[BlogPostInDB]:
        collection = await BlogService.get_collection()
        query = {}
        if is_published is not None:
            query["is_published"] = is_published
        if is_news_trend is not None:
            query["is_news_trend"] = is_news_trend
            
        cursor = collection.find(query).skip(skip).limit(limit).sort("created_at", -1)
        posts = []
        async for post in cursor:
            post["_id"] = str(post["_id"])
            posts.append(BlogPostInDB(**post))
        return posts

    @staticmethod
    async def update_post(post_id: str, post_update: BlogPostUpdate) -> Optional[BlogPostInDB]:
        collection = await BlogService.get_collection()
        try:
            oid = ObjectId(post_id)
        except:
            return None
            
        update_data = post_update.model_dump(exclude_unset=True)
        if not update_data:
            return await BlogService.get_post(post_id)
            
        if "content" in update_data:
            update_data["reading_time"] = BlogService.calculate_reading_time(update_data["content"])

        update_data["updated_at"] = datetime.now(timezone.utc)
        
        result = await collection.update_one(
            {"_id": oid},
            {"$set": update_data}
        )
        
        if result.modified_count:
            return await BlogService.get_post(post_id)
        return None

    @staticmethod
    async def increment_views(slug: str) -> bool:
        collection = await BlogService.get_collection()
        result = await collection.update_one(
            {"slug": slug},
            {"$inc": {"views": 1}}
        )
        return result.modified_count > 0

    @staticmethod
    async def delete_post(post_id: str) -> bool:
        collection = await BlogService.get_collection()
        try:
            oid = ObjectId(post_id)
        except:
            return False
            
        result = await collection.delete_one({"_id": oid})
        return result.deleted_count > 0
