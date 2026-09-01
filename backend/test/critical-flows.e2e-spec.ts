import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { GlobalHttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { BookingsController } from '../src/bookings/bookings.controller';
import { BookingsService } from '../src/bookings/bookings.service';
import { StripeWebhookController } from '../src/webhooks/stripe-webhook.controller';
import { StripeWebhookService } from '../src/webhooks/stripe-webhook.service';
import { AuthGuard } from '../src/auth/auth.guard';
import { AuthTokenService } from '../src/auth/auth-token.service';
import { RolesGuard } from '../src/auth/roles.guard';
import { UserRolesRepository } from '../src/common/auth/user-roles.repository';
import { SupabaseService } from '../src/supabase/supabase.service';
import { RedisService } from '../src/common/redis/redis.service';

type HttpApp = Parameters<typeof request>[0];

describe('Critical backend flows (e2e)', () => {
  jest.setTimeout(30000);
  let app: INestApplication;
  let httpApp: HttpApp;

  const mockUser = {
    id: 'user-123',
    email: 'traveller@example.com',
  };

  const bookingsServiceMock = {
    createBooking: jest.fn<Promise<string>, [object, string]>(),
    getUserBookings: jest.fn<Promise<unknown[]>, [string]>(),
  };

  const stripeWebhookServiceMock = {
    processWebhookEvent: jest.fn<
      Promise<{ received: boolean }>,
      [Buffer, string]
    >(),
  };

  const supabaseAuthGetUserMock = jest.fn<
    Promise<{ data: { user: typeof mockUser | null }; error: null }>,
    [string]
  >();
  const redisGetJsonMock = jest.fn<
    Promise<Record<string, unknown> | null>,
    [string]
  >();
  const redisSetJsonMock = jest.fn<Promise<void>, [string, unknown, number]>();

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [BookingsController, StripeWebhookController],
      providers: [
        AuthGuard,
        RolesGuard,
        AuthTokenService,
        UserRolesRepository,
        {
          provide: BookingsService,
          useValue: bookingsServiceMock,
        },
        {
          provide: StripeWebhookService,
          useValue: stripeWebhookServiceMock,
        },
        {
          provide: SupabaseService,
          useValue: {
            getClient: () => ({
              auth: {
                getUser: supabaseAuthGetUserMock,
              },
            }),
          },
        },
        {
          provide: RedisService,
          useValue: {
            getJson: redisGetJsonMock,
            setJson: redisSetJsonMock,
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication({ rawBody: true });
    app.setGlobalPrefix('api');
    app.useGlobalFilters(new GlobalHttpExceptionFilter());
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
    httpApp = app.getHttpAdapter().getInstance() as HttpApp;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    bookingsServiceMock.createBooking.mockResolvedValue('booking-777');
    bookingsServiceMock.getUserBookings.mockResolvedValue([
      { id: 'booking-777', user_id: 'user-123', status: 'confirmed' },
    ]);
    stripeWebhookServiceMock.processWebhookEvent.mockResolvedValue({
      received: true,
    });
    redisGetJsonMock.mockResolvedValue(null);
    redisSetJsonMock.mockResolvedValue(undefined);
    supabaseAuthGetUserMock.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('auth + bookings', () => {
    const validBookingPayload = {
      item_id: '550e8400-e29b-41d4-a716-446655440000',
      check_in: '2026-09-01',
      check_out: '2026-09-05',
      guests: 2,
      payment_method: 'card',
      item_type: 'property',
    };

    it('rejects unauthenticated booking creation with 401', async () => {
      const response = await request(httpApp)
        .post('/api/bookings')
        .send(validBookingPayload)
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          statusCode: 401,
          code: 'UnauthorizedException',
          message: 'Unauthorized',
          path: '/api/bookings',
        },
      });
      expect(bookingsServiceMock.createBooking).not.toHaveBeenCalled();
      expect(supabaseAuthGetUserMock).not.toHaveBeenCalled();
    });

    it('rejects invalid booking payloads before hitting service', async () => {
      const response = await request(httpApp)
        .post('/api/bookings')
        .set('Authorization', 'Bearer valid-token')
        .send({
          ...validBookingPayload,
          item_id: 'not-a-uuid',
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          statusCode: 400,
          code: 'Bad Request',
          message: ['item_id must be a UUID'],
          path: '/api/bookings',
        },
      });
      expect(bookingsServiceMock.createBooking).not.toHaveBeenCalled();
    });

    it('creates a booking for the authenticated user and strips untrusted fields', async () => {
      const response = await request(httpApp)
        .post('/api/bookings')
        .set('Authorization', 'Bearer valid-token')
        .send({
          ...validBookingPayload,
          user_id: 'attacker-user',
          total_price: 1,
        })
        .expect(201);

      expect(response.body).toEqual({
        id: 'booking-777',
        data: 'booking-777',
      });
      expect(bookingsServiceMock.createBooking).toHaveBeenCalledWith(
        validBookingPayload,
        'user-123',
      );
      expect(supabaseAuthGetUserMock).toHaveBeenCalledWith('valid-token');
      // AuthTokenService writes the token cache entry AND the user tokens index
      expect(redisSetJsonMock).toHaveBeenCalledTimes(2);
    });

    it('returns the current user bookings for a valid token', async () => {
      const response = await request(httpApp)
        .get('/api/bookings/my-bookings')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual([
        { id: 'booking-777', user_id: 'user-123', status: 'confirmed' },
      ]);
      expect(bookingsServiceMock.getUserBookings).toHaveBeenCalledWith(
        'user-123',
      );
    });
  });

  describe('stripe webhooks', () => {
    it('rejects webhook requests without stripe-signature header', async () => {
      const response = await request(httpApp)
        .post('/api/webhooks/stripe')
        .set('Content-Type', 'application/json')
        .send('{"id":"evt_missing_sig"}')
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          statusCode: 400,
          code: 'Bad Request',
          message: 'Missing stripe-signature header',
          path: '/api/webhooks/stripe',
        },
      });
      expect(
        stripeWebhookServiceMock.processWebhookEvent,
      ).not.toHaveBeenCalled();
    });

    it('passes raw request body and signature to webhook service', async () => {
      const payload = JSON.stringify({
        id: 'evt_123',
        type: 'checkout.session.completed',
      });

      const response = await request(httpApp)
        .post('/api/webhooks/stripe')
        .set('stripe-signature', 'sig_test_123')
        .set('Content-Type', 'application/json')
        .send(payload)
        .expect(200);

      expect(response.body).toEqual({ received: true });
      expect(
        stripeWebhookServiceMock.processWebhookEvent,
      ).toHaveBeenCalledTimes(1);

      const [rawBody, signature] =
        stripeWebhookServiceMock.processWebhookEvent.mock.calls[0];
      expect(Buffer.isBuffer(rawBody)).toBe(true);
      expect(rawBody.toString()).toBe(payload);
      expect(signature).toBe('sig_test_123');
    });
  });
});
