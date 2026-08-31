import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { forumService } from "@/api-services/forum.service";
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

  it("displays community statistics bar with members, discussions, and replies", () => {
    render(
      <MemoryRouter>
        <HeroSection />
      </MemoryRouter>
    );

    expect(screen.getAllByText(/travelers/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Discussions/i)).toBeInTheDocument();
    expect(screen.getByText(/Replies/i)).toBeInTheDocument();
  });

  it("renders honest live community metrics from the forum stats endpoint", async () => {
    vi.spyOn(forumService, "getForumStats").mockResolvedValue({
      totalDiscussions: 8,
      activeMembers: 27,
      questionsAnswered: 19,
      localExperts: 0,
      onlineMembers: 3,
      totalMembers: 27,
    });

    render(
      <MemoryRouter>
        <HeroSection />
      </MemoryRouter>
    );

    expect(await screen.findByText("27 travelers discovering Alanya")).toBeInTheDocument();
    expect(screen.getByText("27")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("19")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("Discussions")).toBeInTheDocument();
    expect(screen.getByText("Replies")).toBeInTheDocument();
    expect(screen.getByText("Online Now")).toBeInTheDocument();
    expect(screen.queryByText("Local Experts")).not.toBeInTheDocument();
  });
});
