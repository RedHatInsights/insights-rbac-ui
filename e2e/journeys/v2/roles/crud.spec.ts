/**
 * V2 Roles - CRUD Tests
 *
 * Tests for creating, editing, and deleting roles.
 * Uses test.describe.serial() for lifecycle tests.
 *
 * Personas: Admin (only admin can perform CRUD)
 */

import { expect, test } from '@playwright/test';
import { AUTH_V2_ADMIN } from '../../../utils';
import { RolesPage } from '../../../pages/v2/RolesPage';
import { E2E_TIMEOUTS } from '../../../utils/timeouts';

// ═══════════════════════════════════════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════════════════════════════════════

const TEST_PREFIX = process.env.TEST_PREFIX_V2;

if (!TEST_PREFIX) {
  throw new Error(
    '\n\n' +
      '╔══════════════════════════════════════════════════════════════════════╗\n' +
      '║  SAFETY RAIL: TEST_PREFIX_V2 environment variable is REQUIRED       ║\n' +
      '╚══════════════════════════════════════════════════════════════════════╝\n',
  );
}

// Generate unique name for this test run
const timestamp = Date.now();
const uniqueRoleName = `${TEST_PREFIX}__E2E_Lifecycle_${timestamp}`;
const roleDescription = 'E2E lifecycle test role';
const editedRoleName = `${uniqueRoleName}_Edited`;
const editedDescription = 'E2E lifecycle test role - EDITED';

// ═══════════════════════════════════════════════════════════════════════════
// Tests - Admin Only
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Admin', () => {
  test.use({ storageState: AUTH_V2_ADMIN });

  test(`Create Role button is visible [Admin]`, async ({ page }) => {
    const rolesPage = new RolesPage(page);
    await rolesPage.goto();

    await expect(rolesPage.createButton).toBeVisible();
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

    test('View role in drawer', async ({ page }) => {
      const rolesPage = new RolesPage(page);
      await rolesPage.goto();

      await rolesPage.searchFor(uniqueRoleName);
      await rolesPage.openDrawer(uniqueRoleName);

      await expect(page.getByRole('heading', { name: uniqueRoleName, level: 2 })).toBeVisible();

      console.log(`[View] ✓ Drawer verified`);
    });

    test('Edit role', async ({ page }) => {
      const rolesPage = new RolesPage(page);
      await rolesPage.goto();

      await rolesPage.searchFor(uniqueRoleName);
      await rolesPage.openRowActions(uniqueRoleName);
      await rolesPage.clickRowAction('Edit');
      await rolesPage.fillEditPage(editedRoleName, editedDescription);

      console.log(`[Edit] ✓ Role renamed to: ${editedRoleName}`);
    });

    test('Verify edit was applied', async ({ page }) => {
      const rolesPage = new RolesPage(page);
      await rolesPage.goto();

      await rolesPage.searchFor(editedRoleName);
      await rolesPage.verifyRoleInTable(editedRoleName);

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
});

