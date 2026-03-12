/**
 * Page Object for the V2 Workspaces Page
 *
 * URL: /iam/access-management/workspaces
 */

import { type Locator, type Page, expect } from '@playwright/test';
import { iamUrl, setupPage, v2, waitForTableUpdate } from '../../utils';
import { ManagedWorkspaceSelectorComponent } from '../components/ManagedWorkspaceSelectorComponent';
import { E2E_TIMEOUTS } from '../../utils/timeouts';

const WORKSPACES_URL = iamUrl(v2.accessManagementWorkspaces.link());

export class WorkspacesPage {
  readonly page: Page;
  readonly workspaceSelector: ManagedWorkspaceSelectorComponent;

  constructor(page: Page) {
    this.page = page;
    this.workspaceSelector = new ManagedWorkspaceSelectorComponent(page);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Navigation
  // ═══════════════════════════════════════════════════════════════════════════

  async goto(): Promise<void> {
    await setupPage(this.page);
    await expect(async () => {
      await this.page.goto(WORKSPACES_URL, { timeout: E2E_TIMEOUTS.SLOW_DATA });
      await expect(this.heading).toBeVisible({ timeout: E2E_TIMEOUTS.DETAIL_CONTENT });
    }).toPass({ timeout: E2E_TIMEOUTS.SETUP_PAGE_LOAD, intervals: [1_000, 2_000, 5_000] });
    await expect(this.page.getByText('Root Workspace', { exact: true })).toBeVisible({ timeout: E2E_TIMEOUTS.SLOW_DATA });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Locators
  // ═══════════════════════════════════════════════════════════════════════════

  get heading(): Locator {
    return this.page.getByRole('heading', { name: /workspaces/i, level: 1 });
  }

  get table(): Locator {
    // Workspaces uses a tree table with DataViewTable
    return this.page.locator('[data-ouia-component-id="workspaces-list"]').or(this.page.getByRole('treegrid')).or(this.page.getByRole('grid'));
  }

  get searchInput(): Locator {
    return this.page.getByPlaceholder(/filter|search/i);
  }

  get createButton(): Locator {
    return this.page.getByRole('button', { name: /create workspace/i });
  }

  get unauthorizedMessage(): Locator {
    return this.page.getByText(/You do not have access to/i);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Table Actions
  // ═══════════════════════════════════════════════════════════════════════════

  async searchFor(name: string): Promise<void> {
    await this.searchInput.fill(name);
    await waitForTableUpdate(this.page, { timeout: E2E_TIMEOUTS.SLOW_DATA });
  }

  getWorkspaceLink(name: string): Locator {
    return this.table.getByRole('link', { name });
  }

  /**
   * Expand the known workspace hierarchy: Root Workspace → Default Workspace.
   * Test/seeded workspaces are always created under Default Workspace, so we
   * only expand these two nodes instead of blindly expanding every level.
   */
  async expandTreeNodes(): Promise<void> {
    for (const rowName of ['Root Workspace', 'Default Workspace']) {
      const expandBtn = this.table.getByRole('row', { name: new RegExp(rowName, 'i') }).getByRole('button', { name: /expand row/i });
      if (await expandBtn.isVisible({ timeout: E2E_TIMEOUTS.DRAWER_ANIMATION }).catch(() => false)) {
        await expandBtn.click();
        await this.page.waitForTimeout(E2E_TIMEOUTS.MENU_ANIMATION);
      }
    }
  }

  async verifyWorkspaceInTable(name: string): Promise<void> {
    await this.expandTreeNodes();
    await expect(this.table.getByText(name)).toBeVisible({ timeout: E2E_TIMEOUTS.SLOW_DATA });
  }

  async verifyWorkspaceNotInTable(name: string): Promise<void> {
    await expect(this.table.getByText(name)).not.toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
  }

  async navigateToDetail(name: string): Promise<void> {
    await this.expandTreeNodes();
    const link = this.getWorkspaceLink(name);
    await expect(link).toBeVisible({ timeout: E2E_TIMEOUTS.SLOW_DATA });
    await link.click();
    await expect(this.page.getByRole('heading', { name })).toBeVisible({ timeout: E2E_TIMEOUTS.SLOW_DATA });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CRUD Operations
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Fill the create workspace modal/wizard
   * @param name - Workspace name
   * @param description - Workspace description
   * @param parentWorkspace - Parent workspace to select (required - cannot create at root level)
   */
  async fillCreateModal(name: string, description: string, parentWorkspace?: string): Promise<void> {
    // Wait for the wizard to be ready — the user sees the heading
    await expect(this.page.getByRole('heading', { name: /create new workspace/i })).toBeVisible({
      timeout: E2E_TIMEOUTS.DIALOG_CONTENT,
    });

    // Select parent workspace — click the dropdown, expand tree, pick, confirm
    if (parentWorkspace) {
      await this.page.getByRole('button', { name: /select workspaces/i }).click();

      const tree = this.page.getByRole('tree');
      await expect(tree.getByRole('treeitem').first()).toBeVisible({ timeout: E2E_TIMEOUTS.SLOW_DATA });

      const targetItem = tree.getByRole('treeitem').filter({ hasText: parentWorkspace }).first();
      if (!(await targetItem.isVisible().catch(() => false))) {
        const rootExpandBtn = tree.getByRole('treeitem').first().getByRole('button').first();
        await rootExpandBtn.click();
        await expect(targetItem).toBeVisible({ timeout: E2E_TIMEOUTS.SLOW_DATA });
      }

      // Click the workspace name to select it
      await targetItem.getByRole('button', { name: parentWorkspace }).last().click();

      // Confirm the selection
      const confirmBtn = this.page.getByTestId('workspace-selector-confirm').or(this.page.getByRole('button', { name: /select workspace/i }));
      await confirmBtn.click();
    }

    // Fill name and description
    await this.page.getByRole('textbox', { name: /workspace name/i }).fill(name);
    const descInput = this.page.getByRole('textbox', { name: /workspace description/i });
    if (await descInput.isVisible()) {
      await descInput.fill(description);
    }

    // Click Next to proceed to review step, then submit
    const nextButton = this.page.getByRole('button', { name: /^next$/i });
    if (await nextButton.isEnabled({ timeout: E2E_TIMEOUTS.BUTTON_STATE }).catch(() => false)) {
      await nextButton.click();
      // Wait for review step — use the heading to avoid matching "Preview mode" banner text
      await expect(this.page.getByRole('heading', { name: /review new workspace/i })).toBeVisible({
        timeout: E2E_TIMEOUTS.DIALOG_CONTENT,
      });
      // Submit — use exact match to avoid hitting "Create workspace" button on the main page
      await this.page.getByRole('button', { name: 'Submit' }).click();
    } else {
      await this.page.getByRole('button', { name: /^submit$/i }).click();
    }

    // Wait for the modal to close (success) — workspace creation API can be slow on stage
    await expect(this.page.getByRole('heading', { name: /create new workspace/i })).not.toBeVisible({
      timeout: E2E_TIMEOUTS.SLOW_DATA,
    });
  }

  async fillEditForm(newDescription: string): Promise<void> {
    // Wait for the edit modal to appear with the Name field
    const nameInput = this.page.getByRole('textbox', { name: /name/i });
    await expect(nameInput).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });

    // Update the description
    const descInput = this.page.getByRole('textbox', { name: /description/i });
    if (await descInput.isVisible()) {
      await descInput.click();
      await descInput.selectText();
      await this.page.keyboard.press('Backspace');
      await descInput.fill(newDescription);
    }

    await this.page.getByRole('button', { name: /save/i }).click();
  }

  async confirmDelete(): Promise<void> {
    const modal = this.page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: E2E_TIMEOUTS.DIALOG_CONTENT });

    const checkbox = modal.getByRole('checkbox');
    if (await checkbox.isVisible({ timeout: E2E_TIMEOUTS.MENU_ANIMATION }).catch(() => false)) {
      await checkbox.click();
    }

    await modal.getByRole('button', { name: /delete|remove/i }).click();
    await expect(modal).not.toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Detail Page Locators
  // ═══════════════════════════════════════════════════════════════════════════

  get detailActionsMenu(): Locator {
    return this.page.getByRole('button', { name: /actions/i }).first();
  }

  get grantAccessButton(): Locator {
    return this.page.locator('[data-ouia-component-id$="grant-access-button"]');
  }

  get grantAccessWizard(): Locator {
    return this.page.locator('[data-ouia-component-id="grant-access-wizard"]');
  }

  get roleAssignmentsTab(): Locator {
    return this.page.getByRole('tab', { name: /role assignments/i });
  }

  get assetsTab(): Locator {
    return this.page.getByRole('tab', { name: /assets/i });
  }

  get currentRoleAssignmentsSubTab(): Locator {
    return this.page.getByRole('tab', { name: /roles assigned in this workspace/i });
  }

  get inheritedRoleAssignmentsSubTab(): Locator {
    return this.page.getByRole('tab', { name: /roles assigned in parent/i });
  }

  get currentRoleAssignmentsTable(): Locator {
    return this.page.locator('[data-ouia-component-id="current-role-assignments-table"]');
  }

  get parentRoleAssignmentsTable(): Locator {
    return this.page.locator('[data-ouia-component-id="parent-role-assignments-table"]');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Detail Page Actions
  // ═══════════════════════════════════════════════════════════════════════════

  async openGrantAccessWizard(): Promise<void> {
    await this.grantAccessButton.click();
    await expect(this.grantAccessWizard).toBeVisible({ timeout: E2E_TIMEOUTS.DIALOG_CONTENT });
  }

  async openGrantAccessFromActions(): Promise<void> {
    await this.detailActionsMenu.click();
    await this.page.getByRole('menuitem', { name: /grant access/i }).click();
    await expect(this.grantAccessWizard).toBeVisible({ timeout: E2E_TIMEOUTS.DIALOG_CONTENT });
  }

  async fillGrantAccessWizard(options: { groups: string[]; roles: string[] }): Promise<void> {
    // Step 1: Select user groups
    for (const groupName of options.groups) {
      const row = this.grantAccessWizard.getByRole('row').filter({ hasText: groupName });
      await row.getByRole('checkbox').check();
    }
    await this.page.getByRole('button', { name: /^next$/i }).click();

    // Step 2: Select roles
    for (const roleName of options.roles) {
      const row = this.grantAccessWizard.getByRole('row').filter({ hasText: roleName });
      await row.getByRole('checkbox').check();
    }
    await this.page.getByRole('button', { name: /^next$/i }).click();

    // Step 3: Review and submit
    await this.page.getByRole('button', { name: /^submit$/i }).click();
    await expect(this.grantAccessWizard).not.toBeVisible({ timeout: E2E_TIMEOUTS.MUTATION_COMPLETE });
  }

  async cancelGrantAccessWizard(): Promise<void> {
    await this.page.getByRole('button', { name: /^cancel$/i }).click();
    await expect(this.grantAccessWizard).not.toBeVisible({ timeout: E2E_TIMEOUTS.DIALOG_CONTENT });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Group Details Drawer
  // ═══════════════════════════════════════════════════════════════════════════

  async openGroupDrawer(groupName: string): Promise<void> {
    const table = this.currentRoleAssignmentsTable.or(this.parentRoleAssignmentsTable);
    await table.getByRole('row').filter({ hasText: groupName }).click();
    await expect(this.page.getByRole('tab', { name: /members/i })).toBeVisible({ timeout: E2E_TIMEOUTS.SLOW_DATA });
  }

  async closeGroupDrawer(): Promise<void> {
    await this.page.getByRole('button', { name: /close drawer panel/i }).click();
    await expect(this.page.getByRole('tab', { name: /members/i })).not.toBeVisible({ timeout: E2E_TIMEOUTS.DIALOG_CONTENT });
  }

  async openRoleBindingActions(groupName: string): Promise<void> {
    const row = this.currentRoleAssignmentsTable.getByRole('row').filter({ hasText: groupName });
    await row.getByRole('button', { name: /actions|kebab/i }).click();
    await this.page.waitForTimeout(E2E_TIMEOUTS.QUICK_SETTLE);
  }

  async confirmRemoveGroup(): Promise<void> {
    const modal = this.page.locator('[data-ouia-component-id="remove-group-from-workspace-modal"]');
    await expect(modal).toBeVisible({ timeout: E2E_TIMEOUTS.DIALOG_CONTENT });
    await modal.getByRole('button', { name: /remove/i }).click();
    await expect(modal).not.toBeVisible({ timeout: E2E_TIMEOUTS.MUTATION_COMPLETE });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Inherited Role Bindings Helpers
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Navigate to a child workspace by expanding its parent in the tree first.
   * Searches for the child, expands parent + default, then clicks through.
   */
  async navigateToChildWorkspace(parentName: string, childName: string): Promise<void> {
    await this.searchFor(childName);
    await this.expandTreeNodes();

    const parentRow = this.table.getByRole('row', { name: new RegExp(parentName, 'i') });
    const parentExpandBtn = parentRow.getByRole('button', { name: /expand row/i });
    if (await parentExpandBtn.isVisible({ timeout: E2E_TIMEOUTS.DRAWER_ANIMATION }).catch(() => false)) {
      await parentExpandBtn.click();
      await this.page.waitForTimeout(E2E_TIMEOUTS.MENU_ANIMATION);
    }

    const link = this.getWorkspaceLink(childName);
    await expect(link).toBeVisible({ timeout: E2E_TIMEOUTS.SLOW_DATA });
    await link.click();
    await expect(this.page.getByRole('heading', { name: childName })).toBeVisible({ timeout: E2E_TIMEOUTS.SLOW_DATA });
  }

  /**
   * Switch to the inherited role assignments sub-tab and wait for the table.
   */
  async switchToInheritedTab(): Promise<void> {
    await this.roleAssignmentsTab.click();
    await this.inheritedRoleAssignmentsSubTab.click();
    await expect(this.inheritedRoleAssignmentsSubTab).toHaveAttribute('aria-selected', 'true', {
      timeout: E2E_TIMEOUTS.SLOW_DATA,
    });
    await waitForTableUpdate(this.page, { timeout: E2E_TIMEOUTS.SLOW_DATA });
  }

  getInheritedGroupRow(groupName: string): Locator {
    return this.parentRoleAssignmentsTable.getByRole('row').filter({ hasText: groupName });
  }

  async expectInheritedGroupRow(groupName: string): Promise<void> {
    await expect(this.getInheritedGroupRow(groupName)).toBeVisible({ timeout: E2E_TIMEOUTS.SLOW_DATA });
  }

  async expectInheritedFromColumn(groupName: string, parentWorkspaceName: string): Promise<void> {
    const row = this.getInheritedGroupRow(groupName);
    await expect(row.getByRole('link', { name: parentWorkspaceName })).toBeVisible({ timeout: E2E_TIMEOUTS.SLOW_DATA });
  }

  async expectGroupNotInInheritedTab(groupName: string): Promise<void> {
    await expect(this.getInheritedGroupRow(groupName)).not.toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Row Actions
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Open the row actions (kebab) menu for a workspace.
   * Expands tree first so the workspace row is visible.
   */
  async openRowKebab(workspaceName: string): Promise<void> {
    await this.expandTreeNodes();
    const row = this.table
      .getByRole('row')
      .filter({ has: this.table.getByText(workspaceName) })
      .first();
    await expect(row).toBeVisible({ timeout: E2E_TIMEOUTS.SLOW_DATA });
    const kebab = row.getByRole('button', { name: /actions|kebab toggle/i });
    await kebab.click();
    await this.page.waitForTimeout(E2E_TIMEOUTS.QUICK_SETTLE);
  }

  /**
   * Fill the move workspace modal: select new parent and submit.
   */
  async fillMoveModal(newParentName: string): Promise<void> {
    const modal = this.page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: E2E_TIMEOUTS.DIALOG_CONTENT });

    // Open parent selector — toggle shows current parent name when selected
    const selectorToggle = modal.getByTestId('workspace-selector-toggle').or(modal.getByRole('button', { name: /select workspaces/i }));
    await selectorToggle.click();

    const tree = this.page.getByRole('tree');
    await expect(tree.getByRole('treeitem').first()).toBeVisible({ timeout: E2E_TIMEOUTS.SLOW_DATA });

    const targetItem = tree.getByRole('treeitem').filter({ hasText: newParentName }).first();
    if (!(await targetItem.isVisible().catch(() => false))) {
      const rootExpandBtn = tree.getByRole('treeitem').first().getByRole('button').first();
      await rootExpandBtn.click();
      await expect(targetItem).toBeVisible({ timeout: E2E_TIMEOUTS.SLOW_DATA });
    }

    await targetItem.getByRole('button', { name: newParentName }).last().click();

    const confirmBtn = this.page.getByTestId('workspace-selector-confirm').or(this.page.getByRole('button', { name: /select workspace/i }));
    await confirmBtn.click();

    await modal.getByRole('button', { name: /^submit$/i }).click();
    await expect(modal).not.toBeVisible({ timeout: E2E_TIMEOUTS.MUTATION_COMPLETE });
  }
}
