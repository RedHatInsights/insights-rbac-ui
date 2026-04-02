/**
 * Page Object for the V2 Workspaces Page
 *
 * URL: /iam/access-management/workspaces
 */

import { type Locator, type Page, expect } from '@playwright/test';
import { iamUrl, setupPage, v2, waitForTableUpdate } from '../../utils';
import { ManagedWorkspaceSelectorComponent } from '../components/ManagedWorkspaceSelectorComponent';
import { TableComponent } from '../components/TableComponent';
import { E2E_TIMEOUTS } from '../../utils/timeouts';

const WORKSPACES_URL = iamUrl(v2.accessManagementWorkspaces.link());

export class WorkspacesPage {
  readonly page: Page;
  readonly workspaceSelector: ManagedWorkspaceSelectorComponent;
  readonly tableComponent: TableComponent;

  constructor(page: Page) {
    this.page = page;
    this.workspaceSelector = new ManagedWorkspaceSelectorComponent(page);
    this.tableComponent = new TableComponent(page);
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
    await this.tableComponent.search(name);
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

    // Step 1: Details — always the first step. Fill name and description.
    await this.page.getByRole('textbox', { name: /workspace name/i }).fill(name);
    const descInput = this.page.getByRole('textbox', { name: /workspace description/i });
    if (await descInput.isVisible()) {
      await descInput.fill(description);
    }

    // Advance past the details step
    await this.page.getByRole('button', { name: /^next$/i }).click();

    // Step 2 (optional): Select parent workspace.
    // This step appears when creating from the list page (skipParentStep=false).
    // It is absent when creating via kebab (parent is pre-selected, skipParentStep=true).
    //
    // Detection: Use the step heading (appears immediately on step render) rather than
    // the tree element (which is hidden behind a spinner while Kessel permissions load).
    const selectParentHeading = this.page.getByRole('heading', { name: /select parent workspace/i });
    const isParentStepVisible = await selectParentHeading.isVisible({ timeout: E2E_TIMEOUTS.DIALOG_CONTENT }).catch(() => false);
    if (isParentStepVisible && parentWorkspace) {
      // Wait for the tree to finish loading (status='ready' in useWorkspacesWithPermissions).
      // The tree renders a spinner until Kessel permissions settle, then shows treeitems.
      const tree = this.page.getByRole('tree');
      await expect(tree).toBeVisible({ timeout: E2E_TIMEOUTS.SLOW_DATA });
      await expect(tree.getByRole('treeitem').first()).toBeVisible({ timeout: E2E_TIMEOUTS.SLOW_DATA });

      // Find the target workspace treeitem by its accessible name.
      // No search filter — avoids race conditions with filtered tree re-renders.
      const targetItem = tree.getByRole('treeitem', { name: parentWorkspace }).first();
      await expect(targetItem).toBeVisible({ timeout: E2E_TIMEOUTS.SLOW_DATA });

      // Click the node-text button (the select button, not the expand toggle).
      // PF6 TreeView with hasSelectableNodes: clicking node-text bubbles to the parent
      // div's onClick which calls onSelect, updating the DDF form field WORKSPACE_PARENT.
      // Use .first() because child treeitems' node-text buttons are also descendants of this
      // treeitem element; the first match is always this treeitem's own button.
      await targetItem.locator('.pf-v6-c-tree-view__node-text').first().click();

      // Wait for aria-selected="true" to confirm the selection registered in the DDF form.
      // This is more reliable than waiting for Next to be enabled, as it confirms the
      // full round-trip: click → onSelect → handleSelect → formOptions.change → re-render.
      await expect(targetItem).toHaveAttribute('aria-selected', 'true', { timeout: E2E_TIMEOUTS.SLOW_DATA });

      // Advance to the review step
      const nextButton = this.page.getByRole('button', { name: /^next$/i });
      await expect(nextButton).toBeEnabled({ timeout: E2E_TIMEOUTS.SLOW_DATA });
      await nextButton.click();
    }

    // Wait for review step — use SLOW_DATA to tolerate any DDF/React render delay
    await expect(this.page.getByRole('heading', { name: /review new workspace/i })).toBeVisible({
      timeout: E2E_TIMEOUTS.SLOW_DATA,
    });
    // Submit — use exact match to avoid hitting "Create workspace" button on the main page
    await this.page.getByRole('button', { name: 'Submit' }).click();

    // Wait for the modal to close (success) — workspace creation API can be slow on stage
    await expect(this.page.getByRole('heading', { name: /create new workspace/i })).not.toBeVisible({
      timeout: E2E_TIMEOUTS.SLOW_DATA,
    });
  }

