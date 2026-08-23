# Database Verification & Maintenance Scripts

This directory contains automated database security, integrity, and state-machine verification scripts used during CI/CD pipelines and production audits.

## Canonical Schema & Migrations
All official, version-controlled database schema changes and migrations are located in:
`supabase/migrations/` (managed via sequential timestamped migrations).

## Active Verification Scripts

| Script | Purpose | CI/Automated Usage |
|---|---|---|
| `verify_rls_security.sql` | Verifies Row Level Security (RLS) is enabled on all tables, audit logs, and critical entities with comprehensive coverage. | Executed in `.github/workflows/ci.yml` during test DB validation. |
| `verify_schema_integrity.sql` | Asserts foreign keys, unique constraints, indices, and required columns across public tables. | Manual/Audit inspection. |
| `verify_state_machine_trigger.sql` | Tests booking state machine transition triggers and invariants. | Manual/Audit inspection. |

## Archive Directory (`db_scripts/archive/`)
Historical, ad-hoc, and one-off diagnostic scripts from early development stages are archived in `db_scripts/archive/`.
**DO NOT EXECUTE ARCHIVED SCRIPTS IN PRODUCTION OR CI PIPELINES.**
