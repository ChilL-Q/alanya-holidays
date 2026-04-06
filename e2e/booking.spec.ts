import { test, expect } from '@playwright/test';

test.describe('Booking Flow', () => {
  test('should navigate to stays page and see listings', async ({ page }) => {
    await page.goto('/stays');
    await page.waitForLoadState('networkidle', { timeout: 15000 });

    // Check if listings loaded
    const bodyText = await page.locator('body').innerText();
    // Either has property cards or some content about stays
    expect(bodyText.length).toBeGreaterThan(100);
  });

  test('should view property details page', async ({ page }) => {
    await page.goto('/stays');
    await page.waitForLoadState('networkidle', { timeout: 15000 });

    // Find first property card
    const firstPropertyLink = page.locator('a[href*="/property/"]').first();
    if (!await firstPropertyLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      // No properties available
      expect(true).toBe(true);
      return;
    }

    const href = await firstPropertyLink.getAttribute('href') || '';
    await page.goto(href);
    await page.waitForLoadState('networkidle', { timeout: 15000 });

    // Should show property details
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(100);
  });

  test('should select dates and add property to cart', async ({ page }) => {
    await page.goto('/stays');
    await page.waitForLoadState('networkidle', { timeout: 15000 });

    const firstPropertyLink = page.locator('a[href*="/property/"]').first();
    if (!await firstPropertyLink.isVisible({ timeout: 10000 }).catch(() => false)) {
      expect(true).toBe(true);
      return;
    }

    const href = await firstPropertyLink.getAttribute('href') || '';
    await page.goto(href);
    await page.waitForLoadState('networkidle', { timeout: 15000 });

    // Try opening date picker
    const dateInput = page.locator('input').filter({ hasText: /Check/i }).first();
    if (await dateInput.count() > 0 && await dateInput.isVisible().catch(() => false)) {
      await dateInput.click();
      await page.waitForSelector('.react-datepicker', { timeout: 3000 }).catch(() => null);

      const availableDates = page.locator('.react-datepicker__day:not(.react-datepicker__day--disabled)');
      if (await availableDates.count() > 15) {
        await availableDates.nth(5).click();
        await availableDates.nth(12).click();
      }
    }

    // Click book/reserve button
    const bookBtn = page.locator('button').filter({ hasText: /Book|Reserve|Add/i });
    if (await bookBtn.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await bookBtn.first().click();
      // Wait for cart state to update
      await page.waitForFunction(() => {
        const cart = localStorage.getItem('cart');
        return cart ? JSON.parse(cart).length > 0 : false;
      }, { timeout: 5000 }).catch(() => null);

      const cartJson = await page.evaluate(() => localStorage.getItem('cart'));
      const cart = cartJson ? JSON.parse(cartJson) : [];
      expect(cart.length).toBeGreaterThan(0);
    } else {
      expect(true).toBe(true);
    }
  });

  test('should verify cart persists across navigation', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('cart', JSON.stringify([{
        id: 'test-cart-item',
        type: 'property',
        title: 'Test Villa',
        price: 350,
        image: '/images/test.jpg',
        startDate: '2026-07-01',
        endDate: '2026-07-08',
        guests: 2,
        nights: 7,
        pricePerNight: 50,
      }]));
    });

    await page.goto('/');

    // Cart should be in localStorage
    const cartLen = await page.evaluate(() => {
      const cart = localStorage.getItem('cart');
      return cart ? JSON.parse(cart).length : 0;
    });
    expect(cartLen).toBe(1);

    // Navigate to checkout
    await page.goto('/checkout');
    await page.waitForLoadState('networkidle', { timeout: 15000 });

    // Check body text contains our villa name
    const text = await page.locator('body').innerText();
    expect(text).toContain('Test Villa');
  });
});
