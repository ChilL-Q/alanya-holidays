import { describe, it, expect, vi, beforeEach } from "vitest";
import { billingService, hasActivePremiumAccess } from "./billing.service";
import { apiClient, ApiError } from "@/lib/api-client";

describe("billing.service", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("createSubscriptionCheckout posts the selected plan and returns the checkout URL", async () => {
    const postSpy = vi
      .spyOn(apiClient, "post")
      .mockResolvedValueOnce({ url: "https://checkout.stripe.com/session" });

    const res = await billingService.createSubscriptionCheckout("annual");

    expect(postSpy).toHaveBeenCalledWith("/billing/subscription/checkout", {
      plan: "annual",
    });
    expect(res.url).toBe("https://checkout.stripe.com/session");
  });

  it("createSubscriptionCheckout propagates ApiError for active subscription", async () => {
    vi.spyOn(apiClient, "post").mockRejectedValueOnce(
      new ApiError("User already has an active subscription", 400, "Bad Request", "/billing/subscription/checkout")
    );

    await expect(
      billingService.createSubscriptionCheckout("monthly")
    ).rejects.toThrow(ApiError);
  });

  it("cancelSubscription posts to the cancel endpoint", async () => {
    const postSpy = vi
      .spyOn(apiClient, "post")
      .mockResolvedValueOnce({ success: true });

    const res = await billingService.cancelSubscription();

    expect(postSpy).toHaveBeenCalledWith("/billing/subscription/cancel");
    expect(res.success).toBe(true);
  });

  it("getMySubscription unwraps the subscription envelope", async () => {
    const record = {
      plan: "monthly",
      status: "active",
      tier: "voyager",
      stripe_subscription_id: "sub-1",
      stripe_customer_id: "cus-1",
      current_period_end: "2026-09-25T00:00:00Z",
      cancel_at_period_end: false,
    };
    vi.spyOn(apiClient, "get").mockResolvedValueOnce({ subscription: record });

    const res = await billingService.getMySubscription();

    expect(res).toEqual(record);
  });

  it("getMySubscription returns null when user has no subscription", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValueOnce({ subscription: null });

    const res = await billingService.getMySubscription();

    expect(res).toBeNull();
  });

  it("createPortalSession posts to the portal endpoint", async () => {
    const postSpy = vi
      .spyOn(apiClient, "post")
      .mockResolvedValueOnce({ url: "https://billing.stripe.com/portal" });

    const res = await billingService.createPortalSession();

    expect(postSpy).toHaveBeenCalledWith("/billing/subscription/portal");
    expect(res.url).toBe("https://billing.stripe.com/portal");
  });

  it("uses the same active, trialing, and expiry predicate as the server", () => {
    const base = {
      plan: "monthly",
      tier: "voyager",
      stripe_subscription_id: "sub-1",
      stripe_customer_id: "cus-1",
      current_period_end: "2026-09-25T00:00:00Z",
      cancel_at_period_end: false,
    };
    const now = Date.parse("2026-09-01T00:00:00Z");

    expect(hasActivePremiumAccess({ ...base, status: "active" }, now)).toBe(true);
    expect(hasActivePremiumAccess({ ...base, status: "trialing" }, now)).toBe(true);
    expect(hasActivePremiumAccess({ ...base, status: "cancelled" }, now)).toBe(false);
    expect(
      hasActivePremiumAccess(
        { ...base, status: "active", current_period_end: "2026-08-01T00:00:00Z" },
        now
      )
    ).toBe(false);
  });
});
