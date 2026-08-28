import { Page } from '@playwright/test';

// Use a valid UUID for user id so Zod uuid() validation passes in service layer
export const MOCK_USER_ID = '00000000-0000-4000-a000-000000000001';

export const mockUser = {
  id: MOCK_USER_ID,
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
// payload: {"sub":"00000000-0000-4000-a000-000000000001","aud":"authenticated","exp":9999999999,"role":"authenticated","email":"test@example.com"}
const MOCK_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' +
  '.eyJzdWIiOiIwMDAwMDAwMC0wMDAwLTQwMDAtYTAwMC0wMDAwMDAwMDAwMDEiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjo5OTk5OTk5OTk5LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSJ9' +
  '.fake_signature_not_verified_client_side';

export const mockSessionResponse = {
  access_token: MOCK_JWT,
  token_type: 'bearer',
  expires_in: 3600,
  refresh_token: 'mock-refresh-token',
  user: mockUser,
};

// Supabase project ref extracted from VITE_SUPABASE_URL
// Must match the key the Supabase client constructs: `sb-{project_ref}-auth-token`
function getSupabaseStorageKey(): string {
  const url = process.env.VITE_SUPABASE_URL || 'https://mdmizeyiyebvhkujjyjg.supabase.co';
  const match = url.match(/https:\/\/([^.]+)\.supabase/);
  const projectRef = match ? match[1] : 'mdmizeyiyebvhkujjyjg';
  return `sb-${projectRef}-auth-token`;
}
const SUPABASE_STORAGE_KEY = getSupabaseStorageKey();

/**
 * Seeds a valid Supabase session into localStorage BEFORE page load.
 * Accepts an optional role ('guest' | 'host' | 'admin') to test role-gated routes.
 */
export async function seedAuthSession(page: Page, options?: { role?: string }) {
  const role = options?.role ?? 'guest';
  await page.addInitScript(({ storageKey, session, userRole }) => {
    const user = {
      ...session.user,
      user_metadata: { ...session.user.user_metadata, role: userRole },
    };
    const sessionData = JSON.stringify({
      access_token: session.access_token,
      token_type: session.token_type,
      expires_in: session.expires_in,
      refresh_token: session.refresh_token,
      user,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    });
    localStorage.setItem(storageKey, sessionData);
    localStorage.setItem('sb-mdmizeyiyebvhkujjyjg-auth-token', sessionData);
  }, { storageKey: SUPABASE_STORAGE_KEY, session: mockSessionResponse, userRole: role });
}

/**
 * Intercepts Supabase auth HTTP endpoints.
 * Use for login/signup flow tests where the user starts unauthenticated.
 */
export async function setupAuthMocks(page: Page) {
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

/** Mock Supabase REST API calls. Pass role to simulate host/admin profile. */
export async function mockSupabaseRest(page: Page, options?: { role?: string }) {
  const role = options?.role ?? 'guest';

  await page.route('**/rest/v1/profiles*', async (route) => {
    const method = route.request().method();
    // Handle profile updates (PATCH) — return success so toast fires
    if (method === 'PATCH') {
      await route.fulfill({
        status: 200,
        body: JSON.stringify([{ id: mockUser.id }]),
        headers: { 'Content-Type': 'application/json' },
      });
      return;
    }
    const accept = route.request().headers()['accept'] || '';
    const isSingle = accept.includes('pgrst.object');
    const profile = {
      id: mockUser.id,
      full_name: 'Test User',
      name: 'Test User',
      email: 'test@example.com',
      role,
      phone: '',
      company_name: '',
      social_links: {},
      created_at: '2024-01-01T00:00:00Z',
    };
    await route.fulfill({
      status: 200,
      body: JSON.stringify(isSingle ? profile : [profile]),
      headers: { 'Content-Type': 'application/json' },
    });
  });

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
  await page.route('**/functions/v1/create-checkout-session**', async (route) => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify({ url: 'https://checkout.stripe.com/mock-session' }),
      headers: { 'Content-Type': 'application/json' },
    });
  });

  await page.route('**/functions/v1/create-subscription-checkout**', async (route) => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify({ url: 'https://checkout.stripe.com/mock-sub-session' }),
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

/** Mock Supabase OTP verification success */
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
  id: '00000000-0000-4000-a000-000000000010',
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
  host_id: '00000000-0000-4000-a000-000000000099',
  status: 'active',
  rating: 4.8,
  reviews_count: 12,
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
    const accept = route.request().headers()['accept'] || '';
    const isSingle = accept.includes('pgrst.object');
    await route.fulfill({
      status: 200,
      body: JSON.stringify(isSingle ? mockProperty : [mockProperty]),
      headers: { 'Content-Type': 'application/json' },
    });
  });

  // PropertyDetails page secondary fetches — must be mocked to avoid Promise.all rejecting
  await page.route('**/rest/v1/property_availability*', async (route) => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify([]),
      headers: { 'Content-Type': 'application/json' },
    });
  });

  await page.route('**/rest/v1/reviews*', async (route) => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify([]),
      headers: { 'Content-Type': 'application/json', 'Content-Range': '*/0' },
    });
  });

  await page.route('**/rest/v1/bookings*', async (route) => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify([]),
      headers: { 'Content-Type': 'application/json' },
    });
  });
}

