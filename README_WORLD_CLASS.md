# MegiLance - World-Class Freelancing Platform

> **AI-Powered Freelancing Platform** connecting top talent with clients worldwide. Built with Next.js 14, FastAPI, and Turso (libSQL).

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python)](https://python.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

<p align="center">
  <img src="docs/assets/hero-banner.png" alt="MegiLance Platform" width="100%">
</p>

## ✨ Features

### 🎯 For Freelancers
- **AI-Powered Job Matching** - Get matched with projects that fit your skills
- **Smart Proposals** - AI-assisted proposal writing and optimization
- **Secure Escrow Payments** - Never worry about payment issues
- **Portfolio Showcase** - Beautiful portfolio with project highlights
- **Skill Verification** - Badge system for verified skills
- **Real-time Notifications** - Never miss an opportunity

### 💼 For Clients
- **Talent Discovery** - Find the perfect freelancer with advanced search
- **Project Management** - Milestones, deadlines, and deliverables tracking
- **Secure Payments** - Escrow protection and multiple payment methods
- **Team Collaboration** - Invite team members to projects
- **Quality Assurance** - Review system with verified reviews

### 🛡️ Platform Features
- **Enterprise Security** - JWT auth, 2FA, rate limiting, audit logs
- **Global Scale** - CDN-optimized, multi-region ready
- **Accessibility** - WCAG 2.1 AA compliant
- **Internationalization** - Support for 9+ languages
- **PWA Support** - Install on any device, works offline
- **Real-time Communication** - WebSocket-powered messaging

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- Docker (optional, recommended)

### Development Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/megilance.git
cd megilance

# Frontend setup
cd frontend
npm install
npm run dev

# Backend setup (new terminal)
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Using Docker

```bash
# Development with hot reload
docker compose -f docker-compose.dev.yml up

# Production build
docker compose up -d
```

### Environment Variables

Create `.env` files in both `frontend/` and `backend/`:

**Frontend (.env.local):**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

**Backend (.env):**
```env
DATABASE_URL=sqlite:///./local.db
SECRET_KEY=your-super-secret-key-min-32-chars
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7
```

## 📁 Project Structure

```
megilance/
├── frontend/                 # Next.js 14 Application
│   ├── app/                  # App Router pages
│   │   ├── (auth)/          # Authentication pages
│   │   ├── (main)/          # Marketing pages
│   │   ├── (portal)/        # Dashboard pages
│   │   └── components/      # Reusable UI components
│   ├── lib/                  # Utilities and hooks
│   │   ├── analytics.ts     # Multi-provider analytics
│   │   ├── performance.ts   # Core Web Vitals
│   │   ├── websocket.ts     # Real-time infrastructure
│   │   ├── i18n.ts          # Internationalization
│   │   └── accessibility.ts # A11y utilities
│   └── public/              # Static assets
│
├── backend/                  # FastAPI Application
│   ├── app/
│   │   ├── api/v1/          # API endpoints
│   │   ├── core/            # Config, security, caching
│   │   ├── models/          # SQLAlchemy models
│   │   ├── schemas/         # Pydantic schemas
│   │   └── services/        # Business logic
│   └── tests/               # Test suite
│
├── docs/                     # Documentation
└── docker-compose.yml        # Docker configuration
```

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│   Next.js 14    │────▶│    FastAPI      │────▶│   Turso/SQLite  │
│   (Frontend)    │     │    (Backend)    │     │   (Database)    │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │
        │                       │
        ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│   Cloudflare    │     │   File Storage  │
│   (CDN/Edge)    │     │   (S3/Local)    │
└─────────────────┘     └─────────────────┘
```

## 🔧 Technology Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| Next.js 14 | React framework with App Router |
| TypeScript | Type-safe development |
| CSS Modules | Scoped styling with theme support |
| next-themes | Dark/Light mode |
| SWR | Data fetching and caching |

### Backend
| Technology | Purpose |
|------------|---------|
| FastAPI | High-performance Python API |
| SQLAlchemy | ORM for database operations |
| Pydantic | Data validation |
| JWT | Authentication tokens |
| Turso/libSQL | Edge-ready SQLite database |

### Infrastructure
| Technology | Purpose |
|------------|---------|
| Docker | Containerization |
| GitHub Actions | CI/CD pipelines |
| Cloudflare | CDN and edge computing |
| Sentry | Error tracking |
| Analytics | Multi-provider support |

## 📊 Performance

- **Lighthouse Score**: 95+ across all metrics
- **Core Web Vitals**: Green on all metrics
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3.5s
- **Bundle Size**: < 200KB (gzipped)

## 🌍 Internationalization

Supported languages:
- 🇺🇸 English (en)
- 🇪🇸 Spanish (es)
- 🇫🇷 French (fr)
- 🇩🇪 German (de)
- 🇵🇹 Portuguese (pt)
- 🇨🇳 Chinese (zh)
- 🇯🇵 Japanese (ja)
- 🇸🇦 Arabic (ar) - RTL support
- 🇮🇳 Hindi (hi)

## 🔐 Security Features

- JWT authentication with refresh tokens
- Two-factor authentication (2FA)
- Rate limiting (tiered by user role)
- CORS protection
- CSRF tokens
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- Security headers (CSP, HSTS, X-Frame-Options)
- Audit logging for compliance

## 📖 Documentation

- [Architecture Overview](docs/Architecture.md)
- [API Documentation](docs/API_Overview.md)
- [Authentication Guide](docs/Auth_JWT.md)
- [Deployment Guide](docs/DeploymentGuide.md)
- [Engineering Standards](docs/ENGINEERING_STANDARDS_2025.md)
- [Contributing Guidelines](docs/Contributing.md)

## 🧪 Testing

```bash
# Frontend tests
cd frontend
npm test
npm run test:e2e  # End-to-end tests

# Backend tests
cd backend
pytest tests/ -v
pytest tests/ --cov=app  # With coverage
```

## 📦 Deployment

### Vercel (Frontend)
```bash
vercel --prod
```

### Docker (Full Stack)
```bash
docker compose -f docker-compose.prod.yml up -d
```

### Manual Deployment
See [Deployment Guide](docs/DeploymentGuide.md) for detailed instructions.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](docs/Contributing.md).

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js Team](https://nextjs.org/) for the amazing framework
- [FastAPI](https://fastapi.tiangolo.com/) for the high-performance backend
- [Turso](https://turso.tech/) for edge-ready database
- All our amazing contributors

---

<p align="center">
  Made with ❤️ by the MegiLance Team
</p>

<p align="center">
  <a href="https://megilance.com">Website</a> •
  <a href="https://docs.megilance.com">Documentation</a> •
  <a href="https://twitter.com/megilance">Twitter</a> •
  <a href="https://discord.gg/megilance">Discord</a>
</p>
