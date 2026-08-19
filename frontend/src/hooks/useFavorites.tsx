import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from "react";
import { favoritesService } from "@/api-services/favorites.service";
import { AuthContext } from "@/context/AuthContext";

export interface FavoritesContextValue {
  favorites: Set<string>;
  isFavorite: (businessId: string) => boolean;
  toggleFavorite: (businessId: string) => void;
  favoriteCount: number;
  syncWithCloud?: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextValue>({
  favorites: new Set(),
  isFavorite: () => false,
  toggleFavorite: () => {},
  favoriteCount: 0,
});

const STORAGE_KEY = "alanya_favorites";

function loadFavorites(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return new Set(parsed.filter((id): id is string => typeof id === "string"));
      }
    }
  } catch {
    // corrupted data, reset
  }
  return new Set();
}

function saveFavorites(favorites: Set<string>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(favorites)));
  } catch {
    // storage full or unavailable
  }
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<Set<string>>(loadFavorites);
  const auth = useContext(AuthContext);
  const isAuthenticated = auth === undefined ? true : auth.isAuthenticated;

  useEffect(() => {
    saveFavorites(favorites);
  }, [favorites]);

  const syncWithCloud = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const currentLocal = Array.from(loadFavorites());
      const cloudMerged = await favoritesService.syncFavorites(currentLocal);
      if (Array.isArray(cloudMerged)) {
        setFavorites((prev) => {
          const next = new Set([...prev, ...cloudMerged]);
          saveFavorites(next);
          return next;
        });
      }
    } catch (err: unknown) {
      console.warn("Background favorites cloud sync failed:", err);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    let isMounted = true;
    if (!isAuthenticated) return;

    const performInitialSync = async () => {
      try {
        const localList = Array.from(loadFavorites());
        const merged = await favoritesService.syncFavorites(localList);
        if (isMounted && Array.isArray(merged)) {
          setFavorites((prev) => {
            const next = new Set([...prev, ...merged]);
            saveFavorites(next);
            return next;
          });
        }
      } catch (err: unknown) {
        console.warn("Initial favorites cloud sync error:", err);
      }
    };

    void performInitialSync();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  const isFavorite = useCallback(
    (businessId: string) => favorites.has(businessId),
    [favorites]
  );

  const toggleFavorite = useCallback((businessId: string) => {
    setFavorites((prev) => {
      const isRemoving = prev.has(businessId);
      const next = new Set<string>(prev);

      if (isRemoving) {
        next.delete(businessId);
        if (isAuthenticated) {
          favoritesService.removeFavorite(businessId).catch((err: unknown) => {
            console.warn("Background remove favorite failed:", err);
          });
        }
      } else {
        next.add(businessId);
        if (isAuthenticated) {
          favoritesService.addFavorite(businessId).catch((err: unknown) => {
            console.warn("Background add favorite failed:", err);
          });
        }
      }

      saveFavorites(next);
      return next;
    });
  }, [isAuthenticated]);

  const value: FavoritesContextValue = useMemo(
    () => ({
      favorites,
      isFavorite,
      toggleFavorite,
      favoriteCount: favorites.size,
      syncWithCloud,
    }),
    [favorites, isFavorite, toggleFavorite, syncWithCloud]
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites(): FavoritesContextValue {
  return useContext(FavoritesContext);
}