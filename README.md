# MegiLance

> **AI-Powered Freelancing Platform with Blockchain Payments**

[![Deploy Status](https://github.com/ghulam-mujtaba5/MegiLance/actions/workflows/deploy-backend.yml/badge.svg)](https://github.com/ghulam-mujtaba5/MegiLance/actions)

A comprehensive freelancing platform featuring AI-powered matching, blockchain-based payments, and enterprise-grade architecture.

## 🎯 **NEW: Turso Database - Simple & Scalable!**

**Using Turso for database?** → See **[docs/TURSO_SETUP.md](docs/TURSO_SETUP.md)** 🚀

**Quick Start (Turso):** 
```powershell
# Local development - just works!
cd backend
python -m uvicorn main:app --reload
```

**Benefits:**
- ✅ Free tier: 500 databases, 9GB storage, 1B reads/month
- ✅ Edge replication for global low latency
- ✅ SQLite-compatible (simple migration)
- ✅ No complex setup (one URL + token)
- ✅ Perfect for serverless deployments

**Setup Docs:**
- **[docs/TURSO_SETUP.md](docs/TURSO_SETUP.md)** - Complete Turso guide 📖

---

## 🚀 Quick Start

**Local development:**

```bash
# Start all services
docker compose up -d

# Frontend: http://localhost:3000
# Backend: http://localhost:8000/api/docs
```

## 📋 Documentation

### Maintenance
- **[docs/MAINTENANCE.md](docs/MAINTENANCE.md)** - Maintenance scripts and common tasks
- **[docs/TURSO_SETUP.md](docs/TURSO_SETUP.md)** - Turso database setup and management

### Deployment
- **[docs/DeploymentGuide.md](docs/DeploymentGuide.md)** - Production deployment guide
- **[docs/](docs/)** - System architecture and design docs

### Services
- **[backend/README.md](backend/README.md)** - Backend API documentation
- **[frontend/README.md](frontend/README.md)** - Frontend architecture

## 🏗️ Architecture

### Current Architecture
```
Frontend (Next.js) → Backend (FastAPI) → Turso (libSQL)
                          ↓
                    Local/Cloud Storage
                          ↓
                    AI Service (optional)
```

### Tech Stack

**Backend:**
- FastAPI + Python 3.11
- Turso (libSQL) - Distributed SQLite
- JWT Authentication
- Local file storage (upgradeable to S3/R2)
- Circle API for USDC payments
- OpenAI for AI features

**Frontend:**
- Next.js 14 (App Router)
- TypeScript
- CSS Modules (light/dark themes)
- Responsive design

**Infrastructure:**
- Docker Compose for local development
- Turso for database (edge replicated)
- Flexible deployment (any cloud platform)
- Docker for containerization

## 💻 Local Development

### Prerequisites
- Docker Desktop
- Node.js 18+
- Python 3.11+

### Development Mode (Hot Reloading) ⚡

**Recommended for development** - Code changes automatically reload:

```pwsh
# Start with hot reloading
.\start-dev.ps1

# Or manually
docker compose -f docker-compose.dev.yml up --build
```

**Features:**
- ✅ Frontend hot reloading (Next.js Fast Refresh)
- ✅ Backend hot reloading (Uvicorn auto-reload)
- ✅ Instant code changes without rebuild
- ✅ Volume mounts for live development

**Services:**
- Frontend: http://localhost:3000 (Hot Reload: ✓)
- Backend API: http://localhost:8000/api/docs (Hot Reload: ✓)
- Database: localhost:5432

**View logs:**
```pwsh
docker compose -f docker-compose.dev.yml logs -f
docker compose -f docker-compose.dev.yml logs -f frontend
docker compose -f docker-compose.dev.yml logs -f backend
```

**Stop services:**
```pwsh
docker compose -f docker-compose.dev.yml down
```

### Production Mode

**For production-like testing:**

```pwsh
# Start in production mode
.\start-prod.ps1

# Or manually
docker compose up --build -d
```

**Services:**
- Frontend: http://localhost:3000
- Backend: http://localhost:8000/api/docs
- Database: localhost:5432

**Stop services:**
```pwsh
docker compose down
```

### Notes

- The frontend proxies backend requests via `/backend/*`:
  ```ts
  // Example from the frontend
  const res = await fetch('/backend/api/health/live');
  const data = await res.json();
  ```

- Backend exposes health endpoints at `/api/health/live` and `/api/health/ready`
- In development mode, code changes reflect immediately without rebuilding containers

# MegiLance Frontend

A premium, investor-grade frontend for the MegiLance platform built with Next.js (App Router), TypeScript, CSS Modules, and a theme-aware design system.

## Vision
- Pixel-perfect, modern UI matching products like Linear, Vercel, GitHub, Toptal, and Figma.
- Three-role system: Admin, Client, Freelancer.
- Strictly frontend-first until explicitly approved to start backend work.

## Tech Stack
- Next.js (App Router), React, TypeScript
- CSS Modules (common/light/dark per component)
- next-themes for theming
- recharts for data viz
- lucide-react & react-icons for icons

## Project Structure
```
frontend/
  app/
    Home/
      Home.tsx
      Home.common.module.css
      Home.light.module.css
      Home.dark.module.css
      components/
        Hero.tsx
        Features.tsx
        AIShowcase.tsx
        BlockchainShowcase.tsx
        HowItWorks.tsx
        GlobalImpact.tsx
        Testimonials.tsx
        CTA.tsx
        ...theme css files per component
    (auth)/
      login/
      signup/
    (portal)/
      client/
      freelancer/
    components/
      Button/
      Input/
      Tabs/
      UserAvatar/
      ...
```

## Design System
- Colors
  - Primary: #4573df (MegiLance Blue)
  - Accent: #ff9800, Success: #27AE60, Error: #e81123, Warning: #F2C94C
- Fonts: Poppins (headings), Inter (body), JetBrains Mono (code)
- Shadows: subtle, layered, motion-aware
- Spacing grid: 4/8px scale, section rhythm unified via `homeSection` + `sectionContainer`
- Components are theme-aware via three CSS modules per component:
  - `*.common.module.css` (structure, layout, motion)
  - `*.light.module.css` (colors for light)
  - `*.dark.module.css` (colors for dark)

## Buttons
- Variants: primary, secondary, success, warning, danger, outline, ghost, social
- Sizes: sm, md, lg, icon (legacy aliases: small, medium, large)
- Social variant supports `provider="google|github"` for subtle brand accenting.
- All variants have micro-interactions, focus rings, and accessible states.

## Theming
- `useTheme()` with `next-themes`
- CSS modules reference CSS variables for light/dark where applicable
- No global CSS except theme variables

## Homepage UX
- Unified section container for consistent layout: `Home.common.module.css -> .sectionContainer`
- Sections wrapped in `Home.tsx` for perfect rhythm and width constraints
- CTA primary button fixed for visibility on hover (forced white text in theme files)

## Conventions
- Add `// @AI-HINT:` comments at top of components to describe intentions
- No overuse of global components that would disrupt existing polished UI
- Prefer composition: small, reusable parts over monoliths
- Ensure ARIA roles/labels for interactive elements

## Scripts
- `pnpm dev` or `npm run dev` – start dev server
- `pnpm build` – build production bundle
- `pnpm start` – run production server
- `pnpm lint` – lint

## Contributing
- Use per-component CSS structure (.common/.light/.dark)
- Keep components theme-aware and responsive
- Maintain consistent spacing and typography
- Avoid breaking variant/size contracts in shared components (e.g., `Button`)

## Status
- Admin, Client, Freelancer portals modernized
- Homepage modernized with unified layout container; sections are premium and theme-aware
- Auth pages upgraded with social buttons (glass/gradient)

## Roadmap (Frontend)
- Continue polishing micro-interactions and motion
- Expand documentation in `/docs` (Design tokens, iconography, accessibility)