  async fillEditForm(newDescription: string, newName?: string): Promise<void> {
    // Wait for the edit modal to fully render (workspace data + permissions loading).
    // Scope to the dialog to avoid matching other page elements.
    // Use the HTML `name` attribute (set by DDF) rather than accessible name — the Name
    // TextInput's label association isn't reflected as an ARIA accessible name.
    const dialog = this.page.getByRole('dialog', { name: /edit workspace/i });
    await expect(dialog).toBeVisible({ timeout: E2E_TIMEOUTS.SLOW_DATA });

    const nameInput = dialog.locator('[name="name"]');
    await expect(nameInput).toBeVisible({ timeout: E2E_TIMEOUTS.SLOW_DATA });

    if (newName) {
      await nameInput.click();
      await nameInput.selectText();
      await this.page.keyboard.press('Backspace');
      await nameInput.fill(newName);
    }

    // Wait for description field to render — the modal loads async
    const descInput = dialog.locator('[name="description"]');
    await expect(descInput).toBeVisible({ timeout: E2E_TIMEOUTS.SLOW_DATA });
    await descInput.click();
    await descInput.selectText();
    await this.page.keyboard.press('Backspace');
    await descInput.fill(newDescription);

    // Wait for the Save button to become enabled (form is no longer pristine)
    const saveButton = this.page.getByRole('button', { name: /save/i });
    await expect(saveButton).toBeEnabled({ timeout: E2E_TIMEOUTS.BUTTON_STATE });
    await saveButton.click();
  }

  async openEditAccessModal(groupName: string): Promise<void> {
    const row = this.currentRoleAssignmentsTable.getByRole('row').filter({ hasText: groupName });
    await row.getByRole('button', { name: /actions|kebab/i }).click();
    await this.page.waitForTimeout(E2E_TIMEOUTS.QUICK_SETTLE);
    await this.page.getByRole('menuitem', { name: /edit access/i }).click();
    await expect(this.page.getByRole('dialog').getByRole('heading', { name: /edit access/i })).toBeVisible({
      timeout: E2E_TIMEOUTS.DIALOG_CONTENT,
    });
  }

  async closeEditAccessModal(): Promise<void> {
    const dialog = this.page.getByRole('dialog');
    await dialog.getByRole('button', { name: /cancel/i }).click();
    await expect(dialog).not.toBeVisible({ timeout: E2E_TIMEOUTS.DIALOG_CONTENT });
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
    // Tab title includes a Popover icon which may alter the accessible name
    return this.page.getByRole('tab', { name: /parent workspaces/i });
  }

  get currentRoleAssignmentsTable(): Locator {
    // Staging (master) renders "current-role-assignments-table-table" — ouiaId prop already
    // had -table, then BaseGroupAssignmentsTable appends another. Our branch corrected the
    // prop to drop the suffix, so the final id is "current-role-assignments-table".
    // Both the wrapper div and inner <table> share the same OUIA id, so .first() picks the div.
    return this.page
      .locator('[data-ouia-component-id="current-role-assignments-table"]')
      .or(this.page.locator('[data-ouia-component-id="current-role-assignments-table-table"]'))
      .first();
  }

