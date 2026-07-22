import { QueryClient } from '@tanstack/react-query';

/**
 * Pre-defined Tiered Caching presets for React Query.
 */
export const STATIC_QUERY_OPTIONS = {
  /** 10 minutes cache freshness for static categories, blog articles, district guides */
  staleTime: 10 * 60_000,
  gcTime: 30 * 60_000,
  refetchOnWindowFocus: false,
} as const;

export const CATALOG_QUERY_OPTIONS = {
  /** 5 minutes cache freshness for service listings and property catalogs */
  staleTime: 5 * 60_000,
  gcTime: 15 * 60_000,
  refetchOnWindowFocus: false,
} as const;

export const DYNAMIC_USER_QUERY_OPTIONS = {
  /** 30 seconds freshness for dynamic user data (notifications, cart, auth, inbox) */
  staleTime: 30_000,
  gcTime: 5 * 60_000,
  refetchOnWindowFocus: true,
} as const;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60_000, // 5 minutes default
      gcTime: 15 * 60_000, // 15 minutes default
      retry: 2,
      refetchOnWindowFocus: false, // Prevents aggressive refetches on tab switching
    },
    mutations: {
      retry: 0,
    },
  },
});
