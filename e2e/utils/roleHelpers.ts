/**
 * Shared Role E2E Helpers
 *
 * These helpers are shared between V1 and V2 role tests since they use
 * the same AddRoleWizard component.
 */

import { Page, expect } from '@playwright/test';
import { waitForNextEnabled, waitForTableUpdate } from './waiters';

/**
 * Fills the Create Role wizard and submits.
 * Works for both V1 and V2 since they use the same AddRoleWizard component.
 *
 * Wizard Steps:
 * 1. Choose type (Create from scratch vs Copy existing)
 * 2. Enter role name AND description
 * 3. Add permissions (select multiple)
 * 4. Review
 * 5. Submit & verify success
 *
 * Note: PF6 wraps wizards in a modal, creating 2 dialog elements.
 * We use .first() to target the wizard specifically.
 */
export async function fillCreateRoleWizard(page: Page, roleName: string, description: string): Promise<void> {
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
    timeout: 10000,
  });
}

/**
 * Verifies a role row does NOT exist in the table grid.
 */
export async function verifyRoleNotInTable(page: Page, roleName: string): Promise<void> {
  const grid = page.getByRole('grid');
  await expect(grid.getByRole('row', { name: new RegExp(roleName, 'i') })).not.toBeVisible({
    timeout: 10000,
  });
}
