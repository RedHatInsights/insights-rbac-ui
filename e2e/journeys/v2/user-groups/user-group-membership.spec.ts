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
 *   - AUTH: AUTH_V2_ADMIN, AUTH_V2_USERVIEWER, AUTH_V2_READONLY
 *   - DATA: SEEDED_GROUP_NAME + SEEDED_GROUP_UUID from seed-map
 *   - DATA: getSeededUsername() — seeded user to add/remove (self-cleaning)
 *   - UTILS: UserGroupsPage for edit page and drawer interactions
 */

import { expect, test } from '@playwright/test';
import { AUTH_V2_ADMIN, AUTH_V2_READONLY, AUTH_V2_USERVIEWER, getGroupUuid, getSeededGroupName, getSeededUsername, setupPage } from '../../../utils';
import { UserGroupsPage } from '../../../pages/v2/UserGroupsPage';
import { E2E_TIMEOUTS } from '../../../utils/timeouts';

// ═══════════════════════════════════════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════════════════════════════════════

const SEEDED_GROUP_NAME = getSeededGroupName('v2');
const SEEDED_GROUP_UUID = SEEDED_GROUP_NAME ? getGroupUuid(SEEDED_GROUP_NAME, 'v2') : undefined;
const EDIT_GROUP_URL = '/iam/access-management/users-and-user-groups/edit-group';

// Use a dedicated seeded user (not a persona) for add/remove membership tests.
// This avoids side effects on persona-dependent tests.
const TEST_MEMBER_USERNAME = getSeededUsername(0, 'v2');

if (!SEEDED_GROUP_NAME || !SEEDED_GROUP_UUID) {
  throw new Error('No seeded group found in seed map. Run: npm run e2e:seed:v2');
}

