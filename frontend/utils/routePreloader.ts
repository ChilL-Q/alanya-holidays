/**
 * Route preloading utility for instantly fetching page JS chunks on hover/touch.
 */

const prefetchedRoutes = new Set<string>();

// Map of route paths or prefixes to their page component imports
const routePreloaders: Record<string, () => Promise<unknown>> = {
  '/': () => import('../pages/DirectoryHome'),
  '/services': () => import('../pages/ServicesPage'),
  '/blog': () => import('../modules/blog'),
  '/forum': () => import('../modules/forum'),
  '/shop': () => import('../pages/Shop'),
  '/favorites': () => import('../pages/FavoritesPage'),
  '/bookmarks': () => import('../pages/FavoritesPage'),
  '/about': () => import('../pages/About'),
  '/contact': () => import('../pages/Contact'),
  '/help': () => import('../pages/FAQ'),
  '/community': () => import('../pages/CommunityPage'),
  '/privacy': () => import('../pages/Privacy'),
  '/terms': () => import('../pages/Terms'),
  '/search': () => import('../pages/SearchPage'),
  '/search-results': () => import('../pages/SearchResultsPage'),
  '/stays': () => import('../pages/SearchResultsPage'),
  '/alanya-villas': () => import('../pages/DirectoryCategoryPage'),
  '/alanya-apartments': () => import('../pages/DirectoryCategoryPage'),
  '/alanya-hotels': () => import('../pages/DirectoryCategoryPage'),
  '/things-to-do-in-alanya': () => import('../pages/DirectoryCategoryPage'),
  '/medical-tourism-alanya': () => import('../pages/DirectoryCategoryPage'),
  '/services/car-rental': () => import('../pages/CarRental'),
  '/services/bike-rental': () => import('../pages/BikeRental'),
  '/services/bicycle-rental': () => import('../pages/BicycleRental'),
  '/services/tourist-sim-card': () => import('../pages/Esim'),
  '/services/visa-legal': () => import('../pages/Visa'),
  '/events': () => import('../pages/EventsPage'),
  '/members': () => import('../pages/MembersPage'),
  '/ai-planner': () => import('../pages/AiPlanner'),
  '/my-itineraries': () => import('../pages/MyItinerariesPage'),
  '/profile': () => import('../pages/Profile'),
  '/inbox': () => import('../pages/InboxPage'),
};

/**
 * Prefetches the JS chunk for a target pathname if defined in the registry.
 */
export function prefetchRoute(pathname: string): void {
  // Extract base path without query parameters or trailing slash
  const cleanPath = pathname.split('?')[0].split('#')[0].replace(/\/$/, '') || '/';

  if (prefetchedRoutes.has(cleanPath)) {
    return;
  }

  // Find exact match or prefix match
  const preloader = routePreloaders[cleanPath] || 
    Object.entries(routePreloaders).find(([route]) => route !== '/' && cleanPath.startsWith(route))?.[1];

  if (preloader) {
    prefetchedRoutes.add(cleanPath);
    // Fire dynamic import in background
    preloader().catch(() => {
      // Clear on error so it can be retried
      prefetchedRoutes.delete(cleanPath);
    });
  }
}
