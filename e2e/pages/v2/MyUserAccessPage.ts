/**
 * Page Object for V2 My User Access Page
 *
 * Encapsulates all interactions with the V2 My User Access page at:
 * /iam/my-user-access
 *
 * All personas can access this page.
 */

import { type Locator, type Page, expect } from '@playwright/test';
import { setupPage } from '../../utils';

const MY_USER_ACCESS_URL = '/iam/my-user-access';

export class MyUserAccessPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Navigation
  // ═══════════════════════════════════════════════════════════════════════════

  async goto(): Promise<void> {
    await setupPage(this.page);
    await this.page.goto(MY_USER_ACCESS_URL);
    await expect(this.heading).toBeVisible({ timeout: 15000 });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Locators
  // ═══════════════════════════════════════════════════════════════════════════

  get heading(): Locator {
    return this.page.getByRole('heading', { name: /my user access/i });
  }

  get table(): Locator {
    return this.page.getByRole('grid');
  }

  get searchInput(): Locator {
    return this.page.getByRole('searchbox').or(this.page.getByPlaceholder(/filter|search/i));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Assertions
  // ═══════════════════════════════════════════════════════════════════════════

  async verifyPageLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible();
    // Table may show permissions or empty state
    const tableOrEmpty = this.table.or(this.page.getByText(/no permissions|no results/i));
    await expect(tableOrEmpty).toBeVisible({ timeout: 10000 });
  }
}
