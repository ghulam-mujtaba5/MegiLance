# API Overview & Versioning

Current stack: FastAPI backend, JSON/REST style. Future evolution may introduce GraphQL or gRPC for internal services.

## 1. Versioning Strategy
| Aspect | Policy |
|--------|-------|
| Path prefix | `/api/v1/...` (prepare for `/v2`) |
| Deprecated endpoints | Mark in OpenAPI description + sunset date |
| Breaking change cadence | Bundle; max quarterly in early phase |
| SemVer mapping | Major = breaking endpoint/contract change |

## 2. Endpoint Categories (Planned Baseline)
| Domain | Purpose | Examples |
|--------|---------|----------|
| Auth | Account lifecycle & tokens | POST /auth/register, POST /auth/login |
| Health | Liveness/readiness | GET /health/live, /health/ready |
| Users | Profile & skills | GET /users/{id}, PATCH /users/me |
| Projects | Project posting & browsing | POST /projects, GET /projects |
| Proposals | Freelancer bids | POST /projects/{id}/proposals |
| Contracts | Accepted engagements | GET /contracts/{id} |
| Reviews | Reputation data | POST /contracts/{id}/reviews |
| Skills | Taxonomy listing | GET /skills |

## 3. Standard Response Envelope (Proposed)
```json
{
  "data": { /* resource or collection */ },
  "error": null,
  "meta": { "request_id": "uuid", "pagination": {"page":1,"page_size":20,"total":42} }
}
```
Errors:
```json
{
  "data": null,
  "error": { "code": "VALIDATION_ERROR", "message": "Field X required", "details": [{"field":"email","issue":"missing"}] },
  "meta": { "request_id": "uuid" }
}
```

## 4. Error Code Catalog (Initial)
| Code | HTTP | Meaning |
|------|------|---------|
| VALIDATION_ERROR | 400 | Invalid request payload |
| UNAUTHORIZED | 401 | Missing/invalid token |
| FORBIDDEN | 403 | Role lacks permission |
| NOT_FOUND | 404 | Resource absent |
| CONFLICT | 409 | State conflict (duplicate) |
| RATE_LIMITED | 429 | Too many requests (future) |
| SERVER_ERROR | 500 | Unhandled exception |

## 5. Pagination Contract
| Param | Default | Notes |
|-------|---------|-------|
| page | 1 | 1-based |
| page_size | 20 | Max 100 |
| sort | created_at:desc | field:direction pairs |

Response pagination meta includes: page, page_size, total, total_pages.

## 6. Filtering & Query
- Whitelist filterable fields per resource (server-side enforcement)
- Disallow arbitrary field injection (prevent mass assignment)

## 7. Rate Limiting (Planned)
| Scope | Limit | Window |
|-------|-------|--------|
| Auth login | 5 attempts | 5 min |
| Auth register | 10 attempts | 1 hour |
| General GET | 100 req | 1 min |

## 8. OpenAPI / Documentation
| Tool | Usage |
|------|-------|
| FastAPI built-in | `/api/docs` (Swagger UI) |
| Redoc | `/api/redoc` |
| Generated schema | `/api/openapi.json` for client generation |

## 9. CORS Policy
| Setting | Rule |
|---------|------|
| Allowed origins | Frontend domain only (prod) |
| Methods | Standard CRUD + OPTIONS |
| Credentials | Optional (depends on auth token transport) |

## 10. Idempotency (Future Consideration)
- Provide `Idempotency-Key` header for POST operations with at-least-once semantics (payments etc.)

## 11. Stability Guarantees
| Zone | Stability |
|------|----------|
| v1 public endpoints | Stable (additive changes only) |
| Experimental endpoints | `/api/v1/exp/*` resettable |

## 12. Deprecation Lifecycle
| Stage | Indicator | Duration |
|-------|-----------|----------|
| Announce | Changelog entry | 0 weeks |
| Deprecated | OpenAPI deprecation flag | 4–8 weeks |
| Removal | 410 Gone if accessed | After window |

---
Canonical API contract reference; update alongside any schema or semantics change.
