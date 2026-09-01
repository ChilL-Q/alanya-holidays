import { test, expect } from '@playwright/test';
import { seedAuthSession, mockSupabaseRest, mockFavoritesData, mockAllSupabaseRequests } from './utils/mock-utils';

test.describe('Favorites Flow', () => {
  test('shows the empty favorites state in the settings activity hub', async ({ page }) => {
    await mockAllSupabaseRequests(page);
    await seedAuthSession(page);
    await mockSupabaseRest(page);
    await mockFavoritesData(page);

    await page.goto('/settings?tab=activity');
    await page.getByRole('tab', { name: 'My Favorites' }).click();

    await expect(page.getByText(/No saved favorites yet/i)).toBeVisible();
  });

  test('keeps authenticated users on the canonical settings route', async ({ page }) => {
    await mockAllSupabaseRequests(page);
    await seedAuthSession(page);
    await mockSupabaseRest(page);
    await mockFavoritesData(page);

    await page.goto('/settings?tab=activity');
    await page.getByRole('tab', { name: 'My Favorites' }).click();

    await expect(page).toHaveURL('/settings?tab=activity');
    await expect(page.getByRole('tab', { name: 'My Favorites' })).toHaveAttribute('aria-selected', 'true');
  });
});
