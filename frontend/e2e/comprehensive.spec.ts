import { test, expect } from '@playwright/test';

test.describe('End-to-End User Flow', () => {

  test('should demonstrate responsive design by switching to mobile view', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.goto('/');

    const mobileMenuButton = page.getByRole('button', { name: 'Open menu' });
    await expect(mobileMenuButton).toBeVisible();
    await mobileMenuButton.click();

    const mobileMenu = page.locator('#mobile-navigation');
    await expect(mobileMenu).toBeVisible();
    await expect(mobileMenu).toContainText(/discover/i);
    await expect(mobileMenu).toContainText(/community/i);
    await expect(mobileMenu).toContainText(/shop/i);

    await page.getByRole('button', { name: 'Close menu' }).click();
    await expect(mobileMenu).not.toBeVisible();
  });
});
