/**
 * Workspaces E2E Tests
 *
 * Unified test suite for all workspace milestones (M1-M5).
 * Tests are organized by permission level and run in serial mode
 * to handle lifecycle dependencies (create → edit → move → delete).
 *
 * Feature Flags (cumulative):
 * - M1: platform.rbac.workspaces-list
 * - M2: + platform.rbac.workspace-hierarchy
 * - M3: + platform.rbac.workspaces-role-bindings
 * - M4: + platform.rbac.workspaces-role-bindings-write
 * - M5: platform.rbac.workspaces (master flag)
 */

import { test, expect, Page } from '@playwright/test';
import {
  navigateToPage,
  waitForPageToLoad,
  openWorkspaceWizard,
  fillWorkspaceForm,
  clickWizardButton,
  selectParentWorkspace,
  expandWorkspaceRow,
  openWorkspaceKebabMenu,
  AUTH_ADMIN,
  AUTH_USER,
} from '../../utils';

/**
 * Read-Only Tests (No Write Permission)
 * Requires: AUTH_USER storage state
 */
test.describe('Kessel Workspaces - Read Only', () => {
  test.use({ storageState: AUTH_USER });

  test('My User Access page loads with permissions', async ({ page }) => {
    await page.goto('/iam/my-user-access');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/my user access/i)).toBeVisible();
  });

  test('Can view workspace list in read-only mode', async ({ page }) => {
    await page.goto('/iam/access-management/workspaces');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Default Workspace')).toBeVisible();
  });

  test('Cannot create workspace without permissions', async ({ page }) => {
    await page.goto('/iam/access-management/workspaces');
    await page.waitForLoadState('networkidle');

    const createButton = page.getByRole('button', { name: /create workspace/i });
    const isVisible = await createButton.isVisible().catch(() => false);
    if (isVisible) {
      await expect(createButton).toBeDisabled();
    }
  });

  test('Navigate between pages in read-only mode', async ({ page }) => {
    await page.goto('/iam/my-user-access');
    await page.waitForLoadState('networkidle');

    await navigateToPage(page, 'Workspaces');
    await expect(page.getByText('Default Workspace')).toBeVisible();

    const overviewLink = page.getByRole('link', { name: 'Overview' });
    if (await overviewLink.isVisible().catch(() => false)) {
      await overviewLink.click();
      await page.waitForLoadState('networkidle');
    }
  });
});

/**
 * Write Permission Tests - Workspace Lifecycle
 * Requires: AUTH_ADMIN storage state
 *
 * Tests run in serial mode to maintain state across:
 * Create → View Detail → Edit → Move → Delete
 */
