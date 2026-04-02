/**
 * Page Object for V2 Audit Log Page
 *
 * Encapsulates all interactions with the V2 Audit Log page at:
 * /iam/access-management/audit-log
 *
 * Only OrgAdmin can access this page; other personas see an unauthorized state.
 */

import { type Locator, type Page, expect } from '@playwright/test';
import { iamUrl, setupPage, v2 } from '../../utils';
import { E2E_TIMEOUTS } from '../../utils/timeouts';
import { TableComponent } from '../components/TableComponent';

const AUDIT_LOG_URL = iamUrl(v2.accessManagementAuditLog.link());

export class AuditLogPage {
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
      await this.page.goto(AUDIT_LOG_URL, { timeout: E2E_TIMEOUTS.SLOW_DATA });
      await expect(this.heading).toBeVisible({ timeout: E2E_TIMEOUTS.DETAIL_CONTENT });
    }).toPass({ timeout: E2E_TIMEOUTS.SETUP_PAGE_LOAD, intervals: [1_000, 2_000, 5_000] });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Locators
  // ═══════════════════════════════════════════════════════════════════════════

  get heading(): Locator {
    return this.page.getByRole('heading', { name: /audit log/i, level: 1 });
  }

  get unauthorizedMessage(): Locator {
    return this.page.getByText(/You do not have access to/i);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Assertions
  // ═══════════════════════════════════════════════════════════════════════════

  async verifyPageLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible();
    await this.tableComponent.waitForData();
  }

  async verifyUnauthorized(): Promise<void> {
    await setupPage(this.page);
    await expect(async () => {
      await this.page.goto(AUDIT_LOG_URL, { timeout: E2E_TIMEOUTS.SLOW_DATA });
      await expect(this.unauthorizedMessage).toBeVisible({ timeout: E2E_TIMEOUTS.DETAIL_CONTENT });
    }).toPass({ timeout: E2E_TIMEOUTS.SETUP_PAGE_LOAD, intervals: [2_000, 5_000] });
  }
}
