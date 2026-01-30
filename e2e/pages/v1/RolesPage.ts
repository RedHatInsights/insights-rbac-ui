/**
 * Page Object for V1 Roles Page
 *
 * Encapsulates all interactions with the V1 Roles page at:
 * /iam/user-access/roles
 */

import { type Locator, type Page, expect } from '@playwright/test';
import { clickMenuItem, openDetailPageActionsMenu, openRoleActionsMenu, setupPage, verifySuccessNotification, waitForTableUpdate } from '../../utils';
import { fillCreateRoleWizard, searchForRole, verifyRoleInTable, verifyRoleNotInTable } from '../../utils/roleHelpers';

const ROLES_URL = '/iam/user-access/roles';

export class RolesPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Navigation
  // ═══════════════════════════════════════════════════════════════════════════

  async goto(): Promise<void> {
    await setupPage(this.page);
    await this.page.goto(ROLES_URL);
    await expect(this.heading).toBeVisible();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Locators
  // ═══════════════════════════════════════════════════════════════════════════

  get heading(): Locator {
    return this.page.getByRole('heading', { name: 'Roles', exact: true });
  }

  get table(): Locator {
    return this.page.getByRole('grid');
  }

  get searchInput(): Locator {
    return this.page.getByRole('searchbox').or(this.page.getByPlaceholder(/filter|search/i));
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
    await this.searchInput.clear();
    await waitForTableUpdate(this.page);
  }

  getRoleRow(name: string): Locator {
    return this.table.getByRole('row', { name: new RegExp(name, 'i') });
  }

  getRoleLink(name: string): Locator {
    return this.table.getByRole('link', { name });
  }

  async verifyRoleInTable(name: string): Promise<void> {
    await verifyRoleInTable(this.page, name);
  }

  async verifyRoleNotInTable(name: string): Promise<void> {
    await verifyRoleNotInTable(this.page, name);
  }

  async navigateToDetail(name: string): Promise<void> {
    await this.getRoleLink(name).click();
    await expect(this.page).toHaveURL(/\/roles\//);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Row Actions
  // ═══════════════════════════════════════════════════════════════════════════

  async openRowActions(name: string): Promise<void> {
    await openRoleActionsMenu(this.page, name);
  }

  async clickRowAction(action: string): Promise<void> {
    await clickMenuItem(this.page, action);
  }

  async hasRowAction(action: string): Promise<boolean> {
    const menuitem = this.page.getByRole('menuitem', { name: new RegExp(action, 'i') });
    return menuitem.isVisible().catch(() => false);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Detail Page
  // ═══════════════════════════════════════════════════════════════════════════

  getDetailHeading(name: string): Locator {
    return this.page.getByRole('heading', { name });
  }

  get detailActionsButton(): Locator {
    return this.page.getByRole('button', { name: 'Actions', exact: true });
  }

  async openDetailActions(): Promise<void> {
    await openDetailPageActionsMenu(this.page);
  }

  async hasDetailAction(action: string): Promise<boolean> {
    const menuitem = this.page.getByRole('menuitem', { name: new RegExp(action, 'i') });
    return menuitem.isVisible().catch(() => false);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CRUD Operations
  // ═══════════════════════════════════════════════════════════════════════════

  async fillCreateWizard(name: string, description: string): Promise<void> {
    await fillCreateRoleWizard(this.page, name, description);
  }

  async fillEditModal(newName: string, newDescription: string): Promise<void> {
    const dialog = this.page.getByRole('dialog').first();
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await expect(dialog.getByText('Edit role information')).toBeVisible({ timeout: 5000 });

    const nameInput = dialog.getByLabel(/name/i);
    await nameInput.click();
    await nameInput.selectText();
    await this.page.keyboard.press('Backspace');
    await nameInput.fill(newName);

    const descInput = dialog.getByLabel(/description/i);
    await descInput.click();
    await descInput.selectText();
    await this.page.keyboard.press('Backspace');
    await descInput.fill(newDescription);

    await dialog.getByRole('button', { name: /save/i }).click();
    await expect(dialog).not.toBeVisible({ timeout: 5000 });
  }

  async confirmDelete(): Promise<void> {
    const dialog = this.page.getByRole('dialog').first();
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await expect(dialog.getByRole('heading', { name: /delete role/i })).toBeVisible({ timeout: 10000 });
    await dialog.getByRole('checkbox').click();
    await dialog.getByRole('button', { name: /delete role/i }).click();
    await expect(dialog).not.toBeVisible({ timeout: 10000 });
  }

  async verifySuccess(): Promise<void> {
    await verifySuccessNotification(this.page);
  }
}
