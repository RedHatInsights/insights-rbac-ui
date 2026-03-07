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
 * Glob patterns to block during E2E tests.
 * Using targeted globs instead of a catch-all route avoids running a JS
 * callback on every request — Playwright matches globs in native code.
 *
 * Patterns use `**keyword**` so they match regardless of URL structure
 * (direct domain, proxied path, with or without trailing path segments).
 */
const BLOCKED_PATTERNS = [
  // TrustArc consent overlay
  '**trustarc**',
  '**teconsent**',
  '**consent-pref**',
  // Segment CDN — loads all analytics integrations (amplitude, pendo, etc.)
  '**/connections/cdn/**',
  // Direct-domain fallbacks (if SDK bypasses the proxy)
  '**amplitude.com**',
  '**pendo.io**',
  '**segment.com**',
  '**segment.io**',
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
 * Each pattern gets its own native-matched route — no JS callback per request.
 */
export async function blockAnalytics(page: Page): Promise<void> {
  for (const pattern of BLOCKED_PATTERNS) {
    await page.route(pattern, (route) => route.abort());
  }
}

/**
 * Combined setup: enables asset cache and blocks analytics.
 * Convenience function for test.beforeEach hooks.
 */
export async function setupPage(page: Page): Promise<void> {
  await enableAssetCache(page);
  await blockAnalytics(page);
}

// Re-export base test and expect
export { base as test };
export { expect, type Page, type BrowserContext } from '@playwright/test';
