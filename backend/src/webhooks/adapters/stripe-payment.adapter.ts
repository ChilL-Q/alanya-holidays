import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { PaymentGateway } from '../domain/payment-gateway.interface';

@Injectable()
export class StripePaymentAdapter implements PaymentGateway {
  private readonly logger = new Logger(StripePaymentAdapter.name);
  private readonly stripe: Stripe;

  constructor() {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (!apiKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured on server');
    }

    const apiVersion = (process.env.STRIPE_API_VERSION ||
      '2025-01-27.acacia') as Stripe.LatestApiVersion;
    this.stripe = new Stripe(apiKey, { apiVersion });
  }

  async constructEvent(
    rawBody: Buffer,
    signature: string,
    secret?: string,
  ): Promise<Stripe.Event> {
    const webhookSecret = secret || process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new BadRequestException(
        'STRIPE_WEBHOOK_SECRET is not configured on server',
      );
    }

    try {
      return await this.stripe.webhooks.constructEventAsync(
        rawBody,
        signature,
        webhookSecret,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Webhook signature verification failed: ${msg}`);
      throw new BadRequestException(`Webhook Error: ${msg}`);
    }
  }
}
