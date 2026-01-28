/**
 * V2 User Groups - Admin Tests
 *
 * Tests for the V2 User Groups page (/iam/access-management/users-and-user-groups/user-groups)
 * with admin privileges.
 *
 * V2 Key Differences from V1:
 * - View details: Uses drawer (row click), not page navigation
 * - Create: Uses EditUserGroup page form, not AddGroupWizard
 * - Edit: Uses EditUserGroup page form, not modal
 * - Delete: Uses modal (same as V1)
 *
 * Test Pattern:
 * - Use `test.step()` to group related assertions within a single test
 * - Pay the "page load tax" once per test, not per assertion
 * - CRUD lifecycle in a single test with phases
 */

import { Page, expect, test } from '@playwright/test';
import { AUTH_V2_ADMIN, getSeededGroupName, setupPage, waitForTableUpdate } from '../../../../utils';

// Safety rail: Require TEST_PREFIX for any test that creates data
const TEST_PREFIX = process.env.TEST_PREFIX;

if (!TEST_PREFIX) {
  throw new Error(
    '\n\n' +
      '╔══════════════════════════════════════════════════════════════════════╗\n' +
      '║  SAFETY RAIL: TEST_PREFIX environment variable is REQUIRED          ║\n' +
      '║                                                                      ║\n' +
      '║  This test creates data that must be prefixed to avoid polluting    ║\n' +
      '║  the shared environment. Set TEST_PREFIX before running:            ║\n' +
      '║                                                                      ║\n' +
      '║    TEST_PREFIX=yourprefix npx playwright test v2/user-groups        ║\n' +
      '║                                                                      ║\n' +
      '╚══════════════════════════════════════════════════════════════════════╝\n',
  );
}

test.use({ storageState: AUTH_V2_ADMIN });

const GROUPS_URL = '/iam/access-management/users-and-user-groups/user-groups';

// Get seeded group name from seed map/fixture
const SEEDED_GROUP_NAME = getSeededGroupName();

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Searches for a group by name using the filter input.
 */
async function searchForGroup(page: Page, groupName: string): Promise<void> {
  const searchInput = page.getByRole('searchbox').or(page.getByPlaceholder(/filter|search/i));
  await searchInput.clear();
  await searchInput.fill(groupName);
  await waitForTableUpdate(page);
}

/**
 * Verifies a group row exists in the table grid.
 */
async function verifyGroupInTable(page: Page, groupName: string): Promise<void> {
  const grid = page.getByRole('grid');
  await expect(grid.getByRole('row', { name: new RegExp(groupName, 'i') })).toBeVisible({
    timeout: 10000,
  });
}

/**
 * Verifies a group row does NOT exist in the table grid.
 */
async function verifyGroupNotInTable(page: Page, groupName: string): Promise<void> {
  const grid = page.getByRole('grid');
  await expect(grid.getByRole('row', { name: new RegExp(groupName, 'i') })).not.toBeVisible({
    timeout: 10000,
  });
}

/**
 * Opens the group details drawer by clicking on the group row.
 * V2 uses drawer pattern, not page navigation.
 */
async function openGroupDrawer(page: Page, groupName: string): Promise<void> {
  const groupCell = page.getByRole('grid').getByText(groupName);
  await groupCell.click();

  // Wait for drawer to open
  const drawer = page.locator('[data-ouia-component-id="groups-details-drawer"]');
  await expect(drawer).toBeVisible({ timeout: 10000 });
  await expect(drawer.getByRole('heading', { name: groupName })).toBeVisible({ timeout: 5000 });
}

/**
 * Closes the group details drawer by clicking the same row again (toggle behavior).
 */
async function closeGroupDrawer(page: Page, groupName: string): Promise<void> {
  // Click the same row again to toggle drawer closed
  const groupCell = page.getByRole('grid').getByText(groupName);
  await groupCell.click();

  // Verify drawer is closed by checking the heading is no longer visible
  await expect(page.getByRole('heading', { name: groupName, level: 2 })).not.toBeVisible({ timeout: 5000 });
}

/**
 * Opens the kebab menu for a group row.
 */
async function openGroupKebabMenu(page: Page, groupName: string): Promise<void> {
  const groupRow = page.locator('tbody tr', { has: page.getByText(groupName) });
  const kebabButton = groupRow.getByRole('button', { name: /actions/i });
  await expect(kebabButton).toBeVisible();
  await kebabButton.click();
}

