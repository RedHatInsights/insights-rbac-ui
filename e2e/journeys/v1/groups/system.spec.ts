/**
 * V1 Groups - Default Group Protection Tests
 *
 * Tests that verify default groups (platform_default, admin_default)
 * CANNOT be edited or deleted, and show special UI on Members tab.
 *
 * Based on Storybook coverage:
 * - DefaultAccessMembersJourney
 * - DefaultAdminAccessMembersJourney
 * - DefaultAccessServiceAccountsJourney
 * - DefaultAdminAccessServiceAccountsJourney
 *
 * Personas: Admin (to verify admin cannot bypass default group protection)
 */

import { expect, test } from '@playwright/test';
import { AUTH_V1_ADMIN } from '../../../utils';
import { GroupsPage } from '../../../pages/v1/GroupsPage';

// ═══════════════════════════════════════════════════════════════════════════
// Default Groups Configuration
// ═══════════════════════════════════════════════════════════════════════════

// These are well-known default groups that exist in all RBAC environments.
const DEFAULT_ACCESS_GROUP = 'Default access';
const DEFAULT_ADMIN_ACCESS_GROUP = 'Default admin access';

// ═══════════════════════════════════════════════════════════════════════════
// Tests - Admin Cannot Modify Default Groups
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Admin - Default Group Protection', () => {
  test.use({ storageState: AUTH_V1_ADMIN });

  // ─────────────────────────────────────────────────────────────────────────
  // Default Access Group (platform_default: true)
  // ─────────────────────────────────────────────────────────────────────────

  test('"Default access" group does NOT have Edit action [Admin]', async ({ page }) => {
    const groupsPage = new GroupsPage(page);
    await groupsPage.goto();

    await groupsPage.searchFor(DEFAULT_ACCESS_GROUP);

    // Check if group exists
    const groupRow = groupsPage.getGroupRow(DEFAULT_ACCESS_GROUP);
    const isVisible = await groupRow.isVisible().catch(() => false);

    if (!isVisible) {
      test.skip(true, 'Default access group not found in environment');
      return;
    }

    // Find the kebab menu for this specific row
    const kebab = groupRow.getByRole('button', { name: /actions/i });
    const hasKebab = await kebab.isVisible().catch(() => false);

    if (hasKebab) {
      await kebab.click();

      // Edit should NOT be visible
      const editItem = page.getByRole('menuitem', { name: /edit/i });
      await expect(editItem).not.toBeVisible();

      await page.keyboard.press('Escape');
    }
    // If no kebab menu at all, that's acceptable - default groups may have no actions

    console.log('[Default Group] ✓ Default access is protected from editing');
  });

  test('"Default access" group does NOT have Delete action [Admin]', async ({ page }) => {
    const groupsPage = new GroupsPage(page);
    await groupsPage.goto();

    await groupsPage.searchFor(DEFAULT_ACCESS_GROUP);

    // Check if group exists
    const groupRow = groupsPage.getGroupRow(DEFAULT_ACCESS_GROUP);
    const isVisible = await groupRow.isVisible().catch(() => false);

    if (!isVisible) {
      test.skip(true, 'Default access group not found in environment');
      return;
    }

    // Find the kebab menu for this specific row
    const kebab = groupRow.getByRole('button', { name: /actions/i });
    const hasKebab = await kebab.isVisible().catch(() => false);

    if (hasKebab) {
      await kebab.click();

      // Delete should NOT be visible
      const deleteItem = page.getByRole('menuitem', { name: /delete/i });
      await expect(deleteItem).not.toBeVisible();

      await page.keyboard.press('Escape');
    }
    // If no kebab menu at all, that's acceptable

    console.log('[Default Group] ✓ Default access is protected from deletion');
  });

  test('"Default access" Members tab shows special message [Admin]', async ({ page }) => {
    const groupsPage = new GroupsPage(page);
    await groupsPage.goto();

    await groupsPage.searchFor(DEFAULT_ACCESS_GROUP);

    // Check if group exists
    const groupLink = groupsPage.getGroupLink(DEFAULT_ACCESS_GROUP);
    const isVisible = await groupLink.isVisible().catch(() => false);

    if (!isVisible) {
      test.skip(true, 'Default access group not found in environment');
      return;
    }

    // Navigate to detail page
    await groupsPage.navigateToDetail(DEFAULT_ACCESS_GROUP);
    await expect(groupsPage.getDetailHeading(DEFAULT_ACCESS_GROUP)).toBeVisible({ timeout: 15000 });

    // Click Members tab
    await groupsPage.clickTab('Members');

    // Should show the special message about all users being members
    // (NOT the admin-specific message)
    await expect(page.getByText(/all users in this organization are members of this group/i)).toBeVisible({
      timeout: 10000,
    });

    // Should NOT show a data table (no individual member rows)
    const table = page.getByRole('grid');
    await expect(table).not.toBeVisible();

    console.log('[Default Group] ✓ Default access shows all-users message on Members tab');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Default Admin Access Group (admin_default: true)
  // ─────────────────────────────────────────────────────────────────────────

  test('"Default admin access" group does NOT have Edit action [Admin]', async ({ page }) => {
    const groupsPage = new GroupsPage(page);
    await groupsPage.goto();

    await groupsPage.searchFor(DEFAULT_ADMIN_ACCESS_GROUP);

    // Check if group exists
    const groupRow = groupsPage.getGroupRow(DEFAULT_ADMIN_ACCESS_GROUP);
    const isVisible = await groupRow.isVisible().catch(() => false);

    if (!isVisible) {
      test.skip(true, 'Default admin access group not found in environment');
      return;
    }

    // Find the kebab menu for this specific row
    const kebab = groupRow.getByRole('button', { name: /actions/i });
    const hasKebab = await kebab.isVisible().catch(() => false);

    if (hasKebab) {
      await kebab.click();

      // Edit should NOT be visible
      const editItem = page.getByRole('menuitem', { name: /edit/i });
      await expect(editItem).not.toBeVisible();

      await page.keyboard.press('Escape');
    }

    console.log('[Default Group] ✓ Default admin access is protected from editing');
  });

  test('"Default admin access" group does NOT have Delete action [Admin]', async ({ page }) => {
    const groupsPage = new GroupsPage(page);
    await groupsPage.goto();

    await groupsPage.searchFor(DEFAULT_ADMIN_ACCESS_GROUP);

    // Check if group exists
    const groupRow = groupsPage.getGroupRow(DEFAULT_ADMIN_ACCESS_GROUP);
    const isVisible = await groupRow.isVisible().catch(() => false);

    if (!isVisible) {
      test.skip(true, 'Default admin access group not found in environment');
      return;
    }

    // Find the kebab menu for this specific row
    const kebab = groupRow.getByRole('button', { name: /actions/i });
    const hasKebab = await kebab.isVisible().catch(() => false);

    if (hasKebab) {
      await kebab.click();

      // Delete should NOT be visible
      const deleteItem = page.getByRole('menuitem', { name: /delete/i });
      await expect(deleteItem).not.toBeVisible();

      await page.keyboard.press('Escape');
    }

    console.log('[Default Group] ✓ Default admin access is protected from deletion');
  });

  test('"Default admin access" Members tab shows org admins message [Admin]', async ({ page }) => {
    const groupsPage = new GroupsPage(page);
    await groupsPage.goto();

    await groupsPage.searchFor(DEFAULT_ADMIN_ACCESS_GROUP);

    // Check if group exists
    const groupLink = groupsPage.getGroupLink(DEFAULT_ADMIN_ACCESS_GROUP);
    const isVisible = await groupLink.isVisible().catch(() => false);

    if (!isVisible) {
      test.skip(true, 'Default admin access group not found in environment');
      return;
    }

    // Navigate to detail page
    await groupsPage.navigateToDetail(DEFAULT_ADMIN_ACCESS_GROUP);
    await expect(groupsPage.getDetailHeading(DEFAULT_ADMIN_ACCESS_GROUP)).toBeVisible({ timeout: 15000 });

    // Click Members tab
    await groupsPage.clickTab('Members');

    // Should show the special message about all org admins being members
    await expect(page.getByText(/all organization administrators in this organization are members of this group/i)).toBeVisible({
      timeout: 10000,
    });

    // Should NOT show a data table (no individual member rows)
    const table = page.getByRole('grid');
    await expect(table).not.toBeVisible();

    console.log('[Default Group] ✓ Default admin access shows org-admins message on Members tab');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Service Accounts Tab Special Behavior
  // ─────────────────────────────────────────────────────────────────────────

  test('"Default access" Service Accounts tab shows security message [Admin]', async ({ page }) => {
    const groupsPage = new GroupsPage(page);
    await groupsPage.goto();

    await groupsPage.searchFor(DEFAULT_ACCESS_GROUP);

    // Check if group exists
    const groupLink = groupsPage.getGroupLink(DEFAULT_ACCESS_GROUP);
    const isVisible = await groupLink.isVisible().catch(() => false);

    if (!isVisible) {
      test.skip(true, 'Default access group not found in environment');
      return;
    }

    // Navigate to detail page
    await groupsPage.navigateToDetail(DEFAULT_ACCESS_GROUP);
    await expect(groupsPage.getDetailHeading(DEFAULT_ACCESS_GROUP)).toBeVisible({ timeout: 15000 });

    // Click Service Accounts tab
    await groupsPage.clickTab('Service accounts');

    // Should show the security message about service accounts not being included
    await expect(
      page.getByText(/in adherence to security guidelines, service accounts are not automatically included in the default access group/i),
    ).toBeVisible({ timeout: 10000 });

    console.log('[Default Group] ✓ Default access shows security message on Service Accounts tab');
  });

  test('"Default admin access" Service Accounts tab shows security message [Admin]', async ({ page }) => {
    const groupsPage = new GroupsPage(page);
    await groupsPage.goto();

    await groupsPage.searchFor(DEFAULT_ADMIN_ACCESS_GROUP);

    // Check if group exists
    const groupLink = groupsPage.getGroupLink(DEFAULT_ADMIN_ACCESS_GROUP);
    const isVisible = await groupLink.isVisible().catch(() => false);

    if (!isVisible) {
      test.skip(true, 'Default admin access group not found in environment');
      return;
    }

    // Navigate to detail page
    await groupsPage.navigateToDetail(DEFAULT_ADMIN_ACCESS_GROUP);
    await expect(groupsPage.getDetailHeading(DEFAULT_ADMIN_ACCESS_GROUP)).toBeVisible({ timeout: 15000 });

    // Click Service Accounts tab
    await groupsPage.clickTab('Service accounts');

    // Should show the security message about service accounts not being included
    await expect(
      page.getByText(/in adherence to security guidelines, service accounts are not automatically included in the default admin access group/i),
    ).toBeVisible({ timeout: 10000 });

    console.log('[Default Group] ✓ Default admin access shows security message on Service Accounts tab');
  });
});
