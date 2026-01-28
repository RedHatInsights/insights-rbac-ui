/**
 * Shared test utilities for user journey tests
 *
 * Centralizes timing configuration to ensure consistent behavior
 * and easier adjustment if tests become flaky.
 */

/**
 * Centralized timeout configuration for test helpers.
 * Use these constants instead of hard-coded values to ensure
 * consistent behavior and easier adjustment if tests become flaky.
 */
export const TEST_TIMEOUTS = {
  /** Default timeout for waiting on elements after mutations (e.g., API calls) */
  ELEMENT_WAIT: 10000,
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
