/**
 * User Group Membership Tests
 *
 * Tests for adding/removing users and service accounts via the Edit User Group page.
 *
 * In V2, membership is NOT managed through modals or buttons in the drawer.
 * Instead, the Edit User Group page has selectable tables (Users and Service
 * accounts tabs) where checking/unchecking rows adds/removes members.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * DECISION TREE - Add your test here if:
 * ═══════════════════════════════════════════════════════════════════════════════
 *   ✓ It adds or removes users from a group via the edit page
 *   ✓ It adds or removes service accounts from a group via the edit page
 *   ✓ It verifies member/service-account selection state on the edit page
 *   ✓ It tests navigation paths to the edit page (drawer button, row action)
 *   ✓ It tests edit page form validation (name required, duplicate name)
 *
 * DO NOT add here if:
 *   ✗ It creates or deletes a user group → user-group-management.spec.ts
 *   ✗ It only views drawer content (read-only) → user-group-detail.spec.ts
 *   ✗ It tests the user groups table/list view → user-group-list.spec.ts
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * CAPABILITIES & PERSONAS (see TEST_PERSONAS.md for full details)
 * ═══════════════════════════════════════════════════════════════════════════════
 * @capability Add Members to Group, Remove Members from Group,
 *             Edit Page Navigation, Edit Page Form Validation
 * @personas
 *   - Admin (`rbac:*:*`): Full membership management via edit page
 *   - UserViewer (`rbac:principal:read`): Blocked — lacks `rbac:group:read`
 *   - ReadOnlyUser (no permissions): Blocked — lacks `rbac:group:read`
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * DATA PREREQUISITES
 * ═══════════════════════════════════════════════════════════════════════════════
 * @dependencies
 *   - AUTH: AUTH_V2_ORGADMIN, AUTH_V2_USERVIEWER, AUTH_V2_READONLY
 *   - DATA: SEEDED_GROUP_NAME + SEEDED_GROUP_UUID from seed-map
 *   - DATA: getSeededUsername() — seeded user to add/remove (self-cleaning)
 *   - UTILS: UserGroupsPage for edit page and drawer interactions
 */

import { expect, test } from '@playwright/test';
import {
  AUTH_V2_ORGADMIN,
  AUTH_V2_READONLY,
  AUTH_V2_USERVIEWER,
  getGroupUuid,
  getSeededGroupName,
  getSeededUsername,
  iamUrl,
  requireSeededServiceAccountClientId,
  setupPage,
  v2,
} from '../../../utils';
import { UserGroupsPage } from '../../../pages/v2/UserGroupsPage';
import { E2E_TIMEOUTS } from '../../../utils/timeouts';

// ═══════════════════════════════════════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════════════════════════════════════

const SEEDED_GROUP_NAME = getSeededGroupName('v2');
const SEEDED_GROUP_UUID = SEEDED_GROUP_NAME ? getGroupUuid(SEEDED_GROUP_NAME, 'v2') : undefined;

// SA client ID lives in seed-v2.json (environment-level constant, not provisioned by seed script)
const SA_CLIENT_ID = requireSeededServiceAccountClientId(0, 'v2');

// Use a dedicated seeded user (not a persona) for add/remove membership tests.
// This avoids side effects on persona-dependent tests.
const TEST_MEMBER_USERNAME = getSeededUsername(0, 'v2');

// ═══════════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════════

