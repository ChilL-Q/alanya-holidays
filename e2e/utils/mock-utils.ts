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

// Minimal valid JWT (header.payload.sig) that Supabase JS can decode client-side.
// Signature is fake — Supabase JS does not verify signatures client-side.
// header:  {"alg":"HS256","typ":"JWT"}
// payload: {"sub":"test-user-1","aud":"authenticated","exp":9999999999,"role":"authenticated","email":"test@example.com"}
const MOCK_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' +
  '.eyJzdWIiOiJ0ZXN0LXVzZXItMSIsImF1ZCI6ImF1dGhlbnRpY2F0ZWQiLCJleHAiOjk5OTk5OTk5OTksInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIn0' +
  '.fake_signature_not_verified_client_side';

export const mockSessionResponse = {
  access_token: MOCK_JWT,
  token_type: 'bearer',
  expires_in: 3600,
  refresh_token: 'mock-refresh-token',
  user: mockUser,
};

// Supabase project ref from VITE_SUPABASE_URL
const SUPABASE_STORAGE_KEY = 'sb-mdmizeyiyebvhkujjyjg-auth-token';

/**
 * Seeds a valid Supabase session into localStorage BEFORE page load.
 * Use this for tests that require the user to already be authenticated
 * (e.g. protected routes like /checkout, /profile).
 * Do NOT use for login-flow tests — it will make the user already logged in.
 */
export async function seedAuthSession(page: Page) {
  await page.addInitScript(({ storageKey, session }) => {
    localStorage.setItem(storageKey, JSON.stringify({
      access_token: session.access_token,
      token_type: session.token_type,
      expires_in: session.expires_in,
      refresh_token: session.refresh_token,
      user: session.user,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    }));
  }, { storageKey: SUPABASE_STORAGE_KEY, session: mockSessionResponse });
}

/**
 * Intercepts Supabase auth HTTP endpoints.
 * Use for login/signup flow tests where the user starts unauthenticated.
 */
export async function setupAuthMocks(page: Page) {
  // HTTP intercepts for session refresh / login / user info
  // Note: patterns must end with ** to also match query strings like ?grant_type=password
  await page.route('**/auth/v1/session**', async (route) => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify({ data: { session: mockSessionResponse }, error: null }),
      headers: { 'Content-Type': 'application/json' },
    });
  });

  await page.route('**/auth/v1/token**', async (route) => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify(mockSessionResponse),
      headers: { 'Content-Type': 'application/json' },
    });
  });

  await page.route('**/auth/v1/user**', async (route) => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify(mockUser),
      headers: { 'Content-Type': 'application/json' },
    });
  });
}

/** Mock Supabase REST API calls */
export async function mockSupabaseRest(page: Page) {
  // AuthContext calls profiles.select().eq().single() — expects single JSON object
  // when Accept: application/vnd.pgrst.object+json header is present.
  // Return single object (not array) to satisfy .single().
  await page.route('**/rest/v1/profiles*', async (route) => {
    const accept = route.request().headers()['accept'] || '';
    const isSingle = accept.includes('pgrst.object');
    const profile = {
      id: mockUser.id,
      full_name: 'Test User',
      email: 'test@example.com',
      role: 'guest',
      created_at: '2024-01-01T00:00:00Z',
    };
    await route.fulfill({
      status: 200,
      body: JSON.stringify(isSingle ? profile : [profile]),
      headers: { 'Content-Type': 'application/json' },
    });
  });

  // Suppress notification fetches so they don't cause errors
  await page.route('**/rest/v1/notifications*', async (route) => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify([]),
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
  await page.route('**/auth/v1/signup**', async (route) => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify({ user: mockUser, session: null }),
      headers: { 'Content-Type': 'application/json' },
    });
  });
}

/** Mock Supabase OTP verification success — also seeds session after verify */
export async function mockVerifyOtp(page: Page) {
  await page.route('**/auth/v1/verify**', async (route) => {
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
  await page.route('**/rest/v1/rpc/get_available_properties*', async (route) => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify([mockProperty]),
      headers: { 'Content-Type': 'application/json' },
    });
  });

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
