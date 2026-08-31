import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import TravelGuidesPage from "./page";
import { blogService, mockTravelGuides } from "@/api-services/blog.service";
import i18n from "@/i18n";

const authState = vi.hoisted(() => ({
  isAuthenticated: false,
  loading: false,
}));

vi.mock("@/pages/home/components/Navbar", () => ({ default: () => <nav /> }));
vi.mock("@/pages/home/components/Footer", () => ({ default: () => <footer /> }));
vi.mock("@/components/base/PageHeroImage", () => ({ default: () => null }));
vi.mock("@/pages/travel-guides/components/GuideModal", () => ({ default: () => null }));
vi.mock("@/pages/travel-guides/components/SubmitGuideModal", () => ({
  default: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div>Guide submission form</div> : null,
}));
vi.mock("@/context/AuthContext", () => ({
  useAuth: () => authState,
}));
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
  beforeEach(async () => {
    await i18n.changeLanguage("en");
    authState.isAuthenticated = false;
    authState.loading = false;
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

  it("redirects guests to sign in instead of opening the submission form", () => {
    render(
      <MemoryRouter initialEntries={["/travel-guides"]}>
        <Routes>
          <Route path="/travel-guides" element={<TravelGuidesPage />} />
          <Route path="/login" element={<div>Sign in to continue</div>} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: /submit community guide/i }));

    expect(screen.getByText("Sign in to continue")).toBeInTheDocument();
    expect(screen.queryByText("Guide submission form")).not.toBeInTheDocument();
  });

  it("opens the submission form for signed-in users", () => {
    authState.isAuthenticated = true;

    render(
      <MemoryRouter>
        <TravelGuidesPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: /submit community guide/i }));

    expect(screen.getByText("Guide submission form")).toBeInTheDocument();
  });
});
