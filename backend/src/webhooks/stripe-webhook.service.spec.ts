import { Test, TestingModule } from '@nestjs/testing';
import { StripeWebhookService } from './stripe-webhook.service';
import { SupabaseService } from '../supabase/supabase.service';
import { BookingsService } from '../bookings/bookings.service';
import { BookingsRepository } from '../bookings/bookings.repository';
import { BadRequestException } from '@nestjs/common';
import Stripe from 'stripe';

describe('StripeWebhookService', () => {
  let service: StripeWebhookService;
  let servicePrivate: StripeWebhookServicePrivate;
  let bookingsService: jest.Mocked<Partial<BookingsService>>;
  let bookingsRepository: jest.Mocked<Partial<BookingsRepository>>;

  interface StripeWebhookServicePrivate {
    stripe: Stripe;
    handleChargeRefunded: (charge: Stripe.Charge) => Promise<void>;
    handleCheckoutSessionCompleted: (
      session: Stripe.Checkout.Session,
    ) => Promise<void>;
    handleDisputeCreated: (dispute: Stripe.Dispute) => Promise<void>;
    handlePaymentIntentFailed: (pi: Stripe.PaymentIntent) => Promise<void>;
    handleSubscriptionCreated: (sub: Stripe.Subscription) => Promise<void>;
    handleSubscriptionUpdated: (sub: Stripe.Subscription) => Promise<void>;
    handleSubscriptionDeleted: (sub: Stripe.Subscription) => Promise<void>;
    handleInvoicePaymentFailed: (inv: Stripe.Invoice) => Promise<void>;
  }

  interface MockQueryResult {
    data: unknown;
    error: unknown;
  }

  interface TableMock {
    select: jest.Mock;
    insert: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    eq: jest.Mock;
    in: jest.Mock;
    limit: jest.Mock;
    maybeSingle: jest.Mock;
    then: (
      resolve?: ((value: MockQueryResult) => unknown) | null,
      reject?: ((reason: unknown) => unknown) | null,
    ) => Promise<unknown>;
  }

  let tableMocks: Record<string, TableMock>;
  let mockSupabaseClient: { from: jest.Mock };

  const createTableMock = (): TableMock => {
    const mock = {} as TableMock;
    mock.select = jest.fn().mockReturnValue(mock);
    mock.insert = jest.fn().mockResolvedValue({ data: null, error: null });
    mock.update = jest.fn().mockReturnValue(mock);
    mock.delete = jest.fn().mockReturnValue(mock);
    mock.eq = jest.fn().mockReturnValue(mock);
    mock.in = jest.fn().mockReturnValue(mock);
    mock.limit = jest.fn().mockReturnValue(mock);
    mock.maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
    // Allow `await supabase.from(...).select(...).eq(...)` to resolve cleanly
    mock.then = (resolve, reject) =>
      Promise.resolve({ data: null, error: null }).then(resolve, reject);
    return mock;
  };

  beforeEach(async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_mock';

    tableMocks = {
      bookings: createTableMock(),
      listing_addons: createTableMock(),
      directory_listings: createTableMock(),
      notifications: createTableMock(),
      properties: createTableMock(),
      services: createTableMock(),
      profiles: createTableMock(),
      premium_subscriptions: createTableMock(),
    };

    mockSupabaseClient = {
      from: jest.fn().mockImplementation((table: string): TableMock => {
        if (!(table in tableMocks)) {
          tableMocks[table] = createTableMock();
        }
        return tableMocks[table];
      }),
    };

    bookingsService = {
      confirmBookingPayment: jest.fn().mockResolvedValue({ confirmedCount: 1 }),
    };

    bookingsRepository = {
      unblockDatesForBooking: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StripeWebhookService,
        {
          provide: SupabaseService,
          useValue: {
            getClient: (): typeof mockSupabaseClient => mockSupabaseClient,
          },
        },
        {
          provide: BookingsService,
          useValue: bookingsService,
        },
        {
          provide: BookingsRepository,
          useValue: bookingsRepository,
        },
      ],
    }).compile();

    service = module.get<StripeWebhookService>(StripeWebhookService);
    servicePrivate = service as unknown as StripeWebhookServicePrivate;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processWebhookEvent', () => {
    it('should throw BadRequestException if STRIPE_WEBHOOK_SECRET is not configured', async () => {
      delete process.env.STRIPE_WEBHOOK_SECRET;

      await expect(
        service.processWebhookEvent(Buffer.from('payload'), 'sig'),
      ).rejects.toThrow(BadRequestException);

      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_mock';
    });

    it('should throw BadRequestException if signature is invalid', async () => {
      const rawBody = Buffer.from('invalid payload');
      const invalidSignature = 't=123,v1=invalid';

      await expect(
        service.processWebhookEvent(rawBody, invalidSignature),
      ).rejects.toThrow(BadRequestException);
    });

    it('should route events properly and return received: true', async () => {
      const mockEvent: Stripe.Event = {
        id: 'evt_test_123',
        object: 'event',
        type: 'charge.refunded',
        data: {
          object: {
            id: 'ch_1',
            payment_intent: 'pi_1',
          } as unknown as Stripe.Charge,
        },
        api_version: '2025-01-27.acacia',
        created: 123456789,
        livemode: false,
        pending_webhooks: 0,
        request: { id: null, idempotency_key: null },
      };

      jest
        .spyOn(servicePrivate.stripe.webhooks, 'constructEventAsync')
        .mockResolvedValue(mockEvent);

      const refundSpy = jest
        .spyOn(servicePrivate, 'handleChargeRefunded')
        .mockResolvedValue(undefined);

      const result = await service.processWebhookEvent(
        Buffer.from('payload'),
        'valid_sig',
      );

      expect(result).toEqual({ received: true });
      expect(refundSpy).toHaveBeenCalledWith(mockEvent.data.object);
    });

    it('should handle unhandled event types gracefully', async () => {
      const mockEvent = {
        id: 'evt_unhandled',
        object: 'event',
        type: 'unknown.event',
        data: {
          object: { id: 'obj_1' },
        },
        api_version: '2025-01-27.acacia',
        created: 123456789,
        livemode: false,
        pending_webhooks: 0,
        request: { id: null, idempotency_key: null },
      } as unknown as Stripe.Event;

      jest
        .spyOn(servicePrivate.stripe.webhooks, 'constructEventAsync')
        .mockResolvedValue(mockEvent);

      const result = await service.processWebhookEvent(
        Buffer.from('payload'),
        'valid_sig',
      );

      expect(result).toEqual({ received: true });
    });
  });

  describe('handleChargeRefunded', () => {
    it('should do nothing if payment_intent is missing', async () => {
      const charge = {
        id: 'ch_1',
        payment_intent: null,
      } as Stripe.Charge;

      await servicePrivate.handleChargeRefunded(charge);

      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
      expect(bookingsRepository.unblockDatesForBooking).not.toHaveBeenCalled();
    });

    it('should cancel booking, unblock dates, and notify guest and property host', async () => {
      const charge = {
        id: 'ch_1',
        payment_intent: 'pi_refund_100',
      } as Stripe.Charge;

      const mockBooking = {
        id: 'b-12345678-abcd',
        user_id: 'guest-1',
        item_id: 'prop-1',
        item_type: 'property',
        status: 'confirmed',
        payment_status: 'paid',
      };

      // Mock bookings query
      tableMocks.bookings.then = (resolve, reject) =>
        Promise.resolve({ data: [mockBooking], error: null }).then(
          resolve,
          reject,
        );

      // Mock properties query for host
      tableMocks.properties.maybeSingle.mockResolvedValueOnce({
        data: { host_id: 'host-1', title: 'Sunset Villa' },
        error: null,
      });

      await servicePrivate.handleChargeRefunded(charge);

      // Verify booking updated to cancelled & refunded
      expect(tableMocks.bookings.update).toHaveBeenCalledWith({
        status: 'cancelled',
        payment_status: 'refunded',
      });
      expect(tableMocks.bookings.eq).toHaveBeenCalledWith('id', mockBooking.id);

      // Verify dates unblocked
      expect(bookingsRepository.unblockDatesForBooking).toHaveBeenCalledWith(
        mockBooking.id,
      );

      // Verify notifications sent to guest and host
      expect(tableMocks.notifications.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'guest-1',
          title: 'Booking Refunded & Cancelled',
          type: 'info',
        }),
      );

      expect(tableMocks.notifications.insert).toHaveBeenCalledWith({
        user_id: 'host-1',
        title: 'Booking Refunded & Cancelled',
        message:
          'Booking for "Sunset Villa" was cancelled due to a refund. Dates have been reopened.',
        type: 'warning',
        link: '/host/bookings',
      });
    });

    it('should notify service provider for service booking refunds', async () => {
      const charge = {
        id: 'ch_2',
        payment_intent: 'pi_refund_200',
      } as Stripe.Charge;

      const mockBooking = {
        id: 'b-service-999',
        user_id: 'guest-2',
        item_id: 'srv-1',
        item_type: 'service',
        status: 'confirmed',
        payment_status: 'paid',
      };

      tableMocks.bookings.then = (resolve, reject) =>
        Promise.resolve({ data: [mockBooking], error: null }).then(
          resolve,
          reject,
        );

      tableMocks.services.maybeSingle.mockResolvedValueOnce({
        data: { provider_id: 'provider-1', title: 'Airport Transfer' },
        error: null,
      });

      await servicePrivate.handleChargeRefunded(charge);

      expect(bookingsRepository.unblockDatesForBooking).toHaveBeenCalledWith(
        mockBooking.id,
      );

      expect(tableMocks.notifications.insert).toHaveBeenCalledWith({
        user_id: 'provider-1',
        title: 'Booking Refunded & Cancelled',
        message:
          'Booking for "Airport Transfer" was cancelled due to a refund. Dates have been reopened.',
        type: 'warning',
        link: '/host/bookings',
      });
    });
  });

  describe('handleCheckoutSessionCompleted', () => {
    it('should ignore sessions with payment_status !== paid', async () => {
      const session = {
        id: 'cs_unpaid',
        payment_status: 'unpaid',
      } as Stripe.Checkout.Session;

      await servicePrivate.handleCheckoutSessionCompleted(session);

      expect(bookingsService.confirmBookingPayment).not.toHaveBeenCalled();
      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
    });

    it('should process booking checkout and call confirmBookingPayment', async () => {
      const session = {
        id: 'cs_booking_paid',
        payment_status: 'paid',
        payment_intent: 'pi_book_1',
        metadata: {
          bookingIds: 'b1,b2',
          userId: 'user-123',
        },
      } as unknown as Stripe.Checkout.Session;

      await servicePrivate.handleCheckoutSessionCompleted(session);

      expect(bookingsService.confirmBookingPayment).toHaveBeenCalledWith(
        ['b1', 'b2'],
        'user-123',
        'cs_booking_paid',
        'pi_book_1',
      );
    });

    it('should skip duplicate listing add-on webhook if already recorded (idempotency)', async () => {
      const session = {
        id: 'cs_addon_dup',
        payment_status: 'paid',
        payment_intent: 'pi_addon_dup',
        metadata: {
          type: 'listing_addon',
          userId: 'host-1',
          listingId: 'list-1',
          addonType: 'verified_badge',
        },
      } as unknown as Stripe.Checkout.Session;

      tableMocks.listing_addons.maybeSingle.mockResolvedValueOnce({
        data: { id: 'la-existing' },
        error: null,
      });

      await servicePrivate.handleCheckoutSessionCompleted(session);

      expect(tableMocks.listing_addons.insert).not.toHaveBeenCalled();
      expect(tableMocks.directory_listings.update).not.toHaveBeenCalled();
    });

    it('should insert listing addon and patch directory listing for verified_badge', async () => {
      const session = {
        id: 'cs_addon_vb',
        payment_status: 'paid',
        payment_intent: 'pi_addon_vb',
        metadata: {
          type: 'listing_addon',
          userId: 'host-1',
          listingId: 'list-1',
          addonType: 'verified_badge',
        },
      } as unknown as Stripe.Checkout.Session;

      tableMocks.listing_addons.maybeSingle.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      await servicePrivate.handleCheckoutSessionCompleted(session);

      expect(tableMocks.listing_addons.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          listing_id: 'list-1',
          addon_type: 'verified_badge',
          status: 'active',
          stripe_payment_id: 'pi_addon_vb',
        }),
      );

      expect(tableMocks.directory_listings.update).toHaveBeenCalledWith({
        is_verified: true,
      });
      expect(tableMocks.directory_listings.eq).toHaveBeenCalledWith(
        'id',
        'list-1',
      );
    });

    it('should insert seasonal_placement with 90 day expiry and patch is_featured', async () => {
      const session = {
        id: 'cs_addon_sp',
        payment_status: 'paid',
        payment_intent: 'pi_addon_sp',
        metadata: {
          type: 'listing_addon',
          userId: 'host-2',
          listingId: 'list-2',
          addonType: 'seasonal_placement',
        },
      } as unknown as Stripe.Checkout.Session;

      tableMocks.listing_addons.maybeSingle.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      await servicePrivate.handleCheckoutSessionCompleted(session);

      expect(tableMocks.listing_addons.insert).toHaveBeenCalledTimes(1);
      const calls = tableMocks.listing_addons.insert.mock
        .calls as unknown as Array<[Record<string, unknown>]>;
      const insertedAddon = calls[0][0];
      expect(insertedAddon.listing_id).toBe('list-2');
      expect(insertedAddon.addon_type).toBe('seasonal_placement');
      expect(insertedAddon.status).toBe('active');
      expect(typeof insertedAddon.expires_at).toBe('string');

      expect(tableMocks.directory_listings.update).toHaveBeenCalledWith({
        is_featured: true,
      });
    });
  });

  describe('handleDisputeCreated', () => {
    it('should mark booking as failed and notify all admins', async () => {
      const dispute = {
        id: 'dp_123',
        amount: 25000,
        currency: 'eur',
        reason: 'fraudulent',
        status: 'needs_response',
        payment_intent: 'pi_dispute_1',
      } as unknown as Stripe.Dispute;

      tableMocks.bookings.then = (resolve, reject) =>
        Promise.resolve({
          data: [{ id: 'b-dispute-1', user_id: 'guest-10' }],
          error: null,
        }).then(resolve, reject);

      tableMocks.profiles.then = (resolve, reject) =>
        Promise.resolve({
          data: [{ id: 'admin-1' }, { id: 'admin-2' }],
          error: null,
        }).then(resolve, reject);

      await servicePrivate.handleDisputeCreated(dispute);

      expect(tableMocks.bookings.update).toHaveBeenCalledWith({
        payment_status: 'failed',
      });
      expect(tableMocks.bookings.in).toHaveBeenCalledWith('id', [
        'b-dispute-1',
      ]);

      expect(tableMocks.notifications.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          user_id: 'admin-1',
          title: 'Charge Dispute Filed',
          type: 'warning',
          link: '/admin/bookings',
        }),
        expect.objectContaining({
          user_id: 'admin-2',
          title: 'Charge Dispute Filed',
          type: 'warning',
          link: '/admin/bookings',
        }),
      ]);
    });
  });

  describe('handlePaymentIntentFailed', () => {
    it('should mark booking payment_status to failed and send notification', async () => {
      const paymentIntent = {
        id: 'pi_failed_1',
        last_payment_error: { message: 'Card declined' },
      } as unknown as Stripe.PaymentIntent;

      tableMocks.bookings.then = (resolve, reject) =>
        Promise.resolve({
          data: [{ id: 'b-fail-1', user_id: 'guest-99' }],
          error: null,
        }).then(resolve, reject);

      await servicePrivate.handlePaymentIntentFailed(paymentIntent);

      expect(tableMocks.bookings.update).toHaveBeenCalledWith({
        payment_status: 'failed',
      });
      expect(tableMocks.bookings.eq).toHaveBeenCalledWith('id', 'b-fail-1');

      expect(tableMocks.notifications.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'guest-99',
          title: '⚠️ Payment Failed',
          type: 'error',
        }),
      );
    });
  });

  describe('Subscription lifecycle handlers', () => {
    it('handleSubscriptionCreated should insert active premium subscription and notify user', async () => {
      const subscription = {
        id: 'sub_123',
        customer: 'cus_123',
        status: 'active',
        current_period_end: 1770000000,
        cancel_at_period_end: false,
        metadata: {
          userId: 'user-sub-1',
          plan: 'annual',
          tier: 'voyager',
        },
      } as unknown as Stripe.Subscription;

      tableMocks.premium_subscriptions.maybeSingle.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      await servicePrivate.handleSubscriptionCreated(subscription);

      expect(tableMocks.premium_subscriptions.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-sub-1',
          plan: 'annual',
          tier: 'voyager',
          status: 'active',
          stripe_subscription_id: 'sub_123',
          stripe_customer_id: 'cus_123',
        }),
      );

      expect(tableMocks.notifications.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-sub-1',
          title: '🎉 Welcome to Premium!',
          type: 'success',
        }),
      );
    });

    it('handleSubscriptionCreated should skip duplicate subscriptions (idempotency)', async () => {
      const subscription = {
        id: 'sub_dup',
        customer: 'cus_dup',
        status: 'active',
        metadata: { userId: 'user-1', plan: 'monthly' },
      } as unknown as Stripe.Subscription;

      tableMocks.premium_subscriptions.maybeSingle.mockResolvedValueOnce({
        data: { id: 'sub-existing' },
        error: null,
      });

      await servicePrivate.handleSubscriptionCreated(subscription);

      expect(tableMocks.premium_subscriptions.insert).not.toHaveBeenCalled();
    });

    it('handleSubscriptionUpdated should update status and current_period_end', async () => {
      const subscription = {
        id: 'sub_update_1',
        status: 'past_due',
        current_period_end: 1780000000,
        cancel_at_period_end: true,
      } as unknown as Stripe.Subscription;

      tableMocks.premium_subscriptions.maybeSingle.mockResolvedValueOnce({
        data: { id: 'rec-1', user_id: 'user-1', status: 'active' },
        error: null,
      });

      await servicePrivate.handleSubscriptionUpdated(subscription);

      expect(tableMocks.premium_subscriptions.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'past_due',
          cancel_at_period_end: true,
        }),
      );
    });

    it('handleSubscriptionDeleted should mark subscription as cancelled and notify user', async () => {
      const subscription = {
        id: 'sub_del_1',
      } as unknown as Stripe.Subscription;

      tableMocks.premium_subscriptions.maybeSingle.mockResolvedValueOnce({
        data: { id: 'rec-2', user_id: 'user-2' },
        error: null,
      });

      await servicePrivate.handleSubscriptionDeleted(subscription);

      expect(tableMocks.premium_subscriptions.update).toHaveBeenCalledWith({
        status: 'cancelled',
      });

      expect(tableMocks.notifications.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-2',
          title: 'Subscription Cancelled',
          type: 'info',
        }),
      );
    });

    it('handleInvoicePaymentFailed should mark subscription as past_due and notify user', async () => {
      const invoice = {
        customer: 'cus_fail_1',
      } as unknown as Stripe.Invoice;

      tableMocks.premium_subscriptions.maybeSingle.mockResolvedValueOnce({
        data: { id: 'rec-3', user_id: 'user-3' },
        error: null,
      });

      await servicePrivate.handleInvoicePaymentFailed(invoice);

      expect(tableMocks.premium_subscriptions.update).toHaveBeenCalledWith({
        status: 'past_due',
      });

      expect(tableMocks.notifications.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-3',
          title: '⚠️ Payment Failed',
          type: 'error',
        }),
      );
    });
  });
});
