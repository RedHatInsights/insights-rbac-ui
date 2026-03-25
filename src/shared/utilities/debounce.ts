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
 * Debounces an async function using awesome-debounce-promise.
 *
 * Pass `onlyResolvesLast: true` for race-safe debouncing (only the last call's
 * promise resolves; earlier ones are rejected). Use `onlyResolvesLast: false`
 * when you need every call's promise to resolve with the same result — e.g.
 * form validators where the framework tracks individual validation promises.
 *
 * @param fn - The async function to debounce
 * @param wait - Delay in milliseconds
 * @param options - Must include onlyResolvesLast (true or false)
 * @returns Debounced version of the function with cancel() method
 *
 * @example
 * // Race-safe: only the final search resolves
 * const safeFetch = debounce(fetchId, 300, { onlyResolvesLast: true });
 *
 * // Form validator: all promises resolve (framework tracks each one)
 * const validator = debounce(checkName, 250, { onlyResolvesLast: false });
 */
export function debounce<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  wait: number,
  options: Partial<AwesomeDebounceOptions> & { onlyResolvesLast: boolean },
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
  options: (Partial<AwesomeDebounceOptions> & { onlyResolvesLast: boolean }) | DebounceSettings = {},
) {
  if ('onlyResolvesLast' in options) {
    return awesomeDebouncePromise(fn, wait, options as Partial<AwesomeDebounceOptions>);
  }
  return lodashDebounce(fn, wait, options as DebounceSettings);
}
