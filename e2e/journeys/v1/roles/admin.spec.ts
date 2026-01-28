/**
 * V1 Roles - Admin Journey Tests
 *
 * Optimized end-to-end journey tests that consolidate multiple verifications
 * into single page loads using test.step() blocks.
 *
 * Journey Pattern:
 * - Pay the "page load tax" once per journey, not per assertion
 * - Use test.step() to organize logical phases
 * - Use strict accessibility selectors (getByRole with name constraints)
 * - Scope table queries with getByRole('grid') to avoid filter chip collisions
 *
 * Data Strategy:
 * - READ operations: Use SEED_MAP for stable, pre-seeded data
 * - WRITE operations: Generate unique names with timestamps for parallel safety
 * - CLEANUP: Delete created data at journey end (not afterAll, for visibility)
 */

import { Page, expect, test } from '@playwright/test';
import {
  AUTH_V1_ADMIN,
  clickMenuItem,
  openDetailPageActionsMenu,
  openRoleActionsMenu,
  setupPage,
  verifySuccessNotification,
  waitForNextEnabled,
  waitForTableUpdate,
} from '../../../utils';
import { getSeededRoleData, getSeededRoleName } from '../../../utils/seed-map';

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
      '║    TEST_PREFIX=e2e npx playwright test v1/roles/admin               ║\n' +
      '║                                                                      ║\n' +
      '╚══════════════════════════════════════════════════════════════════════╝\n',
  );
}

test.use({ storageState: AUTH_V1_ADMIN });

const ROLES_URL = '/iam/user-access/roles';