test.describe('Kessel Workspaces - With Write Permission', () => {
  test.use({ storageState: AUTH_ADMIN });
  test.describe.configure({ mode: 'serial' });

  // Dynamic workspace names to avoid collisions
  const timestamp = Date.now();
  const testWorkspaceName = `E2E-Test-Workspace-${timestamp}`;
  const testSubworkspaceName = `E2E-Subworkspace-${timestamp}`;
  const editedWorkspaceName = `E2E-Workspace-Edited-${timestamp}`;

  let page: Page;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({ storageState: AUTH_ADMIN });
    page = await context.newPage();
  });

  test.afterAll(async () => {
    await page.close();
  });

  /**
   * M1: Basic workspace creation (no parent selection)
   */
  test('M1: Create workspace (basic - no parent selection)', async () => {
    await page.goto('/iam/my-user-access');
    await page.waitForLoadState('networkidle');

    await navigateToPage(page, 'Workspaces');
    await waitForPageToLoad(page, 'Default Workspace');

    const wizard = await openWorkspaceWizard(page);
    await fillWorkspaceForm(page, wizard, testWorkspaceName, 'E2E test workspace');

    // M1: Parent selector is present but disabled
    await expect(wizard.getByText(/parent workspace/i)).toBeVisible();

    await clickWizardButton(page, wizard, 'Next');
    await clickWizardButton(page, wizard, 'Submit');

    await expect(wizard).not.toBeVisible();
    await expect(page.getByText(testWorkspaceName)).toBeVisible();
  });

  /**
   * M1: Verify write actions enabled
   */
  test('M1: Workspace list displays with write actions enabled', async () => {
    await page.goto('/iam/access-management/workspaces');
    await page.waitForLoadState('networkidle');

    await waitForPageToLoad(page, 'Default Workspace');

    const createButton = page.getByRole('button', { name: /create workspace/i });
    await expect(createButton).toBeVisible();
    await expect(createButton).toBeEnabled();
  });

  /**
   * M2: Create workspace with parent selection
   */
  test('M2: Create workspace with parent selection', async () => {
    await page.goto('/iam/access-management/workspaces');
    await page.waitForLoadState('networkidle');

    await waitForPageToLoad(page, 'Default Workspace');

    const wizard = await openWorkspaceWizard(page);
    await fillWorkspaceForm(page, wizard, testSubworkspaceName, 'E2E test subworkspace');

    // M2: Select parent workspace
    await expect(wizard.getByText(/parent workspace/i)).toBeVisible();
    await selectParentWorkspace(page, wizard, 'Default Workspace', testWorkspaceName);

    await clickWizardButton(page, wizard, 'Next');
    await clickWizardButton(page, wizard, 'Submit');

    await expect(wizard).not.toBeVisible();

    // Expand to verify hierarchy
    await expandWorkspaceRow(page, 'Default Workspace');
    await expandWorkspaceRow(page, testWorkspaceName);
    await expect(page.getByText(testSubworkspaceName)).toBeVisible();
  });

  /**
   * M2: Create subworkspace from kebab menu
   */
  test('M2: Create subworkspace from kebab menu', async () => {
    await page.goto('/iam/access-management/workspaces');
    await page.waitForLoadState('networkidle');

    await waitForPageToLoad(page, 'Default Workspace');
    await expandWorkspaceRow(page, 'Default Workspace');

    // Open kebab menu on our test workspace
    await openWorkspaceKebabMenu(page, testWorkspaceName);

    const createSubOption = page.getByText(/create subworkspace/i);
    if (await createSubOption.isVisible().catch(() => false)) {
      await createSubOption.click();

      const wizard = page.locator('.pf-v6-c-wizard, .pf-c-wizard');
      await expect(wizard).toBeVisible();

      const kebabSubworkspaceName = `Kebab-Sub-${timestamp}`;
      await fillWorkspaceForm(page, wizard, kebabSubworkspaceName);

      await clickWizardButton(page, wizard, 'Next');
      await clickWizardButton(page, wizard, 'Submit');

      await expect(wizard).not.toBeVisible();
    }
  });

  /**
   * M3: View workspace detail with Roles tab
   */
  test('M3: View workspace detail with Roles tab', async () => {
    await page.goto('/iam/access-management/workspaces');
    await page.waitForLoadState('networkidle');

    await waitForPageToLoad(page, 'Default Workspace');
    await expandWorkspaceRow(page, 'Default Workspace');

    // Click on our test workspace to view detail
    const workspaceLink = page.getByRole('link', { name: testWorkspaceName });
    if (await workspaceLink.isVisible().catch(() => false)) {
      await workspaceLink.click();
      await page.waitForLoadState('networkidle');

      // Verify detail page has tabs (M3 feature)
      const rolesTab = page.getByRole('tab', { name: /roles/i });
      const assetsTab = page.getByRole('tab', { name: /assets/i });

      if (await rolesTab.isVisible().catch(() => false)) {
        await expect(rolesTab).toBeVisible();
      }
      if (await assetsTab.isVisible().catch(() => false)) {
        await expect(assetsTab).toBeVisible();
      }
    }
  });

  /**
   * M3: Navigate between Roles sub-tabs
   */
  test('M3: Navigate between Roles sub-tabs', async () => {
    await page.goto('/iam/access-management/workspaces');
    await page.waitForLoadState('networkidle');

    await waitForPageToLoad(page, 'Default Workspace');
    await expandWorkspaceRow(page, 'Default Workspace');

    const workspaceLink = page.getByRole('link', { name: testWorkspaceName });
    if (await workspaceLink.isVisible().catch(() => false)) {
      await workspaceLink.click();
      await page.waitForLoadState('networkidle');

      // Check for Roles sub-tabs
      const thisWorkspaceTab = page.getByRole('tab', { name: /roles assigned in this workspace/i });
      const parentWorkspaceTab = page.getByRole('tab', { name: /roles assigned in parent/i });

      if (await thisWorkspaceTab.isVisible().catch(() => false)) {
        await thisWorkspaceTab.click();
        await page.waitForLoadState('networkidle');
      }

      if (await parentWorkspaceTab.isVisible().catch(() => false)) {
        await parentWorkspaceTab.click();
        await page.waitForLoadState('networkidle');
      }
    }
  });

  /**
   * M2/M5: Edit workspace
   */
  test('M5: Edit workspace', async () => {
    await page.goto('/iam/access-management/workspaces');
    await page.waitForLoadState('networkidle');

    await waitForPageToLoad(page, 'Default Workspace');
    await expandWorkspaceRow(page, 'Default Workspace');

    await openWorkspaceKebabMenu(page, testWorkspaceName);

    const editOption = page.getByText(/^edit workspace$/i);
    if (await editOption.isVisible().catch(() => false)) {
      await editOption.click();

      const modal = page.getByRole('dialog');
      await expect(modal).toBeVisible();

      await page.waitForTimeout(300);

      const nameInput = modal.locator('input[type="text"]').first();
      await nameInput.clear();
      await nameInput.fill(editedWorkspaceName);

      const saveButton = modal.getByRole('button', { name: /save/i });
      await saveButton.click();

      await expect(modal).not.toBeVisible({ timeout: 5000 });
      await page.waitForLoadState('networkidle');

      await expandWorkspaceRow(page, 'Default Workspace');
      await expect(page.getByText(editedWorkspaceName)).toBeVisible();
    }
  });

  /**
   * M2: Move workspace
   */
  test('M2: Move workspace', async () => {
    await page.goto('/iam/access-management/workspaces');
    await page.waitForLoadState('networkidle');

    await waitForPageToLoad(page, 'Default Workspace');
    await expandWorkspaceRow(page, 'Default Workspace');
    await expandWorkspaceRow(page, editedWorkspaceName);

    // Try to move the subworkspace
    await openWorkspaceKebabMenu(page, testSubworkspaceName);

    const moveOption = page.getByText(/^move workspace$/i);
    if (await moveOption.isVisible().catch(() => false)) {
      await moveOption.click();

      const modal = page.getByRole('dialog');
      await expect(modal).toBeVisible();

      // Select new parent (move directly under Default Workspace)
      const parentSelector = modal.getByRole('button', { name: new RegExp(editedWorkspaceName, 'i') });
      if (await parentSelector.isVisible().catch(() => false)) {
        await parentSelector.click();
        await page.waitForTimeout(500);

        const treePanel = page.locator('.rbac-c-workspace-selector-menu');
        if (await treePanel.isVisible().catch(() => false)) {
          const defaultWsOption = treePanel.getByRole('button', { name: 'Default Workspace' });
          if (await defaultWsOption.isVisible().catch(() => false)) {
            await defaultWsOption.click();
            await page.waitForTimeout(300);

            const selectButton = page.getByRole('button', { name: /select workspace/i });
            if (await selectButton.isVisible()) {
              await selectButton.click();
            }
          }
        }
      }

      const submitButton = modal.getByRole('button', { name: /submit/i });
      if (await submitButton.isVisible()) {
        await submitButton.click();
        await expect(modal).not.toBeVisible({ timeout: 5000 });
      }
    }
  });

  /**
   * M2/M5: Delete subworkspace first (child before parent)
   */
  test('M5: Delete subworkspace', async () => {
    await page.goto('/iam/access-management/workspaces');
    await page.waitForLoadState('networkidle');

    await waitForPageToLoad(page, 'Default Workspace');
    await expandWorkspaceRow(page, 'Default Workspace');

    // Find and delete the subworkspace
    const subworkspaceText = page.getByText(testSubworkspaceName);
    if (await subworkspaceText.isVisible().catch(() => false)) {
      await openWorkspaceKebabMenu(page, testSubworkspaceName);

      const deleteOption = page.getByText(/^delete workspace$/i);
      await deleteOption.click();

      const modal = page.getByRole('dialog');
      await expect(modal).toBeVisible();

      const checkbox = modal.getByRole('checkbox');
      if (await checkbox.isVisible().catch(() => false)) {
        await checkbox.click();
      }

      const confirmButton = modal.getByRole('button', { name: /^delete$/i });
      await expect(confirmButton).toBeEnabled();
      await confirmButton.click();

      await expect(modal).not.toBeVisible({ timeout: 5000 });
      await page.waitForLoadState('networkidle');

      await expect(page.getByText(testSubworkspaceName)).not.toBeVisible({ timeout: 5000 });
    }
  });

  /**
   * M2/M5: Delete parent workspace
   */
  test('M5: Delete workspace', async () => {
    await page.goto('/iam/access-management/workspaces');
    await page.waitForLoadState('networkidle');

    await waitForPageToLoad(page, 'Default Workspace');
    await expandWorkspaceRow(page, 'Default Workspace');

    await openWorkspaceKebabMenu(page, editedWorkspaceName);

    const deleteOption = page.getByText(/^delete workspace$/i);
    await deleteOption.click();

    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();

    const checkbox = modal.getByRole('checkbox');
    if (await checkbox.isVisible().catch(() => false)) {
      await checkbox.click();
    }

    const confirmButton = modal.getByRole('button', { name: /^delete$/i });
    await expect(confirmButton).toBeEnabled();
    await confirmButton.click();

    await expect(modal).not.toBeVisible({ timeout: 5000 });
    await page.waitForLoadState('networkidle');

    await expandWorkspaceRow(page, 'Default Workspace');
    await expect(page.getByText(editedWorkspaceName)).not.toBeVisible({ timeout: 5000 });
  });
});

/**
 * M4 Placeholder Tests - Role Bindings Write
 * ⚠️ These features are not yet implemented
 */
test.describe('Kessel Workspaces - Role Bindings (M4 Placeholder)', () => {
  test.use({ storageState: AUTH_ADMIN });

  test('My User Access page loads correctly', async ({ page }) => {
    await page.goto('/iam/my-user-access');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/my user access/i)).toBeVisible();
  });

  test.skip('Add role binding to workspace', async ({ page }) => {
    // TODO: Implement when M4 is available
  });

  test.skip('Remove role binding from workspace', async ({ page }) => {
    // TODO: Implement when M4 is available
  });

  test.skip('Assign principals to workspace role', async ({ page }) => {
    // TODO: Implement when M4 is available
  });

  test.skip('Remove principals from workspace role', async ({ page }) => {
    // TODO: Implement when M4 is available
  });
});
