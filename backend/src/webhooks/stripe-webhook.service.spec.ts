import { Test, TestingModule } from '@nestjs/testing';
import { StripeWebhookService } from './stripe-webhook.service';
import { PAYMENT_GATEWAY } from './domain/payment-gateway.interface';
import { InMemoryPaymentFake } from './adapters/in-memory-payment.fake';
import { AddonWebhookHandler } from './handlers/addon-webhook.handler';
import { SubscriptionWebhookHandler } from './handlers/subscription-webhook.handler';
import { BookingWebhookHandler } from './handlers/booking-webhook.handler';
import { ProcessedStripeEventsRepository } from './processed-stripe-events.repository';
import { BadRequestException } from '@nestjs/common';
import Stripe from 'stripe';

describe('StripeWebhookService', () => {
  let service: StripeWebhookService;
  let paymentFake: InMemoryPaymentFake;
  let addonHandler: jest.Mocked<Partial<AddonWebhookHandler>>;
  let subscriptionHandler: jest.Mocked<Partial<SubscriptionWebhookHandler>>;
  let bookingHandler: jest.Mocked<Partial<BookingWebhookHandler>>;
  let processedEvents: {
    tryClaimEvent: jest.Mock;
    releaseEvent: jest.Mock;
  };

  beforeEach(async () => {
    paymentFake = new InMemoryPaymentFake();

    addonHandler = {
      handleCheckoutSession: jest.fn().mockResolvedValue(undefined),
    };

    subscriptionHandler = {
      handleCreated: jest.fn().mockResolvedValue(undefined),
      handleUpdated: jest.fn().mockResolvedValue(undefined),
      handleDeleted: jest.fn().mockResolvedValue(undefined),
      handleInvoicePaymentFailed: jest.fn().mockResolvedValue(undefined),
    };

    bookingHandler = {
      handleCheckoutSession: jest.fn().mockResolvedValue(undefined),
      handlePaymentIntentFailed: jest.fn().mockResolvedValue(undefined),
      handleDisputeCreated: jest.fn().mockResolvedValue(undefined),
      handleChargeRefunded: jest.fn().mockResolvedValue(undefined),
    };

    const processedEventsMock = {
      tryClaimEvent: jest.fn().mockResolvedValue(true),
      releaseEvent: jest.fn().mockResolvedValue(undefined),
    };
    processedEvents = processedEventsMock;

    let claimCallCount = 0;
    processedEventsMock.tryClaimEvent.mockImplementation(() => {
      claimCallCount += 1;
      return Promise.resolve(claimCallCount === 1);
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StripeWebhookService,
        {
          provide: PAYMENT_GATEWAY,
          useValue: paymentFake,
        },
        {
          provide: AddonWebhookHandler,
          useValue: addonHandler,
        },
        {
          provide: SubscriptionWebhookHandler,
          useValue: subscriptionHandler,
        },
        {
          provide: BookingWebhookHandler,
          useValue: bookingHandler,
        },
        {
          provide: ProcessedStripeEventsRepository,
          useValue: processedEventsMock,
        },
      ],
    }).compile();

    service = module.get<StripeWebhookService>(StripeWebhookService);
  });

  afterEach(() => {
    paymentFake.clear();
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processWebhookEvent', () => {
    it('should throw BadRequestException if signature is invalid in PaymentGateway', async () => {
      const rawBody = Buffer.from('raw body');
      const signature = 'invalid_sig';

      await expect(
        service.processWebhookEvent(rawBody, signature),
      ).rejects.toThrow(BadRequestException);
    });

    it('should route listing_addon checkout session to AddonWebhookHandler', async () => {
      const session = {
        id: 'cs_addon_1',
        metadata: {
          type: 'listing_addon',
          listingId: 'l1',
          addonType: 'verified_badge',
          userId: 'u1',
        },
      } as unknown as Stripe.Checkout.Session;

      const event = {
        id: 'evt_cs_addon',
        type: 'checkout.session.completed',
        data: { object: session },
      } as Stripe.Event;

      paymentFake.registerEvent('valid_addon_sig', event);

      const result = await service.processWebhookEvent(
        Buffer.from('payload'),
        'valid_addon_sig',
      );

      expect(result).toEqual({ received: true });
      expect(addonHandler.handleCheckoutSession).toHaveBeenCalledWith(session);
      expect(bookingHandler.handleCheckoutSession).not.toHaveBeenCalled();
    });

    it('should route booking checkout session to BookingWebhookHandler', async () => {
      const session = {
        id: 'cs_booking_1',
        metadata: {
          bookingIds: 'b1,b2',
          userId: 'u1',
        },
      } as unknown as Stripe.Checkout.Session;

      const event = {
        id: 'evt_cs_booking',
        type: 'checkout.session.completed',
        data: { object: session },
      } as Stripe.Event;

      paymentFake.registerEvent('valid_booking_sig', event);

      const result = await service.processWebhookEvent(
        Buffer.from('payload'),
        'valid_booking_sig',
      );

      expect(result).toEqual({ received: true });
      expect(bookingHandler.handleCheckoutSession).toHaveBeenCalledWith(
        session,
      );
      expect(addonHandler.handleCheckoutSession).not.toHaveBeenCalled();
    });

    it('should ignore duplicate Stripe events with the same event id', async () => {
      const session = {
        id: 'cs_booking_duplicate',
        metadata: {
          bookingIds: 'b1,b2',
          userId: 'u1',
        },
      } as unknown as Stripe.Checkout.Session;

      const event = {
        id: 'evt_duplicate_booking',
        type: 'checkout.session.completed',
        data: { object: session },
      } as Stripe.Event;

      paymentFake.registerEvent('duplicate_sig', event);

      await service.processWebhookEvent(
        Buffer.from('payload'),
        'duplicate_sig',
      );
      await service.processWebhookEvent(
        Buffer.from('payload'),
        'duplicate_sig',
      );

      expect(bookingHandler.handleCheckoutSession).toHaveBeenCalledTimes(1);
      expect(bookingHandler.handleCheckoutSession).toHaveBeenCalledWith(
        session,
      );
    });

    it('should route customer.subscription.created to SubscriptionWebhookHandler', async () => {
      const subscription = {
        id: 'sub_create_1',
      } as Stripe.Subscription;

      const event = {
        id: 'evt_sub_create',
        type: 'customer.subscription.created',
        data: { object: subscription },
      } as Stripe.Event;

      paymentFake.registerEvent('sub_create_sig', event);

      const result = await service.processWebhookEvent(
        Buffer.from('payload'),
        'sub_create_sig',
      );

      expect(result).toEqual({ received: true });
      expect(subscriptionHandler.handleCreated).toHaveBeenCalledWith(
        subscription,
      );
    });

    it('should route customer.subscription.updated to SubscriptionWebhookHandler', async () => {
      const subscription = {
        id: 'sub_upd_1',
      } as Stripe.Subscription;

      const event = {
        id: 'evt_sub_upd',
        type: 'customer.subscription.updated',
        data: { object: subscription },
      } as Stripe.Event;

      paymentFake.registerEvent('sub_upd_sig', event);

      const result = await service.processWebhookEvent(
        Buffer.from('payload'),
        'sub_upd_sig',
      );

      expect(result).toEqual({ received: true });
      expect(subscriptionHandler.handleUpdated).toHaveBeenCalledWith(
        subscription,
      );
    });

    it('should route customer.subscription.deleted to SubscriptionWebhookHandler', async () => {
      const subscription = {
        id: 'sub_del_1',
      } as Stripe.Subscription;

      const event = {
        id: 'evt_sub_del',
        type: 'customer.subscription.deleted',
        data: { object: subscription },
      } as Stripe.Event;

      paymentFake.registerEvent('sub_del_sig', event);

      const result = await service.processWebhookEvent(
        Buffer.from('payload'),
        'sub_del_sig',
      );

      expect(result).toEqual({ received: true });
      expect(subscriptionHandler.handleDeleted).toHaveBeenCalledWith(
        subscription,
      );
    });

    it('should route invoice.payment_failed to SubscriptionWebhookHandler', async () => {
      const invoice = {
        id: 'inv_1',
      } as Stripe.Invoice;

      const event = {
        id: 'evt_inv_fail',
        type: 'invoice.payment_failed',
        data: { object: invoice },
      } as Stripe.Event;

      paymentFake.registerEvent('inv_fail_sig', event);

      const result = await service.processWebhookEvent(
        Buffer.from('payload'),
        'inv_fail_sig',
      );

      expect(result).toEqual({ received: true });
      expect(
        subscriptionHandler.handleInvoicePaymentFailed,
      ).toHaveBeenCalledWith(invoice);
    });

    it('should route payment_intent.payment_failed to BookingWebhookHandler', async () => {
      const pi = {
        id: 'pi_fail_1',
      } as Stripe.PaymentIntent;

      const event = {
        id: 'evt_pi_fail',
        type: 'payment_intent.payment_failed',
        data: { object: pi },
      } as Stripe.Event;

      paymentFake.registerEvent('pi_fail_sig', event);

      const result = await service.processWebhookEvent(
        Buffer.from('payload'),
        'pi_fail_sig',
      );

      expect(result).toEqual({ received: true });
      expect(bookingHandler.handlePaymentIntentFailed).toHaveBeenCalledWith(pi);
    });

    it('should route charge.refunded to BookingWebhookHandler', async () => {
      const charge = {
        id: 'ch_ref_1',
      } as Stripe.Charge;

      const event = {
        id: 'evt_ch_ref',
        type: 'charge.refunded',
        data: { object: charge },
      } as Stripe.Event;

      paymentFake.registerEvent('ch_ref_sig', event);

      const result = await service.processWebhookEvent(
        Buffer.from('payload'),
        'ch_ref_sig',
      );

      expect(result).toEqual({ received: true });
      expect(bookingHandler.handleChargeRefunded).toHaveBeenCalledWith(charge);
    });

    it('should route charge.dispute.created to BookingWebhookHandler', async () => {
      const dispute = {
        id: 'dp_1',
      } as Stripe.Dispute;

      const event = {
        id: 'evt_dp_1',
        type: 'charge.dispute.created',
        data: { object: dispute },
      } as Stripe.Event;

      paymentFake.registerEvent('dp_sig', event);

      const result = await service.processWebhookEvent(
        Buffer.from('payload'),
        'dp_sig',
      );

      expect(result).toEqual({ received: true });
      expect(bookingHandler.handleDisputeCreated).toHaveBeenCalledWith(dispute);
    });

    it('should release the event claim when a handler fails so Stripe retries are processed', async () => {
      const session = {
        id: 'cs_handler_fail',
        metadata: {
          bookingIds: 'b1',
          userId: 'u1',
        },
      } as unknown as Stripe.Checkout.Session;

      const event = {
        id: 'evt_handler_fail',
        type: 'checkout.session.completed',
        data: { object: session },
      } as Stripe.Event;

      paymentFake.registerEvent('handler_fail_sig', event);
      const checkoutSessionMock =
        bookingHandler.handleCheckoutSession as jest.Mock;
      checkoutSessionMock.mockRejectedValueOnce(
        new Error('DB connection error'),
      );

      await expect(
        service.processWebhookEvent(Buffer.from('payload'), 'handler_fail_sig'),
      ).rejects.toThrow('DB connection error');

      expect(processedEvents.releaseEvent).toHaveBeenCalledWith(
        'evt_handler_fail',
      );

      // Retry delivery after the claim was released is processed again.
      checkoutSessionMock.mockResolvedValueOnce(undefined);
      processedEvents.tryClaimEvent.mockResolvedValueOnce(true);

      const retry = await service.processWebhookEvent(
        Buffer.from('payload'),
        'handler_fail_sig',
      );

      expect(retry).toEqual({ received: true });
      expect(bookingHandler.handleCheckoutSession).toHaveBeenCalledTimes(2);
    });

    it('should handle unhandled event types gracefully and return received: true', async () => {
      const event = {
        id: 'evt_unhandled',
        type: 'unknown.event.type',
        data: { object: {} },
      } as unknown as Stripe.Event;

      paymentFake.registerEvent('unhandled_sig', event);

      const result = await service.processWebhookEvent(
        Buffer.from('payload'),
        'unhandled_sig',
      );

      expect(result).toEqual({ received: true });
      expect(addonHandler.handleCheckoutSession).not.toHaveBeenCalled();
      expect(bookingHandler.handleCheckoutSession).not.toHaveBeenCalled();
      expect(subscriptionHandler.handleCreated).not.toHaveBeenCalled();
    });
  });
});
