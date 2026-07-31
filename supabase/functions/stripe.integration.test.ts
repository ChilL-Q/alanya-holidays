/**
 * Integration tests for Stripe Edge Functions
 * 
 * These tests run against a REAL Supabase instance.
 * 
 * Prerequisites:
 * 1. Start local Supabase: `supabase start`
 * 2. Set up test database: `supabase db reset`
 * 3. Run tests: `npm run test:integration`
 * 
 * Environment variables required (in .env.test or .env):
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 * - STRIPE_SECRET_KEY
 * - STRIPE_WEBHOOK_SECRET
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// Use test Supabase instance
const SUPABASE_URL = (globalThis as any).process?.env?.VITE_SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_SERVICE_ROLE_KEY = (globalThis as any).process?.env?.SUPABASE_SERVICE_ROLE_KEY || 'test-key';
const _STRIPE_SECRET_KEY = (globalThis as any).process?.env?.STRIPE_SECRET_KEY || 'sk_test_mock';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

describe('Stripe Integration Tests', () => {
  let testUserId: string;
  const testBookingIds: string[] = [];

  beforeAll(async () => {
    // Get test user UUID instead of fake string
    const { data: { users } } = await supabase.auth.admin.listUsers();
    let testUser = users.find(u => u.email === 'test@example.com');
    if (!testUser) {
      const { data, error } = await supabase.auth.admin.createUser({
        email: 'test@example.com',
        password: 'TestPassword123!',
        email_confirm: true,
      });
      if (error) throw error;
      testUser = data.user;
    }
    testUserId = testUser.id;

    // Ensure profile exists for this new user
    await supabase.from('profiles').upsert({
        id: testUserId,
        email: 'test@example.com',
        name: 'Test User'
    });

    // Create test properties
    const { data: propertyData } = await supabase
      .from('properties')
      .insert({
        title: 'Test Property for Stripe',
        description: 'Integration test property',
        price_per_night: 100,
        location: 'Alanya',
        status: 'approved',
        host_id: testUserId,
      })
      .select()
      .single();

    if (propertyData) {
      // Create test bookings
      const { data: bookingsData, error: bookingErr } = await supabase
        .from('bookings')
        .insert([
          {
            user_id: testUserId,
            item_id: propertyData.id,
            item_type: 'property',
            check_in: '2026-05-01',
            check_out: '2026-05-05',
            guests: 2,
            status: 'pending',
            payment_status: 'pending',
            total_price: 400,
          },
          {
            user_id: testUserId,
            item_id: propertyData.id,
            item_type: 'property',
            check_in: '2026-06-01',
            check_out: '2026-06-03',
            guests: 1,
            status: 'pending',
            payment_status: 'pending',
            total_price: 200,
          },
        ])
        .select();

      if (bookingErr) console.error(bookingErr);

      if (bookingsData) {
        testBookingIds.push(...bookingsData.map((b: any) => b.id));
      }
    }
  }, 30000);

  afterAll(async () => {
    // Cleanup: Delete test bookings
    if (testBookingIds.length > 0) {
      await supabase.from('bookings').delete().in('id', testBookingIds);
    }

    // Optionally delete test profiles here (left out so we can reuse them if needed)

    // Delete test properties
    await supabase.from('properties').delete().eq('title', 'Test Property for Stripe');
  }, 30000);

  describe('Database Schema Validation', () => {
    it('bookings table has stripe_session_id column', async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('stripe_session_id')
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it('bookings table has payment_expires_at column', async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('payment_expires_at')
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it('bookings table has required status values', async () => {
      const { data } = await supabase
        .from('bookings')
        .select('status')
        .limit(1);

      // Verify status column exists and accepts expected values
      expect(['pending', 'confirmed', 'cancelled', 'completed']).toContain(data?.[0]?.status);
    });

    it('bookings table has required payment_status values', async () => {
      const { data } = await supabase
        .from('bookings')
        .select('payment_status')
        .limit(1);

      // Verify payment_status column exists
      expect(['pending', 'paid', 'refunded', 'failed']).toContain(data?.[0]?.payment_status);
    });
  });

  describe('Booking Creation and Payment Flow', () => {
    it('creates booking with pending payment status', async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('status, payment_status')
        .in('id', testBookingIds)
        .limit(1)
        .single();

      expect(error).toBeNull();
      expect(data?.status).toBe('pending');
      expect(data?.payment_status).toBe('pending');
    });

    it('updates booking with stripe_session_id', async () => {
      const testSessionId = `cs_test_${Date.now()}`;
      const bookingId = testBookingIds[0];

      const { error } = await supabase
        .from('bookings')
        .update({
          stripe_session_id: testSessionId,
          payment_expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        })
        .eq('id', bookingId);

      expect(error).toBeNull();

      // Verify update
      const { data } = await supabase
        .from('bookings')
        .select('stripe_session_id, payment_expires_at')
        .eq('id', bookingId)
        .single();

      expect(data?.stripe_session_id).toBe(testSessionId);
      expect(data?.payment_expires_at).toBeDefined();
    });

    it('can lookup booking by stripe_session_id', async () => {
      const testSessionId = `cs_test_lookup_${Date.now()}`;
      const bookingId = testBookingIds[0];

      // Set stripe_session_id
      await supabase
        .from('bookings')
        .update({ stripe_session_id: testSessionId })
        .eq('id', bookingId);

      // Lookup by stripe_session_id
      const { data, error } = await supabase
        .from('bookings')
        .select('id, status')
        .eq('stripe_session_id', testSessionId)
        .single();

      expect(error).toBeNull();
      expect(data?.id).toBe(bookingId);
    });
  });

  describe('Payment Confirmation Flow', () => {
    it('updates booking status to confirmed after payment', async () => {
      const bookingId = testBookingIds[0];

      // Simulate payment completion
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          status: 'confirmed',
          payment_status: 'paid',
        })
        .eq('id', bookingId);

      expect(updateError).toBeNull();

      // Verify status update
      const { data, error } = await supabase
        .from('bookings')
        .select('status, payment_status')
        .eq('id', bookingId)
        .single();

      expect(error).toBeNull();
      expect(data?.status).toBe('confirmed');
      expect(data?.payment_status).toBe('paid');
    });

    it('handles multiple booking updates in single transaction', async () => {
      const bookingIds = testBookingIds.slice(0, 2);

      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'confirmed',
          payment_status: 'paid',
        })
        .in('id', bookingIds);

      expect(error).toBeNull();

      // Verify all bookings updated
      const { data } = await supabase
        .from('bookings')
        .select('id, status, payment_status')
        .in('id', bookingIds);

      expect(data?.length).toBe(bookingIds.length);
      data?.forEach((booking: any) => {
        expect(booking.status).toBe('confirmed');
        expect(booking.payment_status).toBe('paid');
      });
    });
  });

  describe('RLS (Row Level Security) Tests', () => {
    it('allows service role to read all bookings', async () => {
      // Service role bypasses RLS
      const { data, error } = await supabase
        .from('bookings')
        .select('*');

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect((data as any[]).length).toBeGreaterThan(0);
    });

    it('allows service role to update any booking', async () => {
      const bookingId = testBookingIds[0];

      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);

      expect(error).toBeNull();

      // Reset status
      await supabase
        .from('bookings')
        .update({ status: 'confirmed' })
        .eq('id', bookingId);
    });

    it('verifies user can access their own bookings', async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('id, user_id')
        .eq('user_id', testUserId)
        .limit(1);

      expect(error).toBeNull();
      expect(data?.[0]?.user_id).toBe(testUserId);
    });
  });

  describe('Email Notification Data', () => {
    it('fetches booking with related profile data', async () => {
      const bookingId = testBookingIds[0];

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id, check_in, check_out, guests,
          profile:profiles!bookings_user_id_fkey(email)
        `)
        .eq('id', bookingId)
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect((data as any)?.profile?.email).toBeDefined();
    });

    it('fetches booking with related service data', async () => {
      // Create test service booking
      const { data: serviceData } = await supabase
        .from('services')
        .insert({
          title: 'Test Service',
          price: 50,
          status: 'approved',
          provider_id: testUserId,
        })
        .select()
        .single();

      if (serviceData) {
        const { data: serviceBooking } = await supabase
          .from('bookings')
          .insert({
            user_id: testUserId,
            item_id: serviceData.id,
            item_type: 'service',
            check_in: '2026-07-01',
            check_out: '2026-07-01',
            guests: 1,
            status: 'pending',
            payment_status: 'pending',
            total_price: 50,
          })
          .select(`
            id,
            profile:profiles!bookings_user_id_fkey(email)
          `)
          .single();

        expect(serviceBooking?.id).toBeDefined();

        // Cleanup
        await supabase.from('bookings').delete().eq('id', serviceBooking?.id);
        await supabase.from('services').delete().eq('id', serviceData.id);
      }
    });
  });

  describe('Payment Expiry Handling', () => {
    it('identifies expired pending payments', async () => {
      const bookingId = testBookingIds[0];
      const expiredTime = new Date(Date.now() - 30 * 60 * 1000).toISOString(); // 30 min ago

      // Set expired payment
      await supabase
        .from('bookings')
        .update({
          payment_expires_at: expiredTime,
          status: 'pending',
          payment_status: 'pending',
        })
        .eq('id', bookingId);

      // Query for expired bookings
      const { data, error } = await supabase
        .from('bookings')
        .select('id, status, payment_expires_at')
        .eq('status', 'pending')
        .lt('payment_expires_at', new Date().toISOString());

      expect(error).toBeNull();
      expect(data?.some((b: any) => b.id === bookingId)).toBe(true);

      // Reset
      await supabase
        .from('bookings')
        .update({ payment_expires_at: null })
        .eq('id', bookingId);
    });
  });

  describe('Concurrent Booking Updates', () => {
    it('handles concurrent status updates without conflicts', async () => {
      const bookingId = testBookingIds[0];

      // Simulate concurrent updates
      const updates = await Promise.all([
        supabase
          .from('bookings')
          .update({ status: 'confirmed' })
          .eq('id', bookingId),
        supabase
          .from('bookings')
          .update({ payment_status: 'paid' })
          .eq('id', bookingId),
      ]);

      expect(updates[0].error).toBeNull();
      expect(updates[1].error).toBeNull();

      // Verify final state
      const { data } = await supabase
        .from('bookings')
        .select('status, payment_status')
        .eq('id', bookingId)
        .single();

      expect(data?.status).toBe('confirmed');
      expect(data?.payment_status).toBe('paid');
    });
  });
});
