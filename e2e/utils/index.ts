/**
 * E2E Test Utilities
 * Re-exports all helpers for easy importing
 */

export * from './navigation';
export * from './actions';
export * from './modals';
export * from './notifications';
export * from './workspaces';
export * from './paths';
export * from './seed-map';
export { test, expect, blockAnalytics, enableAssetCache, setupPage, type Page, type BrowserContext } from './fixtures';

/**
 * Helper to require TEST_PREFIX environment variable
 * Use this at the top of any test file that creates data
 */
export function requireTestPrefix(): string {
  const prefix = process.env.TEST_PREFIX;
  if (!prefix) {
    throw new Error(
      '\n\n' +
        '╔══════════════════════════════════════════════════════════════════════╗\n' +
        '║  SAFETY RAIL: TEST_PREFIX environment variable is REQUIRED          ║\n' +
        '║                                                                      ║\n' +
        '║  This test creates data that must be prefixed to avoid polluting    ║\n' +
        '║  the shared environment. Set TEST_PREFIX before running:            ║\n' +
        '║                                                                      ║\n' +
        '║    TEST_PREFIX=e2e npx playwright test                              ║\n' +
        '║                                                                      ║\n' +
        '╚══════════════════════════════════════════════════════════════════════╝\n'
    );
  }
  return prefix;
}

/**
 * Get the prefixed name for a seeded resource
 */
export function getPrefixedName(baseName: string): string {
  const prefix = process.env.TEST_PREFIX;
  return prefix ? `${prefix}__${baseName}` : baseName;
}
