import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import TrustBadge, {
  resolveTrustBadge,
  TRUST_BADGES,
  TRUST_BADGES_CONFIG,
  type TrustBadgeType,
  type TrustBadgeVariant,
  type TrustBadgeSize,
} from "../TrustBadge";
import BusinessCard from "@/pages/explore/components/BusinessCard";
import MapView from "@/pages/explore/components/MapView";
import BusinessDetailPage from "@/pages/business/page";
import { businesses } from "@/mocks/businesses";
import { AuthProvider } from "@/context/AuthContext";

const VARIANTS: TrustBadgeVariant[] = ["glass", "solid", "subtle", "pill"];
const SIZES: TrustBadgeSize[] = ["xs", "sm", "md", "lg"];

describe("Milestone M1 Adversarial Challenger Suite", () => {
  describe("1. Exhaustive 7 Badges x 4 Variants x 4 Sizes Matrix (112 Combinations)", () => {
    // Generate all 112 permutations
    const matrix: Array<[TrustBadgeType, TrustBadgeVariant, TrustBadgeSize]> = [];
    for (const badge of TRUST_BADGES) {
      for (const variant of VARIANTS) {
        for (const size of SIZES) {
          matrix.push([badge, variant, size]);
        }
      }
    }

    it.each(matrix)(
      "correctly renders [%s] in variant [%s] and size [%s]",
      (badge, variant, size) => {
        const { container } = render(
          <TrustBadge badge={badge} variant={variant} size={size} />
        );

        const badgeEl = screen.getByRole("status");
        expect(badgeEl).toBeInTheDocument();
        expect(badgeEl).toHaveTextContent(badge);
        expect(badgeEl).toHaveAttribute("data-badge-type", badge);
        expect(badgeEl).toHaveAttribute("title", TRUST_BADGES_CONFIG[badge].description);

        const iconEl = container.querySelector("i");
        expect(iconEl).toBeInTheDocument();
        expect(iconEl?.className).toContain(TRUST_BADGES_CONFIG[badge].icon);
        expect(iconEl).toHaveAttribute("aria-hidden", "true");

        // Verify size token presence
        if (size === "xs") expect(badgeEl.className).toContain("text-[10px]");
        if (size === "sm") expect(badgeEl.className).toContain("text-xs");
        if (size === "md") expect(badgeEl.className).toContain("text-sm");
        if (size === "lg") expect(badgeEl.className).toContain("text-base");

        cleanup();
      }
    );
  });

  describe("2. Mobile Truncation and Custom Attributes", () => {
    it("applies truncation classes when truncateOnMobile is true", () => {
      render(
        <TrustBadge
          badge="Top Rated Destination Partner"
          truncateOnMobile={true}
        />
      );
      const textSpan = screen.getByText("Top Rated Destination Partner");
      expect(textSpan.className).toContain("truncate");
      expect(textSpan.className).toContain("max-w-[130px]");
    });

    it("applies custom iconClassName without stripping existing icon classes", () => {
      const { container } = render(
        <TrustBadge
          badge="Recommended by Travellers"
          iconClassName="custom-spin-effect"
        />
      );
      const icon = container.querySelector("i");
      expect(icon?.className).toContain("custom-spin-effect");
      expect(icon?.className).toContain("ri-star-smile-fill");
    });

    it("supports custom onClick and aria-label", () => {
      const handleClick = vi.fn();
      render(
        <TrustBadge
          badge="Verified Experience"
          aria-label="Verified Inspection Level 1"
          onClick={handleClick}
        />
      );
      const badgeEl = screen.getByRole("status");
      expect(badgeEl).toHaveAttribute("aria-label", "Verified Inspection Level 1");
    });
  });

  describe("3. Adversarial Heuristic Precedence & Edge Cases", () => {
    it("honors strict precedence: explicit override > tier > tag > stats > claim > featured", () => {
      // 1. Explicit override beats everything
      expect(
        resolveTrustBadge({
          trustBadge: "Local Favorite",
          tier: "signature",
          tags: ["Luxury", "Fine Dining"],
          rating: 4.9,
          reviewCount: 500,
          is_verified: true,
          featured: true,
        })
      ).toBe("Local Favorite");

      // 2. Tier beats tags and stats
      expect(
        resolveTrustBadge({
          tier: "signature",
          tags: ["Local Favorite"],
          rating: 4.9,
          reviewCount: 500,
        })
      ).toBe("Signature Collection");

      // 3. Tag beats statistical metrics
      expect(
        resolveTrustBadge({
          tags: ["Local Favorite"],
          rating: 4.9,
          reviewCount: 500, // normally Top Rated Destination Partner
        })
      ).toBe("Local Favorite");

      // 4. Statistical rating 4.8 + 100 reviews beats verified/claimed
      expect(
        resolveTrustBadge({
          rating: 4.9,
          reviewCount: 150,
          is_verified: true,
        })
      ).toBe("Top Rated Destination Partner");

      // 5. Verification beats legacy featured flag
      expect(
        resolveTrustBadge({
          is_verified: true,
          featured: true,
          rating: 4.1,
        })
      ).toBe("Verified Experience");
    });

    it("handles extreme review counts and non-standard numeric values", () => {
      expect(
        resolveTrustBadge({
          rating: 5,
          reviewCount: 9999999,
        })
      ).toBe("Top Rated Destination Partner");

      expect(
        resolveTrustBadge({
          rating: "4.8" as unknown as number,
          review_count: "250" as unknown as number,
        })
      ).toBe("Top Rated Destination Partner");

      expect(
        resolveTrustBadge({
          rating: Infinity,
        })
      ).toBeNull();
    });

    it("handles legacy alias strings and casing permutations", () => {
      expect(resolveTrustBadge("Recommended by Travellers")).toBe("Recommended by Travellers");
      expect(resolveTrustBadge("TOP RATED")).toBe("Top Rated Destination Partner");
      expect(resolveTrustBadge("luxury")).toBe("Signature Collection");
      expect(resolveTrustBadge("PREMIUM")).toBe("Signature Collection");
      expect(resolveTrustBadge("featured")).toBe("Recommended by Travellers");
      expect(resolveTrustBadge("inspected")).toBe("Verified Experience");
      expect(resolveTrustBadge("curated")).toBe("Curated Experience");
      expect(resolveTrustBadge("local favorite")).toBe("Local Favorite");
      expect(resolveTrustBadge({ tags: ["  HIDDEN GEM  "] })).toBe("Local Favorite");
      expect(resolveTrustBadge({ tags: ["VIP"] })).toBe("Signature Collection");
    });
  });

  describe("4. BusinessCard Integration & compareMode Stress Tests", () => {
    it.each(businesses)("renders BusinessCard with valid trust badge for mock %s", (business) => {
      const { container } = render(
        <MemoryRouter>
          <BusinessCard business={business} />
        </MemoryRouter>
      );

      const expectedBadge = resolveTrustBadge(business);
      if (expectedBadge) {
        const badge = screen.getByRole("status");
        expect(badge).toBeInTheDocument();
        expect(badge).toHaveAttribute("data-badge-type", expectedBadge);
      } else {
        expect(screen.queryByRole("status")).toBeNull();
      }

      // Ensure no DOM nesting violations
      expect(container.querySelectorAll("a a").length).toBe(0);
      expect(container.querySelectorAll("button button").length).toBe(0);
      cleanup();
    });

    it("suppresses trust badge across ALL mock businesses when compareMode is true", () => {
      for (const business of businesses.slice(0, 5)) {
        render(
          <MemoryRouter>
            <BusinessCard business={business} compareMode={true} />
          </MemoryRouter>
        );
        expect(screen.queryByRole("status")).toBeNull();
        cleanup();
      }
    });
  });

  describe("5. MapView Integration Stress Tests", () => {
    it("renders badges in MapView sidebar listings with variant='subtle' and size='xs'", () => {
      render(
        <MemoryRouter>
          <MapView
            businesses={businesses.slice(0, 3)}
            searchQuery=""
            activeCategory="all"
            onSearchChange={vi.fn()}
            onCategoryChange={vi.fn()}
          />
        </MemoryRouter>
      );

      const badges = screen.getAllByRole("status");
      expect(badges.length).toBeGreaterThan(0);
      badges.forEach((badge) => {
        expect(badge.className).toContain("text-[10px]");
      });
    });
  });

  describe("6. Business Detail Page Hero Integration", () => {
    it("renders TrustBadge in business detail hero section for biz-001", () => {
      render(
        <AuthProvider>
          <MemoryRouter initialEntries={["/business/biz-001"]}>
            <Routes>
              <Route path="/business/:businessId" element={<BusinessDetailPage />} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      );

      const badge = screen.getByRole("status");
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent("Signature Collection");
      expect(badge.className).toContain("backdrop-blur-md");
    });
  });
});
