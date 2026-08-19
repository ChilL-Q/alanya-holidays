import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { SupabaseService } from '../supabase/supabase.service';
import { BookingsService } from '../bookings/bookings.service';
import { BookingsRepository } from '../bookings/bookings.repository';

@Injectable()
export class StripeWebhookService {
  private readonly logger = new Logger(StripeWebhookService.name);
  private stripe: Stripe;

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly bookingsService: BookingsService,
    private readonly bookingsRepository: BookingsRepository,
  ) {
    const apiKey = process.env.STRIPE_SECRET_KEY || 'sk_test_mock';
    const apiVersion = (process.env.STRIPE_API_VERSION ||
      '2025-01-27.acacia') as Stripe.LatestApiVersion;
    this.stripe = new Stripe(apiKey, { apiVersion });
  }

  private get supabase() {
    return this.supabaseService.getClient();
  }

  async processWebhookEvent(
    rawBody: Buffer,
    signature: string,
  ): Promise<{ received: boolean }> {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new BadRequestException(
        'STRIPE_WEBHOOK_SECRET is not configured on server',
      );
    }

    let event: Stripe.Event;
    try {
      event = await this.stripe.webhooks.constructEventAsync(
        rawBody,
        signature,
        webhookSecret,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Webhook signature verification failed: ${msg}`);
      throw new BadRequestException(`Webhook Error: ${msg}`);
    }

    this.logger.log(`Received Stripe event type: ${event.type} [${event.id}]`);

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutSessionCompleted(event.data.object);
        break;

      case 'customer.subscription.created':
        await this.handleSubscriptionCreated(event.data.object);
        break;

      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_failed':
        await this.handleInvoicePaymentFailed(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await this.handlePaymentIntentFailed(event.data.object);
        break;

      case 'charge.refunded':
        await this.handleChargeRefunded(event.data.object);
        break;

      case 'charge.dispute.created':
        await this.handleDisputeCreated(event.data.object);
        break;

      default:
        this.logger.log(`Unhandled Stripe event type: ${event.type}`);
    }

    return { received: true };
  }

  private async handleCheckoutSessionCompleted(
    session: Stripe.Checkout.Session,
  ) {
    const sessionType = session.metadata?.type;
    const paymentIntentId =
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id || null;

    // 1. Listing add-on purchase
    if (sessionType === 'listing_addon') {
      const listingId = session.metadata?.listingId;
      const addonType = session.metadata?.addonType;
      const durationDays = parseInt(session.metadata?.durationDays || '30', 10);
      const userId = session.metadata?.userId;

      if (!listingId || !addonType || !userId) {
        this.logger.error(
          `Missing metadata for listing_addon checkout: ${JSON.stringify(session.metadata)}`,
        );
        return;
      }

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + durationDays);

      try {
        if (paymentIntentId) {
          const { data: existingAddon } = await this.supabase
            .from('listing_addons')
            .select('id')
            .eq('stripe_payment_id', paymentIntentId)
            .maybeSingle();

          if (existingAddon) {
            this.logger.log(
              `Listing add-on already recorded for payment ${paymentIntentId}, skipping duplicate`,
            );
            return;
          }
        }

        const { error: insertError } = await this.supabase
          .from('listing_addons')
          .insert({
            listing_id: listingId,
            addon_type: addonType,
            status: 'active',
            starts_at: new Date().toISOString(),
            expires_at: expiresAt.toISOString(),
            stripe_payment_id: paymentIntentId,
            amount: session.amount_total ? session.amount_total / 100 : 0,
            currency: session.currency || 'eur',
          });

        if (insertError) {
          this.logger.error(
            `Failed to insert listing_addon for session ${session.id}: ${insertError.message}`,
          );
          throw insertError;
        }

        // Apply fast-path flags to the listing record directly
        let patch: Record<string, unknown> | null = null;
        if (addonType === 'verified_badge') {
          patch = { is_verified: true };
        } else if (
          addonType === 'featured' ||
          addonType === 'seasonal_placement'
        ) {
          patch = { is_featured: true };
        } else if (addonType === 'top_placement') {
          patch = { is_top_placement: true };
        }

        if (patch) {
          const { error: patchError } = await this.supabase
            .from('directory_listings')
            .update(patch)
            .eq('id', listingId);

          if (patchError) {
            this.logger.error(
              `Failed to update directory_listings for listing ${listingId} with patch ${JSON.stringify(patch)}: ${patchError.message}`,
            );
          }
        }

        await this.supabase.from('notifications').insert({
          user_id: userId,
          title: 'Upgrade activated',
          message: `Your "${addonType.replace(/_/g, ' ')}" add-on is now active.`,
          type: 'success',
          link: '/host/upgrades',
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        const stack = err instanceof Error ? err.stack : undefined;
        this.logger.error(
          `Failed processing listing_addon checkout for session ${session.id}: ${msg}`,
          stack,
        );
        throw err;
      }
      return;
    }

    // 2. Booking purchase
    const bookingIdsStr = session.metadata?.bookingIds;
    const userId = session.metadata?.userId;

    if (bookingIdsStr && userId) {
      try {
        const bookingIds = bookingIdsStr.split(',').filter(Boolean);
        await this.bookingsService.confirmBookingPayment(
          bookingIds,
          userId,
          session.id,
          paymentIntentId,
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        const stack = err instanceof Error ? err.stack : undefined;
        this.logger.error(
          `Failed confirming booking payment for session ${session.id}, bookingIds: ${bookingIdsStr}: ${msg}`,
          stack,
        );
        throw err;
      }
    }
  }

  private async handleSubscriptionCreated(subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string;
    const { userId, plan, tier } = subscription.metadata || {};
    if (!userId || !plan) {
      this.logger.warn(
        `Subscription created missing metadata: userId=${userId}, plan=${plan}`,
      );
      return;
    }

    const { data: existing, error: findError } = await this.supabase
      .from('premium_subscriptions')
      .select('id')
      .eq('stripe_subscription_id', subscription.id)
      .maybeSingle();

    if (findError) {
      this.logger.error(
        `Error checking existing subscription ${subscription.id}: ${findError.message}`,
      );
    }

    if (existing) {
      this.logger.warn(
        `Skipping duplicate subscription.created for ${subscription.id}`,
      );
      return;
    }

    const status =
      subscription.status === 'trialing' ||
      (subscription.trial_end &&
        new Date(subscription.trial_end * 1000) > new Date())
        ? 'trialing'
        : 'active';

    const periodEnd = (
      subscription as unknown as { current_period_end?: number }
    ).current_period_end;
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
      cancel_at_period_end: subscription.cancel_at_period_end ?? false,
    };
    if (tier) insertPayload.tier = tier;

    const { error: insertError } = await this.supabase
      .from('premium_subscriptions')
      .insert(insertPayload);

    if (insertError) {
      this.logger.error(
        `Failed to insert premium_subscription for user ${userId}: ${insertError.message}`,
      );
      throw new Error(
        `Failed to insert premium_subscription: ${insertError.message}`,
      );
    }

    await this.supabase.from('notifications').insert({
      user_id: userId,
      title: '🎉 Welcome to Premium!',
      message: 'You now have access to AI Trip Planner and Premium benefits.',
      type: 'success',
      link: '/profile',
    });
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const { data: subRecord, error: findError } = await this.supabase
      .from('premium_subscriptions')
      .select('id, user_id, status')
      .eq('stripe_subscription_id', subscription.id)
      .maybeSingle();

    if (findError) {
      this.logger.error(
        `Error querying subscription ${subscription.id}: ${findError.message}`,
      );
      return;
    }

    if (!subRecord) {
      this.logger.warn(
        `Subscription ${subscription.id} not found for subscription.updated event`,
      );
      return;
    }

    const periodEnd = (
      subscription as unknown as { current_period_end?: number }
    ).current_period_end;
    const currentPeriodEnd = periodEnd
      ? new Date(periodEnd * 1000).toISOString()
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const newStatus =
      subscription.status === 'active'
        ? 'active'
        : subscription.status === 'trialing'
          ? 'trialing'
          : subscription.status === 'past_due'
            ? 'past_due'
            : 'cancelled';

    const { error: updateError } = await this.supabase
      .from('premium_subscriptions')
      .update({
        status: newStatus,
        current_period_end: currentPeriodEnd,
        cancel_at_period_end: subscription.cancel_at_period_end ?? false,
      })
      .eq('id', subRecord.id);

    if (updateError) {
      this.logger.error(
        `Failed updating subscription ${subRecord.id}: ${updateError.message}`,
      );
      throw new Error(`Failed updating subscription: ${updateError.message}`);
    }
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const { data: subRecord, error: findError } = await this.supabase
      .from('premium_subscriptions')
      .select('id, user_id')
      .eq('stripe_subscription_id', subscription.id)
      .maybeSingle();

    if (findError) {
      this.logger.error(
        `Error querying subscription ${subscription.id}: ${findError.message}`,
      );
      return;
    }

    if (!subRecord) {
      this.logger.warn(
        `Subscription ${subscription.id} not found for subscription.deleted event`,
      );
      return;
    }

    const { error: updateError } = await this.supabase
      .from('premium_subscriptions')
      .update({ status: 'cancelled' })
      .eq('id', subRecord.id);

    if (updateError) {
      this.logger.error(
        `Failed updating cancelled subscription ${subRecord.id}: ${updateError.message}`,
      );
      throw new Error(
        `Failed updating cancelled subscription: ${updateError.message}`,
      );
    }

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
    const { data: subRecord, error: findError } = await this.supabase
      .from('premium_subscriptions')
      .select('id, user_id')
      .eq('stripe_customer_id', customerId)
      .in('status', ['active', 'trialing'])
      .limit(1)
      .maybeSingle();

    if (findError) {
      this.logger.error(
        `Error querying subscription for customer ${customerId}: ${findError.message}`,
      );
      return;
    }

    if (!subRecord) {
      this.logger.warn(
        `No active subscription found for customer ${customerId} on invoice failure`,
      );
      return;
    }

    const { error: updateError } = await this.supabase
      .from('premium_subscriptions')
      .update({ status: 'past_due' })
      .eq('id', subRecord.id);

    if (updateError) {
      this.logger.error(
        `Failed updating subscription ${subRecord.id} to past_due: ${updateError.message}`,
      );
      throw new Error(`Failed updating subscription: ${updateError.message}`);
    }

    await this.supabase.from('notifications').insert({
      user_id: subRecord.user_id,
      title: '⚠️ Payment Failed',
      message:
        'Your Premium subscription payment failed. Please update your payment method.',
      type: 'error',
      link: '/profile',
    });
  }

  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
    this.logger.warn(
      `Payment failed for payment_intent ${paymentIntent.id}: ${paymentIntent.last_payment_error?.message || 'unknown error'}`,
    );

    const { data: bookings, error: fetchError } = await this.supabase
      .from('bookings')
      .select('id, user_id, item_id, item_type')
      .eq('payment_intent_id', paymentIntent.id);

    if (fetchError) {
      this.logger.error(
        `Failed to fetch bookings for failed payment_intent ${paymentIntent.id}: ${fetchError.message}`,
      );
      return;
    }

    if (!bookings || bookings.length === 0) {
      this.logger.warn(
        `No bookings found for failed payment_intent ${paymentIntent.id}`,
      );
      return;
    }

    for (const booking of bookings) {
      const { error: updateError } = await this.supabase
        .from('bookings')
        .update({ payment_status: 'failed' })
        .eq('id', booking.id);

      if (updateError) {
        this.logger.error(
          `Failed updating payment_status to failed for booking ${booking.id}: ${updateError.message}`,
        );
      }

      if (booking.user_id) {
        await this.supabase.from('notifications').insert({
          user_id: booking.user_id,
          title: '⚠️ Payment Failed',
          message:
            'Your booking payment could not be processed. Please check your payment details and try again.',
          type: 'error',
          link: '/profile',
        });
      }
    }
  }

  private async handleDisputeCreated(dispute: Stripe.Dispute) {
    const paymentIntentId =
      typeof dispute.payment_intent === 'string'
        ? dispute.payment_intent
        : ((dispute.payment_intent as { id: string } | null)?.id ?? null);

    const amountStr = dispute.amount
      ? (dispute.amount / 100).toFixed(2)
      : '0.00';
    const currencyStr = dispute.currency?.toUpperCase() || 'EUR';

    this.logger.warn(
      `Charge dispute created: ID=${dispute.id}, Amount=${amountStr} ${currencyStr}, Reason=${dispute.reason || 'unknown'}, Status=${dispute.status}, PaymentIntent=${paymentIntentId || 'none'}`,
    );

    let bookingSummary = '';

    if (paymentIntentId) {
      const { data: bookings, error: fetchError } = await this.supabase
        .from('bookings')
        .select('id, user_id')
        .eq('payment_intent_id', paymentIntentId);

      if (fetchError) {
        this.logger.error(
          `Failed fetching bookings for disputed payment_intent ${paymentIntentId}: ${fetchError.message}`,
        );
      } else if (bookings && bookings.length > 0) {
        bookingSummary = ` Booking ID(s): ${bookings.map((b) => b.id).join(', ')}.`;
        const bookingIds = bookings.map((b) => b.id);
        const { error: updateError } = await this.supabase
          .from('bookings')
          .update({ payment_status: 'failed' })
          .in('id', bookingIds);

        if (updateError) {
          this.logger.error(
            `Failed marking bookings ${bookingIds.join(', ')} as failed on dispute: ${updateError.message}`,
          );
        }
      }
    }

    // Admin notification
    const { data: admins, error: adminError } = await this.supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin');

    if (adminError) {
      this.logger.error(
        `Failed to fetch admin users for dispute notification: ${adminError.message}`,
      );
    } else if (admins && admins.length > 0) {
      const notifications = admins.map((admin: { id: string }) => ({
        user_id: admin.id,
        title: 'Charge Dispute Filed',
        message: `A dispute has been filed for payment intent ${paymentIntentId || dispute.id}.${bookingSummary} Reason: ${dispute.reason || 'unknown'}. Amount: ${amountStr} ${currencyStr}.`,
        type: 'warning',
        link: '/admin/bookings',
      }));

      const { error: notifError } = await this.supabase
        .from('notifications')
        .insert(notifications);

      if (notifError) {
        this.logger.error(
          `Failed to insert admin dispute notifications: ${notifError.message}`,
        );
      }
    }
  }

  private async handleChargeRefunded(charge: Stripe.Charge) {
    const paymentIntentId =
      typeof charge.payment_intent === 'string'
        ? charge.payment_intent
        : ((charge.payment_intent as { id: string } | null)?.id ?? null);

    if (!paymentIntentId) {
      this.logger.warn('charge.refunded event received without payment_intent');
      return;
    }

    const { data: bookings, error: fetchError } = await this.supabase
      .from('bookings')
      .select('id, user_id, item_id, item_type, payment_status, status')
      .eq('payment_intent_id', paymentIntentId);

    if (fetchError) {
      this.logger.error(
        `Failed fetching bookings for refund payment_intent ${paymentIntentId}: ${fetchError.message}`,
      );
      return;
    }

    if (!bookings || bookings.length === 0) {
      this.logger.warn(
        `No bookings found for refunded payment_intent ${paymentIntentId}`,
      );
      return;
    }

    for (const booking of bookings) {
      const { error: updateError } = await this.supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          payment_status: 'refunded',
        })
        .eq('id', booking.id);

      if (updateError) {
        this.logger.error(
          `Failed updating booking ${booking.id} to cancelled/refunded: ${updateError.message}`,
        );
        continue;
      }

      // Automatically unblock calendar dates for the property/service
      await this.bookingsRepository.unblockDatesForBooking(booking.id);
      this.logger.log(`Unblocked dates for refunded booking ${booking.id}`);

      // In-app notification to guest
      if (booking.user_id) {
        await this.supabase.from('notifications').insert({
          user_id: booking.user_id,
          title: 'Booking Refunded & Cancelled',
          message: `Your booking #${booking.id.slice(0, 8)} has been cancelled and refunded.`,
          type: 'info',
          link: '/profile',
        });
      }

      // In-app notification to host/provider
      let hostId: string | null = null;
      let itemTitle = 'your listing';

      if (booking.item_id) {
        const itemId = String(booking.item_id);
        if (booking.item_type === 'service') {
          const { data: service } = await this.supabase
            .from('services')
            .select('provider_id, title')
            .eq('id', itemId)
            .maybeSingle();

          if (service) {
            const svc = service as {
              provider_id?: string | null;
              title?: string | null;
            };
            hostId = svc.provider_id || null;
            itemTitle = svc.title || 'your listing';
          }
        } else {
          const { data: property } = await this.supabase
            .from('properties')
            .select('host_id, title')
            .eq('id', itemId)
            .maybeSingle();

          if (property) {
            const prop = property as {
              host_id?: string | null;
              title?: string | null;
            };
            hostId = prop.host_id || null;
            itemTitle = prop.title || 'your listing';
          }
        }
      }

      if (hostId && hostId !== booking.user_id) {
        await this.supabase.from('notifications').insert({
          user_id: hostId,
          title: 'Booking Refunded & Cancelled',
          message: `Booking for "${itemTitle}" was cancelled due to a refund. Dates have been reopened.`,
          type: 'warning',
          link: '/host/bookings',
        });
      }
    }
  }
}
