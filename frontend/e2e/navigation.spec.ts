import { test, expect } from '@playwright/test';

test.describe('Navigation Flow', () => {
  test('should navigate to Blog from navbar', async ({ page }) => {
    await page.goto('/');

    // Desktop nav has: Directory, Blog, Shop — use filter({ visible: true }) to exclude mobile duplicates
    const blogLink = page.locator('nav').getByRole('link', { name: 'Blog' }).filter({ visible: true }).first();
    await expect(blogLink).toBeVisible({ timeout: 10000 });
    await blogLink.click();
    await expect(page).toHaveURL('/blog');
  });

  test('should load visa consult page', async ({ page }) => {
    await page.goto('/visa-consult');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL('/visa-consult');
    await expect(page.locator('body')).toContainText(/visa|consult|legal/i);
  });

  test('should load services page with categories', async ({ page }) => {
    await page.goto('/services');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).toContainText(/service|car|wellness|tour/i);
  });
});
