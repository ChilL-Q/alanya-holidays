import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const syncSource = readFileSync(
  resolve(process.cwd(), "scripts/sync-google-reviews.ts"),
  "utf8",
);
const migrationSource = readFileSync(
  resolve(
    process.cwd(),
    "../supabase/migrations/20260901000000_separate_google_rating_provenance.sql",
  ),
  "utf8",
);

describe("Google rating provenance storage contract", () => {
  it("keeps the Google sync out of community aggregate columns", () => {
    expect(syncSource).toContain("google_rating");
    expect(syncSource).toContain("google_review_count");
    expect(syncSource).not.toMatch(/\.update\(\{[\s\S]*?reviews_average\s*:/);
    expect(syncSource).not.toMatch(/\.update\(\{[\s\S]*?reviews_count\s*:/);
  });

  it("does not infer Google provenance from legacy community aggregate fields", () => {
    expect(migrationSource).toMatch(/ADD COLUMN IF NOT EXISTS google_rating/i);
    expect(migrationSource).toMatch(/ADD COLUMN IF NOT EXISTS google_review_count/i);
    expect(migrationSource).not.toMatch(/google_place_id/i);
    expect(migrationSource).not.toMatch(/UPDATE\s+public\.directory_listings/i);
    expect(migrationSource).not.toMatch(/google_rating\s*=\s*[^,;]*reviews_average/i);
    expect(migrationSource).not.toMatch(/google_review_count\s*=\s*[^,;]*reviews_count/i);
  });

  it("constrains Google values without changing community aggregates", () => {
    expect(migrationSource).toMatch(/google_rating[\s\S]*BETWEEN 0 AND 5/i);
    expect(migrationSource).toMatch(/google_review_count[\s\S]*>= 0/i);
    expect(migrationSource).not.toMatch(/SET\s+reviews_(?:average|count)\s*=/i);
  });
});
