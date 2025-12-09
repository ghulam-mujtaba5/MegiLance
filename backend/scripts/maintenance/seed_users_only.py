"""Quick user seeding script"""
import sys
sys.path.insert(0, 'backend')

from app.db.session import get_session_local
from app.models.user import User
from app.core.security import get_password_hash
from datetime import datetime

SessionLocal = get_session_local()
db = SessionLocal()

# Check if users exist
existing = db.query(User).filter(User.email == "client1@example.com").first()
if existing:
    print("Users already exist!")
else:
    # Create users
    users = [
        User(
            email="client1@example.com",
            hashed_password=get_password_hash("password123"),
            is_active=True,
            name="Tech Corp",
            user_type="Client",
            bio="Innovative tech company looking for talented freelancers.",
            location="Los Angeles, CA",
            joined_at=datetime.utcnow()
        ),
        User(
            email="freelancer1@example.com",
            hashed_password=get_password_hash("password123"),
            is_active=True,
            name="Alice Johnson",
            user_type="Freelancer",
            bio="Experienced full-stack developer with 5+ years of experience.",
            skills="React,Node.js,Python,PostgreSQL,MongoDB",
            hourly_rate=50.0,
            profile_image_url="/avatars/alice.png",
            location="San Francisco, CA",
            joined_at=datetime.utcnow()
        ),
        User(
            email="freelancer2@example.com",
            hashed_password=get_password_hash("password123"),
            is_active=True,
            name="Bob Smith",
            user_type="Freelancer",
            bio="UI/UX designer with expertise in creating beautiful interfaces.",
            skills="UI/UX,Design,Figma,Adobe XD,Prototyping",
            hourly_rate=45.0,
            profile_image_url="/avatars/bob.jpg",
            location="New York, NY",
            joined_at=datetime.utcnow()
        )
    ]
    
    db.add_all(users)
    db.commit()
    print("✓ Users created successfully!")
    
db.close()
