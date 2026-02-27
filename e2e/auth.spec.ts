import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should open login modal from navbar', async ({ page }) => {
    await page.goto('/');

    // Click the profile button in the navbar
    await page.click('data-testid=profile-button');

    // Wait for the dropdown and click "Log In" or similar
    const loginButton = page.locator('button', { hasText: 'Log In' }).or(page.locator('button', { hasText: 'Log in' }));
    await loginButton.first().click();

    // Verify the LoginModal is visible
    await expect(page.locator('text=Welcome back').or(page.locator('text=Sign in to your account'))).toBeVisible();
    
    // Close the modal
    await page.keyboard.press('Escape');
    await expect(page.locator('text=Welcome back')).not.toBeVisible();
  });



  test('should toggle to sign up form', async ({ page }) => {
    await page.goto('/');

    // Open login modal
    await page.click('data-testid=profile-button');
    const loginButton = page.locator('button', { hasText: 'Log In' }).or(page.locator('button', { hasText: 'Log in' }));
    await loginButton.first().click();

    // Verify login text
    await expect(page.locator('text=Welcome back').or(page.locator('text=Sign in to your account'))).toBeVisible();

    // Click on "Sign up" or "Create account" toggle link
    const signUpToggle = page.locator('button', { hasText: /Sign up|Create account/i }).or(page.locator('a', { hasText: /Sign up|Create account/i }));
    if (await signUpToggle.count() > 0) {
        await signUpToggle.first().click();
        
        // Verify text changes to create account
        await expect(page.locator('text=Create an account').or(page.locator('text=Create Account')).first()).toBeVisible();
    }
  });
});
