# Test and release evidence

This file records the checks that currently protect the launchable product. It deliberately does
not publish hard-coded suite or test counts, because those become stale as soon as coverage changes.

## Launch scope

The current release is frontend-led. Its supported public flows are navigation, authentication,
community/member pages, events, directory, shop/cart checkout, trip planner, curated luxury
catalogues, and concierge enquiries. Luxury requests end at an enquiry confirmation; direct guest
accommodation booking and payment remain dormant. Backend modules for those future workflows stay
in the repository but are not advertised as launched functionality.

## Required gates

Run from the repository root:

```bash
pnpm type-check
pnpm lint
pnpm --filter @alanya-holidays/frontend test --run
pnpm --filter @alanya-holidays/backend test
pnpm build
```

The frontend smoke suite is the exact list in `.github/workflows/e2e-smoke.yml`. It covers the home
page, navigation, authentication, gift checkout, and a mocked end-to-end villa enquiry. The smoke
suite must not refer to dormant booking specs or silently rely on missing files.

## Evidence policy

- A gate is green only when its command exits successfully in the current revision.
- Mocked browser tests prove frontend contracts and transitions, not production integrations.
- Real database, Stripe, email, deployment, and observability checks must be reported separately.
- Skipped or unavailable checks are named in the release handoff; they are never counted as passed.
