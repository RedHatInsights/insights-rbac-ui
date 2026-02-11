/**
 * Page Object for V2 User Groups Page
 *
 * Encapsulates all interactions with the V2 User Groups page at:
 * /iam/access-management/users-and-user-groups/user-groups
 *
 * V2 Differences from V1:
 * - View details: Uses drawer (row click), not page navigation
 * - Create/Edit: Uses full page form, not wizard/modal
 * - Membership: Managed via selectable tables on the Edit page, not modals
 *
 * Key selectors from source:
 * - Drawer:           [data-ouia-component-id="groups-details-drawer"]
 * - Drawer edit btn:  getByRole('button', { name: /edit user group/i }) (scoped to drawer)
 * - Edit form:        [data-ouia-component-id="edit-user-group-form"]
 * - Users table:      getByRole('grid', { name: /edit group users table/i })
 * - SA table:         getByRole('grid', { name: /edit group service accounts/i })
 */

import { type Locator, type Page, expect } from '@playwright/test';
import { setupPage, waitForTableUpdate } from '../../utils';
import { E2E_TIMEOUTS } from '../../utils/timeouts';

const GROUPS_URL = '/iam/access-management/users-and-user-groups/user-groups';
const EDIT_GROUP_URL_PATTERN = /\/edit-group\/[\w-]+/;

