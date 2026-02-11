/**
 * Role Detail Tests
 *
 * Tests for viewing role detail pages.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * DECISION TREE - Add your test here if:
 * ═══════════════════════════════════════════════════════════════════════════════
 *   ✓ It views role detail page content (heading, description, tabs)
 *   ✓ It navigates from role detail to related entities
 *   ✓ It tests tab switching on the detail page
 *   ✓ It verifies permissions grid display
 *
 * DO NOT add here if:
 *   ✗ It creates, edits, or deletes a role → role-management.spec.ts
 *   ✗ It tests the roles table/list view → role-list.spec.ts
 *   ✗ It tests system role behavior → role-system.spec.ts
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * CAPABILITIES & PERSONAS
 * ═══════════════════════════════════════════════════════════════════════════════
 * @capability View Role Detail, Navigate to Related Entities
 * @personas
 *   - Admin: Full detail access
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * DATA PREREQUISITES
 * ═══════════════════════════════════════════════════════════════════════════════
 * @dependencies
 *   - AUTH: Uses AUTH_V1_ADMIN from utils
 *   - DATA: Relies on SEEDED_ROLE_NAME from seed-map (created in e2e:seed)
 *   - UTILS: Use RolesPage for navigation and assertions
 */

import { expect, test } from '@playwright/test';
import { AUTH_V1_ADMIN } from '../../../utils';
import { RolesPage } from '../../../pages/v1/RolesPage';
import { getSeededRoleData, getSeededRoleName } from '../../../utils/seed-map';
import { E2E_TIMEOUTS } from '../../../utils/timeouts';

const SEEDED_ROLE_NAME = getSeededRoleName('v1');
const SEEDED_ROLE_DATA = getSeededRoleData();

if (!SEEDED_ROLE_NAME) {
  throw new Error('No seeded role found in seed map. Run: npm run e2e:seed:v1');
}

// ═══════════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Role Detail', () => {
  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN - Full detail access
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('Admin', () => {
    test.use({ storageState: AUTH_V1_ADMIN });

    test(`Can view role detail page [Admin]`, async ({ page }) => {
      const rolesPage = new RolesPage(page);
      await rolesPage.goto();

      await rolesPage.searchFor(SEEDED_ROLE_NAME);
      await rolesPage.navigateToDetail(SEEDED_ROLE_NAME);

      // Verify detail page
      await expect(rolesPage.getDetailHeading(SEEDED_ROLE_NAME)).toBeVisible({ timeout: E2E_TIMEOUTS.DETAIL_CONTENT });

      // Verify description if available
      if (SEEDED_ROLE_DATA?.description) {
        await expect(page.getByText(SEEDED_ROLE_DATA.description)).toBeVisible({ timeout: E2E_TIMEOUTS.SLOW_DATA });
      }

      // Verify permissions grid
      await expect(rolesPage.table).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
    });
  });
});
