import sys
import os

# Add the current directory to sys.path
sys.path.append(os.getcwd())

from app.db.session import get_engine
from app.db.base import Base
# Import all models to ensure they are registered
from app.models.user import User
from app.models.project import Project
from app.models.proposal import Proposal
from app.models.contract import Contract
from app.models.payment import Payment
from app.models.portfolio import PortfolioItem
from app.models.message import Message
from app.models.review import Review
from app.models.skill import Skill

def init_db():
    print("Creating database tables...")
    engine = get_engine()
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully!")

if __name__ == "__main__":
    init_db()
