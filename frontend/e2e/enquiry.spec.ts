import { expect, test } from '@playwright/test';

test.describe('Villa enquiry flow', () => {
  test.setTimeout(90_000);

  test.beforeEach(async ({ page }) => {
    await page.route('**/api/properties**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [], total: 0 }),
      });
    });
  });

  test('validates and submits an availability request', async ({ page }) => {
    let submittedPayload: Record<string, unknown> | undefined;
    await page.route('**/api/enquiries', async (route) => {
      submittedPayload = route.request().postDataJSON();
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, id: 'enquiry-e2e-1' }),
      });
    });

    await page.goto('/villa-stays');
    await page.getByRole('button', { name: 'View Details' }).first().click();

    const submit = page.getByRole('button', { name: 'Request Availability' });
    await submit.click();
    await expect(page.getByPlaceholder('Your full name')).toBeFocused();

    await page.getByPlaceholder('Your full name').fill('Launch Guest');
    await page.getByPlaceholder('Your email address').fill('guest@example.com');
    await page.getByPlaceholder(/Preferred dates/).fill('10–14 September, two guests');
    await submit.click();

    await expect(page).toHaveURL('/booking-confirmation');
    await expect(page.getByRole('heading', { name: /Villa Stay enquiry/i })).toBeVisible();
    await expect(page.getByText('Request recorded')).toBeVisible();
    await expect(page.getByText('Confirmation sent')).toHaveCount(0);
    expect(submittedPayload).toMatchObject({
      name: 'Launch Guest',
      email: 'guest@example.com',
      enquiry_type: 'Villa Stay',
    });
  });
});
