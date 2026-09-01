import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { SupabaseService } from '../../supabase/supabase.service';
import { BookingsService } from '../../bookings/bookings.service';
import { BookingsRepository } from '../../bookings/bookings.repository';
import { NotificationsService } from '../../notifications/notifications.service';

@Injectable()
export class BookingWebhookHandler {
  private readonly logger = new Logger(BookingWebhookHandler.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly bookingsService: BookingsService,
    private readonly bookingsRepository: BookingsRepository,
    private readonly notificationsService: NotificationsService,
  ) {}

  private get supabase() {
    return this.supabaseService.getClient();
  }

  async handleCheckoutSession(session: Stripe.Checkout.Session): Promise<void> {
    if (session.payment_status && session.payment_status !== 'paid') {
      return;
    }

    const bookingIdsStr = session.metadata?.bookingIds;
    const userId = session.metadata?.userId;
    const paymentIntentId =
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id || null;

    if (!bookingIdsStr || !userId) {
      this.logger.warn(
        `Missing bookingIds or userId in checkout session metadata: session ${session.id}`,
      );
      return;
    }

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

  async handlePaymentIntentFailed(
    paymentIntent: Stripe.PaymentIntent,
  ): Promise<void> {
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
        await this.notificationsService.notifyUser(String(booking.user_id), {
          title: '⚠️ Payment Failed',
          message:
            'Your booking payment could not be processed. Please check your payment details and try again.',
          type: 'error',
          link: '/profile',
        });
      }
    }
  }

  async handleDisputeCreated(dispute: Stripe.Dispute): Promise<void> {
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

    // Admin notification — единственный владелец «кто админы» внутри двери
    await this.notificationsService.notifyAdmins({
      title: 'Charge Dispute Filed',
      message: `A dispute has been filed for payment intent ${paymentIntentId || dispute.id}.${bookingSummary} Reason: ${dispute.reason || 'unknown'}. Amount: ${amountStr} ${currencyStr}.`,
      type: 'warning',
      link: '/admin/bookings',
    });
  }

  async handleChargeRefunded(charge: Stripe.Charge): Promise<void> {
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
      if (booking.payment_status === 'refunded') {
        this.logger.log(
          `Booking ${booking.id} already refunded, skipping duplicate refund processing`,
        );
        continue;
      }

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
        await this.notificationsService.notifyUser(String(booking.user_id), {
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
        await this.notificationsService.notifyUser(hostId, {
          title: 'Booking Refunded & Cancelled',
          message: `Booking for "${itemTitle}" was cancelled due to a refund. Dates have been reopened.`,
          type: 'warning',
          link: '/host/bookings',
        });
      }
    }
  }
}