/** Mock blog posts and submissions */
export async function mockBlogData(page: Page) {
  const mockPost = {
    id: 'post-1',
    title: 'Top Places in Alanya',
    slug: 'top-places-alanya',
    excerpt: 'Discover the best spots in Alanya.',
    content: '<p>Alanya is a beautiful city.</p>',
    status: 'published',
    author_id: mockUser.id,
    created_at: '2024-01-01T00:00:00Z',
    published_at: '2024-01-01T00:00:00Z',
    tags: [],
  };

  await page.route('**/api/blog/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    let body: unknown;

    if (request.method() === 'POST' && path.endsWith('/blog/submissions')) {
      body = { submissionId: 'sub-1' };
    } else if (path.endsWith('/blog/tags')) {
      body = [{ id: '11111111-1111-4111-8111-111111111111', name: 'Essential', slug: 'essential' }];
    } else if (path.endsWith('/blog/posts')) {
      body = { data: [mockPost], total: 1 };
    } else if (/\/blog\/post\/[^/]+$/.test(path)) {
      body = mockPost;
    } else if (/\/blog\/posts\/[^/]+\/comments$/.test(path)) {
      body = [];
    } else {
      body = [];
    }

    await route.fulfill({
      status: request.method() === 'POST' ? 201 : 200,
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });
  });
}

/** Mock directory listings and voting RPC */
export async function mockDirectoryData(page: Page) {
  const mockListing = {
    id: 'dir-1',
    name: 'Bosphorus Restaurant',
    description: 'Great Turkish food in Alanya.',
    category_id: 'restaurants',
    is_premium: false,
    net_votes: 5,
    phone: '+90 555 000 0000',
    address: 'Alanya, Turkey',
    images: [],
    created_at: '2024-01-01T00:00:00Z',
  };

  await page.route('**/rest/v1/directory_listings*', async (route) => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify([mockListing]),
      headers: { 'Content-Type': 'application/json' },
    });
  });

  // The directory service uses vote_listing RPC (not upvote/downvote separately)
  await page.route('**/rest/v1/rpc/vote_listing**', async (route) => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify(true),
      headers: { 'Content-Type': 'application/json' },
    });
  });

  await page.route('**/rest/v1/rpc/remove_listing_vote**', async (route) => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify(true),
      headers: { 'Content-Type': 'application/json' },
    });
  });

  await page.route('**/rest/v1/rpc/get_user_votes_batch**', async (route) => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify([]),
      headers: { 'Content-Type': 'application/json' },
    });
  });
}

/** Mock favorites endpoint */
export async function mockFavoritesData(page: Page) {
  await page.route('**/rest/v1/favorites*', async (route) => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify([]),
      headers: { 'Content-Type': 'application/json' },
    });
  });
}

/** Mock AI proxy Edge Function */
export async function mockAIProxy(page: Page) {
  await page.route('**/functions/v1/ai-proxy**', async (route) => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify({
        text: 'Alanya has beautiful beaches like Cleopatra Beach. You can also visit the Alanya Castle for amazing views.',
      }),
      headers: { 'Content-Type': 'application/json' },
    });
  });
}

/** Seed cart into localStorage before any JS runs */
export async function seedCartAndWait(page: Page, cart: any[]) {
  await page.addInitScript((cartData) => {
    localStorage.setItem('alanya_cart', JSON.stringify(cartData));
  }, cart);
}

/**
 * Catch-all mock for ALL Supabase requests that aren't already intercepted
 * by more specific route handlers. Prevents "Failed to fetch" errors in CI.
 * MUST be called AFTER specific mocks (Playwright matches routes in registration order,
 * but falls through if the first handler calls route.fallback()).
 *
 * Instead, we register this as a catch-all that returns safe empty responses.
 */
export async function mockAllSupabaseRequests(page: Page) {
  // Catch-all for REST API (returns empty array)
  await page.route('**/rest/v1/**', async (route) => {
    const accept = route.request().headers()['accept'] || '';
    const isSingle = accept.includes('pgrst.object');
    const method = route.request().method();
    if (method === 'POST' || method === 'PATCH' || method === 'PUT' || method === 'DELETE') {
      await route.fulfill({ status: 200, body: '[]', headers: { 'Content-Type': 'application/json' } });
    } else {
      await route.fulfill({
        status: 200,
        body: isSingle ? '{}' : '[]',
        headers: { 'Content-Type': 'application/json' },
      });
    }
  });

  // Catch-all for Edge Functions
  await page.route('**/functions/v1/**', async (route) => {
    await route.fulfill({ status: 200, body: '{}', headers: { 'Content-Type': 'application/json' } });
  });

  // Catch-all for Supabase realtime
  await page.route('**/realtime/**', async (route) => {
    await route.abort('connectionrefused');
  });

  // Catch-all for NestJS backend /api endpoints (prevents ECONNREFUSED when backend is not running in E2E)
  await page.route('**/api/**', async (route) => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify([]),
      headers: { 'Content-Type': 'application/json' },
    });
  });
}
