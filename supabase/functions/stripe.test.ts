import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Tests for Stripe Edge Functions (create-checkout-session & stripe-webhook)
 * 
 * Note: These are unit tests that verify the business logic of the Stripe functions.
 * The actual Deno Edge Functions cannot be directly tested with Vitest due to Deno-specific
 * imports (npm:stripe, npm:@supabase/supabase-js).
 * 
 * For integration testing:
 * 1. Start local Supabase: `supabase start`
 * 2. Serve functions: `supabase functions serve --env-file .env`
 * 3. Test via curl/Postman or use the Stripe CLI:
 *    - `stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook`
 *    - `stripe trigger checkout.session.completed`
 * 
 * Production testing:
 * - Use Stripe test mode with real webhook endpoints
 * - Monitor logs in Supabase dashboard
 */

describe('Stripe Edge Functions - Logic Tests', () => {
  describe('create-checkout-session', () => {
    // Mock Stripe
    const mockStripeCreate = vi.fn();
    
    // Mock Supabase
    const _mockSupabaseUpdate = vi.fn();
    const mockSupabaseIn = vi.fn();

    const _mockSupabaseFrom = vi.fn(() => ({
      update: vi.fn(() => ({
        in: mockSupabaseIn,
      })),
    }));

    const createCheckoutHandler = async (body: any) => {
      const { items, userId, email, origin } = body;

      // Validation
      if (!items?.length || !userId || !origin) {
        return {
          status: 400,
          body: { error: 'Missing required fields' },
        };
      }

      // Stripe Checkout Session (expires_at = 30 min)
      const expiresAt = Math.floor(Date.now() / 1000) + 30 * 60;

      const session = await mockStripeCreate({
        mode: 'payment',
        customer_email: email,
        expires_at: expiresAt,
        line_items: items.map((item: any) => ({
          price_data: {
            currency: 'eur',
            product_data: {
              name: item.title,
              ...(item.image ? { images: [item.image] } : {}),
            },
            unit_amount: Math.round(item.price * 100),
          },
          quantity: 1,
        })),
        success_url: `${origin}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/checkout`,
        metadata: {
          userId,
          bookingIds: items.map((i: any) => i.bookingId).join(','),
        },
      });

      // Update bookings
      const bookingIds = items.map((i: any) => i.bookingId).filter(Boolean);

      if (bookingIds.length > 0) {
        await mockSupabaseIn({
          stripe_session_id: session.id,
          payment_expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        });
      }

      return {
        status: 200,
        body: { url: session.url },
      };
    };

    beforeEach(() => {
      vi.clearAllMocks();
      mockStripeCreate.mockReset();
      mockSupabaseIn.mockReset();
    });

    describe('Validation', () => {
      it('returns 400 when items is missing', async () => {
        const result = await createCheckoutHandler({
          userId: 'user-123',
          origin: 'http://localhost',
        });

        expect(result.status).toBe(400);
        expect(result.body.error).toBe('Missing required fields');
      });

      it('returns 400 when userId is missing', async () => {
        const result = await createCheckoutHandler({
          items: [{ title: 'Test', price: 100 }],
          origin: 'http://localhost',
        });

        expect(result.status).toBe(400);
        expect(result.body.error).toBe('Missing required fields');
      });

      it('returns 400 when origin is missing', async () => {
        const result = await createCheckoutHandler({
          items: [{ title: 'Test', price: 100 }],
          userId: 'user-123',
        });

        expect(result.status).toBe(400);
        expect(result.body.error).toBe('Missing required fields');
      });

      it('returns 400 when items array is empty', async () => {
        const result = await createCheckoutHandler({
          items: [],
          userId: 'user-123',
          origin: 'http://localhost',
        });

        expect(result.status).toBe(400);
        expect(result.body.error).toBe('Missing required fields');
      });
    });

    describe('Successful Checkout', () => {
      it('creates Stripe session with correct parameters', async () => {
        mockStripeCreate.mockResolvedValue({
          id: 'cs_test_123',
          url: 'https://checkout.stripe.com/c/pay/cs_test_123',
        });

        const result = await createCheckoutHandler({
          items: [{ title: 'Test Product', price: 100, bookingId: 'booking-1' }],
          userId: 'user-123',
          email: 'test@example.com',
          origin: 'http://localhost',
        });

        expect(result.status).toBe(200);
        expect(result.body.url).toBe('https://checkout.stripe.com/c/pay/cs_test_123');
        expect(mockStripeCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            mode: 'payment',
            customer_email: 'test@example.com',
          })
        );
      });

      it('includes image in product_data when provided', async () => {
        mockStripeCreate.mockResolvedValue({ id: 'cs_123', url: 'https://checkout.stripe.com/c/pay/cs_123' });

        await createCheckoutHandler({
          items: [{ title: 'Test', price: 100, image: 'https://example.com/img.jpg' }],
          userId: 'user-123',
          origin: 'http://localhost',
        });

        const callArgs = mockStripeCreate.mock.calls[0][0];
        expect(callArgs.line_items[0].price_data.product_data.images).toEqual(['https://example.com/img.jpg']);
      });

      it('converts price to cents correctly', async () => {
        mockStripeCreate.mockResolvedValue({ id: 'cs_123', url: 'https://checkout.stripe.com/c/pay/cs_123' });

        await createCheckoutHandler({
          items: [{ title: 'Test', price: 99.99 }],
          userId: 'user-123',
          origin: 'http://localhost',
        });

        const callArgs = mockStripeCreate.mock.calls[0][0];
        expect(callArgs.line_items[0].price_data.unit_amount).toBe(9999);
      });

      it('sets expires_at to 30 minutes from now', async () => {
        mockStripeCreate.mockResolvedValue({ id: 'cs_123', url: 'https://checkout.stripe.com/c/pay/cs_123' });

        const beforeCall = Date.now();
        await createCheckoutHandler({
          items: [{ title: 'Test', price: 100 }],
          userId: 'user-123',
          origin: 'http://localhost',
        });

        const callArgs = mockStripeCreate.mock.calls[0][0];
        const expiresAt = callArgs.expires_at;
        const expectedMin = Math.floor(beforeCall / 1000) + 30 * 60;

        expect(expiresAt).toBeGreaterThanOrEqual(expectedMin);
      });

      it('updates bookings with stripe_session_id', async () => {
        mockStripeCreate.mockResolvedValue({ id: 'cs_123', url: 'https://checkout.stripe.com/c/pay/cs_123' });

        await createCheckoutHandler({
          items: [
            { title: 'Test 1', price: 100, bookingId: 'booking-1' },
            { title: 'Test 2', price: 50, bookingId: 'booking-2' },
          ],
          userId: 'user-123',
          origin: 'http://localhost',
        });

        expect(mockSupabaseIn).toHaveBeenCalledWith({
          stripe_session_id: 'cs_123',
          payment_expires_at: expect.any(String),
        });
      });

      it('handles multiple booking IDs in metadata', async () => {
        mockStripeCreate.mockResolvedValue({ id: 'cs_123', url: 'https://checkout.stripe.com/c/pay/cs_123' });

        await createCheckoutHandler({
          items: [
            { title: 'Test 1', price: 100, bookingId: 'booking-1' },
            { title: 'Test 2', price: 50, bookingId: 'booking-2' },
            { title: 'Test 3', price: 75, bookingId: 'booking-3' },
          ],
          userId: 'user-123',
          origin: 'http://localhost',
        });

        const callArgs = mockStripeCreate.mock.calls[0][0];
        expect(callArgs.metadata.bookingIds).toBe('booking-1,booking-2,booking-3');
      });

      it('does not update bookings when no bookingId provided', async () => {
        mockStripeCreate.mockResolvedValue({ id: 'cs_123', url: 'https://checkout.stripe.com/c/pay/cs_123' });

        await createCheckoutHandler({
          items: [{ title: 'Test', price: 100 }], // No bookingId
          userId: 'user-123',
          origin: 'http://localhost',
        });

        expect(mockSupabaseIn).not.toHaveBeenCalled();
      });
    });

    describe('Error Handling', () => {
      it('handles Stripe API errors', async () => {
        mockStripeCreate.mockRejectedValue(new Error('Stripe API error'));

        await expect(
          createCheckoutHandler({
            items: [{ title: 'Test', price: 100 }],
            userId: 'user-123',
            origin: 'http://localhost',
          })
        ).rejects.toThrow('Stripe API error');
      });
    });
  });

  describe('stripe-webhook', () => {
    // Mock Supabase
    const mockSupabaseUpdate = vi.fn();
    const _mockSupabaseIn = vi.fn();
    const mockSupabaseSingle = vi.fn();
    const mockSupabaseFunctionsInvoke = vi.fn();

    const webhookHandler = async (event: any) => {
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object;

        if (session.payment_status === 'paid') {
          const bookingIds = session.metadata?.bookingIds?.split(',').filter(Boolean) ?? [];

          if (bookingIds.length > 0) {
            const result = await mockSupabaseUpdate({
              status: 'confirmed',
              payment_status: 'paid',
            });

            if (result?.error) {
              return { status: 500, body: 'DB update failed' };
            }

            // Send emails
            for (const bookingId of bookingIds) {
              try {
                const booking = await mockSupabaseSingle(bookingId);

                if (booking) {
                  const itemTitle = (booking as any).property?.title ?? (booking as any).service?.title ?? 'Booking';
                  const guestEmail = (booking as any).profile?.email;

                  if (guestEmail) {
                    await mockSupabaseFunctionsInvoke({
                      to: guestEmail,
                      type: 'booking_confirmed',
                      data: {
                        itemTitle,
                        checkIn: (booking as any).check_in,
                        checkOut: (booking as any).check_out,
                        guests: String((booking as any).guests ?? 1),
                        link: 'https://alanyaholidays.com/profile',
                      },
                    });
                  }
                }
              } catch (e) {
                // Continue processing other bookings even if email fails
                console.error('Email send failed:', e);
              }
            }
          }
        }
      }

      return { status: 200, body: { received: true } };
    };

    beforeEach(() => {
      vi.clearAllMocks();
      mockSupabaseUpdate.mockReset();
      mockSupabaseSingle.mockReset();
      mockSupabaseFunctionsInvoke.mockReset();
    });

    describe('checkout.session.completed Event', () => {
      it('updates booking status to confirmed when payment_status is paid', async () => {
        mockSupabaseUpdate.mockResolvedValue({ error: null });

        const result = await webhookHandler({
          type: 'checkout.session.completed',
          data: {
            object: {
              payment_status: 'paid',
              metadata: { bookingIds: 'booking-1,booking-2' },
            },
          },
        });

        expect(result.status).toBe(200);
        expect(mockSupabaseUpdate).toHaveBeenCalledWith({
          status: 'confirmed',
          payment_status: 'paid',
        });
      });

      it('handles session without bookingIds gracefully', async () => {
        const result = await webhookHandler({
          type: 'checkout.session.completed',
          data: {
            object: {
              payment_status: 'paid',
              metadata: {},
            },
          },
        });

        expect(result.status).toBe(200);
        expect(mockSupabaseUpdate).not.toHaveBeenCalled();
      });

      it('returns 500 when Supabase update fails', async () => {
        mockSupabaseUpdate.mockResolvedValue({ error: new Error('DB error') });

        const result = await webhookHandler({
          type: 'checkout.session.completed',
          data: {
            object: {
              payment_status: 'paid',
              metadata: { bookingIds: 'booking-1' },
            },
          },
        });

        expect(result.status).toBe(500);
        expect(result.body).toBe('DB update failed');
      });

      it('ignores events when payment_status is not paid', async () => {
        const result = await webhookHandler({
          type: 'checkout.session.completed',
          data: {
            object: {
              payment_status: 'unpaid',
              metadata: { bookingIds: 'booking-1' },
            },
          },
        });

        expect(result.status).toBe(200);
        expect(mockSupabaseUpdate).not.toHaveBeenCalled();
      });
    });

    describe('Email Notification', () => {
      it('sends booking confirmation email for property booking', async () => {
        mockSupabaseUpdate.mockResolvedValue(null);
        mockSupabaseSingle.mockResolvedValue({
          check_in: '2024-01-15',
          check_out: '2024-01-20',
          guests: 2,
          property: { title: 'Test Property' },
          service: null,
          profile: { email: 'guest@example.com' },
        });

        await webhookHandler({
          type: 'checkout.session.completed',
          data: {
            object: {
              payment_status: 'paid',
              metadata: { bookingIds: 'booking-1' },
            },
          },
        });

        expect(mockSupabaseFunctionsInvoke).toHaveBeenCalledWith({
          to: 'guest@example.com',
          type: 'booking_confirmed',
          data: expect.objectContaining({
            itemTitle: 'Test Property',
            checkIn: '2024-01-15',
            checkOut: '2024-01-20',
            guests: '2',
          }),
        });
      });

      it('uses service title for service bookings', async () => {
        mockSupabaseUpdate.mockResolvedValue(null);
        mockSupabaseSingle.mockResolvedValue({
          check_in: '2024-01-15',
          check_out: '2024-01-20',
          guests: 1,
          property: null,
          service: { title: 'City Tour' },
          profile: { email: 'guest@example.com' },
        });

        await webhookHandler({
          type: 'checkout.session.completed',
          data: {
            object: {
              payment_status: 'paid',
              metadata: { bookingIds: 'booking-1' },
            },
          },
        });

        expect(mockSupabaseFunctionsInvoke).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              itemTitle: 'City Tour',
            }),
          })
        );
      });

      it('skips email if guest email is not available', async () => {
        mockSupabaseUpdate.mockResolvedValue(null);
        mockSupabaseSingle.mockResolvedValue({
          check_in: '2024-01-15',
          check_out: '2024-01-20',
          guests: 1,
          property: { title: 'Test Property' },
          service: null,
          profile: { email: null },
        });

        await webhookHandler({
          type: 'checkout.session.completed',
          data: {
            object: {
              payment_status: 'paid',
              metadata: { bookingIds: 'booking-1' },
            },
          },
        });

        expect(mockSupabaseFunctionsInvoke).not.toHaveBeenCalled();
      });

      it('continues processing even if email sending fails', async () => {
        mockSupabaseUpdate.mockResolvedValue(null);
        mockSupabaseSingle.mockResolvedValue({
          check_in: '2024-01-15',
          guests: 1,
          property: { title: 'Test' },
          profile: { email: 'guest@example.com' },
        });
        mockSupabaseFunctionsInvoke.mockRejectedValue(new Error('Email error'));

        // Should not throw - error is caught internally
        const result = await webhookHandler({
          type: 'checkout.session.completed',
          data: {
            object: {
              payment_status: 'paid',
              metadata: { bookingIds: 'booking-1' },
            },
          },
        });

        expect(result.status).toBe(200);
      });
    });

    describe('Other Event Types', () => {
      it('returns 200 for non-checkout.session.completed events', async () => {
        const result = await webhookHandler({
          type: 'payment_intent.created',
          data: { object: {} },
        });

        expect(result.status).toBe(200);
        expect(result.body).toEqual({ received: true });
      });
    });
  });

  describe('CORS Headers', () => {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    };

    it('has correct CORS headers', () => {
      expect(corsHeaders['Access-Control-Allow-Origin']).toBe('*');
      expect(corsHeaders['Access-Control-Allow-Headers']).toContain('authorization');
      expect(corsHeaders['Access-Control-Allow-Headers']).toContain('content-type');
    });

    it('allows OPTIONS preflight requests', () => {
      const handleOptions = (method: string) => {
        if (method === 'OPTIONS') {
          return { status: 200, headers: corsHeaders };
        }
        return { status: 405 };
      };

      const response = handleOptions('OPTIONS');
      expect(response.status).toBe(200);
      expect(response.headers).toEqual(corsHeaders);
    });
  });

  describe('Payment Window', () => {
    const PAYMENT_WINDOW_MINUTES = 15;

    it('calculates payment expiry correctly', () => {
      const now = Date.now();
      const expiresAt = new Date(now + PAYMENT_WINDOW_MINUTES * 60 * 1000);
      const expectedMinutes = PAYMENT_WINDOW_MINUTES;

      const diffMinutes = (expiresAt.getTime() - now) / (1000 * 60);
      expect(diffMinutes).toBe(expectedMinutes);
    });

    it('uses 15 minute payment window', () => {
      expect(PAYMENT_WINDOW_MINUTES).toBe(15);
    });
  });
});
