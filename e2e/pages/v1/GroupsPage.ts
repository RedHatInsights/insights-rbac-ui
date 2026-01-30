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
  // CRUD Operations (for admin tests)
  // ═══════════════════════════════════════════════════════════════════════════

  async fillCreateWizard(name: string, description: string): Promise<void> {
    const wizard = this.page.locator('[data-ouia-component-id="add-group-wizard"]');
    await expect(wizard).toBeVisible({ timeout: 10000 });

    // Helper to click wizard Next button
    const clickNext = async () => {
      const nextButtons = wizard.getByRole('button', { name: /next/i });
      const count = await nextButtons.count();
      for (let i = 0; i < count; i++) {
        const btn = nextButtons.nth(i);
        const isInPagination = await btn.evaluate((el) => !!el.closest('.pf-v6-c-pagination'));
        if (isInPagination) continue;
        const isDisabled = await btn.evaluate((el) => el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true');
        if (isDisabled) continue;
        await btn.click();
        return;
      }
      throw new Error('No enabled Next button found');
    };

    // Step 1: Name & Description
    await this.page.locator('#group-name').fill(name);
    const descInput = this.page.locator('#group-description').first();
    if (await descInput.isVisible().catch(() => false)) {
      await descInput.fill(description);
    }
    await this.page.waitForTimeout(500);
    await clickNext();

    // Step 2: Roles
    await this.page.waitForFunction(
      () => {
        const checkboxes = document.querySelectorAll('[data-ouia-component-id="add-group-wizard"] [role="checkbox"]');
        return checkboxes.length > 1;
      },
      { timeout: 8000 },
    );
    await wizard.getByRole('checkbox').nth(1).click();
    await clickNext();

    // Step 3: Members
    await this.page.waitForFunction(
      () => {
        const checkboxes = document.querySelectorAll('[data-ouia-component-id="add-group-wizard"] [role="checkbox"]');
        return checkboxes.length > 1;
      },
      { timeout: 8000 },
    );
    await wizard.getByRole('checkbox').nth(1).click();
    await clickNext();

    // Step 4: Service Accounts (optional)
    try {
      await this.page.waitForFunction(
        () => {
          const wizard = document.querySelector('[data-ouia-component-id="add-group-wizard"]');
          return wizard && /service account/i.test(wizard.textContent || '');
        },
        { timeout: 3000 },
      );
      await this.page.waitForFunction(
        () => {
          const checkboxes = document.querySelectorAll('[data-ouia-component-id="add-group-wizard"] [role="checkbox"]');
          return checkboxes.length > 1;
        },
        { timeout: 8000 },
      );
      await wizard.getByRole('checkbox').nth(1).click();
      await clickNext();
    } catch {
      // No service accounts step
    }

    // Final: Submit
    await this.page.waitForFunction(
      () => {
        const wizard = document.querySelector('[data-ouia-component-id="add-group-wizard"]');
        const mainContent = wizard?.querySelector('.pf-v6-c-wizard__main-body, .pf-v6-c-wizard__main');
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
