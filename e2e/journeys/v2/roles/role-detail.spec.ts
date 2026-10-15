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
 *   - AUTH: Uses AUTH_V2_ORGADMIN from utils
 *   - DATA: Relies on SEEDED_ROLE_NAME from seed-map (created in e2e:seed)
 *   - UTILS: Use RolesPage for drawer interactions
 */

import { expect, test } from '@playwright/test';
import { AUTH_V2_ORGADMIN, AUTH_V2_WORKSPACEUSER } from '../../../utils';
import { RolesPage } from '../../../pages/v2/RolesPage';
import { getSeededRoleName } from '../../../utils/seed-map';

const SEEDED_ROLE_NAME = getSeededRoleName('v2');

// ═══════════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Role Detail', () => {
  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN - Full detail access
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('OrgAdmin', () => {
    test.use({ storageState: AUTH_V2_ORGADMIN });

    test(`Can view role details in drawer [OrgAdmin]`, async ({ page }) => {
      test.skip(!SEEDED_ROLE_NAME, 'No seed data — run npm run e2e:seed:v2');
      const rolesPage = new RolesPage(page);
      await rolesPage.goto();

      await rolesPage.searchFor(SEEDED_ROLE_NAME!);
      await rolesPage.openDrawer(SEEDED_ROLE_NAME!);

      // Verify drawer content
      await expect(page.getByRole('heading', { name: SEEDED_ROLE_NAME!, level: 2 })).toBeVisible();

      await rolesPage.closeDrawer(SEEDED_ROLE_NAME!);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // WORKSPACEUSER (WorkspaceViewer) - Read-only role detail (rbac_roles_read)
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('WorkspaceUser', () => {
    test.use({ storageState: AUTH_V2_WORKSPACEUSER });

    test('Can view role details in drawer [WorkspaceUser]', async ({ page }) => {
      test.skip(!SEEDED_ROLE_NAME, 'No seed data — run npm run e2e:seed:v2');
      const rolesPage = new RolesPage(page);
      await rolesPage.goto();

      await rolesPage.searchFor(SEEDED_ROLE_NAME!);
      await rolesPage.openDrawer(SEEDED_ROLE_NAME!);

      await expect(page.getByRole('heading', { name: SEEDED_ROLE_NAME!, level: 2 })).toBeVisible();
      await rolesPage.closeDrawer(SEEDED_ROLE_NAME!);
    });
  });
});
