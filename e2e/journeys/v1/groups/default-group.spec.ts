/**
 * V1 Groups - Default Group Copy/Restore Tests
 *
 * Tests for the special behavior when modifying default groups:
 * - When modifying a pristine "Default access" group, it shows a confirmation modal
 * - The group gets copied to "Custom default access"
 * - An alert appears on the detail page
 * - A "Restore to default" button allows resetting to original state
 *
 * Based on Storybook coverage:
 * - CopyDefaultGroupAddRolesJourney
 * - ModifyAlreadyCopiedGroupJourney
 * - RestoreDefaultGroupJourney
 *
 * Note: These tests modify the default groups which may affect other tests.
 * They should be run carefully and the default group should be restored after.
 *
 * Personas: Admin (only admin can modify default groups)
 */

import { expect, test } from '@playwright/test';
import { AUTH_V1_ADMIN } from '../../../utils';
import { GroupsPage } from '../../../pages/v1/GroupsPage';

// ═══════════════════════════════════════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════════════════════════════════════

const DEFAULT_ACCESS_GROUP = 'Default access';
const CUSTOM_DEFAULT_GROUP = 'Custom default access';

// ═══════════════════════════════════════════════════════════════════════════
// Tests - Default Group Copy Flow
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Admin - Default Group Copy Flow', () => {
  test.use({ storageState: AUTH_V1_ADMIN });

  test('Default access group exists and is accessible [Admin]', async ({ page }) => {
    const groupsPage = new GroupsPage(page);
    await groupsPage.goto();

    await groupsPage.searchFor(DEFAULT_ACCESS_GROUP);

    // Verify the group exists
    const groupLink = groupsPage.getGroupLink(DEFAULT_ACCESS_GROUP);
    const exists = await groupLink.isVisible().catch(() => false);

    if (!exists) {
      // Check if it's already been modified (Custom default access)
      await groupsPage.searchFor(CUSTOM_DEFAULT_GROUP);
      const customExists = await groupsPage
        .getGroupLink(CUSTOM_DEFAULT_GROUP)
        .isVisible()
        .catch(() => false);

      if (customExists) {
        console.log('[Default Group] ⚠️ Default access group has already been modified (Custom default access exists)');
        test.skip();
        return;
      }

      test.skip(true, 'Default access group not found');
      return;
    }

    // Navigate to detail page
    await groupsPage.navigateToDetail(DEFAULT_ACCESS_GROUP);
    await expect(groupsPage.getDetailHeading(DEFAULT_ACCESS_GROUP)).toBeVisible({ timeout: 15000 });

    console.log('[Default Group] ✓ Default access group exists and is accessible');
  });

  test('Roles tab is available on Default access group [Admin]', async ({ page }) => {
    const groupsPage = new GroupsPage(page);
    await groupsPage.goto();

    await groupsPage.searchFor(DEFAULT_ACCESS_GROUP);
    const groupLink = groupsPage.getGroupLink(DEFAULT_ACCESS_GROUP);
    if (!(await groupLink.isVisible().catch(() => false))) {
      test.skip(true, 'Default access group not found');
      return;
    }

    await groupsPage.navigateToDetail(DEFAULT_ACCESS_GROUP);
    await expect(groupsPage.getDetailHeading(DEFAULT_ACCESS_GROUP)).toBeVisible({ timeout: 15000 });

    // Click Roles tab
    await groupsPage.clickTab('Roles');

    // Should show Add role button
    await expect(groupsPage.addRoleButton).toBeVisible({ timeout: 10000 });

    console.log('[Default Group] ✓ Roles tab is accessible');
  });

  // Note: The actual copy flow tests are destructive and modify the default group.
  // They are marked as skipped by default to prevent accidental modifications.

  test.skip('Modifying Default access triggers confirmation modal [Admin]', async ({ page }) => {
    const groupsPage = new GroupsPage(page);
    await groupsPage.goto();

    await groupsPage.searchFor(DEFAULT_ACCESS_GROUP);
    await groupsPage.navigateToDetail(DEFAULT_ACCESS_GROUP);
    await expect(groupsPage.getDetailHeading(DEFAULT_ACCESS_GROUP)).toBeVisible({ timeout: 15000 });

    // Click Roles tab
    await groupsPage.clickTab('Roles');

    // Wait for Add role button
    await expect(groupsPage.addRoleButton).toBeVisible({ timeout: 10000 });
    await expect(groupsPage.addRoleButton).toBeEnabled({ timeout: 10000 });

    // Click Add role
    await groupsPage.openAddRolesModal();

    // Select a role
    await groupsPage.selectRolesInModal(1);

    // Submit
    await groupsPage.submitAddRolesModal();

    // Wait for the warning modal to appear
    const warningModal = page.locator('[data-ouia-component-id="WarningModal"]');
    await expect(warningModal).toBeVisible({ timeout: 10000 });

    // Verify confirmation checkbox is required
    const confirmCheckbox = warningModal.getByRole('checkbox', { name: /i understand/i });
    await expect(confirmCheckbox).toBeVisible();

    // Check the checkbox
    await confirmCheckbox.click();

    // Click Continue
    const continueButton = warningModal.getByRole('button', { name: /continue/i });
    await expect(continueButton).toBeEnabled();
    await continueButton.click();

    // Wait for modal to close
    await expect(warningModal).not.toBeVisible({ timeout: 10000 });

    // Verify group name changed to "Custom default access"
    await expect(page.getByRole('heading', { name: CUSTOM_DEFAULT_GROUP })).toBeVisible({ timeout: 10000 });

    // Verify alert appears
    await expect(page.getByText(/default access group has changed/i)).toBeVisible({ timeout: 10000 });

    console.log('[Default Group] ✓ Modification triggered copy flow');
  });

  test.skip('Restore to default button is visible after modification [Admin]', async ({ page }) => {
    const groupsPage = new GroupsPage(page);
    await groupsPage.goto();

    // Look for Custom default access (indicates it's been modified)
    await groupsPage.searchFor(CUSTOM_DEFAULT_GROUP);

    const customGroupLink = groupsPage.getGroupLink(CUSTOM_DEFAULT_GROUP);
    if (!(await customGroupLink.isVisible().catch(() => false))) {
      console.log('[Default Group] ⚠️ Custom default access not found - group may be pristine');
      test.skip(true, 'Custom default access group not found');
      return;
    }

    await groupsPage.navigateToDetail(CUSTOM_DEFAULT_GROUP);
    await expect(groupsPage.getDetailHeading(CUSTOM_DEFAULT_GROUP)).toBeVisible({ timeout: 15000 });

    // Verify "Restore to default" button is visible
    const restoreButton = page.getByRole('button', { name: /restore to default/i });
    await expect(restoreButton).toBeVisible({ timeout: 10000 });

    console.log('[Default Group] ✓ Restore to default button is visible');
  });

  test.skip('Can restore Custom default access back to Default access [Admin]', async ({ page }) => {
    const groupsPage = new GroupsPage(page);
    await groupsPage.goto();

    // Look for Custom default access
    await groupsPage.searchFor(CUSTOM_DEFAULT_GROUP);

    const customGroupLink = groupsPage.getGroupLink(CUSTOM_DEFAULT_GROUP);
    if (!(await customGroupLink.isVisible().catch(() => false))) {
      test.skip(true, 'Custom default access group not found');
      return;
    }

    await groupsPage.navigateToDetail(CUSTOM_DEFAULT_GROUP);
    await expect(groupsPage.getDetailHeading(CUSTOM_DEFAULT_GROUP)).toBeVisible({ timeout: 15000 });

    // Click "Restore to default"
    const restoreButton = page.getByRole('button', { name: /restore to default/i });
    await restoreButton.click();

    // Confirm in modal
    const confirmModal = page.getByRole('dialog').first();
    await expect(confirmModal).toBeVisible({ timeout: 5000 });

    const confirmButton = confirmModal.getByRole('button', { name: /continue/i });
    await confirmButton.click();

    // Wait for modal to close
    await expect(confirmModal).not.toBeVisible({ timeout: 10000 });

    // Verify group name changed back to "Default access"
    await expect(page.getByRole('heading', { name: DEFAULT_ACCESS_GROUP })).toBeVisible({ timeout: 10000 });

    // Verify "Restore to default" button is no longer visible
    await expect(page.getByRole('button', { name: /restore to default/i })).not.toBeVisible();

    console.log('[Default Group] ✓ Default access group restored');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Tests - Already Modified Default Group
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Admin - Already Modified Default Group', () => {
  test.use({ storageState: AUTH_V1_ADMIN });

  test.skip('Modifying Custom default access does NOT show confirmation modal [Admin]', async ({ page }) => {
    const groupsPage = new GroupsPage(page);
    await groupsPage.goto();

    // Look for Custom default access (already modified)
    await groupsPage.searchFor(CUSTOM_DEFAULT_GROUP);

    const customGroupLink = groupsPage.getGroupLink(CUSTOM_DEFAULT_GROUP);
    if (!(await customGroupLink.isVisible().catch(() => false))) {
      test.skip(true, 'Custom default access group not found - run copy flow test first');
      return;
    }

    await groupsPage.navigateToDetail(CUSTOM_DEFAULT_GROUP);
    await expect(groupsPage.getDetailHeading(CUSTOM_DEFAULT_GROUP)).toBeVisible({ timeout: 15000 });

    // Click Roles tab
    await groupsPage.clickTab('Roles');

    // Wait for Add role button
    await expect(groupsPage.addRoleButton).toBeEnabled({ timeout: 10000 });

    // Click Add role
    await groupsPage.openAddRolesModal();

    // Select a role
    await groupsPage.selectRolesInModal(1);

    // Submit
    await groupsPage.submitAddRolesModal();

    // Wait for success notification (NOT the warning modal)
    await groupsPage.verifySuccess();

    // Verify NO warning modal appeared
    const warningModal = page.locator('[data-ouia-component-id="WarningModal"]');
    const modalVisible = await warningModal.isVisible().catch(() => false);
    expect(modalVisible).toBe(false);

    console.log('[Default Group] ✓ No confirmation modal for already-modified group');
  });
});
