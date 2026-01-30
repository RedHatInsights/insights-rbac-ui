/**
 * V1 Groups - Membership Tests
 *
 * Tests for adding/removing members and roles from groups.
 * Based on Storybook coverage:
 * - AddMembersToGroupJourney
 * - RemoveMembersFromGroupJourney
 * - AddRolesToGroupJourney
 * - RemoveRolesFromGroupJourney
 *
 * Personas: Admin (only admin can manage membership)
 */

import { expect, test } from '@playwright/test';
import { AUTH_V1_ADMIN } from '../../../utils';
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
    await expect(groupsPage.getDetailHeading(SEEDED_GROUP_NAME)).toBeVisible({ timeout: 15000 });

    // Click Members tab
    await groupsPage.clickTab('Members');

    // Should show Add member button (indicates we're on the right tab)
    await expect(groupsPage.addMemberButton).toBeVisible({ timeout: 10000 });

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
    await expect(groupsPage.addMemberButton).toBeVisible({ timeout: 10000 });
    await expect(groupsPage.addMemberButton).toBeEnabled({ timeout: 5000 });

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
      await expect(groupsPage.addMemberButton).toBeVisible({ timeout: 10000 });
      await expect(groupsPage.addMemberButton).toBeEnabled({ timeout: 5000 });

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
      await page.waitForTimeout(1000);

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
    await expect(groupsPage.getDetailHeading(SEEDED_GROUP_NAME)).toBeVisible({ timeout: 15000 });

    // Click Roles tab
    await groupsPage.clickTab('Roles');

    // Should show Add role button (indicates we're on the right tab)
    await expect(groupsPage.addRoleButton).toBeVisible({ timeout: 10000 });

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
    await expect(groupsPage.addRoleButton).toBeVisible({ timeout: 10000 });
    await expect(groupsPage.addRoleButton).toBeEnabled({ timeout: 10000 });

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
      await expect(groupsPage.addRoleButton).toBeVisible({ timeout: 10000 });
      await expect(groupsPage.addRoleButton).toBeEnabled({ timeout: 10000 });

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
      await page.waitForTimeout(1000);

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
