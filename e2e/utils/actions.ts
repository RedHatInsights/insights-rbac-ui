/**
 * Action helpers for Playwright E2E tests
 * Ported from src/user-journeys/_shared/helpers/navigationHelpers.ts
 */

import { Page, expect } from '@playwright/test';
import { waitForTreeExpand } from './waiters';

/**
 * Opens a row's kebab menu (actions dropdown) by the row's name
 */
export async function openRowActionsMenu(page: Page, rowName: string) {
  const kebabButton = page.getByRole('button', { name: `${rowName} actions` });
  await kebabButton.click();

  // Wait for menu to appear
  await expect(page.getByRole('menuitem').first()).toBeVisible();
}

/**
 * Opens a role's kebab menu (actions dropdown) - roles have a different aria-label pattern
 */
export async function openRoleActionsMenu(page: Page, roleName: string) {
  const kebabButton = page.getByRole('button', { name: `Actions for role ${roleName}` });
  await kebabButton.click();

  // Wait for menu to appear
  await expect(page.getByRole('menuitem').first()).toBeVisible();
}

/**
 * Opens the detail page Actions dropdown (in the page header)
 * This is typically a kebab menu (three dots) for groups or an "Actions" button for other pages
 */
export async function openDetailPageActionsMenu(page: Page) {
  // Try to find an Actions button first (for pages that have one)
  // Use exact match to avoid matching "Actions overflow menu" responsive button
  let actionsButton = page.getByRole('button', { name: 'Actions', exact: true });

  if (!(await actionsButton.isVisible().catch(() => false))) {
    // If no Actions button, look for kebab menu by ID (for group detail pages)
    actionsButton = page.locator('#group-actions-dropdown');
  }

  if (!(await actionsButton.isVisible().catch(() => false))) {
    // If still not found, try to find any kebab toggle button using OUIA ID
    actionsButton = page.locator('[data-ouia-component-id="group-title-actions-dropdown"] button');
  }

  if (!(await actionsButton.isVisible().catch(() => false))) {
    // Last resort: find any kebab toggle button
    actionsButton = page.locator('.pf-v6-c-dropdown__toggle.pf-m-plain');
  }

  await actionsButton.click();

  // Wait for menu to appear
  await expect(page.getByRole('menuitem').first()).toBeVisible();
}

/**
 * Clicks a menu item from an open dropdown menu
 */
export async function clickMenuItem(page: Page, menuItemText: string) {
  await page.getByText(menuItemText).click();
}

/**
 * Expands a workspace row in the hierarchical table if it's collapsed
 */
export async function expandWorkspaceRow(page: Page, workspaceName: string) {
  const workspaceRow = page.getByText(workspaceName).locator('xpath=ancestor::tr');
  const toggleButton = workspaceRow.locator('.pf-v6-c-table__toggle button');

  const isExpanded = await toggleButton.getAttribute('aria-expanded');
  if (isExpanded === 'false') {
    await toggleButton.click();
    await waitForTreeExpand(page);
  }
}
