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

  test('should navigate to settings tab and render personal info form', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');

    // Settings tab button in ProfileSidebar
    const settingsTab = page.getByRole('button', { name: /^settings$/i });
    await expect(settingsTab).toBeVisible({ timeout: 10000 });
    await settingsTab.click();

    // Settings form heading
    await expect(page.locator('body')).toContainText(/Personal Information/i, { timeout: 5000 });

    // First text input in the form is the name field
    const nameInput = page.locator('form input[type="text"]').first();
    await expect(nameInput).toBeVisible({ timeout: 5000 });
    await nameInput.fill('Updated Name');

    // Save Changes button (locale key: profile.save = "Save Changes")
    await page.getByRole('button', { name: /save changes/i }).click();

    // Toast success (locale key: profile.save_success = "Profile updated successfully")
    await expect(page.locator('body')).toContainText(/Profile updated successfully/i, { timeout: 8000 });
  });
});