/**
 * Fills the Create/Edit User Group page form.
 * V2 uses a full page form (EditUserGroup component), not a wizard or modal.
 */
async function fillGroupForm(page: Page, name: string, description: string): Promise<void> {
  // Wait for form to load
  await expect(page.locator('[data-ouia-component-id="edit-user-group-form"]')).toBeVisible({ timeout: 10000 });

  // Fill name field
  const nameInput = page.getByLabel(/^name/i);
  await expect(nameInput).toBeVisible({ timeout: 5000 });
  await nameInput.click();
  await nameInput.selectText();
  await page.keyboard.press('Backspace');
  await nameInput.fill(name);

  // Fill description field
  const descInput = page.getByLabel(/description/i);
  await expect(descInput).toBeVisible({ timeout: 5000 });
  await descInput.click();
  await descInput.selectText();
  await page.keyboard.press('Backspace');
  await descInput.fill(description);

  // Wait for form validation and submit
  const submitButton = page.getByRole('button', { name: /submit|save|create/i });
  await expect(submitButton).toBeEnabled({ timeout: 10000 });
  await submitButton.click();

  // Wait for navigation back to groups list
  await expect(page).toHaveURL(/\/user-groups(\?|$)/, { timeout: 15000 });
}

/**
 * Confirms group deletion in the delete modal.
 */
async function confirmGroupDeletion(page: Page): Promise<void> {
  const deleteModal = page.getByRole('dialog');
  await expect(deleteModal).toBeVisible({ timeout: 5000 });

  // Check confirmation checkbox if present
  const checkbox = deleteModal.getByRole('checkbox');
  if (await checkbox.isVisible({ timeout: 2000 }).catch(() => false)) {
    await checkbox.click();
  }

  const confirmButton = deleteModal.getByRole('button', { name: /delete|remove|confirm/i });
  await expect(confirmButton).toBeEnabled();
  await confirmButton.click();
  await expect(deleteModal).not.toBeVisible({ timeout: 10000 });
}

// ═══════════════════════════════════════════════════════════════════════════
// JOURNEY 1: SEEDED DATA (Read-Only)
// ═══════════════════════════════════════════════════════════════════════════

