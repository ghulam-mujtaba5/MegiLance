# @AI-HINT: Comprehensive test suite for backend services and APIs
# Tests email, 2FA, password reset, rate limiting, Stripe, WebSocket

import pytest
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from fastapi.testclient import TestClient

# Import services
from app.services.email_service import EmailService
from app.services.stripe_service import StripeService

# Import models
from app.models.models import User

# Import config
from app.core.config import settings


# ==================== Email Service Tests ====================

class TestEmailService:
    """Test suite for email service functionality"""
    
    def test_send_welcome_email(self, email_service: EmailService):
        """Test sending welcome email"""
        result = email_service.send_welcome_email(
            to_email="test@example.com",
            user_name="Test User"
        )
        assert result is True
    
    def test_send_verification_email(self, email_service: EmailService):
        """Test sending email verification"""
        token = "test_verification_token_123"
        result = email_service.send_verification_email(
            to_email="test@example.com",
            user_name="Test User",
            verification_token=token
        )
        assert result is True
    
    def test_send_password_reset_email(self, email_service: EmailService):
        """Test sending password reset email"""
        token = "test_reset_token_456"
        result = email_service.send_password_reset_email(
            to_email="test@example.com",
            user_name="Test User",
            reset_token=token
        )
        assert result is True
    
    def test_send_2fa_enabled_email(self, email_service: EmailService):
        """Test sending 2FA enabled notification"""
        result = email_service.send_2fa_enabled_email(
            to_email="test@example.com",
            user_name="Test User"
        )
        assert result is True


# ==================== Authentication Tests ====================

