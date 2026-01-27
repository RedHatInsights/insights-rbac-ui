/**
 * Workspace helpers for Playwright E2E tests
 * Ported from src/user-journeys/_shared/helpers/workspaceHelpers.ts
 */

import { Page, expect } from '@playwright/test';

/**
 * Opens the Create Workspace wizard from a button and returns the wizard locator
 */
export async function openWorkspaceWizard(page: Page) {
  // Click "Create workspace" button to open the wizard
  const createButton = page.getByRole('button', { name: /create workspace/i });
  await expect(createButton).toBeVisible();
  await createButton.click();

  // Wait for wizard to appear
  await expect(page.getByText(/create new workspace/i)).toBeVisible();

  // Return the wizard container locator
  return page.locator('.pf-v6-c-wizard, .pf-c-wizard');
}

/**
 * Fills the workspace wizard form fields (name and optionally description)
 */
export async function fillWorkspaceForm(page: Page, wizard: ReturnType<typeof page.locator>, name: string, description?: string) {
  // Use semantic selector for name input
  const nameInput = wizard.getByRole('textbox', { name: /workspace name/i });
  await expect(nameInput).toBeVisible();
  await nameInput.clear();
  await nameInput.fill(name);

  if (description) {
    const descriptionInput = wizard.getByRole('textbox', { name: /workspace description/i });
    await expect(descriptionInput).toBeVisible();
    await descriptionInput.clear();
    await descriptionInput.fill(description);
  }
}

/**
 * Opens the parent workspace selector tree panel
 */
export async function openParentWorkspaceSelector(page: Page, wizard: ReturnType<typeof page.locator>) {
  // Click the parent selector button
  const parentSelector = wizard.getByRole('button', { name: /select workspaces/i });
  await parentSelector.click();

  // Wait for the tree view panel to open
  const treePanel = page.locator('.rbac-c-workspace-selector-menu');
  await expect(treePanel).toBeVisible();

  return treePanel;
}

/**
 * Expands a workspace node in the tree view
 */
export async function expandWorkspaceInTree(page: Page, treePanel: ReturnType<typeof page.locator>, workspaceName: string) {
  // Find the workspace node by name
  const workspaceNode = treePanel.getByText(workspaceName).locator('xpath=ancestor::li');

  // Find and click the toggle button
  const toggleButton = workspaceNode.locator('.pf-v6-c-tree-view__node-toggle');
  await toggleButton.click();
  await page.waitForTimeout(300);
}

/**
 * Selects a workspace from the tree and confirms the selection
 */
export async function selectWorkspaceFromTree(page: Page, treePanel: ReturnType<typeof page.locator>, workspaceName: string) {
  // Find and click the workspace button
  const workspaceButton = treePanel.getByRole('button', { name: workspaceName });
  await workspaceButton.click();
  await page.waitForTimeout(300);

  // Click the "Select Workspace" button to confirm
  const selectButton = page.getByRole('button', { name: /select workspace/i });
  await selectButton.click();
  await page.waitForTimeout(500);
}

/**
 * Complete combo: Expand a parent workspace in tree and select a child
 */
export async function selectParentWorkspace(page: Page, wizard: ReturnType<typeof page.locator>, parentToExpand: string, workspaceToSelect: string) {
  const treePanel = await openParentWorkspaceSelector(page, wizard);
  await expandWorkspaceInTree(page, treePanel, parentToExpand);
  await selectWorkspaceFromTree(page, treePanel, workspaceToSelect);
}

/**
 * Navigates wizard steps (Next, Back, Submit, Cancel)
 */
export async function clickWizardButton(page: Page, wizard: ReturnType<typeof page.locator>, buttonName: 'Next' | 'Back' | 'Submit' | 'Cancel') {
  const button = wizard.getByRole('button', { name: new RegExp(`^${buttonName}$`, 'i') });
  await expect(button).toBeEnabled();
  await button.click();
  await page.waitForTimeout(500);
}

/**
 * Opens a workspace's kebab menu from the table
 */
export async function openWorkspaceKebabMenu(page: Page, workspaceName: string) {
  // Find the workspace row
  const workspaceRow = page.getByText(workspaceName).locator('xpath=ancestor::tr');

  // Find and click the kebab menu button
  const kebabButton = workspaceRow.getByLabel(/kebab toggle|actions/i);
  await kebabButton.click();
  await page.waitForTimeout(300);
}
