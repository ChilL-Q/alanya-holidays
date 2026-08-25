import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { BillingRepository } from './billing.repository';

@Module({
  imports: [AuthModule, SupabaseModule, WebhooksModule],
  controllers: [BillingController],
  providers: [BillingService, BillingRepository],
  exports: [BillingService],
})
export class BillingModule {}
