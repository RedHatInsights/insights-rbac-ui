/**
 * Cache Warmup Setup
 *
 * Navigates to /iam and records static assets (JS, CSS, fonts, images) into
 * a HAR file. All test projects depend on this — if the dev server can't serve
 * the app, the HAR won't be written and Playwright skips the entire suite.
 *
 * Depends on auth-v1-orgadmin (just needs any valid session).
 */
import { type BrowserContextOptions, chromium, expect, test as setup } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { blockAnalytics } from '../utils/fixtures';
import { E2E_TIMEOUTS } from '../utils/timeouts';

const AUTH_FILE = path.join(__dirname, '../auth/v1-orgadmin.json');
const CACHE_DIR = path.join(__dirname, '../cache');
const HAR_PATH = path.join(CACHE_DIR, 'session-assets.har');

const STATIC_ASSET_PATTERN = '**/*.{js,css,woff,woff2,ttf,eot,png,jpg,jpeg,gif,svg,ico,webp}';

/**
 * Strip HAR entries whose response body was not captured.
 *
 * Playwright's routeFromHAR(update:true, updateContent:'embed') silently
 * drops the body for preloaded / modulepreloaded resources (the browser
 * fires a prefetch, then a real import() ~1-2 s later — Playwright records
 * both but only embeds the second). During replay the empty entry is served
 * first, webpack evaluates empty JS, and the chunk load fails.
 *
 * Removing those entries is safe: routeFromHAR({ notFound:'fallback' })
 * lets missing URLs fall through to the live network.
 */
function sanitizeHar(harPath: string): { removed: number; kept: number } {
  const raw = JSON.parse(fs.readFileSync(harPath, 'utf-8'));
  const before: number = raw.log.entries.length;

  raw.log.entries = raw.log.entries.filter((entry: { response?: { content?: { size?: number; text?: string } } }) => {
    const content = entry.response?.content;
    return content && content.size != null && content.size > 0 && content.text;
  });

  fs.writeFileSync(harPath, JSON.stringify(raw));
  return { removed: before - raw.log.entries.length, kept: raw.log.entries.length };
}

setup('warm asset cache', async () => {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }

  if (fs.existsSync(HAR_PATH)) {
    fs.unlinkSync(HAR_PATH);
  }

  const baseURL = process.env.E2E_BASE_URL || 'https://console.stage.redhat.com';
  const browser = await chromium.launch();
  const contextOptions: BrowserContextOptions = {
    storageState: AUTH_FILE,
    ignoreHTTPSErrors: true,
  };

  // Optional proxy support via environment variable
  if (process.env.E2E_PROXY) {
    contextOptions.proxy = { server: process.env.E2E_PROXY };
  }

  const context = await browser.newContext(contextOptions);
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

    const v1Indicator = page.getByText('Your Red Hat Enterprise Linux roles');
    const v2Indicator = page.getByText('View your permissions across all groups and workspaces within the Hybrid Cloud Console.');
    await expect(v1Indicator.or(v2Indicator)).toBeVisible({
      timeout: E2E_TIMEOUTS.DETAIL_CONTENT,
    });

    console.log(`[Cache Warmer] Page loaded — URL: ${page.url()}`);

    await page.waitForTimeout(E2E_TIMEOUTS.MODAL_ANIMATION);
  } finally {
    await context.close();
    await browser.close();
  }

  if (fs.existsSync(HAR_PATH)) {
    const { removed, kept } = sanitizeHar(HAR_PATH);
    const sizeMB = (fs.statSync(HAR_PATH).size / (1024 * 1024)).toFixed(2);
    console.log(`[Cache Warmer] Cache created: ${sizeMB} MB (${kept} entries, ${removed} empty entries stripped)`);
  } else {
    throw new Error('[Cache Warmer] HAR file was not created — static assets were not captured');
  }
});
