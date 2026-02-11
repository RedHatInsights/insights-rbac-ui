/**
 * Custom Playwright Test Fixtures
 *
 * Provides:
 * - Session-scoped asset caching (HAR)
 * - Analytics/overlay blocking
 */
import { type Page, test as base } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

const HAR_PATH = path.join(__dirname, '..', 'cache', 'session-assets.har');
const STATIC_ASSET_PATTERN = '**/*.{js,css,woff,woff2,ttf,eot,png,jpg,jpeg,gif,svg,ico,webp}';

/**
 * Patterns to block during E2E tests.
 * These can cause flaky tests or slow down page loads.
 */
const BLOCKED_PATTERNS = [
  // TrustArc consent overlay
  'trustarc.com',
  'trustarc.stage',
  'teconsent',
  '/trustarc/',
  'consent.trustarc',
  'consent-pref',
  // Amplitude analytics
  'amplitude.com',
  'api.amplitude',
  // Pendo analytics
  'pendo.io',
  'app.pendo',
  'cdn.pendo',
  // Segment analytics
  'segment.com',
  'segment.io',
  'cdn.segment',
  'api.segment',
];

/**
 * Enable HAR-based asset caching for a page.
 * Serves static assets from cache, falls back to network for uncached.
 * Must be called before navigation.
 */
export async function enableAssetCache(page: Page): Promise<void> {
  if (!fs.existsSync(HAR_PATH)) {
    console.warn('[Asset Cache] HAR file not found, assets will be fetched live');
    console.warn('[Asset Cache] Run auth first, then tests will warm the cache');
    return;
  }

  // Only log in verbose mode (DEBUG or PW_TEST_DEBUG set)
  if (process.env.DEBUG || process.env.PW_TEST_DEBUG) {
    const stats = fs.statSync(HAR_PATH);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`[Asset Cache] Using HAR cache (${sizeMB} MB)`);
  }

  await page.routeFromHAR(HAR_PATH, {
    update: false,
    url: STATIC_ASSET_PATTERN,
    notFound: 'fallback', // Critical: fetch uncached assets from network
  });
}

/**
 * Set up request blocking on a page.
 * Call this in test.beforeEach or at the start of each test.
 */
export async function blockAnalytics(page: Page): Promise<void> {
  await page.route('**/*', async (route, request) => {
    const url = request.url();
    const shouldBlock = BLOCKED_PATTERNS.some((pattern) => url.includes(pattern));

    if (shouldBlock) {
      await route.abort();
      return;
    }

    await route.continue();
  });
}

/**
 * Enable filtered browser console logging.
 * Only logs errors and warnings, filtering out verbose info/debug messages.
 * Call this in test.beforeEach or at the start of each test.
 */
export async function enableConsoleLogging(page: Page): Promise<void> {
  page.on('console', (msg) => {
    const type = msg.type();
    // Only log errors and warnings
    if (type === 'error' || type === 'warning') {
      const location = msg.location();
      const prefix = `[Browser ${type.toUpperCase()}]`;
      console.log(`${prefix} ${msg.text()}`);
      if (location.url) {
        console.log(`  at ${location.url}:${location.lineNumber}:${location.columnNumber}`);
      }
    }
  });

  // Also log page errors (uncaught exceptions)
  page.on('pageerror', (error) => {
    console.log('[Browser EXCEPTION]', error.message);
    console.log(error.stack);
  });
}

/**
 * Combined setup: enables asset cache and blocks analytics.
 * Convenience function for test.beforeEach hooks.
 */
export async function setupPage(page: Page): Promise<void> {
  await enableAssetCache(page);
  await blockAnalytics(page);
  await enableConsoleLogging(page);
}

// Re-export base test and expect
export { base as test };
export { expect, type Page, type BrowserContext } from '@playwright/test';
