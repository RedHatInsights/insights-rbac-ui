/**
 * V2 Roles - System Role Protection Tests
 *
 * Tests that system roles (platform_default, admin_default, system=true)
 * CANNOT be edited or deleted. This is a critical security test.
 *
 * V2: Uses drawer for detail, kebab for row actions.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * DECISION TREE - Add your test here if:
 * ═══════════════════════════════════════════════════════════════════════════════
 *   ✓ It verifies system roles cannot be edited or deleted
 *   ✓ It verifies system roles are not selectable for bulk actions
 *
 * DO NOT add here if:
 *   ✗ It creates, edits, copies, or deletes custom roles → role-management.spec.ts
 *   ✗ It only reads/views role data → role-detail.spec.ts
 *   ✗ It tests table sorting/filtering/pagination → role-list.spec.ts
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * CAPABILITIES & PERSONAS
 * ═══════════════════════════════════════════════════════════════════════════════
 * @capability System Role Protection
 * @personas
 *   - Admin: Verifies admin cannot bypass system role protection
 */

import { expect, test } from '@playwright/test';
import { AUTH_V2_ORGADMIN } from '../../../utils';
import { RolesPage } from '../../../pages/v2/RolesPage';

// ═══════════════════════════════════════════════════════════════════════════
// System Roles Configuration
// ═══════════════════════════════════════════════════════════════════════════

// Well-known system roles that exist in all RBAC environments.
// At least one of these should be present for the tests to be meaningful.
const SYSTEM_ROLES = ['Advisor administrator', 'Compliance administrator', 'Cost Administrator'];

// ═══════════════════════════════════════════════════════════════════════════
// Tests - Admin Cannot Modify System Roles
// ═══════════════════════════════════════════════════════════════════════════

test.describe('System Role Protection', () => {
  test.describe('OrgAdmin', () => {
    test.use({ storageState: AUTH_V2_ORGADMIN });

    test('System roles have no Edit action in kebab [OrgAdmin]', async ({ page }) => {
      const rolesPage = new RolesPage(page);
      await rolesPage.goto();

      for (const systemRoleName of SYSTEM_ROLES) {
        await rolesPage.searchFor(systemRoleName);

        const roleRow = rolesPage.getRoleRow(systemRoleName);
        const isVisible = await roleRow.isVisible().catch(() => false);

        if (isVisible) {
          const kebab = roleRow.getByRole('button', { name: /actions/i });
          const hasKebab = await kebab.isVisible().catch(() => false);

          if (hasKebab) {
            await kebab.click();
            const editItem = page.getByRole('menuitem', { name: /edit/i });
            await expect(editItem).toHaveCount(0);
            await page.keyboard.press('Escape');
          }

          return;
        }
      }

      test.skip(true, 'No system roles found in environment');
    });

    test('System roles have no Delete action in kebab [OrgAdmin]', async ({ page }) => {
      const rolesPage = new RolesPage(page);
      await rolesPage.goto();

      for (const systemRoleName of SYSTEM_ROLES) {
        await rolesPage.searchFor(systemRoleName);

        const roleRow = rolesPage.getRoleRow(systemRoleName);
        const isVisible = await roleRow.isVisible().catch(() => false);

        if (isVisible) {
          const kebab = roleRow.getByRole('button', { name: /actions/i });
          const hasKebab = await kebab.isVisible().catch(() => false);

          if (hasKebab) {
            await kebab.click();
            const deleteItem = page.getByRole('menuitem', { name: /delete/i });
            await expect(deleteItem).toHaveCount(0);
            await page.keyboard.press('Escape');
          }

          return;
        }
      }

      test.skip(true, 'No system roles found in environment');
    });

    test('System roles are not selectable [OrgAdmin]', async ({ page }) => {
      const rolesPage = new RolesPage(page);
      await rolesPage.goto();

      for (const systemRoleName of SYSTEM_ROLES) {
        await rolesPage.searchFor(systemRoleName);

        const row = page.getByRole('row', { name: new RegExp(systemRoleName, 'i') });
        const isVisible = await row.isVisible().catch(() => false);

        if (isVisible) {
          const checkbox = row.locator('input[type="checkbox"]');
          const count = await checkbox.count();
          if (count > 0) {
            await expect(checkbox).toBeDisabled();
          }
          return;
        }
      }

      test.skip(true, 'No system roles found in environment');
    });
  });
});
