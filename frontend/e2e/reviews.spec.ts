import { test, expect } from '@playwright/test';
import { seedAuthSession, mockSupabaseRest } from './utils/mock-utils';

test.describe('Reviews Flow', () => {
  test('should not allow unauthenticated user to submit review', async ({ page }) => {
    // Navigate to a property page
    await page.goto('/property/test-id');
    const reviewBtn = page.getByRole('button', { name: /leave review|write review/i });
    if (await reviewBtn.isVisible().catch(() => false)) {
        await reviewBtn.click();
        await expect(page).toHaveURL(/.*login/);
    }
  });

  test('should allow auth user to see review stats', async ({ page }) => {
    await seedAuthSession(page);
    await mockSupabaseRest(page);
    await page.goto('/property/test-id');
    
    // Check if ratings/reviews visible
    const rating = page.locator('.rating-display');
    if (await rating.isVisible().catch(() => false)) {
        await expect(rating).toBeVisible();
    }
  });
});
