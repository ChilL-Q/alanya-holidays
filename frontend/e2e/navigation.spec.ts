import { test, expect } from '@playwright/test';

test.describe('Navigation Flow', () => {
  test('should navigate to Blog from the Discover menu', async ({ page }) => {
    await page.goto('/');

    await page.locator('nav').getByRole('button', { name: 'Discover' }).first().hover();
    const blogLink = page.locator('nav a[href="/blog"]').filter({ visible: true }).first();
    await expect(blogLink).toBeVisible();
    await blogLink.click();

    await expect(page).toHaveURL('/blog');
  });

  test('should load travel guides', async ({ page }) => {
    await page.goto('/travel-guides');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL('/travel-guides');
    await expect(page.locator('body')).toContainText(/travel|guide|alanya/i);
  });

  test('should load the explore directory', async ({ page }) => {
    await page.goto('/explore');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL('/explore');
    await expect(page.locator('body')).toContainText(/explore|discover|business/i);
  });
});
