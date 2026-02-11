/**
 * Group Membership Tests
 *
 * Tests for adding/removing members and roles from groups.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * DECISION TREE - Add your test here if:
 * ═══════════════════════════════════════════════════════════════════════════════
 *   ✓ It adds or removes members from a group
 *   ✓ It adds or removes roles from a group
 *   ✓ It tests the Add/Remove modals on group detail tabs
 *
 * DO NOT add here if:
 *   ✗ It creates, edits, or deletes the group itself → group-management.spec.ts
 *   ✗ It only views group detail content → group-detail.spec.ts
 *   ✗ It tests the groups table/list view → group-list.spec.ts
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * CAPABILITIES & PERSONAS
 * ═══════════════════════════════════════════════════════════════════════════════
 * @capability Add Members to Group, Remove Members from Group,
 *             Add Roles to Group, Remove Roles from Group
 * @personas (see TEST_PERSONAS.md for full details)
 *   - Admin (`rbac:*:*`): Full access to add/remove members and roles
 *   - UserViewer (`rbac:principal:read`): Blocked — lacks `rbac:group:read`
 *   - ReadOnlyUser (no permissions): Blocked — lacks `rbac:group:read`
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * DATA PREREQUISITES
 * ═══════════════════════════════════════════════════════════════════════════════
 * @dependencies
 *   - AUTH: Uses AUTH_V1_ADMIN, AUTH_V1_USERVIEWER, AUTH_V1_READONLY from utils
 *   - DATA: Relies on SEEDED_GROUP_NAME from seed-map (created in e2e:seed)
 *   - UTILS: Use GroupsPage for navigation and modal interactions
 *   - PREFIX: Requires TEST_PREFIX_V1 env var for safe test isolation
 *
 * Based on Storybook coverage:
 *   - AddMembersToGroupJourney
 *   - RemoveMembersFromGroupJourney
 *   - AddRolesToGroupJourney
 *   - RemoveRolesFromGroupJourney
 */

import { expect, test } from '@playwright/test';
import { AUTH_V1_ADMIN, AUTH_V1_READONLY, AUTH_V1_USERVIEWER, setupPage } from '../../../utils';
import { getSeededGroupName } from '../../../utils/seed-map';
import { GroupsPage } from '../../../pages/v1/GroupsPage';
import { E2E_TIMEOUTS } from '../../../utils/timeouts';

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION - V1
// ═══════════════════════════════════════════════════════════════════════════════

const TEST_PREFIX = process.env.TEST_PREFIX_V1;
const GROUPS_URL = '/iam/user-access/groups';

