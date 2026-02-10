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
import { E2E_TIMEOUTS } from '../../utils/timeouts';

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
    await expect(this.heading).toBeVisible({ timeout: E2E_TIMEOUTS.SETUP_PAGE_LOAD });
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

  get actionsMenu(): Locator {
    return this.page.getByRole('button', { name: /actions overflow menu/i });
  }

  get inviteMenuItem(): Locator {
    return this.page.getByRole('menuitem', { name: /invite users/i });
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
    return this.table.getByRole('row').filter({ hasText: username });
  }

  /**
   * Get the username cell/text in a row (for clicking to open drawer)
   */
  getUsernameCell(username: string): Locator {
    return this.table.getByRole('gridcell', { name: username, exact: true });
  }

  /**
   * Click on a user row to open the details drawer.
   * Waits for drawer content to appear (the "Assigned roles" tab is unique to the drawer).
   */
  async openUserDrawer(username: string): Promise<void> {
    const userRow = this.getUserRow(username);
    await userRow.click();
    // The drawer is open when the user can see its content — "Assigned roles" tab is unique to the panel
    await expect(this.page.getByRole('tab', { name: /assigned roles/i })).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
  }

  /**
   * Close the user details drawer by clicking the close button.
   * Waits for drawer content to disappear.
   */
  async closeUserDrawer(_username: string): Promise<void> {
    await this.page.getByRole('button', { name: /close drawer panel/i }).click();
    // The drawer is closed when its content is no longer visible
    await expect(this.page.getByRole('tab', { name: /assigned roles/i })).not.toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Drawer Interactions
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get the drawer's tablist — scoped by finding the tablist that contains "Assigned roles"
   * (unique to the drawer, not present in the main page tabs).
   */
  get drawerTablist(): Locator {
    return this.page.getByRole('tablist').filter({ has: this.page.getByRole('tab', { name: /assigned roles/i }) });
  }

  /**
   * Get a tab in the drawer
   */
  getDrawerTab(name: string): Locator {
    return this.drawerTablist.getByRole('tab', { name: new RegExp(name, 'i') });
  }

  /**
   * Click a tab in the drawer and wait for its content to load
   */
  async clickDrawerTab(name: string): Promise<void> {
    const tab = this.getDrawerTab(name);
    await tab.click();
    // Wait for the tab to become selected
    await expect(tab).toHaveAttribute('aria-selected', 'true', { timeout: E2E_TIMEOUTS.DIALOG_CONTENT });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Invite Users Flow
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Open the invite users modal (via Actions dropdown menu)
   */
  async openInviteModal(): Promise<void> {
    await this.actionsMenu.click();
    await expect(this.inviteMenuItem).toBeVisible({ timeout: E2E_TIMEOUTS.MENU_ANIMATION });
    await this.inviteMenuItem.click();
    await expect(this.modal).toBeVisible({ timeout: E2E_TIMEOUTS.DIALOG_CONTENT });
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
    await expect(this.modal).not.toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
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
