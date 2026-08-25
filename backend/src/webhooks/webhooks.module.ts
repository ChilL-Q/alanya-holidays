import { Module } from '@nestjs/common';
import { StripeWebhookController } from './stripe-webhook.controller';
import { StripeWebhookService } from './stripe-webhook.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { BookingsModule } from '../bookings/bookings.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PAYMENT_GATEWAY } from './domain/payment-gateway.interface';
import { StripePaymentAdapter } from './adapters/stripe-payment.adapter';
import { AddonWebhookHandler } from './handlers/addon-webhook.handler';
import { SubscriptionWebhookHandler } from './handlers/subscription-webhook.handler';
import { BookingWebhookHandler } from './handlers/booking-webhook.handler';
import { ProcessedStripeEventsRepository } from './processed-stripe-events.repository';

@Module({
  imports: [SupabaseModule, BookingsModule, NotificationsModule],
  controllers: [StripeWebhookController],
  providers: [
    {
      provide: PAYMENT_GATEWAY,
      useClass: StripePaymentAdapter,
    },
    AddonWebhookHandler,
    SubscriptionWebhookHandler,
    BookingWebhookHandler,
    ProcessedStripeEventsRepository,
    StripeWebhookService,
  ],
  exports: [
    StripeWebhookService,
    PAYMENT_GATEWAY,
    AddonWebhookHandler,
    SubscriptionWebhookHandler,
    BookingWebhookHandler,
  ],
})
export class WebhooksModule {}
