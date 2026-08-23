import Stripe from 'stripe';

export const PAYMENT_GATEWAY = 'PAYMENT_GATEWAY';

export interface PaymentGateway {
  constructEvent(
    rawBody: Buffer,
    signature: string,
    secret?: string,
  ): Promise<Stripe.Event>;
}
