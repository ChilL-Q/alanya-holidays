import { BadRequestException } from '@nestjs/common';
import { InMemoryPaymentFake } from './in-memory-payment.fake';
import Stripe from 'stripe';

describe('InMemoryPaymentFake', () => {
  let fake: InMemoryPaymentFake;
  const originalSecret = process.env.STRIPE_WEBHOOK_SECRET;

  beforeEach(() => {
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
    fake = new InMemoryPaymentFake();
  });

  afterEach(() => {
    fake.clear();
    if (originalSecret !== undefined) {
      process.env.STRIPE_WEBHOOK_SECRET = originalSecret;
    } else {
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
    }
  });

  it('should return registered event matching signature', async () => {
    const mockEvent = {
      id: 'evt_sig_1',
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_1' } },
    } as unknown as Stripe.Event;

    fake.registerEvent('sig_custom_123', mockEvent);

    const result = await fake.constructEvent(
      Buffer.from('ignored in test'),
      'sig_custom_123',
    );

    expect(result).toBe(mockEvent);
    expect(result.id).toBe('evt_sig_1');
  });

  it('should return default event if set', async () => {
    const defaultEvent = {
      id: 'evt_default',
      type: 'customer.subscription.created',
      data: { object: { id: 'sub_1' } },
    } as unknown as Stripe.Event;

    fake.setDefaultEvent(defaultEvent);

    const result = await fake.constructEvent(
      Buffer.from('irrelevant'),
      'sig_any',
    );

    expect(result).toBe(defaultEvent);
  });

  it('should parse valid JSON rawBody when no registered event exists', async () => {
    const eventJson = JSON.stringify({
      id: 'evt_from_json',
      type: 'invoice.payment_failed',
      data: { object: { id: 'inv_1' } },
    });

    const result = await fake.constructEvent(
      Buffer.from(eventJson),
      'valid_sig',
    );

    expect(result.id).toBe('evt_from_json');
    expect(result.type).toBe('invoice.payment_failed');
  });

  it('should throw BadRequestException when failure is enabled', async () => {
    fake.setFailure(true, 'Test forced failure');

    await expect(
      fake.constructEvent(Buffer.from('payload'), 'sig'),
    ).rejects.toThrow(BadRequestException);
    await expect(
      fake.constructEvent(Buffer.from('payload'), 'sig'),
    ).rejects.toThrow('Webhook Error: Test forced failure');
  });

  it('should throw BadRequestException when signature contains "invalid"', async () => {
    await expect(
      fake.constructEvent(Buffer.from('payload'), 'invalid_signature'),
    ).rejects.toThrow('Webhook Error: Invalid signature');
  });

  it('should throw BadRequestException when secret is missing', async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    fake.setWebhookSecret('');

    await expect(
      fake.constructEvent(Buffer.from('payload'), 'sig'),
    ).rejects.toThrow('STRIPE_WEBHOOK_SECRET is not configured on server');
  });
});
