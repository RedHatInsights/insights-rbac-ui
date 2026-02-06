/**
 * Auth setup for V1 Admin persona
 * Runs CLI login and saves state before admin tests
 *
 * ALSO warms the asset cache after auth - this runs first so
 * all subsequent tests can use cached assets.
 */
import { chromium, expect, test as setup } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { authenticatePersona } from '../utils/auth';
import { E2E_TIMEOUTS } from '../utils/timeouts';

const AUTH_FILE = path.join(__dirname, '../auth/v1-admin.json');
const CACHE_DIR = path.join(__dirname, '../cache');
const HAR_PATH = path.join(CACHE_DIR, 'session-assets.har');

/**
 * Static asset extensions to cache.
 * We intentionally exclude JSON to allow live API requests.
 *
 * HAR caching is for static assets only (JS, CSS, fonts, images).
 * API responses (.json) are explicitly excluded - tests always hit real backend.
 * This saves ~30MB of downloads per test without affecting test accuracy.
 */
const STATIC_ASSET_PATTERN = '**/*.{js,css,woff,woff2,ttf,eot,png,jpg,jpeg,gif,svg,ico,webp}';

setup('authenticate v1 admin', async () => {
  // Step 1: Authenticate using shared utility
  authenticatePersona('v1-admin');

  // Step 2: Warm asset cache (only this auth setup does this)
  console.log('\n[Cache Warmer] Starting asset cache warm-up...');

  // Ensure cache directory exists
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }

  // Remove stale cache from previous runs
  if (fs.existsSync(HAR_PATH)) {
    fs.unlinkSync(HAR_PATH);
  }

  const browser = await chromium.launch();
  const context = await browser.newContext({
    storageState: AUTH_FILE,
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();

  // Debug: track all network requests
  const requestUrls: string[] = [];
  page.on('request', (request) => {
    const url = request.url();
    // Only log asset-like requests
    if (/\.(js|css|woff|woff2|png|jpg|svg)(\?|$)/i.test(url)) {
      requestUrls.push(url);
    }
  });

  try {
    // Start recording static assets to HAR
    await page.routeFromHAR(HAR_PATH, {
      update: true,
      url: STATIC_ASSET_PATTERN,
      updateMode: 'full',
      updateContent: 'embed',
    });

    // Navigate to a heavy page to trigger asset downloads
    const baseURL = process.env.E2E_BASE_URL || 'https://console.stage.redhat.com';
    const warmupURL = `${baseURL}/iam/my-user-access`;

    console.log(`[Cache Warmer] Navigating to: ${warmupURL}`);
    await page.goto(warmupURL, { timeout: E2E_TIMEOUTS.SETUP_PAGE_LOAD });
    // Wait for page content to render (not networkidle - we're a SPA)
    await expect(page.getByRole('heading', { name: /my user access/i })).toBeVisible({
      timeout: E2E_TIMEOUTS.DETAIL_CONTENT,
    });

    // Always log page state for debugging
    const currentUrl = page.url();
    const pageTitle = await page.title();
    console.log(`[Cache Warmer] Page loaded - URL: ${currentUrl}`);
    console.log(`[Cache Warmer] Page loaded - Title: "${pageTitle}"`);

    // Log sample of requests for debugging
    console.log(`[Cache Warmer] Total asset requests seen: ${requestUrls.length}`);
    if (requestUrls.length > 0) {
      console.log('[Cache Warmer] Sample URLs:');
      requestUrls.slice(0, 5).forEach((url) => console.log(`  - ${url}`));
    } else {
      // No requests = something is wrong, dump HTML
      const html = await page.content();
      console.log(`[Cache Warmer] WARNING - No asset requests! HTML (first 1500 chars):\n${html.substring(0, 1500)}`);
    }

    // Give extra time for lazy-loaded chunks
    await page.waitForTimeout(E2E_TIMEOUTS.MODAL_ANIMATION);
    console.log('[Cache Warmer] Asset collection complete');
  } catch (error) {
    // Don't fail the test if cache warming fails - tests can still run without cache
    console.error('[Cache Warmer] ⚠️ Warm-up failed (tests will continue without cache):', (error as Error).message);

    // Debug: log page state to help diagnose infrastructure issues
    try {
      const url = page.url();
      const title = await page.title();
      const html = await page.content();
      console.error(`[Cache Warmer] DEBUG - Current URL: ${url}`);
      console.error(`[Cache Warmer] DEBUG - Page title: ${title}`);
      console.error(`[Cache Warmer] DEBUG - HTML (first 2000 chars):\n${html.substring(0, 2000)}`);
    } catch (debugError) {
      console.error('[Cache Warmer] DEBUG - Could not capture page state:', (debugError as Error).message);
    }
  } finally {
    // IMPORTANT: Close context first to flush HAR file to disk
    await context.close();
    await browser.close();
  }

  // Log cache file size for visibility
  if (fs.existsSync(HAR_PATH)) {
    const stats = fs.statSync(HAR_PATH);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`[Cache Warmer] ✅ Cache created: ${sizeMB} MB`);

    // Debug: if file is tiny, show contents to understand structure
    if (stats.size < 1000) {
      const content = fs.readFileSync(HAR_PATH, 'utf-8');
      console.log(`[Cache Warmer] DEBUG - HAR contents (file is small): ${content}`);
    }
  } else {
    console.error('[Cache Warmer] ❌ HAR file was NOT created!');
  }

  console.log('[Cache Warmer] All tests will now use cached assets\n');
});
