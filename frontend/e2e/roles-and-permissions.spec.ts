import { test, expect } from '@playwright/test';
import {
  seedAuthSession,
  setupAuthMocks,
  mockSupabaseRest,
  mockPropertyData,
  mockBlogData,
  mockDirectoryData,
  mockFavoritesData,
} from './utils/mock-utils';

async function mockProfileSecondaryRoutes(page: any) {
  await page.route('**/rest/v1/bookings*', async (route: any) => {
    await route.fulfill({ status: 200, body: JSON.stringify([]), headers: { 'Content-Type': 'application/json' } });
  });
  await page.route('**/rest/v1/services*', async (route: any) => {
    await route.fulfill({ status: 200, body: JSON.stringify([]), headers: { 'Content-Type': 'application/json' } });
  });
}

test.describe('Role-Based Access Control & User Permissions', () => {

  test.describe('1. Guest (Unauthenticated)', () => {
    test.beforeEach(async ({ page }) => {
      await mockSupabaseRest(page, { role: 'guest' });
      await mockPropertyData(page);
      await mockBlogData(page);
      await mockDirectoryData(page);
      await mockFavoritesData(page);
      await mockProfileSecondaryRoutes(page);
    });

    test('can view public pages without redirection', async ({ page }) => {
      await page.goto('/');
      await expect(page).toHaveURL('/');

      await page.goto('/blog');
      await expect(page).toHaveURL('/blog');

      await page.goto('/directory');
      await expect(page).toHaveURL('/directory');
    });

    test('is redirected to home when accessing protected routes', async ({ page }) => {
      await page.goto('/admin');
      await expect(page).toHaveURL('/');

      await page.goto('/admin/users');
      await expect(page).toHaveURL('/');

      await page.goto('/host');
      await expect(page).toHaveURL('/');

      await page.goto('/profile');
      await expect(page).toHaveURL('/');
    });

    test('clicking protected action opens login modal', async ({ page }) => {
      await page.goto('/forum');
      const newPostBtn = page.getByRole('button', { name: /New Post/i });
      if (await newPostBtn.count() > 0) {
        await newPostBtn.first().click();
        await expect(page.getByRole('heading', { name: /Sign in|Log in|Welcome/i })).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe('2. Regular Authenticated User (Traveler)', () => {
    test.beforeEach(async ({ page }) => {
      await setupAuthMocks(page);
      await seedAuthSession(page, { role: 'guest' });
      await mockSupabaseRest(page, { role: 'guest' });
      await mockPropertyData(page);
      await mockBlogData(page);
      await mockDirectoryData(page);
      await mockFavoritesData(page);
      await mockProfileSecondaryRoutes(page);
    });

    test('can access user profile', async ({ page }) => {
      await page.goto('/');
      await page.goto('/profile');
      await expect(page).toHaveURL('/profile');
    });

    test('is blocked and redirected from admin and host pages', async ({ page }) => {
      await page.goto('/');
      await page.goto('/admin');
      await expect(page).toHaveURL('/');

      await page.goto('/admin/users');
      await expect(page).toHaveURL('/');

      await page.goto('/host');
      await expect(page).toHaveURL('/');
    });
  });

  test.describe('3. Host / Vendor Role', () => {
    test.beforeEach(async ({ page }) => {
      await setupAuthMocks(page);
      await seedAuthSession(page, { role: 'host' });
      await mockSupabaseRest(page, { role: 'host' });
      await mockPropertyData(page);
      await mockBlogData(page);
      await mockDirectoryData(page);
      await mockFavoritesData(page);
      await mockProfileSecondaryRoutes(page);
    });

    test('can access host dashboard and host subpages', async ({ page }) => {
      await page.goto('/');
      await page.goto('/host');
      await expect(page).toHaveURL('/host');

      await page.goto('/host/calendar');
      await expect(page).toHaveURL('/host/calendar');

      await page.goto('/host/properties');
      await expect(page).toHaveURL('/host/properties');
    });

    test('can access regular user pages', async ({ page }) => {
      await page.goto('/');
      await page.goto('/profile');
      await expect(page).toHaveURL('/profile');
    });

    test('is blocked and redirected from admin routes', async ({ page }) => {
      await page.goto('/');
      await page.goto('/admin');
      await expect(page).toHaveURL('/');

      await page.goto('/admin/users');
      await expect(page).toHaveURL('/');
    });
  });

  test.describe('4. Admin Role', () => {
    test.beforeEach(async ({ page }) => {
      await setupAuthMocks(page);
      await seedAuthSession(page, { role: 'admin' });
      await mockSupabaseRest(page, { role: 'admin' });
      await mockPropertyData(page);
      await mockBlogData(page);
      await mockDirectoryData(page);
      await mockFavoritesData(page);
      await mockProfileSecondaryRoutes(page);
    });

    test('can access admin dashboard', async ({ page }) => {
      await page.goto('/');
      await page.goto('/admin');
      await expect(page).toHaveURL('/admin');
    });

    test('can access admin management modules (users, directory, blog)', async ({ page }) => {
      await page.goto('/');
      await page.goto('/admin/users');
      await expect(page).toHaveURL('/admin/users');

      await page.goto('/admin/directory');
      await expect(page).toHaveURL('/admin/directory');

      await page.goto('/admin/blog');
      await expect(page).toHaveURL('/admin/blog');
    });

    test('can also access host routes and user profile', async ({ page }) => {
      await page.goto('/');
      await page.goto('/host');
      await expect(page).toHaveURL('/host');

      await page.goto('/profile');
      await expect(page).toHaveURL('/profile');
    });
  });
});
