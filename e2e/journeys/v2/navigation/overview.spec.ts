/**
 * Overview Page Tests
 *
 * Tests for the V2 Overview page content and default navigation.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * DECISION TREE - Add your test here if:
 * ═══════════════════════════════════════════════════════════════════════════════
 * ✓ Testing overview page heading and content visibility
 * ✓ Testing Get Started card or other overview sections
 * ✓ Testing that overview is the default page when navigating to /iam
 *
 * DO NOT add here if:
 * ✗ Testing navigation structure → navigation-structure.spec.ts
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * DATA PREREQUISITES
 * ═══════════════════════════════════════════════════════════════════════════════
 * @dependencies AUTH: AUTH_V2_ORGADMIN
 * @dependencies UTILS: setupPage
 */

import { type Page, expect, test } from '@playwright/test';
import { AUTH_V2_ORGADMIN, AUTH_V2_USERVIEWER, iamUrl, setupPage, v2 } from '../../../utils';
import { E2E_TIMEOUTS } from '../../../utils/timeouts';

const overviewUrl = iamUrl(v2.overview.link());
const iamBaseUrl = iamUrl('');

test.describe('Overview', () => {
  test.describe('OrgAdmin', () => {
    test.use({ storageState: AUTH_V2_ORGADMIN });

    test('Can view overview page content [OrgAdmin]', async ({ page }) => {
      await setupPage(page);
      await expect(async () => {
        await page.goto(overviewUrl, { timeout: E2E_TIMEOUTS.SLOW_DATA });
        await expect(page.getByRole('heading', { name: /user access/i, level: 1 }).first()).toBeVisible({ timeout: E2E_TIMEOUTS.DETAIL_CONTENT });
      }).toPass({ timeout: E2E_TIMEOUTS.SETUP_PAGE_LOAD, intervals: [1_000, 2_000, 5_000] });

      await expect(page.getByLabel('Get started card')).toBeVisible({ timeout: E2E_TIMEOUTS.DETAIL_CONTENT });
      await expect(page.getByRole('button', { name: /view groups/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /view roles/i })).toBeVisible();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // USERVIEWER - No rbac_roles_read, denied Overview (requires v2Guard([roles.canView]))
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('UserViewer', () => {
    test.use({ storageState: AUTH_V2_USERVIEWER });

    test('Overview page shows unauthorized access [UserViewer]', async ({ page }) => {
      await setupPage(page);
      await expect(async () => {
        await page.goto(overviewUrl, { timeout: E2E_TIMEOUTS.SLOW_DATA });
        await expect(page.getByText(/You do not have access to/i)).toBeVisible({ timeout: E2E_TIMEOUTS.DETAIL_CONTENT });
      }).toPass({ timeout: E2E_TIMEOUTS.SETUP_PAGE_LOAD, intervals: [1_000, 2_000, 5_000] });
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Default Navigation Tests - Overview should be the landing page for /iam
// ═══════════════════════════════════════════════════════════════════════════
// These tests verify the correct behavior per the RBAC Overview page requirements.
// They use test.fail() because of a known routing bug in src/v2/Routing.tsx:
//   - The catch-all route currently redirects to /my-access instead of /overview
//
// Correct behavior:
//   - Navigating to /iam (base URL) should redirect to /iam/overview
//   - Overview page should be the default landing page for RBAC
//
// When the routing is fixed, these tests will start passing and test.fail()
// will cause them to go red — that's the signal to remove the annotation.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Helper to navigate to /iam base URL and verify it redirects to overview
 */
async function navigateToIamAndExpectOverview(page: Page) {
  await setupPage(page);
  await page.goto(iamBaseUrl, { timeout: E2E_TIMEOUTS.SLOW_DATA });
  await page.waitForURL(/\/overview/, { timeout: E2E_TIMEOUTS.SETUP_PAGE_LOAD });
  await expect(page.getByRole('heading', { name: /user access/i, level: 1 }).first()).toBeVisible({ timeout: E2E_TIMEOUTS.DETAIL_CONTENT });
}

test.describe('Default Navigation', () => {
  test.describe('OrgAdmin', () => {
    test.use({ storageState: AUTH_V2_ORGADMIN });

    test('Navigating to /iam redirects to overview page [OrgAdmin]', async ({ page }) => {
      test.fail(true, 'Routing bug: catch-all route redirects to /my-access instead of /overview');
      await navigateToIamAndExpectOverview(page);
    });

    test('Overview page is accessible as default landing page [OrgAdmin]', async ({ page }) => {
      test.fail(true, 'Routing bug: catch-all route redirects to /my-access instead of /overview');
      await navigateToIamAndExpectOverview(page);
    });
  });
});
