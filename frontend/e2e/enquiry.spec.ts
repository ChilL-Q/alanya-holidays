import { expect, test } from '@playwright/test';

const liveVilla = {
  id: 'villa-e2e-live-1',
  title: 'E2E Live Villa',
  type: 'villa',
  location: 'Alanya Center',
  price_per_night: 240,
  currency: 'EUR',
  bedrooms: 2,
  bathrooms: 2,
  max_guests: 4,
  images: ['/images/placeholder-business.svg'],
  amenities: ['wifi'],
  description: 'A live villa fixture for the enquiry flow.',
  status: 'active',
};

test.describe('Villa enquiry flow', () => {
  test.setTimeout(90_000);

  test.beforeEach(async ({ page }) => {
    await page.route('**/api/properties**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [liveVilla], total: 1 }),
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
    await expect(page.getByRole('heading', { name: liveVilla.title, level: 2 })).toBeVisible();

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
      service_type: liveVilla.title,
      message: expect.stringContaining(`Item: ${liveVilla.title}`),
    });
  });
});
