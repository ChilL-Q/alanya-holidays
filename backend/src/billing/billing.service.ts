import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import {
  BillingRepository,
  PremiumSubscriptionRecord,
} from './billing.repository';
import {
  PAYMENT_GATEWAY,
  PaymentGateway,
} from '../webhooks/domain/payment-gateway.interface';
import { appUrl } from '../utils/app-url';

const ACTIVE_STATUSES = ['active', 'trialing'];

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly billingRepository: BillingRepository,
    @Optional()
    @Inject(PAYMENT_GATEWAY)
    private readonly paymentGateway?: PaymentGateway,
  ) {}

  async getMySubscription(userId: string): Promise<{
    subscription: Omit<PremiumSubscriptionRecord, 'user_id' | 'id'> | null;
  }> {
    const record = await this.billingRepository.findByUserId(userId);
    if (!record) return { subscription: null };
    const { id: _id, user_id: _userId, ...rest } = record;
    return { subscription: rest };
  }

  async createCheckout(
    userId: string,
    email: string | undefined,
    plan: 'monthly' | 'annual',
  ): Promise<{ url: string }> {
    if (!this.paymentGateway) {
      throw new Error('Payment gateway is not configured');
    }

    const existing = await this.billingRepository.findByUserId(userId);
    if (
      existing &&
      ACTIVE_STATUSES.includes(existing.status) &&
      !existing.cancel_at_period_end
    ) {
      throw new BadRequestException('User already has an active subscription');
    }

    return this.paymentGateway.createSubscriptionCheckoutSession({
      userId,
      userEmail: email,
      plan,
    });
  }

  async cancel(userId: string): Promise<{ success: boolean }> {
    if (!this.paymentGateway) {
      throw new Error('Payment gateway is not configured');
    }

    const record = await this.billingRepository.findByUserId(userId);
    const isActive = record && ACTIVE_STATUSES.includes(record.status);

    if (!record || !isActive) {
      throw new NotFoundException('No active subscription found');
    }

    await this.paymentGateway.cancelSubscriptionAtPeriodEnd(
      record.stripe_subscription_id,
    );
    await this.billingRepository.setCancelAtPeriodEnd(record.id, true);

    this.logger.log(
      `Subscription ${record.stripe_subscription_id} scheduled for cancellation at period end`,
    );
    return { success: true };
  }

  async createPortal(userId: string): Promise<{ url: string }> {
    if (!this.paymentGateway) {
      throw new Error('Payment gateway is not configured');
    }

    const record = await this.billingRepository.findByUserId(userId);
    if (!record?.stripe_customer_id) {
      throw new NotFoundException('No billing profile found');
    }

    return this.paymentGateway.createBillingPortalSession(
      record.stripe_customer_id,
      appUrl('/settings?tab=billing'),
    );
  }
}
