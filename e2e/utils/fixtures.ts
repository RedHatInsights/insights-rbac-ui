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
 * Set up browser console logging.
 * Captures and logs all console messages, errors, and exceptions to terminal.
 */
export async function enableBrowserLogging(page: Page): Promise<void> {
  // Capture console messages
  page.on('console', (msg) => {
    const type = msg.type();
    const text = msg.text();
    const location = msg.location();

    // Format console output with file location
    const prefix = location.url ? `[${location.url}:${location.lineNumber}]` : '[Browser]';

    if (type === 'error') {
      console.error(`🔴 ${prefix} ${text}`);
    } else if (type === 'warning') {
      console.warn(`⚠️  ${prefix} ${text}`);
    } else if (type === 'log' || type === 'info') {
      console.log(`ℹ️  ${prefix} ${text}`);
    } else if (type === 'debug') {
      console.log(`🐛 ${prefix} ${text}`);
    }
  });

  // Capture page errors (uncaught exceptions)
  page.on('pageerror', (error) => {
    console.error('💥 [Uncaught Exception]', error.message);
    console.error(error.stack);
  });

  // Capture failed requests
  page.on('requestfailed', (request) => {
    const failure = request.failure();
    console.error(`❌ [Request Failed] ${request.method()} ${request.url()}`);
    if (failure) {
      console.error(`   Error: ${failure.errorText}`);
    }
  });
}

/**
 * Combined setup: enables asset cache, blocks analytics, and initializes auth.
 * Convenience function for test.beforeEach hooks.
 *
 * IMPORTANT: This navigates to root (/) first to initialize the chrome.insights
 * auth context before the test navigates to its target page. Direct navigation
 * to deep URLs can fail because the Console auth isn't initialized yet.
 */
export async function setupPage(page: Page): Promise<void> {
  await enableAssetCache(page);
  await blockAnalytics(page);
  await enableBrowserLogging(page);

  // Navigate to root to initialize chrome.insights and auth context
  // This prevents auth failures when tests navigate directly to deep URLs
  await page.goto('/');

  // Wait for auth initialization (indicated by the main nav being present)
  // This is a lightweight check that the app shell has loaded
  await page
    .getByRole('navigation')
    .first()
    .waitFor({ timeout: 10000 })
    .catch(() => {
      // If no navigation found, that's okay - some pages might not have it
      // The important thing is we triggered the initial page load
    });
}

// Re-export base test and expect
export { base as test };
export { expect, type Page, type BrowserContext } from '@playwright/test';
