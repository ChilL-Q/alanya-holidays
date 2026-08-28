import { test, expect } from '@playwright/test';
import { seedAuthSession, mockSupabaseRest, setupAuthMocks } from './utils/mock-utils';

test.describe('Profile Flow', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthMocks(page);
    await seedAuthSession(page);
    await mockSupabaseRest(page);

    await page.route('**/rest/v1/bookings*', async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify([]), headers: { 'Content-Type': 'application/json' } });
    });
    await page.route('**/rest/v1/properties*', async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify([]), headers: { 'Content-Type': 'application/json' } });
    });
    await page.route('**/rest/v1/services*', async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify([]), headers: { 'Content-Type': 'application/json' } });
    });
  });

  test('should load profile page and show user info', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL('/profile');
    // ProfileSidebar renders user name
    await expect(page.locator('body')).toContainText(/Test User/i, { timeout: 10000 });
  });

  test('should update personal information from the default profile tab', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: /Personal Information/i })).toBeVisible({ timeout: 10000 });

    const nameInput = page.getByRole('textbox', { name: /Full Name/i });
    await expect(nameInput).toBeVisible();
    await nameInput.fill('Updated Name');

    const updateRequest = page.waitForRequest((request) =>
      request.method() === 'PATCH' && request.url().includes('/rest/v1/profiles'),
    );
    await page.getByRole('button', { name: /save changes/i }).click();

    const request = await updateRequest;
    expect(request.postDataJSON()).toMatchObject({ full_name: 'Updated Name' });
  });
});
