/**
 * Role Management Tests
 *
 * Tests for creating, editing, and deleting roles.
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
 *   ✗ It tests system role behavior → system.spec.ts
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
 *   - AUTH: Uses AUTH_V2_ORGADMIN, AUTH_V2_USERVIEWER, AUTH_V2_READONLY from utils
 *   - DATA: Relies on SEEDED_ROLE_NAME from seed-map (created in e2e:seed)
 *   - UTILS: Use RolesPage.createButton.click() for UI tests
 *            Use getSeededRoleName() for existing data - NEVER create via UI in viewer tests
 *   - PREFIX: Requires TEST_PREFIX_V2 env var for safe test isolation
 */

import { expect, test } from '@playwright/test';
import {
  AUTH_V2_ORGADMIN,
  AUTH_V2_RBACADMIN,
  AUTH_V2_READONLY,
  AUTH_V2_USERVIEWER,
  AUTH_V2_WORKSPACEUSER,
  iamUrl,
  requireTestPrefix,
  setupPage,
  v2,
} from '../../../utils';
import { getSeedFixture, getSeededRoleName, getSeededWorkspaceName } from '../../../utils/seed-map';
import { RolesPage } from '../../../pages/v2/RolesPage';
import { E2E_TIMEOUTS } from '../../../utils/timeouts';

// ═══════════════════════════════════════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════════════════════════════════════

const TEST_PREFIX = requireTestPrefix('v2');
const ROLES_URL = iamUrl(v2.accessManagementRoles.link());

// Generate unique name for this test run
const timestamp = Date.now();
const uniqueRoleName = `${TEST_PREFIX}__E2E_Lifecycle_${timestamp}`;
const roleDescription = 'E2E lifecycle test role';
const editedRoleName = `${uniqueRoleName}_Edited`;
const editedDescription = 'E2E lifecycle test role - EDITED';

// Get seeded workspace and role names
const SEEDED_WORKSPACE_NAME = getSeededWorkspaceName('v2');
const SEEDED_ROLE_NAME = getSeededRoleName('v2');

// Copy lifecycle: unique name for this test run
const COPY_ROLE_NAME = `${TEST_PREFIX}__Copy_Test_V2_${timestamp}`;

