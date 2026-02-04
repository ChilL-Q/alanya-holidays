import { test, expect } from '@playwright/test';

test.describe('Localization Flow', () => {
    test('should switch languages and update text', async ({ page }) => {
        await page.goto('/');
        
        // Check default English
        await expect(page.getByText('Unforgettable Alanya awaits')).toBeVisible();

        // Switch to Russian
        await page.getByRole('button', { name: 'English' }).click();
        await page.getByText('Русский').click();
        
        await expect(page.getByText('Незабываемая Аланья ждет вас')).toBeVisible();
        
        // Switch to Turkish
        await page.getByRole('button', { name: 'Русский' }).click();
        await page.getByText('Türkçe').click();
        await expect(page.getByText('Unutulmaz Alanya sizi bekliyor')).toBeVisible();
    });
});
