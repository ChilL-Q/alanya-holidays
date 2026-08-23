import { test, expect } from '@playwright/test';

test.describe('Localization Flow', () => {
  test('should switch languages and update text', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 15000 });

    const langButton = page.getByRole('button', { name: /EN|English/i }).first();
    await expect(langButton).toBeVisible({ timeout: 5000 });
    await langButton.click();
    await page.getByText('Русский').click();

    const ruButton = page.getByRole('button', { name: /RU|Русский/i }).first();
    await expect(ruButton).toBeVisible({ timeout: 5000 });
    await ruButton.click();
    await page.getByText('Türkçe').click();

    const trButton = page.getByRole('button', { name: /TR|Türkçe/i }).first();
    await expect(trButton).toBeVisible({ timeout: 5000 });
  });
});
