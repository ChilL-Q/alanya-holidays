import { useEffect, DependencyList } from 'react';

/**
 * Hook for executing async functions with automatic cleanup.
 * Prevents state updates after unmount via a cancellation flag.
 * Usage:
 *   useAsyncEffect(async (isCancelled) => {
 *     const data = await fetchData();
 *     if (!isCancelled()) setState(data);
 *   }, [dependencies]);
 */
export function useAsyncEffect(
    asyncFn: (isCancelled: () => boolean) => Promise<void>,
    deps: DependencyList
) {
    useEffect(() => {
        let cancelled = false;

        asyncFn(() => cancelled).catch((err) => {
            if (!cancelled) {
                console.error('Async effect error:', err);
            }
        });

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);
}
