import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import ArticleCallout from "./ArticleCallout";

describe("ArticleCallout Component", () => {
  describe("Tier 1: 5 Editorial Callout Variants", () => {
    it("renders 'tip' variant with emerald styling and custom title", () => {
      render(
        <ArticleCallout
          variant="tip"
          title="Local's Tip"
          content="Arrive at Dim Cave early before 10 AM to avoid tour bus crowds."
        />
      );

      expect(screen.getByText("Local's Tip")).toBeInTheDocument();
      expect(
        screen.getByText("Arrive at Dim Cave early before 10 AM to avoid tour bus crowds.")
      ).toBeInTheDocument();

      const aside = document.querySelector("aside");
      expect(aside).toBeInTheDocument();
      expect(aside?.className).toMatch(/emerald|green|tip/i);
    });

    it("renders 'info' variant with blue styling", () => {
      render(
        <ArticleCallout
          variant="info"
          title="Opening Hours & Tickets"
          content="Red Tower museum is open daily from 09:00 to 19:00 during summer."
        />
      );

      expect(screen.getByText("Opening Hours & Tickets")).toBeInTheDocument();
      expect(
        screen.getByText("Red Tower museum is open daily from 09:00 to 19:00 during summer.")
      ).toBeInTheDocument();

      const aside = document.querySelector("aside");
      expect(aside?.className).toMatch(/blue|sky|info|primary/i);
    });

    it("renders 'warning' variant with amber/yellow warning styling", () => {
      render(
        <ArticleCallout
          variant="warning"
          title="Important Safety Note"
          content="Sea conditions at Cleopatra Beach can get rough during afternoon wind changes."
        />
      );

      expect(screen.getByText("Important Safety Note")).toBeInTheDocument();
      expect(
        screen.getByText("Sea conditions at Cleopatra Beach can get rough during afternoon wind changes.")
      ).toBeInTheDocument();

      const aside = document.querySelector("aside");
      expect(aside?.className).toMatch(/amber|yellow|warning|orange/i);
    });

    it("renders 'insider' variant with purple/indigo secret badge styling", () => {
      render(
        <ArticleCallout
          variant="insider"
          title="Secret Photo Spot"
          content="Climb to the outer wall behind Ehmedek castle for an uncrowded sunset panorama."
        />
      );

      expect(screen.getByText("Secret Photo Spot")).toBeInTheDocument();
      expect(
        screen.getByText("Climb to the outer wall behind Ehmedek castle for an uncrowded sunset panorama.")
      ).toBeInTheDocument();

      const aside = document.querySelector("aside");
      expect(aside?.className).toMatch(/purple|indigo|violet|insider/i);
    });

    it("renders 'quote' variant with editorial quote styling", () => {
      render(
        <ArticleCallout
          variant="quote"
          content="The turquoise waters of Alanya remain one of the Mediterranean's best kept secrets."
        />
      );

      expect(
        screen.getByText("The turquoise waters of Alanya remain one of the Mediterranean's best kept secrets.")
      ).toBeInTheDocument();
    });
  });

  describe("Tier 2: Title Configurations & Children Content", () => {
    it("renders cleanly without custom title and displays content directly", () => {
      render(
        <ArticleCallout
          variant="tip"
          content="Always carry cash in Turkish Lira for small dolmuş bus fares."
        />
      );

      expect(
        screen.getByText("Always carry cash in Turkish Lira for small dolmuş bus fares.")
      ).toBeInTheDocument();
    });

    it("supports rendering React children instead of string content prop", () => {
      render(
        <ArticleCallout variant="info" title="Rich Content Callout">
          <p>Paragraph 1 with <strong data-testid="bold-text">bold text</strong>.</p>
          <p>Paragraph 2 with extra advice.</p>
        </ArticleCallout>
      );

      expect(screen.getByText("Rich Content Callout")).toBeInTheDocument();
      expect(screen.getByTestId("bold-text")).toHaveTextContent("bold text");
      expect(screen.getByText("Paragraph 2 with extra advice.")).toBeInTheDocument();
    });
  });

  describe("Tier 3: Custom Styling & Dark Mode Tokens", () => {
    it("applies custom className to aside container", () => {
      const { container } = render(
        <ArticleCallout
          variant="tip"
          content="Custom class test"
          className="shadow-xl rounded-3xl"
        />
      );

      expect(container.firstChild).toHaveClass("shadow-xl");
      expect(container.firstChild).toHaveClass("rounded-3xl");
    });
  });
});
