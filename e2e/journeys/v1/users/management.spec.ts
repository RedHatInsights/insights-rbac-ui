/**
 * V1 Users - Management Tests
 *
 * Tests for user activation, deactivation, and invitation.
 * Based on Storybook coverage:
 * - DeactivateUserJourney
 * - ActivateUserJourney
 * - InviteUsersJourney
 *
 * Note: These tests interact with real users in the organization.
 * They should be run carefully to avoid disrupting real user accounts.
 *
 * Personas: Admin (only admin can manage users)
 */

import { expect, test } from '@playwright/test';
import { AUTH_V1_ADMIN } from '../../../utils';
import { UsersPage } from '../../../pages/v1/UsersPage';

// ═══════════════════════════════════════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════════════════════════════════════

const TEST_PREFIX = process.env.TEST_PREFIX_V1;

if (!TEST_PREFIX) {
  throw new Error(
    '\n\n' +
      '╔══════════════════════════════════════════════════════════════════════╗\n' +
      '║  SAFETY RAIL: TEST_PREFIX_V1 environment variable is REQUIRED       ║\n' +
      '╚══════════════════════════════════════════════════════════════════════╝\n',
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Tests - Admin Only (User Status Management)
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Admin - User Status Management', () => {
  test.use({ storageState: AUTH_V1_ADMIN });

  test('Invite users button is visible [Admin]', async ({ page }) => {
    const usersPage = new UsersPage(page);
    await usersPage.goto();

    await expect(usersPage.inviteButton).toBeVisible({ timeout: 10000 });

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
    await expect(usersPage.table).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1000);

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
    await expect(usersPage.table).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1000);

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
    await expect(usersPage.table).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1000);

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
// Tests - Admin Only (User Invitation)
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Admin - User Invitation', () => {
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
