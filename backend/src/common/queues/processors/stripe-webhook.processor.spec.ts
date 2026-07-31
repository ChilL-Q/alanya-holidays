import { StripeWebhookProcessor } from './stripe-webhook.processor';

describe('StripeWebhookProcessor', () => {
  it('should process stripe event payload asynchronously', async () => {
    const processor = new StripeWebhookProcessor();
    const result = await processor.processEvent({ id: 'evt_123', type: 'payment_intent.succeeded' });
    expect(result).toBe(true);
  });
});
