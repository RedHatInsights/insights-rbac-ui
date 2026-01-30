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
import { setupPage, waitForTableUpdate } from '../../utils';

const USERS_URL = '/iam/user-access/users';

export class UsersPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Navigation
  // ═══════════════════════════════════════════════════════════════════════════

  async goto(): Promise<void> {
    await setupPage(this.page);
    await this.page.goto(USERS_URL);
    await expect(this.heading).toBeVisible();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Locators
  // ═══════════════════════════════════════════════════════════════════════════

  get heading(): Locator {
    return this.page.getByRole('heading', { name: /users/i });
  }

  get table(): Locator {
    return this.page.getByRole('grid');
  }

  get searchInput(): Locator {
    return this.page.getByRole('searchbox').or(this.page.getByPlaceholder(/filter|search/i));
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
    await this.searchInput.clear();
    await this.searchInput.fill(username);
    await waitForTableUpdate(this.page);
  }

  async clearSearch(): Promise<void> {
    await this.searchInput.clear();
    await waitForTableUpdate(this.page);
  }

  getUserLink(username: string): Locator {
    return this.table.getByRole('link', { name: username, exact: true });
  }

  async navigateToDetail(username: string): Promise<void> {
    await this.getUserLink(username).click();
    await expect(this.page).toHaveURL(/\/users\//, { timeout: 10000 });
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

  get bulkActionsButton(): Locator {
    return this.page.getByRole('button', { name: /kebab dropdown toggle/i });
  }

  async selectUserRows(count: number): Promise<void> {
    for (let i = 0; i < count; i++) {
      await this.page.getByRole('checkbox', { name: new RegExp(`select row ${i}`, 'i') }).click();
      await this.page.waitForTimeout(200);
    }
  }

  async openBulkActions(): Promise<void> {
    await this.bulkActionsButton.click();
    await this.page.waitForTimeout(300);
  }

  async deactivateSelectedUsers(): Promise<void> {
    await this.openBulkActions();
    await this.page.getByRole('menuitem', { name: /deactivate/i }).click();

    // Confirm in modal
    const modal = this.page.getByRole('dialog').first();
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Check the confirmation checkbox
    const confirmCheckbox = modal.getByRole('checkbox', { name: /yes, i confirm/i });
    await confirmCheckbox.click();

    // Click deactivate button
    await modal.getByRole('button', { name: /deactivate/i }).click();
    await expect(modal).not.toBeVisible({ timeout: 10000 });
  }

  async activateSelectedUsers(): Promise<void> {
    await this.openBulkActions();
    await this.page.getByRole('menuitem', { name: /activate/i }).click();

    // Confirm in modal
    const modal = this.page.getByRole('dialog').first();
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Check the confirmation checkbox
    const confirmCheckbox = modal.getByRole('checkbox', { name: /yes, i confirm/i });
    await confirmCheckbox.click();

    // Click activate button
    await modal.getByRole('button', { name: /activate/i }).click();
    await expect(modal).not.toBeVisible({ timeout: 10000 });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // User Invitation
  // ═══════════════════════════════════════════════════════════════════════════

  async openInviteModal(): Promise<void> {
    await this.inviteButton.click();
    await expect(this.page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
  }

  async fillInviteForm(emails: string[], options?: { message?: string; makeOrgAdmin?: boolean }): Promise<void> {
    const modal = this.page.getByRole('dialog').first();
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Wait for modal to fully render
    await modal.getByRole('heading', { name: /invite new users/i }).waitFor({ timeout: 5000 });

    // Fill emails
    const emailInput = modal.getByRole('textbox', { name: /enter the e-mail addresses/i });
    await emailInput.fill(emails.join(', '));

    // Optional: Add message
    if (options?.message) {
      const messageInput = modal.getByRole('textbox', { name: /send a message/i });
      await messageInput.fill(options.message);
    }

    // Optional: Make org admin
    if (options?.makeOrgAdmin) {
      const orgAdminCheckbox = modal.getByRole('checkbox', { name: /organization administrators/i });
      await orgAdminCheckbox.click();
    }
  }

  async submitInvite(): Promise<void> {
    const modal = this.page.getByRole('dialog').first();
    const submitButton = modal.getByRole('button', { name: /invite new users/i });
    await expect(submitButton).toBeEnabled({ timeout: 5000 });
    await submitButton.click();
    await expect(modal).not.toBeVisible({ timeout: 10000 });
  }

  async inviteUsers(emails: string[], options?: { message?: string; makeOrgAdmin?: boolean }): Promise<void> {
    await this.openInviteModal();
    await this.fillInviteForm(emails, options);
    await this.submitInvite();
  }

  async verifySuccess(): Promise<void> {
    await expect(this.page.getByText(/success/i).first()).toBeVisible({ timeout: 10000 });
  }
}
