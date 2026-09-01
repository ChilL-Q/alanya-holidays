import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import TrustBadge, {
  resolveTrustBadge,
  isTrustBadge,
  TRUST_BADGES,
  TRUST_BADGES_CONFIG,
  type TrustBadgeType,
  type ResolveTrustBadgeInput,
} from "../TrustBadge";

describe("Milestone M1 Challenger Stress Suite: TrustBadge & Evocative Labeling System", () => {
  describe("1. Invariant & Fuzzing Oracle (Never Throws & Always Valid or Null)", () => {
    it("never throws and returns valid TrustBadgeType or null for 2,000 randomized chaotic inputs", () => {
      const chaoticTiers = [undefined, null, "", "signature", "partner", "voyager", "explorer", "VIP_TIER", "invalid", 123, false, {}];
      const chaoticRatings = [undefined, null, NaN, Infinity, -Infinity, -100, -0.01, 0, 0.0, 1.5, 3.99, 4.0, 4.39, 4.4, 4.59, 4.6, 4.69, 4.7, 4.79, 4.8, 4.99, 5.0, 5.01, 100, "4.8", "invalid", "0", "-5"];
      const chaoticReviews = [undefined, null, NaN, Infinity, -Infinity, -100, 0, 9, 10, 14, 15, 29, 30, 99, 100, 1000000, "150", "invalid", "0"];
      const chaoticTags = [
        undefined,
        null,
        [],
        ["Local Favorite"],
        ["hidden gem", "luxury"],
        ["UNKNOWN_TAG", ""],
        [null as unknown as string, undefined as unknown as string],
        "Local Favorite, Luxury",
        JSON.stringify(["Fine Dining", "Authentic"]),
        "{broken json",
        123 as unknown as string[],
      ];
      const chaoticCategories = [undefined, null, "", "restaurants-cafes", "tours-activities", "shopping", "hotels-resorts", "RandomCategory"];
      const chaoticSubcategories = [undefined, null, "", "Turkish Cuisine", "Boat Tours", "Traditional Breakfast", "Café", "Boutique Hotel"];
      const chaoticPriceRanges = [undefined, null, "", "$", "$$", "$$$", "$$$$", "invalid"];
      const chaoticBooleans = [undefined, null, false, true, 0 as unknown as boolean, 1 as unknown as boolean, "true" as unknown as boolean];

      for (let i = 0; i < 2000; i++) {
        const input: ResolveTrustBadgeInput = {
          id: `fuzz-${i}`,
          name: `Fuzz Biz ${i}`,
          tier: chaoticTiers[i % chaoticTiers.length] as string,
          rating: chaoticRatings[i % chaoticRatings.length] as number,
          reviewCount: chaoticReviews[i % chaoticReviews.length] as number,
          tags: chaoticTags[i % chaoticTags.length] as string[],
          category: chaoticCategories[i % chaoticCategories.length],
          subcategory: chaoticSubcategories[i % chaoticSubcategories.length],
          priceRange: chaoticPriceRanges[i % chaoticPriceRanges.length],
          featured: chaoticBooleans[i % chaoticBooleans.length],
          is_verified: chaoticBooleans[(i + 1) % chaoticBooleans.length],
          is_claimed: chaoticBooleans[(i + 2) % chaoticBooleans.length],
          trustBadge: (i % 7 === 0 ? "Signature Collection" : undefined) as TrustBadgeType,
        };

        expect(() => {
          const result = resolveTrustBadge(input);
          if (result !== null) {
            expect(isTrustBadge(result)).toBe(true);
            expect(TRUST_BADGES).toContain(result);
            expect(TRUST_BADGES_CONFIG[result]).toBeDefined();
          }
        }).not.toThrow();
      }
    });

    it("handles primitives and malformed objects without crashing", () => {
      const nonObjects: unknown[] = [
        null,
        undefined,
        0,
        1,
        -1,
        NaN,
        Infinity,
        -Infinity,
        true,
        false,
        "",
        "   ",
        "random string not a badge",
        [],
        [1, 2, 3],
        () => {},
        Symbol("badge"),
        new Date(),
      ];

      for (const item of nonObjects) {
        expect(() => {
          const result = resolveTrustBadge(item as ResolveTrustBadgeInput);
          if (result !== null) {
            expect(isTrustBadge(result)).toBe(true);
          }
        }).not.toThrow();
      }
    });
  });

  describe("2. Boundary Conditions & Numerical Clamping", () => {
    it("handles negative ratings and reviews by treating them as 0 or no qualification", () => {
      expect(resolveTrustBadge({ rating: -5, reviewCount: -100 })).toBeNull();
      expect(resolveTrustBadge({ rating: -1, reviewCount: 1000 })).toBeNull();
    });

    it("clamps ratings > 5 to 5.0 and still qualifies if thresholds met", () => {
      // rating 999 with 200 reviews -> Top Rated Destination Partner
      expect(resolveTrustBadge({ rating: 999, reviewCount: 200 })).toBe("Top Rated Destination Partner");
      // rating 5.5 with $$$ price range -> Signature Collection
      expect(resolveTrustBadge({ rating: 5.5, priceRange: "$$$" })).toBe("Signature Collection");
    });

    it("verifies exact floating point boundary thresholds for statistical metrics", () => {
      // 4.8 + 100 reviews -> Top Rated Partner
      expect(resolveTrustBadge({ rating: 4.8, reviewCount: 100 })).toBe("Top Rated Destination Partner");
      // 4.79 + 100 reviews -> does not qualify for Top Rated Partner, but qualifies for Recommended (4.7+ & 30+)
      expect(resolveTrustBadge({ rating: 4.79, reviewCount: 100 })).toBe("Recommended by Travellers");
      // 4.8 + 99 reviews -> does not qualify for Top Rated Partner (needs 100), but qualifies for Recommended (4.7+ & 30+)
      expect(resolveTrustBadge({ rating: 4.8, reviewCount: 99 })).toBe("Recommended by Travellers");

      // 4.7 + 30 reviews -> Recommended
      expect(resolveTrustBadge({ rating: 4.7, reviewCount: 30 })).toBe("Recommended by Travellers");
      // 4.69 + 30 reviews -> does not qualify for Recommended, but qualifies for Trusted (4.4+ & 10+)
      expect(resolveTrustBadge({ rating: 4.69, reviewCount: 30 })).toBe("Trusted by Travellers");
      // 4.7 + 29 reviews -> does not qualify for Recommended, qualifies for Trusted
      expect(resolveTrustBadge({ rating: 4.7, reviewCount: 29 })).toBe("Trusted by Travellers");

      // 4.4 + 10 reviews -> Trusted
      expect(resolveTrustBadge({ rating: 4.4, reviewCount: 10 })).toBe("Trusted by Travellers");
      // 4.39 + 10 reviews -> null
      expect(resolveTrustBadge({ rating: 4.39, reviewCount: 10 })).toBeNull();
      // 4.4 + 9 reviews -> null
      expect(resolveTrustBadge({ rating: 4.4, reviewCount: 9 })).toBeNull();
    });

    it("handles string numeric inputs with whitespace, decimals, and leading zeros", () => {
      expect(resolveTrustBadge({ rating: " 4.85 " as unknown as number, reviewCount: " 0150 " as unknown as number })).toBe(
        "Top Rated Destination Partner"
      );
      expect(resolveTrustBadge({ rating: "4.70" as unknown as number, reviewCount: "30" as unknown as number })).toBe(
        "Recommended by Travellers"
      );
    });
  });

  describe("3. 7-Stage Cascade Priority Invariants", () => {
    it("Stage 1 (Explicit TrustBadge) overrides all downstream stages", () => {
      const input = {
        trustBadge: "Local Favorite" as TrustBadgeType,
        tier: "signature", // Stage 2 would be Signature Collection
        tags: ["luxury", "fine dining"], // Stage 3 would be Signature Collection
        rating: 5.0, // Stage 4 would be Top Rated Destination Partner
        reviewCount: 500,
        is_verified: true, // Stage 5 would be Verified Experience
        featured: true, // Stage 6 would be Recommended by Travellers
      };
      expect(resolveTrustBadge(input)).toBe("Local Favorite");
    });

    it("Stage 2 (Onboarding Tier) overrides Stage 3 (Tags) and Stage 4 (Metrics)", () => {
      const input = {
        tier: "signature",
        tags: ["local favorite", "hidden gem"],
        rating: 4.9,
        reviewCount: 500,
      };
      expect(resolveTrustBadge(input)).toBe("Signature Collection");
    });

    it("Stage 2 (Partner Tier with rating split) behaves correctly", () => {
      // rating >= 4.5 -> Top Rated Destination Partner
      expect(resolveTrustBadge({ tier: "partner", rating: 4.5 })).toBe("Top Rated Destination Partner");
      expect(resolveTrustBadge({ tier: "partner", rating: 4.49 })).toBe("Curated Experience");
      expect(resolveTrustBadge({ tier: "partner" })).toBe("Curated Experience");
    });

    it("Stage 3 (Tags) overrides Stage 4 (Metrics)", () => {
      const input = {
        tags: ["local favorite"],
        rating: 4.9,
        reviewCount: 250, // would be Top Rated Destination Partner
      };
      expect(resolveTrustBadge(input)).toBe("Local Favorite");
    });

    it("Stage 4 (Metrics) overrides Stage 5 (Verification)", () => {
      const input = {
        rating: 4.9,
        reviewCount: 150,
        is_verified: true, // Stage 5
      };
      expect(resolveTrustBadge(input)).toBe("Top Rated Destination Partner");
    });

    it("Stage 5 (Verification/Claimed) overrides Stage 6 (Legacy Featured)", () => {
      const input = {
        is_verified: true,
        featured: true,
        rating: 4.1,
      };
      expect(resolveTrustBadge(input)).toBe("Verified Experience");

      const claimedInput = {
        is_claimed: true,
        featured: true,
        rating: 3.5,
      };
      expect(resolveTrustBadge(claimedInput)).toBe("Verified Experience");
    });

    it("Stage 6 (Legacy Featured) provides fallback for featured businesses", () => {
      expect(resolveTrustBadge({ featured: true, rating: 4.6 })).toBe("Recommended by Travellers");
      expect(resolveTrustBadge({ featured: true, rating: 4.2 })).toBe("Curated Experience");
      expect(resolveTrustBadge({ is_featured: true, rating: 0 })).toBe("Recommended by Travellers");
    });
  });

  describe("4. String Normalization & Case Insensitivity Edge Cases", () => {
    it("normalizes case and trimmed string inputs for direct strings", () => {
      expect(resolveTrustBadge("  RECOMMENDED BY TRAVELLERS  ")).toBe("Recommended by Travellers");
      expect(resolveTrustBadge("  TRUSTED BY TRAVELLERS  ")).toBe("Trusted by Travellers");
      expect(resolveTrustBadge("  VERIFIED EXPERIENCE  ")).toBe("Verified Experience");
      expect(resolveTrustBadge("  SIGNATURE COLLECTION  ")).toBe("Signature Collection");
      expect(resolveTrustBadge("  TOP RATED DESTINATION PARTNER  ")).toBe("Top Rated Destination Partner");
      expect(resolveTrustBadge("  CURATED EXPERIENCE  ")).toBe("Curated Experience");
      expect(resolveTrustBadge("  LOCAL FAVORITE  ")).toBe("Local Favorite");
    });

    it("normalizes legacy aliases with varied casing and dashes", () => {
      expect(resolveTrustBadge("TOP-RATED")).toBe("Top Rated Destination Partner");
      expect(resolveTrustBadge("top rated")).toBe("Top Rated Destination Partner");
      expect(resolveTrustBadge("VERIFIED-PARTNER")).toBe("Trusted by Travellers");
      expect(resolveTrustBadge("PREMIUM")).toBe("Signature Collection");
      expect(resolveTrustBadge("LUXURY")).toBe("Signature Collection");
      expect(resolveTrustBadge("LOCAL FAV")).toBeNull();
      expect(resolveTrustBadge("local favorite")).toBe("Local Favorite");
    });

    it("handles tier casing variations (uppercase, mixed case, whitespace)", () => {
      expect(resolveTrustBadge({ tier: " SIGNATURE " })).toBe("Signature Collection");
      expect(resolveTrustBadge({ tier: "PARTNER", rating: 4.8 })).toBe("Top Rated Destination Partner");
      expect(resolveTrustBadge({ tier: "VoYaGeR" })).toBe("Curated Experience");
    });

    it("handles tag casing and whitespace variations", () => {
      expect(resolveTrustBadge({ tags: ["  LoCaL FaVoRiTe  "] })).toBe("Local Favorite");
      expect(resolveTrustBadge({ tags: ["  FINE DINING  "] })).toBe("Signature Collection");
      expect(resolveTrustBadge({ tags: ["  HANDPICKED  "] })).toBe("Curated Experience");
      expect(resolveTrustBadge({ tags: ["  VERIFIED PARTNER  "] })).toBe("Verified Experience");
    });
  });

  describe("5. Component DOM & Accessibility Invariants", () => {
    it("renders nothing (null) when business has no qualifying badge", () => {
      const { container } = render(
        <TrustBadge
          business={{
            name: "Ordinary Store",
            rating: 3.5,
            reviewCount: 3,
          }}
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it("renders nothing when neither badge nor business is provided", () => {
      const { container } = render(<TrustBadge />);
      expect(container.firstChild).toBeNull();
    });

    it("supports mobile truncation class toggle", () => {
      const { rerender } = render(
        <TrustBadge badge="Top Rated Destination Partner" truncateOnMobile={true} />
      );
      const span = screen.getByText("Top Rated Destination Partner");
      expect(span.className).toContain("truncate");
      expect(span.className).toContain("max-w-[130px]");

      rerender(<TrustBadge badge="Top Rated Destination Partner" truncateOnMobile={false} />);
      expect(span.className).not.toContain("truncate");
    });

    it("verifies all 7 badges have WCAG-compliant styling configs with icons and descriptions", () => {
      for (const badge of TRUST_BADGES) {
        const config = TRUST_BADGES_CONFIG[badge];
        expect(config.label).toBe(badge);
        expect(config.shortLabel).toBeDefined();
        expect(config.icon).toMatch(/^ri-/);
        expect(config.description.length).toBeGreaterThan(10);
        expect(config.styles.glass).toContain("backdrop-blur");
        expect(config.styles.solid).toBeDefined();
        expect(config.styles.subtle).toBeDefined();
        expect(config.styles.pill).toBeDefined();
      }
    });

    it("handles click and pass-through props seamlessly", () => {
      const onClick = vi.fn();
      render(
        <TrustBadge
          badge="Signature Collection"
          onClick={onClick}
          iconClassName="custom-icon-class"
        />
      );

      const badge = screen.getByRole("status");
      fireEvent.click(badge);
      expect(onClick).toHaveBeenCalledTimes(1);

      const icon = badge.querySelector("i");
      expect(icon?.className).toContain("custom-icon-class");
    });
  });
});
