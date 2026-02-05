/**
 * V1 Users - View Tests
 *
 * Tests for viewing users on the V1 Users page.
 * Users are managed externally (SSO), so no CRUD operations.
 *
 * Personas: Admin (only admin can view users list)
 */

import { expect, test } from '@playwright/test';
import { AUTH_V1_ADMIN, getAdminUsername } from '../../../utils';
import { UsersPage } from '../../../pages/v1/UsersPage';
import { E2E_TIMEOUTS } from '../../../utils/timeouts';

// Get known admin username from seed fixture (not from env vars)
const ADMIN_USERNAME = getAdminUsername('v1');

// ═══════════════════════════════════════════════════════════════════════════
// Tests - Admin Only
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Admin', () => {
  test.use({ storageState: AUTH_V1_ADMIN });

  test(`Can view users list [Admin]`, async ({ page }) => {
    const usersPage = new UsersPage(page);
    await usersPage.goto();

    await expect(usersPage.table).toBeVisible();
    await expect(usersPage.usernameColumn).toBeVisible();
    await expect(usersPage.statusColumn).toBeVisible();
  });

  test(`Can search for users [Admin]`, async ({ page }) => {
    test.skip(!ADMIN_USERNAME, 'Admin username not configured in seed fixture');

    const usersPage = new UsersPage(page);
    await usersPage.goto();

    await usersPage.searchFor(ADMIN_USERNAME!);
    await expect(usersPage.getUserLink(ADMIN_USERNAME!)).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });

    await usersPage.clearSearch();
    await expect(usersPage.table).toBeVisible();
  });

  test(`Can view user detail page [Admin]`, async ({ page }) => {
    test.skip(!ADMIN_USERNAME, 'Admin username not configured in seed fixture');

    const usersPage = new UsersPage(page);
    await usersPage.goto();

    await usersPage.searchFor(ADMIN_USERNAME!);
    await usersPage.navigateToDetail(ADMIN_USERNAME!);

    // Verify detail page
    await expect(usersPage.getDetailHeading(ADMIN_USERNAME!)).toBeVisible({ timeout: E2E_TIMEOUTS.DETAIL_CONTENT });

    // Navigate back
    await usersPage.navigateBackToList();
  });
});
