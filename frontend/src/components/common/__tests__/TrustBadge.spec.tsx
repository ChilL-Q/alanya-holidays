import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import TrustBadge, {
  resolveTrustBadge,
  isTrustBadge,
  TRUST_BADGES,
  TRUST_BADGES_CONFIG,
  type TrustBadgeType,
} from "../TrustBadge";

describe("TrustBadge Component & Evocative Labeling System", () => {
  describe("Tier 1: Visual & Direct Contract Tests (7 Evocative Badges)", () => {
    it.each(TRUST_BADGES)("renders badge '%s' with exact label, role, title, and icon", (badgeName) => {
      const { container } = render(<TrustBadge badge={badgeName} variant="solid" />);

      const badgeElement = screen.getByRole("status");
      expect(badgeElement).toBeInTheDocument();
      expect(badgeElement).toHaveTextContent(badgeName);
      expect(badgeElement).toHaveAttribute("data-badge-type", badgeName);
      expect(badgeElement).toHaveAttribute("title", TRUST_BADGES_CONFIG[badgeName].description);

      const iconElement = container.querySelector("i");
      expect(iconElement).toBeInTheDocument();
      expect(iconElement?.className).toContain(TRUST_BADGES_CONFIG[badgeName].icon);
      expect(iconElement).toHaveAttribute("aria-hidden", "true");
    });

    it("renders with polymorphic business object prop", () => {
      const { container } = render(
        <TrustBadge
          business={{
            name: "Grand Palace",
            trustBadge: "Signature Collection",
          }}
          variant="glass"
        />
      );

      const badge = screen.getByRole("status");
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent("Signature Collection");
      expect(badge.className).toContain("backdrop-blur-md");
      const icon = container.querySelector("i");
      expect(icon?.className).toContain(TRUST_BADGES_CONFIG["Signature Collection"].icon);
    });

    it("applies correct variant styling classes", () => {
      const { rerender } = render(<TrustBadge badge="Verified Experience" variant="glass" />);
      let badge = screen.getByRole("status");
      expect(badge.className).toContain("backdrop-blur-md");

      rerender(<TrustBadge badge="Verified Experience" variant="solid" />);
      badge = screen.getByRole("status");
      expect(badge.className).toContain("bg-emerald-600");

      rerender(<TrustBadge badge="Verified Experience" variant="subtle" />);
      badge = screen.getByRole("status");
      expect(badge.className).toContain("bg-emerald-50");

      rerender(<TrustBadge badge="Verified Experience" variant="pill" />);
      badge = screen.getByRole("status");
      expect(badge.className).toContain("bg-emerald-100");

      rerender(<TrustBadge badge="Recommended by Travellers" variant="solid" />);
      badge = screen.getByRole("status");
      expect(badge.className).toContain("bg-amber-500");
      expect(badge.className).toContain("text-amber-950");
    });

    it("applies correct size classes for xs, sm, md, lg", () => {
      const { rerender } = render(<TrustBadge badge="Local Favorite" size="xs" />);
      expect(screen.getByRole("status").className).toContain("text-[10px]");

      rerender(<TrustBadge badge="Local Favorite" size="sm" />);
      expect(screen.getByRole("status").className).toContain("text-xs");

      rerender(<TrustBadge badge="Local Favorite" size="md" />);
      expect(screen.getByRole("status").className).toContain("text-sm");

      rerender(<TrustBadge badge="Local Favorite" size="lg" />);
      expect(screen.getByRole("status").className).toContain("text-base");
    });

    it("hides icon when showIcon={false}", () => {
      const { container } = render(<TrustBadge badge="Curated Experience" showIcon={false} />);
      expect(container.querySelector("i")).toBeNull();
      expect(screen.getByText("Curated Experience")).toBeInTheDocument();
    });

    it("merges custom className and handles click events", () => {
      const handleClick = vi.fn();
      render(
        <TrustBadge
          badge="Recommended by Travellers"
          className="custom-extra-class shadow-2xl"
          onClick={handleClick}
        />
      );

      const badge = screen.getByRole("status");
      expect(badge.className).toContain("custom-extra-class");
      expect(badge.className).toContain("shadow-2xl");

      fireEvent.click(badge);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe("Tier 2: Badge Resolution Heuristic Tests (resolveTrustBadge)", () => {
    it("returns null for null, undefined, empty string or empty object", () => {
      expect(resolveTrustBadge(null)).toBeNull();
      expect(resolveTrustBadge(undefined)).toBeNull();
      expect(resolveTrustBadge("")).toBeNull();
      expect(resolveTrustBadge({})).toBeNull();
    });

    it("recognizes exact valid badge strings directly and via type guard isTrustBadge", () => {
      TRUST_BADGES.forEach((b) => {
        expect(isTrustBadge(b)).toBe(true);
        expect(resolveTrustBadge(b)).toBe(b);
      });
      expect(isTrustBadge("Non-Existent")).toBe(false);
    });

    it("normalizes case-insensitive and whitespace-padded canonical badge strings", () => {
      expect(resolveTrustBadge("  RECOMMENDED BY TRAVELLERS  ")).toBe("Recommended by Travellers");
      expect(resolveTrustBadge("trusted by travellers")).toBe("Trusted by Travellers");
      expect(resolveTrustBadge("  VERIFIED EXPERIENCE  ")).toBe("Verified Experience");
      expect(resolveTrustBadge("signature collection")).toBe("Signature Collection");
      expect(resolveTrustBadge("TOP RATED DESTINATION PARTNER")).toBe("Top Rated Destination Partner");
      expect(resolveTrustBadge("curated experience")).toBe("Curated Experience");
      expect(resolveTrustBadge("  LOCAL FAVORITE  ")).toBe("Local Favorite");
    });

    it("normalizes legacy badge strings", () => {
      expect(resolveTrustBadge("featured")).toBe("Recommended by Travellers");
      expect(resolveTrustBadge("recommended")).toBe("Recommended by Travellers");
      expect(resolveTrustBadge("trusted")).toBe("Trusted by Travellers");
      expect(resolveTrustBadge("verified-partner")).toBe("Trusted by Travellers");
      expect(resolveTrustBadge("verified")).toBe("Verified Experience");
      expect(resolveTrustBadge("inspected")).toBe("Verified Experience");
      expect(resolveTrustBadge("signature")).toBe("Signature Collection");
      expect(resolveTrustBadge("premium")).toBe("Signature Collection");
      expect(resolveTrustBadge("luxury")).toBe("Signature Collection");
      expect(resolveTrustBadge("top rated")).toBe("Top Rated Destination Partner");
      expect(resolveTrustBadge("top-rated")).toBe("Top Rated Destination Partner");
      expect(resolveTrustBadge("partner")).toBe("Top Rated Destination Partner");
      expect(resolveTrustBadge("curated")).toBe("Curated Experience");
      expect(resolveTrustBadge("experience")).toBe("Curated Experience");
      expect(resolveTrustBadge("local")).toBe("Local Favorite");
      expect(resolveTrustBadge("local favorite")).toBe("Local Favorite");
      expect(resolveTrustBadge("favorite")).toBe("Local Favorite");
    });

    it("Stage 1: Gives highest priority to explicit trustBadge or trust_badge property", () => {
      const biz1 = {
        name: "Test Place",
        trustBadge: "Local Favorite" as TrustBadgeType,
        rating: 5.0,
        reviewCount: 1000,
        priceRange: "$$$",
        tier: "signature",
      };
      expect(resolveTrustBadge(biz1)).toBe("Local Favorite");

      const biz2 = {
        name: "Snake Case Place",
        trust_badge: "Verified Experience",
        tier: "signature",
      };
      expect(resolveTrustBadge(biz2)).toBe("Verified Experience");
    });

    it("Stage 2: Resolves badges from onboarding tier", () => {
      expect(resolveTrustBadge({ tier: "signature" })).toBe("Signature Collection");
      expect(resolveTrustBadge({ tier: "partner", rating: 4.8 })).toBe("Top Rated Destination Partner");
      expect(resolveTrustBadge({ tier: "partner", rating: 4.2 })).toBe("Curated Experience");
      expect(resolveTrustBadge({ tier: "voyager" })).toBe("Curated Experience");
    });

    it("Stage 3: Resolves badges from curated domain tags", () => {
      expect(resolveTrustBadge({ tags: ["Local Favorite", "Romantic"] })).toBe("Local Favorite");
      expect(resolveTrustBadge({ tags: ["Hidden Gem", "Old Town"] })).toBe("Local Favorite");
      expect(resolveTrustBadge({ tags: ["Fine Dining", "Luxury"] })).toBe("Signature Collection");
      expect(resolveTrustBadge({ tags: ["VIP", "Exclusive"] })).toBe("Signature Collection");
      expect(resolveTrustBadge({ tags: ["Boutique", "Handpicked"] })).toBe("Curated Experience");
      expect(resolveTrustBadge({ tags: ["Verified Partner"] })).toBe("Verified Experience");
    });

    it("Stage 4: Resolves badges from statistical metrics (rating & reviews)", () => {
      // Luxury $$$ + 4.7+
      expect(resolveTrustBadge({ priceRange: "$$$", rating: 4.8, reviewCount: 20 })).toBe("Signature Collection");

      // Top Rated Destination Partner: 4.8+ & >= 100 reviews
      expect(resolveTrustBadge({ rating: 4.9, reviewCount: 150 })).toBe("Top Rated Destination Partner");

      // Local Favorite: Authentic/Turkish subcategory or $ price + 4.6+ rating
      expect(resolveTrustBadge({ subcategory: "Turkish Cuisine", rating: 4.7, reviewCount: 25 })).toBe("Local Favorite");
      expect(resolveTrustBadge({ category: "restaurants-cafes", priceRange: "$", rating: 4.65, reviewCount: 20 })).toBe("Local Favorite");

      // Curated Experience: Tours & activities
      expect(resolveTrustBadge({ category: "tours-activities", rating: 4.6, reviewCount: 20 })).toBe("Curated Experience");

      // Recommended by Travellers: 4.7+ & >= 30 reviews
      expect(resolveTrustBadge({ rating: 4.75, reviewCount: 45 })).toBe("Recommended by Travellers");

      // Trusted by Travellers: 4.4+ & >= 10 reviews
      expect(resolveTrustBadge({ rating: 4.45, reviewCount: 15 })).toBe("Trusted by Travellers");
    });

    it("Stage 5: Resolves 'Verified Experience' for verified or claimed status", () => {
      expect(resolveTrustBadge({ is_verified: true })).toBe("Verified Experience");
      expect(resolveTrustBadge({ is_claimed: true })).toBe("Verified Experience");
      expect(resolveTrustBadge({ claimed_at: "2026-08-20T12:00:00Z" })).toBe("Verified Experience");
    });

    it("Stage 6: Migrates legacy featured flag", () => {
      expect(resolveTrustBadge({ featured: true, rating: 4.7 })).toBe("Recommended by Travellers");
      expect(resolveTrustBadge({ is_featured: true, rating: 4.1 })).toBe("Curated Experience");
      expect(resolveTrustBadge({ featured: true })).toBe("Recommended by Travellers");
    });

    it("Stage 7: Returns null for standard unmatched listings", () => {
      const plainBiz = {
        name: "Standard Shop",
        rating: 3.8,
        reviewCount: 5,
        priceRange: "$$",
        category: "shopping",
        featured: false,
      };
      expect(resolveTrustBadge(plainBiz)).toBeNull();
    });
  });

  describe("Tier 3: Boundary, Resilience & Corrupted Data Tests", () => {
    it("handles stringified numbers and NaN ratings safely", () => {
      expect(resolveTrustBadge({ rating: "4.9" as unknown as number, reviewCount: "150" as unknown as number })).toBe(
        "Top Rated Destination Partner"
      );
      expect(resolveTrustBadge({ rating: NaN, reviewCount: 100 })).toBeNull();
      expect(resolveTrustBadge({ rating: -5, reviewCount: -10 })).toBeNull();
    });

    it("handles alternate field casings (average_rating, review_count, reviews_count)", () => {
      expect(resolveTrustBadge({ average_rating: 4.9, review_count: 200 })).toBe("Top Rated Destination Partner");
      expect(resolveTrustBadge({ rating: 4.75, reviews_count: 50 })).toBe("Recommended by Travellers");
      expect(resolveTrustBadge({ price_range: "$$$", rating: 4.8 })).toBe("Signature Collection");
    });

    it("handles stringified JSON tags and comma-delimited string tags", () => {
      expect(resolveTrustBadge({ tags: JSON.stringify(["Luxury", "Fine Dining"]) })).toBe("Signature Collection");
      expect(resolveTrustBadge({ tags: "Local Favorite, Historic, Cozy" })).toBe("Local Favorite");
    });

    it("renders nothing (returns null) when invalid badge is provided", () => {
      const { container } = render(<TrustBadge badge="Invalid Badge Name" />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe("Tier 4: Accessibility & DOM Integrity Tests", () => {
    it("provides accessible aria-label and role='status'", () => {
      render(<TrustBadge badge="Top Rated Destination Partner" />);
      const badge = screen.getByRole("status");
      expect(badge).toHaveAttribute("aria-label", "Top Rated Destination Partner");
      expect(badge).toHaveAttribute("title", TRUST_BADGES_CONFIG["Top Rated Destination Partner"].description);
    });

    it("renders icon as aria-hidden", () => {
      const { container } = render(<TrustBadge badge="Local Favorite" />);
      const icon = container.querySelector("i");
      expect(icon).toHaveAttribute("aria-hidden", "true");
    });

    it("supports custom aria-label override", () => {
      render(<TrustBadge badge="Local Favorite" aria-label="Custom Accessible Label" />);
      const badge = screen.getByRole("status");
      expect(badge).toHaveAttribute("aria-label", "Custom Accessible Label");
    });
  });
});
