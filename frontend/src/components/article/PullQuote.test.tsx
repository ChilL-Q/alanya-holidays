import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import PullQuote from "./PullQuote";

describe("PullQuote Component", () => {
  const sampleQuote = "Standing on the battlements of Alanya Castle at twilight, the Mediterranean stretches out like molten gold.";
  const sampleAuthor = "Evliya Çelebi";
  const sampleRole = "Ottoman Travel Chronicler";

  describe("Tier 1: Core Functional Rendering", () => {
    it("renders semantic <blockquote> with quote text, author, and role attribution", () => {
      render(
        <PullQuote
          quote={sampleQuote}
          author={sampleAuthor}
          role={sampleRole}
        />
      );

      const blockquote = document.querySelector("blockquote");
      expect(blockquote).toBeInTheDocument();

      expect(screen.getByText(new RegExp(sampleQuote, "i"))).toBeInTheDocument();
      expect(screen.getByText(new RegExp(sampleAuthor, "i"))).toBeInTheDocument();
      expect(screen.getByText(new RegExp(sampleRole, "i"))).toBeInTheDocument();
    });

    it("renders quote without author or role when optional attribution props are omitted", () => {
      render(<PullQuote quote={sampleQuote} />);

      expect(screen.getByText(new RegExp(sampleQuote, "i"))).toBeInTheDocument();
      expect(document.querySelector("footer") || document.querySelector("cite")).toBeNull();
    });

    it("renders author without role when role is omitted", () => {
      render(<PullQuote quote={sampleQuote} author={sampleAuthor} />);

      expect(screen.getByText(new RegExp(sampleQuote, "i"))).toBeInTheDocument();
      expect(screen.getByText(new RegExp(sampleAuthor, "i"))).toBeInTheDocument();
      expect(screen.queryByText(new RegExp(sampleRole, "i"))).not.toBeInTheDocument();
    });
  });

  describe("Tier 2: Typography & Editorial Styling", () => {
    it("applies large serif typography and decorative styling classes", () => {
      const { container } = render(
        <PullQuote
          quote={sampleQuote}
          author={sampleAuthor}
          className="custom-quote-spacing"
        />
      );

      const blockquote = container.querySelector("blockquote");
      expect(blockquote).toBeInTheDocument();
      expect(blockquote?.className).toMatch(/serif|italic|text-xl|text-2xl/i);
      expect(container.firstChild).toHaveClass("custom-quote-spacing");
    });
  });

  describe("Tier 3: Boundary & Resilience", () => {
    it("handles empty quote string gracefully without crashing", () => {
      render(<PullQuote quote="" />);

      const blockquote = document.querySelector("blockquote");
      expect(blockquote).toBeInTheDocument();
    });
  });
});
