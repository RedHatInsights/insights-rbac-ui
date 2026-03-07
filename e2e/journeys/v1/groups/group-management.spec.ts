/**
 * Group Management Tests
 *
 * Tests for creating, editing, and deleting groups.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * DECISION TREE - Add your test here if:
 * ═══════════════════════════════════════════════════════════════════════════════
 *   ✓ It creates, edits, or deletes a group
 *   ✓ It checks if a button/action for create/edit/delete is visible/hidden/disabled
 *   ✓ It verifies a permission denial (403) for write operations
 *
 * DO NOT add here if:
 *   ✗ It only reads/views data → group-detail.spec.ts
 *   ✗ It tests table sorting/filtering/pagination → group-list.spec.ts
 *   ✗ It manages group members or roles → group-membership.spec.ts
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * CAPABILITIES & PERSONAS
 * ═══════════════════════════════════════════════════════════════════════════════
 * @capability Create Group, Edit Group, Delete Group
 * @personas
 *   - Admin: Full CRUD access (use serial lifecycle for stateful tests)
 *   - UserViewer: Page blocked entirely (unauthorized message)
 *   - ReadOnlyUser: Page blocked entirely (unauthorized message)
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * DATA PREREQUISITES
 * ═══════════════════════════════════════════════════════════════════════════════
 * @dependencies
 *   - AUTH: Uses AUTH_V1_ORGADMIN, AUTH_V1_USERVIEWER, AUTH_V1_READONLY from utils
 *   - DATA: Relies on SEEDED_GROUP_NAME from seed-map (created in e2e:seed)
 *   - UTILS: Use GroupsPage.createButton.click() for UI tests
 *            Use getSeededGroupName() for existing data - NEVER create via UI in viewer tests
 *   - PREFIX: Requires TEST_PREFIX_V1 env var for safe test isolation
 */

import { expect, test } from '@playwright/test';
import { AUTH_V1_ORGADMIN, AUTH_V1_READONLY, AUTH_V1_USERVIEWER, iamUrl, requireTestPrefix, setupPage, v1 } from '../../../utils';
import { getSeededGroupName } from '../../../utils/seed-map';
import { GroupsPage } from '../../../pages/v1/GroupsPage';
import { E2E_TIMEOUTS } from '../../../utils/timeouts';

// ═══════════════════════════════════════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════════════════════════════════════

const TEST_PREFIX = requireTestPrefix('v1');
const GROUPS_URL = iamUrl(v1.groups.link());

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
// Tests
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Group Management', () => {
  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN - Full CRUD access
  // ═══════════════════════════════════════════════════════════════════════════
  // STATEFUL TESTS: Add create→edit→delete chains in the serial block
  // ATOMIC TESTS: Add standalone checks (button visibility) in the regular block

  test.describe.serial('Admin Lifecycle', () => {
    test.use({ storageState: AUTH_V1_ORGADMIN });

    test('Create group via wizard [OrgAdmin]', async ({ page }) => {
      const groupsPage = new GroupsPage(page);
      await groupsPage.goto();

      await groupsPage.createButton.click();
      await groupsPage.fillCreateWizard(uniqueGroupName, groupDescription);
    });

    test('Verify group appears in table [OrgAdmin]', async ({ page }) => {
      const groupsPage = new GroupsPage(page);
      await groupsPage.goto();

      await groupsPage.searchFor(uniqueGroupName);
      await groupsPage.verifyGroupInTable(uniqueGroupName);
    });

    test('View group detail page [OrgAdmin]', async ({ page }) => {
      const groupsPage = new GroupsPage(page);
      await groupsPage.goto();

      await groupsPage.searchFor(uniqueGroupName);
      await groupsPage.navigateToDetail(uniqueGroupName);

      await expect(groupsPage.getDetailHeading(uniqueGroupName)).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
      // Description should appear as subtitle once group data loads
      await expect(page.getByText(groupDescription)).toBeVisible({ timeout: E2E_TIMEOUTS.DETAIL_CONTENT });
    });

    test('Edit group from list [OrgAdmin]', async ({ page }) => {
      const groupsPage = new GroupsPage(page);
      await groupsPage.goto();

      await groupsPage.searchFor(uniqueGroupName);
      await groupsPage.openRowActions(uniqueGroupName);
      await groupsPage.clickRowAction('Edit');
      await groupsPage.fillEditModal(editedGroupName, editedDescription);
      await groupsPage.verifySuccess();
    });

    test('Verify edit was applied [OrgAdmin]', async ({ page }) => {
      const groupsPage = new GroupsPage(page);
      await groupsPage.goto();

      await groupsPage.searchFor(editedGroupName);
      await groupsPage.verifyGroupInTable(editedGroupName);

      await groupsPage.navigateToDetail(editedGroupName);
      // Description should appear as subtitle once group data loads
      await expect(page.getByText(editedDescription)).toBeVisible({ timeout: E2E_TIMEOUTS.DETAIL_CONTENT });
    });

    test('Delete group [OrgAdmin]', async ({ page }) => {
      const groupsPage = new GroupsPage(page);
      await groupsPage.goto();

      await groupsPage.searchFor(editedGroupName);
      await groupsPage.openRowActions(editedGroupName);
      await groupsPage.clickRowAction('Delete');
      await groupsPage.confirmDelete(editedGroupName);
    });

    test('Verify group is deleted [OrgAdmin]', async ({ page }) => {
      const groupsPage = new GroupsPage(page);
      await groupsPage.goto();

      await groupsPage.searchFor(editedGroupName);
      await groupsPage.verifyGroupNotInTable(editedGroupName);
    });
  });

  test.describe('OrgAdmin', () => {
    test.use({ storageState: AUTH_V1_ORGADMIN });

    test(`Create Group button is visible [OrgAdmin]`, async ({ page }) => {
      const groupsPage = new GroupsPage(page);
      await groupsPage.goto();

      await expect(groupsPage.createButton).toBeVisible();
    });

    test(`Edit and Delete actions are available [OrgAdmin]`, async ({ page }) => {
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
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // USERVIEWER - No page access at all
  // ═══════════════════════════════════════════════════════════════════════════
  // Add "unauthorized message" tests here
  // These tests should navigate to URL and verify blocked access

  test.describe('UserViewer', () => {
    test.use({ storageState: AUTH_V1_USERVIEWER });

    test(`Groups page shows unauthorized access [UserViewer]`, async ({ page }) => {
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
    test.use({ storageState: AUTH_V1_READONLY });

    test(`Groups page shows unauthorized access [ReadOnlyUser]`, async ({ page }) => {
      await setupPage(page);
      await page.goto(GROUPS_URL);

      await expect(page.getByText(/You do not have access to/i)).toBeVisible({ timeout: E2E_TIMEOUTS.DETAIL_CONTENT });
    });
  });
});
