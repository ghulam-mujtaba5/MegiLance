# MegiLance AI Agent Instructions
My development agent instructions high priority important;please follow them strictly.
Efficiency and Resource Management:
- Avoid redundant builds to prevent wasting time and computational resources
- Minimize use of automated scripts for fixes; prioritize manual reviews instead  
- Use progress tracking effectively for iterative and complex tasks

Progress Tracking and Task Management:
- Maintain detailed progress tracking and to-do lists throughout development
- Continue working iteratively until all remaining work is completed

Additional Context:
 Apply these principles consistently across all development activities within this codebase.


Problem-Solving Approach:

- Identify problems and implement fixes based on your understanding

- Only request my input for critical reviews or decisions, not for routine problem-solving

- Manually review all frontend/UI/UX elements, specifically examining all  CSS files and TSX files for issues check all issues types to make them perfect for each angle and perspective and domain ui ux peromnce secuoty and optimization and evrything in sofwtare negeiring relted 
Development Tools and Environment:
Prefer command-line interface (CLI) tools for all third-party deployments, hosting services, database management, and development operations to enable full automation and proper context-aware development with comprehensive system overview.

Mandatory tool usage requirements:
- Extensively utilize Chrome DevTools for debugging and development tasks
- Use MCP (Model Context Protocol) development tools for AI-assisted development
- Execute all operations through terminal/command prompt interfaces
- Prioritize existing installed tools whenever possible
- Automatically install missing tools only when absolutely necessary for task completion

Authentication protocols:
- For any service requiring authentication, verify current authentication status first
- If not authenticated, prompt me to provide login credentials and complete authentication before proceeding

Work execution standards:
- Maintain continuous automated operation without manual intervention
- Persistently work until all identified tasks and fixes are fully completed
- Provide progress updates only when critical issues arise or tasks are completed
make sure you all plan and staretgy create fulll implentaetd 100 percent no nayhting skip and left before stop working
keep in mind the d1 datad base free tier limts also in mind we not want to updagre to biiling just wnat to use the free tier only
## Architecture Overview
```
Next.js Frontend → FastAPI Backend → Turso (libSQL)
```
**Stack**: Next.js 14 + TypeScript + CSS Modules | FastAPI + SQLAlchemy + Turso

## Frontend Rules (Next.js 14)

### CSS Architecture (CRITICAL)
**Every component needs 3 CSS files:**
```
Component.common.module.css  → layout, structure, motion
Component.light.module.css   → light theme colors
Component.dark.module.css    → dark theme colors
```

**Theme integration pattern:**
```tsx
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import commonStyles from './Component.common.module.css';
import lightStyles from './Component.light.module.css';
import darkStyles from './Component.dark.module.css';

const { resolvedTheme } = useTheme();
const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;
return <div className={cn(commonStyles.container, themeStyles.container)} />;
```

### Component Conventions
- **@AI-HINT comment required** at top of every file explaining purpose
- **TypeScript mandatory** with full type safety
- **Button variants**: primary, secondary, danger, outline, ghost, social, success, warning
- **Button sizes**: sm, md, lg, icon
- **No global CSS** - all styling scoped to components
- **Accessibility**: Include ARIA labels on interactive elements

### Route Structure
```
app/
  (auth)/      → login, signup (public)
  (main)/      → marketing pages (public)
  (portal)/    → dashboards (protected)
```

### Design Tokens
- Primary: `#4573df` | Success: `#27AE60` | Error: `#e81123` | Warning: `#F2C94C` | Accent: `#ff9800`
- Fonts: Poppins (headings), Inter (body), JetBrains Mono (code)

## Backend Rules (FastAPI)

### Project Structure
```
backend/app/
  core/      → config, security, storage utils
  models/    → SQLAlchemy models
  schemas/   → Pydantic request/response
  api/v1/    → endpoint handlers
  services/  → business logic
```

### API Conventions
- **Authentication**: JWT tokens (30min access, 7 days refresh)
- **Roles**: Client/Freelancer enforced at endpoint level
- **Status codes**: 201 (created), 204 (no content), 400 (bad request), 403 (forbidden), 404 (not found)
- **All inputs** validated via Pydantic schemas
- **All endpoints** have comprehensive docstrings
- Use `Depends()` for DB sessions and auth

### Key Endpoints
- Health: `/api/health/live`, `/api/health/ready`
- Docs: `/api/docs` (Swagger), `/api/redoc`
- Auth: `/api/auth/register`, `/api/auth/login`, `/api/auth/refresh`

### Database
- **Database**: Turso (libSQL) - distributed SQLite
- **Models**: User, Project, Proposal, Contract, Payment, Portfolio, Message, Review, Skill
- **Dev**: SQLite file (`local.db`), `init_db()` creates tables on startup
- **Prod**: Turso cloud database with auth token
- **Migrations**: Use Alembic for schema changes

## Local Development

**Start all services:**
```powershell
docker compose up -d
```
- Frontend: http://localhost:3000
- Backend: http://localhost:8000/api/docs
- Database: SQLite file at `backend/local.db`

**Frontend API calls** (backend proxied at `/backend/*`):
```ts
const res = await fetch('/backend/api/health/live');
```

**Rebuild after dependency changes:**
```powershell
docker compose build backend frontend
```

## Testing
```powershell
# Backend
cd backend
pytest tests/ -v

# Frontend
cd frontend
npm test
```

## Common Pitfalls
❌ **DON'T**:
- Use global CSS or Tailwind utilities for component styles
- Hardcode credentials or API keys
- Forget light/dark theme handling
- Skip `@AI-HINT` comments
- Break Button variant/size contracts

✅ **DO**:
- Use 3-file CSS Module pattern
- Validate all API inputs with Pydantic
- Use `cn()` utility for class merging
- Check health endpoints after backend changes
- Test both auth states for new features

## Quick Commands

```powershell
# Local dev
docker compose up -d                    # Start
docker compose logs -f backend          # Logs
docker compose down                     # Stop

# Backend
cd backend
uvicorn main:app --reload              # Dev server
pytest tests/ -v                       # Tests

# Frontend
cd frontend
npm run dev                            # Dev server
npm run build                          # Production build
npm test                               # Tests

# Database migrations
cd backend
alembic revision --autogenerate -m "description"
alembic upgrade head
```

## Key Files
- `TURSO_SETUP.md` - Database setup and configuration
- `frontend/README.md` - Frontend architecture details
- `backend/README.md` - Backend API documentation
- `MegiLance-Brand-Playbook.md` - Design system
- `docs/SystemArchitectureDiagrams.md` - System architecture
