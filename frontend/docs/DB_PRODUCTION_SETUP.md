# Production Database Setup

This document provides instructions for applying critical SQL scripts to the production Supabase database and performing necessary manual data entry.

## 1. Apply SQL Scripts

Run the following scripts in the Supabase SQL Editor in the order listed:

### Audit Logs Setup
**File:** `db_scripts/setup_audit_logs.sql`
**Purpose:** Initializes the audit logging system to track changes across the database.

### Property Overrides Setup
**File:** `db_scripts/setup_property_overrides.sql`
**Purpose:** Creates the `property_overrides` table, which is used to map property slugs to their respective UUIDs and other configuration overrides.

## 2. Manual Data Entry: Property Overrides

After applying `setup_property_overrides.sql`, you must populate the `property_overrides` table via the Supabase Dashboard.

### Steps:
1. Go to the **Table Editor** in your Supabase Dashboard.
2. Select the `property_overrides` table.
3. Add entries for each property that requires a slug-to-UUID mapping.
4. **Columns:**
   - `slug`: The URL-friendly identifier for the property (e.g., `luxury-villa-alanya`).
   - `property_id`: The actual UUID of the property from the `properties` table.
   - (Optional) Other override fields as defined in the schema.

---
**Note:** Do not apply these scripts multiple times unless they are designed to be idempotent. Always verify the current schema state before execution.
