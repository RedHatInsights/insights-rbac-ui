/**
 * Role Detail Tests
 *
 * Tests for viewing role details in drawer.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * DECISION TREE - Add your test here if:
 * ═══════════════════════════════════════════════════════════════════════════════
 *   ✓ It views role detail/drawer content (heading, description)
 *   ✓ It tests drawer open/close behavior
 *   ✓ It navigates from role detail to related entities
 *
 * DO NOT add here if:
 *   ✗ It creates, edits, or deletes a role → role-management.spec.ts
 *   ✗ It tests the roles table/list view → role-list.spec.ts
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
 *   - AUTH: Uses AUTH_V2_ADMIN from utils
 *   - DATA: Relies on SEEDED_ROLE_NAME from seed-map (created in e2e:seed)
 *   - UTILS: Use RolesPage for drawer interactions
 */

import { expect, test } from '@playwright/test';
import { AUTH_V2_ADMIN } from '../../../utils';
import { RolesPage } from '../../../pages/v2/RolesPage';
import { getSeededRoleName } from '../../../utils/seed-map';

const SEEDED_ROLE_NAME = getSeededRoleName('v2');

if (!SEEDED_ROLE_NAME) {
  throw new Error('No seeded role found in seed map. Run: npm run e2e:seed:v2');
}

// ═══════════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Role Detail', () => {
  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN - Full detail access
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('Admin', () => {
    test.use({ storageState: AUTH_V2_ADMIN });

    test(`Can view role details in drawer [Admin]`, async ({ page }) => {
      const rolesPage = new RolesPage(page);
      await rolesPage.goto();

      await rolesPage.searchFor(SEEDED_ROLE_NAME);
      await rolesPage.openDrawer(SEEDED_ROLE_NAME);

      // Verify drawer content
      await expect(page.getByRole('heading', { name: SEEDED_ROLE_NAME, level: 2 })).toBeVisible();

      await rolesPage.closeDrawer(SEEDED_ROLE_NAME);
    });
  });
});
