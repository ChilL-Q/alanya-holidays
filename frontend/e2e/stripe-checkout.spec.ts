import { test, expect } from '@playwright/test';
import { seedAuthSession, mockSupabaseRest, setupAuthMocks, seedCartAndWait, mockStripePayment, mockPropertyData } from './utils/mock-utils';

// item id must be a valid UUID — bookingSchema validates with z.string().uuid()
const CART_ITEM_UUID = '00000000-0000-4000-a000-000000000010';

const cart = [{
  id: CART_ITEM_UUID,
  type: 'RENTAL',
  title: 'Alanya Luxury Villa',
  price: 500,
  startDate: '2026-09-01',
  endDate: '2026-09-08',
  guests: 2,
  nights: 7,
  pricePerNight: 70,
}];

test.describe('Stripe Checkout Flow', () => {
  test('should render checkout page with cart items', async ({ page }) => {
    await setupAuthMocks(page);
    await seedAuthSession(page);
    await mockSupabaseRest(page);
    await seedCartAndWait(page, cart);
    await mockStripePayment(page);

    await page.goto('/checkout');
    await page.waitForLoadState('domcontentloaded');

    await expect(page).toHaveURL('/checkout');
    await expect(page.locator('body')).toContainText(/villa|total|summary|checkout/i);
  });

  test('should show Pay button and trigger booking + Stripe on click', async ({ page }) => {
    await setupAuthMocks(page);
    await seedAuthSession(page);
    await mockSupabaseRest(page);
    await seedCartAndWait(page, cart);
    await mockStripePayment(page);

    // mockPropertyData handles /rest/v1/properties* for item owner lookup in createBooking
    await mockPropertyData(page);

    // createBooking uses check_booking_conflict RPC before inserting
    await page.route('**/rest/v1/rpc/check_booking_conflict**', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ has_conflict: false, message: null }),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    // createBooking uses create_booking RPC (not direct table insert)
    await page.route('**/rest/v1/rpc/create_booking**', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ data: 'booking-test-1', error: null }),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    // Audit log insert — swallow silently
    await page.route('**/rest/v1/audit_logs**', async (route) => {
      await route.fulfill({
        status: 201,
        body: JSON.stringify([]),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    // send-email Edge Function — swallow
    await page.route('**/functions/v1/send-email**', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ success: true }),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    let stripeCallMade = false;
    await page.route('**/functions/v1/create-checkout-session**', async (route) => {
      stripeCallMade = true;
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ url: 'https://checkout.stripe.com/mock-session' }),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    await page.goto('/checkout');
    await page.waitForLoadState('domcontentloaded');

    const payBtn = page.locator('[data-testid="pay-button"]');
    await expect(payBtn).toBeVisible({ timeout: 10000 });
    await payBtn.click();

    // Give async flow time to complete (booking RPC → stripe call)
    await page.waitForTimeout(4000);
    expect(stripeCallMade).toBe(true);
  });
});
