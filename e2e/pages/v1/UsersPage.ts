/**
 * Page Object for V1 Users Page
 *
 * Encapsulates all interactions with the V1 Users page at:
 * /iam/user-access/users
 *
 * V1 uses page navigation for detail views (not drawer like V2).
 * Users are managed externally (SSO), so no CRUD operations.
 */

import { type Locator, type Page, expect } from '@playwright/test';
import { iamUrl, setupPage, v1 } from '../../utils';
import { E2E_TIMEOUTS } from '../../utils/timeouts';
import { TableComponent } from '../components/TableComponent';

const USERS_URL = iamUrl(v1.users.link());

export class UsersPage {
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
      await this.page.goto(USERS_URL, { timeout: E2E_TIMEOUTS.SLOW_DATA });
      await expect(this.heading).toBeVisible({ timeout: E2E_TIMEOUTS.DETAIL_CONTENT });
    }).toPass({ timeout: E2E_TIMEOUTS.SETUP_PAGE_LOAD, intervals: [1_000, 2_000, 5_000] });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Locators
  // ═══════════════════════════════════════════════════════════════════════════

  get heading(): Locator {
    return this.page.getByRole('heading', { name: /users/i, level: 1 });
  }

  get table(): Locator {
    return this.tableComponent.grid;
  }

  get inviteButton(): Locator {
    return this.page.getByRole('button', { name: /invite/i });
  }

  get unauthorizedMessage(): Locator {
    return this.page.getByText(/You do not have access to/i);
  }

  // Columns
  get usernameColumn(): Locator {
    return this.page.getByRole('columnheader', { name: /username/i });
  }

  get statusColumn(): Locator {
    return this.page.getByRole('columnheader', { name: /status/i });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Table Actions
  // ═══════════════════════════════════════════════════════════════════════════

  async searchFor(username: string): Promise<void> {
    await this.tableComponent.search(username);
  }

  async clearSearch(): Promise<void> {
    await this.tableComponent.clearSearch();
  }

  getUserLink(username: string): Locator {
    return this.tableComponent.grid.getByRole('link', { name: username, exact: true });
  }

  async navigateToDetail(username: string): Promise<void> {
    await this.getUserLink(username).click();
    await expect(this.page).toHaveURL(/\/users\//, { timeout: E2E_TIMEOUTS.TABLE_DATA });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Detail Page
  // ═══════════════════════════════════════════════════════════════════════════

  getDetailHeading(username: string): Locator {
    return this.page.getByRole('heading', { name: username });
  }

  async navigateBackToList(): Promise<void> {
    const usersBreadcrumb = this.page.getByRole('link', { name: /users/i });
    if (await usersBreadcrumb.isVisible().catch(() => false)) {
      await usersBreadcrumb.click();
    } else {
      await this.page.goto(USERS_URL);
    }
    await expect(this.heading).toBeVisible();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // User Management (Activate/Deactivate)
  // ═══════════════════════════════════════════════════════════════════════════

  get bulkActionsButton(): import('@playwright/test').Locator {
    return this.tableComponent.bulkActionsButton;
  }

  async selectUserRows(count: number): Promise<void> {
    for (let i = 0; i < count; i++) {
      await this.tableComponent.selectRowByIndex(i);
      await this.page.waitForTimeout(E2E_TIMEOUTS.QUICK_SETTLE);
    }
  }

  async openBulkActions(): Promise<void> {
    await this.tableComponent.openBulkActions();
  }

  async deactivateSelectedUsers(): Promise<void> {
    await this.tableComponent.openBulkActions();
    await this.tableComponent.clickBulkAction(/deactivate/i);

    // Confirm in modal
    const modal = this.page.getByRole('dialog').first();
    await expect(modal).toBeVisible({ timeout: E2E_TIMEOUTS.DIALOG_CONTENT });

    const confirmCheckbox = modal.getByRole('checkbox', { name: /yes, i confirm/i });
    await confirmCheckbox.click();

    await modal.getByRole('button', { name: /deactivate/i }).click();
    await expect(modal).not.toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
  }

  async activateSelectedUsers(): Promise<void> {
    await this.tableComponent.openBulkActions();
    await this.tableComponent.clickBulkAction(/activate/i);

    // Confirm in modal
    const modal = this.page.getByRole('dialog').first();
    await expect(modal).toBeVisible({ timeout: E2E_TIMEOUTS.DIALOG_CONTENT });

    const confirmCheckbox = modal.getByRole('checkbox', { name: /yes, i confirm/i });
    await confirmCheckbox.click();

    await modal.getByRole('button', { name: /activate/i }).click();
    await expect(modal).not.toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // User Invitation
  // ═══════════════════════════════════════════════════════════════════════════

  async openInviteModal(): Promise<void> {
    await this.inviteButton.click();
    await expect(this.page.getByRole('dialog')).toBeVisible({ timeout: E2E_TIMEOUTS.DIALOG_CONTENT });
  }

  async fillInviteForm(emails: string[], options?: { makeOrgAdmin?: boolean }): Promise<void> {
    const modal = this.page.getByRole('dialog').first();
    await expect(modal).toBeVisible({ timeout: E2E_TIMEOUTS.DIALOG_CONTENT });

    // Wait for modal to fully render
    await modal.getByRole('heading', { name: /invite new users/i }).waitFor({ timeout: E2E_TIMEOUTS.DIALOG_CONTENT });

    // Fill emails
    const emailInput = modal.getByRole('textbox', { name: /enter the e-mail addresses/i });
    await emailInput.fill(emails.join(', '));

    // Optional: Make org admin
    if (options?.makeOrgAdmin) {
      const orgAdminCheckbox = modal.getByRole('checkbox', { name: /organization administrators/i });
      await orgAdminCheckbox.click();
    }
  }

  async submitInvite(): Promise<void> {
    const modal = this.page.getByRole('dialog').first();
    const submitButton = modal.getByRole('button', { name: /invite new users/i });
    await expect(submitButton).toBeEnabled({ timeout: E2E_TIMEOUTS.BUTTON_STATE });
    await submitButton.click();
    await expect(modal).not.toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
  }

  async inviteUsers(emails: string[], options?: { makeOrgAdmin?: boolean }): Promise<void> {
    await this.openInviteModal();
    await this.fillInviteForm(emails, options);
    await this.submitInvite();
  }

  async verifySuccess(): Promise<void> {
    await expect(this.page.getByText(/success/i).first()).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
  }
}
