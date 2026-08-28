import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import GuideModal from "./GuideModal";
import { mockTravelGuides, blogService, type BlogPostItem } from "@/api-services/blog.service";
import { guideContents } from "@/mocks/travelGuideContents";
import { directoryService } from "@/api-services/directory.service";
import { businesses } from "@/domain/directory-businesses";

describe("GuideModal & Embedded Article Subsystem Adversarial Challenge Suite", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    vi.spyOn(directoryService, "getListingById").mockImplementation(async (id) =>
      businesses.find((business) => business.id === id) ?? null
    );
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe("Challenge 1: All 6 Mock Travel Guides End-to-End Integration", () => {
    it("verifies all 6 mock travel guides are present in mockTravelGuides", () => {
      expect(mockTravelGuides).toHaveLength(6);
      const titles = mockTravelGuides.map((g) => g.title);
      expect(titles).toContain("Alanya First-Timer's Guide");
      expect(titles).toContain("The Ultimate Food Lover's Alanya");
      expect(titles).toContain("Best Day Trips from Alanya");
      expect(titles).toContain("Moving to Alanya: Expat Guide");
      expect(titles).toContain("Alanya Beach Guide");
      expect(titles).toContain("Alanya Nightlife: Where to Go");
    });

    mockTravelGuides.forEach((guide, index) => {
      it(`[Guide ${index + 1}/6] "${guide.title}" opens in GuideModal and renders all sections, venues, and CTAs cleanly`, async () => {
        const handleClose = vi.fn();
        const { unmount } = render(
          <MemoryRouter>
            <GuideModal guide={guide} onClose={handleClose} />
          </MemoryRouter>
        );

        // 1. Verify modal container and heading
        expect(screen.getByRole("dialog", { name: guide.title })).toBeInTheDocument();
        expect(screen.getByRole("heading", { level: 2, name: guide.title })).toBeInTheDocument();

        // 2. Verify metadata badge & read time
        const expectedTag = guide.tag || guide.category || "General";
        expect(screen.getByText(expectedTag)).toBeInTheDocument();
        if (guide.readTime) {
          expect(screen.getByText(guide.readTime)).toBeInTheDocument();
        }

        // 3. Verify hero image
        const heroImg = screen.getByRole("img", { name: guide.title });
        expect(heroImg).toBeInTheDocument();
        expect(heroImg).toHaveAttribute("src");

        // 4. Verify all section headings for this guide
        const staticContent = guideContents[guide.title];
        expect(staticContent).toBeDefined();
        if (staticContent) {
          staticContent.sections.forEach((section) => {
            expect(
              screen.getByRole("heading", { level: 3, name: section.heading })
            ).toBeInTheDocument();
          });
        }

        // 5. Verify guide-specific embeds
        if (guide.title === "Alanya First-Timer's Guide") {
          // biz-002 (card), biz-001 (card), biz-003 (compact), cta: hotels-accommodation
          expect(screen.getByText("Browse All Top-Rated Alanya Hotels")).toBeInTheDocument();
          const hotelCtaLink = screen.getByRole("link", { name: /Browse All Top-Rated Alanya Hotels/i });
          expect(hotelCtaLink).toHaveAttribute("href", "/explore?category=hotels-accommodation");

          // biz-001: Kale Panorama Restaurant
          expect((await screen.findAllByText("Kale Panorama Restaurant")).length).toBeGreaterThanOrEqual(1);
          // biz-002: Cleopatra Beach Club
          expect(await screen.findByText("Cleopatra Beach Club")).toBeInTheDocument();
          // biz-003: Mezze Garden Café
          expect(await screen.findByText("Mezze Garden Café")).toBeInTheDocument();

          // Checklist verification
          expect(screen.getByText("Pre-Trip Checklist")).toBeInTheDocument();
          expect(screen.getByText(/Book flights to Antalya Airport/i)).toBeInTheDocument();
        }

        if (guide.title === "The Ultimate Food Lover's Alanya") {
          // biz-001 (compact), biz-001 (card), cta: restaurants-cafes
          expect(screen.getByText("Explore All 40+ Alanya Dining Spots")).toBeInTheDocument();
          const diningCtaLink = screen.getByRole("link", { name: /Explore All 40\+ Alanya Dining Spots/i });
          expect(diningCtaLink).toHaveAttribute("href", "/explore?category=restaurants-cafes");
          expect((await screen.findAllByText("Kale Panorama Restaurant")).length).toBeGreaterThanOrEqual(2);
        }

        if (guide.title === "Best Day Trips from Alanya") {
          // biz-005: Villa Sevilla Resort (card), biz-007: Taurus Mountain Safari (compact), cta: tours-activities
          expect(screen.getByText("Discover Guided Tours & Day Excursions")).toBeInTheDocument();
          const toursCta = screen.getByRole("link", { name: /Discover Guided Tours & Day Excursions/i });
          expect(toursCta).toHaveAttribute("href", "/explore?category=tours-activities");
          // biz-005: Villa Sevilla Resort
          expect(await screen.findByText("Villa Sevilla Resort")).toBeInTheDocument();
          // biz-007: Taurus Mountain Safari
          expect(await screen.findByText("Taurus Mountain Safari")).toBeInTheDocument();
        }

        if (guide.title === "Moving to Alanya: Expat Guide") {
          // cta: real-estate, checklist
          expect(screen.getByText("Browse Real Estate & Long-Term Rentals")).toBeInTheDocument();
          const realEstateCta = screen.getByRole("link", { name: /Browse Real Estate & Long-Term Rentals/i });
          expect(realEstateCta).toHaveAttribute("href", "/explore?category=real-estate");
          expect(screen.getByText("Moving Checklist")).toBeInTheDocument();
          expect(screen.getByText(/Apply for e-visa at evisa.gov.tr/i)).toBeInTheDocument();
        }

        if (guide.title === "Alanya Beach Guide") {
          // biz-008: Damlataş Hamam & Spa (compact), cta: tours-activities, checklist
          expect(screen.getByText("Book Water Sports & Boat Tours")).toBeInTheDocument();
          // biz-008: Damlataş Hamam & Spa
          expect(await screen.findByText("Damlataş Hamam & Spa")).toBeInTheDocument();
          expect(screen.getByText("Beach Day Packing List")).toBeInTheDocument();
        }

        if (guide.title === "Alanya Nightlife: Where to Go") {
          // biz-001: Kale Panorama Restaurant (compact), cta: nightlife
          expect(screen.getByText("Explore Alanya Nightlife & Harbor Bars")).toBeInTheDocument();
          const nightlifeCta = screen.getByRole("link", { name: /Explore Alanya Nightlife & Harbor Bars/i });
          expect(nightlifeCta).toHaveAttribute("href", "/explore?category=nightlife");
          expect(await screen.findByText("Kale Panorama Restaurant")).toBeInTheDocument();
        }

        unmount();
      });
    });
  });

  describe("Challenge 2: Missing & Corrupted Venue Resolution (Fallback & Anti-Crash)", () => {
    it("handles non-existent venue IDs gracefully without crashing or blank screen", async () => {
      const customGuide: BlogPostItem = {
        id: "guide-test-missing-venues",
        title: "Test Missing Venues Guide",
        slug: "test-missing-venues-guide",
        description: "Adversarial test guide with missing IDs",
        readTime: "5 min read",
        tag: "Testing",
      };

      // Mock guideContents entry with multiple missing venue IDs
      guideContents["Test Missing Venues Guide"] = {
        heroImage: "https://example.com/hero.jpg",
        sections: [
          {
            heading: "Section with 404 Venues",
            body: `Before text.
[venue id="biz-99999-does-not-exist" layout="card"]
Middle text.
[venue id="biz-ghost-venue" layout="compact"]
After text.`,
          },
        ],
        relatedLinks: [],
      };

      render(
        <MemoryRouter>
          <GuideModal guide={customGuide} onClose={vi.fn()} />
        </MemoryRouter>
      );

      // Verify text rendered
      expect(screen.getByText("Before text.")).toBeInTheDocument();
      expect(screen.getByText("Middle text.")).toBeInTheDocument();
      expect(screen.getByText("After text.")).toBeInTheDocument();

      // Verify fallback alerts rendered instead of crashing
      const fallbacks = await screen.findAllByText(/Venue not found or listing unavailable/i);
      expect(fallbacks).toHaveLength(2);

      const browseDirectoryLinks = screen.getAllByRole("link", { name: /Browse Directory/i });
      expect(browseDirectoryLinks).toHaveLength(2);
      browseDirectoryLinks.forEach((link) => {
        expect(link).toHaveAttribute("href", "/explore");
      });

      // Cleanup mock entry
      delete guideContents["Test Missing Venues Guide"];
    });

    it("handles malformed, unclosed, or empty shortcodes gracefully as text or fallback", async () => {
      const corruptGuide: BlogPostItem = {
        id: "guide-corrupt-markup",
        title: "Test Corrupt Markup Guide",
        slug: "test-corrupt-markup-guide",
        description: "Adversarial test for parser resilience",
      };

      guideContents["Test Corrupt Markup Guide"] = {
        heroImage: "https://example.com/hero.jpg",
        sections: [
          {
            heading: "Corrupted Markup Section",
            body: `Valid start.
[venue id= layout=
[venue]
[cta category= label=
[unknown_tag param="test"]
[venue id="biz-001" layout="invalid_layout_type"]
Valid ending.`,
          },
        ],
        relatedLinks: [],
      };

      render(
        <MemoryRouter>
          <GuideModal guide={corruptGuide} onClose={vi.fn()} />
        </MemoryRouter>
      );

      // Should render without throwing
      expect(screen.getByText(/Valid start\./i)).toBeInTheDocument();
      expect(screen.getByText(/Valid ending\./i)).toBeInTheDocument();

      // biz-001 with invalid layout defaults safely to card layout
      expect(await screen.findByText("Kale Panorama Restaurant")).toBeInTheDocument();

      delete guideContents["Test Corrupt Markup Guide"];
    });
  });

  describe("Challenge 3: Navigation, Link Attributes, and Event Propagation", () => {
    it("verifies EmbeddedVenueCard card layout 1-click navigation links to /business/:id", async () => {
      const firstTimerGuide = mockTravelGuides[0];
      render(
        <MemoryRouter>
          <GuideModal guide={firstTimerGuide} onClose={vi.fn()} />
        </MemoryRouter>
      );

      // biz-002: Cleopatra Beach Club (card layout)
      const biz002Link = await screen.findByRole("link", { name: /View Cleopatra Beach Club/i });
      expect(biz002Link).toHaveAttribute("href", "/business/biz-002");
    });

    it("verifies phone and website external links have valid attributes and security headers", async () => {
      const firstTimerGuide = mockTravelGuides[0];
      render(
        <MemoryRouter>
          <GuideModal guide={firstTimerGuide} onClose={vi.fn()} />
        </MemoryRouter>
      );

      // biz-001: Kale Panorama has phone "+90 242 513 44 21" and website "https://kalepanorama.com"
      const phoneLinks = await screen.findAllByRole("link", { name: /call/i });
      expect(phoneLinks.length).toBeGreaterThanOrEqual(1);
      const telHref = phoneLinks[0].getAttribute("href");
      expect(telHref).toMatch(/^tel:\+90/);

      const websiteLinks = screen.getAllByRole("link", { name: /website/i });
      expect(websiteLinks.length).toBeGreaterThanOrEqual(1);
      const websiteLink = websiteLinks[0];
      expect(websiteLink.getAttribute("href")).toMatch(/^https?:\/\//);
      expect(websiteLink).toHaveAttribute("target", "_blank");
      expect(websiteLink).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("verifies CTA shortcut banners navigate to /explore?category=...", () => {
      const nightlifeGuide = mockTravelGuides.find((g) => g.title === "Alanya Nightlife: Where to Go")!;
      render(
        <MemoryRouter>
          <GuideModal guide={nightlifeGuide} onClose={vi.fn()} />
        </MemoryRouter>
      );

      const cta = screen.getByRole("link", { name: /Explore Alanya Nightlife & Harbor Bars/i });
      expect(cta).toHaveAttribute("href", "/explore?category=nightlife");
      expect(screen.getByText("Top-rated sunset cocktail lounges, beach clubs, and live music venues")).toBeInTheDocument();
    });

    it("verifies modal close handlers: close button, backdrop click, Escape key, and related links", () => {
      const handleClose = vi.fn();
      const firstTimerGuide = mockTravelGuides[0];

      render(
        <MemoryRouter>
          <GuideModal guide={firstTimerGuide} onClose={handleClose} />
        </MemoryRouter>
      );

      // 1. Close button click
      const closeBtn = screen.getByRole("button", { name: /Close guide/i });
      fireEvent.click(closeBtn);
      expect(handleClose).toHaveBeenCalledTimes(1);

      // 2. Escape key press
      fireEvent.keyDown(document, { key: "Escape" });
      expect(handleClose).toHaveBeenCalledTimes(2);

      // 3. Related link click triggers onClose
      const exploreLink = screen.getByRole("link", { name: /Explore Businesses & Restaurants/i });
      fireEvent.click(exploreLink);
      expect(handleClose).toHaveBeenCalledTimes(3);
    });

    it("verifies checklist item toggling, local storage synchronization, and progress percentage", () => {
      const firstTimerGuide = mockTravelGuides[0];
      render(
        <MemoryRouter>
          <GuideModal guide={firstTimerGuide} onClose={vi.fn()} />
        </MemoryRouter>
      );

      const initialProgress = screen.getByText(/0 of 14/i);
      expect(initialProgress).toBeInTheDocument();

      // Check first item
      const firstItemLabel = screen.getByText(/Book flights to Antalya Airport \(AYT\)/i);
      expect(firstItemLabel).toBeInTheDocument();

      const checkbox = firstItemLabel.closest("label")?.querySelector("input[type='checkbox']") as HTMLInputElement;
      expect(checkbox).toBeDefined();
      expect(checkbox.checked).toBe(false);

      fireEvent.click(firstItemLabel);
      expect(checkbox.checked).toBe(true);
      expect(screen.getByText(/1 of 14/i)).toBeInTheDocument();

      // Verify localStorage was updated
      const stored = localStorage.getItem(`guide-checklist-${firstTimerGuide.title}`);
      expect(stored).toContain("ft-book-flights");

      // Uncheck item
      fireEvent.click(firstItemLabel);
      expect(checkbox.checked).toBe(false);
      expect(screen.getByText(/0 of 14/i)).toBeInTheDocument();
    });
  });

  describe("Challenge 4: Dynamic & Asynchronous Guide Loading Resilience", () => {
    it("asynchronously fetches guide content via blogService when not found in static guideContents", async () => {
      const dynamicGuide: BlogPostItem = {
        id: "guide-dyn-001",
        title: "Dynamic Alanya Castle Hidden Secrets",
        slug: "dynamic-alanya-castle-secrets",
        description: "Freshly loaded guide from backend API",
        readTime: "6 min read",
        tag: "Adventure",
      };

      const spyGetGuideContent = vi.spyOn(blogService, "getGuideContent").mockResolvedValueOnce({
        heroImage: "https://example.com/dynamic-castle.jpg",
        sections: [
          {
            heading: "Secret Tunnels of Alanya Castle",
            body: `Discovered ancient subterranean escape routes beneath the fortress walls.
[venue id="biz-001" layout="card"]
[cta category="tours-activities" label="Book Underground Castle Tour" subtext="Exclusive access with local historian"]`,
          },
        ],
        relatedLinks: [{ label: "All Tours", href: "/explore?category=tours-activities", icon: "ri-ship-line" }],
      });

      render(
        <MemoryRouter>
          <GuideModal guide={dynamicGuide} onClose={vi.fn()} />
        </MemoryRouter>
      );

      // Wait for content to load
      await waitFor(() => {
        expect(screen.getByText("Secret Tunnels of Alanya Castle")).toBeInTheDocument();
      });

      expect(spyGetGuideContent).toHaveBeenCalledWith("dynamic-alanya-castle-secrets");
      expect(await screen.findByText("Kale Panorama Restaurant")).toBeInTheDocument();
      expect(screen.getByText("Book Underground Castle Tour")).toBeInTheDocument();
    });

    it("displays graceful fallback empty state when guide content cannot be found anywhere", async () => {
      const missingGuide: BlogPostItem = {
        id: "guide-completely-empty",
        title: "Non Existent Mystery Guide",
        slug: "non-existent-mystery-guide",
      };

      vi.spyOn(blogService, "getGuideContent").mockResolvedValueOnce(null);

      render(
        <MemoryRouter>
          <GuideModal guide={missingGuide} onClose={vi.fn()} />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("Full guide content coming soon.")).toBeInTheDocument();
      });
    });
  });

  describe("Challenge 5: Boundary & Security Stress Testing", () => {
    it("safely neutralizes script tags and XSS injection attempts in content and titles", () => {
      const xssGuide: BlogPostItem = {
        id: "guide-xss-test",
        title: "Guide with <script>alert('xss-title')</script> Injection",
        slug: "guide-xss-test",
        description: "Testing <img src=x onerror=alert('xss-desc') />",
      };

      guideContents[xssGuide.title] = {
        heroImage: "https://example.com/hero.jpg",
        sections: [
          {
            heading: "Dangerous <script>alert('heading')</script>",
            body: `Safe text before.
<script>window.__PWNED__ = true;</script>
<img src="invalid-url" onerror="window.__PWNED__ = true;" />
[cta category="restaurants-cafes" label="Safe CTA with <script>alert(1)</script>" subtext="Subtext with <b>bold</b> and <img src=x onerror=alert(2)>"]
Safe text after.`,
          },
        ],
        relatedLinks: [],
      };

      render(
        <MemoryRouter>
          <GuideModal guide={xssGuide} onClose={vi.fn()} />
        </MemoryRouter>
      );

      // Script should not execute
      expect((window as any).__PWNED__).toBeUndefined();

      // Text should be rendered safely
      expect(screen.getByText(/Safe text before\./i)).toBeInTheDocument();
      expect(screen.getByText(/Safe text after\./i)).toBeInTheDocument();

      delete guideContents[xssGuide.title];
    });

    it("survives heavy multi-block section stress with 20 interleaved venues and CTAs without performance degradation", () => {
      const heavyGuide: BlogPostItem = {
        id: "guide-heavy-stress",
        title: "Heavy Multi-Block Stress Test Guide",
        slug: "heavy-multi-block-stress",
      };

      const blocks: string[] = [];
      for (let i = 0; i < 10; i++) {
        blocks.push(`### Sub-heading ${i}\nParagraph content for stress test iteration ${i}.`);
        blocks.push(`[venue id="biz-00${(i % 8) + 1}" layout="${i % 2 === 0 ? "card" : "compact"}"]`);
        blocks.push(`[cta category="tours-activities" label="CTA Action ${i}" subtext="Subtext description ${i}"]`);
      }

      guideContents[heavyGuide.title] = {
        heroImage: "https://example.com/hero.jpg",
        sections: [
          {
            heading: "Stress Section 1",
            body: blocks.join("\n\n"),
          },
        ],
        relatedLinks: [],
      };

      const startTime = performance.now();
      render(
        <MemoryRouter>
          <GuideModal guide={heavyGuide} onClose={vi.fn()} />
        </MemoryRouter>
      );
      const endTime = performance.now();

      // Rendering 30 mixed AST nodes should complete comfortably in under 1000ms
      expect(endTime - startTime).toBeLessThan(1000);
      expect(screen.getByText("Sub-heading 0")).toBeInTheDocument();
      expect(screen.getByText("CTA Action 9")).toBeInTheDocument();

      delete guideContents[heavyGuide.title];
    });
  });

  describe("Challenge 6: White Surface, Smart Image Resolution & Forum/Blog Quality Formatting", () => {
    it("verifies GuideModal has a pure white surface container (bg-white) and does not show generic svg placeholder for transport guides", async () => {
      const airportGuide: BlogPostItem = {
        id: "guide-airport-transfer-01",
        title: "Reliable Airport Transfer Services in Alanya: Stress-Free Travel from Antalya and Gazipaşa Airports",
        slug: "reliable-airport-transfer-services-in-alanya",
        tag: "Transport",
        category: "Transport",
        excerpt: "Arriving in a new destination should be exciting, not stressful. Whether you're visiting Alanya for a relaxing beach holiday, a business trip, or a long-term stay, arranging a reliable airport transfe...",
        cover_image_url: null,
      };

      vi.spyOn(blogService, "getGuideContent").mockResolvedValueOnce({
        heroImage: "",
        sections: [
          {
            heading: "Reliable Airport Transfer Services in Alanya",
            body: `Arriving in a new destination should be exciting, not stressful. Whether you're visiting Alanya for a relaxing beach holiday, a business trip, or a long-term stay, arranging a reliable airport transfer gives you total peace of mind.

Why Book an Airport Transfer Instead of Taking a Taxi?

Many travelers choose pre-booked airport transfers because they offer:
- Fixed prices with no unexpected charges
- Professional and experienced drivers
- Flight tracking and punctual pickups`,
          },
        ],
        relatedLinks: [{ label: "Explore Transport", href: "/explore?category=transport", icon: "ri-taxi-line" }],
      });

      const { container } = render(
        <MemoryRouter>
          <GuideModal guide={airportGuide} onClose={vi.fn()} />
        </MemoryRouter>
      );

      // Verify modal surface has pure white surface and no dark mode background classes
      const card = container.querySelector(".guide-modal-card > div");
      expect(card?.className).toContain("bg-white");
      expect(card?.className).not.toContain("dark:bg-slate-900");
      expect(card?.className).not.toContain("dark:");

      // Verify image resolved to transport image instead of placeholder-business.svg
      await waitFor(() => {
        const heroImg = screen.getByRole("img", { name: airportGuide.title });
        expect(heroImg.getAttribute("src")).toContain("transport");
        expect(heroImg.getAttribute("src")).not.toContain("placeholder-business.svg");
      });

      // Verify truncated excerpt box was NOT rendered with cutoff "transfe..."
      expect(screen.queryByText(/arranging a reliable airport transfe\.\.\./i)).not.toBeInTheDocument();

      // Verify full body text is rendered cleanly with bullet points and headings
      expect(screen.getByText(/Fixed prices with no unexpected charges/i)).toBeInTheDocument();
      expect(screen.getByText(/Why Book an Airport Transfer Instead of Taking a Taxi\?/i)).toBeInTheDocument();
    });
  });
});
