/**
 * Auth setup for V1 Admin persona
 * Runs CLI login and saves state before admin tests.
 * Also warms the HAR cache for all subsequent tests.
 */
import { chromium, test as setup } from '@playwright/test';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

const AUTH_FILE = path.join(__dirname, '../auth/v1-admin.json');
const CACHE_DIR = path.join(__dirname, '../cache');
const HAR_PATH = path.join(CACHE_DIR, 'session-assets.har');
const STATIC_ASSET_PATTERN = '**/*.{js,css,woff,woff2,ttf,eot,png,jpg,jpeg,gif,svg,ico,webp}';

setup('authenticate v1 admin', async () => {
  // Step 1: Login via CLI
  console.log('[Auth] Logging in as V1 Admin...');
  execSync(`bash scripts/run-with-env.sh e2e/auth/.env.v1-admin npm run cli -- login --headless --save-state ${AUTH_FILE}`, {
    stdio: 'inherit',
    cwd: path.join(__dirname, '../..'),
  });
  console.log('[Auth] V1 Admin authenticated');

  // Step 2: Warm HAR cache (only this auth project does this)
  console.log('[Cache Warmer] Starting asset cache warm-up...');

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

  try {
    // Record static assets to HAR
    await page.routeFromHAR(HAR_PATH, {
      update: true,
      url: STATIC_ASSET_PATTERN,
      updateMode: 'full',
      updateContent: 'embed',
    });

    const baseURL = process.env.E2E_BASE_URL || 'https://console.stage.redhat.com';
    const warmupURL = `${baseURL}/iam/my-user-access`;

    console.log(`[Cache Warmer] Navigating to: ${warmupURL}`);
    await page.goto(warmupURL);

    // Wait for page to load
    await page.getByRole('heading', { name: 'My User Access' }).waitFor({ timeout: 30000 });
    console.log('[Cache Warmer] Page loaded, waiting for lazy chunks...');

    // Extra time for lazy-loaded chunks
    await page.waitForTimeout(3000);
  } catch (error) {
    console.error('[Cache Warmer] ❌ Error during warm-up:', error);
  } finally {
    await context.close();
    await browser.close();
  }

  // Log cache size
  if (fs.existsSync(HAR_PATH)) {
    const stats = fs.statSync(HAR_PATH);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`[Cache Warmer] ✅ Cache created: ${sizeMB} MB`);
  } else {
    console.warn('[Cache Warmer] ⚠️ HAR file was not created');
  }
});
