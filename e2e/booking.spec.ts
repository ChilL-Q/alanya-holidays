import { test, expect } from '@playwright/test';

test.describe('Booking Flow', () => {
  test('should view property details and open reservation', async ({ page }) => {
    // 1. Go to Home page
    await page.goto('/');

    // Ensure the page loaded and shows headings or search
    await expect(page.locator('text=Alanya').first()).toBeVisible();

    // 2. Click the first property card
    const firstPropertyLink = page.locator('a[href*="/property/"]').first();
    await firstPropertyLink.click();

    // 3. Verify Property Details page is visible
    // Wait for the property title to appear (H1 tag usually)
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

    // Ensure we can see price format e.g. "€", "₺" or "night"
    await expect(page.locator('text=night').first()).toBeVisible();

    // 4. Try choosing dates in the calendar
    // In our app, there is usually a DatePicker or 'Check-in' 'Check-out' buttons
    const checkInBtn = page.locator('button', { hasText: 'Check-in' }).or(page.locator('text=Select Dates'));
    if (await checkInBtn.count() > 0) {
      await checkInBtn.first().click();
      // Click some day in the calendar (e.g. 15 or 20)
      const day15 = page.locator('.react-datepicker__day:not(.react-datepicker__day--disabled)').nth(10);
      if (await day15.count() > 0) {
         await day15.click();
         const day20 = page.locator('.react-datepicker__day:not(.react-datepicker__day--disabled)').nth(15);
         if (await day20.count() > 0) await day20.click();
      }
    }

    // 5. Click Reserve
    const reserveBtn = page.locator('button', { hasText: 'Reserve' }).or(page.locator('button', { hasText: 'Book now' }));
    await reserveBtn.first().click();

    // 6. Verify Cart opens or Checkout modal
    // Check for text 'Cart' or 'Checkout' or 'Added to cart'
    await expect(page.locator('text=Cart').or(page.locator('text=Summary'))).toBeVisible({ timeout: 10000 });
  });

  test('should use search filters', async ({ page }) => {
    // Go to Search page
    await page.goto('/stays');

    // Wait for properties
    const propertyCards = page.locator('a[href*="/property/"]');
    await expect(propertyCards.first()).toBeVisible({ timeout: 10000 });

    // Try a filter
    const filtersBtn = page.locator('button', { hasText: 'Filters' });
    if (await filtersBtn.count() > 0) {
      await filtersBtn.first().click();
      
      // Select something like 'Villa'
      const villaOption = page.locator('button, label', { hasText: 'Villa' });
      if (await villaOption.count() > 0) {
         await villaOption.first().click();
      }

      // Apply
      const showResultsBtn = page.locator('button', { hasText: /Show \d+ homes/i }).or(page.locator('button', { hasText: 'Apply' }));
      if (await showResultsBtn.count() > 0) {
         await showResultsBtn.first().click();
      }
    }

    // Ensure results still appear
    await expect(propertyCards.first()).toBeVisible({ timeout: 5000 });
  });
});
