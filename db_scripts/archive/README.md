# Historical Database Scripts Archive

⚠️ **DANGER / WARNING**:
Scripts in this folder are **historical artifacts** from early development, manual hotfixes, and one-off debug sessions.

- **DO NOT** execute these scripts in production environments.
- **DO NOT** execute these scripts in automated CI/CD pipelines.
- All production schema changes must go through version-controlled migrations in `supabase/migrations/`.

## Script Classification

- **Destructive/Repair Scripts**: Scripts such as `disable_rls_emergency.sql`, `truncate_all_bookings.sql`, `delete_revenue_anomaly.sql`, `force_admin_fix.sql`, and `fix_recursion_final.sql` contain destructive statements (TRUNCATE, DELETE, DISABLE RLS, FORCE UPDATE) and have explicit safety banners.
- **Historical Feature Scripts**: One-time schema setups and RPC helpers that have since been consolidated into `supabase/migrations/`.
