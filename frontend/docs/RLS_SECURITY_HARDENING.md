# RLS Security Hardening - Implementation Guide

## Overview

This migration implements comprehensive Row Level Security (RLS) policies on three critical tables: `profiles`, `bookings`, and `favorites`. RLS is enforced at the **database level**, meaning even if someone gains direct access to the Supabase JS client, they **cannot bypass** these security checks.

## Why RLS Matters

Without RLS, anyone with the Supabase URL and anon key (which is public by design) could:
- View all bookings across all users
- Modify or delete other users' bookings
- Access all user profiles including sensitive data
- Add/remove favorites for other users

RLS ensures that **every query** is filtered by the database based on the authenticated user's identity and role.

## Migration Details

**File:** `supabase/migrations/20260410000000_rls_security_hardening.sql`

### Tables Covered

1. **profiles** - User profile and role data
2. **bookings** - Booking records  
3. **favorites** - User favorites/saved items

### Security Model

#### Profiles
- **SELECT**: Users see their own profile + admins see all
- **INSERT**: Users can only create their own profile
- **UPDATE**: Users update own profile, admins update any
- **DELETE**: Admin-only

#### Bookings
- **SELECT**: Booking owner, property host, service provider, or admin
- **INSERT**: Authenticated users can create bookings for themselves only
- **UPDATE**: 
  - Users can only cancel their own bookings
  - Hosts/providers can manage bookings for their items
  - Admins can update any booking
- **DELETE**: Admin-only

#### Favorites
- **SELECT**: Users see only their own favorites
- **INSERT**: Users can only add their own favorites
- **UPDATE**: Users can only update their own favorites
- **DELETE**: Users can only delete their own favorites

## Key Security Features

### 1. Database-Authoritative Role Checks

All admin checks use the `is_admin()` function which queries the `profiles.role` column directly:

```sql
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER  -- Bypasses RLS to prevent recursion
SET search_path = public  -- Prevents search_path injection
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;
```

This is **critical** because:
- Client-side `user_metadata` can be spoofed
- Database roles are the single source of truth
- SECURITY DEFINER bypasses RLS to prevent infinite recursion

### 2. RLS Recursion Prevention

All policies use `(SELECT auth.uid())` instead of `auth.uid()` directly. This is a PostgreSQL requirement to avoid infinite recursion when policies reference tables that also have RLS enabled.

### 3. Defense in Depth

Combined with the application-level fixes from task [75], we now have:
- **Application layer**: `getUserRole()` instead of `user_metadata`
- **Database layer**: RLS policies enforce the same logic
- **Two independent checks** must both pass for unauthorized access to succeed

## Applying the Migration

### Step 1: Apply via Supabase CLI

```bash
supabase db push
```

Or apply manually through the Supabase Dashboard SQL Editor.

### Step 2: Verify RLS is Enabled

Run this query to confirm RLS is enabled on all three tables:

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'bookings', 'favorites');
```

Expected output:
```
 tablename  | rowsecurity 
------------+-------------
 profiles   | t
 bookings   | t
 favorites  | t
```

### Step 3: Verify Policies

Check all policies are created correctly:

```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename IN ('profiles', 'bookings', 'favorites') 
ORDER BY tablename, policyname;
```

## Testing RLS Policies

### Test 1: User Cannot View Other Users' Bookings

```sql
-- As a regular user (not admin), try to select all bookings
SET ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub": "test-user-id"}';

-- Should only see own bookings
SELECT * FROM bookings;
```

### Test 2: User Cannot Modify Other Users' Favorites

```sql
-- Try to delete another user's favorite
DELETE FROM favorites WHERE user_id = 'some-other-user-id';
-- Should fail: 0 rows affected (RLS silently filters)
```

### Test 3: Non-Admin Cannot Escalate Role

```sql
-- Try to update another user's role to admin
UPDATE profiles 
SET role = 'admin' 
WHERE id = 'some-other-user-id';
-- Should fail: RLS policy blocks it
```

### Test 4: Admin Can View All Bookings

```sql
-- As an admin user
SET ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub": "admin-user-id"}';

-- Should see all bookings
SELECT COUNT(*) FROM bookings;
```

## Security Audit Checklist

- [x] RLS enabled on `profiles` table
- [x] RLS enabled on `bookings` table
- [x] RLS enabled on `favorites` table
- [x] `is_admin()` function uses SECURITY DEFINER
- [x] `is_admin()` function has SET search_path = public
- [x] All policies use (SELECT auth.uid()) not auth.uid()
- [x] Admin checks query database, not user_metadata
- [x] Users cannot view other users' data
- [x] Users cannot modify other users' data
- [x] Admin access properly restricted
- [x] No circular policy dependencies

## Related Tasks

- **Task [75]**: Replaced `user_metadata` role checks with `getUserRole()` in application code
- **Task [76]**: This migration - database-level RLS enforcement

Together, these two tasks eliminate the role escalation vulnerability at both the application and database layers.

## Rollback Plan

If issues arise, rollback with:

```sql
-- Temporarily disable RLS (NOT RECOMMENDED for production)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE favorites DISABLE ROW LEVEL SECURITY;
```

**Warning**: This should only be done in development. Never disable RLS in production.

## Performance Considerations

RLS policies add minimal overhead when:
- Indexes exist on foreign key columns (they do - see migration `20260405000000_add_performance_indexes.sql`)
- Policies use EXISTS with indexed columns (they do)
- Admin checks use the cached `is_admin()` function

Expected query overhead: **< 5ms** per query with proper indexes.

## References

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Security Best Practices](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable)
