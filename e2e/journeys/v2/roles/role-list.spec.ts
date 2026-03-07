/**
 * Role List Tests
 *
 * Tests for the roles table/list view.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * DECISION TREE - Add your test here if:
 * ═══════════════════════════════════════════════════════════════════════════════
 *   ✓ It tests table visibility or structure
 *   ✓ It tests search/filter functionality
 *   ✓ It tests sorting or pagination
 *   ✓ It tests column visibility or ordering
 *
 * DO NOT add here if:
 *   ✗ It creates, edits, or deletes a role → role-management.spec.ts
 *   ✗ It views role detail/drawer content → role-detail.spec.ts
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * CAPABILITIES & PERSONAS
 * ═══════════════════════════════════════════════════════════════════════════════
 * @capability View Roles List, Search Roles, Filter Roles
 * @personas
 *   - Admin: Full list access
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * DATA PREREQUISITES
 * ═══════════════════════════════════════════════════════════════════════════════
 * @dependencies
 *   - AUTH: Uses AUTH_V2_ORGADMIN from utils
 *   - DATA: Relies on SEEDED_ROLE_NAME from seed-map (created in e2e:seed)
 *   - UTILS: Use RolesPage for table interactions
 */

import { expect, test } from '@playwright/test';
import { AUTH_V2_ORGADMIN, AUTH_V2_RBACADMIN } from '../../../utils';
import { RolesPage } from '../../../pages/v2/RolesPage';
import { E2E_TIMEOUTS } from '../../../utils/timeouts';
import { getSeededRoleName } from '../../../utils/seed-map';

const SEEDED_ROLE_NAME = getSeededRoleName('v2');

// ═══════════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Role List', () => {
  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN - Full list access
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('OrgAdmin', () => {
    test.use({ storageState: AUTH_V2_ORGADMIN });

    test(`Can view roles list [OrgAdmin]`, async ({ page }) => {
      const rolesPage = new RolesPage(page);
      await rolesPage.goto();

      await expect(rolesPage.table).toBeVisible();
    });

    test(`Can search for seeded role [OrgAdmin]`, async ({ page }) => {
      test.skip(!SEEDED_ROLE_NAME, 'No seed data — run npm run e2e:seed:v2');
      const rolesPage = new RolesPage(page);
      await rolesPage.goto();

      await rolesPage.searchFor(SEEDED_ROLE_NAME!);
      await rolesPage.verifyRoleInTable(SEEDED_ROLE_NAME!);
    });
  });

  test.describe('RbacAdmin', () => {
    test.use({ storageState: AUTH_V2_RBACADMIN });

    test('Can view roles list [RbacAdmin]', async ({ page }) => {
      const rolesPage = new RolesPage(page);
      await rolesPage.goto();
      await expect(rolesPage.table).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
    });
  });
});
