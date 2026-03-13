/**
 * Shared test utilities for user journey tests
 *
 * Centralizes timing configuration to ensure consistent behavior
 * and easier adjustment if tests become flaky.
 */

export type { UserEvent } from '@testing-library/user-event';

/**
 * Centralized timeout configuration for test helpers.
 * Use these constants instead of hard-coded values to ensure
 * consistent behavior and easier adjustment if tests become flaky.
 */
export const TEST_TIMEOUTS = {
  /** Default timeout for waiting on elements after mutations (e.g., API calls) */
  ELEMENT_WAIT: 10000,
  /** Extended timeout for post-mutation list refreshes on slow CI (query invalidation + refetch + render) */
  POST_MUTATION_REFRESH: 20000,
  /** Timeout for notifications and transient UI elements */
  NOTIFICATION_WAIT: 5000,

  /** Very quick UI settle (checkbox toggle, etc.) */
  QUICK_SETTLE: 100,
  /** Short delay after menu/dropdown opens */
  AFTER_MENU_OPEN: 200,
  /** Default delay after click actions to allow UI to settle */
  AFTER_CLICK: 300,
  /** Delay after expand/collapse or panel open actions */
  AFTER_EXPAND: 500,
  /** Delay for drawer animations to complete */
  AFTER_DRAWER_OPEN: 800,
  /** Delay for form/page loads after navigation */
  AFTER_PAGE_LOAD: 1000,
  /** Delay for very long operations (multiple API calls, complex renders) */
  LONG_OPERATION: 2000,
} as const;

/**
 * Non-generic stand-in for Storybook's `StepFunction<TRenderer, TArgs>`.
 *
 * The real type is generic over renderer and args, which makes it unusable
 * as a plain parameter type in helpers. This alias erases the generics
 * while remaining assignment-compatible: Storybook's `step` accepts a
 * `PlayFunction<R,A>` (one-arg callback), and TypeScript allows a zero-arg
 * callback in its place, so helpers can pass `async () => { … }` directly.
 */
export type StepFn = (label: string, play: () => Promise<void> | void) => Promise<void> | void;
export const noopStep: StepFn = async (_label, fn) => fn();
