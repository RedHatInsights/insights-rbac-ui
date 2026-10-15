/**
 * Audit Log Tests
 *
 * Tests for the V2 audit log page.
 */

import { expect, test } from '@playwright/test';
import { AUTH_V2_ORGADMIN, AUTH_V2_RBACADMIN, AUTH_V2_READONLY, AUTH_V2_USERVIEWER, setupPage } from '../../../utils';
import { E2E_TIMEOUTS } from '../../../utils/timeouts';
import { NavigationSidebar } from '../../../pages/v2/NavigationSidebar';
import { AuditLogPage } from '../../../pages/v2/AuditLogPage';

test.describe('Audit Log', () => {
  test.describe('OrgAdmin', () => {
    test.use({ storageState: AUTH_V2_ORGADMIN });

    test('Can view audit log table [OrgAdmin]', async ({ page }) => {
      const auditLogPage = new AuditLogPage(page);
      await auditLogPage.goto();
      await auditLogPage.verifyPageLoaded();
    });

    test('Can navigate to audit log from sidebar [OrgAdmin]', async ({ page }) => {
      await setupPage(page);
      const navSidebar = new NavigationSidebar(page);
      await navSidebar.gotoOverview();

      await navSidebar.expandAndClickNavLink(NavigationSidebar.NAV_ACCESS_MANAGEMENT, NavigationSidebar.NAV_AUDIT_LOG);

      await expect(page.getByRole('heading', { name: /audit log/i, level: 1 })).toBeVisible({
        timeout: E2E_TIMEOUTS.SETUP_PAGE_LOAD,
      });
    });

    test('Audit log table shows expected column headers [OrgAdmin]', async ({ page }) => {
      const auditLogPage = new AuditLogPage(page);
      await auditLogPage.goto();

      for (const header of ['Date', 'Requester', 'Action', 'Resource', 'Description']) {
        await auditLogPage.tableComponent.expectColumnHeader(header);
      }
    });

    test('Requester text filter filters the table [OrgAdmin]', async ({ page }) => {
      const auditLogPage = new AuditLogPage(page);
      await auditLogPage.goto();

      await auditLogPage.tableComponent.search('zzz-no-match');
      // Table should show empty state after filtering with a value that matches nothing
      const emptyState = page
        .getByText(/no results/i)
        .or(page.getByText(/no data/i))
        .or(page.getByText(/no items/i))
        .or(page.getByText(/0 items/i));
      await expect(emptyState).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
    });

    test('Resource checkbox filter shows options [OrgAdmin]', async ({ page }) => {
      const auditLogPage = new AuditLogPage(page);
      await auditLogPage.goto();

      await auditLogPage.tableComponent.switchFilterColumn(/^requester$/i, /^resource$/i);
      await auditLogPage.tableComponent.openCheckboxFilter(/filter by resource/i);

      await expect(page.getByRole('menuitem', { name: /group/i })).toBeVisible({ timeout: E2E_TIMEOUTS.MENU_ANIMATION });
      await expect(page.getByRole('menuitem', { name: /^role$/i })).toBeVisible();
    });

    test('Action checkbox filter shows options [OrgAdmin]', async ({ page }) => {
      const auditLogPage = new AuditLogPage(page);
      await auditLogPage.goto();

      await auditLogPage.tableComponent.switchFilterColumn(/^requester$/i, /^action$/i);
      await auditLogPage.tableComponent.openCheckboxFilter(/filter by action/i);

      await expect(page.getByRole('menuitem', { name: /create/i })).toBeVisible({ timeout: E2E_TIMEOUTS.MENU_ANIMATION });
      await expect(page.getByRole('menuitem', { name: /delete/i })).toBeVisible();
    });

    test('Pagination controls are present [OrgAdmin]', async ({ page }) => {
      const auditLogPage = new AuditLogPage(page);
      await auditLogPage.goto();

      await expect(page.getByRole('navigation', { name: /pagination/i }).first()).toBeVisible({
        timeout: E2E_TIMEOUTS.TABLE_DATA,
      });
    });
  });

  test.describe('UserViewer', () => {
    test.use({ storageState: AUTH_V2_USERVIEWER });

    test('Audit log page shows unauthorized access [UserViewer]', async ({ page }) => {
      const auditLogPage = new AuditLogPage(page);
      await auditLogPage.verifyUnauthorized();
    });
  });

  test.describe('ReadOnlyUser', () => {
    test.use({ storageState: AUTH_V2_READONLY });

    test('Audit log page shows unauthorized access [ReadOnlyUser]', async ({ page }) => {
      const auditLogPage = new AuditLogPage(page);
      await auditLogPage.verifyUnauthorized();
    });
  });

  test.describe('RbacAdmin', () => {
    test.use({ storageState: AUTH_V2_RBACADMIN });

    test('Audit log page shows unauthorized access [RbacAdmin]', async ({ page }) => {
      const auditLogPage = new AuditLogPage(page);
      await auditLogPage.verifyUnauthorized();
    });
  });
});
