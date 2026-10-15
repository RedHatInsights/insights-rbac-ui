/**
 * Page Object for V2 Roles Page
 *
 * Encapsulates all interactions with the V2 Roles page at:
 * /iam/access-management/roles
 *
 * V2 Differences from V1:
 * - View details: Uses drawer (row click), not page navigation
 * - Edit: Uses full page, not modal
 */

import { type Locator, type Page, expect } from '@playwright/test';
import { iamUrl, setupPage, v2 } from '../../utils';
import { fillCreateRoleWizard, fillCreateRoleWizardAsCopy, searchForRole, verifyRoleInTable, verifyRoleNotInTable } from '../../utils/roleHelpers';
import { E2E_TIMEOUTS } from '../../utils/timeouts';
import { TableComponent } from '../components/TableComponent';

const ROLES_URL = iamUrl(v2.accessManagementRoles.link());

export class RolesPage {
  readonly page: Page;
  readonly tableComponent: TableComponent;

  constructor(page: Page) {
    this.page = page;
    this.tableComponent = new TableComponent(page);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Navigation
  // ═══════════════════════════════════════════════════════════════════════════

  async goto(): Promise<void> {
    await setupPage(this.page);
    await expect(async () => {
      await this.page.goto(ROLES_URL, { timeout: E2E_TIMEOUTS.SLOW_DATA });
      await expect(this.heading).toBeVisible({ timeout: E2E_TIMEOUTS.DETAIL_CONTENT });
    }).toPass({ timeout: E2E_TIMEOUTS.SETUP_PAGE_LOAD, intervals: [1_000, 2_000, 5_000] });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Locators
  // ═══════════════════════════════════════════════════════════════════════════

  get heading(): Locator {
    return this.page.getByRole('heading', { name: /roles/i, level: 1 });
  }

  get table(): Locator {
    return this.tableComponent.grid;
  }

  get createButton(): Locator {
    return this.page.getByRole('button', { name: /create role/i });
  }

  get unauthorizedMessage(): Locator {
    return this.page.getByText(/You do not have access to/i);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Table Actions
  // ═══════════════════════════════════════════════════════════════════════════

  async searchFor(name: string): Promise<void> {
    await searchForRole(this.page, name);
  }

  async clearSearch(): Promise<void> {
    await this.tableComponent.clearSearch();
  }

  async verifyRoleInTable(name: string): Promise<void> {
    await verifyRoleInTable(this.page, name);
  }

  async verifyRoleNotInTable(name: string): Promise<void> {
    await verifyRoleNotInTable(this.page, name);
  }

  getRoleRow(name: string): Locator {
    return this.tableComponent.getRow(name);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Drawer (V2 detail view)
  // ═══════════════════════════════════════════════════════════════════════════

  async openDrawer(name: string): Promise<void> {
    await this.tableComponent.clickRow(name);
    await expect(this.page.getByRole('heading', { name, level: 2 })).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
  }

  async closeDrawer(name: string): Promise<void> {
    const closeButton = this.page.locator('[data-ouia-component-id="RolesTable-drawer-close-button"]');
    await closeButton.click();
    await expect(this.page.getByRole('heading', { name, level: 2 })).not.toBeVisible({ timeout: E2E_TIMEOUTS.DRAWER_ANIMATION });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Row Actions
  // ═══════════════════════════════════════════════════════════════════════════

  async openRowActions(name: string): Promise<void> {
    await this.tableComponent.openRowActions(name);
  }

  async clickRowAction(action: string): Promise<void> {
    await this.tableComponent.clickRowAction(new RegExp(action, 'i'));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CRUD Operations
  // ═══════════════════════════════════════════════════════════════════════════

  async fillCreateWizard(name: string, description: string): Promise<void> {
    await fillCreateRoleWizard(this.page, name, description);
  }

  async fillCreateWizardAsCopy(newRoleName: string, sourceRoleName: string, seededWorkspaceName?: string, description?: string): Promise<void> {
    await fillCreateRoleWizardAsCopy(this.page, newRoleName, sourceRoleName, seededWorkspaceName, description);
  }

  async fillEditPage(newName: string, newDescription: string): Promise<void> {
    await expect(this.page).toHaveURL(/\/roles\/edit\//, { timeout: E2E_TIMEOUTS.TABLE_DATA });

    const nameInput = this.page.getByLabel(/^name/i);
    await nameInput.click();
    await nameInput.selectText();
    await this.page.keyboard.press('Backspace');
    await nameInput.fill(newName);

    const descInput = this.page.getByLabel(/description/i);
    await descInput.click();
    await descInput.selectText();
    await this.page.keyboard.press('Backspace');
    await descInput.fill(newDescription);

    await this.page.getByRole('button', { name: /save/i }).click();
    await expect(this.page).toHaveURL(/\/roles(\?|$)/, { timeout: E2E_TIMEOUTS.MUTATION_COMPLETE });
  }

  async confirmDelete(): Promise<void> {
    const modal = this.page.locator('[data-ouia-component-id="RolesTable-remove-role-modal"]');
    await expect(modal).toBeVisible({ timeout: E2E_TIMEOUTS.DIALOG_CONTENT });

    const checkbox = modal.getByRole('checkbox');
    if (await checkbox.isVisible({ timeout: E2E_TIMEOUTS.MENU_ANIMATION }).catch(() => false)) {
      await checkbox.click();
    }

    await modal.getByRole('button', { name: /delete/i }).click();
    await expect(modal).not.toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
  }
}
