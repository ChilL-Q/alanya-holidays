import { Test, TestingModule } from '@nestjs/testing';
import { StripeWebhookService } from './stripe-webhook.service';
import { SupabaseService } from '../supabase/supabase.service';
import { BookingsService } from '../bookings/bookings.service';
import { BadRequestException } from '@nestjs/common';

describe('StripeWebhookService', () => {
  let service: StripeWebhookService;
  let bookingsService: jest.Mocked<Partial<BookingsService>>;

  const mockSupabaseClient = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
  };

  beforeEach(async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_mock';

    bookingsService = {
      confirmBookingPayment: jest.fn().mockResolvedValue({ confirmedCount: 1 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StripeWebhookService,
        {
          provide: SupabaseService,
          useValue: {
            getClient: () => mockSupabaseClient,
          },
        },
        {
          provide: BookingsService,
          useValue: bookingsService,
        },
      ],
    }).compile();

    service = module.get<StripeWebhookService>(StripeWebhookService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw BadRequestException if signature is invalid', async () => {
    const rawBody = Buffer.from('invalid payload');
    const invalidSignature = 't=123,v1=invalid';

    await expect(
      service.processWebhookEvent(rawBody, invalidSignature),
    ).rejects.toThrow(BadRequestException);
  });
});