if (!TEST_PREFIX) {
  throw new Error(
    '\n\n' +
      '╔══════════════════════════════════════════════════════════════════════╗\n' +
      '║  SAFETY RAIL: TEST_PREFIX_V1 environment variable is REQUIRED       ║\n' +
      '╚══════════════════════════════════════════════════════════════════════╝\n',
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEST DATA
// ═══════════════════════════════════════════════════════════════════════════════

// Golden rule: always interact with seeded data from the seed map
const SEEDED_GROUP_NAME = getSeededGroupName('v1');
if (!SEEDED_GROUP_NAME) {
  throw new Error('No seeded group found in seed map. Run: npm run e2e:v1:seed');
}

// ═══════════════════════════════════════════════════════════════════════════
// Tests - Admin Only (Member Management)
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Admin - Group Member Management', () => {
  test.use({ storageState: AUTH_V1_ADMIN });

  test('Can navigate to group detail Members tab [Admin]', async ({ page }) => {
    const groupsPage = new GroupsPage(page);
    await groupsPage.goto();

    // Navigate to seeded group
    await groupsPage.searchFor(SEEDED_GROUP_NAME);
    await groupsPage.navigateToDetail(SEEDED_GROUP_NAME);
    await expect(groupsPage.getDetailHeading(SEEDED_GROUP_NAME)).toBeVisible({ timeout: E2E_TIMEOUTS.DETAIL_CONTENT });

    // Click Members tab
    await groupsPage.clickTab('Members');

    // Should show Add member button (indicates we're on the right tab)
    await expect(groupsPage.addMemberButton).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });

    console.log('[Members] ✓ Members tab navigation works');
  });

  test('Add member button opens modal [Admin]', async ({ page }) => {
    const groupsPage = new GroupsPage(page);
    await groupsPage.goto();

    // Navigate to seeded group's Members tab
    await groupsPage.searchFor(SEEDED_GROUP_NAME);
    await groupsPage.navigateToDetail(SEEDED_GROUP_NAME);
    await groupsPage.clickTab('Members');

    // Wait for Add member button to be ready
    await expect(groupsPage.addMemberButton).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
    await expect(groupsPage.addMemberButton).toBeEnabled({ timeout: E2E_TIMEOUTS.MENU_ANIMATION });

    // Click Add member
    await groupsPage.openAddMembersModal();

    // Modal should be visible with title containing "Add members"
    const modal = page.getByRole('dialog').first();
    await expect(modal).toBeVisible();
    await expect(modal.getByRole('heading', { name: /add members/i })).toBeVisible();

    // Close modal
    await page.keyboard.press('Escape');

    console.log('[Members] ✓ Add member modal opens');
  });

  test.describe.serial('Member Add/Remove Lifecycle [Admin]', () => {
    test('Add members to group', async ({ page }) => {
      const groupsPage = new GroupsPage(page);
      await groupsPage.goto();

      // Navigate to seeded group's Members tab
      await groupsPage.searchFor(SEEDED_GROUP_NAME);
      await groupsPage.navigateToDetail(SEEDED_GROUP_NAME);
      await groupsPage.clickTab('Members');

      // Wait for Add member button to be ready
      await expect(groupsPage.addMemberButton).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
      await expect(groupsPage.addMemberButton).toBeEnabled({ timeout: E2E_TIMEOUTS.MENU_ANIMATION });

      // Add 1 member
      await groupsPage.addMembersToGroup(1);

      // Verify success notification
      await groupsPage.verifySuccess();

      console.log('[Members] ✓ Member added to group');
    });

    test('Remove member from group', async ({ page }) => {
      const groupsPage = new GroupsPage(page);
      await groupsPage.goto();

      // Navigate to seeded group's Members tab
      await groupsPage.searchFor(SEEDED_GROUP_NAME);
      await groupsPage.navigateToDetail(SEEDED_GROUP_NAME);
      await groupsPage.clickTab('Members');

      // Wait for member table to load
      await page.waitForTimeout(E2E_TIMEOUTS.DRAWER_ANIMATION);

      // Select and remove 1 member
      await groupsPage.removeMembersFromGroup(1);

      // Verify success notification
      await groupsPage.verifySuccess();

      console.log('[Members] ✓ Member removed from group');
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Tests - Admin Only (Role Management)
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Admin - Group Role Management', () => {
  test.use({ storageState: AUTH_V1_ADMIN });

  test('Can navigate to group detail Roles tab [Admin]', async ({ page }) => {
    const groupsPage = new GroupsPage(page);
    await groupsPage.goto();

    // Navigate to seeded group
    await groupsPage.searchFor(SEEDED_GROUP_NAME);
    await groupsPage.navigateToDetail(SEEDED_GROUP_NAME);
    await expect(groupsPage.getDetailHeading(SEEDED_GROUP_NAME)).toBeVisible({ timeout: E2E_TIMEOUTS.DETAIL_CONTENT });

    // Click Roles tab
    await groupsPage.clickTab('Roles');

    // Should show Add role button (indicates we're on the right tab)
    await expect(groupsPage.addRoleButton).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });

    console.log('[Roles] ✓ Roles tab navigation works');
  });

  test('Add role button opens modal [Admin]', async ({ page }) => {
    const groupsPage = new GroupsPage(page);
    await groupsPage.goto();

    // Navigate to seeded group's Roles tab
    await groupsPage.searchFor(SEEDED_GROUP_NAME);
    await groupsPage.navigateToDetail(SEEDED_GROUP_NAME);
    await groupsPage.clickTab('Roles');

    // Wait for Add role button to be ready
    await expect(groupsPage.addRoleButton).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
    await expect(groupsPage.addRoleButton).toBeEnabled({ timeout: E2E_TIMEOUTS.BUTTON_STATE });

    // Click Add role
    await groupsPage.openAddRolesModal();

    // Modal should be visible with title containing "Add roles"
    const modal = page.getByRole('dialog').first();
    await expect(modal).toBeVisible();
    await expect(modal.getByRole('heading', { name: /add roles/i })).toBeVisible();

    // Close modal
    await page.keyboard.press('Escape');

    console.log('[Roles] ✓ Add role modal opens');
  });

  test.describe.serial('Role Add/Remove Lifecycle [Admin]', () => {
    test('Add roles to group', async ({ page }) => {
      const groupsPage = new GroupsPage(page);
      await groupsPage.goto();

      // Navigate to seeded group's Roles tab
      await groupsPage.searchFor(SEEDED_GROUP_NAME);
      await groupsPage.navigateToDetail(SEEDED_GROUP_NAME);
      await groupsPage.clickTab('Roles');

      // Wait for Add role button to be ready
      await expect(groupsPage.addRoleButton).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
      await expect(groupsPage.addRoleButton).toBeEnabled({ timeout: E2E_TIMEOUTS.BUTTON_STATE });

      // Add 1 role
      await groupsPage.addRolesToGroup(1);

      // Verify success notification
      await groupsPage.verifySuccess();

      console.log('[Roles] ✓ Role added to group');
    });

    test('Remove role from group', async ({ page }) => {
      const groupsPage = new GroupsPage(page);
      await groupsPage.goto();

      // Navigate to seeded group's Roles tab
      await groupsPage.searchFor(SEEDED_GROUP_NAME);
      await groupsPage.navigateToDetail(SEEDED_GROUP_NAME);
      await groupsPage.clickTab('Roles');

      // Wait for roles table to load
      await page.waitForTimeout(E2E_TIMEOUTS.DRAWER_ANIMATION);

      // Select 1 role
      await groupsPage.selectRoleRows(1);

      // Remove the selected role
      await groupsPage.removeRolesFromGroup();

      // Verify success notification
      await groupsPage.verifySuccess();

      console.log('[Roles] ✓ Role removed from group');
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// USERVIEWER - No page access at all
// ═══════════════════════════════════════════════════════════════════════════════
// UserViewer cannot access the Groups page, so they cannot manage membership.
// These tests verify blocked access at the page level.

test.describe('UserViewer', () => {
  test.use({ storageState: AUTH_V1_USERVIEWER });

  test(`Cannot access Groups page to manage membership [UserViewer]`, async ({ page }) => {
    await setupPage(page);
    await page.goto(GROUPS_URL);

    await expect(page.getByText(/You do not have access to/i)).toBeVisible({ timeout: E2E_TIMEOUTS.DETAIL_CONTENT });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// READONLYUSER - No page access at all
// ═══════════════════════════════════════════════════════════════════════════════
// ReadOnlyUser cannot access the Groups page, so they cannot manage membership.
// These tests verify blocked access at the page level.

test.describe('ReadOnlyUser', () => {
  test.use({ storageState: AUTH_V1_READONLY });

  test(`Cannot access Groups page to manage membership [ReadOnlyUser]`, async ({ page }) => {
    await setupPage(page);
    await page.goto(GROUPS_URL);

    await expect(page.getByText(/You do not have access to/i)).toBeVisible({ timeout: E2E_TIMEOUTS.DETAIL_CONTENT });
  });
});