// Get seeded role name and data from seed map/fixture
const SEEDED_ROLE_NAME = getSeededRoleName();
const SEEDED_ROLE_DATA = getSeededRoleData();
if (!SEEDED_ROLE_NAME) {
  throw new Error('No seeded role found in seed map. Run: npm run e2e:seed:v1');
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Searches for a role by name using the filter input.
 * Scoped to the table grid to avoid false positives from filter chips.
 */
async function searchForRole(page: Page, roleName: string): Promise<void> {
  const searchInput = page.getByRole('searchbox').or(page.getByPlaceholder(/filter|search/i));
  await searchInput.clear();
  await searchInput.fill(roleName);
  // Wait for table to update with filtered results
  await waitForTableUpdate(page);
}

/**
 * Verifies a role row exists in the table grid.
 * Uses strict accessibility selectors scoped to the grid.
 */
async function verifyRoleInTable(page: Page, roleName: string): Promise<void> {
  const grid = page.getByRole('grid');
  await expect(grid.getByRole('row', { name: new RegExp(roleName, 'i') })).toBeVisible({
    timeout: 10000,
  });
}

/**
 * Verifies a role row does NOT exist in the table grid.
 */
async function verifyRoleNotInTable(page: Page, roleName: string): Promise<void> {
  const grid = page.getByRole('grid');
  await expect(grid.getByRole('row', { name: new RegExp(roleName, 'i') })).not.toBeVisible({
    timeout: 10000,
  });
}

/**
 * Clicks on a role link in the table to navigate to detail page.
 */
async function navigateToRoleDetail(page: Page, roleName: string): Promise<void> {
  const grid = page.getByRole('grid');
  const roleLink = grid.getByRole('link', { name: roleName });
  await roleLink.click();
  await expect(page).toHaveURL(/\/roles\//);
}

/**
 * Fills the Create Role wizard and submits - FULL FEATURE TEST.
 * Matches the pattern from ProductionOrgAdmin.stories.tsx CreateRoleJourney.
 *
 * Wizard Steps:
 * 1. Choose type (Create from scratch vs Copy existing)
 * 2. Enter role name
 * 3. Add permissions (select multiple)
 * 4. Review & add description
 * 5. Submit & verify success
 *
 * Note: PF6 wraps wizards in a modal, creating 2 dialog elements.
 * We use .first() to target the wizard specifically.
 */
async function fillCreateRoleWizard(page: Page, roleName: string, description: string): Promise<void> {
  // Wait for the wizard to be visible - use .first() to handle PF6 modal wrapper
  const wizard = page.getByRole('dialog').first();
  await expect(wizard).toBeVisible({ timeout: 10000 });

  /**
   * Helper to get the wizard's Next button (not pagination next)
   */
  const getWizardNextButton = () => {
    return wizard
      .getByRole('button', { name: /^next$/i })
      .filter({ hasNot: page.locator('.pf-v6-c-pagination') })
      .first();
  };

  // ─────────────────────────────────────────────────────────────────────
  // STEP 1: Choose creation type
  // ─────────────────────────────────────────────────────────────────────
  const createFromScratchOption = wizard.getByRole('radio', { name: /create.*scratch/i });
  if (await createFromScratchOption.isVisible({ timeout: 2000 }).catch(() => false)) {
    await createFromScratchOption.click();
  }

  // ─────────────────────────────────────────────────────────────────────
  // STEP 2: Enter role name AND description (both in same step per SetName.tsx)
  // ─────────────────────────────────────────────────────────────────────
  // Wait for name input to appear (indicates step transition complete)
  const nameInput = wizard.getByLabel(/role name/i);
  await expect(nameInput).toBeVisible({ timeout: 5000 });
  await nameInput.fill(roleName);

  // Fill description - use aria-label which is more reliable than ID
  // SetName.tsx: <TextArea id="role-description" aria-label="Role description" ...>
  const descriptionInput = wizard.getByLabel('Role description');
  await expect(descriptionInput).toBeVisible({ timeout: 5000 });
  await descriptionInput.fill(description);
  console.log(`[Wizard] ✓ Description entered: ${description}`);

  // Wait for async validation (name uniqueness check) by waiting for Next to be enabled
  const nextButton1 = getWizardNextButton();
  await waitForNextEnabled(page);

  // Click Next to proceed to permissions
  await nextButton1.click();

  // ─────────────────────────────────────────────────────────────────────
  // STEP 3: Add permissions (FULL TEST - select multiple)
  // ─────────────────────────────────────────────────────────────────────
  // Wait for permission checkboxes to appear (indicates step has loaded)
  const permissionCheckboxes = wizard.getByRole('checkbox');
  await expect(permissionCheckboxes.first()).toBeVisible({ timeout: 8000 });

  // Select multiple permissions (first 2-3 available)
  const permCount = await permissionCheckboxes.count();
  if (permCount > 1) {
    // Select first permission
    await permissionCheckboxes.nth(1).click();
    await expect(permissionCheckboxes.nth(1)).toBeChecked({ timeout: 2000 });
    console.log(`[Wizard] ✓ Selected permission 1`);
  }
  if (permCount > 2) {
    // Select second permission
    await permissionCheckboxes.nth(2).click();
    await expect(permissionCheckboxes.nth(2)).toBeChecked({ timeout: 2000 });
    console.log(`[Wizard] ✓ Selected permission 2`);
  }

  // Click Next to proceed to review
  const nextButton2 = getWizardNextButton();
  await expect(nextButton2).toBeEnabled({ timeout: 5000 });
  await nextButton2.click();

  // ─────────────────────────────────────────────────────────────────────
  // STEP 4: Review (verify data, no inputs here)
  // ─────────────────────────────────────────────────────────────────────
  // Wait for review step (look in main content area, not nav)
  const wizardContent = wizard.locator('.pf-v6-c-wizard__main-body, .pf-v6-c-wizard__main, .pf-v6-c-wizard__inner-wrap');
  await expect(wizardContent.getByText(/review/i).first()).toBeVisible({ timeout: 8000 });

  // Verify our role name appears in review
  await expect(wizard.getByText(roleName)).toBeVisible({ timeout: 5000 });

  // Verify description appears in review (was entered in Step 2)
  if (description) {
    const descriptionVisible = await wizard
      .getByText(description)
      .isVisible({ timeout: 2000 })
      .catch(() => false);
    if (descriptionVisible) {
      console.log(`[Wizard] ✓ Description visible in review`);
    }
  }

  // ─────────────────────────────────────────────────────────────────────
  // STEP 5: Submit & verify success
  // ─────────────────────────────────────────────────────────────────────
  const submitButton = wizard.getByRole('button', { name: /submit/i });
  await expect(submitButton).toBeEnabled({ timeout: 5000 });
  await submitButton.click();

  // Wait for success screen
  await expect(wizard.getByText(/successfully created/i)).toBeVisible({ timeout: 15000 });
  console.log(`[Wizard] ✓ Success screen displayed`);

  // Click Exit to close wizard
  const exitButton = wizard.getByRole('button', { name: /exit/i });
  await exitButton.click();

  // Wait for wizard to close
  await expect(wizard).not.toBeVisible({ timeout: 5000 });
}

/**
 * Fills the Edit Role modal and saves.
 * PORTED VERBATIM from EditRole.helpers.tsx (Storybook helper).
 */
async function fillEditRoleModal(page: Page, newName: string, newDescription: string): Promise<void> {
  // Wait for edit modal to appear and load data
  const dialog = page.getByRole('dialog').first();
  await expect(dialog).toBeVisible({ timeout: 5000 });

  // Wait for modal to show "Edit role information" text
  await expect(dialog.getByText('Edit role information')).toBeVisible({ timeout: 5000 });

  // Fill in new name - use getByLabel like Storybook helper
  const nameInput = dialog.getByLabel(/name/i);
  await nameInput.click();
  await nameInput.selectText();
  await page.keyboard.press('Backspace');
  await nameInput.fill(newName);

  // Fill in new description
  const descInput = dialog.getByLabel(/description/i);
  await descInput.click();
  await descInput.selectText();
  await page.keyboard.press('Backspace');
  await descInput.fill(newDescription);

  // Wait for validation and click Save button
  const saveButton = dialog.getByRole('button', { name: /save/i });
  await expect(saveButton).toBeEnabled({ timeout: 10000 });
  await saveButton.click();

  // Wait for modal to close
  await expect(dialog).not.toBeVisible({ timeout: 5000 });
}

/**
 * Confirms deletion in the delete role modal.
 * PORTED from DeleteRole.helpers.tsx - the WarningModal has withCheckbox.
 */
async function confirmRoleDeletion(page: Page): Promise<void> {
  // Wait for delete confirmation modal
  const dialog = page.getByRole('dialog').first();
  await expect(dialog).toBeVisible({ timeout: 5000 });

  // Wait for dialog content to load - look for the heading first
  await expect(dialog.getByRole('heading', { name: /delete role/i })).toBeVisible({ timeout: 10000 });

  // Check the confirmation checkbox (required by WarningModal withCheckbox)
  const checkbox = dialog.getByRole('checkbox');
  await expect(checkbox).toBeVisible({ timeout: 5000 });
  await checkbox.click();

  // Click the Delete button - wait for it to be enabled after checkbox
  const deleteButton = dialog.getByRole('button', { name: /delete role/i });
  await expect(deleteButton).toBeEnabled({ timeout: 5000 });
  await deleteButton.click();

  // Wait for modal to close
  await expect(dialog).not.toBeVisible({ timeout: 10000 });
}

// ═══════════════════════════════════════════════════════════════════════════
// JOURNEY 1: READ-ONLY (Seeded Data)
// ═══════════════════════════════════════════════════════════════════════════

test.describe('V1 Roles - Admin Read-Only Journey', () => {
  test('Seeded Role: Search → Table → Detail Page', async ({ page }) => {
    await setupPage(page);
    await page.goto(ROLES_URL);
    await expect(page.getByRole('heading', { name: 'Roles', exact: true })).toBeVisible();

    await test.step('Step 1: Verify admin capabilities', async () => {
      // Admin should see Create Role button
      const createButton = page.getByRole('button', { name: /create role/i });
      await expect(createButton).toBeVisible();
    });

    await test.step('Step 2: Search for seeded role', async () => {
      await searchForRole(page, SEEDED_ROLE_NAME);
      await verifyRoleInTable(page, SEEDED_ROLE_NAME);
    });

    await test.step('Step 3: Navigate to detail page', async () => {
      await navigateToRoleDetail(page, SEEDED_ROLE_NAME);
      await expect(page.getByRole('heading', { name: SEEDED_ROLE_NAME })).toBeVisible({
        timeout: 15000,
      });
    });

    await test.step('Step 4: Verify detail page contents', async () => {
      // Verify description (if defined in seed fixture)
      if (SEEDED_ROLE_DATA?.description) {
        await expect(page.getByText(SEEDED_ROLE_DATA.description)).toBeVisible({ timeout: 30000 });
      }

      // Verify admin actions are available (kebab menu)
      // Use exact match to avoid matching "Actions overflow menu" responsive button
      const actionsButton = page.getByRole('button', { name: 'Actions', exact: true });
      await expect(actionsButton).toBeVisible();

      // Note: Role detail page shows permissions directly (no tabs)
      // The RolePermissions component renders a table with permissions
      // We verify this by checking the grid is present
      await expect(page.getByRole('grid')).toBeVisible({ timeout: 10000 });
    });

    await test.step('Step 5: Verify kebab menu actions', async () => {
      await openDetailPageActionsMenu(page);
      // Admin should see Edit and Delete options for custom roles
      await expect(page.getByRole('menuitem', { name: /edit/i })).toBeVisible();
      await expect(page.getByRole('menuitem', { name: /delete/i })).toBeVisible();
      // Close menu by pressing Escape
      await page.keyboard.press('Escape');
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// JOURNEY 2: CRUD LIFECYCLE (Ephemeral Data)
// ═══════════════════════════════════════════════════════════════════════════

test.describe('V1 Roles - Admin CRUD Lifecycle Journey', () => {
  // Generate unique name for this test run (parallel-safe)
  const timestamp = Date.now();
  const uniqueRoleName = `${TEST_PREFIX}__E2E_Lifecycle_${timestamp}`;
  const roleDescription = 'E2E lifecycle test role - created by automated tests';
  const editedRoleName = `${uniqueRoleName}_Edited`;
  const editedDescription = 'E2E lifecycle test role - EDITED by automated tests';

  test('Create → Verify → Edit → Delete → Verify Deleted', async ({ page }) => {
    await setupPage(page);

    console.log(`\n[V1 Roles CRUD] Starting lifecycle test`);
    console.log(`[V1 Roles CRUD] Role name: ${uniqueRoleName}\n`);

    // ─────────────────────────────────────────────────────────────────────
    // PHASE 1: CREATE
    // ─────────────────────────────────────────────────────────────────────
    await test.step('Phase 1: Create new role via wizard', async () => {
      await page.goto(ROLES_URL);
      await expect(page.getByRole('heading', { name: 'Roles', exact: true })).toBeVisible();

      // Open Create Role wizard
      const createButton = page.getByRole('button', { name: /create role/i });
      await expect(createButton).toBeVisible();
      await createButton.click();

      // Fill wizard and submit
      await fillCreateRoleWizard(page, uniqueRoleName, roleDescription);

      console.log(`[Create] ✓ Wizard completed`);
    });

    // ─────────────────────────────────────────────────────────────────────
    // PHASE 2: VERIFY CREATION
    // ─────────────────────────────────────────────────────────────────────
    await test.step('Phase 2: Verify role appears in table', async () => {
      // Search for the new role
      await searchForRole(page, uniqueRoleName);
      await verifyRoleInTable(page, uniqueRoleName);

      console.log(`[Verify] ✓ Role found in table`);
    });

    // ─────────────────────────────────────────────────────────────────────
    // PHASE 3: VIEW DETAIL & VERIFY ALL WIZARD DATA
    // ─────────────────────────────────────────────────────────────────────
    await test.step('Phase 3: Navigate to detail page and verify ALL wizard data', async () => {
      await navigateToRoleDetail(page, uniqueRoleName);
      await expect(page.getByRole('heading', { name: uniqueRoleName })).toBeVisible({
        timeout: 10000,
      });

      // Verify the description we set
      await expect(page.getByText(roleDescription)).toBeVisible();

      // Verify it's a custom role (has edit/delete actions)
      await openDetailPageActionsMenu(page);
      await expect(page.getByRole('menuitem', { name: /edit/i })).toBeVisible();
      await expect(page.getByRole('menuitem', { name: /delete/i })).toBeVisible();
      await page.keyboard.press('Escape');

      // ── Verify PERMISSIONS grid has the permissions we selected ──
      // Note: Role detail page shows permissions directly (no tabs)
      const permissionsGrid = page.getByRole('grid');
      await expect(permissionsGrid).toBeVisible({ timeout: 10000 });
      const permissionRows = permissionsGrid.getByRole('row');
      // Should have header row + at least 1 data row (we selected 2 permissions)
      const rowCount = await permissionRows.count();
      expect(rowCount).toBeGreaterThan(1);
      console.log(`[View] ✓ Permissions grid verified - has ${rowCount - 1} permission(s)`);

      // Verify we have at least 2 permissions (we selected 2 in the wizard)
      expect(rowCount).toBeGreaterThanOrEqual(3); // header + 2 data rows
      console.log(`[View] ✓ Multiple permissions verified as selected in wizard`);

      console.log(`[View] ✓ All wizard data verified on detail page`);
    });

    // ─────────────────────────────────────────────────────────────────────
    // PHASE 4: EDIT FROM LIST
    // ─────────────────────────────────────────────────────────────────────
    await test.step('Phase 4: Edit role from list view', async () => {
      // Navigate back to list
      await page.goto(ROLES_URL);
      await expect(page.getByRole('heading', { name: 'Roles', exact: true })).toBeVisible();

      // Search for our role
      await searchForRole(page, uniqueRoleName);
      await verifyRoleInTable(page, uniqueRoleName);

      // Open row actions menu and click Edit
      await openRoleActionsMenu(page, uniqueRoleName);
      await clickMenuItem(page, 'Edit');

      // Fill edit modal
      await fillEditRoleModal(page, editedRoleName, editedDescription);

      // Verify success notification
      await verifySuccessNotification(page);

      console.log(`[Edit] ✓ Role renamed to: ${editedRoleName}`);
    });

    // ─────────────────────────────────────────────────────────────────────
    // PHASE 5: VERIFY EDIT
    // ─────────────────────────────────────────────────────────────────────
    await test.step('Phase 5: Verify edit was applied', async () => {
      // Search for the edited name and verify it exists
      await searchForRole(page, editedRoleName);
      await verifyRoleInTable(page, editedRoleName);

      // Search for the ORIGINAL name - it should NOT exist anymore
      // (We must search specifically for it, since editedRoleName contains uniqueRoleName)
      await searchForRole(page, uniqueRoleName);
      // The exact original name should not appear as a link in the table
      const originalNameLink = page.getByRole('grid').getByRole('link', { name: uniqueRoleName, exact: true });
      await expect(originalNameLink).not.toBeVisible({ timeout: 5000 });
      console.log(`[Verify Edit] ✓ Original name no longer exists`);

      // Navigate to detail and verify description (search for edited name first)
      await searchForRole(page, editedRoleName);
      await navigateToRoleDetail(page, editedRoleName);
      await expect(page.getByRole('heading', { name: editedRoleName })).toBeVisible({
        timeout: 10000,
      });
      await expect(page.getByText(editedDescription)).toBeVisible();

      console.log(`[Verify Edit] ✓ Changes confirmed`);
    });

    // ─────────────────────────────────────────────────────────────────────
    // PHASE 6: DELETE
    // ─────────────────────────────────────────────────────────────────────
    await test.step('Phase 6: Delete role', async () => {
      // Navigate back to list
      await page.goto(ROLES_URL);
      await expect(page.getByRole('heading', { name: 'Roles', exact: true })).toBeVisible();

      // Search and find the role
      await searchForRole(page, editedRoleName);
      await verifyRoleInTable(page, editedRoleName);

      // Open row actions menu and click Delete
      await openRoleActionsMenu(page, editedRoleName);
      await clickMenuItem(page, 'Delete');

      // Confirm deletion
      await confirmRoleDeletion(page);

      console.log(`[Delete] ✓ Deletion confirmed`);
    });

    // ─────────────────────────────────────────────────────────────────────
    // PHASE 7: VERIFY DELETION
    // ─────────────────────────────────────────────────────────────────────
    await test.step('Phase 7: Verify role is deleted', async () => {
      // Wait for navigation/refresh to complete - verify we're on the roles list
      await expect(page.getByRole('heading', { name: 'Roles', exact: true })).toBeVisible({ timeout: 15000 });

      // Search for the deleted role
      await searchForRole(page, editedRoleName);

      // Should not find the role
      await verifyRoleNotInTable(page, editedRoleName);

      console.log(`[Verify Delete] ✓ Role no longer exists`);
      console.log(`\n[V1 Roles CRUD] ✓ Lifecycle test completed successfully!\n`);
    });
  });
});
