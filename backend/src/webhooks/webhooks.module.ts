import { Module } from '@nestjs/common';
import { StripeWebhookController } from './stripe-webhook.controller';
import { StripeWebhookService } from './stripe-webhook.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { BookingsModule } from '../bookings/bookings.module';

@Module({
  imports: [SupabaseModule, BookingsModule],
  controllers: [StripeWebhookController],
  providers: [StripeWebhookService],
  exports: [StripeWebhookService],
})
export class WebhooksModule {}
