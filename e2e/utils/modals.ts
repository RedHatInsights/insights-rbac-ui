/**
 * Modal helpers for Playwright E2E tests
 * Ported from src/user-journeys/_shared/helpers/navigationHelpers.ts and workspaceHelpers.ts
 */

import { Page, expect } from '@playwright/test';

/**
 * Confirms a deletion in a modal by clicking the Remove/Delete button
 */
export async function confirmDeleteModal(page: Page, buttonText: string = 'Remove') {
  // Wait for confirmation modal to appear
  const modal = page.getByRole('dialog');
  await expect(modal).toBeVisible();

  // Click confirmation button (Remove, Activate, Deactivate, etc.)
  const confirmButton = modal.getByRole('button', { name: new RegExp(buttonText, 'i') });
  await confirmButton.click();

  // Wait for modal to close
  await expect(modal).not.toBeVisible();
}

/**
 * Opens a modal and returns the dialog locator
 * Verifies the modal has the expected heading
 */
export async function findModal(page: Page, expectedHeading: string | RegExp) {
  const modal = page.getByRole('dialog');
  await expect(modal).toBeVisible();

  // Verify the modal has the expected heading
  if (typeof expectedHeading === 'string') {
    await expect(modal.getByText(expectedHeading)).toBeVisible();
  } else {
    await expect(modal.getByText(expectedHeading)).toBeVisible();
  }

  return modal;
}

/**
 * Confirms a delete operation by checking the confirmation checkbox and clicking Delete
 */
export async function confirmDelete(page: Page) {
  const modal = await findModal(page, /delete workspace/i);

  // Find and check the confirmation checkbox
  const checkbox = modal.getByRole('checkbox', { name: /understand.*irreversible/i });
  await checkbox.click();

  // Click Delete button
  const deleteButton = modal.getByRole('button', { name: /delete/i });
  await expect(deleteButton).toBeEnabled();
  await deleteButton.click();

  // Wait for modal to close
  await expect(modal).not.toBeVisible();
}