class TestAuthentication:
    """Test suite for authentication endpoints"""
    
    def test_register_user(self, client: TestClient):
        """Test user registration"""
        response = client.post("/api/auth/register", json={
            "email": "newuser@example.com",
            "password": "SecurePass123!",
            "first_name": "New",
            "last_name": "User",
            "user_type": "freelancer"
        })
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "newuser@example.com"
        assert "id" in data
    
    def test_login_user(self, client: TestClient, test_user: User):
        """Test user login"""
        response = client.post("/api/auth/login", json={
            "email": test_user.email,
            "password": "TestPassword123!"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
    
    def test_login_invalid_credentials(self, client: TestClient):
        """Test login with invalid credentials"""
        response = client.post("/api/auth/login", json={
            "email": "invalid@example.com",
            "password": "WrongPassword123!"
        })
        assert response.status_code == 401
    
    def test_refresh_token(self, client: TestClient, auth_tokens: dict):
        """Test token refresh"""
        response = client.post("/api/auth/refresh", json={
            "refresh_token": auth_tokens["refresh_token"]
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data


# ==================== Two-Factor Authentication Tests ====================

class TestTwoFactorAuth:
    """Test suite for 2FA functionality"""
    
    def test_enable_2fa(self, client: TestClient, auth_headers: dict):
        """Test enabling 2FA"""
        response = client.post("/api/auth/2fa/enable", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "secret" in data
        assert "qr_code" in data
        assert "backup_codes" in data
        assert len(data["backup_codes"]) == 8
    
    def test_verify_2fa_code(self, client: TestClient, auth_headers: dict, test_user_with_2fa: User):
        """Test verifying 2FA code"""
        import pyotp
        totp = pyotp.TOTP(test_user_with_2fa.two_factor_secret)
        code = totp.now()
        
        response = client.post("/api/auth/2fa/verify", 
            headers=auth_headers,
            json={"code": code}
        )
        assert response.status_code == 200
    
    def test_verify_invalid_2fa_code(self, client: TestClient, auth_headers: dict):
        """Test verifying invalid 2FA code"""
        response = client.post("/api/auth/2fa/verify", 
            headers=auth_headers,
            json={"code": "000000"}
        )
        assert response.status_code == 400
    
    def test_disable_2fa(self, client: TestClient, auth_headers: dict):
        """Test disabling 2FA"""
        response = client.post("/api/auth/2fa/disable", headers=auth_headers)
        assert response.status_code == 200


# ==================== Password Reset Tests ====================

class TestPasswordReset:
    """Test suite for password reset functionality"""
    
    def test_request_password_reset(self, client: TestClient, test_user: User):
        """Test requesting password reset"""
        response = client.post("/api/auth/forgot-password", json={
            "email": test_user.email
        })
        assert response.status_code == 200
    
    def test_reset_password(self, client: TestClient, password_reset_token: str):
        """Test resetting password"""
        response = client.post("/api/auth/reset-password", json={
            "token": password_reset_token,
            "new_password": "NewSecurePass123!"
        })
        assert response.status_code == 200
    
    def test_reset_password_invalid_token(self, client: TestClient):
        """Test resetting password with invalid token"""
        response = client.post("/api/auth/reset-password", json={
            "token": "invalid_token_xyz",
            "new_password": "NewSecurePass123!"
        })
        assert response.status_code == 400


# ==================== Email Verification Tests ====================

class TestEmailVerification:
    """Test suite for email verification"""
    
    def test_verify_email(self, client: TestClient, verification_token: str):
        """Test email verification"""
        response = client.get(f"/api/auth/verify-email?token={verification_token}")
        assert response.status_code == 200
    
    def test_verify_email_invalid_token(self, client: TestClient):
        """Test email verification with invalid token"""
        response = client.get("/api/auth/verify-email?token=invalid_token")
        assert response.status_code == 400
    
    def test_resend_verification_email(self, client: TestClient, test_user: User):
        """Test resending verification email"""
        response = client.post("/api/auth/resend-verification", json={
            "email": test_user.email
        })
        assert response.status_code == 200


# ==================== Rate Limiting Tests ====================

class TestRateLimiting:
    """Test suite for rate limiting"""
    
    def test_rate_limit_exceeded(self, client: TestClient):
        """Test rate limit enforcement"""
        # Make requests until rate limit is hit
        endpoint = "/api/auth/login"
        for _ in range(15):  # Assuming rate limit is 10 per minute
            client.post(endpoint, json={
                "email": "test@example.com",
                "password": "password"
            })
        
        # Next request should be rate limited
        response = client.post(endpoint, json={
            "email": "test@example.com",
            "password": "password"
        })
        assert response.status_code == 429


# ==================== Stripe Payment Tests ====================

class TestStripePayments:
    """Test suite for Stripe payment integration"""
    
    @pytest.mark.skipif(not settings.STRIPE_SECRET_KEY, reason="Stripe not configured")
    def test_create_customer(self, stripe_service: StripeService):
        """Test creating Stripe customer"""
        customer = stripe_service.create_customer(
            email="customer@example.com",
            name="Test Customer",
            metadata={"user_id": "123"}
        )
        assert customer is not None
        assert customer["email"] == "customer@example.com"
    
    @pytest.mark.skipif(not settings.STRIPE_SECRET_KEY, reason="Stripe not configured")
    def test_create_payment_intent(self, stripe_service: StripeService):
        """Test creating payment intent"""
        payment_intent = stripe_service.create_payment_intent(
            amount=1000,  # $10.00
            currency="usd",
            customer_id="cus_test123",
            metadata={"project_id": "456"}
        )
        assert payment_intent is not None
        assert payment_intent["amount"] == 1000
        assert payment_intent["currency"] == "usd"
    
    @pytest.mark.skipif(not settings.STRIPE_SECRET_KEY, reason="Stripe not configured")
    def test_create_refund(self, stripe_service: StripeService, payment_intent_id: str):
        """Test creating refund"""
        refund = stripe_service.create_refund(
            payment_intent_id=payment_intent_id,
            amount=500,  # Partial refund $5.00
            reason="requested_by_customer"
        )
        assert refund is not None
        assert refund["amount"] == 500


# ==================== WebSocket Tests ====================

class TestWebSocket:
    """Test suite for WebSocket functionality"""
    
    def test_websocket_connection(self, websocket_client):
        """Test WebSocket connection"""
        with websocket_client.websocket_connect("/ws") as websocket:
            data = websocket.receive_json()
            assert "type" in data
    
    def test_websocket_join_room(self, websocket_client, test_user: User):
        """Test joining WebSocket room"""
        with websocket_client.websocket_connect("/ws") as websocket:
            websocket.send_json({
                "type": "join_project",
                "project_id": 123
            })
            data = websocket.receive_json()
            assert data["type"] == "room_joined"
    
    def test_websocket_send_message(self, websocket_client, test_user: User):
        """Test sending message via WebSocket"""
        with websocket_client.websocket_connect("/ws") as websocket:
            websocket.send_json({
                "type": "send_message",
                "receiver_id": 456,
                "content": "Test message"
            })
            data = websocket.receive_json()
            assert data["type"] == "message_sent"


# ==================== Analytics Tests ====================

class TestAnalytics:
    """Test suite for analytics endpoints"""
    
    def test_get_active_users_stats(self, client: TestClient, admin_headers: dict):
        """Test getting active user stats"""
        response = client.get("/api/analytics/users/active-stats", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert "total_users" in data
        assert "active_users" in data
    
    def test_get_project_stats(self, client: TestClient, admin_headers: dict):
        """Test getting project stats"""
        response = client.get("/api/analytics/projects/stats", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert "status_breakdown" in data
    
    def test_get_revenue_stats(self, client: TestClient, admin_headers: dict):
        """Test getting revenue stats"""
        start_date = (datetime.utcnow() - timedelta(days=30)).isoformat()
        end_date = datetime.utcnow().isoformat()
        
        response = client.get(
            f"/api/analytics/revenue/stats?start_date={start_date}&end_date={end_date}",
            headers=admin_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "total_revenue" in data
        assert "platform_fees" in data


# ==================== Integration Tests ====================

class TestIntegration:
    """Integration tests for complete workflows"""
    
    def test_complete_registration_flow(self, client: TestClient):
        """Test complete user registration and verification flow"""
        # Register user
        response = client.post("/api/auth/register", json={
            "email": "integration@example.com",
            "password": "IntegrationTest123!",
            "first_name": "Integration",
            "last_name": "Test",
            "user_type": "freelancer"
        })
        assert response.status_code == 201
        
        # Login (should work even without verification for testing)
        response = client.post("/api/auth/login", json={
            "email": "integration@example.com",
            "password": "IntegrationTest123!"
        })
        assert response.status_code == 200
    
    def test_complete_2fa_flow(self, client: TestClient, auth_headers: dict):
        """Test complete 2FA setup and verification flow"""
        # Enable 2FA
        response = client.post("/api/auth/2fa/enable", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        # Verify 2FA code
        import pyotp
        totp = pyotp.TOTP(data["secret"])
        code = totp.now()
        
        response = client.post("/api/auth/2fa/verify",
            headers=auth_headers,
            json={"code": code}
        )
        assert response.status_code == 200
        
        # Disable 2FA
        response = client.post("/api/auth/2fa/disable", headers=auth_headers)
        assert response.status_code == 200
