/**
 * Role Management Tests
 *
 * Tests for creating, editing, copying, and deleting roles.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * DECISION TREE - Add your test here if:
 * ═══════════════════════════════════════════════════════════════════════════════
 *   ✓ It creates, edits, copies, or deletes a role
 *   ✓ It checks if a button/action for create/edit/delete is visible/hidden/disabled
 *   ✓ It verifies a permission denial (403) for write operations
 *
 * DO NOT add here if:
 *   ✗ It only reads/views data → role-detail.spec.ts
 *   ✗ It tests table sorting/filtering/pagination → role-list.spec.ts
 *   ✗ It tests system role behavior → role-system.spec.ts
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * CAPABILITIES & PERSONAS
 * ═══════════════════════════════════════════════════════════════════════════════
 * @capability Create Role, Edit Role, Delete Role, Copy Role
 * @personas
 *   - Admin: Full CRUD access (use serial lifecycle for stateful tests)
 *   - UserViewer: Page blocked entirely (unauthorized message)
 *   - ReadOnlyUser: Page blocked entirely (unauthorized message)
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * DATA PREREQUISITES
 * ═══════════════════════════════════════════════════════════════════════════════
 * @dependencies
 *   - AUTH: Uses AUTH_V1_ORGADMIN, AUTH_V1_USERVIEWER, AUTH_V1_READONLY from utils
 *   - DATA: Relies on SEEDED_ROLE_NAME from seed-map (created in e2e:seed)
 *   - UTILS: Use RolesPage.createButton.click() for UI tests
 *            Use getSeededRoleName() for existing data - NEVER create via UI in viewer tests
 *   - PREFIX: Requires TEST_PREFIX_V1 env var for safe test isolation
 */

import { expect, test } from '@playwright/test';
import { AUTH_V1_ORGADMIN, AUTH_V1_READONLY, AUTH_V1_USERVIEWER, iamUrl, requireTestPrefix, setupPage, v1 } from '../../../utils';
import { getSeededRoleName } from '../../../utils/seed-map';
import { RolesPage } from '../../../pages/v1/RolesPage';
import { E2E_TIMEOUTS } from '../../../utils/timeouts';

// ═══════════════════════════════════════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════════════════════════════════════

const TEST_PREFIX = requireTestPrefix('v1');
const ROLES_URL = iamUrl(v1.roles.link());

// Golden rule: always interact with seeded data from the seed map
const SEEDED_ROLE_NAME = getSeededRoleName('v1');
if (!SEEDED_ROLE_NAME) {
  throw new Error('No seeded role found in seed map. Run: npm run e2e:v1:seed');
}

// Generate unique name for this test run
const timestamp = Date.now();
const uniqueRoleName = `${TEST_PREFIX}__E2E_Lifecycle_${timestamp}`;
const roleDescription = 'E2E lifecycle test role';
const editedRoleName = `${uniqueRoleName}_Edited`;
const editedDescription = 'E2E lifecycle test role - EDITED';

// Name for copied role test
const copiedRoleName = `${TEST_PREFIX}__E2E_Copy_${timestamp}`;
const copiedRoleDescription = 'E2E copy test role';

