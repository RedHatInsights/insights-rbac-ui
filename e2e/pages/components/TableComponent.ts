/**
 * Page Object for TableView Component
 *
 * Encapsulates all interactions with the shared TableView component used
 * throughout the app. Every table — roles, groups, users, workspaces,
 * audit log — is rendered by the same component, so interaction patterns
 * are identical.
 *
 * Can be scoped to a specific container (modal, wizard step, panel) so that
 * locators resolve within that subtree rather than the full page. Menus
 * that teleport outside the container (e.g. dropdown panels) are always
 * queried via `page` scope.
 *
 * Usage:
 * ```typescript
 * // Unscoped — whole page
 * const table = new TableComponent(page);
 *
 * // Scoped — inside a dialog
 * const table = new TableComponent(page, page.getByRole('dialog'));
 *
 * // In a page object
 * class RolesPage {
 *   readonly table: TableComponent;
 *   constructor(page: Page) {
 *     this.table = new TableComponent(page);
 *   }
 * }
 *
 * // In a test
 * await rolesPage.table.search('Viewer');
 * await rolesPage.table.openRowActions('Viewer Role');
 * await rolesPage.table.clickRowAction('Delete');
 * ```
 */

import { type Locator, type Page, expect } from '@playwright/test';
import { waitForTableUpdate } from '../../utils/waiters';
import { E2E_TIMEOUTS } from '../../utils/timeouts';

export class TableComponent {
  readonly page: Page;
  /** Subtree used to scope grid, search, and pagination locators. */
  readonly container: Locator;

