# Integration Testing Guide

## Overview

Integration tests verify real interactions with Supabase database, catching schema issues, RLS policies, and data integrity problems that unit tests with mocks cannot detect.

## Prerequisites

1. **Supabase CLI installed:**
   ```bash
   npm install -g supabase
   ```

2. **Docker running** (for local Supabase)

## Quick Start

### 1. Start Local Supabase

```bash
npm run supabase:start
```

This starts:
- PostgreSQL database
- Supabase API server
- Local Auth
- Storage emulator
- Edge Functions runtime

### 2. Reset Database (optional, for clean state)

```bash
npm run supabase:reset
```

⚠️ **Warning:** This deletes all data in your local Supabase instance.

### 3. Run Integration Tests

```bash
npm run test:integration
```

## Test Structure

### File: `supabase/functions/stripe.integration.test.ts`

Tests cover:

1. **Database Schema Validation**
   - Verifies required columns exist (`stripe_session_id`, `payment_expires_at`)
   - Validates enum values for `status` and `payment_status`

2. **Booking Creation and Payment Flow**
   - Creates test bookings with pending status
   - Updates bookings with Stripe session IDs
   - Tests lookup by `stripe_session_id`

3. **Payment Confirmation Flow**
   - Simulates webhook payment completion
   - Updates multiple bookings in single transaction
   - Verifies status transitions

4. **RLS (Row Level Security) Tests**
   - Verifies service role can bypass RLS
   - Tests user access to their own bookings
   - Validates RLS policies are working

5. **Email Notification Data**
   - Tests JOIN queries for booking emails
   - Verifies property and service relationships
   - Validates data structure for email templates

6. **Payment Expiry Handling**
   - Identifies expired pending payments
   - Tests cron job query logic

7. **Concurrent Updates**
   - Tests for race conditions
   - Verifies update conflict handling

## Test Data Lifecycle

- **Before All:** Creates test user, properties, and bookings
- **After All:** Cleans up all test data

Test entities use unique timestamps to avoid conflicts:
```typescript
const testUserId = `test-user-${Date.now()}`;
```

## Environment Variables

Create `.env.test` (see `.env.test.example`):

```bash
SUPABASE_URL=http://localhost:54321
SUPABASE_SERVICE_ROLE_KEY=eyJh...  # From `supabase status`
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Debugging

### View Database State

Connect to local Supabase:
```bash
supabase db diff --file debug_schema
```

Or use Supabase Studio (usually at `http://localhost:54323`)

### Check Function Logs

```bash
supabase functions logs stripe-webhook
```

### Run Single Test

```bash
npm run test:integration -- --reporter=verbose
```

### Increase Timeout

Some tests may need more time:
```bash
npm run test:integration -- --timeout=60000
```

## Production Testing

To test against production Supabase:

1. Update `.env.test`:
   ```bash
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-production-key
   ```

2. **Use Stripe test mode** - never test with live payments!

3. Run tests:
   ```bash
   npm run test:integration
   ```

## Common Issues

### "Connection refused"

Make sure Supabase is running:
```bash
supabase status
```

### "Invalid API key"

Check your service role key in `.env.test`:
```bash
supabase status  # Shows current keys
```

### "Relation does not exist"

Run migrations:
```bash
supabase db reset
```

### Test data conflicts

Tests use unique IDs, but if conflicts occur:
```bash
supabase db reset  # Clean slate
```

## CI/CD Integration

Add to your CI pipeline:

```yaml
# Example GitHub Actions
- name: Start Supabase
  run: supabase start

- name: Run Integration Tests
  run: npm run test:integration
  env:
    SUPABASE_URL: http://localhost:54321
    SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```

## Best Practices

1. **Always clean up:** Use `afterAll` to delete test data
2. **Use transactions:** Wrap related operations in transactions
3. **Test with realistic data:** Use real-world values
4. **Verify RLS:** Test both with service role and user tokens
5. **Keep tests independent:** Each test should work in isolation

## Related Documentation

- [Unit Tests](./stripe.test.ts) - Mocked tests for business logic
- [Edge Functions README](./README.md) - Function deployment guide
- [Supabase Local Development](https://supabase.com/docs/guides/local-development)