if (!TEST_MEMBER_USERNAME) {
  throw new Error('No seeded user found in seed fixture. Add a seededUsers entry to seed-v2.json');
}

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
  test.describe.serial('Admin - Member Lifecycle', () => {
    test.use({ storageState: AUTH_V2_ADMIN });

    test('Edit page shows selectable users table [Admin]', async ({ page }) => {
      const groupsPage = new UserGroupsPage(page);
      await groupsPage.gotoEditPage(SEEDED_GROUP_UUID!);

      // Verify Users tab is active by default and table is visible
      await expect(groupsPage.getEditPageTab('Users')).toBeVisible();
      await expect(groupsPage.editPageUsersTable).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });

      // Verify the table has checkboxes (selectable rows)
      const firstCheckbox = groupsPage.editPageUsersTable.getByRole('checkbox').first();
      await expect(firstCheckbox).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });

      console.log(`[Setup] ✓ Edit page users table is selectable`);
    });

    test('Add member to group via edit page [Admin]', async ({ page }) => {
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

      console.log(`[Add Member] ✓ Added ${TEST_MEMBER_USERNAME} to group`);
    });

    test('Verify member appears in drawer Users tab [Admin]', async ({ page }) => {
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

      console.log(`[Verify Add] ✓ ${TEST_MEMBER_USERNAME} visible in drawer`);
    });

    test('Remove member from group via edit page [Admin]', async ({ page }) => {
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

      console.log(`[Remove Member] ✓ Removed ${TEST_MEMBER_USERNAME} from group`);
    });

    test('Verify member no longer appears in drawer Users tab [Admin]', async ({ page }) => {
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

      console.log(`[Verify Remove] ✓ ${TEST_MEMBER_USERNAME} no longer in drawer`);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Service Accounts tab verification
  // ─────────────────────────────────────────────────────────────────────────
  test.describe('Admin - Service Accounts', () => {
    test.use({ storageState: AUTH_V2_ADMIN });

    test('Edit page shows selectable service accounts table [Admin]', async ({ page }) => {
      const groupsPage = new UserGroupsPage(page);
      await groupsPage.gotoEditPage(SEEDED_GROUP_UUID!);

      // Switch to Service accounts tab
      await groupsPage.clickEditPageTab('Service accounts');

      // Verify the service accounts table is visible
      await expect(groupsPage.editPageServiceAccountsTable).toBeVisible({
        timeout: E2E_TIMEOUTS.TABLE_DATA,
      });

      console.log(`[SA Tab] ✓ Service accounts table is visible and selectable`);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Navigation paths to edit page
  // ─────────────────────────────────────────────────────────────────────────
  test.describe('Admin - Navigation', () => {
    test.use({ storageState: AUTH_V2_ADMIN });

    test('Drawer Edit button navigates to edit page [Admin]', async ({ page }) => {
      const groupsPage = new UserGroupsPage(page);
      await groupsPage.goto();

      await groupsPage.searchFor(SEEDED_GROUP_NAME!);
      await groupsPage.openDrawer(SEEDED_GROUP_NAME!);
      await groupsPage.clickDrawerEditButton();

      // Verify we're on the edit page
      await expect(page).toHaveURL(new RegExp(`${EDIT_GROUP_URL}/${SEEDED_GROUP_UUID}`), {
        timeout: E2E_TIMEOUTS.URL_CHANGE,
      });
      await expect(groupsPage.editPageForm).toBeVisible({ timeout: E2E_TIMEOUTS.DETAIL_CONTENT });

      console.log(`[Nav: Drawer] ✓ Edit button navigated to edit page`);
    });

    test('Row action Edit navigates to edit page [Admin]', async ({ page }) => {
      const groupsPage = new UserGroupsPage(page);
      await groupsPage.goto();

      await groupsPage.searchFor(SEEDED_GROUP_NAME!);
      await groupsPage.openRowActions(SEEDED_GROUP_NAME!);
      await groupsPage.clickRowAction('Edit');

      // Verify we're on the edit page
      await expect(page).toHaveURL(new RegExp(`${EDIT_GROUP_URL}/${SEEDED_GROUP_UUID}`), {
        timeout: E2E_TIMEOUTS.URL_CHANGE,
      });
      await expect(groupsPage.editPageForm).toBeVisible({ timeout: E2E_TIMEOUTS.DETAIL_CONTENT });

      console.log(`[Nav: Row Action] ✓ Edit action navigated to edit page`);
    });

    test('Edit page Cancel returns to list page [Admin]', async ({ page }) => {
      const groupsPage = new UserGroupsPage(page);
      await groupsPage.gotoEditPage(SEEDED_GROUP_UUID!);

      await groupsPage.cancelEditForm();

      // Verify we're back on the list page
      await expect(page).toHaveURL(/\/user-groups/, { timeout: E2E_TIMEOUTS.URL_CHANGE });

      console.log(`[Nav: Cancel] ✓ Cancel returned to list page`);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Form validation
  // ─────────────────────────────────────────────────────────────────────────
  test.describe('Admin - Form Validation', () => {
    test.use({ storageState: AUTH_V2_ADMIN });

    test('Submit is disabled when name is empty [Admin]', async ({ page }) => {
      const groupsPage = new UserGroupsPage(page);
      await groupsPage.gotoEditPage(SEEDED_GROUP_UUID!);

      // Clear the name field
      const nameInput = groupsPage.editPageNameInput;
      await nameInput.click();
      await nameInput.selectText();
      await page.keyboard.press('Backspace');

      // Submit button should be disabled (FormTemplate disableSubmit: ['pristine', 'invalid'])
      await expect(groupsPage.editPageSubmitButton).toBeDisabled({ timeout: E2E_TIMEOUTS.BUTTON_STATE });

      console.log(`[Validation] ✓ Submit disabled when name is empty`);
    });

    test('Duplicate group name shows validation error [Admin]', async ({ page }) => {
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

      console.log(`[Validation] ✓ Duplicate name prevents submission`);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // USERVIEWER - No page access at all
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('UserViewer', () => {
    test.use({ storageState: AUTH_V2_USERVIEWER });

    test(`Edit group page shows unauthorized access [UserViewer]`, async ({ page }) => {
      await setupPage(page);
      await page.goto(`${EDIT_GROUP_URL}/${SEEDED_GROUP_UUID}`);

      await expect(page.getByText(/You do not have access to/i)).toBeVisible({
        timeout: E2E_TIMEOUTS.DETAIL_CONTENT,
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // READONLYUSER - No page access at all
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('ReadOnlyUser', () => {
    test.use({ storageState: AUTH_V2_READONLY });

    test(`Edit group page shows unauthorized access [ReadOnlyUser]`, async ({ page }) => {
      await setupPage(page);
      await page.goto(`${EDIT_GROUP_URL}/${SEEDED_GROUP_UUID}`);

      await expect(page.getByText(/You do not have access to/i)).toBeVisible({
        timeout: E2E_TIMEOUTS.DETAIL_CONTENT,
      });
    });
  });
});
