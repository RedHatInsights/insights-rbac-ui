import awesomeDebouncePromise from 'awesome-debounce-promise';
import type { AwesomeDebounceOptions } from 'awesome-debounce-promise';
import lodashDebounce from 'lodash/debounce';
import type { DebounceSettings } from 'lodash';

/**
 * Default debounce delay in milliseconds
 * 250ms is the sweet spot - fast enough to feel responsive, slow enough to reduce API calls
 */
export const DEFAULT_DEBOUNCE_DELAY = 250;

/**
 * Debounces an async function with race condition prevention
 *
 * @param fn - The async function to debounce
 * @param wait - Delay in milliseconds
 * @param options - Must include onlyResolvesLast: true for race-safe debouncing
 * @returns Debounced version of the function with cancel() method
 *
 * @example
 * const safeFetch = debounce(fetchId, 300, { onlyResolvesLast: true });
 */
export function debounce<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  wait: number,
  options: AwesomeDebounceOptions & { onlyResolvesLast: true },
): ((...args: TArgs) => Promise<TReturn>) & { cancel(): void };

/**
 * Debounces a function (sync or async without race guards)
 *
 * @param fn - The function to debounce (sync or async)
 * @param wait - Delay in milliseconds (default: 250ms)
 * @param options - Standard lodash debounce options
 * @returns Debounced version of the function with cancel() and flush() methods
 *
 * @example
 * // Async functions
 * const debouncedSearch = debounce(
 *   async (query: string) => fetchResults(query)
 * );
 *
 * // React Query refetch
 * const debouncedFetch = debounce(fetchData);
 *
 * // Cleanup on unmount
 * useEffect(() => () => debouncedFetch.cancel(), []);
 */
export function debounce<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => TReturn,
  wait?: number,
  options?: DebounceSettings,
): ((...args: TArgs) => TReturn | undefined) & { cancel(): void; flush(): TReturn | undefined };

// Implementation
export function debounce<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => TReturn,
  wait = DEFAULT_DEBOUNCE_DELAY,
  options: (AwesomeDebounceOptions & { onlyResolvesLast: true }) | DebounceSettings = {},
) {
  if ('onlyResolvesLast' in options && options.onlyResolvesLast === true) {
    return awesomeDebouncePromise(fn, wait, options);
  }
  return lodashDebounce(fn, wait, options as DebounceSettings);
}

/**
 * Legacy debounceAsync function - wraps awesome-debounce-promise for backwards compatibility
 *
 * @param asyncFunction - The async function to debounce
 * @param debounceTime - Delay in milliseconds (default: 250ms)
 * @param options - Awesome debounce options
 * @returns Debounced version of the function
 *
 * @deprecated Use debounce() with { onlyResolvesLast: true } when you need race-safe debouncing
 */
export function debounceAsync<TArgs extends unknown[], TReturn>(
  asyncFunction: (...args: TArgs) => Promise<TReturn>,
  debounceTime = DEFAULT_DEBOUNCE_DELAY,
  options: Partial<AwesomeDebounceOptions> = { onlyResolvesLast: false },
): ((...args: TArgs) => Promise<TReturn>) & { cancel(): void } {
  return awesomeDebouncePromise(asyncFunction, debounceTime, options) as ((...args: TArgs) => Promise<TReturn>) & {
    cancel(): void;
  };
}
