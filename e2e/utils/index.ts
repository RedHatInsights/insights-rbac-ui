/**
 * E2E Test Utilities
 * Re-exports all helpers for easy importing
 */

export * from './actions';
export * from './modals';
export * from './notifications';
export * from './paths';
export * from './seed-map';
export * from './waiters';
export { test, expect, blockAnalytics, enableAssetCache, setupPage, type Page, type BrowserContext } from './fixtures';

import { ApiVersion } from './seed-map';

/**
 * Helper to require TEST_PREFIX_V1 or TEST_PREFIX_V2 environment variable
 * Use this at the top of any test file that creates data
 */
export function requireTestPrefix(version: ApiVersion): string {
  const envVar = version === 'v2' ? 'TEST_PREFIX_V2' : 'TEST_PREFIX_V1';
  const prefix = process.env[envVar];
  if (!prefix) {
    throw new Error(
      '\n\n' +
        '╔══════════════════════════════════════════════════════════════════════╗\n' +
        `║  SAFETY RAIL: ${envVar} environment variable is REQUIRED       ║\n` +
        '║                                                                      ║\n' +
        '║  This test creates data that must be prefixed to avoid polluting    ║\n' +
        '║  the shared environment. Set the prefix before running:             ║\n' +
        '║                                                                      ║\n' +
        `║    ${envVar}=e2e npx playwright test                           ║\n` +
        '║                                                                      ║\n' +
        '╚══════════════════════════════════════════════════════════════════════╝\n',
    );
  }
  return prefix;
}

/**
 * Get the prefixed name for a seeded resource
 */
export function getPrefixedName(baseName: string, version: ApiVersion): string {
  const prefix = version === 'v2' ? process.env.TEST_PREFIX_V2 : process.env.TEST_PREFIX_V1;
  return prefix ? `${prefix}__${baseName}` : baseName;
}