  constructor(page: Page, container?: Locator) {
    this.page = page;
    this.container = container ?? page.locator(':root');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Core locators
  // ─────────────────────────────────────────────────────────────────────────

  get grid(): Locator {
    return this.container.getByRole('grid').or(this.container.getByRole('treegrid'));
  }

  /** Standard toolbar searchbox / text filter input */
  get searchInput(): Locator {
    return this.container.getByRole('searchbox').or(this.container.getByPlaceholder(/filter|search/i));
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Search / text filter
  // ─────────────────────────────────────────────────────────────────────────

  async search(text: string): Promise<void> {
    await this.searchInput.clear();
    await this.searchInput.fill(text);
    await waitForTableUpdate(this.page);
  }

  async clearSearch(): Promise<void> {
    await this.searchInput.clear();
    await waitForTableUpdate(this.page);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Filter column switching (DataViewFilters type selector)
  //
  // DataViewFilters wraps all filters under a single column-type selector.
  // The selector button shows the currently active filter name (e.g. "Requester").
  // To use a different filter, click the current name → pick the target from the menu.
  //
  // Example:
  //   Switch from "Requester" to "Resource":
  //     await table.switchFilterColumn(/^requester$/i, /^resource$/i);
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Switch the active filter column by clicking the current type selector button
   * and selecting the target filter type from the dropdown.
   * @param currentColumn - accessible name of the currently active filter button
   * @param targetColumn  - menu item name to switch to
   */
  async switchFilterColumn(currentColumn: string | RegExp, targetColumn: string | RegExp): Promise<void> {
    await this.container.getByRole('button', { name: currentColumn }).click();
    await expect(this.page.getByRole('menuitem', { name: targetColumn })).toBeVisible({ timeout: E2E_TIMEOUTS.MENU_ANIMATION });
    await this.page.getByRole('menuitem', { name: targetColumn }).click();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Checkbox filters (DataViewCheckboxFilter)
  //
  // DataViewCheckboxFilter renders a MenuToggle whose accessible name is the
  // filter's `placeholder` prop, which defaults to "Filter by <label>...".
  // The dropdown options are role=menuitem (not role=option).
  //
  // IMPORTANT: The checkbox filter toggle only appears after switchFilterColumn
  // has been used to make that filter the active one.
  //
  // Examples:
  //   Resource filter toggle → /filter by resource/i
  //   Action filter toggle   → /filter by action/i
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Open a checkbox filter dropdown.
   * @param toggleName - the placeholder text on the filter toggle button,
   *   e.g. /filter by resource/i or "Filter by action..."
   */
  async openCheckboxFilter(toggleName: string | RegExp): Promise<void> {
    await this.container.getByRole('button', { name: toggleName }).click();
    // Wait for the first menu item to appear
    await expect(this.page.getByRole('menuitem').first()).toBeVisible({ timeout: E2E_TIMEOUTS.MENU_ANIMATION });
  }

  /**
   * Click a checkbox option inside an open filter dropdown.
   * Must be called after openCheckboxFilter.
   */
  async selectCheckboxOption(optionName: string | RegExp): Promise<void> {
    await this.page.getByRole('menuitem', { name: optionName }).click();
  }

  /**
   * Open a checkbox filter and select one option — convenience wrapper.
   */
  async filterByCheckbox(toggleName: string | RegExp, optionName: string | RegExp): Promise<void> {
    await this.openCheckboxFilter(toggleName);
    await this.selectCheckboxOption(optionName);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Row locators
  // ─────────────────────────────────────────────────────────────────────────

  /** Find a row by its accessible name (matched by row role + name). */
  getRow(name: string | RegExp): Locator {
    if (typeof name === 'string') {
      return this.grid.getByRole('row', { name: new RegExp(name, 'i') });
    }
    return this.grid.getByRole('row', { name });
  }

  /** Find a row by text content anywhere in the row. */
  getRowByText(text: string): Locator {
    return this.grid.getByRole('row').filter({ hasText: text });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Row selection (checkboxes)
  // ─────────────────────────────────────────────────────────────────────────

  /** Check/uncheck a row's selection checkbox by row name. */
  async selectRow(name: string | RegExp): Promise<void> {
    await this.getRow(name).getByRole('checkbox').click();
  }

  /** Select a row by its 0-based index using the "Select row N" aria-label. */
  async selectRowByIndex(index: number): Promise<void> {
    await this.grid.getByRole('checkbox', { name: new RegExp(`select row ${index}`, 'i') }).click();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Row actions (kebab menus)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Click the "Actions" kebab button in a specific row.
   * The button name can vary (e.g. "Actions", "Actions for role X") — pass
   * a RegExp to match loosely, or a string to match the exact aria-label.
   */
  async openRowActions(rowName: string | RegExp, buttonName: string | RegExp = /actions/i): Promise<void> {
    await this.getRow(rowName).getByRole('button', { name: buttonName }).click();
    await expect(this.page.getByRole('menuitem').first()).toBeVisible({ timeout: E2E_TIMEOUTS.MENU_ANIMATION });
  }

  /** Click a menu item in the currently open row action dropdown. */
  async clickRowAction(action: string | RegExp): Promise<void> {
    await this.page.getByRole('menuitem', { name: action }).click();
  }

  /**
   * Open a row's kebab and click an action — convenience wrapper.
   */
  async rowAction(rowName: string | RegExp, action: string | RegExp): Promise<void> {
    await this.openRowActions(rowName);
    await this.clickRowAction(action);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Row click (drawer / navigation)
  // ─────────────────────────────────────────────────────────────────────────

  /** Click text inside a row to open its detail drawer or navigate. */
  async clickRow(name: string | RegExp): Promise<void> {
    await this.grid.getByText(name).click();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Bulk actions (toolbar)
  // ─────────────────────────────────────────────────────────────────────────

  get bulkActionsButton(): Locator {
    return this.container.getByRole('button', { name: /kebab dropdown toggle/i });
  }

  async openBulkActions(): Promise<void> {
    await this.bulkActionsButton.click();
    await expect(this.page.getByRole('menuitem').first()).toBeVisible({ timeout: E2E_TIMEOUTS.MENU_ANIMATION });
  }

  async clickBulkAction(action: string | RegExp): Promise<void> {
    await this.page.getByRole('menuitem', { name: action }).click();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Pagination
  // ─────────────────────────────────────────────────────────────────────────

  get nextPageButton(): Locator {
    return this.container.getByRole('button', { name: /go to next page/i }).first();
  }

  get prevPageButton(): Locator {
    return this.container.getByRole('button', { name: /go to previous page/i }).first();
  }

  async goToNextPage(): Promise<void> {
    await expect(this.nextPageButton).toBeEnabled({ timeout: E2E_TIMEOUTS.BUTTON_STATE });
    await this.nextPageButton.click();
    await waitForTableUpdate(this.page);
  }

  async goToPreviousPage(): Promise<void> {
    await expect(this.prevPageButton).toBeEnabled({ timeout: E2E_TIMEOUTS.BUTTON_STATE });
    await this.prevPageButton.click();
    await waitForTableUpdate(this.page);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Data loading
  // ─────────────────────────────────────────────────────────────────────────

  async waitForData(timeout = E2E_TIMEOUTS.TABLE_DATA): Promise<void> {
    await expect(this.grid).toBeVisible({ timeout });
    await waitForTableUpdate(this.page, { timeout });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Assertions
  // ─────────────────────────────────────────────────────────────────────────

  async expectRowVisible(name: string | RegExp, timeout = E2E_TIMEOUTS.TABLE_DATA): Promise<void> {
    await expect(this.getRow(name)).toBeVisible({ timeout });
  }

  async expectRowNotVisible(name: string | RegExp, timeout = E2E_TIMEOUTS.TABLE_DATA): Promise<void> {
    await expect(this.getRow(name)).not.toBeVisible({ timeout });
  }

  async expectColumnHeader(name: string | RegExp): Promise<void> {
    await expect(this.grid.getByRole('columnheader', { name })).toBeVisible();
  }
}
