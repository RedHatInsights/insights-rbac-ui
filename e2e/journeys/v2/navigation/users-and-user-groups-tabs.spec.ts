/**
 * Users and User Groups — Tab Visibility Bug Exposure
 *
 * These tests are written to the CORRECT specification from Personas.mdx.
 * They use `test.fail()` because of a known app bug in UsersAndUserGroups.tsx:
 *   - When only one sub-route is accessible, NO tab bar renders at all
 *     (the component renders content directly instead of showing a single tab)
 *   - Default redirect always goes to /users-new regardless of permissions
 *
 * Correct behavior:
 *   - Tabs should be permission-gated: only show tabs the user can access
 *   - Default redirect should land on the first visible tab
 *
 * When the app bug is fixed, these tests will start passing and `test.fail()`
 * will cause them to go red — that's the signal to remove the annotation.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * DECISION TREE - Add your test here if:
 * ═══════════════════════════════════════════════════════════════════════════════
 *   ✓ It tests tab visibility per persona on the Users and User Groups page
 *   ✓ It tests default redirect behavior on the parent route
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * CAPABILITIES & PERSONAS
 * ═══════════════════════════════════════════════════════════════════════════════
 * @capability Tab Visibility, Default Redirect
 * @personas
 *   - RbacAdmin (WorkspaceAdmin): No rbac_principal_read → Users tab hidden, default to User Groups
 *   - UserViewer: No rbac_groups_read → User Groups tab hidden
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * DATA PREREQUISITES
 * ═══════════════════════════════════════════════════════════════════════════════
 * @dependencies AUTH: AUTH_V2_RBACADMIN, AUTH_V2_USERVIEWER
 */

import { expect, test } from '@playwright/test';
import { AUTH_V2_RBACADMIN, AUTH_V2_USERVIEWER, iamUrl, setupPage, v2 } from '../../../utils';
import { NavigationSidebar } from '../../../pages/v2/NavigationSidebar';

test.describe('Tab Visibility Bug Exposure', () => {
  // ═══════════════════════════════════════════════════════════════════════════
  // RBACADMIN (WorkspaceAdmin) — no rbac_principal_read
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('RbacAdmin', () => {
    test.use({ storageState: AUTH_V2_RBACADMIN });

    test('Users tab is hidden for WorkspaceAdmin [RbacAdmin]', async ({ page }) => {
      test.fail(true, 'App bug: tab bar not rendered when only one sub-route is accessible');
      const navSidebar = new NavigationSidebar(page);
      await navSidebar.gotoUsersAndGroups();

      await expect(page.getByRole('tab', { name: /^users$/i })).not.toBeVisible();
      await expect(page.getByRole('tab', { name: /user groups/i })).toBeVisible();
    });

    test('Default redirect lands on User Groups tab [RbacAdmin]', async ({ page }) => {
      test.fail(true, 'App bug: default redirect always goes to /users-new');
      await setupPage(page);
      await page.goto(iamUrl(v2.usersAndUserGroups.link()));
      await page.waitForURL(/user-groups/);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // USERVIEWER — no rbac_groups_read
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('UserViewer', () => {
    test.use({ storageState: AUTH_V2_USERVIEWER });

    test('User Groups tab is hidden for UserViewer [UserViewer]', async ({ page }) => {
      test.fail(true, 'App bug: tab bar not rendered when only one sub-route is accessible');
      const navSidebar = new NavigationSidebar(page);
      await navSidebar.gotoUsersAndGroups();

      await expect(page.getByRole('tab', { name: /^users$/i })).toBeVisible();
      await expect(page.getByRole('tab', { name: /user groups/i })).not.toBeVisible();
    });
  });
});
