import { test, expect } from '@playwright/test';
import { mockPropertyData, mockSupabaseRest, setupAuthMocks, seedAuthSession } from './utils/mock-utils';

test.describe('Main User Flow', () => {
  test('should allow a user to find and view a property', async ({ page }) => {
    await setupAuthMocks(page);
    await seedAuthSession(page);
    await mockSupabaseRest(page);
    await mockPropertyData(page);

    // Navigate directly to /stays — there is no "Stays" link in the desktop nav
    await page.goto('/stays');
    await page.waitForLoadState('domcontentloaded');

    await expect(page).toHaveURL(/.*stays/);
    await expect(page.getByRole('button', { name: /filters/i })).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to services page', async ({ page }) => {
    await page.goto('/services');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/.*services/);
    await expect(page.locator('body')).toContainText(/service|car|wellness|tour/i);
  });

  test('should load shop page', async ({ page }) => {
    await page.goto('/shop');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL('/shop');
    await expect(page.locator('body')).toContainText(/shop|product|souvenir/i);
  });
});
