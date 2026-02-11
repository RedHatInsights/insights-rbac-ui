/**
 * User Management Tests
 *
 * Tests for user activation, deactivation, and invitation.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * DECISION TREE - Add your test here if:
 * ═══════════════════════════════════════════════════════════════════════════════
 *   ✓ It invites users (modal, form validation, API)
 *   ✓ It activates or deactivates users
 *   ✓ It checks if invite/bulk action buttons are visible/hidden/disabled
 *   ✓ It verifies a permission denial (403) for management operations
 *
 * DO NOT add here if:
 *   ✗ It only views the users list → user-list.spec.ts
 *   ✗ It tests search/filter functionality → user-list.spec.ts
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * CAPABILITIES & PERSONAS
 * ═══════════════════════════════════════════════════════════════════════════════
 * @capability Invite Users, Activate Users, Deactivate Users
 * @personas
 *   - Admin: Full management access
 *   - ReadOnlyUser: Page blocked entirely (unauthorized message)
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * DATA PREREQUISITES
 * ═══════════════════════════════════════════════════════════════════════════════
 * @dependencies
 *   - AUTH: Uses AUTH_V1_ADMIN, AUTH_V1_READONLY from utils
 *   - DATA: No seeded data required (uses existing users in org)
 *   - UTILS: Use UsersPage for management interactions
 *   - PREFIX: Requires TEST_PREFIX_V1 env var for safe test isolation
 *
 * NOTE: Actual user activation/deactivation tests are skipped by default
 * because they modify real user accounts in the shared environment.
 */

import { expect, test } from '@playwright/test';
import { AUTH_V1_ADMIN, AUTH_V1_READONLY, setupPage } from '../../../utils';
import { UsersPage } from '../../../pages/v1/UsersPage';
import { E2E_TIMEOUTS } from '../../../utils/timeouts';

// ═══════════════════════════════════════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════════════════════════════════════

const TEST_PREFIX = process.env.TEST_PREFIX_V1;
const USERS_URL = '/iam/user-access/users';

