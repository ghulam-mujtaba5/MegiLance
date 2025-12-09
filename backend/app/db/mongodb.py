# @AI-HINT: MongoDB connection handling using Motor (AsyncIO)
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import get_settings
import logging

logger = logging.getLogger("megilance")
settings = get_settings()

class MongoDB:
    client: AsyncIOMotorClient = None
    db = None

db = MongoDB()

async def get_database():
    if db.db is None:
        logger.warning("MongoDB database not available")
        return None
    return db.db

async def connect_to_mongo():
    """Optional MongoDB connection - fails gracefully if unavailable"""
    try:
        if not settings.MONGODB_URL:
            logger.warning("MongoDB URL not configured - skipping connection")
            return
        
        logger.info("Attempting MongoDB connection...")
        db.client = AsyncIOMotorClient(
            settings.MONGODB_URL,
            serverSelectionTimeoutMS=5000,  # 5 second timeout
            connectTimeoutMS=5000
        )
        db.db = db.client[settings.MONGODB_DB_NAME]
        # Ping to verify connection
        await db.client.admin.command('ping')
        logger.info("Connected to MongoDB successfully!")
    except Exception as e:
        logger.warning(f"MongoDB connection failed: {e} - continuing without MongoDB")
        db.client = None
        db.db = None

async def close_mongo_connection():
    """Close MongoDB connection if it exists"""
    try:
        if db.client:
            logger.info("Closing MongoDB connection...")
            db.client.close()
            logger.info("MongoDB connection closed.")
    except Exception as e:
        logger.warning(f"Error closing MongoDB connection: {e}")
