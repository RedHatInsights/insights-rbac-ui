/**
 * User Group List Tests
 *
 * Tests for the user groups table/list view.
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
 *   ✗ It creates, edits, or deletes a user group → user-group-management.spec.ts
 *   ✗ It views user group detail/drawer content → user-group-detail.spec.ts
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * CAPABILITIES & PERSONAS
 * ═══════════════════════════════════════════════════════════════════════════════
 * @capability View User Groups List, Search User Groups, Filter User Groups
 * @personas
 *   - Admin: Full list access
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * DATA PREREQUISITES
 * ═══════════════════════════════════════════════════════════════════════════════
 * @dependencies
 *   - AUTH: Uses AUTH_V2_ORGADMIN from utils
 *   - DATA: Relies on SEEDED_GROUP_NAME from seed-map (created in e2e:seed)
 *   - UTILS: Use UserGroupsPage for table interactions
 */

import { expect, test } from '@playwright/test';
import { AUTH_V2_ORGADMIN, AUTH_V2_RBACADMIN, getSeededGroupName } from '../../../utils';
import { UserGroupsPage } from '../../../pages/v2/UserGroupsPage';
import { E2E_TIMEOUTS } from '../../../utils/timeouts';

const SEEDED_GROUP_NAME = getSeededGroupName('v2');

// ═══════════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════════

test.describe('User Group List', () => {
  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN - Full list access
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('OrgAdmin', () => {
    test.use({ storageState: AUTH_V2_ORGADMIN });

    test(`Can view user groups list [OrgAdmin]`, async ({ page }) => {
      const groupsPage = new UserGroupsPage(page);
      await groupsPage.goto();

      await expect(groupsPage.table).toBeVisible();
    });

    test(`Can search for seeded group [OrgAdmin]`, async ({ page }) => {
      test.skip(!SEEDED_GROUP_NAME, 'No seed data — run npm run e2e:seed:v2');
      const groupsPage = new UserGroupsPage(page);
      await groupsPage.goto();

      await groupsPage.searchFor(SEEDED_GROUP_NAME!);
      await groupsPage.verifyGroupInTable(SEEDED_GROUP_NAME!);
    });
  });

  test.describe('RbacAdmin', () => {
    test.use({ storageState: AUTH_V2_RBACADMIN });

    test('Can view user groups list [RbacAdmin]', async ({ page }) => {
      const userGroupsPage = new UserGroupsPage(page);
      await userGroupsPage.goto();
      await expect(userGroupsPage.table).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
    });
  });
});
