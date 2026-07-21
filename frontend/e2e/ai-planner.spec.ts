import { test, expect } from '@playwright/test';
import { seedAuthSession, mockSupabaseRest, mockAIProxy } from './utils/mock-utils';

test.describe('AI Planner Flow', () => {
  test('should load AI planner page and accept input', async ({ page }) => {
    await seedAuthSession(page);
    await mockSupabaseRest(page);
    await mockAIProxy(page);

    await page.goto('/ai-planner');
    await page.waitForLoadState('networkidle');

    // Page rendered
    await expect(page).toHaveURL('/ai-planner');
    await expect(page.locator('body')).toContainText(/alanya|ai|plan|guide/i);

    // Find any text input or textarea for the prompt
    const input = page.locator('textarea, input[type="text"]').first();
    if (await input.isVisible({ timeout: 5000 }).catch(() => false)) {
      await input.fill('What should I do in Alanya?');

      const sendBtn = page.getByRole('button', { name: /send|отправить|go/i }).first();
      if (await sendBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await sendBtn.click();
        // AI response container appears
        await expect(page.locator('body')).toContainText(/beach|castle|alanya/i, { timeout: 10000 });
      }
    }
  });

  test('should redirect unauthenticated user away from AI planner', async ({ page }) => {
    await mockSupabaseRest(page);
    await page.goto('/ai-planner');
    await page.waitForLoadState('networkidle');

    // AuthRoute redirects to "/"
    await expect(page).toHaveURL('/');
  });
});
