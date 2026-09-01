import { apiClient } from "@/lib/api-client";

export type SubscriptionPlan = "monthly" | "annual";

export interface MySubscription {
  plan: string;
  status: string;
  tier?: string | null;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface MySubscriptionResponse {
  subscription: MySubscription | null;
}

export function hasActivePremiumAccess(
  subscription: MySubscription | null,
  now = Date.now()
): boolean {
  if (!subscription || !["active", "trialing"].includes(subscription.status)) {
    return false;
  }
  const periodEnd = Date.parse(subscription.current_period_end);
  return Number.isFinite(periodEnd) && periodEnd > now;
}

export const billingService = {
  /**
   * Создаёт Stripe Checkout (mode: subscription) и возвращает URL
   * для редиректа. Бросает ApiError при активной подписке.
   */
  async createSubscriptionCheckout(
    plan: SubscriptionPlan
  ): Promise<{ url: string }> {
    return apiClient.post<{ url: string }>("/billing/subscription/checkout", {
      plan,
    });
  },

  /**
   * Помечает подписку отменой в конце оплаченного периода.
   */
  async cancelSubscription(): Promise<{ success: boolean }> {
    return apiClient.post<{ success: boolean }>(
      "/billing/subscription/cancel"
    );
  },

  /**
   * Текущая подписка пользователя или null.
   */
  async getMySubscription(): Promise<MySubscription | null> {
    const res = await apiClient.get<MySubscriptionResponse>(
      "/billing/subscription/me"
    );
    return res?.subscription ?? null;
  },

  /**
   * Stripe Billing Portal для управления оплатой.
   */
  async createPortalSession(): Promise<{ url: string }> {
    return apiClient.post<{ url: string }>("/billing/subscription/portal");
  },
};
