import { render, screen } from "@testing-library/react";
import { beforeEach, describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import ArticleContentRenderer from "./ArticleContentRenderer";
import type { ArticleBlockNode } from "./types";
import { directoryService } from "@/api-services/directory.service";
import { businesses } from "@/domain/directory-businesses";

describe("ArticleContentRenderer Component", () => {
  it("links only strict allowed protocols and relative paths in Markdown", () => {
    render(
      <MemoryRouter>
        <ArticleContentRenderer
          content={[
            "[HTTPS](https://example.com/guide)",
            "[Mail](mailto:hello@example.com)",
            "[Phone](tel:+905551234567)",
            "[Root](/travel-guides)",
            "[Relative](../blog)",
            "[Script](javascript:alert(1))",
            "[Data](data:text/html,boom)",
            "[VB](vbscript:msgbox(1))",
          ].join(" ")}
        />
      </MemoryRouter>
    );

    expect(screen.getByRole("link", { name: "HTTPS" })).toHaveAttribute(
      "href",
      "https://example.com/guide",
    );
    expect(screen.getByRole("link", { name: "Mail" })).toHaveAttribute(
      "href",
      "mailto:hello@example.com",
    );
    expect(screen.getByRole("link", { name: "Phone" })).toHaveAttribute(
      "href",
      "tel:+905551234567",
    );
    expect(screen.getByRole("link", { name: "Root" })).toHaveAttribute(
      "href",
      "/travel-guides",
    );
    expect(screen.getByRole("link", { name: "Relative" })).toHaveAttribute(
      "href",
      "../blog",
    );
    expect(screen.queryByRole("link", { name: "Script" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Data" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "VB" })).not.toBeInTheDocument();
  });
  beforeEach(() => {
    vi.spyOn(directoryService, "getListingById").mockImplementation(async (id) =>
      businesses.find((business) => business.id === id) ?? null
    );
  });

  describe("Tier 1: Markdown & Basic Content Rendering", () => {
    it("renders plain paragraph blocks", () => {
      const rawText = "Alanya has over 300 days of sunshine each year.";
      render(
        <MemoryRouter>
          <ArticleContentRenderer content={rawText} />
        </MemoryRouter>
      );

      expect(
        screen.getByText("Alanya has over 300 days of sunshine each year.")
      ).toBeInTheDocument();
    });

    it("renders markdown headings with correct semantic heading levels", () => {
      const content = "## Section 2 Heading\n\n### Section 3 Subheading";
      render(
        <MemoryRouter>
          <ArticleContentRenderer content={content} />
        </MemoryRouter>
      );

      const h2 = screen.getByRole("heading", { level: 2, name: "Section 2 Heading" });
      const h3 = screen.getByRole("heading", { level: 3, name: "Section 3 Subheading" });
      expect(h2).toBeInTheDocument();
      expect(h3).toBeInTheDocument();
    });
  });

  describe("Tier 2: In-Article Interactive Embeds (Venue & CTA)", () => {
    it("renders embedded venue cards from [venue id='...'] shortcode", async () => {
      const rawContent = `
Explore our featured rooftop dining spot:

[venue id="biz-001"]

Continue reading about Mediterranean flavors.
      `.trim();

      render(
        <MemoryRouter>
          <ArticleContentRenderer content={rawContent} />
        </MemoryRouter>
      );

      expect(screen.getByText("Explore our featured rooftop dining spot:")).toBeInTheDocument();
      expect(await screen.findByText("Kale Panorama Restaurant")).toBeInTheDocument();
      expect(screen.getByText("Continue reading about Mediterranean flavors.")).toBeInTheDocument();
    });

    it("renders embedded compact venue cards from [venue layout='compact'] shortcode", async () => {
      const rawContent = `
Recommended quick stop:

[venue id="biz-001" layout="compact"]
      `.trim();

      render(
        <MemoryRouter>
          <ArticleContentRenderer content={rawContent} />
        </MemoryRouter>
      );

      expect(await screen.findByText("Kale Panorama Restaurant")).toBeInTheDocument();
      expect(screen.getByText("4.8")).toBeInTheDocument();
    });

    it("renders interactive directory CTA banners from [cta] shortcode", () => {
      const rawContent = `
[cta category="restaurants-cafes" label="Explore All 40+ Alanya Restaurants" subtext="Top rated seafood and traditional Turkish cuisine"]
      `.trim();

      render(
        <MemoryRouter>
          <ArticleContentRenderer content={rawContent} />
        </MemoryRouter>
      );

      expect(screen.getByText("Explore All 40+ Alanya Restaurants")).toBeInTheDocument();
      expect(
        screen.getByText("Top rated seafood and traditional Turkish cuisine")
      ).toBeInTheDocument();
      const link = screen.getByRole("link", { name: /explore all 40\+ alanya restaurants/i });
      expect(link).toHaveAttribute("href", expect.stringContaining("/explore?category=restaurants-cafes"));
    });
  });

  describe("Tier 3: Pre-Parsed AST Node Array Rendering", () => {
    it("renders directly from pre-parsed ArticleBlockNode array", async () => {
      const nodes: ArticleBlockNode[] = [
        { type: "heading", level: 2, content: "Custom Parsed Section" },
        { type: "paragraph", content: "Directly passing parsed AST objects for performance." },
        { type: "venue", venueId: "biz-001", layout: "card" },
        {
          type: "cta",
          category: "hotels-accommodation",
          label: "Book Alanya Hotels",
          subtext: "Best beachfront resorts",
        },
      ];

      render(
        <MemoryRouter>
          <ArticleContentRenderer content={nodes} />
        </MemoryRouter>
      );

      expect(screen.getByRole("heading", { level: 2, name: "Custom Parsed Section" })).toBeInTheDocument();
      expect(screen.getByText("Directly passing parsed AST objects for performance.")).toBeInTheDocument();
      expect(await screen.findByText("Kale Panorama Restaurant")).toBeInTheDocument();
      expect(screen.getByText("Book Alanya Hotels")).toBeInTheDocument();
    });
  });

  describe("Tier 4: Boundary, Malformed, and Robustness Cases", () => {
    it("sanitizes rich HTML and renders an embedded CTA in saved document order", () => {
      const content = '<p>Before<script>alert(1)</script></p><p>[cta category="restaurants" label="Reserve now"]</p><p>After</p>';
      render(<MemoryRouter><ArticleContentRenderer content={content} /></MemoryRouter>);

      expect(screen.getByText('Before')).toBeInTheDocument();
      expect(screen.getByText('Reserve now')).toBeInTheDocument();
      expect(screen.getByText('After')).toBeInTheDocument();
      expect(document.querySelector('script')).not.toBeInTheDocument();
    });

    it("renders empty container without crashing when content is empty", () => {
      const { container } = render(
        <MemoryRouter>
          <ArticleContentRenderer content="" />
        </MemoryRouter>
      );

      expect(container).toBeDefined();
    });

    it("handles unknown shortcodes gracefully as fallback text without throwing", () => {
      const rawContent = `
Here is an unrecognized shortcode:

[unsupported_embed data="xyz"]

The rest of the article still renders cleanly.
      `.trim();

      render(
        <MemoryRouter>
          <ArticleContentRenderer content={rawContent} />
        </MemoryRouter>
      );

      expect(screen.getByText("Here is an unrecognized shortcode:")).toBeInTheDocument();
      expect(screen.getByText(/unsupported_embed/)).toBeInTheDocument();
      expect(screen.getByText("The rest of the article still renders cleanly.")).toBeInTheDocument();
    });

    it("applies custom className to wrapper container", () => {
      const { container } = render(
        <MemoryRouter>
          <ArticleContentRenderer content="Hello world" className="prose-custom-article" />
        </MemoryRouter>
      );

      expect(container.firstChild).toHaveClass("prose-custom-article");
    });
  });

  describe("Tier 5: Milestone 2 Rich Media & Editorial Typography Integration", () => {
    it("renders embedded video player from [video] shortcode", () => {
      const rawContent = `
Watch our video guide:

[video src="https://www.youtube.com/watch?v=dQw4w9WgXcQ" caption="Alanya Castle Drone Footage" provider="youtube"]
      `.trim();

      render(
        <MemoryRouter>
          <ArticleContentRenderer content={rawContent} />
        </MemoryRouter>
      );

      expect(screen.getByText("Watch our video guide:")).toBeInTheDocument();
      const iframe = document.querySelector("iframe");
      expect(iframe).toBeInTheDocument();
      expect(iframe).toHaveAttribute(
        "src",
        expect.stringContaining("youtube-nocookie.com/embed/dQw4w9WgXcQ")
      );
      expect(screen.getByText("Alanya Castle Drone Footage")).toBeInTheDocument();
    });

    it("renders captioned figure with credit from [figure] shortcode", () => {
      const rawContent = `
[figure src="https://images.unsplash.com/photo-beach.jpg" caption="Golden hour at Cleopatra Beach" credit="Sarah J." alt="Cleopatra Beach"]
      `.trim();

      render(
        <MemoryRouter>
          <ArticleContentRenderer content={rawContent} />
        </MemoryRouter>
      );

      const figure = document.querySelector("figure");
      expect(figure).toBeInTheDocument();
      const img = screen.getByRole("img", { name: "Cleopatra Beach" });
      expect(img).toHaveAttribute("src", "https://images.unsplash.com/photo-beach.jpg");
      expect(screen.getByText("Golden hour at Cleopatra Beach")).toBeInTheDocument();
      expect(screen.getByText(/Sarah J\./)).toBeInTheDocument();
    });

    it("renders editorial callout box from [callout] shortcode", () => {
      const rawContent = `
[callout variant="tip" title="Local Insider Secret" content="Visit Dim Cave before 10 AM to avoid crowds."]
      `.trim();

      render(
        <MemoryRouter>
          <ArticleContentRenderer content={rawContent} />
        </MemoryRouter>
      );

      expect(screen.getByText("Local Insider Secret")).toBeInTheDocument();
      expect(
        screen.getByText("Visit Dim Cave before 10 AM to avoid crowds.")
      ).toBeInTheDocument();
      const aside = document.querySelector("aside");
      expect(aside).toBeInTheDocument();
    });

    it("renders editorial pull quote from [pullquote] shortcode", () => {
      const rawContent = `
[pullquote quote="The view from the fortress walls takes your breath away." author="Marcus Aurelius" role="Ancient Emperor"]
      `.trim();

      render(
        <MemoryRouter>
          <ArticleContentRenderer content={rawContent} />
        </MemoryRouter>
      );

      const blockquote = document.querySelector("blockquote");
      expect(blockquote).toBeInTheDocument();
      expect(
        screen.getByText(/The view from the fortress walls takes your breath away\./i)
      ).toBeInTheDocument();
      expect(screen.getByText(/Marcus Aurelius/i)).toBeInTheDocument();
      expect(screen.getByText(/Ancient Emperor/i)).toBeInTheDocument();
    });

    it("renders a full mixed multimedia article with all 7 block types", async () => {
      const fullDoc = `
## A Complete Traveler's Guide to Alanya

Alanya offers an unforgettable blend of history and beaches.

[callout variant="tip" title="Quick Summary" content="Read our top picks below."]

[figure src="https://images.unsplash.com/photo-castle.jpg" caption="Alanya Castle at sunset" credit="Local Guide"]

[venue id="biz-001"]

[video src="https://www.youtube.com/watch?v=dQw4w9WgXcQ" caption="Video Tour"]

[pullquote quote="The most beautiful coast in Turkey." author="Sarah Jenkins"]

[cta category="restaurants-cafes" label="View Top Restaurants" subtext="Best dining in town"]
      `.trim();

      render(
        <MemoryRouter>
          <ArticleContentRenderer content={fullDoc} />
        </MemoryRouter>
      );

      expect(
        screen.getByRole("heading", { level: 2, name: "A Complete Traveler's Guide to Alanya" })
      ).toBeInTheDocument();
      expect(screen.getByText("Quick Summary")).toBeInTheDocument();
      expect(screen.getByText("Alanya Castle at sunset")).toBeInTheDocument();
      expect(await screen.findByText("Kale Panorama Restaurant")).toBeInTheDocument();
      expect(screen.getByText("Video Tour")).toBeInTheDocument();
      expect(screen.getByText(/The most beautiful coast in Turkey\./i)).toBeInTheDocument();
      expect(screen.getByText("View Top Restaurants")).toBeInTheDocument();
    });
  });
});
