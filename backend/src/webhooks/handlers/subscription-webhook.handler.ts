import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { SupabaseService } from '../../supabase/supabase.service';
import { NotificationsService } from '../../notifications/notifications.service';

@Injectable()
export class SubscriptionWebhookHandler {
  private readonly logger = new Logger(SubscriptionWebhookHandler.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private get supabase() {
    return this.supabaseService.getClient();
  }

  async handleCreated(subscription: Stripe.Subscription): Promise<void> {
    const customerId =
      typeof subscription.customer === 'string'
        ? subscription.customer
        : ((subscription.customer as { id?: string } | null)?.id ?? '');
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

    await this.notificationsService.notifyUser(userId, {
      title: '🎉 Welcome to Premium!',
      message: 'You now have access to AI Trip Planner and Premium benefits.',
      type: 'success',
      link: '/profile',
    });
  }

  async handleUpdated(subscription: Stripe.Subscription): Promise<void> {
    const { data: subRecord, error: findError } = await this.supabase
      .from('premium_subscriptions')
      .select('id, user_id, status, cancel_at_period_end')
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

    const cancelAtPeriodEnd = subscription.cancel_at_period_end ?? false;

    const { error: updateError } = await this.supabase
      .from('premium_subscriptions')
      .update({
        status: newStatus,
        current_period_end: currentPeriodEnd,
        cancel_at_period_end: cancelAtPeriodEnd,
      })
      .eq('id', subRecord.id);

    if (updateError) {
      this.logger.error(
        `Failed updating subscription ${subRecord.id}: ${updateError.message}`,
      );
      throw new Error(`Failed updating subscription: ${updateError.message}`);
    }

    // Recovery notification if moving from past_due to active
    if (subRecord.status === 'past_due' && newStatus === 'active') {
      await this.notificationsService.notifyUser(String(subRecord.user_id), {
        title: 'Subscription Restored',
        message:
          'Your Premium subscription has been restored. Enjoy your benefits!',
        type: 'success',
        link: '/profile',
      });
    }

    // Scheduled cancellation notification
    if (cancelAtPeriodEnd && !subRecord.cancel_at_period_end) {
      await this.notificationsService.notifyUser(String(subRecord.user_id), {
        title: 'Subscription Cancellation Scheduled',
        message: `Your Premium subscription will end on ${currentPeriodEnd}. You still have access until then.`,
        type: 'warning',
        link: '/profile',
      });
    }
  }

  async handleDeleted(subscription: Stripe.Subscription): Promise<void> {
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

    await this.notificationsService.notifyUser(String(subRecord.user_id), {
      title: 'Subscription Cancelled',
      message: 'Your Premium subscription has ended.',
      type: 'info',
      link: '/profile',
    });
  }

  async handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    const customerId =
      typeof invoice.customer === 'string'
        ? invoice.customer
        : ((invoice.customer as { id?: string } | null)?.id ?? null);

    if (!customerId) {
      this.logger.warn(
        `invoice.payment_failed received without valid customer ID: ${invoice.id}`,
      );
      return;
    }

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

    await this.notificationsService.notifyUser(String(subRecord.user_id), {
      title: '⚠️ Payment Failed',
      message:
        'Your Premium subscription payment failed. Please update your payment method.',
      type: 'error',
      link: '/profile',
    });
  }
}
