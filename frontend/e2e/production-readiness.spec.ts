import { expect, test, type Page } from '@playwright/test';

const BUSINESS_ID = '39503638-0dc6-43ef-87d7-abbff140b318';

test.setTimeout(90_000);

async function mockObjectiveApis(page: Page) {
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;

    if (path === `/api/directory/${BUSINESS_ID}`) {
      await route.fulfill({
        json: {
          id: BUSINESS_ID,
          name: 'Garenta Alanya',
          category: 'car-rental',
          subcategory: 'Car rental',
          description: 'Local car rental listing.',
          address: 'Alanya, Antalya',
          phone: '+90 242 000 00 00',
          email: 'info@example.invalid',
          website: 'https://example.invalid',
          google_rating: 5,
          google_review_count: 770,
          reviews_average: 0,
          reviews_count: 0,
          gallery: ['/images/placeholder-business.svg'],
          price_level: 2,
          status: 'approved',
        },
      });
      return;
    }

    if (path === `/api/reviews/listing/${BUSINESS_ID}`) {
      await route.fulfill({ json: { data: [], count: 0 } });
      return;
    }

    if (path === '/api/directory') {
      await route.fulfill({ json: { data: [], pagination: { total: 0, totalPages: 1 } } });
      return;
    }

    if (path === '/api/properties') {
      await route.fulfill({ json: { data: [], total: 0 } });
      return;
    }

    if (path === '/api/services') {
      await route.fulfill({ json: { data: [], count: 0 } });
      return;
    }

    if (path === '/api/products/catalog') {
      await route.fulfill({
        json: {
          products: [
            {
              id: 101,
              name: 'Active Alanya Postcard',
              description: 'A live catalog item.',
              price: 4.5,
              currency: 'EUR',
              stock: 12,
              status: 'active',
              media: [{ url: '/images/placeholder-business.svg', type: 'image' }],
              category_id: 1,
              product_categories: { id: 1, name: 'Travel Essentials' },
            },
          ],
          categories: [{ id: 1, name: 'Travel Essentials' }],
        },
      });
      return;
    }

    await route.fulfill({ json: [] });
  });
}

async function expectResponsiveMain(page: Page) {
  await expect(page.locator('main')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1))
    .toBe(true);

  const unnamedMainButtons = await page.locator('main button').evaluateAll((buttons) =>
    buttons.filter((button) => {
      const accessibleName =
        button.getAttribute('aria-label') ||
        button.getAttribute('title') ||
        button.textContent ||
        '';
      return accessibleName.trim().length === 0;
    }).length,
  );
  expect(unnamedMainButtons).toBe(0);
}

test.beforeEach(async ({ page }) => {
  await mockObjectiveApis(page);
});

test('business detail separates Google provenance from community reviews', async ({ page }) => {
  await page.goto(`/business/${BUSINESS_ID}`, { waitUntil: 'domcontentloaded' });

  await expect(page.getByText('Google rating: 5.0 · 770 Google reviews')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Alanya Holidays reviews' })).toBeVisible();
  await expect(page.getByText('No community reviews yet')).toBeVisible();
  await expect(page.getByText('(770 reviews)')).toHaveCount(0);
  await expectResponsiveMain(page);
});

test('live offer pages do not replace empty APIs with demo inventory', async ({ page }) => {
  await page.goto('/villa-stays', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('0 villa listings')).toBeVisible();
  await expect(page.getByText('Only approved listings are shown. Availability and exact pricing are confirmed after enquiry.')).toBeVisible();
  await expect(page.getByText('Villa Serenity')).toHaveCount(0);
  await expectResponsiveMain(page);

  await page.goto('/yacht-charters', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('0 yacht listings')).toBeVisible();
  await expect(page.getByText('Aegean Queen')).toHaveCount(0);
  await expectResponsiveMain(page);
});

test('active product catalog remains usable and responsive', async ({ page }) => {
  await page.goto('/shop', { waitUntil: 'domcontentloaded' });

  await expect(page.getByText('Active Alanya Postcard')).toBeVisible();
  await expect(page.getByText('€4.50')).toBeVisible();
  await expectResponsiveMain(page);
});
