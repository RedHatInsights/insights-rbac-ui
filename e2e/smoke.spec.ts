/**
 * E2E Smoke Test - Basic Page Load Verification
 *
 * This test verifies that the core pages of the RBAC UI load successfully
 * with authenticated storage state.
 *
 * Usage:
 *   1. Generate auth storage state:
 *      npm run e2e:v1:auth:admin
 *
 *   2. Run this test:
 *      npx playwright test e2e/smoke.spec.ts
 */

import { AUTH_V1_ADMIN, expect, setupPage, test } from './utils';
import { E2E_TIMEOUTS } from './utils/timeouts';

test.use({ storageState: AUTH_V1_ADMIN });

test.describe('Smoke Test - V1 Pages Load', () => {
  test.beforeEach(async ({ page }) => {
    await setupPage(page);
  });

  test('My User Access page loads', async ({ page }) => {
    await page.goto('/iam/my-user-access');
    await expect(page.getByRole('heading', { name: /my user access/i })).toBeVisible({
      timeout: E2E_TIMEOUTS.DETAIL_CONTENT,
    });
  });

  test('Users page loads', async ({ page }) => {
    await page.goto('/iam/user-access/users');
    await expect(page.getByRole('grid')).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
  });

  test('Roles page loads', async ({ page }) => {
    await page.goto('/iam/user-access/roles');
    await expect(page.getByRole('grid')).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
  });

  test('Groups page loads', async ({ page }) => {
    await page.goto('/iam/user-access/groups');
    await expect(page.getByRole('grid')).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
  });
});

test.describe('Smoke Test - V2 Pages Load', () => {
  test.beforeEach(async ({ page }) => {
    await setupPage(page);
  });

  test('Users page loads', async ({ page }) => {
    await page.goto('/iam/access-management/users-and-user-groups/users');
    await expect(page.getByRole('grid')).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
  });

  test('User Groups page loads', async ({ page }) => {
    await page.goto('/iam/access-management/users-and-user-groups/user-groups');
    await expect(page.getByRole('grid')).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
  });

  test('Roles page loads', async ({ page }) => {
    await page.goto('/iam/access-management/roles');
    await expect(page.getByRole('grid')).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
  });

  test('Workspaces page loads', async ({ page }) => {
    await page.goto('/iam/access-management/workspaces');
    await expect(page.getByRole('grid')).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
  });
});
