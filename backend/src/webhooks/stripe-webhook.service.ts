import { Injectable, Inject, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import {
  PAYMENT_GATEWAY,
  PaymentGateway,
} from './domain/payment-gateway.interface';
import { AddonWebhookHandler } from './handlers/addon-webhook.handler';
import { SubscriptionWebhookHandler } from './handlers/subscription-webhook.handler';
import { BookingWebhookHandler } from './handlers/booking-webhook.handler';
import { ProcessedStripeEventsRepository } from './processed-stripe-events.repository';

@Injectable()
export class StripeWebhookService {
  private readonly logger = new Logger(StripeWebhookService.name);

  constructor(
    @Inject(PAYMENT_GATEWAY)
    private readonly paymentGateway: PaymentGateway,
    private readonly addonHandler: AddonWebhookHandler,
    private readonly subscriptionHandler: SubscriptionWebhookHandler,
    private readonly bookingHandler: BookingWebhookHandler,
    private readonly processedEvents: ProcessedStripeEventsRepository,
  ) {}

  async processWebhookEvent(
    rawBody: Buffer,
    signature: string,
  ): Promise<{ received: boolean }> {
    const event = await this.paymentGateway.constructEvent(rawBody, signature);

    // Persistent idempotency (audit 2.3): claim the event atomically in the DB.
    // Fail-closed on DB errors so unverified deliveries are never processed.
    const isFirstDelivery = await this.processedEvents.tryClaimEvent(event.id);
    if (!isFirstDelivery) {
      this.logger.warn(
        `Skipping duplicate Stripe event type: ${event.type} [${event.id}]`,
      );
      return { received: true };
    }

    this.logger.log(`Received Stripe event type: ${event.type} [${event.id}]`);

    try {
      await this.dispatch(event);
    } catch (err) {
      // Release the claim so Stripe's retry is processed instead of being
      // skipped as a duplicate (the event was not actually handled).
      try {
        await this.processedEvents.releaseEvent(event.id);
      } catch (releaseErr) {
        this.logger.error(
          `Failed to release Stripe event ${event.id}: ${(releaseErr as Error).message}`,
        );
      }
      throw err;
    }

    return { received: true };
  }

  private async dispatch(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        if (session.metadata?.type === 'listing_addon') {
          await this.addonHandler.handleCheckoutSession(session);
        } else if (session.metadata?.bookingIds) {
          await this.bookingHandler.handleCheckoutSession(session);
        }
        break;
      }

      case 'customer.subscription.created':
        await this.subscriptionHandler.handleCreated(event.data.object);
        break;

      case 'customer.subscription.updated':
        await this.subscriptionHandler.handleUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await this.subscriptionHandler.handleDeleted(event.data.object);
        break;

      case 'invoice.payment_failed':
        await this.subscriptionHandler.handleInvoicePaymentFailed(
          event.data.object,
        );
        break;

      case 'payment_intent.payment_failed':
        await this.bookingHandler.handlePaymentIntentFailed(event.data.object);
        break;

      case 'charge.refunded':
        await this.bookingHandler.handleChargeRefunded(event.data.object);
        break;

      case 'charge.dispute.created':
        await this.bookingHandler.handleDisputeCreated(event.data.object);
        break;

      default:
        this.logger.log(`Unhandled Stripe event type: ${event.type}`);
    }
  }
}
