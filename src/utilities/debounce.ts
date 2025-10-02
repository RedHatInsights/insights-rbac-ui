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
export function debounce<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  wait: number,
  options: AwesomeDebounceOptions & { onlyResolvesLast: true },
): T & { cancel(): void };

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
 * // Redux dispatch
 * const debouncedFetch = debounce(fetchData);
 *
 * // Cleanup on unmount
 * useEffect(() => () => debouncedFetch.cancel(), []);
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  wait?: number,
  options?: DebounceSettings,
): T & { cancel(): void; flush(): ReturnType<T> | undefined };

// Implementation
export function debounce(fn: any, wait = DEFAULT_DEBOUNCE_DELAY, options: any = {}) {
  if ('onlyResolvesLast' in options && options.onlyResolvesLast === true) {
    return awesomeDebouncePromise(fn, wait, options);
  }
  return lodashDebounce(fn, wait, options);
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
export function debounceAsync<T extends (...args: any[]) => Promise<any>>(
  asyncFunction: T,
  debounceTime = DEFAULT_DEBOUNCE_DELAY,
  options: Partial<AwesomeDebounceOptions> = { onlyResolvesLast: false },
): T & { cancel(): void } {
  return awesomeDebouncePromise(asyncFunction, debounceTime, options) as T & { cancel(): void };
}
