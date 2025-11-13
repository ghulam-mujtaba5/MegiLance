# System Architecture

## 1. Logical Architecture
```
+---------------+        HTTPS        +----------------+        Wallet TLS        +---------------------------+
|   Frontend    |  ─────────────────▶ |    Backend     |  ─────────────────────▶  | Oracle Autonomous DB 23ai |
| Next.js 14    |                     | FastAPI / Uvicorn|                         | (Managed, encrypted)      |
+---------------+                     +----------------+                          +---------------------------+
        │                                      │
        │                                      │ (Future)
        │                                      └──────────▶ AI Service (ML Inference) 
        │
        ▼
  End Users (Client / Freelancer)
```

## 2. Deployment Architecture (Current Minimal)
```
Oracle VM (VM.Standard.E2.1.Micro)
  ├─ docker-compose.minimal.yml
  │   ├─ backend (FastAPI, Gunicorn/Uvicorn workers)
  │   └─ nginx (reverse proxy, static caching)
  │
  └─ Attached: Oracle Wallet (secure client credentials)

Frontend (DigitalOcean App Platform)
  └─ Build → Deploy → Serve static + SSR over Node runtime
```

## 3. Component Responsibilities
| Component | Responsibilities | Tech | Scaling Path |
|-----------|-----------------|------|--------------|
| Frontend | UI rendering, theme mgmt, auth token storage, API calls | Next.js 14, TypeScript | Horizontal (platform-managed) |
| Nginx | Reverse proxy, compression, static caching, security headers | Nginx | Add rate limiting / WAF |
| Backend API | Auth, domain logic, validation, orchestration | FastAPI, Pydantic, SQLAlchemy | Split services (user, project, messaging) |
| Database | Persistent relational storage & SQL features | Oracle 23ai Autonomous | Scale via service tier (future) |
| AI (Future) | Recommendation, skill inference, NLP | FastAPI + ML libs | Separate microservice + GPU (if needed) |

## 4. Data Flow (Authentication Sequence)
```
[User] → /api/auth/login (POST credentials)
  → Validate (FastAPI / Pydantic)
  → Query user (Oracle DB)
  → Issue JWT access (30m) + refresh (7d)
  → Store minimal session claims in token (stateless)
[User] ← Tokens stored (httpOnly cookie or memory) → Subsequent API calls attach Authorization: Bearer <token>
```

## 5. Persistence Model Decisions
| Aspect | Choice | Rationale |
|--------|--------|-----------|
| DB | Oracle Autonomous DB 23ai | Managed, free tier eligible, wallet security |
| ORM / Access | SQLAlchemy + Async | Balance productivity & performance |
| Migrations | Future Alembic integration | Deterministic schema evolution |
| Transactions | Unit-of-work per request dependency | Consistency & rollback safety |

## 6. Configuration & Secrets
| Category | Mechanism | Notes |
|----------|----------|-------|
| DB Wallet | Mounted readonly volume | Kept out of image layers |
| Secret Keys | .env (future: vault) | Rotate on release cycles |
| Environment Separation | Distinct .env variants | dev / prod divergence explicit |

## 7. Scalability Strategy
| Challenge | Current Mitigation | Future Evolution |
|----------|--------------------|------------------|
| CPU Saturation | Light worker count (<=2) | Add service tier, horizontal split |
| Memory Limits | Remove AI service from micro VM | Dedicated AI node / serverless |
| Cold Starts | Pre-warmed containers | Add queue-based warmers |
| DB Connection Pool | Conservative pool size | Introduce async pooling / pgbouncer analogue if needed |

## 8. Resilience & Fault Handling
| Failure Type | Detection | Handling |
|--------------|----------|----------|
| Backend Crash | Docker restart policy | Auto-restarts; alert logs (future) |
| DB Connectivity | Readiness endpoint fails | Health checks used for rollback decisions |
| Memory OOM | Container exit | Memory limits & slim images |

## 9. Observability Model
| Layer | Signals | Tooling (Current / Planned) |
|-------|---------|-----------------------------|
| Infra | CPU, Memory, Disk | Docker stats / future Prometheus sidecar |
| App | Structured logs, request latency | Logging formatter (planned) |
| Health | /api/health/live /ready | Integrated load balancer checks |
| Errors | Exception traces | Add Sentry / OpenTelemetry later |

## 10. Security Architecture (Summary)
| Domain | Control |
|--------|---------|
| Transport | HTTPS (frontend), internal Docker network (backend) |
| Auth | JWT access + refresh rotation |
| Secrets | Wallet + environment isolation |
| Input Validation | Pydantic schemas everywhere |
| Principle of Least Privilege | Minimal OS packages, non-root containers (target state) |

(Full detail: `SecurityCompliance.md`, `ThreatModel.md`)

## 11. Build & Release Flow
```
Commit (main) ──▶ GitHub Repo ──▶ Webhook → Oracle VM:
  git pull → docker-compose up --build → health test → live
```
Future upgrade: Add canary or blue/green via versioned compose profiles.

## 12. Architectural Decision Records (Snapshot)
| ID | Decision | Status | Rationale |
|----|----------|--------|-----------|
| ADR-001 | FastAPI backend | Accepted | Async & typed | 
| ADR-002 | Oracle Autonomous DB | Accepted | Free tier + managed |
| ADR-003 | Remove AI from minimal VM | Accepted | Memory constraint |
| ADR-004 | Webhook CD instead of Actions | Accepted | Requirement constraint |
| ADR-005 | Docker Compose (minimal) | Accepted | Simplicity & portability |

(Consider moving to /docs/adr/ with one file per ADR as system evolves.)

## 13. Extensibility Points
| Point | Mechanism |
|-------|-----------|
| Payment Integration | Add payments microservice + webhook consumer |
| Real-time Messaging | WebSocket gateway / separate service |
| Analytics | Event ingestion + warehouse (DuckDB / ClickHouse) |
| AI Services | Isolated container with resource requests |

## 14. Current Gaps / Technical Debt
| Gap | Impact | Planned Action |
|-----|--------|----------------|
| Missing Alembic migrations | Risk of drift | Introduce migration baseline |
| Lack of structured logging | Harder diagnostics | Add log config module |
| No automated tests in CI | Manual regression risk | Add lightweight test runner (local) |
| No rate limiting | Abuse potential | Introduce Nginx or app-level limiter |

## 15. Architecture Validation Checklist
- [x] Single responsibility per container boundary
- [x] Stateless API (sessionless JWT)
- [x] Separation of configuration from code
- [x] Horizontal scalability plan documented
- [ ] Structured logging implemented (IN PROGRESS)
- [ ] Formal migration process established (PLANNED)

---
Prepared under modern architecture documentation conventions (C4-lite + operational overlays). See `ProjectOverview.md` for contextual grounding.
