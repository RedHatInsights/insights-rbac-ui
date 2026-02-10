/**
 * V1 Roles - System Role Protection Tests
 *
 * Tests that verify system roles (platform_default, admin_default, system=true)
 * CANNOT be edited or deleted. This is a critical security test.
 *
 * Based on Storybook coverage in ProductionOrgAdmin.stories.tsx which tests
 * CRUD operations only on custom roles, not system roles.
 *
 * Personas: Admin (to verify admin cannot bypass system role protection)
 */

import { expect, test } from '@playwright/test';
import { AUTH_V1_ADMIN } from '../../../utils';
import { RolesPage } from '../../../pages/v1/RolesPage';
import { E2E_TIMEOUTS } from '../../../utils/timeouts';

// ═══════════════════════════════════════════════════════════════════════════
// System Roles Configuration
// ═══════════════════════════════════════════════════════════════════════════

// These are well-known system roles that exist in all RBAC environments.
// They are marked with system: true and cannot be modified or deleted.
const SYSTEM_ROLES = ['Advisor administrator', 'Compliance administrator', 'Cost Administrator'];

// ═══════════════════════════════════════════════════════════════════════════
// Tests - Admin Cannot Modify System Roles
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Admin - System Role Protection', () => {
  test.use({ storageState: AUTH_V1_ADMIN });

  test('System roles do NOT have Edit action in row menu [Admin]', async ({ page }) => {
    const rolesPage = new RolesPage(page);
    await rolesPage.goto();

    // Test with first available system role
    for (const systemRoleName of SYSTEM_ROLES) {
      await rolesPage.searchFor(systemRoleName);

      // Check if role exists in this environment
      const roleRow = rolesPage.getRoleRow(systemRoleName);
      const isVisible = await roleRow.isVisible().catch(() => false);

      if (isVisible) {
        // Found a system role, verify it has no Edit action
        console.log(`[System Role] Testing protection for: ${systemRoleName}`);

        // Find the kebab menu for this specific row
        const kebab = roleRow.getByRole('button', { name: /actions/i });
        const hasKebab = await kebab.isVisible().catch(() => false);

        if (hasKebab) {
          await kebab.click();

          // Edit should NOT be visible
          const editItem = page.getByRole('menuitem', { name: /edit/i });
          await expect(editItem).not.toBeVisible();

          await page.keyboard.press('Escape');
        }
        // If no kebab menu at all, that's also acceptable - system roles may have no actions

        console.log(`[System Role] ✓ ${systemRoleName} is protected from editing`);
        return; // Test passed with this system role
      }
    }

    // If no system roles found, skip the test
    test.skip(true, 'No system roles found in environment');
  });

  test('System roles do NOT have Delete action in row menu [Admin]', async ({ page }) => {
    const rolesPage = new RolesPage(page);
    await rolesPage.goto();

    // Test with first available system role
    for (const systemRoleName of SYSTEM_ROLES) {
      await rolesPage.searchFor(systemRoleName);

      // Check if role exists in this environment
      const roleRow = rolesPage.getRoleRow(systemRoleName);
      const isVisible = await roleRow.isVisible().catch(() => false);

      if (isVisible) {
        // Found a system role, verify it has no Delete action
        console.log(`[System Role] Testing protection for: ${systemRoleName}`);

        // Find the kebab menu for this specific row
        const kebab = roleRow.getByRole('button', { name: /actions/i });
        const hasKebab = await kebab.isVisible().catch(() => false);

        if (hasKebab) {
          await kebab.click();

          // Delete should NOT be visible
          const deleteItem = page.getByRole('menuitem', { name: /delete/i });
          await expect(deleteItem).not.toBeVisible();

          await page.keyboard.press('Escape');
        }
        // If no kebab menu at all, that's also acceptable - system roles may have no actions

        console.log(`[System Role] ✓ ${systemRoleName} is protected from deletion`);
        return; // Test passed with this system role
      }
    }

    // If no system roles found, skip the test
    test.skip(true, 'No system roles found in environment');
  });

  test('System roles do NOT have Edit/Delete in detail page Actions menu [Admin]', async ({ page }) => {
    const rolesPage = new RolesPage(page);
    await rolesPage.goto();

    // Test with first available system role
    for (const systemRoleName of SYSTEM_ROLES) {
      await rolesPage.searchFor(systemRoleName);

      // Check if role exists in this environment
      const roleRow = rolesPage.getRoleRow(systemRoleName);
      const isVisible = await roleRow.isVisible().catch(() => false);

      if (isVisible) {
        console.log(`[System Role] Testing detail page protection for: ${systemRoleName}`);

        // Navigate to detail page
        await rolesPage.navigateToDetail(systemRoleName);
        await expect(rolesPage.getDetailHeading(systemRoleName)).toBeVisible({ timeout: E2E_TIMEOUTS.DETAIL_CONTENT });

        // Check if Actions button exists
        const actionsButton = rolesPage.detailActionsButton;
        const hasActions = await actionsButton.isVisible().catch(() => false);

        if (hasActions) {
          await actionsButton.click();

          // Edit and Delete should NOT be visible
          await expect(page.getByRole('menuitem', { name: /edit/i })).not.toBeVisible();
          await expect(page.getByRole('menuitem', { name: /delete/i })).not.toBeVisible();

          await page.keyboard.press('Escape');
        }
        // If no Actions button at all, that's acceptable - system roles have no actions

        console.log(`[System Role] ✓ ${systemRoleName} detail page is protected`);
        return; // Test passed with this system role
      }
    }

    // If no system roles found, skip the test
    test.skip(true, 'No system roles found in environment');
  });
});
