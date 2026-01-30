/**
 * V2 User Groups - CRUD Tests
 *
 * Tests for creating, editing, and deleting user groups.
 * Uses test.describe.serial() for lifecycle tests.
 *
 * Personas: Admin (only admin can perform CRUD)
 */

import { expect, test } from '@playwright/test';
import { AUTH_V2_ADMIN, AUTH_V2_USERVIEWER } from '../../../utils';
import { UserGroupsPage } from '../../../pages/v2/UserGroupsPage';

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
  test.use({ storageState: AUTH_V2_ADMIN });

  test(`Create User Group button is visible [Admin]`, async ({ page }) => {
    const groupsPage = new UserGroupsPage(page);
    await groupsPage.goto();

    await expect(groupsPage.createButton).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // CRUD Lifecycle - Sequential Tests
  // ─────────────────────────────────────────────────────────────────────────

  test.describe.serial('CRUD Lifecycle [Admin]', () => {
    test('Create user group', async ({ page }) => {
      const groupsPage = new UserGroupsPage(page);
      await groupsPage.goto();

      await groupsPage.createButton.click();
      await groupsPage.fillGroupForm(uniqueGroupName, groupDescription);

      console.log(`[Create] ✓ User group created: ${uniqueGroupName}`);
    });

    test('Verify group appears in table', async ({ page }) => {
      const groupsPage = new UserGroupsPage(page);
      await groupsPage.goto();

      await groupsPage.searchFor(uniqueGroupName);
      await groupsPage.verifyGroupInTable(uniqueGroupName);

      console.log(`[Verify] ✓ Group found in table`);
    });

    test('View group in drawer', async ({ page }) => {
      const groupsPage = new UserGroupsPage(page);
      await groupsPage.goto();

      await groupsPage.searchFor(uniqueGroupName);
      await groupsPage.openDrawer(uniqueGroupName);

      await expect(groupsPage.drawer.getByRole('heading', { name: uniqueGroupName })).toBeVisible();

      console.log(`[View] ✓ Drawer verified`);
    });

    test('Edit group', async ({ page }) => {
      const groupsPage = new UserGroupsPage(page);
      await groupsPage.goto();

      await groupsPage.searchFor(uniqueGroupName);
      await groupsPage.openRowActions(uniqueGroupName);
      await groupsPage.clickRowAction('Edit');
      await groupsPage.fillGroupForm(editedGroupName, editedDescription);

      console.log(`[Edit] ✓ Group renamed to: ${editedGroupName}`);
    });

    test('Verify edit was applied', async ({ page }) => {
      const groupsPage = new UserGroupsPage(page);
      await groupsPage.goto();

      await groupsPage.searchFor(editedGroupName);
      await groupsPage.verifyGroupInTable(editedGroupName);

      console.log(`[Verify Edit] ✓ Changes confirmed`);
    });

    test('Delete group', async ({ page }) => {
      const groupsPage = new UserGroupsPage(page);
      await groupsPage.goto();

      await groupsPage.searchFor(editedGroupName);
      await groupsPage.openRowActions(editedGroupName);
      await groupsPage.clickRowAction('Delete');
      await groupsPage.confirmDelete();

      console.log(`[Delete] ✓ Deletion confirmed`);
    });

    test('Verify group is deleted', async ({ page }) => {
      const groupsPage = new UserGroupsPage(page);
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
  test.use({ storageState: AUTH_V2_USERVIEWER });

  test(`Create User Group button is NOT visible [UserViewer]`, async ({ page }) => {
    const groupsPage = new UserGroupsPage(page);
    await groupsPage.goto();

    await expect(groupsPage.createButton).not.toBeVisible();
  });
});
