import { Test, TestingModule } from '@nestjs/testing';
import { StripeWebhookService } from './stripe-webhook.service';
import { ProcessedStripeEventsRepository } from './processed-stripe-events.repository';
import { PAYMENT_GATEWAY } from './domain/payment-gateway.interface';
import { InMemoryPaymentFake } from './adapters/in-memory-payment.fake';
import { AddonWebhookHandler } from './handlers/addon-webhook.handler';
import { SubscriptionWebhookHandler } from './handlers/subscription-webhook.handler';
import { BookingWebhookHandler } from './handlers/booking-webhook.handler';
import Stripe from 'stripe';

describe('Task 6.1: Stripe Webhook Idempotency & Concurrency Stress Suite', () => {
  let service: StripeWebhookService;
  let paymentFake: InMemoryPaymentFake;
  let bookingHandler: jest.Mocked<Partial<BookingWebhookHandler>>;
  let subscriptionHandler: jest.Mocked<Partial<SubscriptionWebhookHandler>>;
  let addonHandler: jest.Mocked<Partial<AddonWebhookHandler>>;
  let processedEventsStore: Map<string, boolean>;

  beforeEach(async () => {
    paymentFake = new InMemoryPaymentFake();
    processedEventsStore = new Map<string, boolean>();

    bookingHandler = {
      handleCheckoutSession: jest.fn().mockImplementation(async () => {
        // Simulate async database I/O delay
        await new Promise((resolve) => setTimeout(resolve, 5));
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

    const mockProcessedRepo = {
      tryClaimEvent: jest.fn().mockImplementation((eventId: string) => {
        // Atomic compare-and-swap simulation
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
        { provide: SubscriptionWebhookHandler, useValue: subscriptionHandler },
        { provide: AddonWebhookHandler, useValue: addonHandler },
        {
          provide: ProcessedStripeEventsRepository,
          useValue: mockProcessedRepo,
        },
      ],
    }).compile();

    service = module.get<StripeWebhookService>(StripeWebhookService);
  });

  it('guarantees exact-once processing under 50 concurrent identical webhook deliveries', async () => {
    const eventId = 'evt_race_50_workers';
    const event = {
      id: eventId,
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_race_1',
          metadata: { bookingIds: 'b1,b2', userId: 'user-race' },
        },
      },
    } as unknown as Stripe.Event;

    paymentFake.registerEvent('sig_race_50', event);

    // Fire 50 simultaneous parallel webhook deliveries
    const parallelCalls = Array.from({ length: 50 }, () =>
      service.processWebhookEvent(Buffer.from('payload'), 'sig_race_50'),
    );

    const results = await Promise.all(parallelCalls);

    // All 50 requests receive { received: true }
    expect(results).toHaveLength(50);
    results.forEach((res) => expect(res).toEqual({ received: true }));

    // Handler must be called EXACTLY ONCE
    expect(bookingHandler.handleCheckoutSession).toHaveBeenCalledTimes(1);
  });

  it('guarantees crash recovery: transient failure releases lock and subsequent retry succeeds', async () => {
    const eventId = 'evt_transient_crash';
    const event = {
      id: eventId,
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_crash_1',
          metadata: { bookingIds: 'b1', userId: 'user-crash' },
        },
      },
    } as unknown as Stripe.Event;

    paymentFake.registerEvent('sig_crash', event);

    // First attempt fails due to database network timeout
    (bookingHandler.handleCheckoutSession as jest.Mock).mockRejectedValueOnce(
      new Error('Connection timeout to database replica'),
    );

    await expect(
      service.processWebhookEvent(Buffer.from('payload'), 'sig_crash'),
    ).rejects.toThrow('Connection timeout to database replica');

    // Verify lock was released
    expect(processedEventsStore.has(eventId)).toBe(false);

    // Second attempt (Stripe webhook automatic retry) succeeds
    (bookingHandler.handleCheckoutSession as jest.Mock).mockResolvedValueOnce(
      undefined,
    );

    const retryResult = await service.processWebhookEvent(
      Buffer.from('payload'),
      'sig_crash',
    );

    expect(retryResult).toEqual({ received: true });
    expect(bookingHandler.handleCheckoutSession).toHaveBeenCalledTimes(2);
    expect(processedEventsStore.get(eventId)).toBe(true);
  });

  it('maintains idempotency isolation across heterogeneous event types arriving simultaneously', async () => {
    const bookingEvent = {
      id: 'evt_mixed_booking',
      type: 'checkout.session.completed',
      data: {
        object: { id: 'cs_b', metadata: { bookingIds: 'b1', userId: 'u1' } },
      },
    } as unknown as Stripe.Event;

    const subEvent = {
      id: 'evt_mixed_sub',
      type: 'customer.subscription.created',
      data: { object: { id: 'sub_1' } },
    } as unknown as Stripe.Event;

    const addonEvent = {
      id: 'evt_mixed_addon',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_a',
          metadata: { type: 'listing_addon', listingId: 'l1' },
        },
      },
    } as unknown as Stripe.Event;

    paymentFake.registerEvent('sig_b', bookingEvent);
    paymentFake.registerEvent('sig_s', subEvent);
    paymentFake.registerEvent('sig_a', addonEvent);

    const results = await Promise.all([
      service.processWebhookEvent(Buffer.from('payload'), 'sig_b'),
      service.processWebhookEvent(Buffer.from('payload'), 'sig_s'),
      service.processWebhookEvent(Buffer.from('payload'), 'sig_a'),
    ]);

    expect(results).toEqual([
      { received: true },
      { received: true },
      { received: true },
    ]);
    expect(bookingHandler.handleCheckoutSession).toHaveBeenCalledTimes(1);
    expect(subscriptionHandler.handleCreated).toHaveBeenCalledTimes(1);
    expect(addonHandler.handleCheckoutSession).toHaveBeenCalledTimes(1);
  });
});
