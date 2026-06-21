import { useEffect, DependencyList, useCallback } from 'react';

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const memoizedFn = useCallback(asyncFn, deps);

    useEffect(() => {
        let cancelled = false;

        memoizedFn(() => cancelled).catch((err) => {
            if (!cancelled) {
                console.error('Async effect error:', err);
            }
        });

        return () => {
            cancelled = true;
        };
    }, [memoizedFn]);
}
