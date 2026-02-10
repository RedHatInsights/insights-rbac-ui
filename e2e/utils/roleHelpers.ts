/**
 * Shared Role E2E Helpers
 *
 * These helpers are shared between V1 and V2 role tests since they use
 * the same AddRoleWizard component.
 */

import { Locator, Page, expect } from '@playwright/test';
import { waitForTableUpdate } from './waiters';
import { E2E_TIMEOUTS } from './timeouts';

// ============================================================================
// Internal Helper Functions - One per wizard step
// ============================================================================

/**
 * Gets the wizard's Next button (not pagination next).
 * Filters out pagination buttons to avoid ambiguity.
 */
function getWizardNextButton(wizard: Locator): Locator {
  return wizard
    .getByRole('button', { name: /^next$/i })
    .filter({ hasNot: wizard.page().locator('.pf-v6-c-pagination') })
    .first();
}

/**
 * STEP: Select source role (copy flow only)
 * Chooses "Copy an existing role" and selects the source role from the table.
 */
async function selectSourceRole(wizard: Locator, sourceRoleName: string): Promise<void> {
  // Choose "Copy an existing role"
  const copyRadio = wizard.getByRole('radio', { name: /copy an existing role/i });
  await expect(copyRadio).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
  await copyRadio.click();
  console.log(`[Wizard] ✓ Selected "Copy an existing role"`);

  // Wait for roles table
  await expect(wizard.getByRole('grid', { name: /roles/i })).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });

  // Search for the source role
  const searchInput = wizard.getByRole('textbox', { name: /search|filter/i });
  if (await searchInput.isVisible({ timeout: E2E_TIMEOUTS.MENU_ANIMATION }).catch(() => false)) {
    await searchInput.fill(sourceRoleName);
    await searchInput.press('Enter');
    console.log(`[Wizard] ✓ Searched for role: ${sourceRoleName}`);
  }

  // Click the radio button for the source role
  await wizard.getByRole('radio', { name: new RegExp(sourceRoleName, 'i') }).click();
  console.log(`[Wizard] ✓ Selected source role: ${sourceRoleName}`);

  // Click Next
  const nextButton = getWizardNextButton(wizard);
  await expect(nextButton).toBeEnabled({ timeout: E2E_TIMEOUTS.TABLE_DATA });
  await nextButton.click();
}

/**
 * STEP: Fill name and description
 * Common to both flows.
 */
async function fillNameAndDescription(wizard: Locator, roleName: string, description: string): Promise<void> {
  // Wait for name input to appear
  const nameInput = wizard.getByLabel(/role name/i);
  await expect(nameInput).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
  await nameInput.fill(roleName);

  // Wait for async validation debounce (250ms debounce + API call time)
  await wizard.page().waitForTimeout(E2E_TIMEOUTS.BUTTON_STATE);

  // Fill description
  const descriptionInput = wizard.getByLabel('Role description');
  await expect(descriptionInput).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
  await descriptionInput.fill(description);
  console.log(`[Wizard] ✓ Name and description entered`);

  // Wait for async validation (name uniqueness check)
  const nextButton = getWizardNextButton(wizard);
  await expect(nextButton).toBeEnabled({ timeout: E2E_TIMEOUTS.TABLE_DATA });
  await nextButton.click();
}

/**
 * STEP: Handle permissions
 * For "create from scratch": selects multiple permissions
 * For "copy existing": permissions are inherited, just click Next
 */
async function handlePermissions(wizard: Locator, selectPermissions: boolean): Promise<void> {
  // Wait for permission checkboxes to appear
  const permissionCheckboxes = wizard.getByRole('checkbox');
  await expect(permissionCheckboxes.first()).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });

  if (selectPermissions) {
    // Select multiple permissions for "create from scratch"
    const permCount = await permissionCheckboxes.count();
    if (permCount > 1) {
      await permissionCheckboxes.nth(1).click();
      await expect(permissionCheckboxes.nth(1)).toBeChecked({ timeout: E2E_TIMEOUTS.MENU_ANIMATION });
      console.log(`[Wizard] ✓ Selected permission 1`);
    }
    if (permCount > 2) {
      await permissionCheckboxes.nth(2).click();
      await expect(permissionCheckboxes.nth(2)).toBeChecked({ timeout: E2E_TIMEOUTS.MENU_ANIMATION });
      console.log(`[Wizard] ✓ Selected permission 2`);
    }
  } else {
    console.log(`[Wizard] ✓ Permissions inherited from source`);
  }

  // Click Next to proceed to review
  const nextButton = getWizardNextButton(wizard);
  await expect(nextButton).toBeEnabled({ timeout: E2E_TIMEOUTS.TABLE_DATA });
  await nextButton.click();

  // Wait for step transition to complete
  await wizard.page().waitForTimeout(E2E_TIMEOUTS.MENU_ANIMATION);
}

/**
 * STEP: Review and submit
 * Common to both flows.
 */
async function reviewAndSubmit(wizard: Locator, roleName: string): Promise<void> {
  // Wait for review step heading
  await expect(wizard.getByRole('heading', { name: /review details/i })).toBeVisible({
    timeout: E2E_TIMEOUTS.TABLE_DATA,
  });

  // Verify our role name appears in review
  await expect(wizard.getByText(roleName)).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
  console.log(`[Wizard] ✓ Review step verified`);

  // Submit
  const submitButton = wizard.getByRole('button', { name: /submit/i });
  await expect(submitButton).toBeEnabled({ timeout: E2E_TIMEOUTS.TABLE_DATA });
  await submitButton.click();

  // Wait for success screen
  await expect(wizard.getByText(/successfully created/i)).toBeVisible({
    timeout: E2E_TIMEOUTS.MUTATION_COMPLETE,
  });
  console.log(`[Wizard] ✓ Success screen displayed`);

  // Exit wizard
  const exitButton = wizard.getByRole('button', { name: /exit/i });
  await exitButton.click();
  await expect(wizard).not.toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
}

