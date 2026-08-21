import { describe, it, expect } from "vitest";
import { parseArticleContent } from "./parser";
import type { ArticleBlockNode } from "./types";

describe("Article Shortcode AST Parser (parseArticleContent)", () => {
  describe("Tier 1: Core Functional Parsing (Happy Path)", () => {
    it("should parse plain text into paragraph nodes", () => {
      const input = "Alanya is a beautiful coastal city on the Turkish Riviera.";
      const result = parseArticleContent(input);

      expect(result).toEqual<ArticleBlockNode[]>([
        {
          type: "paragraph",
          content: "Alanya is a beautiful coastal city on the Turkish Riviera.",
        },
      ]);
    });

    it("should separate multiple paragraphs split by double newlines", () => {
      const input = "First paragraph about Cleopatra Beach.\n\nSecond paragraph about Alanya Castle.";
      const result = parseArticleContent(input);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        type: "paragraph",
        content: "First paragraph about Cleopatra Beach.",
      });
      expect(result[1]).toEqual({
        type: "paragraph",
        content: "Second paragraph about Alanya Castle.",
      });
    });

    it("should parse markdown headings (h2, h3, h4)", () => {
      const input = "## Top Highlights in Alanya\n\n### Historical Landmarks\n\n#### Red Tower Details";
      const result = parseArticleContent(input);

      expect(result).toEqual<ArticleBlockNode[]>([
        {
          type: "heading",
          level: 2,
          content: "Top Highlights in Alanya",
        },
        {
          type: "heading",
          level: 3,
          content: "Historical Landmarks",
        },
        {
          type: "heading",
          level: 4,
          content: "Red Tower Details",
        },
      ]);
    });

    it("should parse [venue id='...'] shortcode with default card layout", () => {
      const input = '[venue id="biz-001"]';
      const result = parseArticleContent(input);

      expect(result).toEqual<ArticleBlockNode[]>([
        {
          type: "venue",
          venueId: "biz-001",
          layout: "card",
        },
      ]);
    });

    it("should parse [venue id='...' layout='compact'] shortcode", () => {
      const input = '[venue id="biz-002" layout="compact"]';
      const result = parseArticleContent(input);

      expect(result).toEqual<ArticleBlockNode[]>([
        {
          type: "venue",
          venueId: "biz-002",
          layout: "compact",
        },
      ]);
    });

    it("should parse [cta category='...' label='...' subtext='...'] shortcode", () => {
      const input =
        '[cta category="restaurants-cafes" label="Explore All Restaurants" subtext="Top rated dining in Alanya"]';
      const result = parseArticleContent(input);

      expect(result).toEqual<ArticleBlockNode[]>([
        {
          type: "cta",
          category: "restaurants-cafes",
          label: "Explore All Restaurants",
          subtext: "Top rated dining in Alanya",
        },
      ]);
    });

    it("should parse [cta] shortcode without optional subtext", () => {
      const input = '[cta category="hotels-accommodation" label="Browse Luxury Hotels"]';
      const result = parseArticleContent(input);

      expect(result).toEqual<ArticleBlockNode[]>([
        {
          type: "cta",
          category: "hotels-accommodation",
          label: "Browse Luxury Hotels",
          subtext: undefined,
        },
      ]);
    });

    it("should parse [video] shortcode with YouTube provider and caption", () => {
      const input =
        '[video src="https://www.youtube.com/watch?v=dQw4w9WgXcQ" provider="youtube" caption="Alanya from above 4K"]';
      const result = parseArticleContent(input);

      expect(result).toEqual<ArticleBlockNode[]>([
        {
          type: "video",
          src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          provider: "youtube",
          caption: "Alanya from above 4K",
          trackSrc: undefined,
        },
      ]);
    });

    it("should parse [video] shortcode with HTML5 provider and WebVTT subtitle track", () => {
      const input =
        '[video src="https://cdn.example.com/alanya-guide.mp4" provider="html5" caption="Official video" trackSrc="https://cdn.example.com/en.vtt"]';
      const result = parseArticleContent(input);

      expect(result).toEqual<ArticleBlockNode[]>([
        {
          type: "video",
          src: "https://cdn.example.com/alanya-guide.mp4",
          provider: "html5",
          caption: "Official video",
          trackSrc: "https://cdn.example.com/en.vtt",
        },
      ]);
    });

    it("should parse [figure] shortcode with image src, caption, credit, and alt", () => {
      const input =
        '[figure src="https://images.unsplash.com/photo-beach.jpg" caption="Sunset over Cleopatra Beach" credit="Sarah J." alt="Cleopatra Beach"]';
      const result = parseArticleContent(input);

      expect(result).toEqual<ArticleBlockNode[]>([
        {
          type: "figure",
          src: "https://images.unsplash.com/photo-beach.jpg",
          caption: "Sunset over Cleopatra Beach",
          credit: "Sarah J.",
          alt: "Cleopatra Beach",
        },
      ]);
    });

    it("should parse [callout] shortcode with variant, title, and content", () => {
      const input =
        '[callout variant="tip" title="Pro Tip" content="Arrive early at Dim Cave before 10 AM." ]';
      const result = parseArticleContent(input);

      expect(result).toEqual<ArticleBlockNode[]>([
        {
          type: "callout",
          variant: "tip",
          title: "Pro Tip",
          content: "Arrive early at Dim Cave before 10 AM.",
        },
      ]);
    });

    it("should parse [pullquote] shortcode with quote, author, and role", () => {
      const input =
        '[pullquote quote="Alanya is the jewel of the Mediterranean." author="Sarah Jenkins" role="Travel Editor"]';
      const result = parseArticleContent(input);

      expect(result).toEqual<ArticleBlockNode[]>([
        {
          type: "pullquote",
          quote: "Alanya is the jewel of the Mediterranean.",
          author: "Sarah Jenkins",
          role: "Travel Editor",
        },
      ]);
    });
  });

  describe("Tier 2: Boundary and Edge Cases", () => {
    it("should return an empty array for empty string", () => {
      const result = parseArticleContent("");
      expect(result).toEqual([]);
    });

    it("should return an empty array for whitespace and newline only strings", () => {
      const result = parseArticleContent("   \n\n\t  \r\n   ");
      expect(result).toEqual([]);
    });

    it("should parse multiple sequential shortcodes without intervening text", () => {
      const input =
        '[venue id="biz-001"]\n[venue id="biz-002" layout="compact"]\n[cta category="shopping" label="Shop Local"]';
      const result = parseArticleContent(input);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ type: "venue", venueId: "biz-001", layout: "card" });
      expect(result[1]).toEqual({ type: "venue", venueId: "biz-002", layout: "compact" });
      expect(result[2]).toEqual({ type: "cta", category: "shopping", label: "Shop Local", subtext: undefined });
    });

    it("should tolerate single-quoted attribute values", () => {
      const input = "[venue id='biz-005' layout='compact']";
      const result = parseArticleContent(input);

      expect(result).toEqual<ArticleBlockNode[]>([
        {
          type: "venue",
          venueId: "biz-005",
          layout: "compact",
        },
      ]);
    });

    it("should tolerate unquoted simple attribute values", () => {
      const input = "[venue id=biz-007 layout=compact]";
      const result = parseArticleContent(input);

      expect(result).toEqual<ArticleBlockNode[]>([
        {
          type: "venue",
          venueId: "biz-007",
          layout: "compact",
        },
      ]);
    });

    it("should handle excessive whitespace inside shortcode tags", () => {
      const input = '   [   venue     id = "biz-003"    layout = "compact"    ]   ';
      const result = parseArticleContent(input);

      expect(result).toEqual<ArticleBlockNode[]>([
        {
          type: "venue",
          venueId: "biz-003",
          layout: "compact",
        },
      ]);
    });
  });

  describe("Tier 3: Error Handling & Adversarial Robustness", () => {
    it("should treat unclosed brackets as plain text paragraph without throwing", () => {
      const input = 'Check out this venue: [venue id="biz-001" and keep reading.';
      const result = parseArticleContent(input);

      expect(result).toEqual<ArticleBlockNode[]>([
        {
          type: "paragraph",
          content: 'Check out this venue: [venue id="biz-001" and keep reading.',
        },
      ]);
    });

    it("should treat unrecognized shortcodes as fallback paragraph text", () => {
      const input = '[unknown_shortcode foo="bar"]';
      const result = parseArticleContent(input);

      expect(result).toEqual<ArticleBlockNode[]>([
        {
          type: "paragraph",
          content: '[unknown_shortcode foo="bar"]',
        },
      ]);
    });

    it("should safely parse unicode and special characters inside attributes", () => {
      const input =
        '[cta category="tours-activities" label="Alanya’s Sunset Yacht Cruise & Mağara Turu" subtext="Damlataş & Kleopatra koylarında %100 rehberli deneyim!"]';
      const result = parseArticleContent(input);

      expect(result).toEqual<ArticleBlockNode[]>([
        {
          type: "cta",
          category: "tours-activities",
          label: "Alanya’s Sunset Yacht Cruise & Mağara Turu",
          subtext: "Damlataş & Kleopatra koylarında %100 rehberli deneyim!",
        },
      ]);
    });

    it("should safely handle shortcodes containing script tags or html entities without executing", () => {
      const input = '[venue id="<script>alert(1)</script>"]';
      const result = parseArticleContent(input);

      expect(result).toEqual<ArticleBlockNode[]>([
        {
          type: "venue",
          venueId: "<script>alert(1)</script>",
          layout: "card",
        },
      ]);
    });
  });

  describe("Tier 4: Mixed Real-World Document Parsing", () => {
    it("should parse an interleaved travel article with paragraphs, headings, venues, and CTAs", () => {
      const articleMarkdown = `
## A Gourmet Weekend in Alanya

Alanya offers a vibrant culinary scene with rooftop dining and fresh Mediterranean seafood.

[venue id="biz-001"]

If you prefer a quick bite near Damlataş, check out local street food stalls.

[venue id="biz-004" layout="compact"]

### Planning Your Culinary Tour

Make sure to book terrace tables ahead of sunset for the best castle views.

[cta category="restaurants-cafes" label="View All 40+ Alanya Restaurants" subtext="Curated by local gastronomy experts"]

Enjoy your food journey in Alanya!
`.trim();

      const result = parseArticleContent(articleMarkdown);

      expect(result).toHaveLength(9);
      expect(result[0]).toEqual({ type: "heading", level: 2, content: "A Gourmet Weekend in Alanya" });
      expect(result[1]).toEqual({
        type: "paragraph",
        content: "Alanya offers a vibrant culinary scene with rooftop dining and fresh Mediterranean seafood.",
      });
      expect(result[2]).toEqual({ type: "venue", venueId: "biz-001", layout: "card" });
      expect(result[3]).toEqual({
        type: "paragraph",
        content: "If you prefer a quick bite near Damlataş, check out local street food stalls.",
      });
      expect(result[4]).toEqual({ type: "venue", venueId: "biz-004", layout: "compact" });
      expect(result[5]).toEqual({ type: "heading", level: 3, content: "Planning Your Culinary Tour" });
      expect(result[6]).toEqual({
        type: "paragraph",
        content: "Make sure to book terrace tables ahead of sunset for the best castle views.",
      });
      expect(result[7]).toEqual({
        type: "cta",
        category: "restaurants-cafes",
        label: "View All 40+ Alanya Restaurants",
        subtext: "Curated by local gastronomy experts",
      });
      expect(result[8]).toEqual({
        type: "paragraph",
        content: "Enjoy your food journey in Alanya!",
      });
    });
  });
});
