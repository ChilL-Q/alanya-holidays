import Stripe from 'stripe';

export const PAYMENT_GATEWAY = 'PAYMENT_GATEWAY';

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
}
