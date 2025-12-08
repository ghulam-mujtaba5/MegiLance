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
    return db.db

async def connect_to_mongo():
    try:
        logger.info("Connecting to MongoDB...")
        db.client = AsyncIOMotorClient(settings.MONGODB_URL)
        db.db = db.client[settings.MONGODB_DB_NAME]
        # Ping to verify connection
        await db.client.admin.command('ping')
        logger.info("Connected to MongoDB successfully!")
    except Exception as e:
        logger.error(f"Could not connect to MongoDB: {e}")
        raise e

async def close_mongo_connection():
    try:
        logger.info("Closing MongoDB connection...")
        if db.client:
            db.client.close()
            logger.info("MongoDB connection closed.")
    except Exception as e:
        logger.error(f"Error closing MongoDB connection: {e}")
