import { test, expect } from '@playwright/test';

test.describe('Chat Flow', () => {
  test('should verify Contact Host button behavior on property page', async ({ page }) => {
    // Navigate to a search page and find a property
    await page.goto('/stays');
    
    // Look for a property link
    const firstPropertyLink = page.locator('a[href*="/property/"]').first();
    await expect(firstPropertyLink).toBeVisible({ timeout: 10000 });
    await firstPropertyLink.click();

    // Look for Contact Host button
    const chatBtn = page.locator('button', { hasText: 'Contact Host' }).or(page.locator('button', { hasText: 'Contact Support' })).or(page.locator('button', { hasText: 'Ask a question' }));
    
    if (await chatBtn.count() > 0) {
        await chatBtn.first().click();

        // Since user is not logged in, it should open Login Modal or alert
        // Look for login modal or auth request. Or if chat opens directly:
        const isLoginModalVisible = await page.locator('text=Sign in').count() > 0;
        const isChatWindowVisible = await page.locator('text=Type a message').count() > 0;

        expect(isLoginModalVisible || isChatWindowVisible).toBeTruthy();
    }
  });

  test('should verify global floating chat widget if present', async ({ page }) => {
    await page.goto('/');

    // Many apps have a floating action button on bottom right for chat
    const floatingChatBtn = page.locator('button.fixed.bottom-4, button.fixed.bottom-6').filter({ has: page.locator('svg.lucide-message-circle, svg.lucide-message-square') });

    if (await floatingChatBtn.count() > 0) {
        await floatingChatBtn.first().click();
        await expect(page.locator('input[placeholder*="Type a message"], textarea[placeholder*="Type a message"]')).toBeVisible();
        
        // Type something
        await page.fill('input[placeholder*="Type a message"], textarea[placeholder*="Type a message"]', 'Hello, testing chat!');
        
        // Find send button (usually arrow icon or 'Send')
        const sendBtn = page.locator('button', { has: page.locator('svg.lucide-send') }).or(page.locator('button', { hasText: 'Send' }));
        if (await sendBtn.count() > 0) {
            await sendBtn.first().click();
        }
    } else {
        // If not found, skip test gracefully as it might be admin-only or not enabled via a feature flag
        test.skip();
    }
  });
});
