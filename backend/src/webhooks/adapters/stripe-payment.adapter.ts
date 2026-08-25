import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import {
  AddonCheckoutParams,
  PaymentGateway,
  SubscriptionCheckoutParams,
} from '../domain/payment-gateway.interface';

@Injectable()
export class StripePaymentAdapter implements PaymentGateway {
  private readonly logger = new Logger(StripePaymentAdapter.name);
  private readonly stripe: Stripe;

  constructor() {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (!apiKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured on server');
    }

    const apiVersion = (process.env.STRIPE_API_VERSION ||
      '2025-01-27.acacia') as Stripe.LatestApiVersion;
    this.stripe = new Stripe(apiKey, { apiVersion });
  }

  async constructEvent(
    rawBody: Buffer,
    signature: string,
    secret?: string,
  ): Promise<Stripe.Event> {
    const webhookSecret = secret || process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new BadRequestException(
        'STRIPE_WEBHOOK_SECRET is not configured on server',
      );
    }

    try {
      return await this.stripe.webhooks.constructEventAsync(
        rawBody,
        signature,
        webhookSecret,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Webhook signature verification failed: ${msg}`);
      throw new BadRequestException(`Webhook Error: ${msg}`);
    }
  }

  // One Stripe Price ID per purchasable add-on; fallback to inline price_data
  // when the env var is not configured. instant_booking intentionally excluded.
  private static readonly ADDON_PRICE_IDS: Record<string, string | undefined> =
    {
      verified_badge: process.env.STRIPE_ADDON_VERIFIED_BADGE_PRICE_ID,
      seasonal_placement: process.env.STRIPE_ADDON_SEASONAL_PLACEMENT_PRICE_ID,
      sponsored_article: process.env.STRIPE_ADDON_SPONSORED_ARTICLE_PRICE_ID,
      ai_localization: process.env.STRIPE_ADDON_AI_LOCALIZATION_PRICE_ID,
    };

  private static getAddonDetails(type: string): {
    name: string;
    amount: number;
  } {
    switch (type) {
      case 'verified_badge':
        return { name: 'Verified Badge', amount: 4900 };
      case 'seasonal_placement':
        return { name: 'Seasonal Placement (90 days)', amount: 9900 };
      case 'sponsored_article':
        return { name: 'Sponsored Article', amount: 14900 };
      case 'ai_localization':
        return { name: 'AI Translation & Localization', amount: 2900 };
      default:
        return { name: 'Listing Add-on', amount: 4900 };
    }
  }

  async createAddonCheckoutSession(
    params: AddonCheckoutParams,
  ): Promise<{ url: string }> {
    const siteUrl = params.siteUrl || 'https://alanyaholidays.com';
    const details = StripePaymentAdapter.getAddonDetails(params.addonType);
    const priceId = StripePaymentAdapter.ADDON_PRICE_IDS[params.addonType];

    const lineItem = priceId
      ? { price: priceId, quantity: 1 }
      : {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Add-on: ${details.name}`,
              description: `Add-on for listing ${params.listingName || params.listingId}`,
            },
            unit_amount: details.amount,
          },
          quantity: 1,
        };

    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [lineItem],
      metadata: {
        type: 'listing_addon',
        userId: params.userId,
        listingId: params.listingId,
        addonType: params.addonType,
      },
      customer_email: params.userEmail || undefined,
      success_url: `${siteUrl}/host/upgrades?addon=success`,
      cancel_url: `${siteUrl}/host/upgrades?addon=cancelled`,
      allow_promotion_codes: true,
    });

    if (!session.url) {
      throw new Error('Stripe did not return a checkout URL');
    }
    return { url: session.url };
  }

  private static readonly VOYAGER_PRICE_IDS: Record<
    SubscriptionCheckoutParams['plan'],
    string | undefined
  > = {
    monthly: process.env.STRIPE_VOYAGER_PRICE_ID,
    annual: process.env.STRIPE_VOYAGER_ANNUAL_PRICE_ID,
  };

  async createSubscriptionCheckoutSession(
    params: SubscriptionCheckoutParams,
  ): Promise<{ url: string }> {
    const siteUrl = params.siteUrl || 'https://alanyaholidays.com';
    const plan = params.plan;
    const priceId = StripePaymentAdapter.VOYAGER_PRICE_IDS[plan];

    const lineItem = priceId
      ? { price: priceId, quantity: 1 }
      : {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Alanya Holidays Voyager Plan',
              description: 'Voyager membership subscription',
            },
            unit_amount: plan === 'annual' ? 19000 : 1900,
            recurring: {
              interval:
                plan === 'annual' ? ('year' as const) : ('month' as const),
            },
          },
          quantity: 1,
        };

    const metadata = {
      userId: params.userId,
      plan,
      tier: 'voyager',
    };

    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [lineItem],
      metadata,
      // CRITICAL: webhook читает метаданные с объекта Subscription
      subscription_data: { metadata },
      customer_email: params.userEmail || undefined,
      success_url: `${siteUrl}/settings?tab=billing&subscription=success`,
      cancel_url: `${siteUrl}/settings?tab=billing&subscription=cancelled`,
      allow_promotion_codes: true,
    });

    if (!session.url) {
      throw new Error('Stripe did not return a checkout URL');
    }
    return { url: session.url };
  }

  async cancelSubscriptionAtPeriodEnd(
    stripeSubscriptionId: string,
  ): Promise<void> {
    await this.stripe.subscriptions.update(stripeSubscriptionId, {
      cancel_at_period_end: true,
    });
  }

  async createBillingPortalSession(
    stripeCustomerId: string,
    returnUrl: string,
  ): Promise<{ url: string }> {
    const portal = await this.stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: returnUrl,
    });
    return { url: portal.url };
  }
}
