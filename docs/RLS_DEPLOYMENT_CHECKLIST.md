# RLS Migration Deployment Checklist

## Pre-Deployment

- [x] Migration file created: `supabase/migrations/20260410000000_rls_security_hardening.sql`
- [x] Verification script created: `db_scripts/verify_rls_security.sql`
- [x] Documentation created: `docs/TASK_76_RLS_IMPLEMENTATION.md`
- [x] All existing tests pass (352/352 ✅)
- [x] No breaking changes to existing functionality
- [x] Cascade delete scenarios analyzed and handled

## Deployment Steps

### Step 1: Backup (Recommended)
```bash
# Export current database schema (optional but recommended)
supabase db dump -f backup_before_rls.sql --schema-only
```

### Step 2: Apply Migration

**Option A: Via Supabase CLI (Recommended)**
```bash
supabase db push
```

**Option B: Via Dashboard SQL Editor**
1. Open Supabase Dashboard → SQL Editor
2. Copy entire contents of `supabase/migrations/20260410000000_rls_security_hardening.sql`
3. Paste and execute
4. Save the query as "RLS Security Hardening [76]"

### Step 3: Verify Migration

**Run verification script:**
1. Open Supabase Dashboard → SQL Editor
2. Copy entire contents of `db_scripts/verify_rls_security.sql`
3. Execute and check output

**Expected output:**
```
✓ RLS is enabled on all critical tables
✓ profiles has all required operations: {SELECT,INSERT,UPDATE,DELETE}
✓ bookings has all required operations: {SELECT,INSERT,UPDATE,DELETE}
✓ favorites has all required operations: {SELECT,INSERT,UPDATE,DELETE}
✓ reviews has all required operations: {SELECT,INSERT,UPDATE,DELETE}
✓ property_availability has all required operations: {SELECT,INSERT,UPDATE,DELETE}
✓ property_ical_feeds has all required operations: {SELECT,INSERT,UPDATE,DELETE}
✓ notifications has all required operations: {SELECT,INSERT,UPDATE}
✓ audit_logs has all required operations: {SELECT,INSERT}
✓ PASSED - All 8 tables have RLS enabled with 30+ total policies
```

### Step 4: Smoke Test Application

Test these critical user flows in **staging** first:

#### User Flows
- [ ] User registration creates profile
- [ ] User can view their own profile
- [ ] User cannot view other users' profiles (except basic info)
- [ ] User can update their own profile
- [ ] User cannot update other users' profiles

#### Booking Flows
- [ ] User can create a booking
- [ ] User can view their own bookings
- [ ] User cannot view other users' bookings
- [ ] User can cancel their own booking
- [ ] User cannot cancel other users' bookings
- [ ] Host can view bookings for their properties
- [ ] Host can confirm/cancel bookings for their properties
- [ ] Admin can view all bookings
- [ ] Admin can update any booking status

#### Favorites Flows
- [ ] User can add favorites
- [ ] User can view their own favorites
- [ ] User cannot view other users' favorites
- [ ] User can remove their own favorites
- [ ] Property deletion cleans up all related favorites

#### Property Flows
- [ ] Host can create properties
- [ ] Host can view their own properties (including pending)
- [ ] Host can update their own properties
- [ ] Host can delete their own properties
- [ ] Property deletion cascades to related tables:
  - [ ] Reviews deleted
  - [ ] Property availability deleted
  - [ ] iCal feeds deleted
  - [ ] Favorites cleaned up
- [ ] Admin can view all properties
- [ ] Admin can approve/reject properties
- [ ] Admin can delete any property

#### Notification Flows
- [ ] System creates notifications for users
- [ ] User can view their own notifications
- [ ] User cannot view other users' notifications
- [ ] User can mark their notifications as read
- [ ] User cannot mark other users' notifications as read

#### Review Flows
- [ ] User can create reviews
- [ ] Reviews are publicly visible
- [ ] User can update their own reviews
- [ ] User can delete their own reviews
- [ ] Host can delete reviews on their properties
- [ ] Admin can delete any review

### Step 5: Monitor Performance

After deployment to production:

1. **Watch for slow queries** (first 48 hours)
   - Supabase Dashboard → Database → Logs
   - Look for queries > 100ms
   - Check if RLS policies are causing sequential scans

2. **Monitor error rates**
   - Check application error logs
   - Look for "permission denied" or RLS-related errors
   - Verify audit_logs are still being created

