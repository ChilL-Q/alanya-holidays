import { Injectable, BadRequestException } from '@nestjs/common';
import Stripe from 'stripe';
import {
  AddonCheckoutParams,
  PaymentGateway,
} from '../domain/payment-gateway.interface';

@Injectable()
export class InMemoryPaymentFake implements PaymentGateway {
  private eventsBySignature = new Map<string, Stripe.Event>();
  private defaultEvent: Stripe.Event | null = null;
  private shouldFail = false;
  private failureMessage = 'Invalid signature';
  private customSecret: string | null = 'whsec_test';

  setFailure(shouldFail: boolean, message = 'Invalid signature') {
    this.shouldFail = shouldFail;
    this.failureMessage = message;
  }

  setWebhookSecret(secret: string | null) {
    this.customSecret = secret;
  }

  registerEvent(signature: string, event: Stripe.Event) {
    this.eventsBySignature.set(signature, event);
  }

  setDefaultEvent(event: Stripe.Event | null) {
    this.defaultEvent = event;
  }

  clear() {
    this.eventsBySignature.clear();
    this.defaultEvent = null;
    this.shouldFail = false;
    this.failureMessage = 'Invalid signature';
    this.customSecret = 'whsec_test';
  }

  async constructEvent(
    rawBody: Buffer,
    signature: string,
    secret?: string,
  ): Promise<Stripe.Event> {
    await Promise.resolve();

    const webhookSecret =
      secret ||
      (this.customSecret !== null
        ? this.customSecret
        : process.env.STRIPE_WEBHOOK_SECRET);

    if (!webhookSecret) {
      throw new BadRequestException(
        'STRIPE_WEBHOOK_SECRET is not configured on server',
      );
    }

    if (this.shouldFail) {
      throw new BadRequestException(`Webhook Error: ${this.failureMessage}`);
    }

    if (signature.includes('invalid')) {
      throw new BadRequestException('Webhook Error: Invalid signature');
    }

    if (this.eventsBySignature.has(signature)) {
      return this.eventsBySignature.get(signature)!;
    }

    if (this.defaultEvent) {
      return this.defaultEvent;
    }

    // Try parsing raw body if it is valid JSON representing a Stripe Event
    try {
      const parsed: unknown = JSON.parse(rawBody.toString('utf-8'));
      if (parsed && typeof parsed === 'object' && 'type' in parsed) {
        return parsed as Stripe.Event;
      }
    } catch {
      // Ignored
    }

    throw new BadRequestException(
      `Webhook Error: No mock event found for signature "${signature}"`,
    );
  }

  createdAddonSessions: AddonCheckoutParams[] = [];

  async createAddonCheckoutSession(
    params: AddonCheckoutParams,
  ): Promise<{ url: string }> {
    this.createdAddonSessions.push(params);
    return {
      url: `https://checkout.stripe.test/session-${this.createdAddonSessions.length}`,
    };
  }
}
