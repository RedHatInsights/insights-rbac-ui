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
 *   - AUTH: Uses AUTH_V2_ORGADMIN, AUTH_V2_USERVIEWER, AUTH_V2_READONLY from utils
 *   - DATA: Relies on SEEDED_GROUP_NAME from seed-map (created in e2e:seed)
 *   - UTILS: Use UserGroupsPage.createButton.click() for UI tests
 *            Use getSeededGroupName() for existing data - NEVER create via UI in viewer tests
 *   - PREFIX: Requires TEST_PREFIX_V2 env var for safe test isolation
 */

import { expect, test } from '@playwright/test';
import {
  AUTH_V2_ORGADMIN,
  AUTH_V2_RBACADMIN,
  AUTH_V2_READONLY,
  AUTH_V2_USERVIEWER,
  AUTH_V2_WORKSPACEUSER,
  iamUrl,
  requireTestPrefix,
  setupPage,
  v2,
} from '../../../utils';
import { UserGroupsPage } from '../../../pages/v2/UserGroupsPage';
import { E2E_TIMEOUTS } from '../../../utils/timeouts';

// ═══════════════════════════════════════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════════════════════════════════════

const TEST_PREFIX = requireTestPrefix('v2');
const GROUPS_URL = iamUrl(v2.userGroups.link());

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

  test.describe.serial('OrgAdmin Lifecycle', () => {
    test.use({ storageState: AUTH_V2_ORGADMIN });

    test('Create user group [OrgAdmin]', async ({ page }) => {
      const groupsPage = new UserGroupsPage(page);
      await groupsPage.goto();

      await groupsPage.createButton.click();
      await groupsPage.fillGroupForm(uniqueGroupName, groupDescription);
    });

    test('Verify group appears in table [OrgAdmin]', async ({ page }) => {
      const groupsPage = new UserGroupsPage(page);
      await groupsPage.goto();

      await groupsPage.searchFor(uniqueGroupName);
      await groupsPage.verifyGroupInTable(uniqueGroupName);
    });

    test('View group in drawer [OrgAdmin]', async ({ page }) => {
      const groupsPage = new UserGroupsPage(page);
      await groupsPage.goto();

      await groupsPage.searchFor(uniqueGroupName);
      await groupsPage.openDrawer(uniqueGroupName);

      await expect(groupsPage.drawer.getByRole('heading', { name: uniqueGroupName })).toBeVisible();
    });

    test('Edit group navigates to edit page with pre-populated form [OrgAdmin]', async ({ page }) => {
      const groupsPage = new UserGroupsPage(page);
      await groupsPage.goto();

      await groupsPage.searchFor(uniqueGroupName);
      await groupsPage.openRowActions(uniqueGroupName);
      await groupsPage.clickRowAction('Edit');

      // Verify the form loaded with existing values
      await expect(groupsPage.editPageForm).toBeVisible({ timeout: E2E_TIMEOUTS.DETAIL_CONTENT });
      await expect(groupsPage.editPageNameInput).toHaveValue(uniqueGroupName);
      await expect(groupsPage.editPageDescriptionInput).toHaveValue(groupDescription);

      // Verify Users and Service accounts tabs are present
      await expect(groupsPage.getEditPageTab('Users')).toBeVisible();
      await expect(groupsPage.getEditPageTab('Service accounts')).toBeVisible();

      // Now edit name/description and submit
      await groupsPage.fillGroupForm(editedGroupName, editedDescription);
    });

    test('Verify edit was applied [OrgAdmin]', async ({ page }) => {
      const groupsPage = new UserGroupsPage(page);
      await groupsPage.goto();

      await groupsPage.searchFor(editedGroupName);
      await groupsPage.verifyGroupInTable(editedGroupName);
    });

    test('Delete group [OrgAdmin]', async ({ page }) => {
      const groupsPage = new UserGroupsPage(page);
      await groupsPage.goto();

      await groupsPage.searchFor(editedGroupName);
      await groupsPage.openRowActions(editedGroupName);
      await groupsPage.clickRowAction('Delete');
      await groupsPage.confirmDelete();
    });

    test('Verify group is deleted [OrgAdmin]', async ({ page }) => {
      const groupsPage = new UserGroupsPage(page);
      await groupsPage.goto();

      await groupsPage.searchFor(editedGroupName);
      await groupsPage.verifyGroupNotInTable(editedGroupName);
    });
  });

  test.describe('OrgAdmin', () => {
    test.use({ storageState: AUTH_V2_ORGADMIN });

    test(`Create User Group button is visible [OrgAdmin]`, async ({ page }) => {
      const groupsPage = new UserGroupsPage(page);
      await groupsPage.goto();

      await expect(groupsPage.createButton).toBeVisible();
    });

    test('Default access group has no Edit action and Delete is disabled [OrgAdmin]', async ({ page }) => {
      const groupsPage = new UserGroupsPage(page);
      await groupsPage.goto();

      await page.getByRole('button', { name: 'Actions for group Default access' }).click();
      // Edit action should not be present at all
      await expect(page.getByRole('menuitem', { name: /edit user group/i })).not.toBeVisible({
        timeout: E2E_TIMEOUTS.MENU_ANIMATION,
      });
      // Delete action should be present but disabled
      await expect(page.getByRole('menuitem', { name: /delete user group/i })).toBeDisabled({
        timeout: E2E_TIMEOUTS.MENU_ANIMATION,
      });
    });

    test('Default admin access group has no Edit action and Delete is disabled [OrgAdmin]', async ({ page }) => {
      const groupsPage = new UserGroupsPage(page);
      await groupsPage.goto();

      await page.getByRole('button', { name: 'Actions for group Default admin access' }).click();
      // Edit action should not be present at all
      await expect(page.getByRole('menuitem', { name: /edit user group/i })).not.toBeVisible({
        timeout: E2E_TIMEOUTS.MENU_ANIMATION,
      });
      // Delete action should be present but disabled
      await expect(page.getByRole('menuitem', { name: /delete user group/i })).toBeDisabled({
        timeout: E2E_TIMEOUTS.MENU_ANIMATION,
      });
    });

    test(`Create User Group button navigates to create form [OrgAdmin]`, async ({ page }) => {
      const groupsPage = new UserGroupsPage(page);
      await groupsPage.goto();

      await groupsPage.createButton.click();

      // Verify we navigated to the create page (uses EditUserGroup in create mode)
      await expect(page).toHaveURL(new RegExp(iamUrl(v2.usersAndUserGroupsCreateGroup.link())), { timeout: E2E_TIMEOUTS.URL_CHANGE });
      await expect(groupsPage.editPageForm).toBeVisible({ timeout: E2E_TIMEOUTS.DETAIL_CONTENT });

      // In create mode, fields should be empty
      await expect(groupsPage.editPageNameInput).toHaveValue('');

      // Cancel to return to list
      await groupsPage.cancelEditForm();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Admin - Bulk Delete
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe.serial('OrgAdmin — Bulk Delete', () => {
    test.use({ storageState: AUTH_V2_ORGADMIN });

    const bulkTimestamp = Date.now();
    const bulkGroup1 = `${TEST_PREFIX}__Bulk1_${bulkTimestamp}`;
    const bulkGroup2 = `${TEST_PREFIX}__Bulk2_${bulkTimestamp}`;

    test('Create bulk group 1 [OrgAdmin]', async ({ page }) => {
      const groupsPage = new UserGroupsPage(page);
      await groupsPage.goto();
      await groupsPage.createButton.click();
      await groupsPage.fillGroupForm(bulkGroup1, 'E2E bulk delete test group 1');
    });

    test('Create bulk group 2 [OrgAdmin]', async ({ page }) => {
      const groupsPage = new UserGroupsPage(page);
      await groupsPage.goto();
      await groupsPage.createButton.click();
      await groupsPage.fillGroupForm(bulkGroup2, 'E2E bulk delete test group 2');
    });

    test('Bulk delete both groups [OrgAdmin]', async ({ page }) => {
      const groupsPage = new UserGroupsPage(page);
      await groupsPage.goto();

      // Search by the run-unique timestamp to avoid pagination issues from accumulated test data.
      // Many previous test runs leave Bulk1_*/Bulk2_* groups, pushing the current run's groups
      // onto page 2 when searching the broad prefix. The timestamp is unique per run (only 2 matches).
      // Server-side caching can also delay newly-created groups — poll with reloads until visible.
      await expect(async () => {
        await groupsPage.goto();
        await groupsPage.searchFor(String(bulkTimestamp));
        await expect(groupsPage.table.getByRole('row', { name: new RegExp(bulkGroup1, 'i') })).toBeVisible();
        await expect(groupsPage.table.getByRole('row', { name: new RegExp(bulkGroup2, 'i') })).toBeVisible();
      }).toPass({ timeout: E2E_TIMEOUTS.SLOW_DATA, intervals: [3_000] });

      // Check both row checkboxes
      await groupsPage.tableComponent.selectRow(new RegExp(bulkGroup1, 'i'));
      await groupsPage.tableComponent.selectRow(new RegExp(bulkGroup2, 'i'));

      // Click the overflow kebab and select bulk delete
      await page.getByRole('button', { name: 'Actions overflow menu' }).click();
      await page.getByText(/delete user groups? \(\d+\)/i).click();
      await groupsPage.confirmDelete();
    });

    test('Verify both groups deleted [OrgAdmin]', async ({ page }) => {
      const groupsPage = new UserGroupsPage(page);
      await groupsPage.goto();

      await groupsPage.searchFor(bulkGroup1);
      await groupsPage.verifyGroupNotInTable(bulkGroup1);

      await groupsPage.searchFor(bulkGroup2);
      await groupsPage.verifyGroupNotInTable(bulkGroup2);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // RBACADMIN (WorkspaceAdmin) - Full groups CRUD (rbac_groups_read/write)
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe.serial('RbacAdmin Lifecycle', () => {
    test.use({ storageState: AUTH_V2_RBACADMIN });

    const raTimestamp = Date.now();
    const raGroupName = `${TEST_PREFIX}__RA_Group_${raTimestamp}`;
    const raGroupDescription = 'E2E RbacAdmin lifecycle group';
    const raEditedGroupName = `${raGroupName}_Edited`;
    const raEditedDescription = 'E2E RbacAdmin lifecycle group - EDITED';

    test('Create user group [RbacAdmin]', async ({ page }) => {
      const groupsPage = new UserGroupsPage(page);
      await groupsPage.goto();

      await groupsPage.createButton.click();
      await groupsPage.fillGroupForm(raGroupName, raGroupDescription);
    });

    test('Verify group appears in table [RbacAdmin]', async ({ page }) => {
      const groupsPage = new UserGroupsPage(page);
      await groupsPage.goto();

      await groupsPage.searchFor(raGroupName);
      await groupsPage.verifyGroupInTable(raGroupName);
    });

    test('Edit group [RbacAdmin]', async ({ page }) => {
      const groupsPage = new UserGroupsPage(page);
      await groupsPage.goto();

      await groupsPage.searchFor(raGroupName);
      await groupsPage.openRowActions(raGroupName);
      await groupsPage.clickRowAction('Edit');

      await expect(groupsPage.editPageForm).toBeVisible({ timeout: E2E_TIMEOUTS.DETAIL_CONTENT });
      await groupsPage.fillGroupForm(raEditedGroupName, raEditedDescription);
    });

    test('Verify edit was applied [RbacAdmin]', async ({ page }) => {
      const groupsPage = new UserGroupsPage(page);
      await groupsPage.goto();

      await groupsPage.searchFor(raEditedGroupName);
      await groupsPage.verifyGroupInTable(raEditedGroupName);
    });

    test('Delete group [RbacAdmin]', async ({ page }) => {
      const groupsPage = new UserGroupsPage(page);
      await groupsPage.goto();

      await groupsPage.searchFor(raEditedGroupName);
      await groupsPage.openRowActions(raEditedGroupName);
      await groupsPage.clickRowAction('Delete');
      await groupsPage.confirmDelete();
    });

    test('Verify group is deleted [RbacAdmin]', async ({ page }) => {
      const groupsPage = new UserGroupsPage(page);
      await groupsPage.goto();

      await groupsPage.searchFor(raEditedGroupName);
      await groupsPage.verifyGroupNotInTable(raEditedGroupName);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // USERVIEWER - No groups access (has rbac_principal_read only)
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('UserViewer', () => {
    test.use({ storageState: AUTH_V2_USERVIEWER });

    test(`User Groups page shows unauthorized access [UserViewer]`, async ({ page }) => {
      await setupPage(page);
      await expect(async () => {
        await page.goto(GROUPS_URL, { timeout: E2E_TIMEOUTS.SLOW_DATA });
        await expect(page.getByText(/You do not have access to/i)).toBeVisible({ timeout: E2E_TIMEOUTS.DETAIL_CONTENT });
      }).toPass({ timeout: E2E_TIMEOUTS.SETUP_PAGE_LOAD, intervals: [1_000, 2_000, 5_000] });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // READONLYUSER - No permissions at all
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('ReadOnlyUser', () => {
    test.use({ storageState: AUTH_V2_READONLY });

    test(`User Groups page shows unauthorized access [ReadOnlyUser]`, async ({ page }) => {
      await setupPage(page);
      await expect(async () => {
        await page.goto(GROUPS_URL, { timeout: E2E_TIMEOUTS.SLOW_DATA });
        await expect(page.getByText(/You do not have access to/i)).toBeVisible({ timeout: E2E_TIMEOUTS.DETAIL_CONTENT });
      }).toPass({ timeout: E2E_TIMEOUTS.SETUP_PAGE_LOAD, intervals: [1_000, 2_000, 5_000] });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // WORKSPACEUSER (WorkspaceViewer) - Read-only groups access (has rbac_groups_read)
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('WorkspaceUser', () => {
    test.use({ storageState: AUTH_V2_WORKSPACEUSER });

    test('User Groups page is accessible in read-only mode [WorkspaceUser]', async ({ page }) => {
      const groupsPage = new UserGroupsPage(page);
      await groupsPage.goto();
      await expect(groupsPage.table).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
      await expect(groupsPage.createButton).not.toBeVisible();
    });
  });
});
