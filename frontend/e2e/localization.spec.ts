import { test, expect } from '@playwright/test';

test.describe('Localization Flow', () => {
  test('does not advertise unfinished language variants', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 15000 });

    await expect(page.getByRole('button', { name: /EN|English|Русский|Türkçe/i })).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});
