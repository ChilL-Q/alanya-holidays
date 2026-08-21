import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { parseArticleContent } from "./parser";
import ArticleContentRenderer from "./ArticleContentRenderer";
import EmbeddedVenueCard from "./EmbeddedVenueCard";
import EmbeddedDirectoryCta from "./EmbeddedDirectoryCta";
import type { ArticleBlockNode } from "./types";
import type { Business } from "@/mocks/businesses";

describe("Article Subsystem Adversarial & Stress Testing", () => {
  // =========================================================================
  // SUITE 1: AST Parser Malformed Shortcode & Pathological Grammar Tests
  // =========================================================================
  describe("Suite 1: Parser Malformed & Pathological Shortcode Syntaxes", () => {
    it("handles unclosed opening bracket gracefully as paragraph", () => {
      const input = '[venue id="biz-001" layout="card"';
      const result = parseArticleContent(input);

      expect(result).toEqual<ArticleBlockNode[]>([
        {
          type: "paragraph",
          content: '[venue id="biz-001" layout="card"',
        },
      ]);
    });

    it("handles stray closing brackets without opening tags", () => {
      const input = 'id="biz-001"]\n\n]]]\n\n]';
      const result = parseArticleContent(input);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ type: "paragraph", content: 'id="biz-001"]' });
      expect(result[1]).toEqual({ type: "paragraph", content: "]]]" });
      expect(result[2]).toEqual({ type: "paragraph", content: "]" });
    });

    it("handles nested double brackets [[venue]] safely without throwing", () => {
      const input = '[[venue id="biz-001"]]';
      const result = parseArticleContent(input);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe("paragraph");
    });

    it("handles triple and deeply nested brackets without crashing", () => {
      const input = '[[[[[[[[[[venue id="biz-001"]]]]]]]]]]';
      const result = parseArticleContent(input);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe("paragraph");
    });

    it("handles empty brackets [], [ ], and whitespace-only tags", () => {
      const input = "[]\n\n[   ]\n\n[\t\t]";
      const result = parseArticleContent(input);

      expect(result).toHaveLength(3);
      result.forEach((node) => {
        expect(node.type).toBe("paragraph");
      });
    });

    it("handles shortcodes with completely missing attributes", () => {
      const input = "[venue]\n\n[cta]\n\n[video]\n\n[figure]\n\n[callout]\n\n[pullquote]";
      const result = parseArticleContent(input);

      expect(result).toEqual<ArticleBlockNode[]>([
        { type: "venue", venueId: "", layout: "card" },
        { type: "cta", category: "", label: "", subtext: undefined },
        { type: "video", src: "", provider: "youtube", caption: undefined, trackSrc: undefined },
        { type: "figure", src: "", caption: undefined, credit: undefined, alt: undefined },
        { type: "callout", variant: "info", title: undefined, content: "" },
        { type: "pullquote", quote: "", author: undefined, role: undefined },
      ]);
    });

    it("handles attributes with unquoted values and messy spaces", () => {
      const input = "[venue id=biz-001 layout=compact]";
      const result = parseArticleContent(input);

      expect(result).toEqual<ArticleBlockNode[]>([
        { type: "venue", venueId: "biz-001", layout: "compact" },
      ]);
    });

    it("handles single-quoted attributes and mixed quote styles", () => {
      const input = "[cta category='restaurants-cafes' label=\"Alanya Seafood & Meze\" subtext='Fresh daily catch']";
      const result = parseArticleContent(input);

      expect(result).toEqual<ArticleBlockNode[]>([
        {
          type: "cta",
          category: "restaurants-cafes",
          label: "Alanya Seafood & Meze",
          subtext: "Fresh daily catch",
        },
      ]);
    });

    it("handles attributes with internal escaped quotes and nested quotes gracefully", () => {
      const input = '[callout title="Editor\\"s Note" content="Enjoy the view!"]';
      const result = parseArticleContent(input);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe("callout");
    });

    it("handles case-insensitive shortcode tag names (e.g. [VENUE], [CTA])", () => {
      const input = '[VENUE id="biz-001" layout="compact"]\n\n[CTA category="shopping" label="Shop Central"]';
      const result = parseArticleContent(input);

      expect(result).toEqual<ArticleBlockNode[]>([
        { type: "venue", venueId: "biz-001", layout: "compact" },
        { type: "cta", category: "shopping", label: "Shop Central", subtext: undefined },
      ]);
    });

    it("handles Turkish unicode characters, emojis, and special symbols in attributes", () => {
      const input = '[cta category="sağlık-ve-yaşam" label="✨ Alanya Türk Hamamı & Spa 🧖‍♂️" subtext="Damlataş & Kleopatra mevkii %100 hijyenik & lüks deneyim! 🇹🇷"]';
      const result = parseArticleContent(input);

      expect(result).toEqual<ArticleBlockNode[]>([
        {
          type: "cta",
          category: "sağlık-ve-yaşam",
          label: "✨ Alanya Türk Hamamı & Spa 🧖‍♂️",
          subtext: "Damlataş & Kleopatra mevkii %100 hijyenik & lüks deneyim! 🇹🇷",
        },
      ]);
    });

    it("handles XSS payloads and script injection vectors without execution", () => {
      const input = '[venue id="<script>window.__pwned=1;</script>"]\n\n[cta category="<svg onload=alert(1)>" label="Click <b onclick=alert(2)>Me</b>"]';
      const result = parseArticleContent(input);

      expect(result).toEqual<ArticleBlockNode[]>([
        {
          type: "venue",
          venueId: "<script>window.__pwned=1;</script>",
          layout: "card",
        },
        {
          type: "cta",
          category: "<svg onload=alert(1)>",
          label: "Click <b onclick=alert(2)>Me</b>",
          subtext: undefined,
        },
      ]);
    });

    it("handles URL parameters, queries, and fragments inside attributes", () => {
      const input = '[video src="https://www.youtube.com/watch?v=abc-123_XYZ&list=PL123&t=42s#t=42" provider="youtube" caption="Alanya from above: 4K"]';
      const result = parseArticleContent(input);

      expect(result).toEqual<ArticleBlockNode[]>([
        {
          type: "video",
          src: "https://www.youtube.com/watch?v=abc-123_XYZ&list=PL123&t=42s#t=42",
          provider: "youtube",
          caption: "Alanya from above: 4K",
          trackSrc: undefined,
        },
      ]);
    });
  });

  // =========================================================================
  // SUITE 2: Scale, Memory & ReDoS Invariant Testing
  // =========================================================================
  describe("Suite 2: Scale, Memory & ReDoS Invariant Testing", () => {
    it("parses an extreme 1,000-line document with 200 mixed shortcodes in < 100ms", () => {
      const lines: string[] = [];
      for (let i = 0; i < 200; i++) {
        lines.push(`## Section ${i} Heading`);
        lines.push(`This is paragraph content for section ${i} describing the Mediterranean lifestyle in Alanya.`);
        lines.push(`[venue id="biz-${String((i % 8) + 1).padStart(3, "0")}" layout="${i % 2 === 0 ? "card" : "compact"}"]`);
        lines.push(`[cta category="restaurants-cafes" label="Explore Section ${i}" subtext="Subtext ${i}"]`);
        lines.push("");
      }

      const hugeDoc = lines.join("\n");
      const startTime = performance.now();
      const result = parseArticleContent(hugeDoc);
      const duration = performance.now() - startTime;

      expect(result.length).toBeGreaterThan(600);
      expect(duration).toBeLessThan(100); // Must be lightning fast (< 100ms)
    });

    it("resists ReDoS regex attack patterns with massive repeated strings", () => {
      // Malformed repetitive string that triggers polynomial backtracking in poor regexes
      const maliciousPattern = "[" + "a=".repeat(2000) + "]";
      const startTime = performance.now();
      const result = parseArticleContent(maliciousPattern);
      const duration = performance.now() - startTime;

      expect(result).toHaveLength(1);
      expect(duration).toBeLessThan(50);
    });

    it("resists massive attribute payload (50,000 chars) without hanging", () => {
      const hugeAttr = "x".repeat(50000);
      const input = `[venue id="${hugeAttr}"]`;

      const startTime = performance.now();
      const result = parseArticleContent(input);
      const duration = performance.now() - startTime;

      expect(result).toEqual<ArticleBlockNode[]>([
        {
          type: "venue",
          venueId: hugeAttr,
          layout: "card",
        },
      ]);
      expect(duration).toBeLessThan(50);
    });

    it("safely handles 1,000 empty lines between markdown blocks", () => {
      const input = "## Top Section\n" + "\n".repeat(1000) + '### Bottom Section\n\n[venue id="biz-001"]';
      const result = parseArticleContent(input);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ type: "heading", level: 2, content: "Top Section" });
      expect(result[1]).toEqual({ type: "heading", level: 3, content: "Bottom Section" });
      expect(result[2]).toEqual({ type: "venue", venueId: "biz-001", layout: "card" });
    });
  });

  // =========================================================================
  // SUITE 3: EmbeddedVenueCard Chaos & Boundary Testing
  // =========================================================================
  describe("Suite 3: EmbeddedVenueCard Component Chaos Testing", () => {
    it("renders fallback UI without crashing when venueId is empty string, nullish, or invalid", () => {
      const { unmount } = render(
        <MemoryRouter>
          <EmbeddedVenueCard venueId="" />
        </MemoryRouter>
      );
      expect(screen.getByText(/venue not found or listing unavailable/i)).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /browse directory/i })).toHaveAttribute("href", "/explore");
      unmount();

      render(
        <MemoryRouter>
          <EmbeddedVenueCard venueId="totally-bogus-venue-id-99999" />
        </MemoryRouter>
      );
      expect(screen.getByText(/venue not found or listing unavailable/i)).toBeInTheDocument();
    });

    it("handles image load failure gracefully by switching to fallback image without error", () => {
      const testVenue: Business = {
        id: "biz-broken-img",
        name: "Broken Image Bistro",
        category: "restaurants-cafes",
        subcategory: "Diner",
        description: "Cozy diner.",
        address: "Damlatas Cad. 10",
        phone: "+90 242 555 1234",
        email: "test@example.com",
        website: "https://example.com",
        rating: 4.5,
        reviewCount: 50,
        image: "https://invalid-non-existent-domain-404.com/broken.jpg",
        tags: ["Diner"],
        featured: false,
        priceRange: "$$",
        openingHours: "08:00 - 22:00",
        lat: 36.54,
        lng: 32.0,
      };

      render(
        <MemoryRouter>
          <EmbeddedVenueCard venue={testVenue} layout="card" />
        </MemoryRouter>
      );

      const img = screen.getByRole("img", { name: "Broken Image Bistro" });
      expect(img).toHaveAttribute("src", "https://invalid-non-existent-domain-404.com/broken.jpg");

      // Trigger image onError event
      fireEvent.error(img);

      // Should now have fallback Unsplash URL
      expect(img.getAttribute("src")).toContain("images.unsplash.com");
    });

    it("handles venue with 0 reviews, 0.0 rating, and nullish optional metadata", () => {
      const zeroVenue: Business = {
        id: "biz-zero-reviews",
        name: "Brand New Spot",
        category: "restaurants-cafes",
        subcategory: "",
        description: "",
        address: "",
        phone: "",
        email: "",
        website: "",
        rating: 0,
        reviewCount: 0,
        image: "https://images.unsplash.com/sample.jpg",
        tags: [],
        featured: false,
        priceRange: "",
        openingHours: "",
        lat: 36.54,
        lng: 32.0,
      };

      render(
        <MemoryRouter>
          <EmbeddedVenueCard venue={zeroVenue} layout="compact" />
        </MemoryRouter>
      );

      expect(screen.getByText("Brand New Spot")).toBeInTheDocument();
      expect(screen.getByText("0.0")).toBeInTheDocument();
      // reviewCount of 0 should not render '(0)'
      expect(screen.queryByText("(0)")).not.toBeInTheDocument();
    });

    it("safely handles onClick without throwing if onClick prop is omitted", () => {
      render(
        <MemoryRouter>
          <EmbeddedVenueCard venueId="biz-001" />
        </MemoryRouter>
      );

      const link = screen.getByRole("link", { name: /view kale panorama restaurant/i });
      expect(() => fireEvent.click(link)).not.toThrow();
    });
  });

  // =========================================================================
  // SUITE 4: EmbeddedDirectoryCta Chaos & URL Injection Testing
  // =========================================================================
  describe("Suite 4: EmbeddedDirectoryCta Component Chaos Testing", () => {
    it("handles completely empty category and label gracefully", () => {
      render(
        <MemoryRouter>
          <EmbeddedDirectoryCta category="" label="" />
        </MemoryRouter>
      );

      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", "/explore?category=");
    });

    it("properly URL-encodes special characters, slashes, and XSS strings in category", () => {
      const maliciousCategory = 'hotels/resorts&filter="<script>alert(1)</script>"';
      render(
        <MemoryRouter>
          <EmbeddedDirectoryCta
            category={maliciousCategory}
            label="Security Test CTA"
            subtext="Testing URL safety"
          />
        </MemoryRouter>
      );

      const link = screen.getByRole("link", { name: /security test cta/i });
      expect(link).toHaveAttribute(
        "href",
        `/explore?category=${encodeURIComponent(maliciousCategory)}`
      );
    });

    it("formats unknown hyphenated category keys nicely with capital letters", () => {
      render(
        <MemoryRouter>
          <EmbeddedDirectoryCta
            category="extreme-water-sports-and-parasailing"
            label="High Flying Adventures"
          />
        </MemoryRouter>
      );

      expect(
        screen.getByText("Extreme Water Sports And Parasailing")
      ).toBeInTheDocument();
    });
  });

  // =========================================================================
  // SUITE 5: ArticleContentRenderer Lifecycle, Concurrent & Edge Type Tests
  // =========================================================================
  describe("Suite 5: ArticleContentRenderer Lifecycle & React Stability", () => {
    it("handles nullish, boolean, and weird invalid inputs without crashing", () => {
      const { unmount } = render(
        <MemoryRouter>
          <ArticleContentRenderer content={undefined} />
        </MemoryRouter>
      );
      unmount();

      const { unmount: unmount2 } = render(
        <MemoryRouter>
          <ArticleContentRenderer content={null as unknown as string} />
        </MemoryRouter>
      );
      unmount2();

      const { container } = render(
        <MemoryRouter>
          <ArticleContentRenderer nodes={[] as ArticleBlockNode[]} />
        </MemoryRouter>
      );
      expect(container.firstChild).toBeEmptyDOMElement();
    });

    it("handles heterogeneous array of corrupted or unrecognized AST node types", () => {
      const corruptNodes: any[] = [
        { type: "unknown_future_block", data: "xyz" },
        { type: "heading", level: 4, content: "H4 Sub-Sub Title" },
        { type: "figure", src: "https://images.unsplash.com/fig.jpg", caption: "Photo Caption", credit: "Local Guide" },
        { type: "callout", variant: "insider", title: "Insider Secret", content: "Hidden cave at Cleopatra beach." },
        { type: "pullquote", quote: "The sea was crystal clear.", author: "Captain Ali", role: "Skipper" },
      ];

      render(
        <MemoryRouter>
          <ArticleContentRenderer nodes={corruptNodes} />
        </MemoryRouter>
      );

      expect(screen.getByRole("heading", { level: 4, name: "H4 Sub-Sub Title" })).toBeInTheDocument();
      expect(screen.getByText("Photo Caption")).toBeInTheDocument();
      expect(screen.getByText("(Local Guide)")).toBeInTheDocument();
      expect(screen.getByText("Insider Secret")).toBeInTheDocument();
      expect(screen.getByText("Hidden cave at Cleopatra beach.")).toBeInTheDocument();
      expect(screen.getByText(/"The sea was crystal clear."/i)).toBeInTheDocument();
      expect(screen.getByText(/Captain Ali/)).toBeInTheDocument();
      expect(screen.getByText(/, Skipper/)).toBeInTheDocument();
    });

    it("survives 50 rapid sequential content property mutations in a single session", () => {
      const { rerender } = render(
        <MemoryRouter>
          <ArticleContentRenderer content="Initial text" />
        </MemoryRouter>
      );

      for (let i = 0; i < 50; i++) {
        const text = i % 2 === 0 ? `[venue id="biz-00${(i % 5) + 1}"]` : `## Heading ${i}\n\n[cta category="shopping" label="Shop ${i}"]`;
        rerender(
          <MemoryRouter>
            <ArticleContentRenderer content={text} />
          </MemoryRouter>
        );
      }

      // Should remain healthy and fully functional
      expect(screen.getByRole("heading", { level: 2, name: "Heading 49" })).toBeInTheDocument();
      expect(screen.getByText("Shop 49")).toBeInTheDocument();
    });

    it("renders 25 concurrent ArticleContentRenderer instances simultaneously on the same screen", () => {
      const instances = Array.from({ length: 25 }, (_, i) => ({
        id: i,
        content: `## Article ${i}\n\n[venue id="biz-001" layout="compact"]\n\n[cta category="restaurants-cafes" label="CTA ${i}"]`,
      }));

      render(
        <MemoryRouter>
          <div data-testid="grid-container">
            {instances.map((item) => (
              <ArticleContentRenderer key={item.id} content={item.content} />
            ))}
          </div>
        </MemoryRouter>
      );

      expect(screen.getAllByText("Kale Panorama Restaurant")).toHaveLength(25);
      expect(screen.getByRole("heading", { level: 2, name: "Article 0" })).toBeInTheDocument();
      expect(screen.getByRole("heading", { level: 2, name: "Article 24" })).toBeInTheDocument();
    });
  });
});
