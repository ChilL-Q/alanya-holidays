import { Page } from '@playwright/test';

export const mockUser = {
  id: 'test-user-1',
  email: 'test@example.com',
  created_at: '2024-01-01T00:00:00Z',
  aud: 'authenticated',
  role: 'authenticated',
  user_metadata: { full_name: 'Test User', role: 'guest' },
  app_metadata: {},
};

export const mockSessionResponse = {
  access_token: 'mock-access-token',
  token_type: 'bearer',
  expires_in: 3600,
  refresh_token: 'mock-refresh-token',
  user: mockUser,
};

/** Setup full auth mock for Supabase auth flow */
export async function setupAuthMocks(page: Page) {
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

/** Mock Supabase REST API calls */
export async function mockSupabaseRest(page: Page) {
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

/** Mock Stripe Checkout Session creation */
export async function mockStripePayment(page: Page) {
  await page.route('**/functions/v1/create-checkout-session', async (route) => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify({ url: 'https://checkout.stripe.com/mock-session' }),
      headers: { 'Content-Type': 'application/json' },
    });
  });
}

/** Mock Supabase signup success */
export async function mockSignup(page: Page) {
  await page.route('**/auth/v1/signup', async (route) => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify({ user: mockUser, session: null }),
      headers: { 'Content-Type': 'application/json' },
    });
  });
}

/** Mock Supabase OTP verification success */
export async function mockVerifyOtp(page: Page) {
  await page.route('**/auth/v1/verify', async (route) => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify(mockSessionResponse),
      headers: { 'Content-Type': 'application/json' },
    });
  });
}

export const mockProperty = {
  id: 'prop-1',
  title: 'Luxury Villa Alanya',
  description: 'A beautiful villa with sea view',
  price_per_night: 100,
  cleaning_fee: 50,
  images: ['/images/villa1.jpg'],
  location_area: 'Mahmutlar',
  max_guests: 4,
  bedrooms: 2,
  beds: 2,
  bathrooms: 2,
  amenities: ['wifi', 'pool', 'ac'],
  host_id: 'host-1',
  created_at: '2024-01-01T00:00:00Z',
};

/** Mock Supabase REST API calls for properties */
export async function mockPropertyData(page: Page) {
  // RPC for searching available properties
  await page.route('**/rest/v1/rpc/get_available_properties*', async (route) => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify([mockProperty]),
      headers: { 'Content-Type': 'application/json' },
    });
  });

  // REST fetch for single property or list
  await page.route('**/rest/v1/properties*', async (route) => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify([mockProperty]),
      headers: { 'Content-Type': 'application/json' },
    });
  });
}

/** Seed cart into localStorage before any JS runs */
export async function seedCartAndWait(page: Page, cart: any[]) {
  await page.addInitScript((cartData) => {
    localStorage.setItem('cart', JSON.stringify(cartData));
  }, cart);
}
