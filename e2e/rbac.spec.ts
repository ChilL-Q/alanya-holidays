import { test, expect } from '@playwright/test';
import { seedAuthSession, mockSupabaseRest } from './utils/mock-utils';

test.describe('Role-Based Access Control', () => {
  test('Guest should be redirected from host and admin pages', async ({ page }) => {
    await seedAuthSession(page);
    await mockSupabaseRest(page); // default role is guest

    await page.goto('/host');
    await expect(page).toHaveURL('/');

    await page.goto('/admin');
    await expect(page).toHaveURL('/');
  });

  // Note: Since we use local session seeding, testing true Admin
  // requires changing the seeded user metadata.
});
