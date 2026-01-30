/**
 * Page Object for V2 Workspaces Page
 *
 * Encapsulates all interactions with the V2 Workspaces page at:
 * /iam/access-management/workspaces
 */

import { type Locator, type Page, expect } from '@playwright/test';
import { setupPage, waitForTableUpdate } from '../../utils';

const WORKSPACES_URL = '/iam/access-management/workspaces';

export class WorkspacesPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Navigation
  // ═══════════════════════════════════════════════════════════════════════════

  async goto(): Promise<void> {
    await setupPage(this.page);
    await this.page.goto(WORKSPACES_URL);
    await expect(this.heading).toBeVisible();
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
    await expect(this.table.getByText(name)).toBeVisible({ timeout: 10000 });
  }

  async verifyWorkspaceNotInTable(name: string): Promise<void> {
    await expect(this.table.getByText(name)).not.toBeVisible({ timeout: 10000 });
  }

  async navigateToDetail(name: string): Promise<void> {
    await this.getWorkspaceLink(name).click();
    await expect(this.page.getByRole('heading', { name })).toBeVisible({ timeout: 15000 });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CRUD Operations
  // ═══════════════════════════════════════════════════════════════════════════

  async fillCreateModal(name: string, description: string): Promise<void> {
    const modal = this.page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 10000 });

    await modal.getByLabel(/name/i).first().fill(name);
    const descInput = modal.getByLabel(/description/i);
    if (await descInput.isVisible()) {
      await descInput.fill(description);
    }

    await modal.getByRole('button', { name: /submit|create|save/i }).click();
    await expect(modal).not.toBeVisible({ timeout: 15000 });
  }

  async fillEditForm(newDescription: string): Promise<void> {
    // Edit workspace form on detail page
    const nameInput = this.page.getByLabel(/name/i);
    await expect(nameInput).toBeVisible({ timeout: 5000 });
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
    await expect(modal).toBeVisible({ timeout: 5000 });

    const checkbox = modal.getByRole('checkbox');
    if (await checkbox.isVisible({ timeout: 2000 }).catch(() => false)) {
      await checkbox.click();
    }

    await modal.getByRole('button', { name: /delete|remove/i }).click();
    await expect(modal).not.toBeVisible({ timeout: 10000 });
  }
}
