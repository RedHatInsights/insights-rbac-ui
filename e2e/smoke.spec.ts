/**
 * E2E Smoke Test - Storage State Verification
 *
 * This test verifies that the Playwright storage state exported by the
 * headless login command can be used to authenticate subsequent tests.
 *
 * Usage:
 *   1. Run headless login to generate e2e/auth-admin.json:
 *      RBAC_USERNAME=user RBAC_PASSWORD=pass npm run cli -- login --headless --save-state e2e/auth-admin.json
 *
 *   2. Run this test:
 *      npx playwright test e2e/smoke.spec.ts
 *
 * The test confirms:
 * - Session cookies were correctly transferred from the headless login
 * - The authenticated session can access protected pages
 * - User-specific content is visible (proving auth works)
 */

import { test, expect } from '@playwright/test';
import { AUTH_ADMIN } from './utils';

// Use storage state from headless login
test.use({
  storageState: AUTH_ADMIN,
});

test.describe('Headless Login Storage State Verification', () => {
  /**
   * SMOKE TEST: Verify authenticated access to My User Access page
   *
   * This is the primary verification that the storage state from
   * the headless login command works correctly with Playwright tests.
   */
  test('can access My User Access page with exported storage state', async ({ page }) => {
    // Navigate to the My User Access page (requires authentication)
    await page.goto('https://console.stage.redhat.com/iam/my-user-access');

    // Wait for the page to fully load
    await page.waitForLoadState('networkidle');

    // Verify the authenticated content is visible
    // This text only appears when the user is logged in
    await expect(
      page.getByText('Select applications to view your personal permissions')
    ).toBeVisible({ timeout: 30000 });
  });

  /**
   * Additional verification: Check user-specific elements are present
   */
  test('shows user account menu (proves authentication)', async ({ page }) => {
    await page.goto('https://console.stage.redhat.com/iam/my-user-access');
    await page.waitForLoadState('networkidle');

    // The user account dropdown should be visible when logged in
    // This is typically in the top-right corner of the console
    const userMenu = page.locator('[data-ouia-component-id="user-menu"]');
    await expect(userMenu).toBeVisible({ timeout: 30000 });
  });

  /**
   * Verify navigation to RBAC sections works
   */
  test('can navigate to User Access management', async ({ page }) => {
    await page.goto('https://console.stage.redhat.com/iam/user-access/users');
    await page.waitForLoadState('networkidle');

    // Should see the Users page content
    await expect(page.getByRole('heading', { name: /users/i })).toBeVisible({ timeout: 30000 });
  });

  /**
   * Verify the Roles page is accessible
   */
  test('can access Roles page', async ({ page }) => {
    await page.goto('https://console.stage.redhat.com/iam/user-access/roles');
    await page.waitForLoadState('networkidle');

    // Should see roles content
    await expect(page.getByRole('heading', { name: /roles/i })).toBeVisible({ timeout: 30000 });
  });

  /**
   * Verify the Groups page is accessible
   */
  test('can access Groups page', async ({ page }) => {
    await page.goto('https://console.stage.redhat.com/iam/user-access/groups');
    await page.waitForLoadState('networkidle');

    // Should see groups content
    await expect(page.getByRole('heading', { name: /groups/i })).toBeVisible({ timeout: 30000 });
  });
});

test.describe('Storage State Failure Handling', () => {
  /**
   * Test behavior when auth.json doesn't exist
   * This test should be run separately without the storage state
   */
  test.skip('redirects to login when no storage state', async ({ page }) => {
    // This test is skipped by default because it requires running without storageState
    // To run manually:
    //   npx playwright test e2e/smoke.spec.ts --grep "redirects to login" --project=chromium

    await page.goto('https://console.stage.redhat.com/iam/my-user-access');

    // Should redirect to SSO login page
    await expect(page).toHaveURL(/sso\.redhat\.com|auth\.redhat\.com/);
  });
});