  get parentRoleAssignmentsTable(): Locator {
    // Same reasoning as currentRoleAssignmentsTable above.
    return this.page
      .locator('[data-ouia-component-id="parent-role-assignments-table"]')
      .or(this.page.locator('[data-ouia-component-id="parent-role-assignments-table-table"]'))
      .first();
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
    const wizard = this.grantAccessWizard;
    const searchInput = wizard
      .getByRole('searchbox')
      .or(wizard.getByPlaceholder(/filter|search/i))
      .first();

    // Step 1: Select user groups — search for each to avoid pagination issues
    for (const groupName of options.groups) {
      if (await searchInput.isVisible({ timeout: E2E_TIMEOUTS.QUICK_SETTLE }).catch(() => false)) {
        await searchInput.fill(groupName);
        await waitForTableUpdate(this.page, { timeout: E2E_TIMEOUTS.TABLE_DATA });
      }
      const row = wizard.getByRole('row').filter({ hasText: groupName });
      await row.getByRole('checkbox').check();
    }
    await this.page.getByRole('button', { name: /^next$/i }).click();

    // Step 2: Select roles — search for each to avoid pagination issues
    for (const roleName of options.roles) {
      if (await searchInput.isVisible({ timeout: E2E_TIMEOUTS.QUICK_SETTLE }).catch(() => false)) {
        await searchInput.fill(roleName);
        await waitForTableUpdate(this.page, { timeout: E2E_TIMEOUTS.TABLE_DATA });
      }
      const row = wizard.getByRole('row').filter({ hasText: roleName });
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

  async openGroupDrawer(groupName: string, table?: Locator): Promise<void> {
    const scope = table ?? this.currentRoleAssignmentsTable;
    const row = scope.getByRole('row').filter({ hasText: groupName });
    await expect(row).toBeVisible({ timeout: E2E_TIMEOUTS.SLOW_DATA });
    await row.click();
    // Wait for the drawer slide-in animation and data load
    await expect(this.page.getByRole('tab', { name: /^users$/i })).toBeVisible({ timeout: E2E_TIMEOUTS.SLOW_DATA });
  }

  async closeGroupDrawer(): Promise<void> {
    await this.page.getByRole('button', { name: /close drawer panel/i }).click();
    await expect(this.page.getByRole('tab', { name: /^users$/i })).not.toBeVisible({ timeout: E2E_TIMEOUTS.DIALOG_CONTENT });
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
    // Wait for sub-tabs to render after the main tab switch
    await expect(this.inheritedRoleAssignmentsSubTab).toBeVisible({ timeout: E2E_TIMEOUTS.SLOW_DATA });
    await this.inheritedRoleAssignmentsSubTab.click();
    await expect(this.inheritedRoleAssignmentsSubTab).toHaveAttribute('aria-selected', 'true', {
      timeout: E2E_TIMEOUTS.SLOW_DATA,
    });
    // The inherited table is conditionally rendered — wait for it to mount and load data
    await expect(this.parentRoleAssignmentsTable).toBeVisible({
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
    const row = this.page.getByRole('treegrid').getByRole('row').filter({ hasText: workspaceName }).first();
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

    // Tree is always inline — no toggle to open
    const tree = this.page.getByRole('tree');
    await expect(tree.getByRole('treeitem').first()).toBeVisible({ timeout: E2E_TIMEOUTS.SLOW_DATA });

    // Search for the workspace to isolate it, then click the selection button
    const searchInput = this.page.getByRole('searchbox', { name: /search workspaces/i });
    if (await searchInput.isVisible({ timeout: E2E_TIMEOUTS.QUICK_SETTLE }).catch(() => false)) {
      await searchInput.fill(newParentName);
      await this.page.waitForTimeout(E2E_TIMEOUTS.QUICK_SETTLE);
    }

    const targetItem = tree.getByRole('treeitem', { name: newParentName }).first();
    await expect(targetItem).toBeVisible({ timeout: E2E_TIMEOUTS.SLOW_DATA });

    // Use .first() because child treeitems' node-text buttons are also descendants of this
    // treeitem when the tree is unfiltered; first() always picks the target treeitem's own button.
    await targetItem.locator('.pf-v6-c-tree-view__node-text').first().click();

    await modal.getByRole('button', { name: /^submit$/i }).click();
    await expect(modal).not.toBeVisible({ timeout: E2E_TIMEOUTS.MUTATION_COMPLETE });
  }
}
