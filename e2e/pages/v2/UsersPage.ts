/**
 * Page Object for V2 Users Page
 *
 * Encapsulates all interactions with the V2 Users page at:
 * /iam/access-management/users-and-user-groups/users
 *
 * Design principles:
 * - Methods return promises for async operations
 * - Getters return locators for assertions
 * - No test assertions inside - that's the spec's job
 */

import { type Locator, type Page, expect } from '@playwright/test';
import { setupPage, waitForTableUpdate } from '../../utils';

const USERS_URL = '/iam/access-management/users-and-user-groups/users';

export class UsersPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Navigation
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Navigate to the Users page and wait for it to load
   */
  async goto(): Promise<void> {
    await setupPage(this.page);
    await this.page.goto(USERS_URL);
    await expect(this.heading).toBeVisible();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Locators (getters for assertions)
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
    return this.page.getByRole('button', { name: /invite users/i });
  }

  get addToGroupButton(): Locator {
    return this.page.getByRole('button', { name: /add to user group/i });
  }

  get drawer(): Locator {
    return this.page.locator('[data-ouia-component-id="user-details-drawer"]');
  }

  get modal(): Locator {
    return this.page.getByRole('dialog');
  }

  get unauthorizedMessage(): Locator {
    return this.page.getByText(/You do not have access to/i);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Column Headers
  // ═══════════════════════════════════════════════════════════════════════════

  get usernameColumn(): Locator {
    return this.page.getByRole('columnheader', { name: /username/i });
  }

  get emailColumn(): Locator {
    return this.page.getByRole('columnheader', { name: /email/i });
  }

  get statusColumn(): Locator {
    return this.page.getByRole('columnheader', { name: /status/i });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Actions
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Filter users by username
   */
  async filterByUsername(username: string): Promise<void> {
    await this.searchInput.fill(username);
    await waitForTableUpdate(this.page);
  }

  /**
   * Clear the search filter
   */
  async clearFilter(): Promise<void> {
    await this.searchInput.clear();
    await waitForTableUpdate(this.page);
  }

  /**
   * Get a user row by username (exact match)
   */
  getUserRow(username: string): Locator {
    return this.table.getByText(username, { exact: true });
  }

  /**
   * Click on a user row to open the details drawer
   */
  async openUserDrawer(username: string): Promise<void> {
    await this.getUserRow(username).click();
    await expect(this.drawer).toBeVisible({ timeout: 10000 });
  }

  /**
   * Close the user details drawer by clicking the same row
   */
  async closeUserDrawer(username: string): Promise<void> {
    await this.getUserRow(username).click();
    await expect(this.drawer).not.toBeVisible({ timeout: 5000 });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Drawer Interactions
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get a tab in the drawer
   */
  getDrawerTab(name: string): Locator {
    return this.drawer.getByRole('tab', { name: new RegExp(name, 'i') });
  }

  /**
   * Click a tab in the drawer
   */
  async clickDrawerTab(name: string): Promise<void> {
    await this.getDrawerTab(name).click();
    // Wait for tab content to load
    await expect(this.drawer.locator('[role="tabpanel"]').or(this.drawer.locator('.pf-v6-c-tab-content'))).toBeVisible({ timeout: 5000 });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Invite Users Flow
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Open the invite users modal
   */
  async openInviteModal(): Promise<void> {
    await this.inviteButton.click();
    await expect(this.modal).toBeVisible({ timeout: 5000 });
    await expect(this.page.getByRole('heading', { name: /invite new users/i })).toBeVisible();
  }

  /**
   * Fill in the invite form
   */
  async fillInviteForm(options: { email: string; message?: string }): Promise<void> {
    const emailInput = this.page.getByRole('textbox', { name: /enter the e-mail addresses/i });
    await emailInput.fill(options.email);

    if (options.message) {
      const messageInput = this.page.getByRole('textbox', { name: /send a message with the invite/i });
      if (await messageInput.isVisible()) {
        await messageInput.fill(options.message);
      }
    }
  }

  /**
   * Submit the invite form
   */
  async submitInvite(): Promise<void> {
    const submitButton = this.page.getByRole('button', { name: /invite new users/i });
    await expect(submitButton).toBeEnabled();
    await submitButton.click();
    // Wait for modal to close (indicates success)
    await expect(this.modal).not.toBeVisible({ timeout: 10000 });
  }

  /**
   * Complete invite flow: open modal, fill form, submit
   */
  async inviteUser(email: string, message?: string): Promise<void> {
    await this.openInviteModal();
    await this.fillInviteForm({ email, message });
    await this.submitInvite();
  }
}
