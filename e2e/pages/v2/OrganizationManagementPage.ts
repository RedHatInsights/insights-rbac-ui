/**
 * Page Object for V2 Organization Management Page
 *
 * URL: /iam/organization-management/organization-wide-access
 *
 * Org-admin-only page showing organization details
 * (name, account number, org ID) and a role assignments table.
 */

import { type Locator, type Page, expect } from '@playwright/test';
import { iamUrl, setupPage, v2 } from '../../utils';
import { E2E_TIMEOUTS } from '../../utils/timeouts';
import { TableComponent } from '../components/TableComponent';

const ORG_MANAGEMENT_URL = iamUrl(v2.organizationManagement.link());

export class OrganizationManagementPage {
  readonly page: Page;
  readonly tableComponent: TableComponent;

  constructor(page: Page) {
    this.page = page;
    this.tableComponent = new TableComponent(page, page.locator('[data-ouia-component-id="organization-role-assignments-table"]'));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Navigation
  // ═══════════════════════════════════════════════════════════════════════════

  async goto(): Promise<void> {
    await setupPage(this.page);
    await expect(async () => {
      await this.page.goto(ORG_MANAGEMENT_URL, { timeout: E2E_TIMEOUTS.SLOW_DATA });
      await expect(this.heading).toBeVisible({ timeout: E2E_TIMEOUTS.DETAIL_CONTENT });
    }).toPass({ timeout: E2E_TIMEOUTS.SETUP_PAGE_LOAD, intervals: [1_000, 2_000, 5_000] });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Locators
  // ═══════════════════════════════════════════════════════════════════════════

  get heading(): Locator {
    return this.page.getByRole('heading', { name: /Organization-Wide Access/i, level: 1 });
  }

  get table(): Locator {
    return this.page.locator('[data-ouia-component-id="organization-role-assignments-table"]').or(this.page.getByRole('grid'));
  }

  get unauthorizedMessage(): Locator {
    return this.page.getByText(/You do not have access to/i);
  }

  get organizationName(): Locator {
    return this.page.getByText(/organization name/i);
  }

  get accountNumber(): Locator {
    return this.page.getByText(/account number/i);
  }

  get organizationId(): Locator {
    return this.page.getByText(/organization id/i);
  }

  get grantAccessButton(): Locator {
    return this.page.getByRole('button', { name: /grant access/i });
  }

  get grantAccessWizard(): Locator {
    // The wizard renders two role=dialog elements (PF modal wrapper + inner wizard).
    // Target the inner wizard directly by its stable OUIA ID to avoid strict mode violations.
    return this.page.locator('[data-ouia-component-id="grant-access-wizard"]');
  }

  get editAccessModal(): Locator {
    return this.page.locator('[data-ouia-component-id="org-role-access-modal"]');
  }

  get removeAccessModal(): Locator {
    return this.page.getByRole('dialog', { name: /remove/i });
  }

  async openRowActions(groupName: string | RegExp): Promise<void> {
    const escapedName = typeof groupName === 'string' ? groupName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : groupName.source;
    await this.tableComponent.openRowActions(groupName, new RegExp(`actions for ${escapedName}`, 'i'));
  }

  async firstRowName(): Promise<string> {
    const rows = this.tableComponent.grid.getByRole('row');
    if ((await rows.count()) < 2) return '';
    return (await rows.nth(1).getByRole('cell').first().textContent())?.trim() ?? '';
  }
}
