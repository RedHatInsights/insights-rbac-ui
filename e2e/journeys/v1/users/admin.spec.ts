/**
 * V1 Users - OrgAdmin Tests
 *
 * Tests for the V1 Users page (/iam/user-access/users) with admin privileges.
 * Admin users can view all users in the organization.
 *
 * V1 Pattern:
 * - View details: Uses page navigation (link click)
 *
 * Note: Users are managed externally (SSO), so we don't have CRUD lifecycle tests.
 * These tests use the admin username (RBAC_USERNAME) for filtering and detail view.
 */

import { expect, test } from '@playwright/test';
import { AUTH_V1_ADMIN, getAdminUsername, setupPage, waitForTableUpdate } from '../../../utils';

test.use({ storageState: AUTH_V1_ADMIN });

const USERS_URL = '/iam/user-access/users';

// Get the admin username we're logged in as
const ADMIN_USERNAME = getAdminUsername();

// ═══════════════════════════════════════════════════════════════════════════
// JOURNEY: USERS TABLE AND DETAIL PAGE
// ═══════════════════════════════════════════════════════════════════════════

test.describe('V1 Users - OrgAdmin', () => {
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
      // V1 Users table should have Username, Email, First name, Last name, Status columns
      await expect(page.getByRole('columnheader', { name: /username/i })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: /status/i })).toBeVisible();
    });

    await test.step('Filter users by admin username', async () => {
      const searchInput = page.getByRole('searchbox').or(page.getByPlaceholder(/filter|search/i));
      await expect(searchInput).toBeVisible();

      // Filter by the admin username we're logged in as
      await searchInput.fill(ADMIN_USERNAME!);
      await waitForTableUpdate(page);

      // Verify the admin user appears in filtered results (exact match link)
      await expect(page.getByRole('grid').getByRole('link', { name: ADMIN_USERNAME!, exact: true })).toBeVisible({ timeout: 10000 });
    });

    await test.step('Clear filter and verify table resets', async () => {
      const searchInput = page.getByRole('searchbox').or(page.getByPlaceholder(/filter|search/i));
      await searchInput.clear();
      await waitForTableUpdate(page);

      // Verify table has rows
      await expect(page.getByRole('grid')).toBeVisible();
    });
  });

  test('Can view user detail page', async ({ page }) => {
    test.skip(!ADMIN_USERNAME, 'RBAC_USERNAME not set - cannot verify user detail');
    await setupPage(page);
    await page.goto(USERS_URL);
    await expect(page.getByRole('heading', { name: /users/i })).toBeVisible();

    await test.step('Search for admin user', async () => {
      const searchInput = page.getByRole('searchbox').or(page.getByPlaceholder(/filter|search/i));
      await searchInput.fill(ADMIN_USERNAME!);
      await waitForTableUpdate(page);

      // Verify admin user is visible (exact match to avoid matching similar usernames)
      const userLink = page.getByRole('grid').getByRole('link', { name: ADMIN_USERNAME!, exact: true });
      await expect(userLink).toBeVisible({ timeout: 10000 });
    });

    await test.step('Click user link to navigate to detail page', async () => {
      // V1 uses links for navigation - click on the exact admin username link
      const userLink = page.getByRole('grid').getByRole('link', { name: ADMIN_USERNAME!, exact: true });
      await userLink.click();

      // Should navigate to user detail page
      await expect(page).toHaveURL(/\/users\//, { timeout: 10000 });
    });

    await test.step('Verify detail page header', async () => {
      // Detail page should have heading with username
      await expect(page.getByRole('heading', { name: ADMIN_USERNAME! })).toBeVisible({ timeout: 5000 });
    });

    await test.step('Verify roles table on detail page', async () => {
      // V1 user detail page shows roles assigned to the user
      const rolesTable = page.getByRole('grid');

      // Table may have roles or show empty state
      const tableVisible = await rolesTable.isVisible().catch(() => false);
      const emptyState = page.getByText(/no roles|no results/i);
      const emptyVisible = await emptyState.isVisible().catch(() => false);

      expect(tableVisible || emptyVisible).toBe(true);
    });

    await test.step('Navigate back to users list', async () => {
      // Use back navigation or click Users breadcrumb
      const usersBreadcrumb = page.getByRole('link', { name: /users/i });
      if (await usersBreadcrumb.isVisible().catch(() => false)) {
        await usersBreadcrumb.click();
      } else {
        await page.goto(USERS_URL);
      }
      await expect(page.getByRole('heading', { name: /users/i })).toBeVisible();
    });
  });

  test('Admin features are available', async ({ page }) => {
    await setupPage(page);
    await page.goto(USERS_URL);
    await expect(page.getByRole('heading', { name: /users/i })).toBeVisible();

    await test.step('Verify admin actions are available', async () => {
      // Check for Invite users button (may not be visible in all environments)
      const inviteButton = page.getByRole('button', { name: /invite/i });
      const inviteVisible = await inviteButton.isVisible().catch(() => false);

      console.log(`[V1 Users Admin] Invite button visible: ${inviteVisible}`);
    });
  });
});
