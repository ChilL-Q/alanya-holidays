import { BadRequestException } from '@nestjs/common';
import { StripePaymentAdapter } from './stripe-payment.adapter';
import Stripe from 'stripe';

describe('StripePaymentAdapter', () => {
  let adapter: StripePaymentAdapter;
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      STRIPE_SECRET_KEY: 'sk_test_mock',
      STRIPE_WEBHOOK_SECRET: 'whsec_mock',
    };
    adapter = new StripePaymentAdapter();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should throw at construction time when Stripe secret key is missing', () => {
    delete process.env.STRIPE_SECRET_KEY;

    expect(() => new StripePaymentAdapter()).toThrow(
      'STRIPE_SECRET_KEY is not configured on server',
    );
  });

  it('should throw BadRequestException when webhook secret is missing', async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;

    await expect(
      adapter.constructEvent(Buffer.from('payload'), 'sig'),
    ).rejects.toThrow(BadRequestException);
    await expect(
      adapter.constructEvent(Buffer.from('payload'), 'sig'),
    ).rejects.toThrow('STRIPE_WEBHOOK_SECRET is not configured on server');
  });

  it('should throw BadRequestException when signature is invalid', async () => {
    const rawBody = Buffer.from('invalid body');
    const signature = 't=123,v1=invalid';

    await expect(adapter.constructEvent(rawBody, signature)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should successfully verify and return event when Stripe constructs it', async () => {
    const mockEvent: Stripe.Event = {
      id: 'evt_123',
      object: 'event',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_123',
        } as Stripe.Checkout.Session,
      },
      api_version: '2025-01-27.acacia',
      created: 123456789,
      livemode: false,
      pending_webhooks: 0,
      request: { id: null, idempotency_key: null },
    };

    const stripeInstance = (adapter as unknown as { stripe: Stripe }).stripe;
    jest
      .spyOn(stripeInstance.webhooks, 'constructEventAsync')
      .mockResolvedValue(mockEvent);

    const result = await adapter.constructEvent(
      Buffer.from('valid payload'),
      'valid_sig',
    );

    expect(result).toBe(mockEvent);
    expect(result.id).toBe('evt_123');
  });

  it('should use explicit secret parameter if passed', async () => {
    const mockEvent = {
      id: 'evt_custom_secret',
      type: 'charge.refunded',
    } as unknown as Stripe.Event;

    const stripeInstance = (adapter as unknown as { stripe: Stripe }).stripe;
    const constructSpy = jest
      .spyOn(stripeInstance.webhooks, 'constructEventAsync')
      .mockResolvedValue(mockEvent);

    const result = await adapter.constructEvent(
      Buffer.from('payload'),
      'sig_1',
      'whsec_custom',
    );

    expect(result).toBe(mockEvent);
    expect(constructSpy).toHaveBeenCalledWith(
      Buffer.from('payload'),
      'sig_1',
      'whsec_custom',
    );
  });
});
