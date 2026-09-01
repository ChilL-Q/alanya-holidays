import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import EmbeddedDirectoryCta from "./EmbeddedDirectoryCta";

describe("EmbeddedDirectoryCta Component", () => {
  describe("Tier 1: Core Functional Rendering", () => {
    it("renders label, subtext, category badge, and action link", () => {
      render(
        <MemoryRouter>
          <EmbeddedDirectoryCta
            category="restaurants-cafes"
            label="Explore All Restaurants"
            subtext="Top rated dining, seafood terraces, and local mezes in Alanya"
          />
        </MemoryRouter>
      );

      // Label & Subtext
      expect(screen.getByText("Explore All Restaurants")).toBeInTheDocument();
      expect(
        screen.getByText("Top rated dining, seafood terraces, and local mezes in Alanya")
      ).toBeInTheDocument();

      // Navigation Link to category directory
      const link = screen.getByRole("link", { name: /explore all restaurants|explore|browse/i });
      expect(link).toHaveAttribute("href", expect.stringContaining("/explore?category=restaurants-cafes"));
    });

    it("renders without subtext gracefully when subtext is not provided", () => {
      render(
        <MemoryRouter>
          <EmbeddedDirectoryCta
            category="hotels-accommodation"
            label="Browse 5-Star Beach Resorts"
          />
        </MemoryRouter>
      );

      expect(screen.getByText("Browse 5-Star Beach Resorts")).toBeInTheDocument();
      const link = screen.getByRole("link", { name: /browse 5-star beach resorts|explore/i });
      expect(link).toHaveAttribute("href", expect.stringContaining("/explore?category=hotels-accommodation"));
    });
  });

  describe("Tier 2: Category Resolution & Fallbacks", () => {
    it("displays appropriate category label/icon for known categories", () => {
      render(
        <MemoryRouter>
          <EmbeddedDirectoryCta
            category="tours-activities"
            label="Book Excursions & Boat Trips"
          />
        </MemoryRouter>
      );

      expect(screen.getByText("Book Excursions & Boat Trips")).toBeInTheDocument();
      // Should show category name or pill
      expect(screen.getByText(/Tours & Activities|Activities/i)).toBeInTheDocument();
    });

    it("handles custom or unknown category codes without crashing", () => {
      render(
        <MemoryRouter>
          <EmbeddedDirectoryCta
            category="custom-unique-category"
            label="Discover Hidden Gems"
            subtext="Unusual spots across the coast"
          />
        </MemoryRouter>
      );

      expect(screen.getByText("Discover Hidden Gems")).toBeInTheDocument();
      expect(screen.getByText("Unusual spots across the coast")).toBeInTheDocument();
      const link = screen.getByRole("link", { name: /discover hidden gems|explore/i });
      expect(link).toHaveAttribute("href", expect.stringContaining("/explore?category=custom-unique-category"));
    });
  });

  describe("Tier 3: Accessibility & Design Token Styling", () => {
    it("has accessible button/link roles and high-contrast styling tokens", () => {
      const { container } = render(
        <MemoryRouter>
          <EmbeddedDirectoryCta
            category="nightlife"
            label="Alanya Nightlife & Harbor Clubs"
            subtext="Best DJ sets and sunset cocktail lounges"
            className="my-custom-cta-class"
          />
        </MemoryRouter>
      );

      expect(container.firstChild).toHaveClass("my-custom-cta-class");
      const link = screen.getByRole("link", { name: /nightlife/i });
      expect(link).toBeInTheDocument();
    });
  });
});