if (!TEST_PREFIX) {
  throw new Error(
    '\n\n' +
      '╔══════════════════════════════════════════════════════════════════════╗\n' +
      '║  SAFETY RAIL: TEST_PREFIX_V1 environment variable is REQUIRED       ║\n' +
      '╚══════════════════════════════════════════════════════════════════════╝\n',
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════════

test.describe('User Management', () => {
  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN - Full management access (User Status)
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('Admin Status Management', () => {
    test.use({ storageState: AUTH_V1_ADMIN });

    test('Invite users button is visible [Admin]', async ({ page }) => {
      const usersPage = new UsersPage(page);
      await usersPage.goto();

      await expect(usersPage.inviteButton).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });

      console.log('[Users] ✓ Invite button is visible');
    });

    test('Invite users modal opens and has required fields [Admin]', async ({ page }) => {
      const usersPage = new UsersPage(page);
      await usersPage.goto();

      // Open invite modal
      await usersPage.openInviteModal();

      // Verify modal content
      const modal = page.getByRole('dialog').first();
      await expect(modal.getByRole('heading', { name: /invite new users/i })).toBeVisible();
      await expect(modal.getByRole('textbox', { name: /enter the e-mail addresses/i })).toBeVisible();
      await expect(modal.getByRole('textbox', { name: /send a message/i })).toBeVisible();
      await expect(modal.getByRole('checkbox', { name: /organization administrators/i })).toBeVisible();

      // Close modal
      await page.keyboard.press('Escape');

      console.log('[Users] ✓ Invite modal has required fields');
    });

    test('Bulk actions menu is available when users selected [Admin]', async ({ page }) => {
      const usersPage = new UsersPage(page);
      await usersPage.goto();

      // Wait for table to load
      await expect(usersPage.table).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
      await page.waitForTimeout(E2E_TIMEOUTS.DRAWER_ANIMATION);

      // Select first user
      await usersPage.selectUserRows(1);

      // Verify bulk actions button is visible
      await expect(usersPage.bulkActionsButton).toBeVisible();

      // Open menu and check options
      await usersPage.openBulkActions();

      // Both activate and deactivate options should be available
      // (one will be disabled based on user status)
      const activateItem = page.getByRole('menuitem', { name: /activate/i });
      const deactivateItem = page.getByRole('menuitem', { name: /deactivate/i });

      const hasActivate = await activateItem.isVisible().catch(() => false);
      const hasDeactivate = await deactivateItem.isVisible().catch(() => false);

      expect(hasActivate || hasDeactivate).toBe(true);

      await page.keyboard.press('Escape');

      console.log('[Users] ✓ Bulk actions menu is available');
    });

    // Note: Actual user activation/deactivation tests are skipped by default
    // because they modify real user accounts in the shared environment.
    // These tests document the UI flow but require careful execution.

    test.skip('Can deactivate a user (CAUTION: modifies real user) [Admin]', async ({ page }) => {
      const usersPage = new UsersPage(page);
      await usersPage.goto();

      // Wait for table to load
      await expect(usersPage.table).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
      await page.waitForTimeout(E2E_TIMEOUTS.DRAWER_ANIMATION);

      // Select first active user
      await usersPage.selectUserRows(1);

      // Deactivate
      await usersPage.deactivateSelectedUsers();

      // Verify success
      await usersPage.verifySuccess();

      console.log('[Users] ✓ User deactivated');
    });

    test.skip('Can activate a user (CAUTION: modifies real user) [Admin]', async ({ page }) => {
      const usersPage = new UsersPage(page);
      await usersPage.goto();

      // Wait for table to load
      await expect(usersPage.table).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
      await page.waitForTimeout(E2E_TIMEOUTS.DRAWER_ANIMATION);

      // Select an inactive user (need to filter or find one)
      await usersPage.selectUserRows(1);

      // Activate
      await usersPage.activateSelectedUsers();

      // Verify success
      await usersPage.verifySuccess();

      console.log('[Users] ✓ User activated');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN - Full management access (User Invitation)
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('Admin Invitation', () => {
    test.use({ storageState: AUTH_V1_ADMIN });

    // Note: This test uses a fake email that won't actually send invites
    // It verifies the API call is made correctly

    test('Can submit invite form with valid email [Admin]', async ({ page }) => {
      const usersPage = new UsersPage(page);
      await usersPage.goto();

      // Track API call
      let inviteApiCalled = false;
      let inviteUrl = '';

      await page.route('**/users/invite', async (route) => {
        inviteApiCalled = true;
        inviteUrl = route.request().url();

        // Return success response
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      // Fill and submit invite form with test email
      const testEmail = `test-invite-${Date.now()}@example.invalid`;
      await usersPage.inviteUsers([testEmail], {
        message: 'E2E test invite',
        makeOrgAdmin: false,
      });

      // Verify API was called
      expect(inviteApiCalled).toBe(true);

      // Verify correct API URL pattern (should NOT contain '/management/')
      // Regression test for bug where wrong URL was used
      expect(inviteUrl).not.toContain('/management/');
      expect(inviteUrl).toContain('/users/invite');

      console.log('[Users] ✓ Invite API called with correct URL');
    });

    test('Invite form validates required email field [Admin]', async ({ page }) => {
      const usersPage = new UsersPage(page);
      await usersPage.goto();

      // Open invite modal
      await usersPage.openInviteModal();

      const modal = page.getByRole('dialog').first();

      // Try to submit without email
      const submitButton = modal.getByRole('button', { name: /invite new users/i });

      // Button should be disabled when email is empty
      await expect(submitButton).toBeDisabled();

      // Close modal
      await page.keyboard.press('Escape');

      console.log('[Users] ✓ Invite form validates email field');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // READONLYUSER - No page access at all
  // ═══════════════════════════════════════════════════════════════════════════
  // Add "unauthorized message" tests here
  // These tests should navigate to URL and verify blocked access

  test.describe('ReadOnlyUser', () => {
    test.use({ storageState: AUTH_V1_READONLY });

    test(`Users page shows unauthorized access [ReadOnlyUser]`, async ({ page }) => {
      await setupPage(page);
      await page.goto(USERS_URL);

      await expect(page.getByText(/You do not have access to/i)).toBeVisible({ timeout: E2E_TIMEOUTS.DETAIL_CONTENT });
    });
  });
});
