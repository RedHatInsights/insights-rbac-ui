/**
 * E2E Smoke Test - Basic Page Load Verification
 *
 * This test verifies that the core pages of the RBAC UI load successfully
 * with authenticated storage state.
 *
 * Usage:
 *   1. Generate auth storage state:
 *      RBAC_USERNAME=user RBAC_PASSWORD=pass npm run cli -- login --headless --save-state e2e/auth/v1-admin.json
 *
 *   2. Run this test:
 *      npx playwright test e2e/smoke.spec.ts
 */

import { test, expect } from '@playwright/test';
import { AUTH_V1_ADMIN } from './utils';

test.use({ storageState: AUTH_V1_ADMIN });

test.describe('Smoke Test - V1 Pages Load', () => {
  test('My User Access page loads', async ({ page }) => {
    await page.goto('/iam/my-user-access');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
  });

  test('Users page loads', async ({ page }) => {
    await page.goto('/iam/user-access/users');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
  });

  test('Roles page loads', async ({ page }) => {
    await page.goto('/iam/user-access/roles');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
  });

  test('Groups page loads', async ({ page }) => {
    await page.goto('/iam/user-access/groups');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Smoke Test - V2 Pages Load', () => {
  test('Users page loads', async ({ page }) => {
    await page.goto('/iam/access-management/users-and-user-groups/users');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
  });

  test('User Groups page loads', async ({ page }) => {
    await page.goto('/iam/access-management/users-and-user-groups/user-groups');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
  });

  test('Roles page loads', async ({ page }) => {
    await page.goto('/iam/access-management/roles');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
  });

  test('Workspaces page loads', async ({ page }) => {
    await page.goto('/iam/access-management/workspaces');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
  });
});
