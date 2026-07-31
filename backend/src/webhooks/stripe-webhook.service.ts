import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { SupabaseService } from '../supabase/supabase.service';
import { BookingsService } from '../bookings/bookings.service';

@Injectable()
export class StripeWebhookService {
  private readonly logger = new Logger(StripeWebhookService.name);
  private stripe: Stripe;

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly bookingsService: BookingsService,
  ) {
    const apiKey = process.env.STRIPE_SECRET_KEY || 'sk_test_mock';
    const apiVersion = (process.env.STRIPE_API_VERSION || '2025-01-27.acacia') as Stripe.LatestApiVersion;
    this.stripe = new Stripe(apiKey, { apiVersion });
  }

  private get supabase() {
    return this.supabaseService.getClient();
  }

  async processWebhookEvent(rawBody: Buffer, signature: string): Promise<{ received: boolean }> {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new BadRequestException('STRIPE_WEBHOOK_SECRET is not configured on server');
    }

    let event: Stripe.Event;
    try {
      event = await this.stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
    } catch (err: any) {
      this.logger.error(`Webhook signature verification failed: ${err.message}`);
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }

    this.logger.log(`Received Stripe event type: ${event.type} [${event.id}]`);

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
        await this.handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_failed':
        await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'payment_intent.payment_failed':
        await this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'charge.dispute.created':
        await this.handleDisputeCreated(event.data.object as Stripe.Dispute);
        break;

      case 'charge.refunded':
        await this.handleChargeRefunded(event.data.object as Stripe.Charge);
        break;

      default:
        this.logger.log(`Unhandled Stripe event type: ${event.type}`);
    }

    return { received: true };
  }

  private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
    if (session.payment_status !== 'paid') return;

    const paymentIntentId =
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : (session.payment_intent as { id: string } | null)?.id ?? null;

    // 1. Listing Addon purchase
    if (session.metadata?.type === 'listing_addon') {
      const { userId, listingId, addonType } = session.metadata;
      if (!userId || !listingId || !addonType) return;

      if (paymentIntentId) {
        const { data: existing } = await this.supabase
          .from('listing_addons')
          .select('id')
          .eq('stripe_payment_intent_id', paymentIntentId)
          .maybeSingle();

        if (existing) {
          this.logger.warn(`Skipping duplicate add-on webhook for payment_intent ${paymentIntentId}`);
          return;
        }
      }

      const expiresAt =
        addonType === 'seasonal_placement'
          ? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
          : null;

      await this.supabase.from('listing_addons').insert({
        listing_id: listingId,
        addon_type: addonType,
        status: 'active',
        stripe_payment_intent_id: paymentIntentId,
        expires_at: expiresAt,
      });

      const patch: Record<string, unknown> = {};
      if (addonType === 'verified_badge') patch.is_verified = true;
      if (addonType === 'seasonal_placement') patch.is_featured = true;

      if (Object.keys(patch).length > 0) {
        await this.supabase.from('directory_listings').update(patch).eq('id', listingId);
      }

      await this.supabase.from('notifications').insert({
        user_id: userId,
        title: 'Upgrade activated',
        message: `Your "${addonType.replace(/_/g, ' ')}" add-on is now active.`,
        type: 'success',
        link: '/host/upgrades',
      });
      return;
    }

    // 2. Booking purchase
    const bookingIdsStr = session.metadata?.bookingIds;
    const userId = session.metadata?.userId;

    if (bookingIdsStr && userId) {
      const bookingIds = bookingIdsStr.split(',').filter(Boolean);
      await this.bookingsService.confirmBookingPayment(
        bookingIds,
        userId,
        session.id,
        paymentIntentId,
      );
    }
  }

  private async handleSubscriptionCreated(subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string;
    const { userId, plan, tier } = subscription.metadata || {};
    if (!userId || !plan) return;

    const { data: existing } = await this.supabase
      .from('premium_subscriptions')
      .select('id')
      .eq('stripe_subscription_id', subscription.id)
      .maybeSingle();

    if (existing) return;

    const status =
      subscription.status === 'trialing' ||
      (subscription.trial_end && new Date(subscription.trial_end * 1000) > new Date())
        ? 'trialing'
        : 'active';

    const periodEnd = (subscription as unknown as { current_period_end?: number }).current_period_end;
    const currentPeriodEnd = periodEnd
      ? new Date(periodEnd * 1000).toISOString()
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const insertPayload: Record<string, unknown> = {
      user_id: userId,
      plan,
      status,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: customerId,
      current_period_end: currentPeriodEnd,
      cancel_at_period_end: subscription.cancel_at_period_end,
    };
    if (tier) insertPayload.tier = tier;

    await this.supabase.from('premium_subscriptions').insert(insertPayload);
    await this.supabase.from('notifications').insert({
      user_id: userId,
      title: '🎉 Welcome to Premium!',
      message: 'You now have access to AI Trip Planner and Premium benefits.',
      type: 'success',
      link: '/profile',
    });
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const { data: subRecord } = await this.supabase
      .from('premium_subscriptions')
      .select('id, user_id')
      .eq('stripe_subscription_id', subscription.id)
      .maybeSingle();

    if (!subRecord) return;

    const periodEnd = (subscription as unknown as { current_period_end?: number }).current_period_end;
    const currentPeriodEnd = periodEnd
      ? new Date(periodEnd * 1000).toISOString()
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const newStatus = subscription.status === 'active' ? 'active' : subscription.status === 'trialing' ? 'trialing' : subscription.status === 'past_due' ? 'past_due' : 'cancelled';

    await this.supabase
      .from('premium_subscriptions')
      .update({
        status: newStatus,
        current_period_end: currentPeriodEnd,
        cancel_at_period_end: subscription.cancel_at_period_end ?? false,
      })
      .eq('id', subRecord.id);
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const { data: subRecord } = await this.supabase
      .from('premium_subscriptions')
      .select('id, user_id')
      .eq('stripe_subscription_id', subscription.id)
      .maybeSingle();

    if (!subRecord) return;

    await this.supabase
      .from('premium_subscriptions')
      .update({ status: 'cancelled' })
      .eq('id', subRecord.id);

    await this.supabase.from('notifications').insert({
      user_id: subRecord.user_id,
      title: 'Subscription Cancelled',
      message: 'Your Premium subscription has ended.',
      type: 'info',
      link: '/profile',
    });
  }

  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
    const customerId = invoice.customer as string;
    const { data: subRecord } = await this.supabase
      .from('premium_subscriptions')
      .select('id, user_id')
      .eq('stripe_customer_id', customerId)
      .in('status', ['active', 'trialing'])
      .limit(1)
      .maybeSingle();

    if (!subRecord) return;

    await this.supabase
      .from('premium_subscriptions')
      .update({ status: 'past_due' })
      .eq('id', subRecord.id);

    await this.supabase.from('notifications').insert({
      user_id: subRecord.user_id,
      title: '⚠️ Payment Failed',
      message: 'Your Premium subscription payment failed. Please update your payment method.',
      type: 'error',
      link: '/profile',
    });
  }

  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
    const { data: booking } = await this.supabase
      .from('bookings')
      .select('id, user_id')
      .eq('payment_intent_id', paymentIntent.id)
      .maybeSingle();

    if (!booking) return;

    await this.supabase
      .from('bookings')
      .update({ payment_status: 'failed' })
      .eq('id', booking.id);
  }

  private async handleDisputeCreated(dispute: Stripe.Dispute) {
    const paymentIntentId = dispute.payment_intent as string | undefined;
    if (!paymentIntentId) return;

    const { data: booking } = await this.supabase
      .from('bookings')
      .select('id')
      .eq('payment_intent_id', paymentIntentId)
      .maybeSingle();

    if (booking) {
      await this.supabase.from('bookings').update({ payment_status: 'failed' }).eq('id', booking.id);
    }
  }

  private async handleChargeRefunded(charge: Stripe.Charge) {
    const paymentIntentId = charge.payment_intent as string | undefined;
    if (!paymentIntentId) return;

    const { data: booking } = await this.supabase
      .from('bookings')
      .select('id, user_id')
      .eq('payment_intent_id', paymentIntentId)
      .maybeSingle();

    if (booking) {
      await this.supabase.from('bookings').update({ payment_status: 'refunded' }).eq('id', booking.id);
    }
  }
}
