/**
 * Page Object for V1 Groups Page
 *
 * Encapsulates all interactions with the V1 Groups page at:
 * /iam/user-access/groups
 */

import { type Locator, type Page, expect } from '@playwright/test';
import {
  clickMenuItem,
  iamUrl,
  openDetailPageActionsMenu,
  openRowActionsMenu,
  setupPage,
  v1,
  verifySuccessNotification,
  waitForTabContent,
} from '../../utils';
import { E2E_TIMEOUTS } from '../../utils/timeouts';
import { TableComponent } from '../components/TableComponent';

const GROUPS_URL = iamUrl(v1.groups.link());

export class GroupsPage {
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
      await this.page.goto(GROUPS_URL, { timeout: E2E_TIMEOUTS.SLOW_DATA });
      await expect(this.heading).toBeVisible({ timeout: E2E_TIMEOUTS.DETAIL_CONTENT });
    }).toPass({ timeout: E2E_TIMEOUTS.SETUP_PAGE_LOAD, intervals: [1_000, 2_000, 5_000] });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Locators
  // ═══════════════════════════════════════════════════════════════════════════

  get heading(): Locator {
    return this.page.getByRole('heading', { name: 'Groups', exact: true });
  }

  get table(): Locator {
    return this.tableComponent.grid;
  }

  get createButton(): Locator {
    return this.page.getByRole('button', { name: /create group/i });
  }

  get unauthorizedMessage(): Locator {
    return this.page.getByText(/You do not have access to/i);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Table Actions
  // ═══════════════════════════════════════════════════════════════════════════

  async searchFor(name: string): Promise<void> {
    await this.tableComponent.search(name);
  }

  async clearSearch(): Promise<void> {
    await this.tableComponent.clearSearch();
  }

  getGroupRow(name: string): Locator {
    return this.tableComponent.getRow(name);
  }

  getGroupLink(name: string): Locator {
    return this.tableComponent.grid.getByRole('link', { name });
  }

  async verifyGroupInTable(name: string): Promise<void> {
    await this.tableComponent.expectRowVisible(name);
  }

  async verifyGroupNotInTable(name: string): Promise<void> {
    await this.tableComponent.expectRowNotVisible(name);
  }

  async navigateToDetail(name: string): Promise<void> {
    await this.getGroupLink(name).click();
    await expect(this.page).toHaveURL(/\/groups\//);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Row Actions
  // ═══════════════════════════════════════════════════════════════════════════

  async openRowActions(name: string): Promise<void> {
    await openRowActionsMenu(this.page, name);
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

  get membersTab(): Locator {
    return this.page.getByRole('tab', { name: /members/i });
  }

  get rolesTab(): Locator {
    return this.page.getByRole('tab', { name: /roles/i });
  }

  async openDetailActions(): Promise<void> {
    await openDetailPageActionsMenu(this.page);
  }

  async hasDetailAction(action: string): Promise<boolean> {
    const menuitem = this.page.getByRole('menuitem', { name: new RegExp(action, 'i') });
    return menuitem.isVisible().catch(() => false);
  }

  async clickTab(tabName: string): Promise<void> {
    await this.page.getByRole('tab', { name: new RegExp(tabName, 'i') }).click();
    await waitForTabContent(this.page);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Member Management
  // ═══════════════════════════════════════════════════════════════════════════

  get addMemberButton(): Locator {
    return this.page.getByRole('button', { name: /add member/i });
  }

  get memberBulkActionsButton(): Locator {
    return this.page.getByRole('button', { name: /member bulk actions/i });
  }

  async openAddMembersModal(): Promise<void> {
    await this.addMemberButton.click();
    await expect(this.page.getByRole('dialog')).toBeVisible({ timeout: E2E_TIMEOUTS.DIALOG_CONTENT });
  }

  async selectMembersInModal(count: number): Promise<void> {
    const modal = this.page.getByRole('dialog', { name: /add members/i });
    await expect(modal).toBeVisible({ timeout: E2E_TIMEOUTS.DIALOG_CONTENT });

    // Scope to modal so grid getter finds the single grid inside it
    const modalTable = new TableComponent(this.page, modal);
    await expect(modalTable.grid).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });

    for (let i = 0; i < count; i++) {
      await modalTable.selectRowByIndex(i);
    }
  }

  async submitAddMembersModal(): Promise<void> {
    const addMembersModal = this.page.getByRole('dialog', { name: /add members/i });
    const submitButton = addMembersModal.getByRole('button', { name: /add to group/i });

    await expect(submitButton).toBeEnabled({ timeout: E2E_TIMEOUTS.BUTTON_STATE });
    await submitButton.click();

    await expect(this.page.getByRole('dialog', { name: /add members/i })).not.toBeVisible({ timeout: E2E_TIMEOUTS.SLOW_DATA });
  }

  async addMembersToGroup(count: number): Promise<void> {
    await this.openAddMembersModal();
    await this.selectMembersInModal(count);
    await this.submitAddMembersModal();
  }

  async selectMemberRows(count: number): Promise<void> {
    // Use page-scoped TableComponent — container must be a parent, not the grid itself
    const membersTableComponent = new TableComponent(this.page);
    for (let i = 0; i < count; i++) {
      await membersTableComponent.selectRowByIndex(i);
      await this.page.waitForTimeout(E2E_TIMEOUTS.QUICK_SETTLE);
    }
  }

  async removeMembersFromGroup(count: number): Promise<void> {
    await this.selectMemberRows(count);
    await this.memberBulkActionsButton.click();
    await this.page.getByRole('menuitem', { name: /remove/i }).click();

    // Confirm removal
    const confirmDialog = this.page.getByRole('dialog').first();
    await expect(confirmDialog).toBeVisible({ timeout: E2E_TIMEOUTS.DIALOG_CONTENT });
    await confirmDialog.getByRole('button', { name: /remove/i }).click();
    await expect(confirmDialog).not.toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Role Management
  // ═══════════════════════════════════════════════════════════════════════════

  get addRoleButton(): Locator {
    return this.page.getByRole('button', { name: /add role/i });
  }

  get roleBulkActionsButton(): Locator {
    return this.page.getByRole('button', { name: /role bulk actions/i }).or(this.page.getByRole('button', { name: /actions/i }).first());
  }

  async openAddRolesModal(): Promise<void> {
    await this.addRoleButton.click();
    await expect(this.page.getByRole('dialog')).toBeVisible({ timeout: E2E_TIMEOUTS.DIALOG_CONTENT });
  }

  async selectRolesInModal(count: number): Promise<void> {
    const modal = this.page.getByRole('dialog', { name: /add roles/i });
    await expect(modal).toBeVisible({ timeout: E2E_TIMEOUTS.DIALOG_CONTENT });

    // Scope to modal so grid getter finds the single grid inside it
    const modalTable = new TableComponent(this.page, modal);
    await expect(modalTable.grid).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });

    for (let i = 0; i < count; i++) {
      await modalTable.selectRowByIndex(i);
    }
  }

  async submitAddRolesModal(): Promise<void> {
    const modal = this.page.getByRole('dialog', { name: /add roles/i });
    const submitButton = modal.getByRole('button', { name: /add to group/i });

    await expect(submitButton).toBeEnabled({ timeout: E2E_TIMEOUTS.BUTTON_STATE });
    await submitButton.click();

    await expect(this.page.getByRole('dialog', { name: /add roles/i })).not.toBeVisible({ timeout: E2E_TIMEOUTS.SLOW_DATA });
  }

  async addRolesToGroup(count: number): Promise<void> {
    await this.openAddRolesModal();
    await this.selectRolesInModal(count);
    await this.submitAddRolesModal();
  }

  async selectRoleRows(count: number): Promise<void> {
    // Use page-scoped TableComponent — container must be a parent, not the grid itself
    const rolesTableComponent = new TableComponent(this.page);
    await expect(rolesTableComponent.grid).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
    for (let i = 0; i < count; i++) {
      await rolesTableComponent.selectRowByIndex(i);
    }
  }

  async removeRolesFromGroup(): Promise<void> {
    await this.page.getByRole('button', { name: 'bulk actions' }).click();
    await this.page.getByRole('menuitem', { name: /remove/i }).click();
    await this.page
      .getByRole('dialog')
      .getByRole('button', { name: /remove role/i })
      .click();
    await expect(this.page.getByRole('dialog')).not.toBeVisible({ timeout: E2E_TIMEOUTS.MUTATION_COMPLETE });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CRUD Operations (for admin tests)
  // ═══════════════════════════════════════════════════════════════════════════

  async fillCreateWizard(name: string, description: string): Promise<void> {
    // Dialog opens via URL routing - wait for URL and wizard to appear
    await this.page.waitForURL(/add-group/, { timeout: E2E_TIMEOUTS.TABLE_DATA });
    await expect(this.page.locator('[data-ouia-component-id="add-group-wizard"]')).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });

    // Helper to click wizard Next button - always use fresh locator
    const clickWizardNext = async () => {
      const footerNext = this.page
        .locator('[data-ouia-component-id="add-group-wizard"]')
        .locator('footer, [class*="wizard__footer"]')
        .getByRole('button', { name: /next/i });

      await expect(footerNext).toBeEnabled({ timeout: E2E_TIMEOUTS.TABLE_DATA });
      await footerNext.click();
    };

    // Step 1: Name & Description - scope to wizard to avoid conflicts
    const wizard = this.page.locator('[data-ouia-component-id="add-group-wizard"]');

    const nameInput = wizard.locator('#group-name');
    await expect(nameInput).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
    await nameInput.fill(name);
    await nameInput.blur();

    await this.page.waitForTimeout(E2E_TIMEOUTS.MENU_ANIMATION);

    // Description - there are 2 textareas (DDF hidden + SetName visible), use first()
    const descInput = wizard.locator('textarea').first();
    await expect(descInput).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
    await descInput.fill(description);

    await clickWizardNext();

    // Step 2: Roles — scope to wizard (container must be parent, not the grid itself)
    const wizardRolesTable = new TableComponent(this.page, wizard);
    await expect(wizardRolesTable.grid).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
    await wizardRolesTable.selectRowByIndex(0);
    await clickWizardNext();

    // Step 3: Members — scope to wizard (container must be parent, not the grid itself)
    const wizardMembersTable = new TableComponent(this.page, wizard);
    await expect(wizardMembersTable.grid).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
    await wizardMembersTable.selectRowByIndex(0);
    await clickWizardNext();

    // Step 4: Service Accounts (optional)
    try {
      const serviceAccountsHeading = wizard.getByRole('heading', { name: /service account/i });
      await expect(serviceAccountsHeading).toBeVisible({ timeout: E2E_TIMEOUTS.DRAWER_ANIMATION });
      const saCheckbox = wizard.getByRole('checkbox', { name: /select row 0/i });
      if (await saCheckbox.isVisible({ timeout: E2E_TIMEOUTS.MENU_ANIMATION }).catch(() => false)) {
        await saCheckbox.click();
      }
      await clickWizardNext();
    } catch {
      // No service accounts step or already past it
    }

    // Final: Submit
    await this.page.waitForFunction(
      () => {
        const wiz = document.querySelector('[data-ouia-component-id="add-group-wizard"]');
        const mainContent = wiz?.querySelector('.pf-v6-c-wizard__main-body, .pf-v6-c-wizard__main');
        return mainContent && /review/i.test(mainContent.textContent || '');
      },
      { timeout: E2E_TIMEOUTS.TABLE_DATA },
    );

    const createButton = wizard
      .getByRole('button')
      .filter({ hasText: /create|submit|finish/i })
      .first();
    await createButton.click();
    await expect(wizard).not.toBeVisible({ timeout: E2E_TIMEOUTS.MUTATION_COMPLETE });
  }

  async fillEditModal(newName: string, newDescription: string): Promise<void> {
    const dialog = this.page.getByRole('dialog').first();
    await expect(dialog).toBeVisible({ timeout: E2E_TIMEOUTS.DIALOG_CONTENT });
    await this.page.waitForTimeout(E2E_TIMEOUTS.MENU_ANIMATION);

    const textboxes = dialog.getByRole('textbox');
    await textboxes.nth(0).click();
    await textboxes.nth(0).selectText();
    await this.page.keyboard.press('Backspace');
    await textboxes.nth(0).fill(newName);

    await textboxes.nth(1).click();
    await textboxes.nth(1).selectText();
    await this.page.keyboard.press('Backspace');
    await textboxes.nth(1).fill(newDescription);

    await dialog.getByRole('button', { name: /save/i }).click();
    await expect(dialog).not.toBeVisible({ timeout: E2E_TIMEOUTS.DIALOG_CONTENT });
  }

  async confirmDelete(groupName: string): Promise<void> {
    const dialog = this.page.getByRole('dialog').first();
    await expect(dialog).toBeVisible({ timeout: E2E_TIMEOUTS.DIALOG_CONTENT });
    await expect(dialog.getByRole('heading', { name: new RegExp(groupName, 'i') })).toBeVisible({ timeout: E2E_TIMEOUTS.SLOW_DATA });
    await dialog.getByRole('button', { name: /remove/i }).click();
    await expect(dialog).not.toBeVisible({ timeout: E2E_TIMEOUTS.MUTATION_COMPLETE });
  }

  async verifySuccess(): Promise<void> {
    await verifySuccessNotification(this.page);
  }
}
