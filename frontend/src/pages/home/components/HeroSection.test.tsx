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

  it("renders Explore Alanya CTA linking to /explore and no planner links", () => {
    render(
      <MemoryRouter>
        <HeroSection />
      </MemoryRouter>
    );

    const exploreLink = screen.getByRole("link", { name: /explore alanya/i });
    expect(exploreLink).toBeInTheDocument();
    expect(exploreLink).toHaveAttribute("href", "/explore");

    expect(screen.queryByRole("link", { name: /quick start/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /plan your holiday/i })).not.toBeInTheDocument();
  });

  it("keeps the Explore CTA compact and visible within the mobile hero contract", () => {
    const { container } = render(
      <MemoryRouter>
        <HeroSection />
      </MemoryRouter>
    );

    expect(container.querySelector("section")).toHaveClass("min-h-screen");
    expect(screen.getByRole("link", { name: /explore alanya/i })).toHaveClass(
      "px-6",
      "py-3",
      "md:px-8",
      "md:py-4"
    );
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
