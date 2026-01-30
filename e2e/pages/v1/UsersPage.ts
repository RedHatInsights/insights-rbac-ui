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
}
