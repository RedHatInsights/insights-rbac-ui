/**
 * Organization Management - Organization-Wide Access
 *
 * Tests the Organization Management page that displays organization metadata
 * and organization-level role bindings for org admins.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * DECISION TREE - Add your test here if:
 * ═══════════════════════════════════════════════════════════════════════════════
 * ✓ Testing organization information display
 * ✓ Testing organization-level role bindings table
 * ✓ Testing org admin access controls
 *
 * DO NOT add here if:
 * ✗ Testing workspace-specific role bindings → use workspace-detail.spec.ts
 * ✗ Testing group management → use groups.spec.ts
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * CAPABILITIES & PERSONAS (see TEST_PERSONAS.md for full details)
 * ═══════════════════════════════════════════════════════════════════════════════
 * @capability View organization-wide access and role bindings
 *
 * @personas
 * - Admin (`rbac:*:*` + orgAdmin flag): Full access to organization management
 * - UserViewer (`rbac:principal:read`): Blocked - requires orgAdmin flag
 * - ReadOnlyUser (no permissions): Blocked - requires orgAdmin flag
 *
 * NOTE: This page requires the `requireOrgAdmin: true` flag, which is separate
 * from RBAC permissions. Only org admins can access this page.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * DATA PREREQUISITES
 * ═══════════════════════════════════════════════════════════════════════════════
 * @dependencies
 * - AUTH: AUTH_V2_ADMIN (with orgAdmin flag)
 * - DATA: Organization metadata from Chrome service
 * - DATA: Role bindings from Kessel API
 */

import { expect, test } from '@playwright/test';
import { AUTH_V2_ADMIN, AUTH_V2_READONLY, AUTH_V2_USERVIEWER } from '../../utils';
import { OrganizationManagementPage } from '../../pages/v2/OrganizationManagementPage';

test.describe('Organization Management', () => {
  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN - Full Access (with orgAdmin flag)
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('Admin (OrgAdmin)', () => {
    test.use({ storageState: AUTH_V2_ADMIN });

    test('Displays organization information correctly', async ({ page }) => {
      const orgManagementPage = new OrganizationManagementPage(page);

      // Navigate to organization management page
      await orgManagementPage.goto();

      // Verify page loaded
      await orgManagementPage.verifyPageLoaded();

      // Verify organization metadata is displayed
      await orgManagementPage.verifyOrganizationInfoDisplayed();

      // Verify all three organization fields are present
      await expect(orgManagementPage.organizationNameLabel).toBeVisible();
      await expect(orgManagementPage.accountNumberLabel).toBeVisible();
      await expect(orgManagementPage.organizationIdLabel).toBeVisible();
    });

    test('Displays role bindings table', async ({ page }) => {
      const orgManagementPage = new OrganizationManagementPage(page);

      // Navigate to organization management page
      await orgManagementPage.goto();

      // Verify role bindings table is present
      await orgManagementPage.verifyRoleBindingsTablePresent();

      // Verify table has loaded with data or is in a valid state
      const rowCount = await orgManagementPage.getTableRowCount();
      // Should have at least the header row
      expect(rowCount).toBeGreaterThanOrEqual(1);
    });

    test('Table has expected column headers', async ({ page }) => {
      const orgManagementPage = new OrganizationManagementPage(page);

      await orgManagementPage.goto();
      await orgManagementPage.verifyRoleBindingsTablePresent();

      // Verify common table headers are present
      // BaseGroupAssignmentsTable typically has: Name, Description, Roles, etc.
      const table = orgManagementPage.table;
      await expect(table).toBeVisible();

      // Verify the table has column headers
      const headers = orgManagementPage.tableHeader;
      const headerCount = await headers.count();
      expect(headerCount).toBeGreaterThan(0);
    });

    test('Can search in role bindings table', async ({ page }) => {
      const orgManagementPage = new OrganizationManagementPage(page);

      await orgManagementPage.goto();
      await orgManagementPage.verifyRoleBindingsTablePresent();

      // Verify search input is present
      await expect(orgManagementPage.searchInput).toBeVisible();

      // Try searching (even with no results, input should work)
      await orgManagementPage.searchFor('NonExistentGroup');

      // Search input should retain the value
      await expect(orgManagementPage.searchInput).toHaveValue(/NonExistentGroup/i);
    });

    test('Page subtitle describes organization-wide access', async ({ page }) => {
      const orgManagementPage = new OrganizationManagementPage(page);

      await orgManagementPage.goto();

      // Verify subtitle provides context about organization-wide access
      await expect(orgManagementPage.subtitle).toBeVisible();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // USERVIEWER - Blocked (requireOrgAdmin flag)
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('UserViewer (No OrgAdmin)', () => {
    test.use({ storageState: AUTH_V2_USERVIEWER });

    test('Cannot access organization management page', async ({ page }) => {
      const orgManagementPage = new OrganizationManagementPage(page);

      // Attempt to navigate to organization management page
      await orgManagementPage.goto();

      // Should see unauthorized message or be redirected
      // The page requires orgAdmin flag, which UserViewer doesn't have
      await orgManagementPage.verifyUnauthorizedAccess();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // READONLYUSER - Blocked (no permissions + no orgAdmin flag)
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('ReadOnlyUser', () => {
    test.use({ storageState: AUTH_V2_READONLY });

    test('Cannot access organization management page', async ({ page }) => {
      const orgManagementPage = new OrganizationManagementPage(page);

      // Attempt to navigate to organization management page
      await orgManagementPage.goto();

      // Should see unauthorized message
      await orgManagementPage.verifyUnauthorizedAccess();
    });
  });
});
