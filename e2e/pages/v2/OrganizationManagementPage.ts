/**
 * Page Object for the Organization Management Page
 *
 * URL: /organization-management/organization-wide-access
 * Feature: Displays organization-wide access and role bindings for org admins
 */

import { type Locator, type Page, expect } from '@playwright/test';
import { setupPage, waitForTableUpdate } from '../../utils';
import { E2E_TIMEOUTS } from '../../utils/timeouts';

const ORG_MANAGEMENT_URL = '/organization-management/organization-wide-access';

export class OrganizationManagementPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Navigation
  // ═══════════════════════════════════════════════════════════════════════════

  async goto(): Promise<void> {
    await setupPage(this.page);
    await this.page.goto(ORG_MANAGEMENT_URL);
    await expect(this.heading).toBeVisible({ timeout: E2E_TIMEOUTS.SETUP_PAGE_LOAD });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Locators - Page Header & Organization Info
  // ═══════════════════════════════════════════════════════════════════════════

  get heading(): Locator {
    return this.page.getByRole('heading', { name: /organization-wide access/i });
  }

  get subtitle(): Locator {
    return this.page.getByText(/View access to organization resources/i);
  }

  get organizationNameLabel(): Locator {
    return this.page.getByText(/organization name/i);
  }

  get accountNumberLabel(): Locator {
    return this.page.getByText(/account number/i);
  }

  get organizationIdLabel(): Locator {
    return this.page.getByText(/organization ID/i);
  }

  get unauthorizedMessage(): Locator {
    return this.page.getByText(/You do not have access to/i);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Locators - Role Bindings Table
  // ═══════════════════════════════════════════════════════════════════════════

  get table(): Locator {
    return this.page.locator('[data-ouia-component-id="organization-role-assignments-table"]').or(this.page.getByRole('grid'));
  }

  get searchInput(): Locator {
    return this.page.getByPlaceholder(/filter|search/i);
  }

  get tableHeader(): Locator {
    return this.table.getByRole('columnheader');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Verification Methods
  // ═══════════════════════════════════════════════════════════════════════════

  async verifyPageLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible({ timeout: E2E_TIMEOUTS.SETUP_PAGE_LOAD });
    await expect(this.subtitle).toBeVisible();
  }

  async verifyOrganizationInfoDisplayed(): Promise<void> {
    // Verify organization info labels are visible
    await expect(this.organizationNameLabel).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
    await expect(this.accountNumberLabel).toBeVisible();
    await expect(this.organizationIdLabel).toBeVisible();
  }

  async verifyRoleBindingsTablePresent(): Promise<void> {
    await expect(this.table).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
    // Verify table has expected column headers
    await expect(this.tableHeader.first()).toBeVisible();
  }

  async verifyUnauthorizedAccess(): Promise<void> {
    await expect(this.unauthorizedMessage).toBeVisible({ timeout: E2E_TIMEOUTS.SETUP_PAGE_LOAD });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Table Actions
  // ═══════════════════════════════════════════════════════════════════════════

  async searchFor(name: string): Promise<void> {
    await this.searchInput.fill(name);
    await waitForTableUpdate(this.page);
  }

  async verifyGroupInTable(groupName: string): Promise<void> {
    await expect(this.table.getByText(groupName)).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
  }

  async verifyGroupNotInTable(groupName: string): Promise<void> {
    await expect(this.table.getByText(groupName)).not.toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
  }

  getGroupRow(groupName: string): Locator {
    return this.table.getByRole('row', { name: new RegExp(groupName, 'i') });
  }

  async getTableRowCount(): Promise<number> {
    // Wait for table to load
    await expect(this.table).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
    const rows = this.table.getByRole('row');
    return rows.count();
  }
}
