/**
 * User Group Management Tests
 *
 * Tests for creating, editing, and deleting user groups.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * DECISION TREE - Add your test here if:
 * ═══════════════════════════════════════════════════════════════════════════════
 *   ✓ It creates, edits, or deletes a user group
 *   ✓ It checks if a button/action for create/edit/delete is visible/hidden/disabled
 *   ✓ It verifies a permission denial (403) for write operations
 *
 * DO NOT add here if:
 *   ✗ It only reads/views data → user-group-detail.spec.ts
 *   ✗ It tests table sorting/filtering/pagination → user-group-list.spec.ts
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * CAPABILITIES & PERSONAS
 * ═══════════════════════════════════════════════════════════════════════════════
 * @capability Create User Group, Edit User Group, Delete User Group
 * @personas
 *   - Admin: Full CRUD access (use serial lifecycle for stateful tests)
 *   - UserViewer: Page blocked entirely (unauthorized message)
 *   - ReadOnlyUser: Page blocked entirely (unauthorized message)
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * DATA PREREQUISITES
 * ═══════════════════════════════════════════════════════════════════════════════
 * @dependencies
 *   - AUTH: Uses AUTH_V2_ADMIN, AUTH_V2_USERVIEWER, AUTH_V2_READONLY from utils
 *   - DATA: Relies on SEEDED_GROUP_NAME from seed-map (created in e2e:seed)
 *   - UTILS: Use UserGroupsPage.createButton.click() for UI tests
 *            Use getSeededGroupName() for existing data - NEVER create via UI in viewer tests
 *   - PREFIX: Requires TEST_PREFIX_V2 env var for safe test isolation
 */

import { expect, test } from '@playwright/test';
import { AUTH_V2_ADMIN, AUTH_V2_READONLY, AUTH_V2_USERVIEWER, setupPage } from '../../../utils';
import { UserGroupsPage } from '../../../pages/v2/UserGroupsPage';
import { E2E_TIMEOUTS } from '../../../utils/timeouts';

// ═══════════════════════════════════════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════════════════════════════════════

const TEST_PREFIX = process.env.TEST_PREFIX_V2;
const GROUPS_URL = '/iam/access-management/users-and-user-groups/user-groups';

