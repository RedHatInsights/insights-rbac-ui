/**
 * Global Setup - Asset Cache Warmer
 *
 * This runs once before all tests to warm the HAR cache.
 * It captures static assets (JS, CSS, fonts) so they can be served from
 * cache for all subsequent tests, avoiding the heavy download tax per test.
 *
 * The HAR file is regenerated fresh on each test run and never committed.
 *
 * IMPORTANT: Requires auth state to exist. Run auth step first:
 *   npm run e2e:auth:v1:admin
 */
import { chromium, type FullConfig } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

const CACHE_DIR = path.join(__dirname, '..', 'cache');
const HAR_PATH = path.join(CACHE_DIR, 'session-assets.har');
const AUTH_DIR = path.join(__dirname, '..', 'auth');

/**
 * Static asset extensions to cache.
 * We intentionally exclude JSON to allow live API requests.
 */
const STATIC_ASSET_PATTERN = '**/*.{js,css,woff,woff2,ttf,eot,png,jpg,jpeg,gif,svg,ico,webp}';

/**
 * Find any available auth state file.
 * Priority: v1-admin > v2-admin > v1-user > v2-user
 */
function findAuthState(): string | undefined {
  const candidates = ['v1-admin.json', 'v2-admin.json', 'v1-user.json', 'v2-user.json'];
  for (const file of candidates) {
    const filePath = path.join(AUTH_DIR, file);
    if (fs.existsSync(filePath)) {
      return filePath;
    }
  }
  return undefined;
}

async function globalSetup(config: FullConfig) {
  console.log('\n' + '='.repeat(60));
  console.log('[Cache Warmer] Global Setup Starting...');
  console.log('='.repeat(60));

  // Find auth state
  const authState = findAuthState();
  if (!authState) {
    console.warn('[Cache Warmer] ⚠️  No auth state found, skipping cache warm-up');
    console.warn('[Cache Warmer] Run auth first: npm run e2e:auth:v1:admin');
    console.log('='.repeat(60) + '\n');
    return;
  }
  console.log(`[Cache Warmer] Using auth state: ${path.basename(authState)}`);

  // Ensure cache directory exists
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }

  // Remove stale cache from previous runs
  if (fs.existsSync(HAR_PATH)) {
    fs.unlinkSync(HAR_PATH);
  }

  console.log('[Cache Warmer] Starting asset cache warm-up...');
  console.log(`[Cache Warmer] HAR path: ${HAR_PATH}`);

  // Launch browser with auth state
  const browser = await chromium.launch();
  const context = await browser.newContext({
    storageState: authState,
    ignoreHTTPSErrors: true, // Allow self-signed certs for local dev server
  });
  const page = await context.newPage();

  try {
    // Start recording static assets to HAR
    await page.routeFromHAR(HAR_PATH, {
      update: true,
      url: STATIC_ASSET_PATTERN,
      updateMode: 'full',
      updateContent: 'embed',
    });

    // Navigate to a heavy page to trigger asset downloads
    const baseURL = config.projects[0]?.use?.baseURL || process.env.E2E_BASE_URL || 'https://console.stage.redhat.com';
    const warmupURL = `${baseURL}/iam/my-user-access`;

    console.log(`[Cache Warmer] Navigating to: ${warmupURL}`);

    await page.goto(warmupURL);

    // Wait for the page content to render (more reliable than networkidle)
    console.log('[Cache Warmer] Waiting for page content...');
    await page.getByRole('heading', { name: 'My User Access' }).waitFor({ timeout: 30000 });
    console.log('[Cache Warmer] Page loaded, waiting for lazy chunks...');

    // Give extra time for lazy-loaded chunks
    await page.waitForTimeout(3000);

  } catch (error) {
    console.error('[Cache Warmer] ❌ Error during warm-up:', error);
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
  } else {
    console.error('[Cache Warmer] ❌ HAR file was NOT created!');
    console.error('[Cache Warmer] Check if the page loaded correctly');
  }

  console.log('[Cache Warmer] All tests will now use cached assets');
  console.log('='.repeat(60) + '\n');
}

export default globalSetup;
