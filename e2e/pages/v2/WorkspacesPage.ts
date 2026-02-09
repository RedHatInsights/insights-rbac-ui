/**
 * Page Object for V2 Workspaces Page
 *
 * Encapsulates all interactions with the V2 Workspaces page at:
 * /iam/access-management/workspaces
 */

import { type Locator, type Page, expect } from '@playwright/test';
import { setupPage, waitForTableUpdate } from '../../utils';
import { ManagedWorkspaceSelectorComponent } from '../components/ManagedWorkspaceSelectorComponent';
import { E2E_TIMEOUTS } from '../../utils/timeouts';

const WORKSPACES_URL = '/iam/access-management/workspaces';

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
    await this.page.goto(WORKSPACES_URL);
    await expect(this.heading).toBeVisible({ timeout: E2E_TIMEOUTS.SETUP_PAGE_LOAD });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Locators
  // ═══════════════════════════════════════════════════════════════════════════

  get heading(): Locator {
    return this.page.getByRole('heading', { name: /workspaces/i });
  }

  get table(): Locator {
    return this.page.getByRole('grid');
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

  async verifyWorkspaceInTable(name: string): Promise<void> {
    await expect(this.table.getByText(name)).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
  }

  async verifyWorkspaceNotInTable(name: string): Promise<void> {
    await expect(this.table.getByText(name)).not.toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
  }

  async navigateToDetail(name: string): Promise<void> {
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
   * @param parentWorkspace - Optional parent workspace to select (requires expanding parentPath first)
   * @param parentPath - Optional path to parent (workspace to expand before selecting)
   */
  async fillCreateModal(name: string, description: string, parentWorkspace?: string, parentPath?: string): Promise<void> {
    const modal = this.page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });

    // Select parent workspace if specified
    if (parentWorkspace) {
      await this.workspaceSelector.selectWorkspaceByPath(parentWorkspace, parentPath);
    }

    await modal.getByLabel(/name/i).first().fill(name);
    const descInput = modal.getByLabel(/description/i);
    if (await descInput.isVisible()) {
      await descInput.fill(description);
    }

    await modal.getByRole('button', { name: /submit|create|save/i }).click();
    await expect(modal).not.toBeVisible({ timeout: E2E_TIMEOUTS.MUTATION_COMPLETE });
  }

  async fillEditForm(newDescription: string): Promise<void> {
    // Edit workspace form on detail page
    const nameInput = this.page.getByLabel(/name/i);
    await expect(nameInput).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
    // Note: Workspace names often can't be edited, only description

    const descInput = this.page.getByLabel(/description/i);
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
