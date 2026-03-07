/**
 * Audit Log Tests
 *
 * Tests for the V2 audit log page.
 */

import { expect, test } from '@playwright/test';
import { AUTH_V2_ORGADMIN, AUTH_V2_RBACADMIN, AUTH_V2_READONLY, AUTH_V2_USERVIEWER, iamUrl, setupPage, v2 } from '../../../utils';
import { E2E_TIMEOUTS } from '../../../utils/timeouts';
import { NavigationSidebar } from '../../../pages/v2/NavigationSidebar';

test.describe('Audit Log', () => {
  test.describe('OrgAdmin', () => {
    test.use({ storageState: AUTH_V2_ORGADMIN });

    test('Can view audit log table [OrgAdmin]', async ({ page }) => {
      await setupPage(page);
      await page.goto(iamUrl(v2.accessManagementAuditLog.link()));

      // Wait for heading
      await expect(page.getByRole('heading', { name: /audit log/i, level: 1 })).toBeVisible({
        timeout: E2E_TIMEOUTS.SETUP_PAGE_LOAD,
      });

      // Wait for table data
      await expect(page.getByRole('grid')).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
    });

    test('Can navigate to audit log from sidebar [OrgAdmin]', async ({ page }) => {
      await setupPage(page);
      const navSidebar = new NavigationSidebar(page);
      await navSidebar.gotoOverview();

      // Click Audit Log in sidebar (under Access Management)
      await navSidebar.expandAndClickNavLink(NavigationSidebar.NAV_ACCESS_MANAGEMENT, NavigationSidebar.NAV_AUDIT_LOG);

      await expect(page.getByRole('heading', { name: /audit log/i, level: 1 })).toBeVisible({
        timeout: E2E_TIMEOUTS.SETUP_PAGE_LOAD,
      });
    });
  });

  test.describe('UserViewer', () => {
    test.use({ storageState: AUTH_V2_USERVIEWER });

    test('Audit log page shows unauthorized access [UserViewer]', async ({ page }) => {
      await setupPage(page);
      await expect(async () => {
        await page.goto(iamUrl(v2.accessManagementAuditLog.link()), { timeout: E2E_TIMEOUTS.SLOW_DATA });
        await expect(page.getByText(/You do not have access to/i)).toBeVisible({ timeout: E2E_TIMEOUTS.DETAIL_CONTENT });
      }).toPass({ timeout: E2E_TIMEOUTS.SETUP_PAGE_LOAD, intervals: [2_000, 5_000] });
    });
  });

  test.describe('ReadOnlyUser', () => {
    test.use({ storageState: AUTH_V2_READONLY });

    test('Audit log page shows unauthorized access [ReadOnlyUser]', async ({ page }) => {
      await setupPage(page);
      await expect(async () => {
        await page.goto(iamUrl(v2.accessManagementAuditLog.link()), { timeout: E2E_TIMEOUTS.SLOW_DATA });
        await expect(page.getByText(/You do not have access to/i)).toBeVisible({ timeout: E2E_TIMEOUTS.DETAIL_CONTENT });
      }).toPass({ timeout: E2E_TIMEOUTS.SETUP_PAGE_LOAD, intervals: [2_000, 5_000] });
    });
  });

  test.describe('RbacAdmin', () => {
    test.use({ storageState: AUTH_V2_RBACADMIN });

    test('Audit log page shows unauthorized access [RbacAdmin]', async ({ page }) => {
      await setupPage(page);
      await expect(async () => {
        await page.goto(iamUrl(v2.accessManagementAuditLog.link()), { timeout: E2E_TIMEOUTS.SLOW_DATA });
        await expect(page.getByText(/You do not have access to/i)).toBeVisible({ timeout: E2E_TIMEOUTS.DETAIL_CONTENT });
      }).toPass({ timeout: E2E_TIMEOUTS.SETUP_PAGE_LOAD, intervals: [2_000, 5_000] });
    });
  });
});
