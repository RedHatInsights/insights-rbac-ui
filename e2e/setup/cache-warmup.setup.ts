/**
 * Cache Warmup Setup
 *
 * Navigates to /iam and records static assets (JS, CSS, fonts, images) into
 * a HAR file. All test projects depend on this — if the dev server can't serve
 * the app, the HAR won't be written and Playwright skips the entire suite.
 *
 * Depends on auth-v1-orgadmin (just needs any valid session).
 */
import { chromium, expect, test as setup } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { blockAnalytics } from '../utils/fixtures';
import { E2E_TIMEOUTS } from '../utils/timeouts';

const AUTH_FILE = path.join(__dirname, '../auth/v1-orgadmin.json');
const CACHE_DIR = path.join(__dirname, '../cache');
const HAR_PATH = path.join(CACHE_DIR, 'session-assets.har');

const STATIC_ASSET_PATTERN = '**/*.{js,css,woff,woff2,ttf,eot,png,jpg,jpeg,gif,svg,ico,webp}';

setup('warm asset cache', async () => {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }

  if (fs.existsSync(HAR_PATH)) {
    fs.unlinkSync(HAR_PATH);
  }

  const baseURL = process.env.E2E_BASE_URL || 'https://console.stage.redhat.com';
  const browser = await chromium.launch();
  const context = await browser.newContext({
    storageState: AUTH_FILE,
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();

  try {
    await blockAnalytics(page);
    await page.routeFromHAR(HAR_PATH, {
      update: true,
      url: STATIC_ASSET_PATTERN,
      updateMode: 'full',
      updateContent: 'embed',
    });

    console.log('[Cache Warmer] Navigating to /iam...');
    await page.goto(`${baseURL}/iam`, { timeout: E2E_TIMEOUTS.SETUP_PAGE_LOAD });

    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible({
      timeout: E2E_TIMEOUTS.DETAIL_CONTENT,
    });

    console.log(`[Cache Warmer] Page loaded — URL: ${page.url()}`);

    await page.waitForTimeout(E2E_TIMEOUTS.MODAL_ANIMATION);
  } finally {
    await context.close();
    await browser.close();
  }

  if (fs.existsSync(HAR_PATH)) {
    const sizeMB = (fs.statSync(HAR_PATH).size / (1024 * 1024)).toFixed(2);
    console.log(`[Cache Warmer] Cache created: ${sizeMB} MB`);
  } else {
    throw new Error('[Cache Warmer] HAR file was not created — static assets were not captured');
  }
});