test.describe('V2 User Groups - Admin Seeded Data Journey', () => {
  test('Can find and inspect seeded group', async ({ page }) => {
    test.skip(!SEEDED_GROUP_NAME, 'No seeded group found in seed map');
    await setupPage(page);
    await page.goto(GROUPS_URL);
    await expect(page.getByRole('heading', { name: /user groups/i })).toBeVisible();

    await test.step('Verify Create User Group button is visible', async () => {
      const createButton = page.getByRole('button', { name: /create.*group/i });
      await expect(createButton).toBeVisible();
    });

    await test.step('Search for the seeded group', async () => {
      await searchForGroup(page, SEEDED_GROUP_NAME!);
      await verifyGroupInTable(page, SEEDED_GROUP_NAME!);
    });

    await test.step('Open group details drawer', async () => {
      await openGroupDrawer(page, SEEDED_GROUP_NAME!);
    });

    await test.step('Verify drawer content', async () => {
      const drawer = page.locator('[data-ouia-component-id="groups-details-drawer"]');

      // V2 drawer has Users, Service accounts, and Assigned roles tabs
      await expect(drawer.getByRole('tab', { name: /users/i })).toBeVisible();
      await expect(drawer.getByRole('tab', { name: /service accounts/i })).toBeVisible();
      await expect(drawer.getByRole('tab', { name: /assigned roles/i })).toBeVisible();

      await closeGroupDrawer(page, SEEDED_GROUP_NAME!);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// JOURNEY 2: CRUD LIFECYCLE (Ephemeral Data)
// ═══════════════════════════════════════════════════════════════════════════

test.describe('V2 User Groups - Admin CRUD Lifecycle Journey', () => {
  // Generate unique name for this test run (parallel-safe)
  const timestamp = Date.now();
  const uniqueGroupName = `${TEST_PREFIX}__V2_Lifecycle_${timestamp}`;
  const groupDescription = 'E2E V2 lifecycle test group - created by automated tests';
  const editedGroupName = `${uniqueGroupName}_Edited`;
  const editedDescription = 'E2E V2 lifecycle test group - EDITED by automated tests';

  test('Create → View → Edit → Delete → Verify Deleted', async ({ page }) => {
    await setupPage(page);

    console.log(`\n[V2 User Groups CRUD] Starting lifecycle test`);
    console.log(`[V2 User Groups CRUD] Group name: ${uniqueGroupName}\n`);

    // ─────────────────────────────────────────────────────────────────────
    // PHASE 1: CREATE
    // ─────────────────────────────────────────────────────────────────────
    await test.step('Phase 1: Create new group via form page', async () => {
      await page.goto(GROUPS_URL);
      await expect(page.getByRole('heading', { name: /user groups/i })).toBeVisible();

      // Click Create Group button - navigates to create page
      const createButton = page.getByRole('button', { name: /create.*group/i });
      await expect(createButton).toBeVisible();
      await createButton.click();

      // Wait for navigation to create page
      await expect(page).toHaveURL(/\/create-group/, { timeout: 10000 });

      // Fill form and submit
      await fillGroupForm(page, uniqueGroupName, groupDescription);

      console.log(`[Create] ✓ Group created via form page`);
    });

    // ─────────────────────────────────────────────────────────────────────
    // PHASE 2: VERIFY CREATION
    // ─────────────────────────────────────────────────────────────────────
    await test.step('Phase 2: Verify group appears in table', async () => {
      await searchForGroup(page, uniqueGroupName);
      await verifyGroupInTable(page, uniqueGroupName);

      console.log(`[Verify] ✓ Group found in table`);
    });

    // ─────────────────────────────────────────────────────────────────────
    // PHASE 3: VIEW IN DRAWER
    // ─────────────────────────────────────────────────────────────────────
    await test.step('Phase 3: View group details in drawer', async () => {
      await openGroupDrawer(page, uniqueGroupName);

      // Verify drawer tabs
      const drawer = page.locator('[data-ouia-component-id="groups-details-drawer"]');
      await expect(drawer.getByRole('tab', { name: /users/i })).toBeVisible();

      await closeGroupDrawer(page, uniqueGroupName);

      console.log(`[View] ✓ Drawer verified`);
    });

    // ─────────────────────────────────────────────────────────────────────
    // PHASE 4: EDIT
    // ─────────────────────────────────────────────────────────────────────
    await test.step('Phase 4: Edit group from kebab menu', async () => {
      await openGroupKebabMenu(page, uniqueGroupName);

      const editOption = page.getByRole('menuitem', { name: /edit/i });
      await expect(editOption).toBeVisible();
      await editOption.click();

      // Wait for dropdown to close
      await expect(editOption).not.toBeVisible({ timeout: 3000 });

      // V2 navigates to edit page (not modal)
      await expect(page).toHaveURL(/\/edit-group\//, { timeout: 10000 });

      // Fill form with new values
      await fillGroupForm(page, editedGroupName, editedDescription);

      console.log(`[Edit] ✓ Group edited via form page`);
    });

    // ─────────────────────────────────────────────────────────────────────
    // PHASE 5: DELETE
    // ─────────────────────────────────────────────────────────────────────
    await test.step('Phase 5: Delete group from kebab menu', async () => {
      await searchForGroup(page, editedGroupName);
      await verifyGroupInTable(page, editedGroupName);

      await openGroupKebabMenu(page, editedGroupName);

      const deleteOption = page.getByRole('menuitem', { name: /delete/i });
      await expect(deleteOption).toBeVisible();
      await deleteOption.click();

      await confirmGroupDeletion(page);

      console.log(`[Delete] ✓ Group deleted`);
    });

    // ─────────────────────────────────────────────────────────────────────
    // PHASE 6: VERIFY DELETION
    // ─────────────────────────────────────────────────────────────────────
    await test.step('Phase 6: Verify group is deleted', async () => {
      await searchForGroup(page, editedGroupName);
      await verifyGroupNotInTable(page, editedGroupName);

      console.log(`[Verify] ✓ Group confirmed deleted`);
      console.log(`\n[V2 User Groups CRUD] ✓ Lifecycle test completed successfully!\n`);
    });
  });
});
