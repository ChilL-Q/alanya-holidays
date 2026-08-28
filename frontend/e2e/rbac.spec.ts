import { test, expect } from '@playwright/test';
import { mockSupabaseRest } from './utils/mock-utils';

test.describe('Admin route protection', () => {
  test('guest is redirected from the admin dashboard', async ({ page }) => {
    await mockSupabaseRest(page, { role: 'guest' });

    await page.goto('/admin');

    await expect(page).toHaveURL('/login');
    await expect(page.getByText(/Admin Dashboard/i)).not.toBeVisible();
  });
});