/**
 * STEP: Define Workspaces access (common to both flows, conditional)
 * Appears when the role has any of these permissions:
 * - inventory:hosts:read
 * - inventory:hosts:write
 * - inventory:groups:read
 * - inventory:groups:write
 *
 * Selects the seeded workspace for each inventory permission.
 */
async function defineWorkspacesAccess(wizard: Locator, seededWorkspaceName: string): Promise<void> {
  // Check if we're on the "Define Workspaces access" step
  const workspacesHeading = wizard.getByRole('heading', { name: /define workspaces access/i });
  const isOnWorkspacesStep = await workspacesHeading.isVisible({ timeout: E2E_TIMEOUTS.MENU_ANIMATION }).catch(() => false);

  if (!isOnWorkspacesStep) {
    console.log(`[Wizard] ✓ Define Workspaces access step skipped (no inventory permissions)`);
    return;
  }

  console.log(`[Wizard] ✓ Define Workspaces access step detected`);

  // Find all "Select workspaces" dropdowns and select the seeded workspace
  // There will be one dropdown for each inventory permission (hosts:read, hosts:write, groups:read, groups:write)
  const workspaceSelects = wizard.getByRole('button', { name: /select workspaces/i });
  const selectCount = await workspaceSelects.count();

  for (let i = 0; i < selectCount; i++) {
    await workspaceSelects.nth(i).click();

    // Wait for dropdown menu to open
    await wizard.page().waitForTimeout(E2E_TIMEOUTS.MENU_ANIMATION);

    // Select the seeded workspace from the menu
    const workspaceOption = wizard.page().getByRole('option', { name: new RegExp(seededWorkspaceName, 'i') });
    await workspaceOption.click();

    console.log(`[Wizard] ✓ Selected workspace "${seededWorkspaceName}" for inventory permission ${i + 1}`);
  }

  // Click Next to proceed to review
  const nextButton = getWizardNextButton(wizard);
  await expect(nextButton).toBeEnabled({ timeout: E2E_TIMEOUTS.TABLE_DATA });
  await nextButton.click();

  // Wait for step transition to complete
  await wizard.page().waitForTimeout(E2E_TIMEOUTS.MENU_ANIMATION);
}

// ============================================================================
// Public API Functions
// ============================================================================

/**
 * Create role from scratch.
 *
 * Flow:
 * 1. Name and description
 * 2. Permissions (select some)
 * 3. Define Workspaces access (conditional - only if inventory permissions selected)
 * 4. Review and submit
 *
 * Note: "Create from scratch" radio is selected by default, so we skip step 1.
 */
export async function fillCreateRoleWizard(page: Page, roleName: string, description: string, seededWorkspaceName: string): Promise<void> {
  const wizard = page.getByRole('dialog').first();
  await expect(wizard).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });

  await fillNameAndDescription(wizard, roleName, description);
  await handlePermissions(wizard, true); // true = select permissions
  await defineWorkspacesAccess(wizard, seededWorkspaceName);
  await reviewAndSubmit(wizard, roleName);
}

/**
 * Create role by copying an existing role.
 *
 * Flow:
 * 1. Select source role to copy
 * 2. Name and description
 * 3. Permissions (inherited, just advance)
 * 4. Define Workspaces access (conditional - only if source role has inventory permissions)
 * 5. Review and submit
 */
export async function fillCreateRoleWizardAsCopy(
  page: Page,
  newRoleName: string,
  sourceRoleName: string,
  seededWorkspaceName: string,
  description?: string,
): Promise<void> {
  await page.waitForURL(/add-role/, { timeout: E2E_TIMEOUTS.TABLE_DATA });

  const wizard = page.getByRole('dialog').first();
  await expect(wizard).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });

  await selectSourceRole(wizard, sourceRoleName);
  await fillNameAndDescription(wizard, newRoleName, description || '');
  await handlePermissions(wizard, false); // false = don't select, inherited
  await defineWorkspacesAccess(wizard, seededWorkspaceName);
  await reviewAndSubmit(wizard, newRoleName);
}

/**
 * Searches for a role by name using the filter input.
 * Scoped to the table grid to avoid false positives from filter chips.
 */
export async function searchForRole(page: Page, roleName: string): Promise<void> {
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
export async function verifyRoleInTable(page: Page, roleName: string): Promise<void> {
  const grid = page.getByRole('grid');
  await expect(grid.getByRole('row', { name: new RegExp(roleName, 'i') })).toBeVisible({
    timeout: E2E_TIMEOUTS.TABLE_DATA,
  });
}

/**
 * Verifies a role row does NOT exist in the table grid.
 */
export async function verifyRoleNotInTable(page: Page, roleName: string): Promise<void> {
  const grid = page.getByRole('grid');
  await expect(grid.getByRole('row', { name: new RegExp(roleName, 'i') })).not.toBeVisible({
    timeout: E2E_TIMEOUTS.TABLE_DATA,
  });
}
