/**
 * Centralized timeout configuration for E2E tests.
 *
 * Use semantic names instead of magic numbers to:
 * - Document intent (UI vs data)
 * - Make global tuning easier
 * - Improve test readability
 *
 * Philosophy: In a SPA, never use `networkidle`. Wait for the
 * user-visible result instead - the element they should see.
 */
export const E2E_TIMEOUTS = {
  // ─────────────────────────────────────────────────────────────────────
  // UI Rendering (client-side, should be fast)
  // ─────────────────────────────────────────────────────────────────────

  /** Drawer/panel slide animation */
  DRAWER_ANIMATION: 1_000,

  /** Modal appear animation (just the animation) */
  MODAL_ANIMATION: 1_000,

  /** Modal/dialog with content to load */
  DIALOG_CONTENT: 5_000,

  /** Menu/dropdown open */
  MENU_ANIMATION: 500,

  /** Element becomes visible after interaction (e.g. toolbar after selection) */
  ELEMENT_VISIBLE: 5_000,

  /** Button state change (enabled/disabled) after local validation */
  BUTTON_STATE: 1_000,

  /** URL change after click (before content loads) */
  URL_CHANGE: 2_000,

  /** Very quick UI settle (React re-render buffer) */
  QUICK_SETTLE: 100,

  /** Platform chrome shell elements (preview toggle, nav chrome) */
  PLATFORM_CHROME: 10_000,

  // ─────────────────────────────────────────────────────────────────────
  // Data Loading (network, can be slow)
  // ─────────────────────────────────────────────────────────────────────

  /** Table/list data from API */
  TABLE_DATA: 10_000,

  /** Detail page content after navigation */
  DETAIL_CONTENT: 15_000,

  /** Slow operations (large lists, complex queries) */
  SLOW_DATA: 30_000,

  /** Modal close after API call (create/update/delete) */
  MUTATION_COMPLETE: 15_000,

  // ─────────────────────────────────────────────────────────────────────
  // Setup & Cache Warming (one-time operations)
  // ─────────────────────────────────────────────────────────────────────

  /** Initial page load during setup/cache warming */
  SETUP_PAGE_LOAD: 60_000,

  /** Global per-test timeout (90s is generous — actionTimeout caps stuck actions at 30s) */
  TEST_GLOBAL: 90_000,
} as const;

export type TimeoutKey = keyof typeof E2E_TIMEOUTS;
