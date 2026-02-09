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
import { E2E_TIMEOUTS } from '../../utils/timeouts';

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
    await expect(this.heading).toBeVisible({ timeout: E2E_TIMEOUTS.SETUP_PAGE_LOAD });
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
    await expect(this.getGroupRow(name)).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
  }

  async verifyGroupNotInTable(name: string): Promise<void> {
    await expect(this.getGroupRow(name)).not.toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Drawer (V2 detail view)
  // ═══════════════════════════════════════════════════════════════════════════

  async openDrawer(name: string): Promise<void> {
    await this.table.getByText(name).click();
    await expect(this.drawer).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
    await expect(this.drawer.getByRole('heading', { name })).toBeVisible({ timeout: E2E_TIMEOUTS.DIALOG_CONTENT });
  }

  async closeDrawer(name: string): Promise<void> {
    await this.table.getByText(name).click();
    await expect(this.drawer.getByRole('heading', { name })).not.toBeVisible({ timeout: E2E_TIMEOUTS.DRAWER_ANIMATION });
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
    await expect(this.page.locator('[data-ouia-component-id="edit-user-group-form"]')).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });

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
    await expect(this.page).toHaveURL(/\/user-groups(\?|$)/, { timeout: E2E_TIMEOUTS.MUTATION_COMPLETE });
  }

  async confirmDelete(): Promise<void> {
    // Use generic dialog selector - OUIA ID may vary
    const modal = this.page.getByRole('dialog');
    await expect(modal).toBeVisible({ timeout: E2E_TIMEOUTS.DIALOG_CONTENT });

    // Check the confirmation checkbox - required for delete
    const checkbox = modal.getByRole('checkbox');
    await expect(checkbox).toBeVisible({ timeout: E2E_TIMEOUTS.DRAWER_ANIMATION });
    await checkbox.click();

    await modal.getByRole('button', { name: /delete/i }).click();
    await expect(modal).not.toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
  }
}
