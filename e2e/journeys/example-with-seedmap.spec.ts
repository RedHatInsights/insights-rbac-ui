/**
 * Example: Using Seed Map for Dynamic E2E Tests
 *
 * This test demonstrates the seed-map pattern for E2E testing with real data.
 *
 * Prerequisites (run before tests):
 * 1. Login:
 *    npm run e2e:auth:admin
 *
 * 2. Seed data:
 *    npm run e2e:seed
 *
 * After tests, cleanup:
 *    npm run e2e:cleanup
 */

import { test, expect } from '@playwright/test';
import { AUTH_ADMIN, getSeedMap, hasSeedData, getRoleUuid, getGroupUuid } from '../utils';

// Use admin storage state for authentication
test.use({ storageState: AUTH_ADMIN });

test.describe('Seed Map Pattern Example', () => {
  test.beforeAll(() => {
    // Verify seed map has data
    if (!hasSeedData()) {
      console.warn(
        '\n⚠️  Seed map is empty! These tests require seeded data.\n' +
        'Run: npm run e2e:seed\n'
      );
    }
  });

  /**
   * Example: Navigate to a seeded role using its UUID from the seed map
   */
  test('can view a seeded role by UUID', async ({ page }) => {
    // Get the UUID for the "test-analyst" role (prefixed as "e2e-test-analyst")
    const roleUuid = getRoleUuid('e2e-test-analyst');

    if (!roleUuid) {
      test.skip(true, 'Role "e2e-test-analyst" not found in seed map. Run: npm run e2e:seed');
      return;
    }

    // Navigate directly to the role detail page using the dynamic UUID
    await page.goto(`/iam/user-access/roles/detail/${roleUuid}`);
    await page.waitForLoadState('networkidle');

    // Verify the role loaded correctly
    // The display_name from seed data was "Test Analyst" (prefixed to "e2e-Test Analyst")
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Test Analyst');
  });

  /**
   * Example: List all seeded resources
   */
  test('seed map contains expected resources', async () => {
    const seedMap = getSeedMap();

    // Log what was seeded for debugging
    console.log('Seeded roles:', Object.keys(seedMap.roles));
    console.log('Seeded groups:', Object.keys(seedMap.groups));
    console.log('Seeded workspaces:', Object.keys(seedMap.workspaces));

    // Skip if no data
    if (!hasSeedData()) {
      test.skip(true, 'No seed data found. Run: npm run e2e:seed');
      return;
    }

    // Verify expected resources exist
    expect(seedMap.roles['e2e-test-analyst']).toBeDefined();
    expect(seedMap.roles['e2e-test-admin']).toBeDefined();
    expect(seedMap.groups['e2e-test-viewers']).toBeDefined();
    expect(seedMap.workspaces['e2e-test-workspace']).toBeDefined();
  });

  /**
   * Example: Navigate to a seeded group
   */
  test('can view a seeded group by UUID', async ({ page }) => {
    const groupUuid = getGroupUuid('e2e-test-viewers');

    if (!groupUuid) {
      test.skip(true, 'Group "e2e-test-viewers" not found in seed map. Run: npm run e2e:seed');
      return;
    }

    await page.goto(`/iam/user-access/groups/detail/${groupUuid}`);
    await page.waitForLoadState('networkidle');

    // Verify the group loaded
    await expect(page.getByRole('heading', { level: 1 })).toContainText('test-viewers');
  });
});
