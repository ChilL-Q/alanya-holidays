import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import HeroSection from "./HeroSection";

describe("HeroSection Component", () => {
  it("renders hero title and subtitle with proper brand styling", () => {
    render(
      <MemoryRouter>
        <HeroSection />
      </MemoryRouter>
    );

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent(/ALANYA/i);
    expect(heading).toHaveTextContent(/HOLIDAYS/i);
    expect(screen.getByText(/Plan your perfect Mediterranean escape/i)).toBeInTheDocument();
  });

  it("renders Quick Start CTA linking to /planner?quickstart=suggested-1", () => {
    render(
      <MemoryRouter>
        <HeroSection />
      </MemoryRouter>
    );

    const quickStartLink = screen.getByRole("link", { name: /quick start/i });
    expect(quickStartLink).toBeInTheDocument();
    expect(quickStartLink).toHaveAttribute("href", "/planner?quickstart=suggested-1");
  });

  it("renders secondary exploration links (Plan Your Holiday and Explore Alanya)", () => {
    render(
      <MemoryRouter>
        <HeroSection />
      </MemoryRouter>
    );

    const planLink = screen.getByRole("link", { name: /plan your holiday/i });
    expect(planLink).toHaveAttribute("href", "/planner");

    const exploreLink = screen.getByRole("link", { name: /explore alanya/i });
    expect(exploreLink).toHaveAttribute("href", "/explore");
  });

  it("displays community statistics bar with members, experiences, and reviews", () => {
    render(
      <MemoryRouter>
        <HeroSection />
      </MemoryRouter>
    );

    expect(screen.getAllByText(/travelers/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Experiences/i)).toBeInTheDocument();
    expect(screen.getByText(/Reviews/i)).toBeInTheDocument();
  });
});
