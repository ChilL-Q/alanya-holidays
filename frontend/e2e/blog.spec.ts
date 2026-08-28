import { test, expect } from '@playwright/test';
import { seedAuthSession, mockSupabaseRest, mockBlogData } from './utils/mock-utils';

test.describe('Blog flow', () => {
  test('redirects an unauthenticated user from the submission page', async ({ page }) => {
    await page.goto('/blog/submit');

    await expect(page).toHaveURL('/login');
  });

  test('submits a complete blog post for review', async ({ page }) => {
    await seedAuthSession(page);
    await mockSupabaseRest(page);
    await mockBlogData(page);
    await page.goto('/blog/submit');

    await expect(page.getByRole('heading', { name: 'Submit Blog Post' })).toBeVisible();
    await page.getByPlaceholder('e.g., Hidden Gems in Alanya Old Town').fill('A Local Guide to Alanya');
    await page
      .getByPlaceholder('Write your blog post content here. Share your experiences, tips, and recommendations...')
      .fill('A detailed local guide with practical recommendations for first-time visitors.');

    const submissionRequest = page.waitForRequest(
      (request) => request.method() === 'POST' && request.url().includes('/api/blog/submissions'),
    );
    await page.getByRole('button', { name: 'Submit Post' }).click();

    const request = await submissionRequest;
    expect(request.postDataJSON()).toMatchObject({
      title: 'A Local Guide to Alanya',
      content: 'A detailed local guide with practical recommendations for first-time visitors.',
      category: 'Guides',
      tags: [],
    });
    await expect(page.getByRole('heading', { name: 'Post Submitted for Review!' })).toBeVisible();
  });

  test('renders the mocked post in the blog listing', async ({ page }) => {
    await mockBlogData(page);
    await page.goto('/blog');

    await expect(page.getByRole('heading', { name: 'Travel Blog' })).toBeVisible();
    const postLink = page.getByRole('link', { name: /Top Places in Alanya/ });
    await expect(postLink).toBeVisible();
    await expect(postLink).toContainText('Discover the best spots in Alanya.');
  });

  test('opens a blog post by slug and renders its content', async ({ page }) => {
    await mockBlogData(page);
    await page.goto('/blog/top-places-alanya');

    await expect(page.getByRole('heading', { name: 'Top Places in Alanya', level: 1 })).toBeVisible();
    await expect(page.getByText('Alanya is a beautiful city.')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Post Not Found' })).not.toBeVisible();
  });
});
