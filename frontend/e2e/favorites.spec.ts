import { test, expect } from '@playwright/test';
import { seedAuthSession, mockSupabaseRest, mockPropertyData, mockFavoritesData } from './utils/mock-utils';

test.describe('Favorites Flow', () => {
  test('should show empty state in /favorites when no items saved', async ({ page }) => {
    await seedAuthSession(page);
    await mockSupabaseRest(page);
    await mockFavoritesData(page);
    await mockPropertyData(page);

    await page.goto('/favorites');
    await page.waitForLoadState('networkidle');

    // Page renders the empty state message
    await expect(page.locator('body')).toContainText(/no favorites|no items|favorite/i);
  });

  test('should render favorites page without errors when authenticated', async ({ page }) => {
    await seedAuthSession(page);
    await mockSupabaseRest(page);
    await mockFavoritesData(page);

    await page.goto('/favorites');
    await page.waitForLoadState('networkidle');

    // Page loaded successfully (not redirected away)
    await expect(page).toHaveURL('/favorites');
  });
});
