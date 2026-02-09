/**
 * Group List Tests
 *
 * Tests for the groups table/list view.
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
 *   ✗ It creates, edits, or deletes a group → group-management.spec.ts
 *   ✗ It views group detail page content → group-detail.spec.ts
 *   ✗ It manages group members or roles → group-membership.spec.ts
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * CAPABILITIES & PERSONAS
 * ═══════════════════════════════════════════════════════════════════════════════
 * @capability View Groups List, Search Groups, Filter Groups
 * @personas
 *   - Admin: Full list access
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * DATA PREREQUISITES
 * ═══════════════════════════════════════════════════════════════════════════════
 * @dependencies
 *   - AUTH: Uses AUTH_V1_ADMIN from utils
 *   - DATA: Relies on SEEDED_GROUP_NAME from seed-map (created in e2e:seed)
 *   - UTILS: Use GroupsPage for table interactions
 */

import { expect, test } from '@playwright/test';
import { AUTH_V1_ADMIN } from '../../../utils';
import { GroupsPage } from '../../../pages/v1/GroupsPage';
import { getSeededGroupName } from '../../../utils/seed-map';

const SEEDED_GROUP_NAME = getSeededGroupName('v1');

if (!SEEDED_GROUP_NAME) {
  throw new Error('No seeded group found in seed map. Run: npm run e2e:seed:v1');
}

// ═══════════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Group List', () => {
  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN - Full list access
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('Admin', () => {
    test.use({ storageState: AUTH_V1_ADMIN });

    test(`Can view groups list [Admin]`, async ({ page }) => {
      const groupsPage = new GroupsPage(page);
      await groupsPage.goto();

      await expect(groupsPage.table).toBeVisible();
    });

    test(`Can search for seeded group [Admin]`, async ({ page }) => {
      const groupsPage = new GroupsPage(page);
      await groupsPage.goto();

      await groupsPage.searchFor(SEEDED_GROUP_NAME);
      await groupsPage.verifyGroupInTable(SEEDED_GROUP_NAME);
    });
  });
});
