import { test, expect } from '@playwright/test';
import { seedAuthSession, setupAuthMocks, mockSupabaseRest, seedCartAndWait, mockAllSupabaseRequests } from './utils/mock-utils';

const seedCart = [
  {
    productName: 'Seaside Villa Alanya',
    price: '€450',
    moneyPrice: { cents: 45000, currency: 'EUR' },
    icon: 'ri-home-4-line',
    quantity: 1,
    productId: 'checkout-test-1',
  }
];

test.describe('Stripe Checkout Flow', () => {

  test('should render checkout page with cart items', async ({ page }) => {
    await mockAllSupabaseRequests(page);
    await seedAuthSession(page);
    await setupAuthMocks(page);
    await mockSupabaseRest(page);
    await seedCartAndWait(page, seedCart);

    await page.goto('/checkout');
    await page.waitForLoadState('networkidle', { timeout: 15000 });

    const text = await page.locator('body').innerText();
    expect(text).toContain('Seaside Villa Alanya');
  });

  test('should show empty cart state', async ({ page }) => {
    await mockAllSupabaseRequests(page);
    await seedAuthSession(page);
    await setupAuthMocks(page);
    await mockSupabaseRest(page);
    // No cart seeded

    await page.goto('/checkout');
    await page.waitForLoadState('networkidle', { timeout: 15000 });

    const text = await page.locator('body').innerText();
    expect(text).toMatch(/empty|пуст/i);
  });

  test('should display order summary total', async ({ page }) => {
    await mockAllSupabaseRequests(page);
    await seedAuthSession(page);
    await setupAuthMocks(page);
    await mockSupabaseRest(page);
    await seedCartAndWait(page, seedCart);

    await page.goto('/checkout');
    await page.waitForLoadState('networkidle', { timeout: 15000 });

    const text = await page.locator('body').innerText();
    expect(text).toContain('Seaside Villa Alanya');
    expect(text).toMatch(/450|total|Total/i);
  });
});
