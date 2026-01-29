/**
 * V2 Roles - OrgAdmin Journey Tests
 *
 * Tests for the V2 Roles page (/iam/access-management/roles)
 * with admin privileges.
 *
 * Journey Pattern:
 * - Pay the "page load tax" once per journey, not per assertion
 * - Use test.step() to organize logical phases
 * - Use strict accessibility selectors
 *
 * Key V2 Differences from V1:
 * - View detail: Row click → drawer (not link → page)
 * - Edit: Navigates to separate page (not modal)
 * - Delete: Modal with specific OUIA ID
 */

import { expect, test } from '@playwright/test';
import { AUTH_V2_ADMIN, setupPage } from '../../../utils';
import { getSeededRoleName } from '../../../utils/seed-map';
import { fillCreateRoleWizard, searchForRole, verifyRoleInTable, verifyRoleNotInTable } from '../../../utils/roleHelpers';

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

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
      '║    TEST_PREFIX=e2e npx playwright test v2/roles/admin               ║\n' +
      '║                                                                      ║\n' +
      '╚══════════════════════════════════════════════════════════════════════╝\n',
  );
}

test.use({ storageState: AUTH_V2_ADMIN });

const ROLES_URL = '/iam/access-management/roles';

// Get seeded role name from seed map/fixture
const SEEDED_ROLE_NAME = getSeededRoleName();

// ═══════════════════════════════════════════════════════════════════════════
// V2-SPECIFIC HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Opens role details drawer by clicking on the role row.
 * V2-specific: Uses drawer instead of page navigation.
 */
async function openRoleDrawer(page: import('@playwright/test').Page, roleName: string): Promise<void> {
  const roleCell = page.getByRole('grid').getByText(roleName);
  await roleCell.click();
  // Drawer opens with role name as h2 heading
  await expect(page.getByRole('heading', { name: roleName, level: 2 })).toBeVisible({ timeout: 10000 });
}

/**
 * Closes the role details drawer.
 */
async function closeRoleDrawer(page: import('@playwright/test').Page, roleName: string): Promise<void> {
  const closeButton = page.locator('[data-ouia-component-id="RolesTable-drawer-close-button"]');
  await closeButton.click();
  await expect(page.getByRole('heading', { name: roleName, level: 2 })).not.toBeVisible({ timeout: 5000 });
}

/**
 * Opens the kebab menu for a role row.
 */
async function openRoleKebabMenu(page: import('@playwright/test').Page, roleName: string): Promise<void> {
  const roleRow = page.locator('tbody tr', { has: page.getByText(roleName) });
  const kebabButton = roleRow.getByRole('button', { name: /actions/i });
  await expect(kebabButton).toBeVisible();
  await kebabButton.click();
}

/**
 * Fills the V2 Edit Role page and saves.
 * V2-specific: Edit is a full page (EditRole.tsx), not a modal.
 *
 * Note: Form uses DDF with pristine check - must actually change content for Save to enable.
 */
