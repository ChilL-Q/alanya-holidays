import { test, expect } from '@playwright/test';

const seedCart = [
  {
    id: 'checkout-test-1',
    type: 'RENTAL',
    title: 'Seaside Villa Alanya',
    price: 450,
    image: '/images/villa-test.jpg',
    startDate: '2026-08-01',
    endDate: '2026-08-08',
    guests: 4,
    nights: 7,
    pricePerNight: 60,
    cleaningFee: 30,
  }
];

const mockUser = {
  id: 'test-user-1',
  email: 'test@example.com',
  created_at: '2024-01-01T00:00:00Z',
  aud: 'authenticated',
  role: 'authenticated',
  user_metadata: { full_name: 'Test User', role: 'guest' },
  app_metadata: {},
};

const mockSessionResponse = {
  access_token: 'mock-access-token',
  token_type: 'bearer',
  expires_in: 3600,
  refresh_token: 'mock-refresh-token',
  user: mockUser,
};

/** Setup full auth mock for Supabase auth flow */
async function setupAuthMocks(page) {
  // getSession (called on mount)
  await page.route('**/auth/v1/session', async (route) => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify({ data: { session: mockSessionResponse }, error: null }),
      headers: { 'Content-Type': 'application/json' },
    });
  });

  // token (login endpoint)
  await page.route('**/auth/v1/token', async (route) => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify(mockSessionResponse),
      headers: { 'Content-Type': 'application/json' },
    });
  });

  // user (current user info)
  await page.route('**/auth/v1/user', async (route) => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify(mockUser),
      headers: { 'Content-Type': 'application/json' },
    });
  });
}

/** Seed cart into localStorage before any JS runs */
async function seedCartAndWait(page) {
  page.addInitScript((cart) => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, seedCart);
}

/** Mock Supabase REST API calls */
async function mockSupabaseRest(page) {
  // Profile fetch
  await page.route('**/rest/v1/profiles*', async (route) => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify([{
        id: mockUser.id,
        full_name: 'Test User',
        email: 'test@example.com',
        role: 'guest',
        created_at: '2024-01-01T00:00:00Z',
      }]),
      headers: { 'Content-Type': 'application/json' },
    });
  });
}

test.describe('Stripe Checkout Flow', () => {

  test('should render checkout page with cart items', async ({ page }) => {
    await setupAuthMocks(page);
    await mockSupabaseRest(page);
    await seedCartAndWait(page);

    await page.goto('/checkout');
    await page.waitForLoadState('networkidle', { timeout: 15000 });

    const text = await page.locator('body').innerText();
    expect(text).toContain('Seaside Villa Alanya');
  });

  test('should show empty cart state', async ({ page }) => {
    await setupAuthMocks(page);
    await mockSupabaseRest(page);
    // No cart seeded

    await page.goto('/checkout');
    await page.waitForLoadState('networkidle', { timeout: 15000 });

    const text = await page.locator('body').innerText();
    expect(text).toMatch(/empty|пуст/i);
  });

  test('should display order summary total', async ({ page }) => {
    await setupAuthMocks(page);
    await mockSupabaseRest(page);
    await seedCartAndWait(page);

    await page.goto('/checkout');
    await page.waitForLoadState('networkidle', { timeout: 15000 });

    const text = await page.locator('body').innerText();
    // Cart item + some price info should be visible
    expect(text).toContain('Seaside Villa Alanya');
    expect(text).toMatch(/450|total|Total/i);
  });
});