if (!TEST_PREFIX) {
  throw new Error(
    '\n\n' +
      '╔══════════════════════════════════════════════════════════════════════╗\n' +
      '║  SAFETY RAIL: TEST_PREFIX_V2 environment variable is REQUIRED       ║\n' +
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
// Tests
// ═══════════════════════════════════════════════════════════════════════════

test.describe('User Group Management', () => {
  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN - Full CRUD access
  // ═══════════════════════════════════════════════════════════════════════════
  // STATEFUL TESTS: Add create→edit→delete chains in the serial block
  // ATOMIC TESTS: Add standalone checks (button visibility) in the regular block

  test.describe.serial('Admin Lifecycle', () => {
    test.use({ storageState: AUTH_V2_ADMIN });

    test('Create user group [Admin]', async ({ page }) => {
      const groupsPage = new UserGroupsPage(page);
      await groupsPage.goto();

      await groupsPage.createButton.click();
      await groupsPage.fillGroupForm(uniqueGroupName, groupDescription);

      console.log(`[Create] ✓ User group created: ${uniqueGroupName}`);
    });

    test('Verify group appears in table [Admin]', async ({ page }) => {
      const groupsPage = new UserGroupsPage(page);
      await groupsPage.goto();

      await groupsPage.searchFor(uniqueGroupName);
      await groupsPage.verifyGroupInTable(uniqueGroupName);

      console.log(`[Verify] ✓ Group found in table`);
    });

    test('View group in drawer [Admin]', async ({ page }) => {
      const groupsPage = new UserGroupsPage(page);
      await groupsPage.goto();

      await groupsPage.searchFor(uniqueGroupName);
      await groupsPage.openDrawer(uniqueGroupName);

      await expect(groupsPage.drawer.getByRole('heading', { name: uniqueGroupName })).toBeVisible();

      console.log(`[View] ✓ Drawer verified`);
    });

    test('Edit group navigates to edit page with pre-populated form [Admin]', async ({ page }) => {
      const groupsPage = new UserGroupsPage(page);
      await groupsPage.goto();

      await groupsPage.searchFor(uniqueGroupName);
      await groupsPage.openRowActions(uniqueGroupName);
      await groupsPage.clickRowAction('Edit');

      // Verify we navigated to the edit page
      await expect(page).toHaveURL(/\/edit-group\/[\w-]+/, { timeout: E2E_TIMEOUTS.URL_CHANGE });

      // Verify the form loaded with existing values
      await expect(groupsPage.editPageForm).toBeVisible({ timeout: E2E_TIMEOUTS.DETAIL_CONTENT });
      await expect(groupsPage.editPageNameInput).toHaveValue(uniqueGroupName);
      await expect(groupsPage.editPageDescriptionInput).toHaveValue(groupDescription);

      // Verify Users and Service accounts tabs are present
      await expect(groupsPage.getEditPageTab('Users')).toBeVisible();
      await expect(groupsPage.getEditPageTab('Service accounts')).toBeVisible();

      // Now edit name/description and submit
      await groupsPage.fillGroupForm(editedGroupName, editedDescription);

      console.log(`[Edit] ✓ Group renamed to: ${editedGroupName}`);
    });

    test('Verify edit was applied [Admin]', async ({ page }) => {
      const groupsPage = new UserGroupsPage(page);
      await groupsPage.goto();

      await groupsPage.searchFor(editedGroupName);
      await groupsPage.verifyGroupInTable(editedGroupName);

      console.log(`[Verify Edit] ✓ Changes confirmed`);
    });

    test('Delete group [Admin]', async ({ page }) => {
      const groupsPage = new UserGroupsPage(page);
      await groupsPage.goto();

      await groupsPage.searchFor(editedGroupName);
      await groupsPage.openRowActions(editedGroupName);
      await groupsPage.clickRowAction('Delete');
      await groupsPage.confirmDelete();

      console.log(`[Delete] ✓ Deletion confirmed`);
    });

    test('Verify group is deleted [Admin]', async ({ page }) => {
      const groupsPage = new UserGroupsPage(page);
      await groupsPage.goto();

      await groupsPage.searchFor(editedGroupName);
      await groupsPage.verifyGroupNotInTable(editedGroupName);

      console.log(`[Verify Delete] ✓ Group no longer exists`);
    });
  });

  test.describe('Admin', () => {
    test.use({ storageState: AUTH_V2_ADMIN });

    test(`Create User Group button is visible [Admin]`, async ({ page }) => {
      const groupsPage = new UserGroupsPage(page);
      await groupsPage.goto();

      await expect(groupsPage.createButton).toBeVisible();
    });

    test(`Create User Group button navigates to create form [Admin]`, async ({ page }) => {
      const groupsPage = new UserGroupsPage(page);
      await groupsPage.goto();

      await groupsPage.createButton.click();

      // Verify we navigated to the create page (uses EditUserGroup in create mode)
      await expect(page).toHaveURL(/\/create-group/, { timeout: E2E_TIMEOUTS.URL_CHANGE });
      await expect(groupsPage.editPageForm).toBeVisible({ timeout: E2E_TIMEOUTS.DETAIL_CONTENT });

      // In create mode, fields should be empty
      await expect(groupsPage.editPageNameInput).toHaveValue('');

      // Cancel to return to list
      await groupsPage.cancelEditForm();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // USERVIEWER - No page access at all
  // ═══════════════════════════════════════════════════════════════════════════
  // Add "unauthorized message" tests here
  // These tests should navigate to URL and verify blocked access

  test.describe('UserViewer', () => {
    test.use({ storageState: AUTH_V2_USERVIEWER });

    test(`User Groups page shows unauthorized access [UserViewer]`, async ({ page }) => {
      await setupPage(page);
      await page.goto(GROUPS_URL);

      await expect(page.getByText(/You do not have access to/i)).toBeVisible({ timeout: E2E_TIMEOUTS.DETAIL_CONTENT });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // READONLYUSER - No page access at all
  // ═══════════════════════════════════════════════════════════════════════════
  // Add "unauthorized message" tests here
  // These tests should navigate to URL and verify blocked access

  test.describe('ReadOnlyUser', () => {
    test.use({ storageState: AUTH_V2_READONLY });

    test(`User Groups page shows unauthorized access [ReadOnlyUser]`, async ({ page }) => {
      await setupPage(page);
      await page.goto(GROUPS_URL);

      await expect(page.getByText(/You do not have access to/i)).toBeVisible({ timeout: E2E_TIMEOUTS.DETAIL_CONTENT });
    });
  });
});