async function fillEditRolePage(page: import('@playwright/test').Page, newName: string, newDescription: string): Promise<void> {
  // Wait for edit page to load
  await expect(page).toHaveURL(/\/roles\/edit\//, { timeout: 10000 });

  // Wait for the form to be visible
  const nameInput = page.getByLabel(/^name/i);
  await expect(nameInput).toBeVisible({ timeout: 10000 });

  // Change name - clear and fill with new value
  await nameInput.click();
  await nameInput.selectText();
  await page.keyboard.press('Backspace');
  await nameInput.fill(newName);

  // Change description
  const descInput = page.getByLabel(/description/i);
  await expect(descInput).toBeVisible({ timeout: 5000 });
  await descInput.click();
  await descInput.selectText();
  await page.keyboard.press('Backspace');
  await descInput.fill(newDescription);

  // Wait for form to recognize changes and enable Save
  const saveButton = page.getByRole('button', { name: /save/i });
  await expect(saveButton).toBeEnabled({ timeout: 10000 });
  await saveButton.click();

  // After save, should navigate back to roles list (may have query params)
  await expect(page).toHaveURL(/\/roles(\?|$)/, { timeout: 15000 });
}

/**
 * Confirms role deletion in the V2 delete modal.
 */
async function confirmRoleDeletion(page: import('@playwright/test').Page): Promise<void> {
  const deleteModal = page.locator('[data-ouia-component-id="RolesTable-remove-role-modal"]');
  await expect(deleteModal).toBeVisible({ timeout: 5000 });

  const checkbox = deleteModal.getByRole('checkbox');
  if (await checkbox.isVisible({ timeout: 2000 }).catch(() => false)) {
    await checkbox.click();
  }

  const confirmButton = deleteModal.getByRole('button', { name: /delete/i });
  await expect(confirmButton).toBeEnabled();
  await confirmButton.click();
  await expect(deleteModal).not.toBeVisible({ timeout: 10000 });
}

// ═══════════════════════════════════════════════════════════════════════════
// JOURNEY 1: SEEDED DATA (Read-Only)
// ═══════════════════════════════════════════════════════════════════════════

test.describe('V2 Roles - OrgAdmin Seeded Data Journey', () => {
  test('Can find and inspect seeded role', async ({ page }) => {
    test.skip(!SEEDED_ROLE_NAME, 'No seeded role found in seed map');
    await setupPage(page);
    await page.goto(ROLES_URL);
    await expect(page.getByRole('heading', { name: /roles/i })).toBeVisible();

    await test.step('Verify Create Role button is visible', async () => {
      const createButton = page.getByRole('button', { name: /create role/i });
      await expect(createButton).toBeVisible();
    });

    await test.step('Search for the seeded role', async () => {
      await searchForRole(page, SEEDED_ROLE_NAME!);
      await verifyRoleInTable(page, SEEDED_ROLE_NAME!);
    });

    await test.step('Open role details drawer', async () => {
      await openRoleDrawer(page, SEEDED_ROLE_NAME!);
    });

    await test.step('Verify drawer content', async () => {
      // V2 drawer has Permissions and Assigned user groups tabs
      await expect(page.getByRole('tab', { name: /permissions/i })).toBeVisible();
      await expect(page.getByRole('tab', { name: /assigned user groups/i })).toBeVisible();

      // Close drawer
      await closeRoleDrawer(page, SEEDED_ROLE_NAME!);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// JOURNEY 2: CRUD LIFECYCLE (Ephemeral Data)
// ═══════════════════════════════════════════════════════════════════════════

test.describe('V2 Roles - OrgAdmin CRUD Lifecycle Journey', () => {
  // Generate unique name for this test run (parallel-safe)
  const timestamp = Date.now();
  const uniqueRoleName = `${TEST_PREFIX}__V2_Lifecycle_${timestamp}`;
  const roleDescription = 'E2E V2 lifecycle test role - created by automated tests';
  const editedRoleName = `${uniqueRoleName}_Edited`;
  const editedDescription = 'E2E V2 lifecycle test role - EDITED by automated tests';

  test('Create → View → Edit → Delete → Verify Deleted', async ({ page }) => {
    await setupPage(page);

    console.log(`\n[V2 Roles CRUD] Starting lifecycle test`);
    console.log(`[V2 Roles CRUD] Role name: ${uniqueRoleName}\n`);

    // ─────────────────────────────────────────────────────────────────────
    // PHASE 1: CREATE
    // ─────────────────────────────────────────────────────────────────────
    await test.step('Phase 1: Create new role via wizard', async () => {
      await page.goto(ROLES_URL);
      await expect(page.getByRole('heading', { name: /roles/i })).toBeVisible();

      // Open Create Role wizard
      const createButton = page.getByRole('button', { name: /create role/i });
      await expect(createButton).toBeVisible();
      await createButton.click();

      // Fill wizard and submit (uses shared helper - same wizard as V1)
      await fillCreateRoleWizard(page, uniqueRoleName, roleDescription);

      console.log(`[Create] ✓ Wizard completed`);
    });

    // ─────────────────────────────────────────────────────────────────────
    // PHASE 2: VERIFY CREATION
    // ─────────────────────────────────────────────────────────────────────
    await test.step('Phase 2: Verify role appears in table', async () => {
      await searchForRole(page, uniqueRoleName);
      await verifyRoleInTable(page, uniqueRoleName);

      console.log(`[Verify] ✓ Role found in table`);
    });

    // ─────────────────────────────────────────────────────────────────────
    // PHASE 3: VIEW IN DRAWER (V2-specific)
    // ─────────────────────────────────────────────────────────────────────
    await test.step('Phase 3: Open drawer and verify role data', async () => {
      await openRoleDrawer(page, uniqueRoleName);

      // Verify drawer has expected tabs
      await expect(page.getByRole('tab', { name: /permissions/i })).toBeVisible();
      await expect(page.getByRole('tab', { name: /assigned user groups/i })).toBeVisible();

      // Close drawer
      await closeRoleDrawer(page, uniqueRoleName);

      console.log(`[View] ✓ Drawer verified`);
    });

    // ─────────────────────────────────────────────────────────────────────
    // PHASE 4: EDIT (V2 uses full page, not modal)
    // ─────────────────────────────────────────────────────────────────────
    await test.step('Phase 4: Edit role from kebab menu', async () => {
      await openRoleKebabMenu(page, uniqueRoleName);

      const editOption = page.getByRole('menuitem', { name: /edit/i });
      await expect(editOption).toBeVisible();
      await editOption.click();

      // V2 navigates to edit page
      await fillEditRolePage(page, editedRoleName, editedDescription);

      console.log(`[Edit] ✓ Role renamed to: ${editedRoleName}`);
    });

    // ─────────────────────────────────────────────────────────────────────
    // PHASE 5: VERIFY EDIT
    // ─────────────────────────────────────────────────────────────────────
    await test.step('Phase 5: Verify edit was applied', async () => {
      // Search for the edited name
      await searchForRole(page, editedRoleName);
      await verifyRoleInTable(page, editedRoleName);

      // Verify original name no longer exists
      await searchForRole(page, uniqueRoleName);
      const originalNameVisible = await page
        .getByRole('grid')
        .getByText(uniqueRoleName, { exact: true })
        .isVisible({ timeout: 2000 })
        .catch(() => false);
      expect(originalNameVisible).toBe(false);

      console.log(`[Verify Edit] ✓ Role renamed, original name gone`);
    });

    // ─────────────────────────────────────────────────────────────────────
    // PHASE 6: DELETE
    // ─────────────────────────────────────────────────────────────────────
    await test.step('Phase 6: Delete role', async () => {
      // Search for the edited role first
      await searchForRole(page, editedRoleName);
      await openRoleKebabMenu(page, editedRoleName);

      const deleteOption = page.getByRole('menuitem', { name: /delete/i });
      await expect(deleteOption).toBeVisible();
      await deleteOption.click();

      await confirmRoleDeletion(page);

      console.log(`[Delete] ✓ Deletion confirmed`);
    });

    // ─────────────────────────────────────────────────────────────────────
    // PHASE 7: VERIFY DELETION
    // ─────────────────────────────────────────────────────────────────────
    await test.step('Phase 7: Verify role is deleted', async () => {
      // Wait for table to update after deletion
      await expect(page.getByRole('heading', { name: /roles/i })).toBeVisible({ timeout: 15000 });

      await searchForRole(page, editedRoleName);
      await verifyRoleNotInTable(page, editedRoleName);

      console.log(`[Verify Delete] ✓ Role no longer exists`);
      console.log(`\n[V2 Roles CRUD] ✓ Lifecycle test completed successfully!\n`);
    });
  });
});
