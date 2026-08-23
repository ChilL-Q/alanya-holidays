import { Test, TestingModule } from '@nestjs/testing';
import { StripeWebhookService } from './stripe-webhook.service';
import { ProcessedStripeEventsRepository } from './processed-stripe-events.repository';
import { PAYMENT_GATEWAY } from './domain/payment-gateway.interface';
import { InMemoryPaymentFake } from './adapters/in-memory-payment.fake';
import { AddonWebhookHandler } from './handlers/addon-webhook.handler';
import { SubscriptionWebhookHandler } from './handlers/subscription-webhook.handler';
import { BookingWebhookHandler } from './handlers/booking-webhook.handler';
import Stripe from 'stripe';

/**
 * Adversarial persistence idempotency tests (audit 2.3): duplicate detection
 * must go through the persistent repository, not an in-memory Map.
 */
describe('StripeWebhookService - persistent event idempotency', () => {
  let service: StripeWebhookService;
  let paymentFake: InMemoryPaymentFake;
  let processedEvents: { tryClaimEvent: jest.Mock };
  let bookingHandler: jest.Mocked<Partial<BookingWebhookHandler>>;

  const bookingEvent = (id: string) =>
    ({
      id,
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_1',
          metadata: { bookingIds: 'b1', userId: 'u1' },
        },
      },
    }) as unknown as Stripe.Event;

  beforeEach(async () => {
    paymentFake = new InMemoryPaymentFake();
    processedEvents = { tryClaimEvent: jest.fn() };
    bookingHandler = {
      handleCheckoutSession: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StripeWebhookService,
        { provide: PAYMENT_GATEWAY, useValue: paymentFake },
        {
          provide: AddonWebhookHandler,
          useValue: { handleCheckoutSession: jest.fn() },
        },
        {
          provide: SubscriptionWebhookHandler,
          useValue: {
            handleCreated: jest.fn(),
            handleUpdated: jest.fn(),
            handleDeleted: jest.fn(),
            handleInvoicePaymentFailed: jest.fn(),
          },
        },
        { provide: BookingWebhookHandler, useValue: bookingHandler },
        { provide: ProcessedStripeEventsRepository, useValue: processedEvents },
      ],
    }).compile();

    service = module.get<StripeWebhookService>(StripeWebhookService);
  });

  it('should process the event when the DB claim succeeds (first delivery)', async () => {
    processedEvents.tryClaimEvent.mockResolvedValueOnce(true);
    const event = bookingEvent('evt_first');
    paymentFake.registerEvent('sig_first', event);

    const result = await service.processWebhookEvent(
      Buffer.from('payload'),
      'sig_first',
    );

    expect(processedEvents.tryClaimEvent).toHaveBeenCalledWith('evt_first');
    expect(bookingHandler.handleCheckoutSession).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ received: true });
  });

  it('should skip processing when the DB reports the event as already claimed (redelivery after restart)', async () => {
    processedEvents.tryClaimEvent.mockResolvedValueOnce(false);
    const event = bookingEvent('evt_redelivered');
    paymentFake.registerEvent('sig_dup', event);

    const result = await service.processWebhookEvent(
      Buffer.from('payload'),
      'sig_dup',
    );

    expect(bookingHandler.handleCheckoutSession).not.toHaveBeenCalled();
    expect(result).toEqual({ received: true });
  });

  it('should not process the event when the DB claim fails (fail-closed)', async () => {
    processedEvents.tryClaimEvent.mockRejectedValueOnce(
      new Error('connection refused'),
    );
    const event = bookingEvent('evt_db_fail');
    paymentFake.registerEvent('sig_fail', event);

    await expect(
      service.processWebhookEvent(Buffer.from('payload'), 'sig_fail'),
    ).rejects.toThrow('connection refused');

    expect(bookingHandler.handleCheckoutSession).not.toHaveBeenCalled();
  });
});
