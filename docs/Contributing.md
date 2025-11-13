# Contributing Guide

## 1. Ground Rules
| Rule | Reason |
|------|--------|
| Small, focused PRs | Easier review |
| No secrets in commits | Security |
| Follow code style doc | Consistency |
| Update docs with feature changes | Prevent drift |

## 2. Workflow
1. Fork / branch from `main` → `feature/<short-desc>`
2. Implement changes with tests
3. Run quality gate:
```
pytest -q
ruff check .
ruff format --check .
mypy backend/
```
4. Update related docs if contracts/config changed
5. Commit using conventional style: `feat(api): add project filter`
6. Open PR → fill template (add risk notes)
7. Address review feedback promptly

## 3. Commit Types (Conventional)
| Type | Meaning |
|------|---------|
| feat | New feature |
| fix | Bug fix |
| docs | Documentation-only |
| chore | Build/infra changes |
| refactor | Code change w/out feature or fix |
| test | Add/update tests |
| perf | Performance improvement |
| security | Security patch |

## 4. PR Review Checklist
| Item | Check |
|------|-------|
| Tests pass locally | YES/NO |
| Lint & types clean | YES/NO |
| No secrets added | YES/NO |
| Docs updated | YES/NO |
| Risk / security impact noted | YES/NO |

## 5. Code Review Guidelines
| Aspect | Focus |
|--------|------|
| Correctness | Logic matches requirements |
| Security | Input handling & auth checks |
| Performance | Avoid needless complexity |
| Clarity | Readable naming & structure |
| Tests | Adequate coverage of new paths |

## 6. Handling Feedback
| Situation | Action |
|-----------|-------|
| Minor nit | Batch updates in single commit |
| Major change request | Discuss rationale before rework |

## 7. Dependencies
| Policy | Detail |
|--------|-------|
| Add only if justified | Document reason in PR description |
| Remove unused | Clean during refactors |

## 8. Security Contributions
| Step | Action |
|------|-------|
| Vulnerability found | Privately report (create SECURITY.md future) |
| PoC provided | Reproduce in isolated branch |
| Fix | Add regression test |

## 9. Release Prep
| Task | Description |
|------|------------|
| Update CHANGELOG | Add under Unreleased → new version |
| Version bump | Semantic version in designated file (future) |

## 10. Communication
Prefer PR comments → escalate to issue if architectural.

---
Evolve guidelines as team grows; propose adjustments via PR.
