import { test, expect } from '@playwright/test';

test.describe('Checkout Flow', () => {
    test.beforeEach(async ({ page }) => {
        // Seed local storage BEFORE page load so CartContext picks it up immediately
        const cartItem = {
            id: 'seed-1',
            title: 'Seeded Property',
            price: 100,
            type: 'property',
            image: '/images/hero-bg.jpg',
            startDate: '2024-06-01',
            endDate: '2024-06-02'
        };

        await page.addInitScript(item => {
            localStorage.setItem('cart', JSON.stringify([item]));
        }, cartItem);

        await page.goto('/checkout');
    });

    test('should display seeded cart item', async ({ page }) => {
        // Verify cart is not empty
        await expect(page.getByText('Your basket is empty')).not.toBeVisible();
        
        // Use first because strict mode might complain if multiple elements (e.g. mobile/desktop)
        // although seeded item should be unique.
        await expect(page.getByText('Seeded Property').first()).toBeVisible();
        await expect(page.getByText('€100').first()).toBeVisible();
    });

    test('should allow adding Welcome Pack', async ({ page }) => {
        const welcomeButton = page.getByRole('button', { name: /Add|Добавить|Ekle|إضافة/i }).first(); 
        await welcomeButton.click();
        
        // Wait for state update
        await page.waitForTimeout(500);

        // Check for specific text appearing using more specific selector
        await expect(page.getByRole('heading', { name: 'Welcome Pack' }).first()).toBeVisible();
        await expect(page.getByText('€30').first()).toBeVisible();
    });

    test('should allow swiching to SWIFT payment', async ({ page }) => {
        await page.getByText('SWIFT').click();
        await expect(page.getByText('Garanti Bank')).toBeVisible();
        await expect(page.getByText('GATRTRI2')).toBeVisible();
    });
});
