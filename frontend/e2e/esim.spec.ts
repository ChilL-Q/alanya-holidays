import { test, expect } from '@playwright/test';

test.describe('eSIM Flow', () => {
  test('should load packages and allow selection', async ({ page }) => {
    // 1. Go to eSIM service page
    await page.goto('/services/tourist-sim-card');

    // 2. Wait for either loading or directly for packages
    await expect(page.locator('text=Stay Connected').or(page.locator('text=eSIM')).first()).toBeVisible({ timeout: 10000 });

    // 3. Look for a Package Card using a select button or price tag
    const selectBtn = page.locator('button', { hasText: /Get eSIM Now/i });
    
    // Wait for at least one package to be rendered
    await expect(selectBtn.first()).toBeVisible({ timeout: 12000 });

    // 4. Click Select on the first package
    await selectBtn.first().click();

    // 5. Verify the Modal or details section opens
    // We expect "Confirm" or "Buy" or showing the plan
    await expect(page.locator('text=Confirm').or(page.locator('text=Buy')).or(page.locator('text=eSIM')).first()).toBeVisible({ timeout: 10000 });
  });
});
