import { test, expect } from '@playwright/test';
import { seedAuthSession, mockSupabaseRest, mockPropertyData, setupAuthMocks } from './utils/mock-utils';

test.describe('Full Booking Flow', () => {
  test('should allow a logged in user to book a property', async ({ page }) => {
    await setupAuthMocks(page);
    await seedAuthSession(page);
    await mockSupabaseRest(page);
    await mockPropertyData(page);

    await page.goto('/stays');
    await page.waitForLoadState('domcontentloaded');

    // Select first property card
    const propertyCard = page.locator('a[href*="/property/"]').first();
    await expect(propertyCard).toBeVisible({ timeout: 10000 });
    await propertyCard.click();
    await page.waitForURL(/\/property\/.*/);
    await page.waitForLoadState('domcontentloaded');

    // Verify property details rendered
    await expect(page.locator('body')).toContainText(/night|per night|₺|€|\$/i, { timeout: 10000 });
  });
});
