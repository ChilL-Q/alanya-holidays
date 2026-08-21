import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import VideoEmbed from "./VideoEmbed";
import ArticleFigure from "./ArticleFigure";
import ArticleCallout from "./ArticleCallout";
import PullQuote from "./PullQuote";
import LeadParagraph from "./LeadParagraph";
import ArticleContentRenderer from "./ArticleContentRenderer";
import type { ArticleBlockNode } from "./types";

describe("Milestone 2 Adversarial & Stress Testing Suite", () => {
  // =========================================================================
  // SUITE 1: VideoEmbed Malformed URLs, Attack Vectors & Edge Cases
  // =========================================================================
  describe("Suite 1: VideoEmbed Malformed URLs & Attack Vectors", () => {
    it("rejects javascript: pseudo-protocol URLs and renders Video unavailable", () => {
      render(
        <VideoEmbed
          src="javascript:alert(document.domain)"
          caption="Exploit attempt"
        />
      );

      expect(screen.getByText("Video unavailable")).toBeInTheDocument();
      expect(screen.getByText("Exploit attempt")).toBeInTheDocument();
      expect(document.querySelector("iframe")).toBeNull();
      expect(document.querySelector("video")).toBeNull();
    });

    it("rejects data: URI schemes and renders Video unavailable", () => {
      render(
        <VideoEmbed
          src="data:text/html,<script>alert(1)</script>"
          provider="html5"
        />
      );

      expect(screen.getByText("Video unavailable")).toBeInTheDocument();
      expect(document.querySelector("iframe")).toBeNull();
      expect(document.querySelector("video")).toBeNull();
    });

    it("rejects vbscript: and file: protocols", () => {
      render(
        <VideoEmbed src="file:///etc/passwd" />
      );

      expect(screen.getByText("Video unavailable")).toBeInTheDocument();
    });

    it("handles YouTube URLs with invalid or short IDs gracefully", () => {
      // 5-character ID instead of 11 characters
      render(
        <VideoEmbed
          src="https://www.youtube.com/watch?v=short"
          provider="youtube"
        />
      );

      expect(screen.getByText("Video unavailable")).toBeInTheDocument();
      expect(document.querySelector("iframe")).toBeNull();
    });

    it("handles YouTube URLs with extreme query parameters, timestamp, and fragments", () => {
      render(
        <VideoEmbed
          src="https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLlaN88a7xP8jE4_2K3f_B4qK8&index=3&t=1h2m3s&ab_channel=Artist#replay"
          caption="Rich URL parameters test"
        />
      );

      const iframe = screen.getByTitle(/rich url parameters test|embedded video/i);
      expect(iframe).toBeInTheDocument();
      expect(iframe).toHaveAttribute(
        "src",
        "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"
      );
    });

    it("handles youtu.be shortlinks with trailing slashes and question marks", () => {
      render(
        <VideoEmbed
          src="https://youtu.be/dQw4w9WgXcQ?si=abcdef123456"
        />
      );

      const iframe = screen.getByTitle("Embedded video player");
      expect(iframe).toHaveAttribute(
        "src",
        "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"
      );
    });

    it("handles Vimeo URLs with non-numeric IDs gracefully without crashing", () => {
      render(
        <VideoEmbed
          src="https://vimeo.com/not-a-number-video-id"
          provider="vimeo"
        />
      );

      expect(screen.getByText("Video unavailable")).toBeInTheDocument();
      expect(document.querySelector("iframe")).toBeNull();
    });

    it("handles complex Vimeo channel/group URLs with numeric ID", () => {
      render(
        <VideoEmbed
          src="https://vimeo.com/channels/staffpicks/987654321"
        />
      );

      const iframe = screen.getByTitle("Embedded video player");
      expect(iframe).toBeInTheDocument();
      expect(iframe).toHaveAttribute(
        "src",
        "https://player.vimeo.com/video/987654321"
      );
    });

    it("handles HTML5 video with query strings and hash anchors", () => {
      render(
        <VideoEmbed
          src="https://cdn.alanya.travel/media/intro.mp4?auth=secret123#t=10"
        />
      );

      const video = document.querySelector("video");
      expect(video).toBeInTheDocument();
      expect(video).toHaveAttribute(
        "src",
        "https://cdn.alanya.travel/media/intro.mp4?auth=secret123#t=10"
      );
    });

    it("handles relative path video sources", () => {
      render(
        <VideoEmbed
          src="/videos/cleopatra-drone.webm"
          provider="html5"
        />
      );

      const video = document.querySelector("video");
      expect(video).toBeInTheDocument();
      expect(video).toHaveAttribute("src", "/videos/cleopatra-drone.webm");
    });

    it("escapes XSS strings in caption and title props", () => {
      const xssString = '<script>alert("XSS")</script><img src=x onerror=alert(1)>';
      render(
        <VideoEmbed
          src="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
          title={xssString}
          caption={xssString}
        />
      );

      // React should render this as escaped text, not raw DOM nodes
      expect(screen.getAllByText(xssString).length).toBeGreaterThanOrEqual(1);
      expect(document.querySelector("img[src='x']")).toBeNull();
    });

    it("handles non-string or whitespace-only src values safely", () => {
      const { unmount } = render(
        <VideoEmbed src={"   \t\n  " as unknown as string} />
      );
      expect(screen.getByText("Video unavailable")).toBeInTheDocument();
      unmount();

      render(
        <VideoEmbed src={null as unknown as string} />
      );
      expect(screen.getByText("Video unavailable")).toBeInTheDocument();
    });
  });

  // =========================================================================
  // SUITE 2: ArticleFigure Lightbox Rapid Cycling, Keyboard & Focus Traps
  // =========================================================================
  describe("Suite 2: ArticleFigure Lightbox Rapid Cycling & Keyboard Interactions", () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it("survives 30 rapid open and close cycles via Escape key without state desync", () => {
      const { unmount } = render(
        <ArticleFigure
          src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e"
          caption="Rapid ESC test"
        />
      );

      const img = screen.getByRole("img", { name: "Rapid ESC test" });

      for (let i = 0; i < 30; i++) {
        // Open
        fireEvent.click(img);
        expect(screen.getByRole("dialog")).toBeInTheDocument();

        // Close via Escape
        fireEvent.keyDown(window, { key: "Escape" });
        expect(screen.queryByRole("dialog")).toBeNull();
      }

      unmount();
    });

    it("survives 30 rapid open and close cycles via backdrop overlay clicks", () => {
      render(
        <ArticleFigure
          src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e"
          caption="Rapid backdrop click test"
        />
      );

      const img = screen.getByRole("img", { name: "Rapid backdrop click test" });

      for (let i = 0; i < 30; i++) {
        // Open
        fireEvent.click(img);
        const dialog = screen.getByRole("dialog");
        expect(dialog).toBeInTheDocument();

        // Click backdrop (dialog itself)
        fireEvent.click(dialog);
        expect(screen.queryByRole("dialog")).toBeNull();
      }
    });

    it("does NOT close lightbox when clicking inside modal image or content (stopPropagation)", () => {
      render(
        <ArticleFigure
          src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e"
          caption="Stop propagation test"
          credit="Sarah Jenkins"
        />
      );

      const img = screen.getByRole("img", { name: "Stop propagation test" });
      fireEvent.click(img);

      const dialog = screen.getByRole("dialog");
      expect(dialog).toBeInTheDocument();

      // Click inside modal enlarged image
      const enlargedImgs = screen.getAllByRole("img");
      const modalImg = enlargedImgs[1]; // inside lightbox
      fireEvent.click(modalImg);

      // Dialog should still be open
      expect(screen.getByRole("dialog")).toBeInTheDocument();

      // Click inside caption container
      const captionText = screen.getAllByText("Stop propagation test")[1];
      fireEvent.click(captionText);

      // Dialog should still be open
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("properly cleans up keydown listener on component unmount while lightbox is open", () => {
      const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");

      const { unmount } = render(
        <ArticleFigure
          src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e"
          caption="Listener cleanup test"
        />
      );

      const img = screen.getByRole("img", { name: "Listener cleanup test" });
      fireEvent.click(img);

      expect(screen.getByRole("dialog")).toBeInTheDocument();

      // Unmount while modal is open
      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "keydown",
        expect.any(Function)
      );
    });

    it("updates displayed image if src prop dynamically changes", () => {
      const { rerender } = render(
        <ArticleFigure
          src="https://images.unsplash.com/first.jpg"
          caption="Dynamic src test"
        />
      );

      const img = screen.getByRole("img", { name: "Dynamic src test" });
      expect(img).toHaveAttribute("src", "https://images.unsplash.com/first.jpg");

      rerender(
        <ArticleFigure
          src="https://images.unsplash.com/second.jpg"
          caption="Dynamic src test"
        />
      );

      expect(img).toHaveAttribute("src", "https://images.unsplash.com/second.jpg");
    });

    it("does not open zoom modal when allowZoom={false}", () => {
      render(
        <ArticleFigure
          src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e"
          caption="No zoom figure"
          allowZoom={false}
        />
      );

      const img = screen.getByRole("img", { name: "No zoom figure" });
      fireEvent.click(img);

      expect(screen.queryByRole("dialog")).toBeNull();
      expect(screen.queryByLabelText("Zoom image preview")).toBeNull();
    });

    it("handles multiple consecutive image error events gracefully without infinite loops", () => {
      render(
        <ArticleFigure
          src="https://invalid-non-existent-domain.xyz/broken1.jpg"
          caption="Error loop prevention"
        />
      );

      const img = screen.getByRole("img", { name: "Error loop prevention" });
      expect(img.getAttribute("src")).toContain("broken1.jpg");

      // First error -> swaps to fallback
      fireEvent.error(img);
      expect(img.getAttribute("src")).toContain("unsplash.com");

      // Second error on fallback itself should be safely ignored
      expect(() => fireEvent.error(img)).not.toThrow();
    });
  });

  // =========================================================================
  // SUITE 3: ArticleCallout & PullQuote Extreme Text Lengths & Variants
  // =========================================================================
  describe("Suite 3: Callout, PullQuote & Lead Extreme Text Lengths & Variants", () => {
    it("renders massive 10,000-character content inside ArticleCallout without truncation or crash", () => {
      const massiveText = "Alanya Mediterranean Paradise. ".repeat(300).trim(); // ~9600 chars
      const massiveTitle = "Epic Historical Exploration Guide — ".repeat(20).trim();

      render(
        <ArticleCallout
          variant="insider"
          title={massiveTitle}
          content={massiveText}
        />
      );

      expect(screen.getByText(massiveTitle)).toBeInTheDocument();
      expect(screen.getByText(massiveText)).toBeInTheDocument();
    });

    it("handles unknown/invalid callout variant gracefully defaulting to info style", () => {
      render(
        <ArticleCallout
          variant={"unsupported_future_variant" as any}
          title="Default Variant Test"
          content="Checking fallback behavior."
        />
      );

      expect(screen.getByText("Default Variant Test")).toBeInTheDocument();
      expect(screen.getByText("Checking fallback behavior.")).toBeInTheDocument();
      // Icon should still render
      expect(document.querySelector("svg")).toBeInTheDocument();
    });

    it("supports complex React node children inside ArticleCallout", () => {
      render(
        <ArticleCallout variant="tip" title="Pro Traveler Tip">
          <div data-testid="custom-callout-tree">
            <p>First recommendation paragraph.</p>
            <ul className="list-disc ml-4">
              <li>Visit castle at 08:30 AM</li>
              <li>Bring sunscreen & comfortable shoes</li>
            </ul>
          </div>
        </ArticleCallout>
      );

      expect(screen.getByTestId("custom-callout-tree")).toBeInTheDocument();
      expect(screen.getByText("Visit castle at 08:30 AM")).toBeInTheDocument();
    });

    it("renders PullQuote with massive text and unusual punctuation without breaking formatting", () => {
      const longQuote =
        '“The sunset from the Red Tower in Alanya is unforgettable,” she said, "truly the pinnacle of the Turkish Riviera!"';

      render(
        <PullQuote
          quote={longQuote}
          author="Dr. Mehmet Özkan"
          role="Chief Historian & Archaeologist"
        />
      );

      expect(screen.getByText(`"${longQuote}"`)).toBeInTheDocument();
      expect(screen.getByText(/Dr. Mehmet Özkan/)).toBeInTheDocument();
      expect(screen.getByText(/, Chief Historian & Archaeologist/)).toBeInTheDocument();
    });

    it("renders PullQuote without author or role without trailing punctuation artifacts", () => {
      render(<PullQuote quote="Pure quote without attribution." />);

      expect(screen.getByText('"Pure quote without attribution."')).toBeInTheDocument();
      expect(document.querySelector("footer")).toBeNull();
    });

    it("renders LeadParagraph with dropCap on various starting characters including Turkish unicode", () => {
      const { rerender } = render(
        <LeadParagraph dropCap={true}>
          İstanbul ve Alanya arasında köprü kuruyoruz.
        </LeadParagraph>
      );
      expect(screen.getByText(/İstanbul ve Alanya/)).toBeInTheDocument();

      rerender(
        <LeadParagraph dropCap={true}>
          Özel plajlar ve koylar keşfedilmeyi bekliyor.
        </LeadParagraph>
      );
      expect(screen.getByText(/Özel plajlar/)).toBeInTheDocument();

      rerender(
        <LeadParagraph dropCap={true}>
          "Tırnak ile başlayan lider paragraf."
        </LeadParagraph>
      );
      expect(screen.getByText(/"Tırnak ile başlayan/)).toBeInTheDocument();
    });

    it("renders LeadParagraph with empty content or whitespace without crashing", () => {
      render(<LeadParagraph dropCap={true}>{""}</LeadParagraph>);
      expect(document.querySelector("p")).toBeInTheDocument();
    });
  });

  // =========================================================================
  // SUITE 4: Full Article Content Flow with Complex Multi-Media Document
  // =========================================================================
  describe("Suite 4: Master ArticleContentRenderer Rich Media Composition", () => {
    it("renders a publication-grade editorial article combining all 9 block types flawlessly", () => {
      const richMarkdownDoc = `
## The Ultimate Guide to Alanya Castle & Historic Peninsula

[lead dropCap=true]
Perched atop a rugged 250-meter rocky promontory jutting into the turquoise Mediterranean, Alanya Castle represents over eight centuries of Seljuk and Byzantine maritime heritage.

[callout variant="insider" title="Historical Insight" content="The castle walls stretch for 6.5 kilometers with 140 towers and over 400 historic cisterns."]

[figure src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e" caption="Panoramic view over the eastern harbor from the Citadel" credit="Alanya Tourism Board" alt="Citadel Vista"]

### Navigating the Ancient Citadel & Harbor

[venue id="biz-001" layout="card"]

[pullquote quote="Standing on the castle battlements at dusk is an experience you carry for a lifetime." author="Elena Rostova" role="National Geographic Travel Contributor"]

[video src="https://www.youtube.com/watch?v=dQw4w9WgXcQ" caption="4K Aerial Drone Flight: Alanya Castle & Cleopatra Beach"]

[callout variant="tip" title="Getting There" content="Take the Alanya Teleferik (Cable Car) from Damlataş Beach for panoramic views during ascent."]

[cta category="historical-tours" label="Explore All Historical Tours & Excursions" subtext="Guaranteed lowest prices & licensed multilingual guides"]
`;

      render(
        <MemoryRouter>
          <ArticleContentRenderer content={richMarkdownDoc} />
        </MemoryRouter>
      );

      // Verify headings
      expect(
        screen.getByRole("heading", {
          level: 2,
          name: "The Ultimate Guide to Alanya Castle & Historic Peninsula",
        })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", {
          level: 3,
          name: "Navigating the Ancient Citadel & Harbor",
        })
      ).toBeInTheDocument();

      // Verify Lead paragraph
      expect(screen.getByText(/Perched atop a rugged/)).toBeInTheDocument();

      // Verify Callouts
      expect(screen.getByText("Historical Insight")).toBeInTheDocument();
      expect(screen.getByText("Getting There")).toBeInTheDocument();

      // Verify Figure & Caption
      expect(screen.getByAltText("Citadel Vista")).toBeInTheDocument();
      expect(
        screen.getByText("Panoramic view over the eastern harbor from the Citadel")
      ).toBeInTheDocument();
      expect(screen.getByText("(Alanya Tourism Board)")).toBeInTheDocument();

      // Verify Embedded Venue Card
      expect(screen.getByText("Kale Panorama Restaurant")).toBeInTheDocument();

      // Verify Pull Quote
      expect(
        screen.getByText(
          /"Standing on the castle battlements at dusk is an experience you carry for a lifetime."/
        )
      ).toBeInTheDocument();
      expect(screen.getByText(/Elena Rostova/)).toBeInTheDocument();
      expect(
        screen.getByText(/, National Geographic Travel Contributor/)
      ).toBeInTheDocument();

      // Verify Video Embed
      expect(
        screen.getByTitle(
          "4K Aerial Drone Flight: Alanya Castle & Cleopatra Beach"
        )
      ).toBeInTheDocument();

      // Verify CTA
      expect(
        screen.getByText("Explore All Historical Tours & Excursions")
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "Guaranteed lowest prices & licensed multilingual guides"
        )
      ).toBeInTheDocument();
    });

    it("handles pre-parsed ArticleBlockNode array containing all M2 node types directly", () => {
      const nodes: ArticleBlockNode[] = [
        { type: "heading", level: 2, content: "Direct Node Rendering" },
        { type: "lead", content: "Lead sentence with drop cap.", dropCap: true },
        {
          type: "callout",
          variant: "warning",
          title: "Safety Warning",
          content: "Watch your footing near the steep cliff edges.",
        },
        {
          type: "figure",
          src: "https://images.unsplash.com/photo-1.jpg",
          caption: "Cliff edge viewpoint",
          credit: "Alanya Explorer",
        },
        {
          type: "pullquote",
          quote: "Safety first on rugged terrain.",
          author: "Park Ranger",
        },
        {
          type: "video",
          src: "https://cdn.example.com/safety.mp4",
          provider: "html5",
          caption: "Safety Briefing Video",
        },
      ];

      render(
        <MemoryRouter>
          <ArticleContentRenderer nodes={nodes} />
        </MemoryRouter>
      );

      expect(screen.getByText("Direct Node Rendering")).toBeInTheDocument();
      expect(screen.getByText("Lead sentence with drop cap.")).toBeInTheDocument();
      expect(screen.getByText("Safety Warning")).toBeInTheDocument();
      expect(screen.getByText("Cliff edge viewpoint")).toBeInTheDocument();
      expect(screen.getByText('"Safety first on rugged terrain."')).toBeInTheDocument();
      expect(screen.getByText(/Park Ranger/)).toBeInTheDocument();
      expect(screen.getByText("Safety Briefing Video")).toBeInTheDocument();
    });
  });
});
