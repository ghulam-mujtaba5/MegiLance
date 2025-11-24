# Backend Maintenance Scripts

This directory contains non-runtime scripts used for data fixes, migrations, audits, and operational support.

## Categories
- **Schema/Table Management**: `create_all_tables.py`, `create_minimal_schema.py`, `create_missing_tables_manual.py`
- **Seeding & Data**: `seed_users_only.py`, `seed_demo_data.py`, `seed_relationships.py`, `populate_complete_data.py`
- **Password/User Audits**: `check_passwords.py`, `check_all_users.py`, `update_all_passwords.py`
- **Role & Tag Fixes**: `fix_invalid_tags.py`, `quick_fix_tags.py`, `fix_database_roles.py`
- **Turso Sync**: `sync_turso_to_local.py`, `sync_to_turso.py`, `verify_turso.py`
- **Admin Utilities**: `fix_admin.py`, `update_admin_password.py`

## Usage Guidelines
1. ALWAYS back up the database before running mutation scripts.
2. NEVER run fix scripts in production without code review + staging test.
3. Log output to a file when performing bulk updates.
4. Prefer idempotent scripts; re-runs should not corrupt state.

## Examples
```bash
# Create all tables (development only)
python scripts/maintenance/create_all_tables.py

# Sync remote Turso schema locally
python scripts/maintenance/sync_turso_to_local.py

# Audit user password hashes
python scripts/maintenance/check_passwords.py
```

## Adding New Scripts
- Place in this directory; name with a clear verb prefix (`check_`, `fix_`, `seed_`, `sync_`).
- Include a top comment describing purpose, inputs, outputs, rollback plan.
- Update this README section under the appropriate category.

## Safety Checklist Before Running
- Environment verified (`ENVIRONMENT=development` or staging).
- Recent backup available.
- Dry-run mode available OR script inspected.

---
_Last updated: 2025-11-25_