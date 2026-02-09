import { test, expect } from '@playwright/test';

test.describe('Navigation Flow', () => {
    test('should navigate to valid routes', async ({ page }) => {
        await page.goto('/');

        // Services - click specifically the navbar link
        await page.getByRole('navigation').getByRole('link', { name: 'Services' }).click();
        await expect(page).toHaveURL('/services');

        // Visa Consult (checking new route)
        await page.goto('/visa-consult');
        await expect(page.getByRole('heading', { name: /Consultation|Консультация|Danışmanlığı/i })).toBeVisible();
    });

    test('should filter service categories', async ({ page }) => {
        await page.goto('/services');
        
        // Click on Health (Text is "Wellness & Health" in EN)
        await page.getByText('Wellness & Health').click();
        await expect(page).toHaveURL(/\/services\/health/);
        
        // Click on Visa
        await page.getByText('Consulting').click();
        await expect(page).toHaveURL(/\/services\/visa/);
    });
});
