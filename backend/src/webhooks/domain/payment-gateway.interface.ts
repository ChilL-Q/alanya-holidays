import Stripe from 'stripe';

export const PAYMENT_GATEWAY = 'PAYMENT_GATEWAY';

export type SubscriptionPlan = 'monthly' | 'annual';

export interface SubscriptionCheckoutParams {
  userId: string;
  userEmail?: string | null;
  plan: SubscriptionPlan;
  siteUrl?: string;
}

export type ListingAddonType =
  | 'verified_badge'
  | 'seasonal_placement'
  | 'sponsored_article'
  | 'ai_localization';

export interface AddonCheckoutParams {
  userId: string;
  userEmail?: string | null;
  listingId: string;
  listingName?: string | null;
  addonType: ListingAddonType;
  siteUrl?: string;
}

export interface PaymentGateway {
  constructEvent(
    rawBody: Buffer,
    signature: string,
    secret?: string,
  ): Promise<Stripe.Event>;

  /**
   * Создаёт Stripe Checkout Session для покупки Listing Addon.
   * Каталог цен и метаданные — единственный владелец здесь.
   */
  createAddonCheckoutSession(
    params: AddonCheckoutParams,
  ): Promise<{ url: string }>;

  /**
   * Stripe Checkout (mode: subscription) для Voyager-плана.
   * ВАЖНО: метаданные дублируются в subscription_data.metadata —
   * webhook читает их с объекта Subscription, не с Session.
   */
  createSubscriptionCheckoutSession(
    params: SubscriptionCheckoutParams,
  ): Promise<{ url: string }>;

  /**
   * Помечает подписку отменой в конце оплаченного периода
   * (доступ сохраняется до конца периода).
   */
  cancelSubscriptionAtPeriodEnd(stripeSubscriptionId: string): Promise<void>;

  /**
   * Stripe Billing Portal для управления оплатой клиентом.
   */
  createBillingPortalSession(
    stripeCustomerId: string,
    returnUrl: string,
  ): Promise<{ url: string }>;
}
