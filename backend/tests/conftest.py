# @AI-HINT: Pytest configuration and fixtures for backend testing
# Provides test database, client, and common fixtures

import pytest
from typing import Generator
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from datetime import datetime, timedelta

from app.main import app
from app.db.session import Base, get_db
from app.core.security import create_access_token, get_password_hash
from app.models.user import User
from app.services.email_service import EmailService
from app.services.stripe_service import StripeService


# Test database URL (use in-memory SQLite for testing)
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///./test.db"

# Create test engine
engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False}
)

# Create test session
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# ==================== Database Fixtures ====================

@pytest.fixture(scope="function")
def db() -> Generator[Session, None, None]:
    """Create test database and session"""
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    # Create session
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        # Drop all tables after test
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db: Session) -> Generator[TestClient, None, None]:
    """Create test client with database override"""
    def override_get_db():
        try:
            yield db
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as test_client:
        yield test_client
    
    app.dependency_overrides.clear()


# ==================== User Fixtures ====================

@pytest.fixture
def test_user(db: Session) -> User:
    """Create test user"""
    user = User(
        email="testuser@example.com",
        hashed_password=get_password_hash("TestPassword123!"),
        first_name="Test",
        last_name="User",
        user_type="freelancer",
        email_verified=True,
        is_active=True,
        created_at=datetime.utcnow()
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def test_user_with_2fa(db: Session) -> User:
    """Create test user with 2FA enabled"""
    import pyotp
    
    secret = pyotp.random_base32()
    user = User(
        email="2fauser@example.com",
        hashed_password=get_password_hash("TestPassword123!"),
        first_name="TwoFactor",
        last_name="User",
        user_type="freelancer",
        email_verified=True,
        is_active=True,
        two_factor_enabled=True,
        two_factor_secret=secret,
        created_at=datetime.utcnow()
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def admin_user(db: Session) -> User:
    """Create admin user"""
    user = User(
        email="admin@example.com",
        hashed_password=get_password_hash("AdminPass123!"),
        first_name="Admin",
        last_name="User",
        user_type="admin",
        email_verified=True,
        is_active=True,
        created_at=datetime.utcnow()
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


# ==================== Authentication Fixtures ====================

@pytest.fixture
def auth_tokens(test_user: User) -> dict:
    """Create authentication tokens for test user"""
    access_token = create_access_token(
        data={"sub": str(test_user.id), "type": "access"}
    )
    refresh_token = create_access_token(
        data={"sub": str(test_user.id), "type": "refresh"},
        expires_delta=timedelta(days=7)
    )
    return {
        "access_token": access_token,
        "refresh_token": refresh_token
    }


@pytest.fixture
def auth_headers(auth_tokens: dict) -> dict:
    """Create authorization headers"""
    return {
        "Authorization": f"Bearer {auth_tokens['access_token']}"
    }


@pytest.fixture
def admin_headers(admin_user: User) -> dict:
    """Create admin authorization headers"""
    access_token = create_access_token(
        data={"sub": str(admin_user.id), "type": "access"}
    )
    return {
        "Authorization": f"Bearer {access_token}"
    }


# ==================== Token Fixtures ====================

@pytest.fixture
def verification_token(test_user: User) -> str:
    """Create email verification token"""
    from app.core.security import create_verification_token
    return create_verification_token(test_user.email)


@pytest.fixture
def password_reset_token(test_user: User) -> str:
    """Create password reset token"""
    from app.core.security import create_password_reset_token
    return create_password_reset_token(test_user.email)


# ==================== Service Fixtures ====================

@pytest.fixture
def email_service() -> EmailService:
    """Create email service instance"""
    return EmailService()


@pytest.fixture
def stripe_service() -> StripeService:
    """Create Stripe service instance"""
    return StripeService()


# ==================== WebSocket Fixtures ====================

@pytest.fixture
def websocket_client(client: TestClient) -> TestClient:
    """Create WebSocket test client"""
    return client


# ==================== Payment Fixtures ====================

@pytest.fixture
def payment_intent_id(stripe_service: StripeService) -> str:
    """Create test payment intent and return ID"""
    try:
        payment_intent = stripe_service.create_payment_intent(
            amount=1000,
            currency="usd",
            customer_id="cus_test123"
        )
        return payment_intent["id"]
    except Exception:
        pytest.skip("Stripe not configured")


# ==================== Configuration ====================

def pytest_configure(config):
    """Configure pytest"""
    config.addinivalue_line(
        "markers", "integration: mark test as integration test"
    )
    config.addinivalue_line(
        "markers", "slow: mark test as slow running"
    )
