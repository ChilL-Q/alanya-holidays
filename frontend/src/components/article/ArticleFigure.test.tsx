import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import ArticleFigure from "./ArticleFigure";

describe("ArticleFigure Component", () => {
  const sampleSrc = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e";
  const sampleCaption = "Sunset over Cleopatra Beach and the Mediterranean Sea";
  const sampleCredit = "Photo by Sarah Jenkins / Unsplash";

  describe("Tier 1: Core Functional Rendering", () => {
    it("renders semantic <figure> and responsive <img> with alt text", () => {
      render(
        <ArticleFigure
          src={sampleSrc}
          caption={sampleCaption}
          credit={sampleCredit}
          alt="Alanya Beach Landscape"
        />
      );

      const figure = document.querySelector("figure");
      expect(figure).toBeInTheDocument();

      const img = screen.getByRole("img", { name: "Alanya Beach Landscape" });
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute("src", sampleSrc);
      expect(img).toHaveAttribute("loading", "lazy");
    });

    it("renders <figcaption> with caption text and photo credit", () => {
      render(
        <ArticleFigure
          src={sampleSrc}
          caption={sampleCaption}
          credit={sampleCredit}
        />
      );

      const figcaption = document.querySelector("figcaption");
      expect(figcaption).toBeInTheDocument();
      expect(screen.getByText(sampleCaption)).toBeInTheDocument();
      expect(screen.getByText(new RegExp(sampleCredit, "i"))).toBeInTheDocument();
    });

    it("falls back to caption for alt text when alt prop is omitted", () => {
      render(<ArticleFigure src={sampleSrc} caption={sampleCaption} />);

      const img = screen.getByRole("img", { name: sampleCaption });
      expect(img).toBeInTheDocument();
    });
  });

  describe("Tier 2: Lightbox Zoom Preview & Interactivity", () => {
    it("opens full-screen image lightbox when image or zoom button is clicked", () => {
      render(
        <ArticleFigure
          src={sampleSrc}
          caption={sampleCaption}
          credit={sampleCredit}
          allowZoom={true}
        />
      );

      const img = screen.getByRole("img", { name: new RegExp(sampleCaption, "i") });
      fireEvent.click(img);

      // Lightbox dialog / modal should now be open
      const dialog = screen.getByRole("dialog", { name: /image preview|lightbox/i }) ||
        document.querySelector("[data-testid='image-lightbox']");
      expect(dialog).toBeInTheDocument();

      // Lightbox should display the enlarged image and caption
      const enlargedImgs = screen.getAllByRole("img");
      expect(enlargedImgs.length).toBeGreaterThanOrEqual(2);
      expect(screen.getAllByText(sampleCaption).length).toBeGreaterThanOrEqual(1);
    });

    it("closes lightbox when close button or backdrop overlay is clicked", () => {
      render(
        <ArticleFigure
          src={sampleSrc}
          caption={sampleCaption}
          allowZoom={true}
        />
      );

      // Open lightbox
      const img = screen.getByRole("img", { name: new RegExp(sampleCaption, "i") });
      fireEvent.click(img);

      const closeButton = screen.getByRole("button", { name: /close|dismiss/i });
      expect(closeButton).toBeInTheDocument();
      fireEvent.click(closeButton);

      // Modal should be closed
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  describe("Tier 3: Error Handling & Fallback Image", () => {
    it("handles image load failure by swapping to a safe fallback image placeholder", () => {
      render(
        <ArticleFigure
          src="https://invalid-image-domain-404.com/not-found.jpg"
          caption="Failed Image Test"
        />
      );

      const img = screen.getByRole("img", { name: /Failed Image Test/i });
      fireEvent.error(img);

      // Should replace src with fallback placeholder
      expect(img.getAttribute("src")).toContain("unsplash.com");
    });
  });

  describe("Tier 4: Boundary Cases & Styling Tokens", () => {
    it("renders cleanly without figcaption when both caption and credit are omitted", () => {
      render(<ArticleFigure src={sampleSrc} />);

      expect(document.querySelector("figcaption")).toBeNull();
      const img = screen.getByRole("img");
      expect(img).toBeInTheDocument();
    });

    it("applies custom className to figure wrapper", () => {
      const { container } = render(
        <ArticleFigure src={sampleSrc} className="custom-figure-shadow" />
      );

      expect(container.firstChild).toHaveClass("custom-figure-shadow");
    });
  });
});
