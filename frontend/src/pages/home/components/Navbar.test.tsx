import "@testing-library/jest-dom";
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import type { UserProfile } from "@/context/AuthContext";
import i18n from "@/i18n";

// Mock AuthContext
const mockSignOut = vi.fn();

let mockAuthState: {
  user: { id: string; email: string; created_at: string; user_metadata?: Record<string, unknown> } | null;
  profile: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  signOut: typeof mockSignOut;
} = {
  user: null,
  profile: null,
  loading: false,
  isAuthenticated: false,
  signOut: mockSignOut,
};

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => mockAuthState,
}));

// Mock notifications service to avoid background async errors
vi.mock("@/api-services/notifications.service", () => ({
  subscribeToUserNotifications: vi.fn(() => () => {}),
  notificationsService: {
    getUnreadCount: vi.fn().mockResolvedValue(0),
    getNotifications: vi.fn().mockResolvedValue([]),
  },
}));

// Mock favorites hook
vi.mock("@/hooks/useFavorites", () => ({
  useFavorites: () => ({
    favorites: new Set(),
    isFavorite: () => false,
    favoriteCount: 0,
  }),
}));

// Mock cart context
vi.mock("@/context/CartContext", () => ({
  useCart: () => ({
    itemCount: 0,
    items: [],
  }),
}));

function RouteDestination() {
  const location = useLocation();
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
  return <div data-testid="route-destination">{location.pathname}|{from || ""}</div>;
}

// Mock compare hook
vi.mock("@/hooks/useCompare", () => ({
  useCompare: () => ({
    selectedCount: 0,
  }),
}));

