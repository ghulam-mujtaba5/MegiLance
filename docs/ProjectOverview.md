# Project Overview

## 1. Executive Summary
MegiLance is a freelancing & talent collaboration platform combining a modern Next.js 14 frontend, a FastAPI backend, and Oracle Autonomous Database (23ai) for resilient transactional storage. The platform targets rapid iteration, production‑grade deployment on Always Free Oracle resources (backend + DB) and Student Pack resources (DigitalOcean for frontend), with cloud portability and security best practices embedded.

## 2. Core Value Proposition
- Unified workspace for clients & freelancers
- Secure authentication & role separation (Client / Freelancer)
- Messaging, proposals, contracts, reviews, skill tagging
- Performance optimized minimal backend footprint for 1 GB VM

## 3. Technology Stack
| Layer | Technology | Notes |
|-------|------------|-------|
| Frontend | Next.js 14 (App Router, TypeScript, CSS Modules) | Theming via light/dark modular CSS tri-file pattern |
| Backend | FastAPI (Python 3.11) | Async I/O, Pydantic validation, dependency injection |
| Database | Oracle Autonomous DB 23ai | Wallet-based secure connection, managed encryption |
| AI (future) | FastAPI microservice (TensorFlow / Transformers) | Excluded from minimal VM deployment due to memory constraints |
| Deployment | Oracle VM (VM.Standard.E2.1.Micro) + DigitalOcean App Platform | Always Free + Student Pack synergy |
| Containerization | Docker + docker-compose | Minimal production compose profile |
| Reverse Proxy | Nginx (container) | TLS termination (future), routing |
| Version Control | GitHub | Webhook-based CD (no GitHub Actions) |

## 4. High-Level Architecture
```
Browser (Next.js) → Nginx → FastAPI Backend → Oracle Autonomous DB
                         │
                         └─(Future) AI Service (separate compute)
```

## 5. Domain Capabilities
| Domain | Entities | Key Actions |
|--------|----------|-------------|
| Identity & Access | User, Role, Session, Token | Register, Login, Refresh, Revoke |
| Talent & Portfolio | Skill, PortfolioItem | Add skills, showcase work |
| Project Lifecycle | Project, Proposal, Contract | Post, bid, accept, manage deliverables |
| Commerce (Future) | Payment | Track escrow or direct payments |
| Reputation | Review | Rate participants post-contract |
| Communication (Future) | Message | Real-time or near real-time messaging |

## 6. Non-Functional Requirements
| Category | Target |
|----------|--------|
| Performance | P99 API < 750ms on micro VM |
| Availability | 99% (minimal free-tier infra) |
| Security | OWASP Top 10 mitigations + JWT hardening |
| Portability | Dockerized components, provider-neutral patterns |
| Observability | Structured logs, health & readiness endpoints |
| Scalability Path | Horizontal: separate AI/worker services, DB connection pooling |

## 7. Constraints & Assumptions
- Backend limited to 1 GB RAM; AI workloads deferred or externalized.
- No GitHub Actions (explicit requirement) → Webhook triggered CD.
- Oracle Autonomous DB credentials managed via wallet + env secrets.
- Initial release focuses on core marketplace lifecycle (not payments execution). 

## 8. Guiding Engineering Principles
1. Secure by default (least privilege, input validation, stateless auth)
2. Observability early (health, structured logs, readiness separation)
3. Progressive enhancement (AI & real-time features pluggable later)
4. Infrastructure minimalism (optimize for free tier sustainability)
5. Documentation as code (PR-reviewed changes to docs folder)

## 9. Current Maturity Level
| Dimension | Level | Notes |
|-----------|-------|-------|
| Feature Completeness | Alpha | Core scaffolding + domain model evolving |
| Operational Readiness | Beta | Automated deployment path established |
| Security Hardening | In Progress | Baseline auth + to expand with threat model |
| Scalability | Foundation | Container boundaries + stateless API |

## 10. Roadmap Snapshot
| Phase | Focus | Outcomes |
|-------|-------|----------|
| Phase 1 | Core Marketplace | Users, Projects, Proposals, Contracts |
| Phase 2 | Messaging & Reviews | Engagement + trust signals |
| Phase 3 | Payments Integration | Escrow / 3rd-party provider |
| Phase 4 | AI Assistance | Proposal scoring, skill inference |
| Phase 5 | Analytics & Dashboard | Engagement metrics, quality KPIs |

## 11. Success Metrics (Initial)
| Metric | Definition | Target |
|--------|------------|--------|
| API Health Uptime | % successful health checks | >= 99% |
| Median Response Time | 50th percentile request latency | < 250ms |
| Deployment Lead Time | Code push → live | < 5 min (webhook flow) |
| Onboarding Time | New dev setup time | < 15 min |

## 12. Key Risks (Excerpt)
| Risk | Impact | Mitigation |
|------|--------|-----------|
| VM Memory Pressure | Crashes / OOM | Memory limits, slim images |
| DB Connection Misconfig | Latency / failure | Wallet validation, retry logic |
| Secret Leakage | Compromise | Isolate .env, future vault integration |
| Missing Observability | Slow incident response | Introduce structured logging lib |

(Full register: see `RiskRegister.md`)

## 13. Stakeholders
| Role | Interest |
|------|----------|
| Product Owner | Feature alignment & velocity |
| Engineering Lead | Architecture integrity |
| Dev Team | Maintainability, clarity |
| Future Investors / Academic Supervisor | Technical rigor, extensibility |

## 14. Change Control
- All changes → GitHub Pull Requests
- Documentation updates required for architectural-impacting changes
- Semantic versioning once first stable release is tagged

## 15. References
- FastAPI Docs: https://fastapi.tiangolo.com/
- Next.js Docs: https://nextjs.org/docs
- Oracle Autonomous DB: https://docs.oracle.com/en/cloud/paas/
- OWASP ASVS / Top 10

---
This overview is the canonical high-level orientation document. For deeper implementation details proceed to: `Architecture.md`.
