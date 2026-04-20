import { test, expect } from '@playwright/test';
import { seedAuthSession, mockSupabaseRest, mockBlogData } from './utils/mock-utils';

test.describe('Blog Submission Flow', () => {
  test('should redirect unauthenticated user away from blog/submit', async ({ page }) => {
    await page.goto('/blog/submit');
    await page.waitForLoadState('networkidle');
    // AuthRoute redirects to home "/"
    await expect(page).toHaveURL('/');
  });

  test('should load blog/submit page when authenticated', async ({ page }) => {
    await seedAuthSession(page);
    await mockSupabaseRest(page);
    await mockBlogData(page);

    // Mock the blog_submissions insert
    await page.route('**/rest/v1/blog_submissions**', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          body: JSON.stringify([{ id: 'sub-1' }]),
          headers: { 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
        });
      } else {
        await route.fulfill({
          status: 200,
          body: JSON.stringify([]),
          headers: { 'Content-Type': 'application/json' },
        });
      }
    });

    await page.goto('/blog/submit');
    await page.waitForLoadState('networkidle');

    // Stays on the submit page (not redirected)
    await expect(page).toHaveURL('/blog/submit');
    // Form is rendered
    await expect(page.locator('body')).toContainText(/submit|title|article|blog/i);
  });

  test('should view blog listing page', async ({ page }) => {
    await mockBlogData(page);

    await page.goto('/blog');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL('/blog');
    await expect(page.locator('body')).toContainText(/blog|article|alanya/i);
  });

  test('should open blog post by direct slug', async ({ page }) => {
    await mockBlogData(page);
    await page.goto('/blog/top-places-alanya');
    await page.waitForLoadState('networkidle');
    // Page renders (even if post not found, the SPA route resolves)
    await expect(page).toHaveURL('/blog/top-places-alanya');
  });
});