describe("Navbar Component (Milestone 5 — R4)", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("en");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does not advertise unfinished language variants", () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    expect(screen.queryByText("Русский")).not.toBeInTheDocument();
    expect(screen.queryByText("Türkçe")).not.toBeInTheDocument();
  });

  it("renders Sign In and Join Community links when unauthenticated", () => {
    mockAuthState = {
      user: null,
      profile: null,
      loading: false,
      isAuthenticated: false,
      signOut: mockSignOut,
    };

    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    const signInLinks = screen.getAllByRole("link", { name: /Sign In/i });
    expect(signInLinks.length).toBeGreaterThan(0);
    expect(signInLinks[0]).toHaveAttribute("href", "/login");
    expect(signInLinks[0]).toHaveClass("bg-white/15", "backdrop-blur-sm");
  });

  it("sends guests from New Thread to registration with a return path", () => {
    mockAuthState = {
      user: null,
      profile: null,
      loading: false,
      isAuthenticated: false,
      signOut: mockSignOut,
    };

    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<Navbar />} />
          <Route path="/register" element={<RouteDestination />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("link", { name: /New Thread/i }));

    expect(screen.getByTestId("route-destination")).toHaveTextContent(
      "/register|/new-thread",
    );
  });

  it("uses the Alanya coastal brand mark in the home link", () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    const homeLink = screen.getByRole("link", { name: "Alanya Holidays" });
    const brandImage = homeLink.querySelector("img");
    expect(brandImage).toHaveAttribute(
      "src",
      "/images/alanya-holidays-brand-mark-transparent.png",
    );
    expect(brandImage).not.toHaveClass("mix-blend-multiply");
    expect(brandImage?.parentElement).not.toHaveClass("bg-white");
  });

  it("shows only the brand mark on narrow mobile widths", () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    const brandText = screen.getByText("Alanya Holidays");
    expect(brandText).toHaveClass("hidden", "sm:block");
    expect(brandText).not.toHaveClass("block");
    expect(screen.getByRole("link", { name: "Alanya Holidays" }).querySelector("img")).toBeInTheDocument();
  });

  it("renders authenticated user avatar and opens dropdown with Settings & Favorites", async () => {
    mockAuthState = {
      user: {
        id: "usr-888",
        email: "traveler@alanya-holidays.com",
        created_at: "2026-02-01T00:00:00Z",
      },
      profile: {
        id: "usr-888",
        email: "traveler@alanya-holidays.com",
        full_name: "Elena Rostova",
        avatar_url: null,
        bio: "Travel lover",
        phone: "+90 555 1234",
        company_name: null,
        role: "user",
        iban: null,
        bank_name: null,
        bank_account_holder_name: null,
        crypto_wallet: null,
        social_links: {},
        created_at: "2026-02-01T00:00:00Z",
        updated_at: "2026-02-01T00:00:00Z",
      },
      loading: false,
      isAuthenticated: true,
      signOut: mockSignOut,
    };

    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    // Open desktop user dropdown
    const avatarButton = screen.getByRole("button", { name: /User Menu/i });
    expect(avatarButton).toBeInTheDocument();
    fireEvent.click(avatarButton);

    // Check menu contents
    expect(screen.getByText("Elena Rostova")).toBeInTheDocument();
    expect(screen.getByText("traveler@alanya-holidays.com")).toBeInTheDocument();

    // Verify "My Profile & Settings" link to /settings
    const settingsLink = screen.getByRole("link", { name: /My Profile & Settings/i });
    expect(settingsLink).toHaveAttribute("href", "/settings");

    // Verify "Favorites & Activity" link to /settings?tab=activity
    const favoritesLink = screen.getByRole("link", { name: /Favorites & Activity/i });
    expect(favoritesLink).toHaveAttribute("href", "/settings?tab=activity");

    // Verify Sign Out button
    const signOutBtn = screen.getByRole("button", { name: /Sign Out/i });
    expect(signOutBtn).toBeInTheDocument();
    fireEvent.click(signOutBtn);

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
    });
  });

  it("renders Blog in the Discover menu", () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    fireEvent.click(screen.getAllByRole("button", { name: /Discover/i })[0]);

    const blogLinks = screen.getAllByRole("link", { name: /^Blog$/i });
    expect(blogLinks[0]).toHaveAttribute("href", "/blog");
  });

  it("connects the mobile menu button to the controlled navigation region", () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    const menuButton = screen.getByRole("button", { name: /Open menu/i });
    expect(menuButton).toHaveAttribute("aria-controls", "mobile-navigation");
    expect(menuButton).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(menuButton);

    expect(screen.getByRole("button", { name: /Close menu/i })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(document.getElementById("mobile-navigation")).toBeInTheDocument();
  });

  it("keeps desktop navigation at xl while tablets use the hamburger", () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    const desktopDiscover = screen.getAllByRole("button", { name: /Discover/i })[0];
    const desktopNavigation = desktopDiscover.parentElement?.parentElement?.parentElement;
    expect(desktopNavigation).toHaveClass("hidden", "xl:flex");
    expect(desktopNavigation).not.toHaveClass("md:flex");

    const menuButton = screen.getByRole("button", { name: /Open menu/i });
    expect(menuButton.parentElement).toHaveClass("xl:hidden");
    expect(menuButton.parentElement).not.toHaveClass("md:hidden");
  });

  it("locks body scroll and constrains the mobile menu to the dynamic viewport", () => {
    document.body.style.overflow = "visible";

    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /Open menu/i }));

    expect(document.body.style.overflow).toBe("hidden");
    expect(document.getElementById("mobile-navigation")).toHaveClass(
      "overflow-y-auto",
      "overscroll-contain",
      "max-h-[calc(100dvh-4rem)]",
    );

    fireEvent.keyDown(window, { key: "Escape" });
    expect(document.getElementById("mobile-navigation")).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe("visible");
    document.body.style.overflow = "";
  });

  it("localizes the Home link in the mobile menu", async () => {
    await i18n.changeLanguage("ru");

    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /Открыть меню/i }));

    const mobileNavigation = document.getElementById("mobile-navigation");
    expect(mobileNavigation).not.toBeNull();
    expect(
      within(mobileNavigation!).getByRole("link", { name: "Главная" }),
    ).toHaveAttribute("href", "/");
  });

  it("renders Shop dropdown with Shop Marketplace link", () => {
    mockAuthState = {
      user: null,
      profile: null,
      loading: false,
      isAuthenticated: false,
      signOut: mockSignOut,
    };

    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    const shopButtons = screen.getAllByRole("button", { name: /Shop/i });
    expect(shopButtons.length).toBeGreaterThan(0);
    fireEvent.click(shopButtons[0]);

    const marketplaceLinks = screen.getAllByRole("link", { name: /Shop Marketplace/i });
    expect(marketplaceLinks.length).toBeGreaterThan(0);
    expect(marketplaceLinks[0]).toHaveAttribute("href", "/shop");
  });
});
