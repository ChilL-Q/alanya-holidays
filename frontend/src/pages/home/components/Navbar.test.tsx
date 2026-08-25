import "@testing-library/jest-dom";
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Navbar from "./Navbar";
import type { UserProfile } from "@/context/AuthContext";

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

// Mock compare hook
vi.mock("@/hooks/useCompare", () => ({
  useCompare: () => ({
    selectedCount: 0,
  }),
}));

describe("Navbar Component (Milestone 5 — R4)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
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