// ═══════════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Role Management', () => {
  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN - Full CRUD access
  // ═══════════════════════════════════════════════════════════════════════════
  // STATEFUL TESTS: Add create→edit→delete chains in the serial block
  // ATOMIC TESTS: Add standalone checks (button visibility) in the regular block

  test.describe.serial('OrgAdmin Lifecycle', () => {
    test.use({ storageState: AUTH_V2_ORGADMIN });

    test('Create role via wizard [OrgAdmin]', async ({ page }) => {
      test.skip(!SEEDED_WORKSPACE_NAME, 'No seed data — run npm run e2e:seed:v2');
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

    test('View role in drawer [OrgAdmin]', async ({ page }) => {
      const rolesPage = new RolesPage(page);
      await rolesPage.goto();

      await rolesPage.searchFor(uniqueRoleName);
      await rolesPage.openDrawer(uniqueRoleName);

      await expect(page.getByRole('heading', { name: uniqueRoleName, level: 2 })).toBeVisible();
    });

    test('Edit role [OrgAdmin]', async ({ page }) => {
      const rolesPage = new RolesPage(page);
      await rolesPage.goto();

      await rolesPage.searchFor(uniqueRoleName);
      await rolesPage.openRowActions(uniqueRoleName);
      await rolesPage.clickRowAction('Edit');
      await rolesPage.fillEditPage(editedRoleName, editedDescription);
    });

    test('Verify edit was applied [OrgAdmin]', async ({ page }) => {
      const rolesPage = new RolesPage(page);
      await rolesPage.goto();

      await rolesPage.searchFor(editedRoleName);
      await rolesPage.verifyRoleInTable(editedRoleName);
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

  test.describe.serial('OrgAdmin Copy Lifecycle', () => {
    test.use({ storageState: AUTH_V2_ORGADMIN });

    test('Create role by copying [OrgAdmin]', async ({ page }) => {
      test.skip(!SEEDED_WORKSPACE_NAME || !SEEDED_ROLE_NAME, 'No seed data — run npm run e2e:seed:v2');
      test
        .info()
        .annotations.push(
          { type: 'seed-role', description: `SEEDED_ROLE_NAME="${SEEDED_ROLE_NAME}"` },
          { type: 'seed-workspace', description: `SEEDED_WORKSPACE_NAME="${SEEDED_WORKSPACE_NAME}"` },
        );
      const rolesPage = new RolesPage(page);
      await rolesPage.goto();

      await rolesPage.createButton.click();
      await rolesPage.fillCreateWizardAsCopy(COPY_ROLE_NAME, SEEDED_ROLE_NAME!, SEEDED_WORKSPACE_NAME);
    });

    test('Verify copied role appears in table [OrgAdmin]', async ({ page }) => {
      test.skip(!SEEDED_WORKSPACE_NAME || !SEEDED_ROLE_NAME, 'No seed data — run npm run e2e:seed:v2');
      const rolesPage = new RolesPage(page);
      await rolesPage.goto();

      await rolesPage.searchFor(COPY_ROLE_NAME);
      await rolesPage.verifyRoleInTable(COPY_ROLE_NAME);
    });

    test('Copied role has correct permissions [OrgAdmin]', async ({ page }) => {
      test.skip(!SEEDED_WORKSPACE_NAME || !SEEDED_ROLE_NAME, 'No seed data — run npm run e2e:seed:v2');
      // The seeded role has permissions: ["inventory:hosts:read", "inventory:groups:read"]
      // Verify the copy's Permissions tab shows these values
      const seedPermissions = getSeedFixture('v2').roles?.[0]?.permissions ?? [];
      test.skip(seedPermissions.length === 0, 'No permissions defined in seed fixture');

      const rolesPage = new RolesPage(page);
      await rolesPage.goto();

      await rolesPage.searchFor(COPY_ROLE_NAME);
      await rolesPage.openDrawer(COPY_ROLE_NAME);

      // Permissions tab is active by default — verify expected permission strings appear
      const grid = page.getByRole('grid');
      await expect(grid.getByText('inventory').first()).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
      await expect(grid.getByText('hosts')).toBeVisible();
      await expect(grid.getByText('groups')).toBeVisible();
      await expect(grid.getByText('read').first()).toBeVisible();
    });

    test('Delete copied role [OrgAdmin]', async ({ page }) => {
      test.skip(!SEEDED_WORKSPACE_NAME || !SEEDED_ROLE_NAME, 'No seed data — run npm run e2e:seed:v2');
      const rolesPage = new RolesPage(page);
      await rolesPage.goto();

      await rolesPage.searchFor(COPY_ROLE_NAME);
      await rolesPage.openRowActions(COPY_ROLE_NAME);
      await rolesPage.clickRowAction('Delete');
      await rolesPage.confirmDelete();
    });
  });

  test.describe('OrgAdmin', () => {
    test.use({ storageState: AUTH_V2_ORGADMIN });

    test(`Create Role button is visible [OrgAdmin]`, async ({ page }) => {
      const rolesPage = new RolesPage(page);
      await rolesPage.goto();

      await expect(rolesPage.createButton).toBeVisible();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // USERVIEWER - No page access at all
  // ═══════════════════════════════════════════════════════════════════════════
  // Add "unauthorized message" tests here
  // These tests should navigate to URL and verify blocked access

  test.describe('UserViewer', () => {
    test.use({ storageState: AUTH_V2_USERVIEWER });

    test(`Roles page shows unauthorized access [UserViewer]`, async ({ page }) => {
      await setupPage(page);
      await expect(async () => {
        await page.goto(ROLES_URL, { timeout: E2E_TIMEOUTS.SLOW_DATA });
        await expect(page.getByText(/You do not have access to/i)).toBeVisible({ timeout: E2E_TIMEOUTS.DETAIL_CONTENT });
      }).toPass({ timeout: E2E_TIMEOUTS.SETUP_PAGE_LOAD, intervals: [1_000, 2_000, 5_000] });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // READONLYUSER - No permissions at all
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('ReadOnlyUser', () => {
    test.use({ storageState: AUTH_V2_READONLY });

    test(`Roles page shows unauthorized access [ReadOnlyUser]`, async ({ page }) => {
      await setupPage(page);
      await expect(async () => {
        await page.goto(ROLES_URL, { timeout: E2E_TIMEOUTS.SLOW_DATA });
        await expect(page.getByText(/You do not have access to/i)).toBeVisible({ timeout: E2E_TIMEOUTS.DETAIL_CONTENT });
      }).toPass({ timeout: E2E_TIMEOUTS.SETUP_PAGE_LOAD, intervals: [1_000, 2_000, 5_000] });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // WORKSPACEUSER (WorkspaceViewer) - Read-only roles access (has rbac_roles_read)
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('WorkspaceUser', () => {
    test.use({ storageState: AUTH_V2_WORKSPACEUSER });

    test('Roles page is accessible in read-only mode [WorkspaceUser]', async ({ page }) => {
      const rolesPage = new RolesPage(page);
      await rolesPage.goto();
      await expect(rolesPage.table).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
      await expect(rolesPage.createButton).not.toBeVisible();
    });
  });

  test.describe.serial('RbacAdmin Lifecycle', () => {
    test.use({ storageState: AUTH_V2_RBACADMIN });

    const raTimestamp = Date.now();
    const raRoleName = `${TEST_PREFIX}__RA_Lifecycle_${raTimestamp}`;
    const raRoleDescription = 'E2E RbacAdmin lifecycle role';
    const raEditedRoleName = `${raRoleName}_Edited`;
    const raEditedDescription = 'E2E RbacAdmin lifecycle role - EDITED';

    test('Create role via wizard [RbacAdmin]', async ({ page }) => {
      test.skip(!SEEDED_WORKSPACE_NAME, 'No seed data — run npm run e2e:seed:v2');
      const rolesPage = new RolesPage(page);
      await rolesPage.goto();

      await rolesPage.createButton.click();
      await rolesPage.fillCreateWizard(raRoleName, raRoleDescription);
    });

    test('Verify role appears in table [RbacAdmin]', async ({ page }) => {
      const rolesPage = new RolesPage(page);
      await rolesPage.goto();

      await rolesPage.searchFor(raRoleName);
      await rolesPage.verifyRoleInTable(raRoleName);
    });

    test('Edit role [RbacAdmin]', async ({ page }) => {
      const rolesPage = new RolesPage(page);
      await rolesPage.goto();

      await rolesPage.searchFor(raRoleName);
      await rolesPage.openRowActions(raRoleName);
      await rolesPage.clickRowAction('Edit');
      await rolesPage.fillEditPage(raEditedRoleName, raEditedDescription);
    });

    test('Verify edit was applied [RbacAdmin]', async ({ page }) => {
      const rolesPage = new RolesPage(page);
      await rolesPage.goto();

      await rolesPage.searchFor(raEditedRoleName);
      await rolesPage.verifyRoleInTable(raEditedRoleName);
    });

    test('Delete role [RbacAdmin]', async ({ page }) => {
      const rolesPage = new RolesPage(page);
      await rolesPage.goto();

      await rolesPage.searchFor(raEditedRoleName);
      await rolesPage.openRowActions(raEditedRoleName);
      await rolesPage.clickRowAction('Delete');
      await rolesPage.confirmDelete();
    });

    test('Verify role is deleted [RbacAdmin]', async ({ page }) => {
      const rolesPage = new RolesPage(page);
      await rolesPage.goto();

      await rolesPage.searchFor(raEditedRoleName);
      await rolesPage.verifyRoleNotInTable(raEditedRoleName);
    });
  });

  test.describe('RbacAdmin', () => {
    test.use({ storageState: AUTH_V2_RBACADMIN });

    test('Create Role button is visible [RbacAdmin]', async ({ page }) => {
      const rolesPage = new RolesPage(page);
      await rolesPage.goto();
      await expect(rolesPage.createButton).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Bulk Actions
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('OrgAdmin - Bulk Actions', () => {
    test.use({ storageState: AUTH_V2_ORGADMIN });

    test('Can select role and see bulk actions in toolbar [OrgAdmin]', async ({ page }) => {
      const rolesPage = new RolesPage(page);
      await rolesPage.goto();

      const table = page.getByRole('grid');
      const checkboxes = table.locator('tbody input[type="checkbox"]');
      await expect(checkboxes.first()).toBeVisible({ timeout: E2E_TIMEOUTS.ELEMENT_VISIBLE });

      await checkboxes.first().click();

      // Verify toolbar actions become available after selection
      const actionsButton = page.getByRole('button', { name: /actions overflow|delete role/i });
      await expect(actionsButton).toBeVisible({ timeout: E2E_TIMEOUTS.ELEMENT_VISIBLE });
    });
  });
});
