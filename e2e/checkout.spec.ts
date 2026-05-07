import { test, expect } from '@playwright/test';
import { seedAuthSession, setupAuthMocks, mockSupabaseRest, seedCartAndWait } from './utils/mock-utils';

const seedCart = [
  {
    id: 'checkout-test-1',
    type: 'RENTAL',
    title: 'Seaside Villa Alanya',
    price: 450,
    image: '/images/villa-test.jpg',
    startDate: '2026-08-01',
    endDate: '2026-08-08',
    guests: 4,
    nights: 7,
    pricePerNight: 60,
    cleaningFee: 30,
  }
];

test.describe('Stripe Checkout Flow', () => {

  test('should render checkout page with cart items', async ({ page }) => {
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
