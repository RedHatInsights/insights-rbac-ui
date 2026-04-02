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

    test('Audit log table shows expected column headers [OrgAdmin]', async ({ page }) => {
      await setupPage(page);
      await page.goto(iamUrl(v2.accessManagementAuditLog.link()));
      await expect(page.getByRole('grid')).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });

      for (const header of ['Date', 'Requester', 'Action', 'Resource', 'Description']) {
        await expect(page.getByRole('columnheader', { name: header })).toBeVisible();
      }
    });

    test('Requester text filter accepts input [OrgAdmin]', async ({ page }) => {
      await setupPage(page);
      await page.goto(iamUrl(v2.accessManagementAuditLog.link()));
      await expect(page.getByRole('grid')).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });

      await page.getByPlaceholder(/filter by requester/i).fill('zzz-no-match');
      // Wait for the filter to apply (table updates or shows empty state)
      await page.waitForTimeout(E2E_TIMEOUTS.QUICK_SETTLE);
      // Input accepted the value
      await expect(page.getByPlaceholder(/filter by requester/i)).toHaveValue('zzz-no-match');
    });

    test('Resource checkbox filter shows options [OrgAdmin]', async ({ page }) => {
      await setupPage(page);
      await page.goto(iamUrl(v2.accessManagementAuditLog.link()));
      await expect(page.getByRole('grid')).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });

      // DataViewFilters shows a type-selector button (default: "Requester").
      // Switch to Resource, then open the checkbox filter toggle.
      // The filter toolbar renders after the grid — wait for the button to appear.
      await expect(page.getByRole('button', { name: /^requester$/i })).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
      await page.getByRole('button', { name: /^requester$/i }).click();
      await expect(page.getByRole('menuitem', { name: /^resource$/i })).toBeVisible({ timeout: E2E_TIMEOUTS.MENU_ANIMATION });
      await page.getByRole('menuitem', { name: /^resource$/i }).click();

      await page.getByRole('button', { name: /filter by resource/i }).click();
      await expect(page.getByRole('menuitem', { name: /group/i })).toBeVisible({
        timeout: E2E_TIMEOUTS.MENU_ANIMATION,
      });
      await expect(page.getByRole('menuitem', { name: /^role$/i })).toBeVisible();
    });

    test('Action checkbox filter shows options [OrgAdmin]', async ({ page }) => {
      await setupPage(page);
      await page.goto(iamUrl(v2.accessManagementAuditLog.link()));
      await expect(page.getByRole('grid')).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });

      // Switch to Action filter type, then open the checkbox filter toggle.
      await page.getByRole('button', { name: /^requester$/i }).click();
      await expect(page.getByRole('menuitem', { name: /^action$/i })).toBeVisible({ timeout: E2E_TIMEOUTS.MENU_ANIMATION });
      await page.getByRole('menuitem', { name: /^action$/i }).click();

      await page.getByRole('button', { name: /filter by action/i }).click();
      await expect(page.getByRole('menuitem', { name: /create/i })).toBeVisible({
        timeout: E2E_TIMEOUTS.MENU_ANIMATION,
      });
      await expect(page.getByRole('menuitem', { name: /delete/i })).toBeVisible();
    });

    test('Pagination controls are present [OrgAdmin]', async ({ page }) => {
      await setupPage(page);
      await page.goto(iamUrl(v2.accessManagementAuditLog.link()));
      await expect(page.getByRole('grid')).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });

      await expect(page.getByRole('navigation', { name: /pagination/i }).first()).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
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
