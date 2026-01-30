/**
 * V1 Groups - CRUD Tests
 *
 * Tests for creating, editing, and deleting groups.
 * Uses test.describe.serial() for lifecycle tests.
 *
 * Personas: Admin (only admin can perform CRUD)
 */

import { expect, test } from '@playwright/test';
import { AUTH_V1_ADMIN } from '../../../utils';
import { GroupsPage } from '../../../pages/v1/GroupsPage';

// ═══════════════════════════════════════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════════════════════════════════════

const TEST_PREFIX = process.env.TEST_PREFIX;

if (!TEST_PREFIX) {
  throw new Error(
    '\n\n' +
      '╔══════════════════════════════════════════════════════════════════════╗\n' +
      '║  SAFETY RAIL: TEST_PREFIX environment variable is REQUIRED          ║\n' +
      '╚══════════════════════════════════════════════════════════════════════╝\n',
  );
}

// Generate unique name for this test run
const timestamp = Date.now();
const uniqueGroupName = `${TEST_PREFIX}__E2E_Lifecycle_${timestamp}`;
const groupDescription = 'E2E lifecycle test group';
const editedGroupName = `${uniqueGroupName}_Edited`;
const editedDescription = 'E2E lifecycle test group - EDITED';

// ═══════════════════════════════════════════════════════════════════════════
// Tests - Admin Only
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Admin', () => {
  test.use({ storageState: AUTH_V1_ADMIN });

  test(`Create Group button is visible [Admin]`, async ({ page }) => {
    const groupsPage = new GroupsPage(page);
    await groupsPage.goto();

    await expect(groupsPage.createButton).toBeVisible();
  });

  test(`Edit and Delete actions are available [Admin]`, async ({ page }) => {
    const groupsPage = new GroupsPage(page);
    await groupsPage.goto();

    // Open row actions on first group
    const firstRow = groupsPage.table.getByRole('row').nth(1);
    const kebab = firstRow.getByRole('button', { name: /actions/i });
    await kebab.click();

    // Verify actions
    await expect(page.getByRole('menuitem', { name: /edit/i })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /delete/i })).toBeVisible();
    await page.keyboard.press('Escape');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // CRUD Lifecycle - Sequential Tests
  // ─────────────────────────────────────────────────────────────────────────

  test.describe.serial('CRUD Lifecycle [Admin]', () => {
    test('Create group via wizard', async ({ page }) => {
      const groupsPage = new GroupsPage(page);
      await groupsPage.goto();

      await groupsPage.createButton.click();
      await groupsPage.fillCreateWizard(uniqueGroupName, groupDescription);

      console.log(`[Create] ✓ Group created: ${uniqueGroupName}`);
    });

    test('Verify group appears in table', async ({ page }) => {
      const groupsPage = new GroupsPage(page);
      await groupsPage.goto();

      await groupsPage.searchFor(uniqueGroupName);
      await groupsPage.verifyGroupInTable(uniqueGroupName);

      console.log(`[Verify] ✓ Group found in table`);
    });

    test('View group detail page', async ({ page }) => {
      const groupsPage = new GroupsPage(page);
      await groupsPage.goto();

      await groupsPage.searchFor(uniqueGroupName);
      await groupsPage.navigateToDetail(uniqueGroupName);

      await expect(groupsPage.getDetailHeading(uniqueGroupName)).toBeVisible({ timeout: 10000 });
      await expect(page.getByText(groupDescription)).toBeVisible();

      console.log(`[View] ✓ Detail page verified`);
    });

    test('Edit group from list', async ({ page }) => {
      const groupsPage = new GroupsPage(page);
      await groupsPage.goto();

      await groupsPage.searchFor(uniqueGroupName);
      await groupsPage.openRowActions(uniqueGroupName);
      await groupsPage.clickRowAction('Edit');
      await groupsPage.fillEditModal(editedGroupName, editedDescription);
      await groupsPage.verifySuccess();

      console.log(`[Edit] ✓ Group renamed to: ${editedGroupName}`);
    });

    test('Verify edit was applied', async ({ page }) => {
      const groupsPage = new GroupsPage(page);
      await groupsPage.goto();

      await groupsPage.searchFor(editedGroupName);
      await groupsPage.verifyGroupInTable(editedGroupName);

      await groupsPage.navigateToDetail(editedGroupName);
      await expect(page.getByText(editedDescription)).toBeVisible();

      console.log(`[Verify Edit] ✓ Changes confirmed`);
    });

    test('Delete group', async ({ page }) => {
      const groupsPage = new GroupsPage(page);
      await groupsPage.goto();

      await groupsPage.searchFor(editedGroupName);
      await groupsPage.openRowActions(editedGroupName);
      await groupsPage.clickRowAction('Delete');
      await groupsPage.confirmDelete(editedGroupName);

      console.log(`[Delete] ✓ Deletion confirmed`);
    });

    test('Verify group is deleted', async ({ page }) => {
      const groupsPage = new GroupsPage(page);
      await groupsPage.goto();

      await groupsPage.searchFor(editedGroupName);
      await groupsPage.verifyGroupNotInTable(editedGroupName);

      console.log(`[Verify Delete] ✓ Group no longer exists`);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// UserViewer - Read-Only Restrictions
// ═══════════════════════════════════════════════════════════════════════════

test.describe('UserViewer', () => {
  test.use({ storageState: AUTH_V1_USERVIEWER });

  test(`Create Group button is NOT visible [UserViewer]`, async ({ page }) => {
    const groupsPage = new GroupsPage(page);
    await groupsPage.goto();

    await expect(groupsPage.createButton).not.toBeVisible();
  });

  test(`Row actions do NOT include Edit or Delete [UserViewer]`, async ({ page }) => {
    const groupsPage = new GroupsPage(page);
    await groupsPage.goto();

    // Try to find any kebab menu - it may not exist for UserViewer
    const firstRow = groupsPage.table.getByRole('row').nth(1);
    const kebab = firstRow.getByRole('button', { name: /actions/i });

    if (await kebab.isVisible().catch(() => false)) {
      await kebab.click();

      // If menu opens, Edit/Delete should not be there
      const editItem = page.getByRole('menuitem', { name: /edit/i });
      const deleteItem = page.getByRole('menuitem', { name: /delete/i });

      await expect(editItem).not.toBeVisible();
      await expect(deleteItem).not.toBeVisible();
      await page.keyboard.press('Escape');
    }
    // If no kebab, that's also acceptable for read-only users
  });
});
