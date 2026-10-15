/**
 * Preview Mode Guard for E2E Tests
 *
 * The Hybrid Cloud Console has a "Preview mode" toggle in the platform Chrome shell.
 * V1 tests require Preview OFF (production), V2 tests require Preview ON.
 *
 * The toggle state is **server-side** (tied to the user account). Clicking it
 * in any browser session persists for all sessions of that user. We don't need
 * to bake anything into storageState — we just need to click it once per user
 * if it's in the wrong state.
 *
 * The primary entry point is `setPreviewModeInSetup`, called once per persona
 * during auth setup.
 *
 * `ensurePreviewMode` is the lower-level helper used internally by
 * `setPreviewModeInSetup` and can be used as a fallback in tests if needed.
 */
import { type Page, chromium, expect } from '@playwright/test';
import { blockAnalytics } from './fixtures';
import { E2E_TIMEOUTS } from './timeouts';

export type ApiVersion = 'v1' | 'v2';

/**
 * Ensures the Hybrid Cloud Console Preview mode toggle matches
 * the expected state for the given API version.
 *
 * V1 = preview OFF (unchecked), V2 = preview ON (checked).
 *
 * If the toggle is in the wrong state, clicks the label (the visible
 * part of the PF Switch), verifies the state changed, and reloads.
 */
export async function ensurePreviewMode(page: Page, version: ApiVersion): Promise<void> {
  const toggle = page.locator('#preview-toggle');

  try {
    await toggle.waitFor({ state: 'attached', timeout: E2E_TIMEOUTS.PLATFORM_CHROME });
  } catch {
    console.warn(
      `[Preview] #preview-toggle not found after ${E2E_TIMEOUTS.PLATFORM_CHROME}ms — skipping. If preview mode exists, the selector may have changed.`,
    );
    return;
  }

  const isChecked = await toggle.isChecked();
  const shouldBeChecked = version === 'v2';

  if (isChecked === shouldBeChecked) return;

  console.log(`[Preview] Toggle is ${isChecked ? 'ON' : 'OFF'}, need ${shouldBeChecked ? 'ON' : 'OFF'} for ${version} — switching`);

  await page.locator('label[for="preview-toggle"]').click();

  if (shouldBeChecked) {
    await expect(toggle).toBeChecked({ timeout: E2E_TIMEOUTS.PLATFORM_CHROME });
  } else {
    await expect(toggle).not.toBeChecked({ timeout: E2E_TIMEOUTS.PLATFORM_CHROME });
  }

  await page.reload({ waitUntil: 'domcontentloaded' });
}

/**
 * Opens a browser with the persona's storageState, navigates to /iam
 * (where platform Chrome renders the preview toggle), sets the correct
 * preview state, and saves the storageState.
 *
 * We navigate to /iam rather than / because the dev proxy only reliably
 * serves IAM routes. The platform redirects to whatever page fits the
 * current toggle state + user permissions — we don't care where we land,
 * we just need the toggle in the DOM.
 *
 * The toggle is server-side, so any subsequent browser context for this user
 * will see the updated state automatically.
 *
 * Call once per persona during auth setup — not per test.
 */
export async function setPreviewModeInSetup(authFile: string, version: ApiVersion): Promise<void> {
  if (process.env.E2E_PREVIEW_TOGGLE !== 'true') {
    console.log(`[Preview Setup] Skipped (set E2E_PREVIEW_TOGGLE=true to enable)`);
    return;
  }

  const baseURL = process.env.E2E_BASE_URL || 'https://console.stage.redhat.com';
  const browser = await chromium.launch();
  const context = await browser.newContext({
    storageState: authFile,
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();

  try {
    await blockAnalytics(page);
    await page.goto(`${baseURL}/iam`, { timeout: E2E_TIMEOUTS.SETUP_PAGE_LOAD });
    await ensurePreviewMode(page, version);
    await context.storageState({ path: authFile });
    console.log(`[Preview Setup] ${version} preview mode baked into ${authFile}`);
  } catch (error) {
    console.warn(`[Preview Setup] Failed to set preview mode for ${authFile}: ${(error as Error).message}`);
  } finally {
    await context.close();
    await browser.close();
  }
}
