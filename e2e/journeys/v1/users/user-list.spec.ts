/**
 * User List Tests
 *
 * Tests for the users table/list view and user detail navigation.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * DECISION TREE - Add your test here if:
 * ═══════════════════════════════════════════════════════════════════════════════
 *   ✓ It tests table visibility or structure
 *   ✓ It tests search/filter functionality
 *   ✓ It tests sorting or pagination
 *   ✓ It navigates to user detail page
 *
 * DO NOT add here if:
 *   ✗ It manages user status (activate/deactivate) → user-management.spec.ts
 *   ✗ It invites users → user-management.spec.ts
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * CAPABILITIES & PERSONAS
 * ═══════════════════════════════════════════════════════════════════════════════
 * @capability View Users List, Search Users, View User Detail
 * @personas
 *   - Admin: Full list access
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * DATA PREREQUISITES
 * ═══════════════════════════════════════════════════════════════════════════════
 * @dependencies
 *   - AUTH: Uses AUTH_V1_ADMIN from utils
 *   - DATA: Uses getAdminUsername() from seed fixture
 *   - UTILS: Use UsersPage for table interactions
 */

import { expect, test } from '@playwright/test';
import { AUTH_V1_ADMIN, getAdminUsername } from '../../../utils';
import { UsersPage } from '../../../pages/v1/UsersPage';
import { E2E_TIMEOUTS } from '../../../utils/timeouts';

// Get known admin username from seed fixture (not from env vars)
const ADMIN_USERNAME = getAdminUsername('v1');

// ═══════════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════════

test.describe('User List', () => {
  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN - Full list access
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
});