// ═══════════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Role Management', () => {
  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN - Full CRUD access
  // ═══════════════════════════════════════════════════════════════════════════
  // STATEFUL TESTS: Add create→edit→delete chains in the serial block
  // ATOMIC TESTS: Add standalone checks (button visibility) in the regular block

  test.describe.serial('Admin Lifecycle', () => {
    test.use({ storageState: AUTH_V1_ORGADMIN });

    test('Create role via wizard [OrgAdmin]', async ({ page }) => {
      const rolesPage = new RolesPage(page);
      await rolesPage.goto();

      await rolesPage.createButton.click();
      await rolesPage.fillCreateWizard(uniqueRoleName, roleDescription);
    });

    test('Verify role appears in table [OrgAdmin]', async ({ page }) => {
      const rolesPage = new RolesPage(page);
      await rolesPage.goto();

      await rolesPage.searchFor(uniqueRoleName);
      await rolesPage.verifyRoleInTable(uniqueRoleName);
    });

    test('View role detail page [OrgAdmin]', async ({ page }) => {
      const rolesPage = new RolesPage(page);
      await rolesPage.goto();

      await rolesPage.searchFor(uniqueRoleName);
      await rolesPage.navigateToDetail(uniqueRoleName);

      await expect(rolesPage.getDetailHeading(uniqueRoleName)).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
      await expect(page.getByText(roleDescription)).toBeVisible();
    });

    test('Edit role from list [OrgAdmin]', async ({ page }) => {
      const rolesPage = new RolesPage(page);
      await rolesPage.goto();

      await rolesPage.searchFor(uniqueRoleName);
      await rolesPage.openRowActions(uniqueRoleName);
      await rolesPage.clickRowAction('Edit');
      await rolesPage.fillEditModal(editedRoleName, editedDescription);
      await rolesPage.verifySuccess();
    });

    test('Verify edit was applied [OrgAdmin]', async ({ page }) => {
      const rolesPage = new RolesPage(page);
      await rolesPage.goto();

      await rolesPage.searchFor(editedRoleName);
      await rolesPage.verifyRoleInTable(editedRoleName);

      await rolesPage.navigateToDetail(editedRoleName);
      await expect(page.getByText(editedDescription)).toBeVisible();
    });

    test('Delete role [OrgAdmin]', async ({ page }) => {
      const rolesPage = new RolesPage(page);
      await rolesPage.goto();

      await rolesPage.searchFor(editedRoleName);
      await rolesPage.openRowActions(editedRoleName);
      await rolesPage.clickRowAction('Delete');
      await rolesPage.confirmDelete();
    });

    test('Verify role is deleted [OrgAdmin]', async ({ page }) => {
      const rolesPage = new RolesPage(page);
      await rolesPage.goto();

      await rolesPage.searchFor(editedRoleName);
      await rolesPage.verifyRoleNotInTable(editedRoleName);
    });
  });

  test.describe.serial('Admin Copy Lifecycle', () => {
    test.use({ storageState: AUTH_V1_ORGADMIN });

    test('Create role by copying first available role [OrgAdmin]', async ({ page }) => {
      const rolesPage = new RolesPage(page);
      await rolesPage.goto();

      await rolesPage.createButton.click();
      await rolesPage.fillCreateWizardAsCopy(copiedRoleName, undefined, undefined, copiedRoleDescription);
    });

    test('Verify copied role appears in table [OrgAdmin]', async ({ page }) => {
      const rolesPage = new RolesPage(page);
      await rolesPage.goto();

      await rolesPage.searchFor(copiedRoleName);
      await rolesPage.verifyRoleInTable(copiedRoleName);
    });

    test('Verify copied role has inherited permissions [OrgAdmin]', async ({ page }) => {
      const rolesPage = new RolesPage(page);
      await rolesPage.goto();

      await rolesPage.searchFor(copiedRoleName);
      await rolesPage.navigateToDetail(copiedRoleName);

      await expect(rolesPage.getDetailHeading(copiedRoleName)).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });

      // Verify the copied role has permissions (inherited from source)
      // The Permissions tab should show permissions
      const permissionsTab = page.getByRole('tab', { name: /permissions/i });
      if (await permissionsTab.isVisible().catch(() => false)) {
        await permissionsTab.click();
        // Should have at least one permission row
        const table = page.getByRole('grid');
        const rows = table.getByRole('row');
        const rowCount = await rows.count();
        expect(rowCount).toBeGreaterThan(1); // More than just header row
      }
    });

    test('Delete copied role (cleanup) [OrgAdmin]', async ({ page }) => {
      const rolesPage = new RolesPage(page);
      await rolesPage.goto();

      await rolesPage.searchFor(copiedRoleName);
      await rolesPage.openRowActions(copiedRoleName);
      await rolesPage.clickRowAction('Delete');
      await rolesPage.confirmDelete();
    });
  });

  test.describe('OrgAdmin', () => {
    test.use({ storageState: AUTH_V1_ORGADMIN });

    test(`Create Role button is visible [OrgAdmin]`, async ({ page }) => {
      const rolesPage = new RolesPage(page);
      await rolesPage.goto();

      await expect(rolesPage.createButton).toBeVisible();
    });

    test(`Edit and Delete actions are available on detail page [OrgAdmin]`, async ({ page }) => {
      const rolesPage = new RolesPage(page);
      await rolesPage.goto();

      // Navigate to seeded role's detail (system roles don't have edit/delete actions)
      await rolesPage.searchFor(SEEDED_ROLE_NAME);
      await rolesPage.navigateToDetail(SEEDED_ROLE_NAME);

      // Wait for detail page to fully render
      await expect(rolesPage.getDetailHeading(SEEDED_ROLE_NAME)).toBeVisible({ timeout: E2E_TIMEOUTS.DETAIL_CONTENT });

      await rolesPage.openDetailActions();
      await expect(page.getByRole('menuitem', { name: /edit/i })).toBeVisible();
      await expect(page.getByRole('menuitem', { name: /delete/i })).toBeVisible();
      await page.keyboard.press('Escape');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // USERVIEWER - No page access at all
  // ═══════════════════════════════════════════════════════════════════════════
  // Add "unauthorized message" tests here
  // These tests should navigate to URL and verify blocked access

  test.describe('UserViewer', () => {
    test.use({ storageState: AUTH_V1_USERVIEWER });

    test(`Roles page shows unauthorized access [UserViewer]`, async ({ page }) => {
      await setupPage(page);
      await page.goto(ROLES_URL);

      await expect(page.getByText(/You do not have access to/i)).toBeVisible({ timeout: E2E_TIMEOUTS.DETAIL_CONTENT });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // READONLYUSER - No page access at all
  // ═══════════════════════════════════════════════════════════════════════════
  // Add "unauthorized message" tests here
  // These tests should navigate to URL and verify blocked access

  test.describe('ReadOnlyUser', () => {
    test.use({ storageState: AUTH_V1_READONLY });

    test(`Roles page shows unauthorized access [ReadOnlyUser]`, async ({ page }) => {
      await setupPage(page);
      await page.goto(ROLES_URL);

      await expect(page.getByText(/You do not have access to/i)).toBeVisible({ timeout: E2E_TIMEOUTS.DETAIL_CONTENT });
    });
  });
});
