# MegiLance Platform - Complete Backend Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Core Features](#core-features)
4. [API Documentation](#api-documentation)
5. [Security](#security)
6. [Deployment](#deployment)
7. [Testing](#testing)

---

## Overview

MegiLance is a comprehensive freelance marketplace platform connecting clients with freelancers. The backend is built with FastAPI and PostgreSQL, featuring advanced security, real-time communication, and payment processing.

### Tech Stack
- **Framework**: FastAPI 0.110.2
- **Database**: PostgreSQL 15 with SQLAlchemy 2.0.30
- **Authentication**: JWT with PyJWT 2.9.0
- **Payments**: Stripe 7.4.0
- **Real-time**: Socket.IO 5.10.0
- **Email**: AWS SES via Boto3
- **Testing**: Pytest 8.3.2

### Key Statistics
- **46 API Endpoints** (28 original + 18 new)
- **107 Database Indexes** (97 single + 10 composite)
- **16 Email Templates**
- **33 Test Cases** with 80%+ coverage
- **14 Analytics Endpoints**

---

## Architecture

### Database Schema
```
Users (clients, freelancers, admins)
├── Projects (posted by clients)
│   ├── Proposals (submitted by freelancers)
│   └── Contracts (awarded projects)
│       ├── Milestones (payment stages)
│       └── Escrow (funds held)
├── Payments (via Stripe)
├── Messages (real-time via WebSocket)
├── Notifications (real-time)
├── Reviews (bidirectional)
└── Support Tickets
```

### Service Architecture
```
FastAPI Application
├── Core Services
│   ├── Authentication & Authorization (JWT)
│   ├── Email Service (AWS SES)
│   ├── Stripe Service (Payments)
│   ├── WebSocket Manager (Socket.IO)
│   └── Analytics Service
├── API Endpoints (v1)
│   ├── Auth (/api/auth)
│   ├── Users (/api/users)
│   ├── Projects (/api/projects)
│   ├── Payments (/api/payments)
│   ├── Stripe (/api/stripe)
│   ├── WebSocket (/api/ws)
│   └── Analytics (/api/analytics)
└── Database Layer
    ├── SQLAlchemy ORM
    └── Alembic Migrations
```

---

## Core Features

### 1. Authentication & Authorization

#### JWT Token System
- **Access Tokens**: 30 minutes expiration
- **Refresh Tokens**: 7 days expiration
- **Token Types**: access, refresh, email_verification, password_reset

#### Email Verification
- Automatic verification email on registration
- Token-based verification link
- Resend verification option
- Email: `welcome_email.html`, `email_verification.html`

#### Two-Factor Authentication (2FA)
- TOTP-based (Google Authenticator compatible)
- QR code generation for setup
- 8 backup codes generated
- Backup code one-time use
- Email notifications on enable/disable
- Email: `2fa_enabled.html`, `2fa_disabled.html`

#### Password Management
- Secure password hashing (bcrypt)
- Password reset flow with token
- Email notification on reset
- Email: `password_reset_request.html`, `password_reset_success.html`

### 2. Payment Processing (Stripe)

#### Customer Management
- `POST /api/stripe/customers` - Create customer
- `GET /api/stripe/customers/{id}` - Get customer details

#### Payment Intents (Escrow Support)
- `POST /api/stripe/payment-intents` - Create payment
  - Manual capture for escrow (milestone-based)
  - Automatic capture for direct payments
- `POST /api/stripe/payment-intents/{id}/confirm` - Confirm payment
- `POST /api/stripe/payment-intents/{id}/capture` - Release escrow funds
- `POST /api/stripe/payment-intents/{id}/cancel` - Cancel payment

#### Refunds
- `POST /api/stripe/refunds` - Create refund
  - Partial or full refunds
  - Reason tracking
- `GET /api/stripe/refunds/{id}` - Get refund details

#### Subscriptions
- `POST /api/stripe/subscriptions` - Create subscription (platform fees)
- `DELETE /api/stripe/subscriptions/{id}` - Cancel subscription

#### Webhooks
- `POST /api/stripe/webhooks` - Handle Stripe events
  - Signature verification for security
  - Events: payment_intent.succeeded, payment_failed, charge.refunded, etc.

#### Platform Fees
- Default: 10% (configurable via `STRIPE_PLATFORM_FEE_PERCENT`)
- Calculated automatically on payments

### 3. Real-time Features (WebSocket)

#### Connection Management
- Automatic user authentication via token
- Connection tracking (active_connections, user_sessions)
- Online/offline status broadcasting

#### Room System
- **Project Rooms**: Project-specific communication
- **Chat Rooms**: Private 1-on-1 messaging

#### Events
- `connect` - User connects
- `disconnect` - User disconnects
- `join_project` - Join project room
- `leave_project` - Leave project room
- `join_chat` - Join chat room
- `leave_chat` - Leave chat room
- `send_message` - Send real-time message
- `typing_start` - User starts typing
- `typing_stop` - User stops typing

#### Notifications
- `send_notification` - Generic notification
- `send_message_notification` - New message alert
- `send_project_update` - Project status change
- `send_proposal_update` - Proposal status change
- `send_milestone_update` - Milestone completion
- `send_payment_notification` - Payment received

#### REST API
- `GET /api/ws/status` - WebSocket server status
- `GET /api/ws/online-users` - List online users
- `GET /api/ws/user/{id}/online` - Check user online status
- `POST /api/ws/send-notification` - Send test notification

### 4. Email System

#### AWS SES Integration
- HTML email templates with Jinja2
- Template inheritance (base template)
- Automatic SES configuration detection
- Fallback to console logging in dev

#### 16 Email Templates
1. **welcome_email.html** - Welcome new users
2. **email_verification.html** - Email verification link
3. **password_reset_request.html** - Password reset link
4. **password_reset_success.html** - Reset confirmation
5. **2fa_enabled.html** - 2FA enabled notification
6. **2fa_disabled.html** - 2FA disabled notification
7. **project_created.html** - New project posted
8. **proposal_received.html** - New proposal notification
9. **proposal_accepted.html** - Proposal accepted
10. **contract_created.html** - Contract started
11. **milestone_completed.html** - Milestone completion
12. **payment_received.html** - Payment notification
13. **payment_sent.html** - Payment confirmation
14. **review_received.html** - New review notification
15. **message_received.html** - New message alert
16. **account_deactivated.html** - Account deactivation

### 5. Analytics Dashboard

#### User Analytics
- Registration trends (daily/weekly/monthly)
- Active users statistics
- Location distribution
- Verification & 2FA adoption rates

#### Project Analytics
- Project statistics by status
- Completion rates
- Popular categories
- Average budgets

#### Revenue Analytics
- Total revenue & platform fees
- Revenue trends over time
- Payment method breakdown
- Transaction metrics

#### Performance Analytics
- Top freelancers (by earnings/rating/projects)
- Freelancer success rates
- Top clients by spending
- Platform health metrics
- User engagement statistics

#### Dashboard Summary
- `GET /api/analytics/dashboard/summary` - Comprehensive metrics
  - Users, projects, revenue, health, engagement

### 6. Security Features

#### Rate Limiting
- `@api_rate_limit()` decorator on all endpoints
- Default: 10 requests per minute per IP
- Customizable limits per endpoint
- 429 status code when exceeded

#### Password Security
- Bcrypt hashing with salt
- Minimum complexity requirements
- Password reset token expiration (1 hour)

#### Email Verification
- Prevents unverified users from certain actions
- Token-based verification (secure random)
- Expiration handling

#### 2FA Security
- TOTP algorithm (RFC 6238)
- Base32 encoded secrets
- Backup codes (one-time use, hashed)
- Email notifications on changes

#### API Security
- JWT token authentication
- Role-based access control (RBAC)
- Admin-only endpoints
- CORS configuration
- SQL injection prevention (SQLAlchemy ORM)

### 7. Database Optimization

#### 107 Indexes Created
- **Single-column**: 97 indexes on frequently queried fields
- **Composite**: 10 indexes for common multi-column queries

#### Key Composite Indexes
- `idx_projects_status_created` - Projects by status & date
- `idx_payments_user_created` - User payment history
- `idx_messages_receiver_unread` - Unread messages
- `idx_notifications_user_unread` - Unread notifications
- `idx_reviews_reviewee_rating` - User ratings
- `idx_time_entries_project_date` - Project time tracking
- `idx_support_tickets_status_priority` - Ticket queue
- `idx_proposals_freelancer_status` - Freelancer proposals
- `idx_audit_logs_user_created` - User activity tracking

#### Query Optimization
- Efficient JOINs with foreign key indexes
- Covering indexes for SELECT queries
- Range scan optimization (date, budget)
- Count query optimization (status counts)

---

## API Documentation

### Authentication Endpoints

#### POST /api/auth/register
Register new user (client or freelancer).

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "first_name": "John",
  "last_name": "Doe",
  "user_type": "freelancer"
}
```

**Response:** `201 Created`
```json
{
  "id": 123,
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "user_type": "freelancer",
  "email_verified": false
}
```

#### POST /api/auth/login
Authenticate user and get tokens.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:** `200 OK`
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "requires_2fa": false
}
```

#### POST /api/auth/2fa/enable
Enable 2FA for current user.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:** `200 OK`
```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "qr_code": "data:image/png;base64,iVBORw0KG...",
  "backup_codes": [
    "12345678",
    "23456789",
    ...
  ]
}
```

### Stripe Endpoints

#### POST /api/stripe/payment-intents
Create payment intent (with optional escrow).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request:**
```json
{
  "amount": 10000,
  "currency": "usd",
  "customer_id": "cus_abc123",
  "metadata": {
    "project_id": "456",
    "milestone_id": "789"
  },
  "capture_method": "manual"
}
```

**Response:** `200 OK`
```json
{
  "id": "pi_abc123",
  "amount": 10000,
  "currency": "usd",
  "status": "requires_confirmation",
  "client_secret": "pi_abc123_secret_xyz"
}
```

#### POST /api/stripe/payment-intents/{id}/capture
Release escrow funds (milestone completion).

**Response:** `200 OK`
```json
{
  "id": "pi_abc123",
  "status": "succeeded",
  "amount_received": 10000
}
```

### WebSocket Events

#### Client → Server

**join_project**
```json
{
  "project_id": 123
}
```

**send_message**
```json
{
  "receiver_id": 456,
  "content": "Hello!"
}
```

**typing_start**
```json
{
  "chat_id": 789
}
```

#### Server → Client

**new_message**
```json
{
  "sender_id": 123,
  "receiver_id": 456,
  "content": "Hello!",
  "created_at": "2024-01-15T10:30:00Z"
}
```

**user_online**
```json
{
  "user_id": 123
}
```

**notification**
```json
{
  "type": "payment_received",
  "title": "Payment Received",
  "message": "You received $100.00",
  "data": {
    "payment_id": 789,
    "amount": 10000
  }
}
```

### Analytics Endpoints (Admin Only)

#### GET /api/analytics/dashboard/summary
Get comprehensive dashboard metrics.

**Headers:**
```
Authorization: Bearer <admin_access_token>
```

**Response:** `200 OK`
```json
{
  "users": {
    "total_users": 5000,
    "active_users": 1250,
    "verified_users": 4200,
    "users_with_2fa": 800,
    "user_types": {"client": 2000, "freelancer": 3000},
    "period_days": 30
  },
  "projects": {
    "status_breakdown": {
      "open": 150,
      "in_progress": 80,
      "completed": 420,
      "cancelled": 25
    },
    "average_budget": 2500.50,
    "projects_last_30_days": 45,
    "average_proposals_per_project": 8.5
  },
  "revenue": {
    "total_revenue": 45000.00,
    "platform_fees": 4500.00,
    "net_revenue": 40500.00,
    "transaction_count": 85,
    "average_transaction": 529.41,
    "payment_methods": {"stripe": 40000.00}
  },
  "health": {
    "active_disputes": 5,
    "pending_support_tickets": 12,
    "average_response_time_hours": 2.5,
    "user_satisfaction_rating": 4.6,
    "daily_active_users": 450
  },
  "engagement": {
    "period_days": 30,
    "messages_sent": 8540,
    "proposals_submitted": 450,
    "projects_posted": 120,
    "contracts_created": 85,
    "reviews_posted": 65
  }
}
```

---

## Security

### Environment Variables
```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/megilance

# JWT
SECRET_KEY=your-secret-key-min-32-characters
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# AWS SES
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
SES_SENDER_EMAIL=noreply@megilance.com

# Stripe
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret
STRIPE_PLATFORM_FEE_PERCENT=10.0

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

### Security Best Practices

1. **Never commit** `.env` files to version control
2. **Rotate secrets** regularly (JWT keys, Stripe keys)
3. **Use HTTPS** in production (configure Nginx/reverse proxy)
4. **Enable CORS** only for trusted domains
5. **Monitor** failed authentication attempts
6. **Enable** 2FA for admin accounts
7. **Validate** all API inputs with Pydantic schemas
8. **Sanitize** user-generated content
9. **Use** prepared statements (SQLAlchemy ORM prevents SQL injection)
10. **Implement** request logging and audit trails

---

## Deployment

### Prerequisites
- PostgreSQL 15+
- Python 3.11+
- AWS Account (for SES)
- Stripe Account
- Domain with SSL certificate

### Production Setup

#### 1. Database Migration
```bash
cd backend
alembic upgrade head
```

#### 2. Environment Configuration
Create `.env.production`:
```env
DATABASE_URL=postgresql://prod_user:strong_password@db.example.com:5432/megilance_prod
SECRET_KEY=production-secret-key-64-characters-minimum-for-security
STRIPE_SECRET_KEY=sk_live_your_production_key
```

#### 3. Run with Gunicorn
```bash
gunicorn app.main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --access-logfile - \
  --error-logfile -
```

#### 4. Nginx Reverse Proxy
```nginx
server {
    listen 80;
    server_name api.megilance.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.megilance.com;

    ssl_certificate /etc/letsencrypt/live/api.megilance.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.megilance.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /ws/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

### Docker Deployment

#### Dockerfile (backend)
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["gunicorn", "app.main:app", "--workers", "4", "--worker-class", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000"]
```

#### docker-compose.yml
```yaml
version: '3.8'

services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: megilance
      POSTGRES_USER: megilance
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql://megilance:${DB_PASSWORD}@db:5432/megilance
    depends_on:
      - db

volumes:
  postgres_data:
```

---

## Testing

### Run Tests
```bash
cd backend
pytest tests/ -v --cov=app --cov-report=html
```

### Test Coverage
- **Target**: 80%+ overall coverage
- **Critical paths**: 100% coverage (auth, payments, security)

### Test Categories
- **Unit Tests**: Individual functions and methods
- **Integration Tests**: API endpoint testing
- **Security Tests**: Authentication, authorization, rate limiting
- **Payment Tests**: Stripe integration (mocked)
- **WebSocket Tests**: Real-time communication

### CI/CD Pipeline
GitHub Actions automatically runs:
1. Backend tests (33 tests)
2. Code linting (Black, isort, Flake8)
3. Security scan (Trivy)
4. Docker build
5. Deployment (staging/production)

---

## Support

### Documentation
- **API Docs**: http://localhost:8000/api/docs (Swagger)
- **ReDoc**: http://localhost:8000/api/redoc
- **Health Check**: http://localhost:8000/api/health/live

### Common Issues

**Issue**: Email verification not working
**Solution**: Check AWS SES configuration and sender email verification

**Issue**: 2FA QR code not generating
**Solution**: Ensure `pyotp` and `qrcode` are installed

**Issue**: Stripe webhook signature verification fails
**Solution**: Update `STRIPE_WEBHOOK_SECRET` in `.env`

**Issue**: WebSocket connection fails
**Solution**: Check CORS settings and WebSocket endpoint configuration

### Contact
- **GitHub**: [MegiLance Repository]
- **Email**: support@megilance.com
- **Documentation**: See project README files
