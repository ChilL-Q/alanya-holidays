import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { FavoritesProvider, useFavorites } from "./useFavorites";
import { favoritesService } from "@/api-services/favorites.service";
import { AuthContext, type AuthContextType } from "@/context/AuthContext";

describe("useFavorites Hook (Instant UI & Resilient Cloud Sync)", () => {
  const STORAGE_KEY = "alanya_favorites";

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("should initialize with local storage data", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(["biz-101", "biz-102"]));
    vi.spyOn(favoritesService, "syncFavorites").mockResolvedValue(["biz-101", "biz-102"]);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <FavoritesProvider>{children}</FavoritesProvider>
    );

    const { result } = renderHook(() => useFavorites(), { wrapper });

    expect(result.current.isFavorite("biz-101")).toBe(true);
    expect(result.current.isFavorite("biz-102")).toBe(true);
    expect(result.current.isFavorite("biz-999")).toBe(false);
    expect(result.current.favoriteCount).toBe(2);
  });

  it("should toggle favorites synchronously and update localStorage immediately", () => {
    vi.spyOn(favoritesService, "syncFavorites").mockResolvedValue([]);
    const addSpy = vi.spyOn(favoritesService, "addFavorite").mockResolvedValue({ success: true });
    const removeSpy = vi.spyOn(favoritesService, "removeFavorite").mockResolvedValue({ success: true });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <FavoritesProvider>{children}</FavoritesProvider>
    );

    const { result } = renderHook(() => useFavorites(), { wrapper });

    expect(result.current.favoriteCount).toBe(0);

    // Add item
    act(() => {
      result.current.toggleFavorite("biz-201");
    });

    expect(result.current.isFavorite("biz-201")).toBe(true);
    expect(result.current.favoriteCount).toBe(1);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")).toContain("biz-201");
    expect(addSpy).toHaveBeenCalledWith("biz-201");

    // Remove item
    act(() => {
      result.current.toggleFavorite("biz-201");
    });

    expect(result.current.isFavorite("biz-201")).toBe(false);
    expect(result.current.favoriteCount).toBe(0);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")).not.toContain("biz-201");
    expect(removeSpy).toHaveBeenCalledWith("biz-201");
  });

  it("does not expose or change favorites for guests", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(["biz-existing"]));
    const addSpy = vi.spyOn(favoritesService, "addFavorite").mockResolvedValue({ success: true });
    const authValue = {
      isAuthenticated: false,
    } as unknown as AuthContextType;
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthContext.Provider value={authValue}>
        <FavoritesProvider>{children}</FavoritesProvider>
      </AuthContext.Provider>
    );

    const { result } = renderHook(() => useFavorites(), { wrapper });

    expect(result.current.isFavorite("biz-existing")).toBe(false);
    expect(result.current.favoriteCount).toBe(0);

    act(() => {
      result.current.toggleFavorite("biz-guest");
    });

    expect(result.current.isFavorite("biz-guest")).toBe(false);
    expect(addSpy).not.toHaveBeenCalled();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")).toEqual([]);
  });

  it("should sync with cloud in background on mount and merge records", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(["biz-local-1"]));
    const syncSpy = vi
      .spyOn(favoritesService, "syncFavorites")
      .mockResolvedValue(["biz-local-1", "biz-cloud-2"]);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <FavoritesProvider>{children}</FavoritesProvider>
    );

    const { result } = renderHook(() => useFavorites(), { wrapper });

    expect(syncSpy).toHaveBeenCalledWith(["biz-local-1"]);

    // Allow background sync promise to resolve
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.isFavorite("biz-local-1")).toBe(true);
    expect(result.current.isFavorite("biz-cloud-2")).toBe(true);
    expect(result.current.favoriteCount).toBe(2);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")).toEqual(
      expect.arrayContaining(["biz-local-1", "biz-cloud-2"])
    );
  });

  it("should not break local state when cloud sync or toggle fails", async () => {
    vi.spyOn(favoritesService, "syncFavorites").mockRejectedValue(new Error("Network Down"));
    const addSpy = vi.spyOn(favoritesService, "addFavorite").mockRejectedValue(new Error("Offline"));

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <FavoritesProvider>{children}</FavoritesProvider>
    );

    const { result } = renderHook(() => useFavorites(), { wrapper });

    // Adding still works locally even if background cloud sync fails
    act(() => {
      result.current.toggleFavorite("biz-offline-test");
    });

    expect(result.current.isFavorite("biz-offline-test")).toBe(true);
    expect(result.current.favoriteCount).toBe(1);
    expect(addSpy).toHaveBeenCalledWith("biz-offline-test");
  });
});
