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
 * Enabled only when DEBUG or PW_TEST_DEBUG environment variable is set.
 */
export async function enableConsoleLogging(page: Page): Promise<void> {
  // Only enable if DEBUG or PW_TEST_DEBUG is set
  if (!process.env.DEBUG && !process.env.PW_TEST_DEBUG) {
    return;
  }

  // Log browser console errors and warnings
  page.on('console', (msg) => {
    const type = msg.type();
    // Only log errors and warnings
    if (type === 'error' || type === 'warning') {
      const location = msg.location();
      const prefix = `[Browser ${type.toUpperCase()}]`;
      // Use process.stderr to ensure it appears in Playwright output
      process.stderr.write(`${prefix} ${msg.text()}\n`);
      if (location.url) {
        process.stderr.write(`  at ${location.url}:${location.lineNumber}:${location.columnNumber}\n`);
      }
    }
  });

  // Log page errors (uncaught exceptions)
  page.on('pageerror', (error) => {
    process.stderr.write(`[Browser EXCEPTION] ${error.message}\n`);
    if (error.stack) {
      process.stderr.write(`${error.stack}\n`);
    }
  });

  // Log failed network requests (might indicate missing resources)
  page.on('requestfailed', (request) => {
    const failure = request.failure();
    process.stderr.write(`[Network FAILED] ${request.method()} ${request.url()}\n`);
    if (failure) {
      process.stderr.write(`  Error: ${failure.errorText}\n`);
    }
  });

  // Log HTTP errors (4xx, 5xx)
  page.on('response', (response) => {
    const status = response.status();
    if (status >= 400) {
      process.stderr.write(`[HTTP ${status}] ${response.request().method()} ${response.url()}\n`);
    }
  });
}

/**
 * Disable preview/beta navigation mode.
 * Injects script to disable 2024 navigation preview before page loads.
 * Call this in setupPage to ensure stable navigation in tests.
 */
export async function disablePreviewMode(page: Page): Promise<void> {
  await page.addInitScript(() => {
    // Set localStorage to disable preview navigation before app initializes
    try {
      const existingPrefs = JSON.parse(localStorage.getItem('chrome:user:preferences') || '{}');
      const updatedPrefs = {
        ...existingPrefs,
        ui: {
          ...(existingPrefs.ui || {}),
          '2024-navigation': false,
        },
      };
      localStorage.setItem('chrome:user:preferences', JSON.stringify(updatedPrefs));
    } catch {
      // Fallback if parsing fails
      localStorage.setItem('chrome:user:preferences', JSON.stringify({ ui: { '2024-navigation': false } }));
    }
  });
}

/**
 * Combined setup: enables asset cache, blocks analytics, and disables preview mode.
 * Convenience function for test.beforeEach hooks.
 */
export async function setupPage(page: Page): Promise<void> {
  await enableAssetCache(page);
  await blockAnalytics(page);
  await enableConsoleLogging(page);
  await disablePreviewMode(page);
}

// Re-export base test and expect
export { base as test };
export { expect, type Page, type BrowserContext } from '@playwright/test';
