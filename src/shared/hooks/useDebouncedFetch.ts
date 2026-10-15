import { useEffect, useMemo } from 'react';
import { DEFAULT_DEBOUNCE_DELAY, debounce } from '../utilities/debounce';

/**
 * Creates a debounced version of a fetch function with automatic cleanup
 *
 * @param fetcher - The function to debounce
 * @param wait - Debounce delay in milliseconds (default: 250ms)
 * @returns Debounced version of the fetcher with cancel() method
 *
 * @example
 * const debouncedFetch = useDebouncedFetch(fetchData);
 *
 * // Use in handlers
 * const handleSearch = (query: string) => {
 *   debouncedFetch({ query, offset: 0 });
 * };
 */
export function useDebouncedFetch<TArgs extends unknown[], TReturn>(
  fetcher: ((...args: TArgs) => TReturn) | undefined,
  wait = DEFAULT_DEBOUNCE_DELAY,
) {
  const debounced = useMemo(() => (fetcher ? debounce(fetcher, wait) : undefined), [fetcher, wait]);

  // Cleanup on unmount - cancel any pending debounced calls
  useEffect(() => {
    return () => {
      debounced?.cancel();
    };
  }, [debounced]);

  return debounced;
}
