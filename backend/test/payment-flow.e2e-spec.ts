import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import Stripe from 'stripe';

process.env.STRIPE_SECRET_KEY ||= 'sk_test_e2e_mock';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_e2e_test';

import { GlobalHttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { BookingsController } from '../src/bookings/bookings.controller';
import { BookingsService } from '../src/bookings/bookings.service';
import { BookingsRepository } from '../src/bookings/bookings.repository';
import { EmailOutboxRepository } from '../src/bookings/email-outbox.repository';
import { StripeWebhookController } from '../src/webhooks/stripe-webhook.controller';
import { StripeWebhookService } from '../src/webhooks/stripe-webhook.service';
import { BookingWebhookHandler } from '../src/webhooks/handlers/booking-webhook.handler';
import { AddonWebhookHandler } from '../src/webhooks/handlers/addon-webhook.handler';
import { SubscriptionWebhookHandler } from '../src/webhooks/handlers/subscription-webhook.handler';
import { ProcessedStripeEventsRepository } from '../src/webhooks/processed-stripe-events.repository';
import { StripePaymentAdapter } from '../src/webhooks/adapters/stripe-payment.adapter';
import { PAYMENT_GATEWAY } from '../src/webhooks/domain/payment-gateway.interface';
import { AuthGuard } from '../src/auth/auth.guard';
import { RolesGuard } from '../src/auth/roles.guard';
import { UserRolesRepository } from '../src/common/auth/user-roles.repository';
import { AuthTokenService } from '../src/auth/auth-token.service';
import { NotificationsService } from '../src/notifications/notifications.service';
import { SupabaseService } from '../src/supabase/supabase.service';
import { RedisService } from '../src/common/redis/redis.service';

type HttpApp = Parameters<typeof request>[0];

interface FakeBooking {
  id: string;
  user_id: string;
  item_id: string;
  item_type: string;
  status: string;
  payment_status: string;
  stripe_session_id?: string;
  payment_intent_id?: string | null;
  check_in: string;
  check_out: string;
  guests: number;
}

const HOST_ID = 'host-1';
const GUEST_ID = 'user-123';
const PROPERTY_ID = '550e8400-e29b-41d4-a716-446655440000';

describe('Payment flow e2e: booking -> checkout webhook -> confirmation', () => {
  let app: INestApplication;
  let httpApp: HttpApp;

  const stripe = new Stripe(
    process.env.STRIPE_SECRET_KEY ?? 'sk_test_e2e_mock',
    {
      apiVersion: '2026-06-24.dahlia',
    },
  );

  const bookingsTable = new Map<string, FakeBooking>();
  const outbox: Array<Record<string, unknown>> = [];
  const notifications: Array<Record<string, unknown>> = [];
  const claimedEvents = new Set<string>();

  const supabaseAuthGetUserMock = jest.fn<
    Promise<{
      data: { user: { id: string; email: string } | null };
      error: null;
    }>,
    [string]
  >();

  // Chainable fake for the direct supabase calls inside BookingWebhookHandler
  // (payment_intent.payment_failed path).
  const supabaseQueryMock = jest.fn<
    Promise<{ data: FakeBooking[] | null; error: null }>,
    []
  >();
  const supabaseUpdateMock = jest.fn<Promise<{ error: null }>, []>();
  const supabaseInsertMock = jest.fn<Promise<{ error: null }>, []>();

  function fakeSupabaseClient() {
    return {
      auth: { getUser: supabaseAuthGetUserMock },
      from: () => ({
        select: () => ({ eq: () => supabaseQueryMock() }),
        update: () => ({ eq: () => supabaseUpdateMock() }),
        insert: () => supabaseInsertMock(),
        delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
        rpc: () => Promise.resolve({ data: null, error: null }),
      }),
    };
  }

  const bookingsRepositoryFake = {
    getProperty: jest.fn(),
    getService: jest.fn(),
    getProfile: jest.fn(),
    createBookingRpc: jest.fn<
      Promise<string>,
      [
        {
          itemId: string;
          userId: string;
          checkIn: string;
          checkOut: string;
          guests: number;
        },
      ]
    >(),
    getUserBookings: jest.fn<Promise<FakeBooking[]>, [string]>(),
    confirmBookingsFromStripe: jest.fn<
      Promise<Array<Record<string, unknown>>>,
      [string[], string, string, string | null | undefined]
    >(),
    getConfirmedBookingsDetails: jest.fn<Promise<unknown[]>, [string[]]>(),
    unblockDatesForBooking: jest.fn<Promise<void>, [string]>(),
  };

  const emailOutboxFake = {
    enqueue: jest.fn<Promise<void>, [Record<string, unknown>]>((entry) => {
      outbox.push(entry);
      return Promise.resolve();
    }),
  };

  const processedEventsFake = {
    tryClaimEvent: jest.fn<Promise<boolean>, [string]>((eventId) =>
      Promise.resolve(!claimedEvents.has(eventId)),
    ),
    releaseEvent: jest.fn<Promise<void>, [string]>((eventId) => {
      claimedEvents.delete(eventId);
      return Promise.resolve();
    }),
  };

  const notificationsServiceFake = {
    notifyUser: jest.fn<Promise<void> | void, [string, object]>(() => {
      notifications.push({});
    }),
  };

  function buildCheckoutSessionCompleted(overrides: {
    eventId?: string;
    bookingIds: string;
    userId: string;
    sessionId?: string;
    paymentIntentId?: string;
    paymentStatus?: string;
  }): Stripe.Event {
    return {
      id: overrides.eventId ?? `evt_${Date.now()}_${Math.random()}`,
      object: 'event',
      api_version: '2025-01-27.acacia',
      created: Math.floor(Date.now() / 1000),
      livemode: false,
      pending_webhooks: 1,
      request: { id: null, idempotency_key: null },
      type: 'checkout.session.completed',
      data: {
        object: {
          id: overrides.sessionId ?? 'cs_test_1',
          object: 'checkout.session',
          payment_status: overrides.paymentStatus ?? 'paid',
          payment_intent: overrides.paymentIntentId ?? 'pi_test_1',
          metadata: {
            type: 'booking',
            bookingIds: overrides.bookingIds,
            userId: overrides.userId,
          },
        } as unknown as Stripe.Checkout.Session,
      },
    } as unknown as Stripe.Event;
  }

  async function sendSignedWebhook(event: Stripe.Event) {
    const payload = Buffer.from(JSON.stringify(event));
    const signature = await Promise.resolve(
      stripe.webhooks.generateTestHeaderString({
        payload: payload.toString(),
        secret: process.env.STRIPE_WEBHOOK_SECRET ?? 'whsec_e2e_test',
      }),
    );
    return request(httpApp)
      .post('/api/webhooks/stripe')
      .set('stripe-signature', signature)
      .set('Content-Type', 'application/json')
      .send(payload.toString('utf8'));
  }

  beforeAll(async () => {
    const bookingsService = new BookingsService(
      bookingsRepositoryFake as unknown as BookingsRepository,
      emailOutboxFake as unknown as EmailOutboxRepository,
      notificationsServiceFake as unknown as NotificationsService,
    );

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [BookingsController, StripeWebhookController],
      providers: [
        AuthGuard,
        RolesGuard,
        AuthTokenService,
        UserRolesRepository,
        BookingsService,
        BookingWebhookHandler,
        AddonWebhookHandler,
        SubscriptionWebhookHandler,
        StripeWebhookService,
        { provide: PAYMENT_GATEWAY, useClass: StripePaymentAdapter },
        { provide: BookingsRepository, useValue: bookingsRepositoryFake },
        { provide: EmailOutboxRepository, useValue: emailOutboxFake },
        {
          provide: ProcessedStripeEventsRepository,
          useValue: processedEventsFake,
        },
        { provide: NotificationsService, useValue: notificationsServiceFake },
        {
          provide: SupabaseService,
          useValue: { getClient: () => fakeSupabaseClient() },
        },
        {
          provide: RedisService,
          useValue: {
            getJson: () => Promise.resolve(null),
            setJson: () => Promise.resolve(undefined),
            del: () => Promise.resolve(undefined),
            delByPattern: () => Promise.resolve(undefined),
          },
        },
      ],
    })
      .overrideProvider(BookingsService)
      .useValue(bookingsService)
      .compile();

    app = moduleFixture.createNestApplication({ rawBody: true });
    app.setGlobalPrefix('api');
    app.useGlobalFilters(new GlobalHttpExceptionFilter());
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
    httpApp = app.getHttpAdapter().getInstance() as HttpApp;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    bookingsTable.clear();
    outbox.length = 0;
    notifications.length = 0;
    claimedEvents.clear();

    supabaseAuthGetUserMock.mockResolvedValue({
      data: { user: { id: GUEST_ID, email: 'guest@example.com' } },
      error: null,
    });
    supabaseQueryMock.mockResolvedValue({ data: [], error: null });
    supabaseUpdateMock.mockResolvedValue({ error: null });
    supabaseInsertMock.mockResolvedValue({ error: null });

    bookingsRepositoryFake.getProperty.mockResolvedValue({
      id: PROPERTY_ID,
      title: 'Sea View Apartment',
      status: 'approved',
      host_id: HOST_ID,
      price_per_night: 100,
      cleaning_fee: 20,
      currency: 'EUR',
    });
    bookingsRepositoryFake.getProfile.mockResolvedValue({
      full_name: 'Test Guest',
      email: 'guest@example.com',
    });
    bookingsRepositoryFake.createBookingRpc.mockImplementation(
      async (args: {
        itemId: string;
        userId: string;
        checkIn: string;
        checkOut: string;
        guests: number;
      }) => {
        const id = `booking-${bookingsTable.size + 1}`;
        bookingsTable.set(id, {
          id,
          user_id: args.userId,
          item_id: args.itemId,
          item_type: 'property',
          status: 'pending',
          payment_status: 'unpaid',
          check_in: args.checkIn,
          check_out: args.checkOut,
          guests: args.guests,
        });
        return Promise.resolve(id);
      },
    );
    bookingsRepositoryFake.confirmBookingsFromStripe.mockImplementation(
      (
        ids: string[],
        userId: string,
        sessionId: string,
        paymentIntentId?: string | null,
      ) => {
        const confirmed: Array<Record<string, unknown>> = [];
        for (const id of ids) {
          const booking = bookingsTable.get(id);
          if (!booking || booking.user_id !== userId) continue;
          if (booking.payment_status === 'paid') continue;
          booking.status = 'confirmed';
          booking.payment_status = 'paid';
          booking.stripe_session_id = sessionId;
          booking.payment_intent_id = paymentIntentId ?? null;
          confirmed.push({
            ...booking,
            property: { title: 'Sea View Apartment' },
            profile: { email: 'guest@example.com' },
          });
        }
        return Promise.resolve(confirmed);
      },
    );
  });

  it('full happy path: create booking -> signed checkout.session.completed -> booking confirmed + emails', async () => {
    const createResponse = await request(httpApp)
      .post('/api/bookings')
      .set('Authorization', 'Bearer valid-token')
      .send({
        item_id: PROPERTY_ID,
        check_in: '2026-12-01',
        check_out: '2026-12-05',
        guests: 2,
        payment_method: 'card',
        item_type: 'property',
      })
      .expect(201);

    const bookingId = String((createResponse.body as { id: string }).id);
    expect(bookingsTable.get(bookingId)).toMatchObject({
      status: 'pending',
      payment_status: 'unpaid',
    });

    const event = buildCheckoutSessionCompleted({
      bookingIds: bookingId,
      userId: GUEST_ID,
      paymentIntentId: 'pi_happy_path',
    });
    const response = await sendSignedWebhook(event);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ received: true });

    expect(bookingsTable.get(bookingId)).toMatchObject({
      status: 'confirmed',
      payment_status: 'paid',
      payment_intent_id: 'pi_happy_path',
    });

    const confirmEmails = outbox.filter((e) => e.type === 'booking_confirmed');
    expect(confirmEmails).toHaveLength(1);
    expect(confirmEmails[0]).toMatchObject({ to: 'guest@example.com' });
  });

  it('duplicate delivery of the same event is skipped (idempotency)', async () => {
    const createResponse = await request(httpApp)
      .post('/api/bookings')
      .set('Authorization', 'Bearer valid-token')
      .send({
        item_id: PROPERTY_ID,
        check_in: '2026-12-10',
        check_out: '2026-12-12',
        guests: 2,
        payment_method: 'card',
        item_type: 'property',
      })
      .expect(201);
    const bookingId = String((createResponse.body as { id: string }).id);

    const event = buildCheckoutSessionCompleted({
      eventId: 'evt_duplicate_check',
      bookingIds: bookingId,
      userId: GUEST_ID,
    });

    await sendSignedWebhook(event);
    expect(bookingsTable.get(bookingId)?.payment_status).toBe('paid');

    const secondDelivery = await sendSignedWebhook(event);
    expect(secondDelivery.status).toBe(200);
    expect(secondDelivery.body).toEqual({ received: true });

    // Only one confirmation email despite two deliveries
    const confirmEmails = outbox.filter((e) => e.type === 'booking_confirmed');
    expect(confirmEmails).toHaveLength(1);
  });

  it('checkout session with unpaid payment_status does not confirm the booking', async () => {
    const createResponse = await request(httpApp)
      .post('/api/bookings')
      .set('Authorization', 'Bearer valid-token')
      .send({
        item_id: PROPERTY_ID,
        check_in: '2026-12-15',
        check_out: '2026-12-17',
        guests: 1,
        payment_method: 'card',
        item_type: 'property',
      })
      .expect(201);
    const bookingId = String((createResponse.body as { id: string }).id);

    const response = await sendSignedWebhook(
      buildCheckoutSessionCompleted({
        eventId: 'evt_unpaid',
        bookingIds: bookingId,
        userId: GUEST_ID,
        paymentStatus: 'unpaid',
      }),
    );

    expect(response.status).toBe(200);
    expect(bookingsTable.get(bookingId)).toMatchObject({
      status: 'pending',
      payment_status: 'unpaid',
    });
    expect(outbox.filter((e) => e.type === 'booking_confirmed')).toHaveLength(
      0,
    );
  });

  it('webhook with an invalid signature is rejected with 400 and nothing is processed', async () => {
    const response = await request(httpApp)
      .post('/api/webhooks/stripe')
      .set('stripe-signature', 't=1,v1=invalidsignature')
      .set('Content-Type', 'application/json')
      .send(
        Buffer.from(
          JSON.stringify({
            id: 'evt_bad_sig',
            type: 'checkout.session.completed',
          }),
        ),
      )
      .expect(400);

    expect((response.body as { success: boolean }).success).toBe(false);
    expect(outbox).toHaveLength(0);
    expect(bookingsTable.size).toBe(0);
  });

  it('handler failure releases the event claim so a Stripe retry reprocesses it', async () => {
    const createResponse = await request(httpApp)
      .post('/api/bookings')
      .set('Authorization', 'Bearer valid-token')
      .send({
        item_id: PROPERTY_ID,
        check_in: '2026-12-20',
        check_out: '2026-12-22',
        guests: 2,
        payment_method: 'card',
        item_type: 'property',
      })
      .expect(201);
    const bookingId = String((createResponse.body as { id: string }).id);

    // First delivery fails during confirmation
    bookingsRepositoryFake.confirmBookingsFromStripe.mockRejectedValueOnce(
      new Error('transient DB failure'),
    );
    const failed = await sendSignedWebhook(
      buildCheckoutSessionCompleted({
        eventId: 'evt_retry_flow',
        bookingIds: bookingId,
        userId: GUEST_ID,
      }),
    );
    expect(failed.status).toBe(500);
    expect(processedEventsFake.releaseEvent).toHaveBeenCalledWith(
      'evt_retry_flow',
    );
    expect(bookingsTable.get(bookingId)?.payment_status).toBe('unpaid');

    // Stripe retry succeeds after transient failure recovered
    const retry = await sendSignedWebhook(
      buildCheckoutSessionCompleted({
        eventId: 'evt_retry_flow',
        bookingIds: bookingId,
        userId: GUEST_ID,
      }),
    );
    expect(retry.status).toBe(200);
    expect(bookingsTable.get(bookingId)).toMatchObject({
      status: 'confirmed',
      payment_status: 'paid',
    });
  });
});
