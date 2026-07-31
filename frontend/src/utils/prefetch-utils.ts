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
