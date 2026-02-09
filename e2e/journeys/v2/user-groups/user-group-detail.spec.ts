/**
 * User Group Detail Tests
 *
 * Tests for viewing user group details in drawer.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * DECISION TREE - Add your test here if:
 * ═══════════════════════════════════════════════════════════════════════════════
 *   ✓ It views user group detail/drawer content (heading, description)
 *   ✓ It tests drawer open/close behavior
 *   ✓ It navigates from group detail to related entities
 *
 * DO NOT add here if:
 *   ✗ It creates, edits, or deletes a user group → user-group-management.spec.ts
 *   ✗ It tests the user groups table/list view → user-group-list.spec.ts
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * CAPABILITIES & PERSONAS
 * ═══════════════════════════════════════════════════════════════════════════════
 * @capability View User Group Detail, Navigate to Related Entities
 * @personas
 *   - Admin: Full detail access
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * DATA PREREQUISITES
 * ═══════════════════════════════════════════════════════════════════════════════
 * @dependencies
 *   - AUTH: Uses AUTH_V2_ADMIN from utils
 *   - DATA: Relies on SEEDED_GROUP_NAME from seed-map (created in e2e:seed)
 *   - UTILS: Use UserGroupsPage for drawer interactions
 */

import { expect, test } from '@playwright/test';
import { AUTH_V2_ADMIN, getSeededGroupName } from '../../../utils';
import { UserGroupsPage } from '../../../pages/v2/UserGroupsPage';

const SEEDED_GROUP_NAME = getSeededGroupName('v2');

if (!SEEDED_GROUP_NAME) {
  throw new Error('No seeded group found in seed map. Run: npm run e2e:seed:v2');
}

// ═══════════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════════

test.describe('User Group Detail', () => {
  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN - Full detail access
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('Admin', () => {
    test.use({ storageState: AUTH_V2_ADMIN });

    test(`Can view group details in drawer [Admin]`, async ({ page }) => {
      const groupsPage = new UserGroupsPage(page);
      await groupsPage.goto();

      await groupsPage.searchFor(SEEDED_GROUP_NAME);
      await groupsPage.openDrawer(SEEDED_GROUP_NAME);

      // Verify drawer content
      await expect(groupsPage.drawer.getByRole('heading', { name: SEEDED_GROUP_NAME })).toBeVisible();

      await groupsPage.closeDrawer(SEEDED_GROUP_NAME);
    });
  });
});
