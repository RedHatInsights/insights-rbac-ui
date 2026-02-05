/**
 * V1 Roles - CRUD Tests
 *
 * Tests for creating, editing, and deleting roles.
 * Uses test.describe.serial() for lifecycle tests.
 *
 * Personas: Admin (only admin can perform CRUD)
 */

import { expect, test } from '@playwright/test';
import { AUTH_V1_ADMIN, AUTH_V1_USERVIEWER } from '../../../utils';
import { getSeededRoleName } from '../../../utils/seed-map';
import { RolesPage } from '../../../pages/v1/RolesPage';
import { E2E_TIMEOUTS } from '../../../utils/timeouts';

// ═══════════════════════════════════════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════════════════════════════════════

const TEST_PREFIX = process.env.TEST_PREFIX_V1;

if (!TEST_PREFIX) {
  throw new Error(
    '\n\n' +
      '╔══════════════════════════════════════════════════════════════════════╗\n' +
      '║  SAFETY RAIL: TEST_PREFIX_V1 environment variable is REQUIRED       ║\n' +
      '╚══════════════════════════════════════════════════════════════════════╝\n',
  );
}

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
// Tests - Admin Only
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Admin', () => {
  test.use({ storageState: AUTH_V1_ADMIN });

  test(`Create Role button is visible [Admin]`, async ({ page }) => {
    const rolesPage = new RolesPage(page);
    await rolesPage.goto();

    await expect(rolesPage.createButton).toBeVisible();
  });

  test(`Edit and Delete actions are available on detail page [Admin]`, async ({ page }) => {
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

  // ─────────────────────────────────────────────────────────────────────────
  // CRUD Lifecycle - Sequential Tests
  // ─────────────────────────────────────────────────────────────────────────

  test.describe.serial('CRUD Lifecycle [Admin]', () => {
    test('Create role via wizard', async ({ page }) => {
      const rolesPage = new RolesPage(page);
      await rolesPage.goto();

      await rolesPage.createButton.click();
      await rolesPage.fillCreateWizard(uniqueRoleName, roleDescription);

      console.log(`[Create] ✓ Role created: ${uniqueRoleName}`);
    });

    test('Verify role appears in table', async ({ page }) => {
      const rolesPage = new RolesPage(page);
      await rolesPage.goto();

      await rolesPage.searchFor(uniqueRoleName);
      await rolesPage.verifyRoleInTable(uniqueRoleName);

      console.log(`[Verify] ✓ Role found in table`);
    });

    test('View role detail page', async ({ page }) => {
      const rolesPage = new RolesPage(page);
      await rolesPage.goto();

      await rolesPage.searchFor(uniqueRoleName);
      await rolesPage.navigateToDetail(uniqueRoleName);

      await expect(rolesPage.getDetailHeading(uniqueRoleName)).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
      await expect(page.getByText(roleDescription)).toBeVisible();

      console.log(`[View] ✓ Detail page verified`);
    });

    test('Edit role from list', async ({ page }) => {
      const rolesPage = new RolesPage(page);
      await rolesPage.goto();

      await rolesPage.searchFor(uniqueRoleName);
      await rolesPage.openRowActions(uniqueRoleName);
      await rolesPage.clickRowAction('Edit');
      await rolesPage.fillEditModal(editedRoleName, editedDescription);
      await rolesPage.verifySuccess();

      console.log(`[Edit] ✓ Role renamed to: ${editedRoleName}`);
    });

    test('Verify edit was applied', async ({ page }) => {
      const rolesPage = new RolesPage(page);
      await rolesPage.goto();

      await rolesPage.searchFor(editedRoleName);
      await rolesPage.verifyRoleInTable(editedRoleName);

      await rolesPage.navigateToDetail(editedRoleName);
      await expect(page.getByText(editedDescription)).toBeVisible();

      console.log(`[Verify Edit] ✓ Changes confirmed`);
    });

    test('Delete role', async ({ page }) => {
      const rolesPage = new RolesPage(page);
      await rolesPage.goto();

      await rolesPage.searchFor(editedRoleName);
      await rolesPage.openRowActions(editedRoleName);
      await rolesPage.clickRowAction('Delete');
      await rolesPage.confirmDelete();

      console.log(`[Delete] ✓ Deletion confirmed`);
    });

    test('Verify role is deleted', async ({ page }) => {
      const rolesPage = new RolesPage(page);
      await rolesPage.goto();

      await rolesPage.searchFor(editedRoleName);
      await rolesPage.verifyRoleNotInTable(editedRoleName);

      console.log(`[Verify Delete] ✓ Role no longer exists`);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Copy Role Lifecycle - Uses seeded role as source
  // Based on Storybook: Create role by copying an existing role
  // ─────────────────────────────────────────────────────────────────────────

  test.describe.serial('Copy Role Lifecycle [Admin]', () => {
    test('Create role by copying seeded role', async ({ page }) => {
      const rolesPage = new RolesPage(page);
      await rolesPage.goto();

      await rolesPage.createButton.click();
      await rolesPage.fillCreateWizardAsCopy(copiedRoleName, SEEDED_ROLE_NAME, copiedRoleDescription);

      console.log(`[Copy] ✓ Role copied from: ${SEEDED_ROLE_NAME} to: ${copiedRoleName}`);
    });

    test('Verify copied role appears in table', async ({ page }) => {
      const rolesPage = new RolesPage(page);
      await rolesPage.goto();

      await rolesPage.searchFor(copiedRoleName);
      await rolesPage.verifyRoleInTable(copiedRoleName);

      console.log(`[Verify Copy] ✓ Copied role found in table`);
    });

    test('Verify copied role has inherited permissions', async ({ page }) => {
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

        console.log(`[Verify Permissions] ✓ Copied role has ${rowCount - 1} permissions`);
      }
    });

    test('Delete copied role (cleanup)', async ({ page }) => {
      const rolesPage = new RolesPage(page);
      await rolesPage.goto();

      await rolesPage.searchFor(copiedRoleName);
      await rolesPage.openRowActions(copiedRoleName);
      await rolesPage.clickRowAction('Delete');
      await rolesPage.confirmDelete();

      console.log(`[Cleanup] ✓ Copied role deleted`);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// UserViewer - Read-Only Restrictions
// ═══════════════════════════════════════════════════════════════════════════

test.describe('UserViewer', () => {
  test.use({ storageState: AUTH_V1_USERVIEWER });

  test(`Create Role button is NOT visible [UserViewer]`, async ({ page }) => {
    const rolesPage = new RolesPage(page);
    await rolesPage.goto();

    await expect(rolesPage.createButton).not.toBeVisible();
  });

  test(`Edit and Delete actions are NOT available on detail page [UserViewer]`, async ({ page }) => {
    const rolesPage = new RolesPage(page);
    await rolesPage.goto();

    // Navigate to seeded role's detail
    await rolesPage.searchFor(SEEDED_ROLE_NAME);
    await rolesPage.navigateToDetail(SEEDED_ROLE_NAME);

    // Actions button should not exist or not have Edit/Delete
    const actionsButton = rolesPage.detailActionsButton;
    if (await actionsButton.isVisible().catch(() => false)) {
      await actionsButton.click();
      await expect(page.getByRole('menuitem', { name: /edit/i })).not.toBeVisible();
      await expect(page.getByRole('menuitem', { name: /delete/i })).not.toBeVisible();
      await page.keyboard.press('Escape');
    }
    // If no actions button, that's also acceptable
  });
});
