/**
 * V1 Groups - CRUD Tests
 *
 * Tests for creating, editing, and deleting groups.
 * Uses test.describe.serial() for lifecycle tests.
 *
 * Personas: Admin (only admin can perform CRUD)
 */

import { expect, test } from '@playwright/test';
import { AUTH_V1_ADMIN, AUTH_V1_USERVIEWER } from '../../../utils';
import { getSeededGroupName } from '../../../utils/seed-map';
import { GroupsPage } from '../../../pages/v1/GroupsPage';

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

// Golden rule: always interact with seeded data from the seed map
const SEEDED_GROUP_NAME = getSeededGroupName('v1');
if (!SEEDED_GROUP_NAME) {
  throw new Error('No seeded group found in seed map. Run: npm run e2e:v1:seed');
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

    // Search for seeded group (system groups don't have edit/delete actions)
    await groupsPage.searchFor(SEEDED_GROUP_NAME);
    await groupsPage.openRowActions(SEEDED_GROUP_NAME);

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
      // Description should appear as subtitle once group data loads
      await expect(page.getByText(groupDescription)).toBeVisible({ timeout: 15000 });

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
      // Description should appear as subtitle once group data loads
      await expect(page.getByText(editedDescription)).toBeVisible({ timeout: 15000 });

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

    // Search for seeded group
    await groupsPage.searchFor(SEEDED_GROUP_NAME);

    // Try to find the kebab menu for the seeded group - it may not exist for UserViewer
    const seededGroupRow = groupsPage.getGroupRow(SEEDED_GROUP_NAME);
    const kebab = seededGroupRow.getByRole('button', { name: /actions/i });

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
