/**
 * Page Object for V2 User Groups Page
 *
 * Encapsulates all interactions with the V2 User Groups page at:
 * /iam/access-management/users-and-user-groups/user-groups
 *
 * V2 Differences from V1:
 * - View details: Uses drawer (row click), not page navigation
 * - Create/Edit: Uses full page form, not wizard/modal
 */

import { type Locator, type Page, expect } from '@playwright/test';
import { setupPage, waitForTableUpdate } from '../../utils';

const GROUPS_URL = '/iam/access-management/users-and-user-groups/user-groups';

export class UserGroupsPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Navigation
  // ═══════════════════════════════════════════════════════════════════════════

  async goto(): Promise<void> {
    await setupPage(this.page);
    await this.page.goto(GROUPS_URL);
    await expect(this.heading).toBeVisible();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Locators
  // ═══════════════════════════════════════════════════════════════════════════

  get heading(): Locator {
    return this.page.getByRole('heading', { name: /user groups/i });
  }

  get table(): Locator {
    return this.page.getByRole('grid');
  }

  get searchInput(): Locator {
    return this.page.getByRole('searchbox').or(this.page.getByPlaceholder(/filter|search/i));
  }

  get createButton(): Locator {
    return this.page.getByRole('button', { name: /create user group/i });
  }

  get drawer(): Locator {
    return this.page.locator('[data-ouia-component-id="groups-details-drawer"]');
  }

  get unauthorizedMessage(): Locator {
    return this.page.getByText(/You do not have access to/i);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Table Actions
  // ═══════════════════════════════════════════════════════════════════════════

  async searchFor(name: string): Promise<void> {
    await this.searchInput.clear();
    await this.searchInput.fill(name);
    await waitForTableUpdate(this.page);
  }

  getGroupRow(name: string): Locator {
    return this.table.getByRole('row', { name: new RegExp(name, 'i') });
  }

  async verifyGroupInTable(name: string): Promise<void> {
    await expect(this.getGroupRow(name)).toBeVisible({ timeout: 10000 });
  }

  async verifyGroupNotInTable(name: string): Promise<void> {
    await expect(this.getGroupRow(name)).not.toBeVisible({ timeout: 10000 });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Drawer (V2 detail view)
  // ═══════════════════════════════════════════════════════════════════════════

  async openDrawer(name: string): Promise<void> {
    await this.table.getByText(name).click();
    await expect(this.drawer).toBeVisible({ timeout: 10000 });
    await expect(this.drawer.getByRole('heading', { name })).toBeVisible({ timeout: 5000 });
  }

  async closeDrawer(name: string): Promise<void> {
    await this.table.getByText(name).click();
    await expect(this.drawer.getByRole('heading', { name })).not.toBeVisible({ timeout: 5000 });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Row Actions
  // ═══════════════════════════════════════════════════════════════════════════

  async openRowActions(name: string): Promise<void> {
    const row = this.page.locator('tbody tr', { has: this.page.getByText(name) });
    await row.getByRole('button', { name: /actions/i }).click();
  }

  async clickRowAction(action: string): Promise<void> {
    await this.page.getByRole('menuitem', { name: new RegExp(action, 'i') }).click();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CRUD Operations
  // ═══════════════════════════════════════════════════════════════════════════

  async fillGroupForm(name: string, description: string): Promise<void> {
    await expect(this.page.locator('[data-ouia-component-id="edit-user-group-form"]')).toBeVisible({ timeout: 10000 });

    const nameInput = this.page.getByLabel(/^name/i);
    await nameInput.click();
    await nameInput.selectText();
    await this.page.keyboard.press('Backspace');
    await nameInput.fill(name);

    const descInput = this.page.getByLabel(/description/i);
    await descInput.click();
    await descInput.selectText();
    await this.page.keyboard.press('Backspace');
    await descInput.fill(description);

    await this.page.getByRole('button', { name: /submit|save|create/i }).click();
    await expect(this.page).toHaveURL(/\/user-groups(\?|$)/, { timeout: 15000 });
  }

  async confirmDelete(): Promise<void> {
    const modal = this.page.locator('[data-ouia-component-id="groups-remove-group-modal"]');
    await expect(modal).toBeVisible({ timeout: 5000 });
    await modal.getByRole('button', { name: /remove|delete/i }).click();
    await expect(modal).not.toBeVisible({ timeout: 10000 });
  }
}
