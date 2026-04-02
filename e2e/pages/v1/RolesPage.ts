/**
 * Page Object for V1 Roles Page
 *
 * Encapsulates all interactions with the V1 Roles page at:
 * /iam/user-access/roles
 */

import { type Locator, type Page, expect } from '@playwright/test';
import { clickMenuItem, iamUrl, openDetailPageActionsMenu, openRoleActionsMenu, setupPage, v1, verifySuccessNotification } from '../../utils';
import { fillCreateRoleWizard, fillCreateRoleWizardAsCopy, searchForRole, verifyRoleInTable, verifyRoleNotInTable } from '../../utils/roleHelpers';
import { E2E_TIMEOUTS } from '../../utils/timeouts';
import { TableComponent } from '../components/TableComponent';

const ROLES_URL = iamUrl(v1.roles.link());

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
    return this.page.getByRole('heading', { name: 'Roles', exact: true });
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

  getRoleRow(name: string): Locator {
    return this.tableComponent.getRow(name);
  }

  getRoleLink(name: string): Locator {
    return this.tableComponent.grid.getByRole('link', { name });
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

  async fillCreateWizard(name: string, description: string, workspaceName?: string): Promise<void> {
    await fillCreateRoleWizard(this.page, name, description, workspaceName);
  }

  async fillCreateWizardAsCopy(
    newRoleName: string,
    sourceRoleName?: string,
    workspaceName?: string,
    description?: string,
  ): Promise<{ sourceRoleName: string }> {
    return fillCreateRoleWizardAsCopy(this.page, newRoleName, sourceRoleName, workspaceName, description);
  }

  async fillEditModal(newName: string, newDescription: string): Promise<void> {
    const dialog = this.page.getByRole('dialog').first();
    await expect(dialog).toBeVisible({ timeout: E2E_TIMEOUTS.DIALOG_CONTENT });
    await expect(dialog.getByText('Edit role information')).toBeVisible({ timeout: E2E_TIMEOUTS.DIALOG_CONTENT });

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
    await expect(dialog).not.toBeVisible({ timeout: E2E_TIMEOUTS.DIALOG_CONTENT });
  }

  async confirmDelete(): Promise<void> {
    const dialog = this.page.getByRole('dialog').first();
    await expect(dialog).toBeVisible({ timeout: E2E_TIMEOUTS.DIALOG_CONTENT });
    await expect(dialog.getByRole('heading', { name: /delete role/i })).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
    await dialog.getByRole('checkbox').click();
    await dialog.getByRole('button', { name: /delete role/i }).click();
    await expect(dialog).not.toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
  }

  async verifySuccess(): Promise<void> {
    await verifySuccessNotification(this.page);
  }
}
