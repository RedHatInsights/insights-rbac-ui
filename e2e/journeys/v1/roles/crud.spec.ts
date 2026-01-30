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
import { RolesPage } from '../../../pages/v1/RolesPage';

// ═══════════════════════════════════════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════════════════════════════════════

const TEST_PREFIX = process.env.TEST_PREFIX;

if (!TEST_PREFIX) {
  throw new Error(
    '\n\n' +
      '╔══════════════════════════════════════════════════════════════════════╗\n' +
      '║  SAFETY RAIL: TEST_PREFIX environment variable is REQUIRED          ║\n' +
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
  test.use({ storageState: AUTH_V1_ADMIN });

  test(`Create Role button is visible [Admin]`, async ({ page }) => {
    const rolesPage = new RolesPage(page);
    await rolesPage.goto();

    await expect(rolesPage.createButton).toBeVisible();
  });

  test(`Edit and Delete actions are available on detail page [Admin]`, async ({ page }) => {
    const rolesPage = new RolesPage(page);
    await rolesPage.goto();

    // Navigate to any custom role's detail
    const firstCustomRoleLink = rolesPage.table.getByRole('link').first();
    await firstCustomRoleLink.click();
    await expect(page).toHaveURL(/\/roles\//);

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

      await expect(rolesPage.getDetailHeading(uniqueRoleName)).toBeVisible({ timeout: 10000 });
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

    // Navigate to any role's detail
    const firstRoleLink = rolesPage.table.getByRole('link').first();
    await firstRoleLink.click();
    await expect(page).toHaveURL(/\/roles\//);

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
