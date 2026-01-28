/**
 * Explicit Waiters for E2E Tests
 *
 * These utilities replace arbitrary waitForTimeout calls with condition-based waiting.
 * Prefer these over waitForTimeout for more reliable and faster tests.
 */

import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

// ============================================================================
// Form Validation Waiters
// ============================================================================

/**
 * Wait for async form validation to complete (e.g., name uniqueness check).
 * Looks for validation state changes rather than using arbitrary timeouts.
 *
 * @example
 * await waitForValidation(page, nameInput);
 * // or with explicit success indicator
 * await waitForValidation(page, nameInput, { successIndicator: nextButton });
 */
export async function waitForValidation(
  page: Page,
  input: Locator,
  options: {
    /** Element that becomes enabled when validation passes */
    successIndicator?: Locator;
    /** Maximum time to wait (default 5000ms) */
    timeout?: number;
  } = {},
): Promise<void> {
  const { successIndicator, timeout = 5000 } = options;

  if (successIndicator) {
    // Wait for the success indicator to be enabled
    await expect(successIndicator).toBeEnabled({ timeout });
  } else {
    // Wait for any validation spinner/loading to disappear
    const validationSpinner = page.locator('[data-testid="validation-spinner"], .pf-v6-c-spinner');
    try {
      await validationSpinner.waitFor({ state: 'hidden', timeout: 500 });
    } catch {
      // No spinner found, that's fine
    }

    // Wait for error message to either appear or not
    await page.waitForTimeout(100); // Small buffer for state to settle

    // Check for aria-invalid state change
    const isInvalid = await input.getAttribute('aria-invalid');
    if (isInvalid === 'true') {
      // Validation failed, but that's a valid end state
      return;
    }
  }
}

// ============================================================================
// Table/Grid Waiters
// ============================================================================

/**
 * Wait for table data to update after a filter is applied.
 * More reliable than waitForTimeout after filling a search input.
 *
 * @example
 * await searchInput.fill('test');
 * await waitForTableUpdate(page);
 */
export async function waitForTableUpdate(page: Page, options: { timeout?: number } = {}): Promise<void> {
  const { timeout = 5000 } = options;

  // Wait for any loading indicators to disappear
  const loadingIndicators = page.locator('.pf-v6-c-spinner, [data-loading="true"], .pf-m-loading');

  try {
    // First check if any loading indicator appears
    await loadingIndicators.first().waitFor({ state: 'visible', timeout: 500 });
    // Then wait for it to disappear
    await loadingIndicators.first().waitFor({ state: 'hidden', timeout });
  } catch {
    // No loading indicator appeared, table might update instantly
    // Give a small buffer for React to re-render
    await page.waitForTimeout(100);
  }
}

/**
 * Wait for a row to disappear from the table (after delete/filter).
 *
 * @example
 * await waitForRowToDisappear(page, 'my-role-name');
 */
export async function waitForRowToDisappear(page: Page, rowText: string, options: { timeout?: number } = {}): Promise<void> {
  const { timeout = 10000 } = options;
  const grid = page.getByRole('grid');
  await expect(grid.getByText(rowText)).not.toBeVisible({ timeout });
}

// ============================================================================
// Modal/Dialog Waiters
// ============================================================================

/**
 * Wait for modal content to fully load.
 * Replaces waitForTimeout after opening a modal.
 *
 * @example
 * await kebabButton.click();
 * await waitForModalReady(page);
 */
export async function waitForModalReady(page: Page, options: { timeout?: number } = {}): Promise<void> {
  const { timeout = 5000 } = options;

  const modal = page.locator('[role="dialog"]');
  await modal.waitFor({ state: 'visible', timeout });

  // Wait for any spinners inside modal to disappear
  const modalSpinner = modal.locator('.pf-v6-c-spinner');
  try {
    await modalSpinner.waitFor({ state: 'hidden', timeout: 500 });
  } catch {
    // No spinner in modal
  }
}

// ============================================================================
// Wizard Waiters
// ============================================================================

/**
 * Wait for wizard step transition to complete.
 * Replaces waitForTimeout between wizard steps.
 *
 * @example
 * await nextButton.click();
 * await waitForWizardStep(page, 'Permissions'); // Wait for step title
 */
export async function waitForWizardStep(page: Page, stepIdentifier: string | RegExp, options: { timeout?: number } = {}): Promise<void> {
  const { timeout = 5000 } = options;

  // Wait for step content to appear
  const stepContent = page.getByText(stepIdentifier);
  await stepContent.waitFor({ state: 'visible', timeout });
}

/**
 * Wait for Next/Submit button to become enabled (after validation).
 * Uses exact match to avoid matching pagination "Go to next page" buttons.
 *
 * @example
 * await nameInput.fill('My Role');
 * await waitForNextEnabled(page);
 * await nextButton.click();
 */
export async function waitForNextEnabled(page: Page, options: { timeout?: number } = {}): Promise<void> {
  const { timeout = 10000 } = options;

  // Use exact match to avoid matching pagination buttons ("Go to next page")
  const nextButton = page.getByRole('button', { name: 'Next', exact: true });
  await expect(nextButton).toBeEnabled({ timeout });
}

// ============================================================================
// Tab Waiters
// ============================================================================

/**
 * Wait for tab content to load after switching tabs.
 * Handles both PatternFly tabpanel and custom tab implementations.
 *
 * @example
 * await rolesTab.click();
 * await waitForTabContent(page);
 */
export async function waitForTabContent(page: Page, options: { timeout?: number } = {}): Promise<void> {
  const { timeout = 5000 } = options;

  // Wait for any loading spinners to disappear (page-wide)
  const spinner = page.locator('.pf-v6-c-spinner, .pf-c-spinner');
  try {
    // Check if spinner exists first
    if ((await spinner.count()) > 0) {
      await spinner.first().waitFor({ state: 'hidden', timeout });
    }
  } catch {
    // No spinner or already hidden
  }

  // Also wait for any skeleton loaders
  const skeleton = page.locator('.pf-v6-c-skeleton, .pf-c-skeleton');
  try {
    if ((await skeleton.count()) > 0) {
      await skeleton.first().waitFor({ state: 'hidden', timeout });
    }
  } catch {
    // No skeleton or already hidden
  }

  // Small buffer for React to settle
  await page.waitForTimeout(100);
}

// ============================================================================
// Dropdown/Menu Waiters
// ============================================================================

/**
 * Wait for dropdown menu to open after clicking toggle.
 *
 * @example
 * await kebabButton.click();
 * await waitForMenuOpen(page);
 */
export async function waitForMenuOpen(page: Page, options: { timeout?: number } = {}): Promise<void> {
  const { timeout = 3000 } = options;

  const menu = page.locator('[role="menu"], .pf-v6-c-menu');
  await menu.waitFor({ state: 'visible', timeout });
}

// ============================================================================
// Tree View Waiters
// ============================================================================

/**
 * Wait for tree node expansion animation to complete.
 *
 * @example
 * await toggleButton.click();
 * await waitForTreeExpand(page);
 */
export async function waitForTreeExpand(page: Page, options: { timeout?: number } = {}): Promise<void> {
  const { timeout = 1000 } = options;

  // PatternFly tree uses CSS transitions, wait for animation
  // The expanded state is indicated by aria-expanded="true"
  await page.waitForTimeout(Math.min(timeout, 300)); // Animation is typically ~200-300ms
}
