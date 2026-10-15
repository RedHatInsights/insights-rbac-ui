/**
 * Page Object for V2 Left Navigation (Chrome sidebar)
 *
 * Used to assert navigation structure, order, and visibility.
 * Nav is rendered by the platform Chrome (see deploy/frontend.yaml).
 * Selectors use role + name so they work with Chrome's DOM.
 */

import { type Locator, type Page, expect } from '@playwright/test';
import { iamUrl, setupPage, v2 } from '../../utils';
import { E2E_TIMEOUTS } from '../../utils/timeouts';

/** V2 entry path that shows the full nav (Overview requires rbac:*:read) */
const OVERVIEW_URL = iamUrl(v2.overview.link());

/** Fallback: Users and Groups list - most personas can see at least one nav item */
const USERS_AND_GROUPS_URL = iamUrl(v2.usersAndUserGroups.link());

/** My Access - all personas can open this (no RBAC required for nav) */
const MY_ACCESS_URL = iamUrl(v2.myAccess.link());

export class NavigationSidebar {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Navigation
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Go to a V2 page so the IAM Chrome nav is loaded.
   * Use overview for admin (has rbac:*:read); use users-and-user-groups for others.
   */
  async gotoOverview(): Promise<void> {
    await setupPage(this.page);
    await expect(async () => {
      await this.page.goto(OVERVIEW_URL, { timeout: E2E_TIMEOUTS.SLOW_DATA });
      await expect(this.navRegion).toBeVisible({ timeout: E2E_TIMEOUTS.DETAIL_CONTENT });
    }).toPass({ timeout: E2E_TIMEOUTS.SETUP_PAGE_LOAD, intervals: [1_000, 2_000, 5_000] });
  }

  /**
   * Go to Users and Groups so nav is visible (works for Admin and UserViewer).
   */
  async gotoUsersAndGroups(): Promise<void> {
    await setupPage(this.page);
    await expect(async () => {
      await this.page.goto(USERS_AND_GROUPS_URL, { timeout: E2E_TIMEOUTS.SLOW_DATA });
      await expect(this.navRegion).toBeVisible({ timeout: E2E_TIMEOUTS.DETAIL_CONTENT });
    }).toPass({ timeout: E2E_TIMEOUTS.SETUP_PAGE_LOAD, intervals: [1_000, 2_000, 5_000] });
  }

  /**
   * Go to My Access so nav is visible (all personas can access this page).
   */
  async gotoMyAccess(): Promise<void> {
    await setupPage(this.page);
    await expect(async () => {
      await this.page.goto(MY_ACCESS_URL, { timeout: E2E_TIMEOUTS.SLOW_DATA });
      await expect(this.navRegion).toBeVisible({ timeout: E2E_TIMEOUTS.DETAIL_CONTENT });
    }).toPass({ timeout: E2E_TIMEOUTS.SETUP_PAGE_LOAD, intervals: [1_000, 2_000, 5_000] });
  }

  /**
   * Go to a given path (relative to baseURL). Use for direct URL tests.
   */
  async gotoPath(path: string): Promise<void> {
    await setupPage(this.page);
    await expect(async () => {
      await this.page.goto(path, { timeout: E2E_TIMEOUTS.SLOW_DATA });
      await expect(this.navRegion).toBeVisible({ timeout: E2E_TIMEOUTS.DETAIL_CONTENT });
    }).toPass({ timeout: E2E_TIMEOUTS.SETUP_PAGE_LOAD, intervals: [1_000, 2_000, 5_000] });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Nav link locators (Chrome renders links; expandables may be button or link)
  // ═══════════════════════════════════════════════════════════════════════════

  /** Nav region: prefer navigation landmark if present, else whole page */
  get navRegion(): Locator {
    return this.page.getByRole('navigation').first();
  }

  getNavLink(name: string | RegExp): Locator {
    const matcher = typeof name === 'string' ? new RegExp(name, 'i') : name;
    return this.navRegion.getByRole('link', { name: matcher });
  }

  /** Expandable section: Chrome may use button or link */
  getNavExpandable(title: string | RegExp): Locator {
    const matcher = typeof title === 'string' ? new RegExp(title, 'i') : title;
    return this.navRegion.getByRole('button', { name: matcher }).or(this.navRegion.getByRole('link', { name: matcher }));
  }

  /** Check if a nav link (or expandable) is visible */
  async isNavItemVisible(name: string | RegExp): Promise<boolean> {
    const matcher = typeof name === 'string' ? new RegExp(name, 'i') : name;
    const link = this.navRegion.getByRole('link', { name: matcher });
    const button = this.navRegion.getByRole('button', { name: matcher });
    return (await link.isVisible().catch(() => false)) || (await button.isVisible().catch(() => false));
  }

  /** Click a nav link by name (e.g. "Roles", "Users and Groups") */
  async clickNavLink(name: string | RegExp): Promise<void> {
    const locator = this.getNavLink(name);
    await locator.click();
  }

  /** Expand a section if it's a button (e.g. "Access Management") then click child link */
  async expandAndClickNavLink(sectionTitle: string | RegExp, linkName: string | RegExp): Promise<void> {
    const expandable = this.getNavExpandable(sectionTitle);
    const isExpanded = await expandable
      .getAttribute('aria-expanded')
      .then((a) => a === 'true')
      .catch(() => false);
    if (!isExpanded) {
      await expandable.click();
      await this.page.waitForTimeout(E2E_TIMEOUTS.QUICK_SETTLE);
    }
    await this.getNavLink(linkName).click();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Expected V2 nav labels (from frontend.yaml)
  // ═══════════════════════════════════════════════════════════════════════════

  static readonly NAV_MY_ACCESS = /My Access/i;
  static readonly NAV_OVERVIEW = /Overview/i;
  static readonly NAV_ACCESS_MANAGEMENT = /Access Management/i;
  static readonly NAV_USERS_AND_GROUPS = /Users and Groups/i;
  static readonly NAV_ROLES = /^Roles$/i;
  static readonly NAV_WORKSPACES = /Workspaces/i;
  static readonly NAV_AUDIT_LOG = /Audit Log/i;
  static readonly NAV_ORGANIZATION_MANAGEMENT = /Organization Management/i;
  static readonly NAV_ORGANIZATION_WIDE_ACCESS = /Organization-Wide Access/i;
}
