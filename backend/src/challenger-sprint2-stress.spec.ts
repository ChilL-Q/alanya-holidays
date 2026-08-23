import { Test, TestingModule } from '@nestjs/testing';
import { AdminRepository } from './admin/admin.repository';
import { MessagesRepository } from './messages/messages.repository';
import { BookingsRepository } from './bookings/bookings.repository';
import { BookingsService } from './bookings/bookings.service';
import { NotificationsService } from './notifications/notifications.service';
import { StripeWebhookService } from './webhooks/stripe-webhook.service';
import { BookingWebhookHandler } from './webhooks/handlers/booking-webhook.handler';
import { SubscriptionWebhookHandler } from './webhooks/handlers/subscription-webhook.handler';
import { AddonWebhookHandler } from './webhooks/handlers/addon-webhook.handler';
import { ProcessedStripeEventsRepository } from './webhooks/processed-stripe-events.repository';
import { PAYMENT_GATEWAY } from './webhooks/domain/payment-gateway.interface';
import { InMemoryPaymentFake } from './webhooks/adapters/in-memory-payment.fake';
import { SupabaseService } from './supabase/supabase.service';
import { EmailOutboxRepository } from './bookings/email-outbox.repository';
import Stripe from 'stripe';

describe('Adversarial Challenger: Sprint 2 Stress, Edge-Case & Concurrency Harness', () => {
  describe('1. AdminRepository - Analytics Edge Cases & Resilient Fallbacks', () => {
    it('handles negative, zero, and out-of-bounds days gracefully in RPC and fallback', async () => {
      const mockRpc = jest.fn();
      const mockSupabase = {
        rpc: mockRpc,
        from: jest.fn().mockImplementation((table: string) => {
          if (table === 'directory_listings') {
            return {
              select: jest.fn().mockResolvedValue({ data: [], error: null }),
            };
          }
          if (table === 'listing_analytics') {
            return {
              select: jest.fn().mockReturnValue({
                gte: jest.fn().mockReturnValue({
                  order: jest.fn().mockResolvedValue({ data: [], error: null }),
                }),
              }),
            };
          }
          if (table === 'listing_claims') {
            return {
              select: jest.fn().mockResolvedValue({ data: [], error: null }),
            };
          }
          return {
            select: jest.fn().mockResolvedValue({ data: [], error: null }),
          };
        }),
      };

      const repo = new AdminRepository({
        getClient: () => mockSupabase,
      } as unknown as SupabaseService);

      // Test negative days (-30) -> should normalize to 30
      mockRpc.mockResolvedValueOnce({
        data: {
          kpiSummary: {
            totalViews: 0,
            totalClicks: 0,
            totalWhatsAppClicks: 0,
            totalWebsiteClicks: 0,
            totalMapClicks: 0,
            activeListingsCount: 0,
            pendingListingsCount: 0,
            pendingClaimsCount: 0,
            totalClaimsCount: 0,
            approvedClaimsCount: 0,
            claimConversionRate: 0,
          },
          viewsTrend: [],
          channelBreakdown: [],
          tierDistribution: {
            explorer: 0,
            voyager: 0,
            signature: 0,
            partner: 0,
          },
          statusDistribution: {
            approved: 0,
            pending: 0,
            rejected: 0,
            draft: 0,
          },
          topListings: [],
        },
        error: null,
      });

      const resNeg = await repo.getPlatformAnalytics(-30);
      expect(mockRpc).toHaveBeenCalledWith('get_platform_analytics', {
        p_days: 30,
      });
      expect(resNeg.kpiSummary.totalViews).toBe(0);

      // Test RPC throwing error -> fallback to in-memory aggregation on completely empty database
      mockRpc.mockRejectedValueOnce(new Error('Postgres connection timeout'));
      const resFallbackEmpty = await repo.getPlatformAnalytics(0);

      expect(resFallbackEmpty.kpiSummary.totalViews).toBe(0);
      expect(resFallbackEmpty.kpiSummary.claimConversionRate).toBe(0);
      expect(
        Number.isNaN(resFallbackEmpty.kpiSummary.claimConversionRate),
      ).toBe(false);
      expect(resFallbackEmpty.channelBreakdown[0].percentage).toBe(0);
      expect(
        Number.isNaN(resFallbackEmpty.channelBreakdown[0].percentage),
      ).toBe(false);
    });

    it('survives malformed database rows in fallback without NaN or unhandled exceptions', async () => {
      const mockSupabase = {
        rpc: jest.fn().mockRejectedValue(new Error('RPC offline')),
        from: jest.fn().mockImplementation((table: string) => {
          if (table === 'directory_listings') {
            return {
              select: jest.fn().mockResolvedValue({
                data: [
                  {
                    id: 'l1',
                    name: null,
                    status: 'UNKNOWN_STATUS',
                    tier: null,
                    category_id: null,
                  },
                ],
                error: null,
              }),
            };
          }
          if (table === 'listing_analytics') {
            return {
              select: jest.fn().mockReturnValue({
                gte: jest.fn().mockReturnValue({
                  order: jest.fn().mockResolvedValue({
                    data: [
                      {
                        listing_id: 'l1',
                        date: '2026-08-20',
                        views: null,
                        whatsapp_clicks: undefined,
                        website_clicks: 'invalid',
                        map_clicks: 0,
                      },
                    ],
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === 'listing_claims') {
            return {
              select: jest.fn().mockResolvedValue({
                data: [{ id: 'c1', status: null }],
                error: null,
              }),
            };
          }
          return {
            select: jest.fn().mockResolvedValue({ data: [], error: null }),
          };
        }),
      };

      const repo = new AdminRepository({
        getClient: () => mockSupabase,
      } as unknown as SupabaseService);

      const result = await repo.getPlatformAnalytics(30);
      expect(result.kpiSummary.totalViews).toBe(0);
      expect(result.kpiSummary.totalClicks).toBe(0);
      expect(result.topListings[0].name).toBe('Unnamed Business');
      expect(result.topListings[0].tier).toBe('explorer');
    });
  });

  describe('2. MessagesRepository - Batch Unread Metadata Edge Cases', () => {
    it('returns empty dictionary for empty conversation input and populates zero defaults for unknown IDs', async () => {
      const mockRpc = jest.fn();
      const mockSupabase = {
        rpc: mockRpc,
        from: jest.fn(),
      };

      const repo = new MessagesRepository({
        getClient: () => mockSupabase,
      } as unknown as SupabaseService);

      const emptyRes = await repo.getLastMessagesAndUnreadCounts([], 'user-1');
      expect(emptyRes).toEqual({});
      expect(mockRpc).not.toHaveBeenCalled();

      // RPC returns metadata for one conversation but none for second
      mockRpc.mockResolvedValueOnce({
        data: [
          {
            conversation_id: 'conv-1',
            last_message_id: 'msg-1',
            last_message_sender_id: 'other-user',
            last_message_content: 'Hi',
            last_message_is_read: false,
            last_message_created_at: '2026-08-22T12:00:00Z',
            unread_count: 5,
          },
        ],
        error: null,
      });

      const mixedRes = await repo.getLastMessagesAndUnreadCounts(
        ['conv-1', 'conv-unknown'],
        'user-1',
      );
      expect(mixedRes['conv-1'].unread_count).toBe(5);
      expect(mixedRes['conv-1'].last_message?.content).toBe('Hi');
      expect(mixedRes['conv-unknown']).toEqual({
        last_message: null,
        unread_count: 0,
      });
    });

    it('fallback query correctly ignores messages sent by the current user when calculating unread count', async () => {
      const mockSupabase = {
        rpc: jest.fn().mockRejectedValue(new Error('RPC missing')),
        from: jest.fn().mockImplementation((table: string) => {
          if (table === 'chat_messages') {
            return {
              select: jest.fn().mockImplementation((fields: string) => {
                if (fields === '*') {
                  return {
                    in: jest.fn().mockReturnValue({
                      order: jest.fn().mockResolvedValue({
                        data: [
                          {
                            id: 'm1',
                            conversation_id: 'conv-1',
                            sender_id: 'current-user',
                            content: 'I sent this',
                            is_read: false,
                            created_at: '2026-08-22T15:00:00Z',
                          },
                        ],
                        error: null,
                      }),
                    }),
                  };
                }
                if (fields === 'conversation_id') {
                  return {
                    in: jest.fn().mockReturnValue({
                      neq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockResolvedValue({
                          data: [], // No unreads from other users
                          error: null,
                        }),
                      }),
                    }),
                  };
                }
                return { in: jest.fn().mockResolvedValue({ data: [] }) };
              }),
            };
          }
          return { select: jest.fn().mockResolvedValue({ data: [] }) };
        }),
      };

      const repo = new MessagesRepository({
        getClient: () => mockSupabase,
      } as unknown as SupabaseService);

      const res = await repo.getLastMessagesAndUnreadCounts(
        ['conv-1'],
        'current-user',
      );
      expect(res['conv-1'].unread_count).toBe(0);
      expect(res['conv-1'].last_message?.sender_id).toBe('current-user');
    });
  });

  describe('3. BookingsRepository & BookingsService - IDOR Prevention & Atomic Fast Path', () => {
    it('enforces ownership verification in fallback and rejects cross-tenant booking confirmations', async () => {
      const mockSupabase = {
        rpc: jest.fn().mockRejectedValue(new Error('RPC offline')),
        from: jest.fn().mockImplementation((table: string) => {
          if (table === 'bookings') {
            return {
              select: jest.fn().mockReturnValue({
                in: jest.fn().mockReturnValue({
                  eq: jest.fn().mockResolvedValue({
                    // Only b-1 is owned by victim user; attacker tries to confirm b-2 as well
                    data: [{ id: 'b-1' }],
                    error: null,
                  }),
                }),
              }),
            };
          }
          return { select: jest.fn().mockResolvedValue({ data: [] }) };
        }),
      };

      const repo = new BookingsRepository({
        getClient: () => mockSupabase,
      } as unknown as SupabaseService);

      await expect(
        repo.confirmBookingsFromStripe(
          ['b-1', 'b-2-attacker'],
          'user-1',
          'cs_1',
        ),
      ).rejects.toThrow(
        'Unauthorized booking IDs in Stripe session: b-2-attacker',
      );
    });

    it('BookingsService consumes joined details directly from atomic RPC without secondary queries', async () => {
      const mockRepo = {
        confirmBookingsFromStripe: jest.fn().mockResolvedValue([
          {
            id: 'b-1',
            status: 'confirmed',
            payment_status: 'paid',
            check_in: '2026-09-01',
            check_out: '2026-09-07',
            guests: 2,
            property: { title: 'Luxury Villa Sunset' },
            service: null,
            profile: { email: 'guest@example.com' },
          },
        ]),
        getConfirmedBookingsDetails: jest.fn(),
      };

      const mockOutbox = {
        enqueue: jest.fn().mockResolvedValue({ id: 'outbox-1' }),
      };

      const mockNotifications = {
        sendNotification: jest.fn().mockResolvedValue(undefined),
      };

      const service = new BookingsService(
        mockRepo as unknown as BookingsRepository,
        mockOutbox as unknown as EmailOutboxRepository,
        mockNotifications as unknown as NotificationsService,
      );

      const result = await service.confirmBookingPayment(
        ['b-1'],
        'user-1',
        'cs_stripe_1',
        'pi_stripe_1',
      );

      expect(result).toEqual({ confirmedCount: 1 });
      // Crucial: getConfirmedBookingsDetails should NOT be called since RPC joined details exist
      expect(mockRepo.getConfirmedBookingsDetails).not.toHaveBeenCalled();
      expect(mockOutbox.enqueue).toHaveBeenCalledWith({
        to: 'guest@example.com',
        type: 'booking_confirmed',
        data: {
          itemTitle: 'Luxury Villa Sunset',
          checkIn: '2026-09-01',
          checkOut: '2026-09-07',
          guests: '2',
          link: `${process.env.APP_URL || 'https://alanyaholidays.com'}/profile`,
        },
      });
    });
  });

  describe('4. Stripe Webhook - High Concurrency (100 Workers) & Failure Injection', () => {
    let webhookService: StripeWebhookService;
    let paymentFake: InMemoryPaymentFake;
    let bookingHandler: jest.Mocked<Partial<BookingWebhookHandler>>;
    let subscriptionHandler: jest.Mocked<Partial<SubscriptionWebhookHandler>>;
    let addonHandler: jest.Mocked<Partial<AddonWebhookHandler>>;
    let processedEventsStore: Map<string, boolean>;
    let mockProcessedRepo: {
      tryClaimEvent: jest.Mock;
      releaseEvent: jest.Mock;
    };

    beforeEach(async () => {
      paymentFake = new InMemoryPaymentFake();
      processedEventsStore = new Map<string, boolean>();

      bookingHandler = {
        handleCheckoutSession: jest.fn().mockImplementation(async () => {
          await new Promise((r) => setTimeout(r, 2));
        }),
      };

      subscriptionHandler = {
        handleCreated: jest.fn().mockResolvedValue(undefined),
        handleUpdated: jest.fn().mockResolvedValue(undefined),
        handleDeleted: jest.fn().mockResolvedValue(undefined),
      };

      addonHandler = {
        handleCheckoutSession: jest.fn().mockResolvedValue(undefined),
      };

      mockProcessedRepo = {
        tryClaimEvent: jest.fn().mockImplementation((eventId: string) => {
          if (processedEventsStore.has(eventId)) {
            return Promise.resolve(false);
          }
          processedEventsStore.set(eventId, true);
          return Promise.resolve(true);
        }),
        releaseEvent: jest.fn().mockImplementation((eventId: string) => {
          processedEventsStore.delete(eventId);
          return Promise.resolve();
        }),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          StripeWebhookService,
          { provide: PAYMENT_GATEWAY, useValue: paymentFake },
          { provide: BookingWebhookHandler, useValue: bookingHandler },
          {
            provide: SubscriptionWebhookHandler,
            useValue: subscriptionHandler,
          },
          { provide: AddonWebhookHandler, useValue: addonHandler },
          {
            provide: ProcessedStripeEventsRepository,
            useValue: mockProcessedRepo,
          },
        ],
      }).compile();

      webhookService = module.get<StripeWebhookService>(StripeWebhookService);
    });

    it('survives 100 concurrent identical webhook deliveries with EXACTLY ONE handler execution', async () => {
      const eventId = 'evt_stress_100_race';
      const event = {
        id: eventId,
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_100_race',
            metadata: { bookingIds: 'b1,b2,b3', userId: 'user-race-100' },
          },
        },
      } as unknown as Stripe.Event;

      paymentFake.registerEvent('sig_100_race', event);

      // Launch 100 concurrent promises
      const calls = Array.from({ length: 100 }, () =>
        webhookService.processWebhookEvent(
          Buffer.from('payload'),
          'sig_100_race',
        ),
      );

      const results = await Promise.all(calls);

      expect(results).toHaveLength(100);
      results.forEach((res) => expect(res).toEqual({ received: true }));
      expect(bookingHandler.handleCheckoutSession).toHaveBeenCalledTimes(1);
      expect(mockProcessedRepo.tryClaimEvent).toHaveBeenCalledTimes(100);
    });

    it('fails closed when database errors occur during claim check (security invariant)', async () => {
      mockProcessedRepo.tryClaimEvent.mockRejectedValueOnce(
        new Error('Supabase database connection pool exhausted'),
      );

      const event = {
        id: 'evt_fail_closed',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_fail',
            metadata: { bookingIds: 'b1', userId: 'u1' },
          },
        },
      } as unknown as Stripe.Event;

      paymentFake.registerEvent('sig_fail_closed', event);

      await expect(
        webhookService.processWebhookEvent(
          Buffer.from('payload'),
          'sig_fail_closed',
        ),
      ).rejects.toThrow('Supabase database connection pool exhausted');

      // Handler MUST NOT have been invoked
      expect(bookingHandler.handleCheckoutSession).not.toHaveBeenCalled();
    });

    it('handles dual failure where handler crashes AND releaseEvent fails without hanging or unhandled rejection', async () => {
      const eventId = 'evt_dual_failure';
      const event = {
        id: eventId,
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_dual',
            metadata: { bookingIds: 'b1', userId: 'u1' },
          },
        },
      } as unknown as Stripe.Event;

      paymentFake.registerEvent('sig_dual', event);

      (bookingHandler.handleCheckoutSession as jest.Mock).mockRejectedValueOnce(
        new Error('Primary handler business logic error'),
      );
      mockProcessedRepo.releaseEvent.mockRejectedValueOnce(
        new Error('Secondary releaseEvent database failure'),
      );

      await expect(
        webhookService.processWebhookEvent(Buffer.from('payload'), 'sig_dual'),
      ).rejects.toThrow('Primary handler business logic error');

      expect(bookingHandler.handleCheckoutSession).toHaveBeenCalledTimes(1);
      expect(mockProcessedRepo.releaseEvent).toHaveBeenCalledWith(eventId);
    });
  });
});
