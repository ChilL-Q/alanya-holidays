import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class StripeWebhookProcessor {
  private readonly logger = new Logger(StripeWebhookProcessor.name);

  async processEvent(payload: { id: string; type: string }): Promise<boolean> {
    this.logger.log(`Processing async Stripe event ${payload.type} (${payload.id})`);
    return true;
  }
}
