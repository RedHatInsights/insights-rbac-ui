/**
 * Page Object for V1 Groups Page
 *
 * Encapsulates all interactions with the V1 Groups page at:
 * /iam/user-access/groups
 */

import { type Locator, type Page, expect } from '@playwright/test';
import {
  clickMenuItem,
  openDetailPageActionsMenu,
  openRowActionsMenu,
  setupPage,
  verifySuccessNotification,
  waitForTabContent,
  waitForTableUpdate,
} from '../../utils';

const GROUPS_URL = '/iam/user-access/groups';

export class GroupsPage {
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
    return this.page.getByRole('heading', { name: 'Groups', exact: true });
  }

  get table(): Locator {
    return this.page.getByRole('grid');
  }

  get searchInput(): Locator {
    return this.page.getByRole('searchbox').or(this.page.getByPlaceholder(/filter|search/i));
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
    await this.searchInput.clear();
    await this.searchInput.fill(name);
    await waitForTableUpdate(this.page);
  }

  async clearSearch(): Promise<void> {
    await this.searchInput.clear();
    await waitForTableUpdate(this.page);
  }

  getGroupRow(name: string): Locator {
    return this.table.getByRole('row', { name: new RegExp(name, 'i') });
  }

  getGroupLink(name: string): Locator {
    return this.table.getByRole('link', { name });
  }

  async verifyGroupInTable(name: string): Promise<void> {
    await expect(this.getGroupRow(name)).toBeVisible({ timeout: 10000 });
  }

  async verifyGroupNotInTable(name: string): Promise<void> {
    await expect(this.getGroupRow(name)).not.toBeVisible({ timeout: 10000 });
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
    await expect(this.page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
  }

  async selectMembersInModal(count: number): Promise<void> {
    const modal = this.page.getByRole('dialog', { name: /add members/i });
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Wait for table rows to appear
    const table = modal.getByRole('grid', { name: /users/i });
    await expect(table).toBeVisible({ timeout: 10000 });

    // Select members by clicking row checkboxes - use fresh locators each time
    for (let i = 0; i < count; i++) {
      // Re-query the checkbox each iteration to avoid stale references
      const checkbox = modal.getByRole('checkbox', { name: new RegExp(`select row ${i}`, 'i') });
      await checkbox.click();
    }
  }

  async submitAddMembersModal(): Promise<void> {
    // Use the specific modal title to identify this dialog
    const addMembersModal = this.page.getByRole('dialog', { name: /add members/i });
    const submitButton = addMembersModal.getByRole('button', { name: /add to group/i });

    await expect(submitButton).toBeEnabled({ timeout: 5000 });
    await submitButton.click();

    // Wait for this specific modal to close - use the same locator, not a stored reference
    await expect(this.page.getByRole('dialog', { name: /add members/i })).not.toBeVisible({ timeout: 30000 });
  }

  async addMembersToGroup(count: number): Promise<void> {
    await this.openAddMembersModal();
    await this.selectMembersInModal(count);
    await this.submitAddMembersModal();
  }

  async selectMemberRows(count: number): Promise<void> {
    const table = this.page.getByRole('grid').first();
    for (let i = 0; i < count; i++) {
      await table.getByRole('checkbox', { name: new RegExp(`select row ${i}`, 'i') }).click();
      await this.page.waitForTimeout(200);
    }
  }

  async removeMembersFromGroup(count: number): Promise<void> {
    await this.selectMemberRows(count);
    await this.memberBulkActionsButton.click();
    await this.page.getByRole('menuitem', { name: /remove/i }).click();

    // Confirm removal
    const confirmDialog = this.page.getByRole('dialog').first();
    await expect(confirmDialog).toBeVisible({ timeout: 5000 });
    await confirmDialog.getByRole('button', { name: /remove/i }).click();
    await expect(confirmDialog).not.toBeVisible({ timeout: 10000 });
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
    await expect(this.page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
  }

  async selectRolesInModal(count: number): Promise<void> {
    const modal = this.page.getByRole('dialog', { name: /add roles/i });
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Wait for table to appear
    const table = modal.getByRole('grid', { name: /roles/i });
    await expect(table).toBeVisible({ timeout: 10000 });

    // Select roles by clicking row checkboxes - use fresh locators each time
    for (let i = 0; i < count; i++) {
      const checkbox = modal.getByRole('checkbox', { name: new RegExp(`select row ${i}`, 'i') });
      await checkbox.click();
    }
  }

  async submitAddRolesModal(): Promise<void> {
    const modal = this.page.getByRole('dialog', { name: /add roles/i });
    const submitButton = modal.getByRole('button', { name: /add to group/i });

    await expect(submitButton).toBeEnabled({ timeout: 5000 });
    await submitButton.click();

    // Wait for this specific modal to close - fresh locator
    await expect(this.page.getByRole('dialog', { name: /add roles/i })).not.toBeVisible({ timeout: 30000 });
  }

  async addRolesToGroup(count: number): Promise<void> {
    await this.openAddRolesModal();
    await this.selectRolesInModal(count);
    await this.submitAddRolesModal();
  }

  async selectRoleRows(count: number): Promise<void> {
    // Wait for roles table to be visible
    await expect(this.page.getByRole('grid')).toBeVisible({ timeout: 5000 });

    // Select rows using fresh locators each time
    for (let i = 0; i < count; i++) {
      const checkbox = this.page.getByRole('checkbox', { name: new RegExp(`select row ${i}`, 'i') });
      await checkbox.click();
    }
  }

  async removeRolesFromGroup(): Promise<void> {
    // Click the bulk actions button (specific name to avoid strict mode violation)
    await this.page.getByRole('button', { name: 'bulk actions' }).click();

    // Click "Remove" from the dropdown menu
    await this.page.getByRole('menuitem', { name: /remove/i }).click();

    // Click confirm button in the modal - button text is "Remove role"
    await this.page
      .getByRole('dialog')
      .getByRole('button', { name: /remove role/i })
      .click();

    // Wait for dialog to close
    await expect(this.page.getByRole('dialog')).not.toBeVisible({ timeout: 15000 });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CRUD Operations (for admin tests)
  // ═══════════════════════════════════════════════════════════════════════════

  async fillCreateWizard(name: string, description: string): Promise<void> {
    // Dialog opens via URL routing - wait for URL and wizard to appear
    await this.page.waitForURL(/add-group/, { timeout: 10000 });
    await expect(this.page.locator('[data-ouia-component-id="add-group-wizard"]')).toBeVisible({ timeout: 10000 });

    // Helper to click wizard Next button - always use fresh locator
    const clickWizardNext = async () => {
      // Find Next button that's NOT in pagination - use contentinfo (footer) region
      const footerNext = this.page
        .locator('[data-ouia-component-id="add-group-wizard"]')
        .locator('footer, [class*="wizard__footer"]')
        .getByRole('button', { name: /next/i });

      await expect(footerNext).toBeEnabled({ timeout: 10000 });
      await footerNext.click();
    };

    // Step 1: Name & Description - scope to wizard to avoid conflicts
    const wizard = this.page.locator('[data-ouia-component-id="add-group-wizard"]');

    // Name input - fill and blur to trigger validation
    const nameInput = wizard.locator('#group-name');
    await expect(nameInput).toBeVisible({ timeout: 5000 });
    await nameInput.fill(name);
    await nameInput.blur();

    // Wait for validation to settle
    await this.page.waitForTimeout(500);

    // Description - there are 2 textareas (DDF hidden + SetName visible), use first()
    const descInput = wizard.locator('textarea').first();
    await expect(descInput).toBeVisible({ timeout: 5000 });
    await descInput.fill(description);

    // Wait for Next to enable then click
    await clickWizardNext();

    // Step 2: Roles - wait for table, select first role (scope to wizard)
    await expect(wizard.getByRole('grid', { name: /roles/i })).toBeVisible({ timeout: 10000 });
    await wizard.getByRole('checkbox', { name: /select row 0/i }).click();
    await clickWizardNext();

    // Step 3: Members - wait for table, select first member (scope to wizard)
    await expect(wizard.getByRole('grid', { name: /users|members/i })).toBeVisible({ timeout: 10000 });
    await wizard.getByRole('checkbox', { name: /select row 0/i }).click();
    await clickWizardNext();

    // Step 4: Service Accounts (optional) - try to select one if the step exists
    try {
      const serviceAccountsHeading = wizard.getByRole('heading', { name: /service account/i });
      await expect(serviceAccountsHeading).toBeVisible({ timeout: 3000 });
      // If we're on service accounts step, select one and continue (scope to wizard)
      const saCheckbox = wizard.getByRole('checkbox', { name: /select row 0/i });
      if (await saCheckbox.isVisible({ timeout: 2000 }).catch(() => false)) {
        await saCheckbox.click();
      }
      await clickWizardNext();
    } catch {
      // No service accounts step or already past it
    }

    // Final: Submit - wait for review step and click create
    await this.page.waitForFunction(
      () => {
        const wiz = document.querySelector('[data-ouia-component-id="add-group-wizard"]');
        const mainContent = wiz?.querySelector('.pf-v6-c-wizard__main-body, .pf-v6-c-wizard__main');
        return mainContent && /review/i.test(mainContent.textContent || '');
      },
      { timeout: 8000 },
    );

    const createButton = wizard
      .getByRole('button')
      .filter({ hasText: /create|submit|finish/i })
      .first();
    await createButton.click();
    await expect(wizard).not.toBeVisible({ timeout: 15000 });
  }

  async fillEditModal(newName: string, newDescription: string): Promise<void> {
    const dialog = this.page.getByRole('dialog').first();
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await this.page.waitForTimeout(500);

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
    await expect(dialog).not.toBeVisible({ timeout: 5000 });
  }

  async confirmDelete(groupName: string): Promise<void> {
    const dialog = this.page.getByRole('dialog').first();
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await expect(dialog.getByRole('heading', { name: new RegExp(groupName, 'i') })).toBeVisible({ timeout: 30000 });
    await dialog.getByRole('button', { name: /remove/i }).click();
    await expect(dialog).not.toBeVisible({ timeout: 15000 });
  }

  async verifySuccess(): Promise<void> {
    await verifySuccessNotification(this.page);
  }
}
