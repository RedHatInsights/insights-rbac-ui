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
 *   ✗ It views role detail page content → role-detail.spec.ts
 *   ✗ It tests system role behavior → role-system.spec.ts
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
 *   - AUTH: Uses AUTH_V1_ADMIN from utils
 *   - DATA: Relies on SEEDED_ROLE_NAME from seed-map (created in e2e:seed)
 *   - UTILS: Use RolesPage for table interactions
 */

import { expect, test } from '@playwright/test';
import { AUTH_V1_ADMIN } from '../../../utils';
import { RolesPage } from '../../../pages/v1/RolesPage';
import { getSeededRoleName } from '../../../utils/seed-map';

const SEEDED_ROLE_NAME = getSeededRoleName('v1');

if (!SEEDED_ROLE_NAME) {
  throw new Error('No seeded role found in seed map. Run: npm run e2e:seed:v1');
}

// ═══════════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Role List', () => {
  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN - Full list access
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('Admin', () => {
    test.use({ storageState: AUTH_V1_ADMIN });

    test(`Can view roles list [Admin]`, async ({ page }) => {
      const rolesPage = new RolesPage(page);
      await rolesPage.goto();

      await expect(rolesPage.table).toBeVisible();
    });

    test(`Can search for seeded role [Admin]`, async ({ page }) => {
      const rolesPage = new RolesPage(page);
      await rolesPage.goto();

      await rolesPage.searchFor(SEEDED_ROLE_NAME);
      await rolesPage.verifyRoleInTable(SEEDED_ROLE_NAME);
    });
  });
});
