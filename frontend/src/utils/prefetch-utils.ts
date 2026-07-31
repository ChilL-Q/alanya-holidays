/**
 * Utility for Instant UX: Intent-based Prefetching & View Transitions
 */

const prefetchedModules = new Set<string>();

/**
 * Prefetch dynamic JS module on user hover or focus before click occurs.
 */
export function prefetchModule(modulePath: () => Promise<unknown>) {
  const key = modulePath.toString();
  if (prefetchedModules.has(key)) return;
  
  prefetchedModules.add(key);
  modulePath().catch(() => {
    // Silent fail if prefetch is interrupted
    prefetchedModules.delete(key);
  });
}

/**
 * Trigger View Transition if supported by browser.
 */
export function transitionTo(navigateCallback: () => void) {
  if (typeof document !== 'undefined' && 'startViewTransition' in document) {
    (document as unknown as { startViewTransition: (cb: () => void) => void }).startViewTransition(() => {
      navigateCallback();
    });
  } else {
    navigateCallback();
  }
}

/**
 * Convert external Supabase Storage URLs to relative proxied Nginx paths
 * to leverage Single Origin HTTP/2 multiplexing and RAM edge caching (< 1ms).
 */
export function getProxiedImageUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.includes('.supabase.co/storage/v1/object/public/')) {
    const parts = url.split('/storage/v1/object/public/');
    if (parts.length > 1) {
      return `/storage/v1/object/public/${parts[1]}`;
    }
  }
  return url;
}
