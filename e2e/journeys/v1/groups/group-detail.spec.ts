/**
 * Group Detail Tests
 *
 * Tests for viewing group detail pages.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * DECISION TREE - Add your test here if:
 * ═══════════════════════════════════════════════════════════════════════════════
 *   ✓ It views group detail page content (heading, description, tabs)
 *   ✓ It navigates from group detail to related entities (roles, members)
 *   ✓ It tests tab switching on the detail page
 *
 * DO NOT add here if:
 *   ✗ It creates, edits, or deletes a group → group-management.spec.ts
 *   ✗ It tests the groups table/list view → group-list.spec.ts
 *   ✗ It manages group members or roles → group-membership.spec.ts
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * CAPABILITIES & PERSONAS
 * ═══════════════════════════════════════════════════════════════════════════════
 * @capability View Group Detail, Navigate to Related Entities
 * @personas
 *   - Admin: Full detail access
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * DATA PREREQUISITES
 * ═══════════════════════════════════════════════════════════════════════════════
 * @dependencies
 *   - AUTH: Uses AUTH_V1_ADMIN from utils
 *   - DATA: Relies on SEEDED_GROUP_NAME, SEEDED_ROLE_NAME from seed-map (created in e2e:seed)
 *   - UTILS: Use GroupsPage for navigation and assertions
 */

import { expect, test } from '@playwright/test';
import { AUTH_V1_ADMIN } from '../../../utils';
import { GroupsPage } from '../../../pages/v1/GroupsPage';
import { getSeededGroupData, getSeededGroupName, getSeededRoleName } from '../../../utils/seed-map';
import { E2E_TIMEOUTS } from '../../../utils/timeouts';

const SEEDED_GROUP_NAME = getSeededGroupName('v1');
const SEEDED_GROUP_DATA = getSeededGroupData();
const SEEDED_ROLE_NAME = getSeededRoleName('v1');

if (!SEEDED_GROUP_NAME) {
  throw new Error('No seeded group found in seed map. Run: npm run e2e:seed:v1');
}

// ═══════════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Group Detail', () => {
  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN - Full detail access
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('Admin', () => {
    test.use({ storageState: AUTH_V1_ADMIN });

    test(`Can view group detail page [Admin]`, async ({ page }) => {
      const groupsPage = new GroupsPage(page);
      await groupsPage.goto();

      await groupsPage.searchFor(SEEDED_GROUP_NAME);
      await groupsPage.navigateToDetail(SEEDED_GROUP_NAME);

      // Verify detail page
      await expect(groupsPage.getDetailHeading(SEEDED_GROUP_NAME)).toBeVisible({ timeout: E2E_TIMEOUTS.DETAIL_CONTENT });

      // Description should appear as subtitle once group data loads
      if (SEEDED_GROUP_DATA?.description) {
        await expect(page.getByText(SEEDED_GROUP_DATA.description)).toBeVisible({ timeout: E2E_TIMEOUTS.DETAIL_CONTENT });
      }

      // Verify tabs
      await expect(groupsPage.membersTab).toBeVisible();
      await expect(groupsPage.rolesTab).toBeVisible();
    });

    test(`Can navigate to attached role from group detail [Admin]`, async ({ page }) => {
      test.skip(!SEEDED_ROLE_NAME, 'No seeded role available');

      const groupsPage = new GroupsPage(page);
      await groupsPage.goto();

      await groupsPage.searchFor(SEEDED_GROUP_NAME);
      await groupsPage.navigateToDetail(SEEDED_GROUP_NAME);

      // Navigate to Roles tab
      await groupsPage.clickTab('Roles');

      // Click on the role link
      const roleLink = page.getByRole('grid').getByRole('link', { name: SEEDED_ROLE_NAME! });
      await expect(roleLink).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
      await roleLink.click();

      // Verify navigated to role detail
      await expect(page).toHaveURL(/\/roles\//, { timeout: E2E_TIMEOUTS.URL_CHANGE });
      await expect(page.getByRole('heading', { name: SEEDED_ROLE_NAME! })).toBeVisible({ timeout: E2E_TIMEOUTS.DETAIL_CONTENT });
    });
  });
});