export class UserGroupsPage {
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
    await expect(this.heading).toBeVisible({ timeout: E2E_TIMEOUTS.SETUP_PAGE_LOAD });
  }

  async gotoEditPage(groupId: string): Promise<void> {
    await setupPage(this.page);
    await this.page.goto(`/iam/access-management/users-and-user-groups/edit-group/${groupId}`);
    await expect(this.editPageForm).toBeVisible({ timeout: E2E_TIMEOUTS.DETAIL_CONTENT });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // List Page Locators
  // ═══════════════════════════════════════════════════════════════════════════

  get heading(): Locator {
    return this.page.getByRole('heading', { name: /user groups/i });
  }

  get table(): Locator {
    return this.page.getByRole('grid');
  }

  get searchInput(): Locator {
    return this.page.getByRole('searchbox').or(this.page.getByPlaceholder(/filter|search/i));
  }

  get createButton(): Locator {
    return this.page.getByRole('button', { name: /create user group/i });
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

  getGroupRow(name: string): Locator {
    return this.table.getByRole('row', { name: new RegExp(name, 'i') });
  }

  async verifyGroupInTable(name: string): Promise<void> {
    await expect(this.getGroupRow(name)).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
  }

  async verifyGroupNotInTable(name: string): Promise<void> {
    await expect(this.getGroupRow(name)).not.toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Drawer (V2 detail view — read-only)
  // ═══════════════════════════════════════════════════════════════════════════

  get drawer(): Locator {
    return this.page.locator('[data-ouia-component-id="groups-details-drawer"]');
  }

  get drawerEditButton(): Locator {
    return this.drawer.getByRole('button', { name: /edit user group/i });
  }

  getDrawerTab(name: string): Locator {
    return this.drawer.getByRole('tab', { name: new RegExp(name, 'i') });
  }

  async openDrawer(name: string): Promise<void> {
    await this.table.getByText(name).click();
    await expect(this.drawer).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
    await expect(this.drawer.getByRole('heading', { name })).toBeVisible({ timeout: E2E_TIMEOUTS.DIALOG_CONTENT });
  }

  async closeDrawer(name: string): Promise<void> {
    await this.table.getByText(name).click();
    await expect(this.drawer.getByRole('heading', { name })).not.toBeVisible({ timeout: E2E_TIMEOUTS.DRAWER_ANIMATION });
  }

  async closeDrawerViaButton(): Promise<void> {
    const closeButton = this.drawer.locator('.pf-v6-c-drawer__close button').or(this.drawer.getByRole('button', { name: /close drawer panel/i }));
    await closeButton.click();
    await expect(this.drawer.locator('.pf-v6-c-drawer__panel-main')).not.toBeVisible({
      timeout: E2E_TIMEOUTS.DRAWER_ANIMATION,
    });
  }

  async clickDrawerTab(name: string): Promise<void> {
    const tab = this.getDrawerTab(name);
    await tab.click();

    // Wait for tab panel content to appear
    const panelId = await tab.getAttribute('aria-controls');
    if (panelId) {
      await expect(this.drawer.locator(`#${panelId}`)).toBeVisible({
        timeout: E2E_TIMEOUTS.DIALOG_CONTENT,
      });
    }
  }

  async clickDrawerEditButton(): Promise<void> {
    await this.drawerEditButton.click();
    await expect(this.page).toHaveURL(EDIT_GROUP_URL_PATTERN, { timeout: E2E_TIMEOUTS.URL_CHANGE });
    await expect(this.editPageForm).toBeVisible({ timeout: E2E_TIMEOUTS.DETAIL_CONTENT });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Row Actions
  // ═══════════════════════════════════════════════════════════════════════════

  async openRowActions(name: string): Promise<void> {
    const row = this.page.locator('tbody tr', { has: this.page.getByText(name) });
    await row.getByRole('button', { name: /actions/i }).click();
  }

  async clickRowAction(action: string): Promise<void> {
    await this.page.getByRole('menuitem', { name: new RegExp(action, 'i') }).click();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Edit Page Locators
  // ═══════════════════════════════════════════════════════════════════════════

  get editPageForm(): Locator {
    return this.page.locator('[data-ouia-component-id="edit-user-group-form"]');
  }

  get editPageNameInput(): Locator {
    return this.page.getByLabel(/^name/i);
  }

  get editPageDescriptionInput(): Locator {
    return this.page.getByLabel(/description/i);
  }

  get editPageSubmitButton(): Locator {
    return this.page.getByRole('button', { name: /submit|save|create/i });
  }

  get editPageCancelButton(): Locator {
    return this.page.getByRole('button', { name: /cancel/i });
  }

  getEditPageTab(name: string): Locator {
    return this.editPageForm.getByRole('tab', { name: new RegExp(name, 'i') });
  }

  /** The OUIA wrapper containing the users table and its pagination toolbars. */
  get editPageUsersWrapper(): Locator {
    return this.page.locator('[data-ouia-component-id="edit-group-users-table"]');
  }

  get editPageUsersTable(): Locator {
    return this.editPageUsersWrapper.getByRole('grid');
  }

  get editPageServiceAccountsTable(): Locator {
    return this.page.getByRole('grid', { name: /edit group service accounts/i });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Edit Page Actions
  // ═══════════════════════════════════════════════════════════════════════════

  async clickEditPageTab(tab: 'Users' | 'Service accounts'): Promise<void> {
    await this.getEditPageTab(tab).click();
    // Wait for the tab content to settle
    await this.page.waitForTimeout(E2E_TIMEOUTS.QUICK_SETTLE);
  }

  /**
   * Get the checkbox for a specific user row in the edit page users table.
   * The table uses username as the row identifier.
   */
  getUserRowCheckbox(username: string): Locator {
    const row = this.editPageUsersTable.getByRole('row', { name: new RegExp(username, 'i') });
    return row.getByRole('checkbox');
  }

  /**
   * Paginate through the edit page users table until the given username is
   * visible. If the user is already on the current page, returns immediately.
   * Clicks "next page" repeatedly; throws if no more pages and user not found.
   */
  async paginateToUser(username: string): Promise<void> {
    // Wait for actual data to load — the user sees selectable checkboxes when data is ready.
    // Skeleton rows render empty gridcells without interactive elements.
    await expect(this.editPageUsersTable.getByRole('checkbox').first()).toBeVisible({
      timeout: E2E_TIMEOUTS.SLOW_DATA,
    });

    const checkbox = this.getUserRowCheckbox(username);

    while (true) {
      // Check if the user is on the current page (short timeout — just a DOM check)
      const visible = await checkbox.isVisible().catch(() => false);
      if (visible) {
        return;
      }

      // Look for a "next page" button scoped to the users table wrapper
      // (the page has both Users and Service accounts tables with their own pagination)
      const nextButton = this.editPageUsersWrapper.getByRole('button', { name: /go to next page/i }).first();
      const nextExists = await nextButton.isVisible().catch(() => false);
      const nextEnabled = nextExists && (await nextButton.isEnabled().catch(() => false));

      if (!nextEnabled) {
        throw new Error(`User "${username}" not found after paginating through all pages of the users table`);
      }

      // Capture the first username on the current page so we can detect when new data loads.
      const firstUsernameCell = this.editPageUsersTable
        .getByRole('row')
        .nth(1) // skip header row
        .getByRole('gridcell')
        .nth(2); // username column (after select + org admin)
      const currentFirstUsername = await firstUsernameCell.textContent().catch(() => null);

      await nextButton.click();

      // Wait for the NEW page's data to fully load.
      // After clicking next, the table transitions: old data → skeleton → new data.
      // Skeleton rows have empty gridcells, so checking "text changed" isn't enough
      // (empty string is also "different"). We use a polling assertion to wait until
      // the first username cell is BOTH non-empty AND different from the previous page.
      await expect(async () => {
        const newText = await firstUsernameCell.textContent();
        expect(newText).toBeTruthy(); // not null/empty (rules out skeleton rows)
        if (currentFirstUsername) {
          expect(newText).not.toBe(currentFirstUsername); // different page
        }
      }).toPass({ timeout: E2E_TIMEOUTS.TABLE_DATA });
    }
  }

  async selectUserInEditPage(username: string): Promise<void> {
    await this.paginateToUser(username);
    const checkbox = this.getUserRowCheckbox(username);
    if (!(await checkbox.isChecked())) {
      await checkbox.click();
    }
  }

  async deselectUserInEditPage(username: string): Promise<void> {
    await this.paginateToUser(username);
    const checkbox = this.getUserRowCheckbox(username);
    if (await checkbox.isChecked()) {
      await checkbox.click();
    }
  }

  async isUserSelectedInEditPage(username: string): Promise<boolean> {
    await this.paginateToUser(username);
    return this.getUserRowCheckbox(username).isChecked();
  }

  async submitEditForm(): Promise<void> {
    await this.editPageSubmitButton.click();
    await expect(this.page).toHaveURL(/\/user-groups(\?|$)/, { timeout: E2E_TIMEOUTS.MUTATION_COMPLETE });
  }

  async cancelEditForm(): Promise<void> {
    await this.editPageCancelButton.click();
    await expect(this.page).toHaveURL(/\/user-groups(\?|$)/, { timeout: E2E_TIMEOUTS.URL_CHANGE });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CRUD Operations (list page)
  // ═══════════════════════════════════════════════════════════════════════════

  async fillGroupForm(name: string, description: string): Promise<void> {
    await expect(this.editPageForm).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });

    const nameInput = this.editPageNameInput;
    await nameInput.click();
    await nameInput.selectText();
    await this.page.keyboard.press('Backspace');
    await nameInput.fill(name);

    const descInput = this.editPageDescriptionInput;
    await descInput.click();
    await descInput.selectText();
    await this.page.keyboard.press('Backspace');
    await descInput.fill(description);

    await this.editPageSubmitButton.click();
    await expect(this.page).toHaveURL(/\/user-groups(\?|$)/, { timeout: E2E_TIMEOUTS.MUTATION_COMPLETE });
  }

  async confirmDelete(): Promise<void> {
    // Use generic dialog selector - OUIA ID may vary
    const modal = this.page.getByRole('dialog');
    await expect(modal).toBeVisible({ timeout: E2E_TIMEOUTS.DIALOG_CONTENT });

    // Check the confirmation checkbox - required for delete
    const checkbox = modal.getByRole('checkbox');
    await expect(checkbox).toBeVisible({ timeout: E2E_TIMEOUTS.DRAWER_ANIMATION });
    await checkbox.click();

    await modal.getByRole('button', { name: /delete/i }).click();
    await expect(modal).not.toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
  }
}
