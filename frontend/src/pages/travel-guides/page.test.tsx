import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import TravelGuidesPage from "./page";
import { blogService, mockTravelGuides } from "@/api-services/blog.service";

vi.mock("@/pages/home/components/Navbar", () => ({ default: () => <nav /> }));
vi.mock("@/pages/home/components/Footer", () => ({ default: () => <footer /> }));
vi.mock("@/components/base/PageHeroImage", () => ({ default: () => null }));
vi.mock("@/pages/travel-guides/components/GuideModal", () => ({ default: () => null }));
vi.mock("@/pages/travel-guides/components/SubmitGuideModal", () => ({ default: () => null }));
vi.mock("@/api-services/blog.service", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api-services/blog.service")>();
  return {
    ...actual,
    blogService: {
      getTags: vi.fn().mockResolvedValue([]),
      getPosts: vi.fn(),
    },
  };
});

describe("TravelGuidesPage", () => {
  beforeEach(() => {
    vi.mocked(blogService.getPosts).mockRejectedValue(new Error("offline"));
  });

  it("keeps curated guides visible when the API is unavailable", async () => {
    render(
      <MemoryRouter>
        <TravelGuidesPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText(mockTravelGuides[0].title)).toBeInTheDocument();
  });
});