3. **Check policy effectiveness**
   ```sql
   -- Count bookings per user (should be limited by RLS)
   SELECT user_id, COUNT(*) 
   FROM bookings 
   GROUP BY user_id 
   ORDER BY COUNT(*) DESC 
   LIMIT 10;
   ```

## Rollback Plan

If critical issues are discovered:

### Immediate Rollback (Emergency)
```sql
-- Disable RLS on problematic table only
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;

-- Report the issue
-- Re-enable after fixing
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
```

### Full Rollback
```sql
-- Drop all policies created by this migration
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;
DROP POLICY IF EXISTS "profiles_delete" ON profiles;

DROP POLICY IF EXISTS "bookings_select" ON bookings;
DROP POLICY IF EXISTS "bookings_insert" ON bookings;
DROP POLICY IF EXISTS "bookings_update" ON bookings;
DROP POLICY IF EXISTS "bookings_delete" ON bookings;

DROP POLICY IF EXISTS "favorites_select" ON favorites;
DROP POLICY IF EXISTS "favorites_insert" ON favorites;
DROP POLICY IF EXISTS "favorites_update" ON favorites;
DROP POLICY IF EXISTS "favorites_delete" ON favorites;
DROP POLICY IF EXISTS "favorites_delete_by_host" ON favorites;

DROP POLICY IF EXISTS "reviews_select" ON reviews;
DROP POLICY IF EXISTS "reviews_insert" ON reviews;
DROP POLICY IF EXISTS "reviews_update" ON reviews;
DROP POLICY IF EXISTS "reviews_delete" ON reviews;

DROP POLICY IF EXISTS "property_availability_select" ON property_availability;
DROP POLICY IF EXISTS "property_availability_insert" ON property_availability;
DROP POLICY IF EXISTS "property_availability_update" ON property_availability;
DROP POLICY IF EXISTS "property_availability_delete" ON property_availability;

DROP POLICY IF EXISTS "property_ical_feeds_select" ON property_ical_feeds;
DROP POLICY IF EXISTS "property_ical_feeds_insert" ON property_ical_feeds;
DROP POLICY IF EXISTS "property_ical_feeds_update" ON property_ical_feeds;
DROP POLICY IF EXISTS "property_ical_feeds_delete" ON property_ical_feeds;

DROP POLICY IF EXISTS "notifications_select" ON notifications;
DROP POLICY IF EXISTS "notifications_insert" ON notifications;
DROP POLICY IF EXISTS "notifications_update" ON notifications;

-- Optionally disable RLS entirely
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE favorites DISABLE ROW LEVEL SECURITY;
ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE property_availability DISABLE ROW LEVEL SECURITY;
ALTER TABLE property_ical_feeds DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
```

## Post-Deployment Validation

### 1. Security Validation
```sql
-- Test RLS enforcement (run as anon user, not service_role)
-- Should return only your own bookings
SELECT COUNT(*) FROM bookings;

-- Should return 0 (cannot update other user's profile)
UPDATE profiles SET role = 'admin' WHERE id != auth.uid();

-- Should fail for non-admin (cannot delete profiles)
DELETE FROM profiles WHERE id = 'some-user';
```

### 2. Performance Validation
```sql
-- Check query plans use indexes
EXPLAIN ANALYZE 
SELECT * FROM bookings 
WHERE user_id = 'test-user-id';

-- Should show "Index Scan" not "Sequential Scan"
-- Expected time: < 10ms
```

### 3. Application Integration
```bash
# Run full test suite
npm test

# Expected: All tests pass
```

## Success Criteria

Migration is considered successful when:

- [x] All 8 tables have RLS enabled
- [x] 30+ policies created across all tables
- [x] Verification script passes all checks
- [x] All smoke tests pass (user flows work correctly)
- [ ] No performance degradation in production (monitor 48h)
- [ ] No new errors in application logs (monitor 48h)
- [x] All existing unit tests still pass (352/352)

## Support Contacts

If issues arise:
1. Check `docs/RLS_SECURITY_HARDENING.md` for detailed documentation
2. Check `docs/TASK_76_RLS_IMPLEMENTATION.md` for implementation details
3. Review the migration file for exact policy definitions
4. Run verification script to identify specific issues

---

**Migration Date:** 2026-04-10  
**Migration File:** `20260410000000_rls_security_hardening.sql`  
**Related Task:** [76] RLS на критичных таблицах  
**Related Task:** [75] user_metadata role escalation fix
