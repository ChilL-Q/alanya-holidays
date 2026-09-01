import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load successfully', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/Alanya Holidays/i);
    await expect(page.locator('main')).toBeVisible();
  });
});
