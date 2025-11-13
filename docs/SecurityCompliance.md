# Security & Compliance Overview

Baseline aligned with OWASP ASVS (selected controls), OWASP Top 10 2021, and preparation for future ISO 27001 style governance.

## 1. Scope & Assets
| Asset | Classification | Notes |
|-------|---------------|-------|
| Source Code | Internal | Public portions (frontend) distinct from backend private logic |
| User Accounts (PII: email) | Confidential | Minimal PII stored |
| Credentials (JWT secrets, DB password) | Secret | Rotate & never commit |
| Oracle Wallet | Secret | File permission 500, segregated mount |

## 2. Threat Surface Summary
| Vector | Risk | Current Control | Roadmap |
|--------|------|----------------|---------|
| Auth endpoints | Credential stuffing | Rate limit (future), strong hashing | Add IP based throttling |
| JWT theft | Session hijack | HTTPS (future), httpOnly tokens if cookies used | Token binding / rotation |
| SQL access | Injection | Parameterized queries via ORM | Static analysis |
| Config secrets | Leakage | .env excluded from VCS | Sealed secret store |
| DoS (resource exhaustion) | Availability | Single worker limit | Add proxy rate limits |
| XSS (frontend) | Data integrity | React auto-escaping | CSP headers |

## 3. Control Mapping (Sample)
| OWASP ASVS Area | Implemented | Gap Action |
|-----------------|------------|-----------|
| V2 Auth | Password hashing planned (Argon2) | Add brute force delay |
| V3 Session Mgmt | JWT stateless tokens | Add refresh rotation strategy |
| V5 Validation | Pydantic schema validation | Centralize custom sanitizers |
| V9 Data Protection | Wallet secured, secrets external | Add secret rotation guide |
| V10 Communications | Planned HTTPS | Enforce HSTS once TLS live |

## 4. Password & Credential Policy
| Item | Policy |
|------|--------|
| Hashing | Argon2id (memory cost tuned for 1GB) |
| Minimum length | 12 characters (enforced client & server) |
| Secret rotation | Manual on compromise; future scheduled rotation |

## 5. Logging & Privacy
| Aspect | Approach |
|--------|---------|
| PII logging | Avoid storing email in error contexts |
| Sensitive tokens | Never logged; filter middleware (planned) |
| Audit trail | Minimal (auth events) – extend later |

## 6. Secure Configuration Checklist (Backend Container)
| Check | Command / Verification |
|-------|-----------------------|
| Wallet perms | `ls -ld wallet` == 500 |
| No secrets in image | `docker history` review build layers |
| Running user (future) | Use non-root base image |

## 7. API Hardening (Planned)
| Control | Rationale |
|---------|-----------|
| Rate limiting | Prevent brute force & abuse |
| Input size caps | Prevent payload exhaustion |
| CORS strict allowlist | Limit origin access |
| Security headers | X-Content-Type-Options, X-Frame-Options, CSP |

## 8. Incident Response (Initial Playbook)
| Phase | Action |
|-------|--------|
| Detect | Monitor logs for anomalies (error spikes) |
| Contain | Revoke suspect credentials, block IP range |
| Eradicate | Patch vulnerability and redeploy |
| Recover | Validate health endpoints + manual functional test |
| Post-mortem | Document root cause & corrective actions |

## 9. Data Protection & Retention
| Data | Protection | Retention |
|------|-----------|-----------|
| Credentials | Strong hashing / env secrets | Until user deletion |
| Reviews | Non-sensitive | Indefinite (soft delete future) |

## 10. Roadmap Priorities
| Priority | Control |
|----------|---------|
| P1 | Enforce HTTPS & HSTS |
| P1 | Argon2 password hashing integration |
| P2 | Rate limiting middleware |
| P2 | Security headers via Nginx |
| P3 | Centralized secret rotation doc |
| P3 | Basic WAF/CDN front layer |

---
Living document – update after each security-relevant change.
