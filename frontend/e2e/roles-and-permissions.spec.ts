import { test, expect, type Page, type Route } from '@playwright/test';
import {
  seedAuthSession,
  setupAuthMocks,
  mockSupabaseRest,
} from './utils/mock-utils';

async function mockProfileDependencies(page: Page) {
  await page.route('**/rest/v1/bookings*', async (route: Route) => {
    await route.fulfill({ status: 200, body: '[]', headers: { 'Content-Type': 'application/json' } });
  });
  await page.route('**/rest/v1/services*', async (route: Route) => {
    await route.fulfill({ status: 200, body: '[]', headers: { 'Content-Type': 'application/json' } });
  });
}

test.describe('Current role-based access control', () => {
  test('guest can access public pages and canonical directory redirect', async ({ page }) => {
    await mockSupabaseRest(page, { role: 'guest' });

    await page.goto('/blog');
    await expect(page).toHaveURL('/blog');

    await page.goto('/directory');
    await expect(page).toHaveURL('/explore');
  });

  test('guest cannot access profile or admin dashboard', async ({ page }) => {
    await mockSupabaseRest(page, { role: 'guest' });

    await page.goto('/admin');
    await expect(page).toHaveURL('/login');

    await page.goto('/profile');
    await expect(page).toHaveURL('/login');
  });

  test('authenticated traveler can access profile but not admin dashboard', async ({ page }) => {
    await setupAuthMocks(page);
    await seedAuthSession(page, { role: 'guest' });
    await mockSupabaseRest(page, { role: 'guest' });
    await mockProfileDependencies(page);

    await page.goto('/profile');
    await expect(page).toHaveURL('/profile');

    await page.goto('/admin');
    await expect(page).toHaveURL('/');
  });

  test('administrator can access admin dashboard and profile', async ({ page }) => {
    await setupAuthMocks(page);
    await seedAuthSession(page, { role: 'admin' });
    await mockSupabaseRest(page, { role: 'admin' });
    await mockProfileDependencies(page);

    await page.goto('/admin');
    await expect(page).toHaveURL('/admin');
    await expect(page.locator('body')).toContainText(/admin/i);

    await page.goto('/profile');
    await expect(page).toHaveURL('/profile');
  });
});
