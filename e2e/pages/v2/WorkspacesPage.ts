/**
 * Page Object for the Workspaces Page
 *
 * Shared between V1 and V2 — the only difference is the base URL:
 *   V1: /iam/user-access/workspaces
 *   V2: /iam/access-management/workspaces
 */

import { type Locator, type Page, expect } from '@playwright/test';
import { setupPage, waitForTableUpdate } from '../../utils';
import { ManagedWorkspaceSelectorComponent } from '../components/ManagedWorkspaceSelectorComponent';
import { E2E_TIMEOUTS } from '../../utils/timeouts';

const WORKSPACES_URLS = {
  v1: '/iam/user-access/workspaces',
  v2: '/iam/access-management/workspaces',
} as const;

export class WorkspacesPage {
  readonly page: Page;
  readonly workspaceSelector: ManagedWorkspaceSelectorComponent;
  private readonly url: string;

  constructor(page: Page, version: 'v1' | 'v2' = 'v2') {
    this.page = page;
    this.url = WORKSPACES_URLS[version];
    this.workspaceSelector = new ManagedWorkspaceSelectorComponent(page);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Navigation
  // ═══════════════════════════════════════════════════════════════════════════

  async goto(): Promise<void> {
    await setupPage(this.page);
    await this.page.goto(this.url);
    await expect(this.heading).toBeVisible({ timeout: E2E_TIMEOUTS.SETUP_PAGE_LOAD });
    // Wait for table data to actually load — "Root Workspace" is always present
    await expect(this.page.getByText('Root Workspace', { exact: true })).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Locators
  // ═══════════════════════════════════════════════════════════════════════════

  get heading(): Locator {
    return this.page.getByRole('heading', { name: /workspaces/i });
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
    await waitForTableUpdate(this.page);
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
      if (await expandBtn.isVisible({ timeout: E2E_TIMEOUTS.MENU_ANIMATION }).catch(() => false)) {
        await expandBtn.click();
        await this.page.waitForTimeout(E2E_TIMEOUTS.QUICK_SETTLE);
      }
    }
  }

  async verifyWorkspaceInTable(name: string): Promise<void> {
    await this.expandTreeNodes();
    await expect(this.table.getByText(name)).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
  }

  async verifyWorkspaceNotInTable(name: string): Promise<void> {
    await expect(this.table.getByText(name)).not.toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
  }

  async navigateToDetail(name: string): Promise<void> {
    // Workspace link may be inside a collapsed tree node — expand first
    await this.expandTreeNodes();
    await this.getWorkspaceLink(name).click();
    await expect(this.page.getByRole('heading', { name })).toBeVisible({ timeout: E2E_TIMEOUTS.DETAIL_CONTENT });
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

      // Wait for the tree to load — Root Workspace is always the top-level node
      const tree = this.page.getByRole('tree');
      await expect(tree.getByRole('treeitem').first()).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });

      // If the target isn't Root Workspace, we need to expand the tree to reveal it.
      // The workspace tree starts collapsed — expand Root Workspace to see its children.
      const targetItem = tree.getByRole('treeitem').filter({ hasText: parentWorkspace }).first();
      if (!(await targetItem.isVisible().catch(() => false))) {
        // Expand Root Workspace — the first expand button in the tree
        const rootExpandBtn = tree.getByRole('treeitem').first().getByRole('button').first();
        await rootExpandBtn.click();
        await expect(targetItem).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
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
}
