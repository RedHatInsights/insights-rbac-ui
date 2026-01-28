/**
 * V2 Users - Admin Tests
 *
 * Tests for the V2 Users page (/iam/access-management/users-and-user-groups/users)
 * with admin privileges.
 *
 * V2 Key Differences from V1:
 * - View details: Uses drawer (row click), not page navigation
 *
 * Note: Users are managed externally (SSO), so we don't have CRUD lifecycle tests.
 * These tests use the admin username (RBAC_USERNAME) for filtering and detail view.
 */

import { expect, test } from '@playwright/test';
import { AUTH_V2_ADMIN, getAdminUsername, setupPage, waitForTableUpdate } from '../../../../utils';

test.use({ storageState: AUTH_V2_ADMIN });

const USERS_URL = '/iam/access-management/users-and-user-groups/users';

// Get the admin username we're logged in as
const ADMIN_USERNAME = getAdminUsername();

// ═══════════════════════════════════════════════════════════════════════════
// JOURNEY: USERS TABLE AND DRAWER
// ═══════════════════════════════════════════════════════════════════════════

test.describe('V2 Users - Admin', () => {
  test('Can view and filter users', async ({ page }) => {
    test.skip(!ADMIN_USERNAME, 'RBAC_USERNAME not set - cannot verify user filtering');
    await setupPage(page);
    await page.goto(USERS_URL);

    await test.step('Verify page loads with users table', async () => {
      await expect(page.getByRole('heading', { name: /users/i })).toBeVisible();
      const grid = page.getByRole('grid');
      await expect(grid).toBeVisible();
    });

    await test.step('Verify table has expected columns', async () => {
      // V2 Users table should have Username, Email, First name, Last name, Status columns
      await expect(page.getByRole('columnheader', { name: /username/i })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: /email/i })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: /status/i })).toBeVisible();
    });

    await test.step('Filter users by admin username', async () => {
      const searchInput = page.getByRole('searchbox').or(page.getByPlaceholder(/filter|search/i));
      await expect(searchInput).toBeVisible();

      // Filter by the admin username we're logged in as
      await searchInput.fill(ADMIN_USERNAME!);
      await waitForTableUpdate(page);

      // Verify the admin user appears in filtered results (exact match)
      await expect(page.getByRole('grid').getByText(ADMIN_USERNAME!, { exact: true })).toBeVisible({ timeout: 10000 });
    });

    await test.step('Clear filter and verify table resets', async () => {
      const searchInput = page.getByRole('searchbox').or(page.getByPlaceholder(/filter|search/i));
      await searchInput.clear();
      await waitForTableUpdate(page);

      // Verify table has rows
      await expect(page.getByRole('grid')).toBeVisible();
    });
  });

  test('Can view user details in drawer', async ({ page }) => {
    test.skip(!ADMIN_USERNAME, 'RBAC_USERNAME not set - cannot verify user detail');
    await setupPage(page);
    await page.goto(USERS_URL);
    await expect(page.getByRole('heading', { name: /users/i })).toBeVisible();

    await test.step('Search for admin user', async () => {
      const searchInput = page.getByRole('searchbox').or(page.getByPlaceholder(/filter|search/i));
      await searchInput.fill(ADMIN_USERNAME!);
      await waitForTableUpdate(page);

      // Verify admin user is visible (exact match)
      await expect(page.getByRole('grid').getByText(ADMIN_USERNAME!, { exact: true })).toBeVisible({ timeout: 10000 });
    });

    await test.step('Click user row to open drawer', async () => {
      // Click on the admin user's row (exact match)
      const userCell = page.getByRole('grid').getByText(ADMIN_USERNAME!, { exact: true });
      await userCell.click();

      // Wait for drawer to open
      const drawer = page.locator('[data-ouia-component-id="user-details-drawer"]');
      await expect(drawer).toBeVisible({ timeout: 10000 });
    });

    await test.step('Verify drawer header shows user info', async () => {
      const drawer = page.locator('[data-ouia-component-id="user-details-drawer"]');

      // Drawer should have user's name as heading
      await expect(drawer.getByRole('heading', { level: 2 })).toBeVisible();

      // Drawer should show user's email
      const email = drawer.locator('p').filter({ hasText: /@/ });
      await expect(email).toBeVisible();
    });

    await test.step('Verify User groups tab', async () => {
      const drawer = page.locator('[data-ouia-component-id="user-details-drawer"]');

      // User groups tab should be visible
      const userGroupsTab = drawer.getByRole('tab', { name: /user groups/i });
      await expect(userGroupsTab).toBeVisible();

      // Click on User groups tab to ensure it's active
      await userGroupsTab.click();

      // Tab content should load (may show groups or empty state)
      await expect(drawer.locator('[role="tabpanel"]').or(drawer.locator('.pf-v6-c-tab-content'))).toBeVisible({ timeout: 5000 });
    });

    await test.step('Verify Assigned roles tab', async () => {
      const drawer = page.locator('[data-ouia-component-id="user-details-drawer"]');

      // Assigned roles tab should be visible
      const rolesTab = drawer.getByRole('tab', { name: /assigned roles/i });
      await expect(rolesTab).toBeVisible();

      // Click on Assigned roles tab
      await rolesTab.click();

      // Tab content should load (may show roles or empty state)
      await expect(drawer.locator('[role="tabpanel"]').or(drawer.locator('.pf-v6-c-tab-content'))).toBeVisible({ timeout: 5000 });
    });

    await test.step('Close drawer', async () => {
      // Click the same user row again to toggle drawer closed (exact match)
      const userCell = page.getByRole('grid').getByText(ADMIN_USERNAME!, { exact: true });
      await userCell.click();

      // Verify drawer is closed
      const drawer = page.locator('[data-ouia-component-id="user-details-drawer"]');
      await expect(drawer).not.toBeVisible({ timeout: 5000 });
    });
  });

  test('Admin features are available', async ({ page }) => {
    await setupPage(page);
    await page.goto(USERS_URL);
    await expect(page.getByRole('heading', { name: /users/i })).toBeVisible();

    await test.step('Verify admin actions are available', async () => {
      // Check for Invite users button (may not be visible in all environments)
      const inviteButton = page.getByRole('button', { name: /invite/i });
      const addToGroupButton = page.getByRole('button', { name: /add to user group/i });

      const inviteVisible = await inviteButton.isVisible().catch(() => false);
      const addToGroupVisible = await addToGroupButton.isVisible().catch(() => false);

      console.log(`[V2 Users Admin] Invite button visible: ${inviteVisible}`);
      console.log(`[V2 Users Admin] Add to user group button visible: ${addToGroupVisible}`);

      // At least one admin action should be available
      expect(inviteVisible || addToGroupVisible).toBe(true);
    });
  });
});
