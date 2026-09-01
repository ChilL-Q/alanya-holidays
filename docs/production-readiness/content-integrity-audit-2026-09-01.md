# Production Content Integrity Audit — 2026-09-01

Version: 1.1

Scope: public directory, villas, yachts, concierge experiences, events, products, forum content, and exact authorized forum cleanup

Mode: read-only production inspection; no deployment, migration, schema change, or uncertain deletion

## Method and limits

- Inspected the public Garenta business detail DOM and the exact forum topic route.
- Queried only the production rows and table fields needed to validate counts, status, suspicious terms, and the exact authorized topic relationship.
- Searched case-insensitively for `test`, `demo`, `lorem`, `asdf`, `фыва`, and `placeholder` in relevant public content fields. Fake or unverified ratings cannot be established from wording alone, so the audit records provenance gaps instead of classifying uncertain records as fake.
- Profile results are reported only as aggregate role counts. Raw authentication metadata and full email addresses were not enumerated.
- No production records were changed.

## Findings and actions

### Directory ratings

The Garenta listing `39503638-0dc6-43ef-87d7-abbff140b318` is approved and stores `reviews_average = 5` and `reviews_count = 770`. The Google review sync writes Google Text Search values into those existing columns. The public DTO previously exposed them as generic `rating` and `reviewCount`, while the detail page labeled them as undifferentiated reviews. The same page separately loads Alanya Holidays community reviews, producing the observed contradiction: `5 (770 reviews)` above and `0 reviews / 0.0 / No reviews yet` below.

Presentation and storage action: an additive migration introduces nullable, constrained `google_rating` and `google_review_count` columns. It does not backfill them because the legacy rows have no durable Google provenance. The Google sync and public DTO read and write only the new columns. The existing `reviews_average` and `reviews_count` columns remain owned by the approved-community-review aggregation trigger. After the authorized Google resync, the detail page renders `Google rating: 5.0 · 770 Google reviews` only when both Google values are present, and independently labels the community section `Alanya Holidays reviews`; with no community rows it renders `No community reviews yet` and does not display a synthetic `0.0` score. No count is copied between sources in application code.

The production directory contains 97 listings. A full rating-source policy remains necessary before other generic directory surfaces can make an Alanya Holidays endorsement from the community aggregate columns. This slice does not alter the home-card surface owned elsewhere.

### Google rating migration rollout and rollback

The migration has not been applied to production. Rollout order is data-preserving:

1. Apply `20260901000000_separate_google_rating_provenance.sql`. It only adds nullable columns and checks. It does not change the community trigger, delete rows, read nonexistent provenance metadata, or write `reviews_average`/`reviews_count`.
2. Confirm that existing rows retain `NULL` in both new columns. All legacy rating rows are deliberately treated as ambiguous.
3. Deploy the application and Google sync changes together after the columns exist.
4. Run the authorized Google review sync after deployment. This is the only supported population path for the new fields and does not touch community aggregates.
5. Verify Garenta and a sample containing approved community reviews before treating the rollout as complete. Before the resync succeeds, the public detail page will honestly report that the Google rating is unavailable.

For application rollback, stop the Google sync first and deploy the previous application while leaving the additive columns in place; this preserves all newly synced Google data. A database rollback should not drop the columns until their values have been exported and the need for forward recovery has passed. The community aggregate columns require no restoration because the migration never changes them.

### Villas, yachts, and concierge experiences

The production tables contain 3 properties and 39 services. Public repositories restrict their lists to approved records, but the frontend previously replaced empty or failed live responses with curated villa, yacht, jet, helicopter, tasting, spa, photography, golf, chef, driver, and shopper arrays. Those arrays included positive ratings, review counts, prices, and availability-like presentation, so demo inventory could appear indistinguishable from live approved inventory.

Presentation action:

- Live empty responses remain empty and live failures remain errors; curated records are no longer published as fallback inventory.
- A property with no rating maps to `0`, not `5.0`; the villa presentation does not invent bedrooms, guests, price, pool, amenities, rating, review count, stay length, or beach distance.
- Result counts say `listing` rather than `available`.
- Public offer pages state that only approved listings are shown and that availability and exact pricing are confirmed after enquiry.
- Villa prices and ratings are displayed only when their authoritative fields contain positive values.

No new availability status was introduced because `approved` is moderation status, not calendar availability. No migration or schema/API route change was needed.

### Events

Three production forum events were found, all published and dated 20, 25, and 28 June 2026. They are past as of this audit, so the existing public upcoming-only query returns no current events. The suspicious-term scan found no match in the inspected event title/description/location fields. The events empty-state presentation is outside this slice and was not changed.

### Products

Eleven production product items were found and all were active. The suspicious-term scan found no match in the inspected product names or descriptions. Public detail retrieval now refuses an explicitly `draft` or `inactive` response so a direct item URL cannot publish a non-active product through the frozen API.

Two active art descriptions contain US-dollar ranges while their authoritative product price and currency fields are in euros:

- Hagia Sofia Print: product price `150 EUR`; description includes a `$150–$1,500` range.
- Pigeons in Alanya Print: product price `100 EUR`; description includes a `$100–$1,000` range.

These rows need owner/editor confirmation and a content correction. The audit did not rewrite them or reinterpret an orderable product price as a range.

### Forum and profiles

The suspicious-term scan found no exact match in the inspected 138 forum posts or 16 forum comments. Their migration-seeded style is not sufficient evidence that they are invalid production content; no deletion was attempted.

The server-filtered public profile scan found 22 profiles with test-like names or email patterns: 16 guests, 3 hosts, and 3 admins. These may be QA or operational accounts. Because their ownership, access use, and recovery requirements are uncertain, none were modified or deleted. An authorized account-owner/security review is required, especially for the three admin-role profiles.

Two production community review rows exist. The available public review fields do not record an external provenance source or verification decision, and wording inspection alone cannot establish authenticity. They remain untouched pending a moderation policy review.

## Exact authorized forum cleanup

Authorized target: forum topic `4cef7861-cb6e-4d7f-bf24-2a97eade5adc`, its test replies, and its cache only.

- The public route renders the not-found state without console errors.
- The exact `forum_posts.id` query returned zero rows.
- The exact `forum_comments.post_id` query returned zero rows.
- Current forum application code has no forum post cache key or invalidation mechanism to target.

Because the exact post and its replies were already absent, no deletion was issued. No recovery or cascade operation was triggered. Issuing another delete or an improvised cache/database command would not have made the result safer.

## Follow-up decisions requiring owners

1. Review and correct the two EUR/USD product-description conflicts.
2. Review the 22 test-like profiles through the account-owner/security process; do not bulk-delete based on names.
3. Establish a moderation/provenance policy for community review verification before labeling ratings as verified or fake.
