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

  // Wait for roles table
  await expect(wizard.getByRole('grid', { name: /roles/i })).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });

  // Search for the source role — the filter input's placeholder varies by version.
  // Do NOT press Enter: the TableView filter is debounce-driven via onChange.
  // Pressing Enter may trigger form-level submission inside the wizard.
  const searchInput = wizard.getByPlaceholder(/role name|search|filter/i);
  await expect(searchInput).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
  await searchInput.fill(sourceRoleName);
  await waitForTableUpdate(wizard.page(), { timeout: E2E_TIMEOUTS.SLOW_DATA });

  // Click the radio button for the source role
  await wizard.getByRole('radio', { name: new RegExp(sourceRoleName, 'i') }).click();

  // Click Next
  const nextButton = getWizardNextButton(wizard);
  await expect(nextButton).toBeEnabled({ timeout: E2E_TIMEOUTS.TABLE_DATA });
  await nextButton.click();
}

/**
 * STEP: Select the first role in the copy table.
 * Used when no specific source role is needed — avoids roles with inventory
 * permissions that trigger the unhandled "Define Workspaces access" step.
 * Returns the selected role's display name for downstream verification.
 */
async function selectFirstSourceRole(wizard: Locator): Promise<string> {
  const copyRadio = wizard.getByRole('radio', { name: /copy an existing role/i });
  await expect(copyRadio).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
  await copyRadio.click();

  const grid = wizard.getByRole('grid', { name: /roles/i });
  await expect(grid).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });

  const firstRoleRadio = grid.getByRole('radio').first();
  await firstRoleRadio.click();

  // Navigate from the radio up to its containing row, then read the role name
  // from the second gridcell (index 0 = radio cell, index 1 = name cell).
  const selectedRow = firstRoleRadio.locator('xpath=ancestor::tr[1]');
  const roleName = await selectedRow.getByRole('gridcell').nth(1).textContent();

  const nextButton = getWizardNextButton(wizard);
  await expect(nextButton).toBeEnabled({ timeout: E2E_TIMEOUTS.TABLE_DATA });
  await nextButton.click();

  return roleName?.trim() ?? '';
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

  // Wait for async validation (name uniqueness check)
  const nextButton = getWizardNextButton(wizard);
  await expect(nextButton).toBeEnabled({ timeout: E2E_TIMEOUTS.TABLE_DATA });
  await nextButton.click();
}

/**
 * STEP: Handle permissions
 * For "create from scratch": selects "advisor" permissions (safe — no workspace step)
 * For "copy existing": permissions are inherited, just click Next
 */
async function handlePermissions(wizard: Locator, selectPermissions: boolean): Promise<void> {
  // Wait for permission checkboxes to appear
  const permissionCheckboxes = wizard.getByRole('checkbox');
  await expect(permissionCheckboxes.first()).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });

  if (selectPermissions) {
    // Select the first two "advisor" rows — these never trigger the workspace step
    const advisorRows = wizard.getByRole('row').filter({ hasText: 'advisor' });
    const count = await advisorRows.count();
    for (let i = 0; i < Math.min(count, 2); i++) {
      const checkbox = advisorRows.nth(i).getByRole('checkbox');
      await checkbox.click();
      await expect(checkbox).toBeChecked({ timeout: E2E_TIMEOUTS.MENU_ANIMATION });
    }
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

  // Submit
  const submitButton = wizard.getByRole('button', { name: /submit/i });
  await expect(submitButton).toBeEnabled({ timeout: E2E_TIMEOUTS.TABLE_DATA });
  await submitButton.click();

  // Wait for success screen
  await expect(wizard.getByText(/successfully created/i)).toBeVisible({
    timeout: E2E_TIMEOUTS.MUTATION_COMPLETE,
  });

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
    return;
  }

  // Type the seeded name into the first dropdown's filter to find it, select it, then "Copy to all"
  const firstFilter = wizard.getByRole('combobox', { name: /type to filter/i }).first();
  await firstFilter.click();
  await firstFilter.fill(seededWorkspaceName);

  const workspaceOption = wizard.page().getByRole('menuitem', { name: new RegExp(seededWorkspaceName, 'i') });
  await expect(workspaceOption).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
  await workspaceOption.click();

  // Copy the selection to all other permission rows
  const copyToAll = wizard.getByRole('button', { name: /copy to all/i });
  if (await copyToAll.isVisible({ timeout: E2E_TIMEOUTS.MENU_ANIMATION }).catch(() => false)) {
    await copyToAll.click();
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
export async function fillCreateRoleWizard(page: Page, roleName: string, description: string, seededWorkspaceName?: string): Promise<void> {
  const wizard = page.getByRole('dialog').first();
  await expect(wizard).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });

  await fillNameAndDescription(wizard, roleName, description);
  await handlePermissions(wizard, true); // true = select permissions
  if (seededWorkspaceName) {
    await defineWorkspacesAccess(wizard, seededWorkspaceName);
  }
  await reviewAndSubmit(wizard, roleName);
}

/**
 * Create role by copying an existing role.
 *
 * Flow:
 * 1. Select source role to copy (by name, or first in table if omitted)
 * 2. Name and description
 * 3. Permissions (inherited, just advance)
 * 4. Define Workspaces access (conditional - only if source role has inventory permissions)
 * 5. Review and submit
 *
 * Returns the source role name that was actually selected — useful when
 * `sourceRoleName` is omitted and the first role is picked automatically.
 */
export async function fillCreateRoleWizardAsCopy(
  page: Page,
  newRoleName: string,
  sourceRoleName?: string,
  seededWorkspaceName?: string,
  description?: string,
): Promise<{ sourceRoleName: string }> {
  await page.waitForURL(/add-role/, { timeout: E2E_TIMEOUTS.TABLE_DATA });

  const wizard = page.getByRole('dialog').first();
  await expect(wizard).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });

  let selectedSource: string;
  if (sourceRoleName) {
    await selectSourceRole(wizard, sourceRoleName);
    selectedSource = sourceRoleName;
  } else {
    selectedSource = await selectFirstSourceRole(wizard);
  }

  await fillNameAndDescription(wizard, newRoleName, description || '');
  await handlePermissions(wizard, false);
  if (seededWorkspaceName) {
    await defineWorkspacesAccess(wizard, seededWorkspaceName);
  }
  await reviewAndSubmit(wizard, newRoleName);

  return { sourceRoleName: selectedSource };
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