test.describe('User Group Membership', () => {
  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN - Full membership management
  // ═══════════════════════════════════════════════════════════════════════════

  // ─────────────────────────────────────────────────────────────────────────
  // Serial: Add member → verify in drawer → remove member → verify removed
  // Self-cleaning: ends with the member removed
  // ─────────────────────────────────────────────────────────────────────────
  test.describe.serial('OrgAdmin - Member Lifecycle', () => {
    test.use({ storageState: AUTH_V2_ORGADMIN });

    test('Edit page shows selectable users table [OrgAdmin]', async ({ page }) => {
      test.skip(!SEEDED_GROUP_NAME, 'No seed data — run npm run e2e:seed:v2');
      const groupsPage = new UserGroupsPage(page);
      await groupsPage.gotoEditPage(SEEDED_GROUP_UUID!);

      // Verify Users tab is active by default and table is visible
      await expect(groupsPage.getEditPageTab('Users')).toBeVisible();
      await expect(groupsPage.editPageUsersTable).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });

      // Verify the table has checkboxes (selectable rows)
      const firstCheckbox = groupsPage.editPageUsersTable.getByRole('checkbox').first();
      await expect(firstCheckbox).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
    });

    test('Add member to group via edit page [OrgAdmin]', async ({ page }) => {
      test.skip(!SEEDED_GROUP_NAME || !TEST_MEMBER_USERNAME, 'No seed data — run npm run e2e:seed:v2 or add seededUsers to seed-v2.json');
      const groupsPage = new UserGroupsPage(page);
      await groupsPage.gotoEditPage(SEEDED_GROUP_UUID!);

      // If the user is already a member (leftover from a previous run), remove them first
      // so we can test a real "add" operation. Deselect→select in one session = net zero change.
      const wasAlreadyMember = await groupsPage.isUserSelectedInEditPage(TEST_MEMBER_USERNAME!);
      if (wasAlreadyMember) {
        await groupsPage.deselectUserInEditPage(TEST_MEMBER_USERNAME!);
        await groupsPage.submitEditForm();
        // Re-open the edit page for a clean slate
        await groupsPage.gotoEditPage(SEEDED_GROUP_UUID!);
      }

      // Select the test user
      await groupsPage.selectUserInEditPage(TEST_MEMBER_USERNAME!);

      // Verify the checkbox is checked
      const isSelected = await groupsPage.isUserSelectedInEditPage(TEST_MEMBER_USERNAME!);
      expect(isSelected).toBe(true);

      // Submit the form
      await groupsPage.submitEditForm();
    });

    test('Verify member appears in drawer Users tab [OrgAdmin]', async ({ page }) => {
      test.skip(!SEEDED_GROUP_NAME || !TEST_MEMBER_USERNAME, 'No seed data — run npm run e2e:seed:v2 or add seededUsers to seed-v2.json');
      const groupsPage = new UserGroupsPage(page);
      await groupsPage.goto();

      await groupsPage.searchFor(SEEDED_GROUP_NAME!);
      await groupsPage.openDrawer(SEEDED_GROUP_NAME!);

      // Click Users tab (should be default)
      await groupsPage.clickDrawerTab('Users');

      // Verify the added user appears in the read-only users table
      const drawerContent = groupsPage.drawer;
      await expect(drawerContent.getByText(TEST_MEMBER_USERNAME!)).toBeVisible({
        timeout: E2E_TIMEOUTS.TABLE_DATA,
      });
    });

    test('Remove member from group via edit page [OrgAdmin]', async ({ page }) => {
      test.skip(!SEEDED_GROUP_NAME || !TEST_MEMBER_USERNAME, 'No seed data — run npm run e2e:seed:v2 or add seededUsers to seed-v2.json');
      const groupsPage = new UserGroupsPage(page);
      await groupsPage.gotoEditPage(SEEDED_GROUP_UUID!);

      // Verify the user is currently selected (added by the previous test).
      // The backend may have propagation delay, so retry with a page reload if needed.
      let isSelected = await groupsPage.isUserSelectedInEditPage(TEST_MEMBER_USERNAME!);
      if (!isSelected) {
        // Reload to bypass any stale cache
        await groupsPage.gotoEditPage(SEEDED_GROUP_UUID!);
        isSelected = await groupsPage.isUserSelectedInEditPage(TEST_MEMBER_USERNAME!);
      }
      expect(isSelected).toBe(true);

      // Deselect the test user
      await groupsPage.deselectUserInEditPage(TEST_MEMBER_USERNAME!);

      // Verify the checkbox is unchecked
      const isStillSelected = await groupsPage.isUserSelectedInEditPage(TEST_MEMBER_USERNAME!);
      expect(isStillSelected).toBe(false);

      // Submit the form
      await groupsPage.submitEditForm();
    });

    test('Verify member no longer appears in drawer Users tab [OrgAdmin]', async ({ page }) => {
      test.skip(!SEEDED_GROUP_NAME || !TEST_MEMBER_USERNAME, 'No seed data — run npm run e2e:seed:v2 or add seededUsers to seed-v2.json');
      const groupsPage = new UserGroupsPage(page);
      await groupsPage.goto();

      await groupsPage.searchFor(SEEDED_GROUP_NAME!);
      await groupsPage.openDrawer(SEEDED_GROUP_NAME!);

      // Click Users tab
      await groupsPage.clickDrawerTab('Users');

      // Verify the removed user does NOT appear in the read-only users table
      const drawerContent = groupsPage.drawer;
      await expect(drawerContent.getByText(TEST_MEMBER_USERNAME!)).not.toBeVisible({
        timeout: E2E_TIMEOUTS.TABLE_DATA,
      });
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Service Accounts tab verification
  // ─────────────────────────────────────────────────────────────────────────
  test.describe('OrgAdmin - Service Accounts', () => {
    test.use({ storageState: AUTH_V2_ORGADMIN });

    test('Edit page shows selectable service accounts table [OrgAdmin]', async ({ page }) => {
      test.skip(!SEEDED_GROUP_NAME, 'No seed data — run npm run e2e:seed:v2');
      const groupsPage = new UserGroupsPage(page);
      await groupsPage.gotoEditPage(SEEDED_GROUP_UUID!);

      // Switch to Service accounts tab
      await groupsPage.clickEditPageTab('Service accounts');

      // Verify the service accounts table is visible
      await expect(groupsPage.editPageServiceAccountsTable).toBeVisible({
        timeout: E2E_TIMEOUTS.TABLE_DATA,
      });
    });

    test('Edit page shows service accounts table [OrgAdmin]', async ({ page }) => {
      test.skip(!SEEDED_GROUP_NAME, 'No seed data — run npm run e2e:seed:v2');
      const userGroupsPage = new UserGroupsPage(page);
      await userGroupsPage.goto();
      await userGroupsPage.gotoEditPage(SEEDED_GROUP_UUID!);

      // Click the Service Accounts tab
      await userGroupsPage.clickEditPageTab('Service accounts');

      // Verify the service accounts table is visible
      await expect(userGroupsPage.editPageServiceAccountsTable).toBeVisible({
        timeout: E2E_TIMEOUTS.TABLE_DATA,
      });
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Navigation paths to edit page
  // ─────────────────────────────────────────────────────────────────────────
  test.describe('OrgAdmin - Navigation', () => {
    test.use({ storageState: AUTH_V2_ORGADMIN });

    test('Drawer Edit button navigates to edit page [OrgAdmin]', async ({ page }) => {
      test.skip(!SEEDED_GROUP_NAME, 'No seed data — run npm run e2e:seed:v2');
      const groupsPage = new UserGroupsPage(page);
      await groupsPage.goto();

      await groupsPage.searchFor(SEEDED_GROUP_NAME!);
      await groupsPage.openDrawer(SEEDED_GROUP_NAME!);
      await groupsPage.clickDrawerEditButton();

      // Verify we're on the edit page
      await expect(page).toHaveURL(new RegExp(iamUrl(v2.usersAndUserGroupsEditGroup.link(SEEDED_GROUP_UUID!))), {
        timeout: E2E_TIMEOUTS.URL_CHANGE,
      });
      await expect(groupsPage.editPageForm).toBeVisible({ timeout: E2E_TIMEOUTS.DETAIL_CONTENT });
    });

    test('Row action Edit navigates to edit page [OrgAdmin]', async ({ page }) => {
      test.skip(!SEEDED_GROUP_NAME, 'No seed data — run npm run e2e:seed:v2');
      const groupsPage = new UserGroupsPage(page);
      await groupsPage.goto();

      await groupsPage.searchFor(SEEDED_GROUP_NAME!);
      await groupsPage.openRowActions(SEEDED_GROUP_NAME!);
      await groupsPage.clickRowAction('Edit');

      // Verify we're on the edit page
      await expect(page).toHaveURL(new RegExp(iamUrl(v2.usersAndUserGroupsEditGroup.link(SEEDED_GROUP_UUID!))), {
        timeout: E2E_TIMEOUTS.URL_CHANGE,
      });
      await expect(groupsPage.editPageForm).toBeVisible({ timeout: E2E_TIMEOUTS.DETAIL_CONTENT });
    });

    test('Edit page Cancel returns to list page [OrgAdmin]', async ({ page }) => {
      test.skip(!SEEDED_GROUP_NAME, 'No seed data — run npm run e2e:seed:v2');
      const groupsPage = new UserGroupsPage(page);
      await groupsPage.gotoEditPage(SEEDED_GROUP_UUID!);

      await groupsPage.cancelEditForm();

      // Verify we're back on the list page
      await expect(page).toHaveURL(new RegExp(v2.userGroups.link()), { timeout: E2E_TIMEOUTS.URL_CHANGE });
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Form validation
  // ─────────────────────────────────────────────────────────────────────────
  test.describe('OrgAdmin - Form Validation', () => {
    test.use({ storageState: AUTH_V2_ORGADMIN });

    test('Submit is disabled when name is empty [OrgAdmin]', async ({ page }) => {
      test.skip(!SEEDED_GROUP_NAME, 'No seed data — run npm run e2e:seed:v2');
      const groupsPage = new UserGroupsPage(page);
      await groupsPage.gotoEditPage(SEEDED_GROUP_UUID!);

      // Clear the name field
      const nameInput = groupsPage.editPageNameInput;
      await nameInput.click();
      await nameInput.selectText();
      await page.keyboard.press('Backspace');

      // Submit button should be disabled (FormTemplate disableSubmit: ['pristine', 'invalid'])
      await expect(groupsPage.editPageSubmitButton).toBeDisabled({ timeout: E2E_TIMEOUTS.BUTTON_STATE });
    });

    test('Duplicate group name shows validation error [OrgAdmin]', async ({ page }) => {
      test.skip(!SEEDED_GROUP_NAME, 'No seed data — run npm run e2e:seed:v2');
      const groupsPage = new UserGroupsPage(page);
      await groupsPage.gotoEditPage(SEEDED_GROUP_UUID!);

      // Type a known existing group name ("Default access" always exists)
      const nameInput = groupsPage.editPageNameInput;
      await nameInput.click();
      await nameInput.selectText();
      await nameInput.fill('Default access');

      // Wait for async validation to complete
      await page.waitForTimeout(E2E_TIMEOUTS.BUTTON_STATE);

      // Submit should be disabled due to duplicate name validation
      await expect(groupsPage.editPageSubmitButton).toBeDisabled({ timeout: E2E_TIMEOUTS.BUTTON_STATE });
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Service Account add → verify → remove lifecycle (self-cleaning)
  // SA_CLIENT_ID is declared in fixture; SEEDED_GROUP_UUID from seed map
  // ─────────────────────────────────────────────────────────────────────────
  test.describe.serial('OrgAdmin — Service Account Lifecycle', () => {
    test.use({ storageState: AUTH_V2_ORGADMIN });

    test('Add service account to group via edit page [OrgAdmin]', async ({ page }) => {
      test.skip(!SEEDED_GROUP_NAME || !SEEDED_GROUP_UUID, 'No seed data — run npm run e2e:seed:v2');
      const groupsPage = new UserGroupsPage(page);
      await groupsPage.gotoEditPage(SEEDED_GROUP_UUID!);

      await groupsPage.clickEditPageTab('Service accounts');
      await expect(groupsPage.editPageServiceAccountsTable).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });

      // Idempotent: if SA is already a member, remove it first so we test a real "add"
      const wasAlreadyMember = await groupsPage.isSASelectedInEditPage(SA_CLIENT_ID).catch(() => false);
      if (wasAlreadyMember) {
        await groupsPage.deselectSAInEditPage(SA_CLIENT_ID);
        await groupsPage.submitEditForm();
        await groupsPage.gotoEditPage(SEEDED_GROUP_UUID!);
        await groupsPage.clickEditPageTab('Service accounts');
        await expect(groupsPage.editPageServiceAccountsTable).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
      }

      await groupsPage.selectSAInEditPage(SA_CLIENT_ID);
      expect(await groupsPage.isSASelectedInEditPage(SA_CLIENT_ID)).toBe(true);
      await groupsPage.submitEditForm();
    });

    test('Verify service account appears in drawer [OrgAdmin]', async ({ page }) => {
      test.skip(!SEEDED_GROUP_NAME || !SEEDED_GROUP_UUID, 'No seed data — run npm run e2e:seed:v2');
      const groupsPage = new UserGroupsPage(page);
      await groupsPage.goto();

      await groupsPage.searchFor(SEEDED_GROUP_NAME!);
      await groupsPage.openDrawer(SEEDED_GROUP_NAME!);
      await groupsPage.clickDrawerTab('Service accounts');

      await expect(groupsPage.drawer.getByText(SA_CLIENT_ID)).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
    });

    test('Remove service account from group [OrgAdmin]', async ({ page }) => {
      test.skip(!SEEDED_GROUP_NAME || !SEEDED_GROUP_UUID, 'No seed data — run npm run e2e:seed:v2');
      const groupsPage = new UserGroupsPage(page);
      await groupsPage.gotoEditPage(SEEDED_GROUP_UUID!);

      await groupsPage.clickEditPageTab('Service accounts');
      await expect(groupsPage.editPageServiceAccountsTable).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });

      await groupsPage.deselectSAInEditPage(SA_CLIENT_ID);
      expect(await groupsPage.isSASelectedInEditPage(SA_CLIENT_ID)).toBe(false);
      await groupsPage.submitEditForm();
    });

    test('Verify service account removed from drawer [OrgAdmin]', async ({ page }) => {
      test.skip(!SEEDED_GROUP_NAME || !SEEDED_GROUP_UUID, 'No seed data — run npm run e2e:seed:v2');
      const groupsPage = new UserGroupsPage(page);
      await groupsPage.goto();

      await groupsPage.searchFor(SEEDED_GROUP_NAME!);
      await groupsPage.openDrawer(SEEDED_GROUP_NAME!);
      await groupsPage.clickDrawerTab('Service accounts');

      await expect(groupsPage.drawer.getByText(SA_CLIENT_ID)).not.toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // USERVIEWER - No groups write access (has rbac_principal_read only)
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('UserViewer', () => {
    test.use({ storageState: AUTH_V2_USERVIEWER });

    test(`Edit group page shows unauthorized access [UserViewer]`, async ({ page }) => {
      test.skip(!SEEDED_GROUP_NAME, 'No seed data — run npm run e2e:seed:v2');
      await setupPage(page);
      await expect(async () => {
        await page.goto(iamUrl(v2.usersAndUserGroupsEditGroup.link(SEEDED_GROUP_UUID!)), { timeout: E2E_TIMEOUTS.SLOW_DATA });
        await expect(page.getByText(/You do not have access to/i)).toBeVisible({ timeout: E2E_TIMEOUTS.DETAIL_CONTENT });
      }).toPass({ timeout: E2E_TIMEOUTS.SETUP_PAGE_LOAD, intervals: [1_000, 2_000, 5_000] });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // READONLYUSER - No permissions at all
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('ReadOnlyUser', () => {
    test.use({ storageState: AUTH_V2_READONLY });

    test(`Edit group page shows unauthorized access [ReadOnlyUser]`, async ({ page }) => {
      test.skip(!SEEDED_GROUP_NAME, 'No seed data — run npm run e2e:seed:v2');
      await setupPage(page);
      await expect(async () => {
        await page.goto(iamUrl(v2.usersAndUserGroupsEditGroup.link(SEEDED_GROUP_UUID!)), { timeout: E2E_TIMEOUTS.SLOW_DATA });
        await expect(page.getByText(/You do not have access to/i)).toBeVisible({ timeout: E2E_TIMEOUTS.DETAIL_CONTENT });
      }).toPass({ timeout: E2E_TIMEOUTS.SETUP_PAGE_LOAD, intervals: [1_000, 2_000, 5_000] });
    });
  });
});
