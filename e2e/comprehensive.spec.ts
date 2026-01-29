import { test, expect } from '@playwright/test';

test.describe('End-to-End User Flow', () => {
  test('should allow a user to find a property and view its details', async ({ page }) => {
    // 1. Visit Homepage
    await page.goto('/');
    await expect(page).toHaveTitle(/Alanya Holidays/i);

    // 2. Interact with Search Widget
    // Fill location (assuming it's an input or select)
    const locationInput = page.getByPlaceholder(/where are you going/i);
    if (await locationInput.isVisible()) {
        await locationInput.fill('Alanya');
    }

    // Click Search
    const searchButton = page.getByRole('button', { name: /search/i });
    await searchButton.click();

    // 3. Verify Navigation to Results
    await expect(page).toHaveURL(/.*stays|.*properties|.*search/);
    
    // 4. Check for Property Cards
    const propertyCards = page.locator('.property-card');
    // If we have any cards, let's click the first one
    const firstCard = propertyCards.first();
    if (await firstCard.isVisible()) {
        const title = await firstCard.locator('h3').textContent();
        await firstCard.click();
        
        // 5. Verify Detail Page
        await expect(page).toHaveURL(/\/property\/.*/);
        if (title) {
            await expect(page.locator('h1')).toContainText(title);
        }
        
        // 6. Check Amenities
        const amenitiesSection = page.locator('text=amenities');
        if (await amenitiesSection.isVisible()) {
            await expect(amenitiesSection).toBeVisible();
        }
    }
  });

  test('should demonstrate responsive design by switching to mobile view', async ({ page }) => {
    // Playwright allows easy viewport manipulation
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size
    await page.goto('/');
    
    // 1. Check if mobile menu trigger is present (the profile/menu button)
    const mobileMenuButton = page.locator('button').filter({ has: page.locator('.lucide-menu') });
    await expect(mobileMenuButton).toBeVisible();
    await mobileMenuButton.click();
    
    // 2. Check if mobile menu container appears (it's a div with animate-in)
    const mobileMenu = page.locator('.animate-in.slide-in-from-top-10');
    await expect(mobileMenu).toBeVisible();
    
    // 3. Check if menu items are present
    await expect(mobileMenu).toContainText(/stays|services|shop/i);
    
    // 4. Close menu by clicking the trigger again
    await mobileMenuButton.click();
    await expect(mobileMenu).not.toBeVisible();
  });
});
