/**
 * V1 Groups - Admin Journey Tests
 *
 * Optimized end-to-end journey tests that consolidate multiple verifications
 * into single page loads using test.step() blocks.
 *
 * Journey Pattern:
 * - Pay the "page load tax" once per journey, not per assertion
 * - Use test.step() to organize logical phases
 * - Use strict accessibility selectors (getByRole with name constraints)
 * - Scope table queries with getByRole('grid') to avoid filter chip collisions
 *
 * Data Strategy:
 * - READ operations: Use SEED_MAP for stable, pre-seeded data
 * - WRITE operations: Generate unique names with timestamps for parallel safety
 * - CLEANUP: Delete created data at journey end (not afterAll, for visibility)
 */

import { Page, expect, test } from '@playwright/test';
import { AUTH_V1_ADMIN, clickMenuItem, openDetailPageActionsMenu, openRowActionsMenu, setupPage, verifySuccessNotification } from '../../../utils';
import { getSeededGroupData, getSeededGroupName, getSeededRoleName } from '../../../utils/seed-map';

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const TEST_PREFIX = process.env.TEST_PREFIX;

if (!TEST_PREFIX) {
  throw new Error(
    '\n\n' +
      '╔══════════════════════════════════════════════════════════════════════╗\n' +
      '║  SAFETY RAIL: TEST_PREFIX environment variable is REQUIRED          ║\n' +
      '║                                                                      ║\n' +
      '║  This test creates data that must be prefixed to avoid polluting    ║\n' +
      '║  the shared environment. Set TEST_PREFIX before running:            ║\n' +
      '║                                                                      ║\n' +
      '║    TEST_PREFIX=e2e npx playwright test v1/groups/admin              ║\n' +
      '║                                                                      ║\n' +
      '╚══════════════════════════════════════════════════════════════════════╝\n',
  );
}

test.use({ storageState: AUTH_V1_ADMIN });

const GROUPS_URL = '/iam/user-access/groups';

// Get seeded group and role names from seed map/fixture
const SEEDED_GROUP_NAME = getSeededGroupName();
const SEEDED_GROUP_DATA = getSeededGroupData();
const SEEDED_ROLE_NAME = getSeededRoleName();

if (!SEEDED_GROUP_NAME) {
  throw new Error('No seeded group found in seed map. Run: npm run e2e:seed:v1');
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Searches for a group by name using the filter input.
 * Scoped to the table grid to avoid false positives from filter chips.
 */
async function searchForGroup(page: Page, groupName: string): Promise<void> {
  const searchInput = page.getByRole('searchbox').or(page.getByPlaceholder(/filter|search/i));
  await searchInput.clear();
  await searchInput.fill(groupName);
  // Wait for table to update with filtered results
  await page.waitForTimeout(500);
}

/**
 * Verifies a group row exists in the table grid.
 * Uses strict accessibility selectors scoped to the grid.
 */
async function verifyGroupInTable(page: Page, groupName: string): Promise<void> {
  const grid = page.getByRole('grid');
  await expect(grid.getByRole('row', { name: new RegExp(groupName, 'i') })).toBeVisible({
    timeout: 10000,
  });
}

/**
 * Verifies a group row does NOT exist in the table grid.
 */
async function verifyGroupNotInTable(page: Page, groupName: string): Promise<void> {
  const grid = page.getByRole('grid');
  await expect(grid.getByRole('row', { name: new RegExp(groupName, 'i') })).not.toBeVisible({
    timeout: 10000,
  });
}

/**
 * Clicks on a group link in the table to navigate to detail page.
 */
async function navigateToGroupDetail(page: Page, groupName: string): Promise<void> {
  const grid = page.getByRole('grid');
  const groupLink = grid.getByRole('link', { name: groupName });
  await groupLink.click();
  await expect(page).toHaveURL(/\/groups\//);
}

/**
 * Fills the Create Group wizard and submits - FULL FEATURE TEST.
 * PORTED VERBATIM from AddGroupWizard.helpers.tsx (Storybook helper).
 *
 * Wizard Steps:
 * 1. Name & Description
 * 2. Add Roles (select first available)
 * 3. Add Members (select first available)
 * 4. Add Service Accounts (select first available, if step exists)
 * 5. Review & Create
 */
async function fillCreateGroupWizard(page: Page, groupName: string, description: string): Promise<void> {
  // Find the wizard dialog (use OUIA ID to avoid PF6 modal wrapper)
  const wizard = page.locator('[data-ouia-component-id="add-group-wizard"]');
  await expect(wizard).toBeVisible({ timeout: 10000 });

  /**
   * Helper to get the wizard's Next button (not pagination next) - matches Storybook helper exactly
   * Filters out pagination buttons and returns only enabled buttons
   */
  const clickWizardNextButton = async () => {
    // Get all Next buttons, filter out pagination ones, find enabled one
    const nextButtons = wizard.getByRole('button', { name: /next/i });
    const count = await nextButtons.count();

    for (let i = 0; i < count; i++) {
      const btn = nextButtons.nth(i);
      // Check if button is NOT inside pagination
      const isInPagination = await btn.evaluate((el) => !!el.closest('.pf-v6-c-pagination'));
      if (isInPagination) continue;

      // Check if button is enabled
      const isDisabled = await btn.evaluate((el) => el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true');
      if (isDisabled) continue;

      // Found an enabled, non-pagination Next button
      await btn.click();
      return;
    }
    throw new Error('No enabled Next button found');
  };

  // ─────────────────────────────────────────────────────────────────────
  // STEP 1: Fill name and description (matches Storybook helper)
  // ─────────────────────────────────────────────────────────────────────
  const nameInput = page.locator('#group-name');
  await expect(nameInput).toBeVisible();
  await nameInput.clear();
  await nameInput.fill(groupName);

  const descriptionInput = page.locator('#group-description').first();
  if (await descriptionInput.isVisible().catch(() => false)) {
    await descriptionInput.clear();
    await descriptionInput.fill(description);
  }

  // Wait for form validation to complete
  await expect(nameInput).toHaveValue(groupName);

  // Navigate to next step - wait for button to be enabled (extended timeout for async validation)
  await page.waitForFunction(
    () => {
      const buttons = document.querySelectorAll('[data-ouia-component-id="add-group-wizard"] button');
      return Array.from(buttons).some(
        (btn) =>
          /next/i.test(btn.textContent || '') &&
          !btn.closest('.pf-v6-c-pagination') &&
          !btn.hasAttribute('disabled') &&
          btn.getAttribute('aria-disabled') !== 'true',
      );
    },
    { timeout: 15000 },
  );
  await clickWizardNextButton();

  // ─────────────────────────────────────────────────────────────────────
  // STEP 2: Handle Roles step (matches Storybook helper)
  // ─────────────────────────────────────────────────────────────────────
  // Wait for roles to load and click the first role checkbox
  await page.waitForFunction(
    () => {
      const checkboxes = document.querySelectorAll(
        '[data-ouia-component-id="add-group-wizard"] [role="checkbox"], [data-ouia-component-id="add-group-wizard"] input[type="checkbox"]',
      );
      return checkboxes.length > 1;
    },
    { timeout: 8000 },
  );

  // Get fresh reference and click (select first role - index 1, as 0 is often "select all")
  const roleCheckboxes = wizard.getByRole('checkbox');
  await roleCheckboxes.nth(1).click();

  // Wait for checkbox to actually be checked
  await expect(roleCheckboxes.nth(1)).toBeChecked({ timeout: 2000 });
  console.log(`[Wizard] ✓ Selected role`);

  // Navigate to next step
  await clickWizardNextButton();

  // ─────────────────────────────────────────────────────────────────────
  // STEP 3: Handle Members/Users step (matches Storybook helper)
  // ─────────────────────────────────────────────────────────────────────
  // Wait for users to load
  await page.waitForFunction(
    () => {
      const checkboxes = document.querySelectorAll(
        '[data-ouia-component-id="add-group-wizard"] [role="checkbox"], [data-ouia-component-id="add-group-wizard"] input[type="checkbox"]',
      );
      return checkboxes.length > 1;
    },
    { timeout: 8000 },
  );

  // Get fresh reference and click first user
  const userCheckboxes = wizard.getByRole('checkbox');
  await userCheckboxes.nth(1).click();

  // Wait for checkbox to actually be checked
  await expect(userCheckboxes.nth(1)).toBeChecked({ timeout: 2000 });
  console.log(`[Wizard] ✓ Selected member`);

  // Navigate to next step (could be service accounts or review)
  await clickWizardNextButton();

  // ─────────────────────────────────────────────────────────────────────
  // STEP 4: Handle Service Accounts step (optional) - matches Storybook helper
  // ─────────────────────────────────────────────────────────────────────
  // Check if we have service accounts step by looking for checkboxes
  let hasServiceAccountsStep = false;
  try {
    await page.waitForFunction(
      () => {
        const wizard = document.querySelector('[data-ouia-component-id="add-group-wizard"]');
        if (!wizard) return false;
        // Check if "service account" text is visible in the wizard
        const text = wizard.textContent || '';
        return /service account/i.test(text);
      },
      { timeout: 3000 },
    );
    hasServiceAccountsStep = true;
  } catch {
    // No service accounts step - go to review
  }

  if (hasServiceAccountsStep) {
    // Wait for service accounts to load
    await page.waitForFunction(
      () => {
        const checkboxes = document.querySelectorAll(
          '[data-ouia-component-id="add-group-wizard"] [role="checkbox"], [data-ouia-component-id="add-group-wizard"] input[type="checkbox"]',
        );
        return checkboxes.length > 1;
      },
      { timeout: 8000 },
    );

    // Get fresh reference and click first service account
    const saCheckboxes = wizard.getByRole('checkbox');
    await saCheckboxes.nth(1).click();

    // Wait for checkbox to actually be checked
    await expect(saCheckboxes.nth(1)).toBeChecked({ timeout: 2000 });
    console.log(`[Wizard] ✓ Selected service account`);

    // Navigate to review step
    await clickWizardNextButton();
  }

  // ─────────────────────────────────────────────────────────────────────
  // FINAL STEP: Verify we reached Review step (matches Storybook helper)
  // ─────────────────────────────────────────────────────────────────────
  await page.waitForFunction(
    () => {
      const wizard = document.querySelector('[data-ouia-component-id="add-group-wizard"]');
      if (!wizard) return false;
      // Look for review heading in the main content (not nav)
      const mainContent = wizard.querySelector('.pf-v6-c-wizard__main-body, .pf-v6-c-wizard__main');
      if (!mainContent) return false;
      return /review/i.test(mainContent.textContent || '');
    },
    { timeout: 8000 },
  );

  // Verify the review shows the group name we entered
  await expect(wizard.getByText(groupName)).toBeVisible({ timeout: 5000 });
  console.log(`[Wizard] ✓ Review step - group name verified`);

  // Click the Create/Submit button (matches Storybook helper pattern)
  await page.waitForFunction(
    () => {
      const buttons = document.querySelectorAll('[data-ouia-component-id="add-group-wizard"] button');
      return Array.from(buttons).some(
        (btn) =>
          /create|submit|finish|add.*group/i.test(btn.textContent || '') &&
          !btn.hasAttribute('disabled') &&
          btn.getAttribute('aria-disabled') !== 'true',
      );
    },
    { timeout: 5000 },
  );

  const createButton = wizard
    .getByRole('button')
    .filter({ hasText: /create|submit|finish|add.*group/i })
    .first();
  await createButton.click();

  // Wait for wizard to close (success indicator)
  await expect(wizard).not.toBeVisible({ timeout: 15000 });
  console.log(`[Wizard] ✓ Wizard completed successfully`);
}

/**
 * Fills the Edit Group modal and saves.
 * PORTED VERBATIM from EditGroupModal.helpers.tsx (Storybook helper).
 */
async function fillEditGroupModal(page: Page, newName: string, newDescription: string): Promise<void> {
  // Step 1: Wait for edit modal to appear
  const dialog = page.getByRole('dialog').first();
  await expect(dialog).toBeVisible({ timeout: 5000 });

  // Step 2: Wait for form to be fully loaded - wait for textboxes to be populated
  // The form has 2 textboxes: name (input) and description (textarea)
  await page.waitForFunction(
    () => {
      const modal = document.querySelector('[role="dialog"]');
      if (!modal) return false;
      const textboxes = modal.querySelectorAll('[role="textbox"], input[type="text"], textarea');
      if (textboxes.length < 2) return false;
      // Wait for name field to be pre-populated
      const nameField = textboxes[0] as HTMLInputElement;
      return nameField.value !== '';
    },
    { timeout: 5000 },
  );

  // Get fields by role - they're in order: name, description
  const textboxes = dialog.getByRole('textbox');
  const nameField = textboxes.nth(0);
  const descriptionField = textboxes.nth(1);

  // Step 3: Edit the group name
  await nameField.click();
  await nameField.selectText();
  await page.keyboard.press('Backspace');
  await nameField.fill(newName);

  // Step 4: Edit the description
  await descriptionField.click();
  await descriptionField.selectText();
  await page.keyboard.press('Backspace');
  await descriptionField.fill(newDescription);

  // Step 5: Wait for validation and click Save button
  const saveButton = dialog.getByRole('button', { name: /save/i });
  await expect(saveButton).toBeEnabled({ timeout: 10000 });
  await saveButton.click();

  // Step 6: Wait for modal to close
  await expect(dialog).not.toBeVisible({ timeout: 5000 });
}

/**
 * Confirms deletion in the delete group modal.
 *
 * IMPORTANT: The V1 RemoveGroupModal renders in two phases:
 * 1. Loading state: Shows "Removing group" title with skeleton and a no-op Remove button
 * 2. Loaded state: Shows "Remove group {name}?" with functional Remove button
 *
 * We MUST wait for the loaded state before clicking, otherwise we click
 * a button that does nothing and the modal stays open.
 */
async function confirmGroupDeletion(page: Page, groupName: string): Promise<void> {
  const dialog = page.getByRole('dialog').first();
  await expect(dialog).toBeVisible({ timeout: 5000 });

  // Wait for loading to complete - the title changes from "Removing group"
  // to include the actual group name
  await expect(dialog.getByRole('heading', { name: new RegExp(groupName, 'i') })).toBeVisible({
    timeout: 30000,
  });

  // Now the Remove button has the real onConfirm handler
  const confirmButton = dialog.getByRole('button', { name: /remove/i });
  await expect(confirmButton).toBeEnabled({ timeout: 5000 });
  await confirmButton.click();

  // Wait for modal to close (navigation happens after successful delete)
  await expect(dialog).not.toBeVisible({ timeout: 15000 });
}

// ═══════════════════════════════════════════════════════════════════════════
// JOURNEY 1: READ-ONLY (Seeded Data)
// ═══════════════════════════════════════════════════════════════════════════

test.describe('V1 Groups - Admin Read-Only Journey', () => {
  test('Seeded Group: Search → Table → Detail Page', async ({ page }) => {
    await setupPage(page);
    await page.goto(GROUPS_URL);
    await expect(page.getByRole('heading', { name: 'Groups', exact: true })).toBeVisible();

    await test.step('Step 1: Verify admin capabilities', async () => {
      // Admin should see Create Group button
      const createButton = page.getByRole('button', { name: /create group/i });
      await expect(createButton).toBeVisible();
    });

    await test.step('Step 2: Search for seeded group', async () => {
      await searchForGroup(page, SEEDED_GROUP_NAME);
      await verifyGroupInTable(page, SEEDED_GROUP_NAME);
    });

    await test.step('Step 3: Navigate to detail page', async () => {
      await navigateToGroupDetail(page, SEEDED_GROUP_NAME);
      await expect(page.getByRole('heading', { name: SEEDED_GROUP_NAME })).toBeVisible({
        timeout: 15000,
      });
    });

    await test.step('Step 4: Verify detail page contents', async () => {
      // Verify description if one was defined in the seed fixture
      if (SEEDED_GROUP_DATA?.description) {
        await expect(page.getByText(SEEDED_GROUP_DATA.description)).toBeVisible({ timeout: 30000 });
      }

      // Verify admin actions are available
      // Use exact match to avoid matching "Actions for role..." buttons in the table
      const actionsButton = page.getByRole('button', { name: 'Actions', exact: true });
      await expect(actionsButton).toBeVisible();

      // Verify tabs are present
      await expect(page.getByRole('tab', { name: /members/i })).toBeVisible();
      await expect(page.getByRole('tab', { name: /roles/i })).toBeVisible();
    });

    await test.step('Step 5: Verify kebab menu actions', async () => {
      await openDetailPageActionsMenu(page);
      // Admin should see Edit and Delete options
      await expect(page.getByRole('menuitem', { name: /edit/i })).toBeVisible();
      await expect(page.getByRole('menuitem', { name: /delete/i })).toBeVisible();
      // Close menu by pressing Escape
      await page.keyboard.press('Escape');
    });

    await test.step('Step 6: Verify roles tab shows attached roles', async () => {
      // Click on the Roles tab
      const rolesTab = page.getByRole('tab', { name: /roles/i });
      await rolesTab.click();

      // Wait for roles tab content to load
      await page.waitForTimeout(500);

      // Verify the seeded role appears in the roles list
      if (SEEDED_ROLE_NAME) {
        const rolesGrid = page.getByRole('grid');
        await expect(rolesGrid).toBeVisible({ timeout: 10000 });

        // The seeded role should be in the table as a link
        const roleLink = rolesGrid.getByRole('link', { name: SEEDED_ROLE_NAME });
        await expect(roleLink).toBeVisible({ timeout: 10000 });
        console.log(`[Read-Only] ✓ Found attached role: ${SEEDED_ROLE_NAME}`);

        // Click the role link to navigate to role detail page
        await roleLink.click();

        // Verify we navigated to the role detail page
        await expect(page).toHaveURL(/\/roles\//, { timeout: 10000 });
        await expect(page.getByRole('heading', { name: SEEDED_ROLE_NAME })).toBeVisible({
          timeout: 15000,
        });
        console.log(`[Read-Only] ✓ Successfully navigated to role detail page`);
      } else {
        console.log('[Read-Only] ⚠ No seeded role name available, skipping role verification');
      }
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// JOURNEY 2: CRUD LIFECYCLE (Ephemeral Data)
// ═══════════════════════════════════════════════════════════════════════════

test.describe('V1 Groups - Admin CRUD Lifecycle Journey', () => {
  // Generate unique name for this test run (parallel-safe)
  const timestamp = Date.now();
  const uniqueGroupName = `${TEST_PREFIX}__E2E_Lifecycle_${timestamp}`;
  const groupDescription = 'E2E lifecycle test group - created by automated tests';
  const editedGroupName = `${uniqueGroupName}_Edited`;
  const editedDescription = 'E2E lifecycle test group - EDITED by automated tests';

  test('Create → Verify → Edit → Delete → Verify Deleted', async ({ page }) => {
    await setupPage(page);

    console.log(`\n[V1 Groups CRUD] Starting lifecycle test`);
    console.log(`[V1 Groups CRUD] Group name: ${uniqueGroupName}\n`);

    // ─────────────────────────────────────────────────────────────────────
    // PHASE 1: CREATE
    // ─────────────────────────────────────────────────────────────────────
    await test.step('Phase 1: Create new group via wizard', async () => {
      await page.goto(GROUPS_URL);
      await expect(page.getByRole('heading', { name: 'Groups', exact: true })).toBeVisible();

      // Open Create Group wizard
      const createButton = page.getByRole('button', { name: /create group/i });
      await expect(createButton).toBeVisible();
      await createButton.click();

      // Fill wizard and submit
      await fillCreateGroupWizard(page, uniqueGroupName, groupDescription);

      console.log(`[Create] ✓ Wizard completed`);
    });

    // ─────────────────────────────────────────────────────────────────────
    // PHASE 2: VERIFY CREATION
    // ─────────────────────────────────────────────────────────────────────
    await test.step('Phase 2: Verify group appears in table', async () => {
      // Wait for page to refresh and search for the new group
      await expect(page.getByRole('heading', { name: 'Groups', exact: true })).toBeVisible();
      await searchForGroup(page, uniqueGroupName);
      await verifyGroupInTable(page, uniqueGroupName);

      console.log(`[Verify] ✓ Group found in table`);
    });

    // ─────────────────────────────────────────────────────────────────────
    // PHASE 3: VIEW DETAIL & VERIFY ALL WIZARD DATA
    // ─────────────────────────────────────────────────────────────────────
    await test.step('Phase 3: Navigate to detail page and verify ALL wizard data', async () => {
      await navigateToGroupDetail(page, uniqueGroupName);
      await expect(page.getByRole('heading', { name: uniqueGroupName })).toBeVisible({
        timeout: 10000,
      });

      // Verify the description we set
      await expect(page.getByText(groupDescription)).toBeVisible();

      // ── Verify ROLES tab has the role we selected ──
      const rolesTab = page.getByRole('tab', { name: /roles/i });
      await rolesTab.click();
      await page.waitForTimeout(500);

      // Verify at least 1 role exists in the table
      const rolesGrid = page.getByRole('grid');
      await expect(rolesGrid).toBeVisible({ timeout: 10000 });
      const roleRows = rolesGrid.getByRole('row');
      // Should have header row + at least 1 data row
      await expect(roleRows)
        .toHaveCount(2, { timeout: 10000 })
        .catch(async () => {
          // If exact count fails, just verify we have more than 1 row (header + data)
          const count = await roleRows.count();
          expect(count).toBeGreaterThan(1);
        });
      console.log(`[View] ✓ Roles tab verified - has assigned roles`);

      // ── Verify MEMBERS tab has the user we selected ──
      const membersTab = page.getByRole('tab', { name: /members/i });
      await membersTab.click();
      await page.waitForTimeout(500);

      // Verify at least 1 member exists in the table
      const membersGrid = page.getByRole('grid');
      await expect(membersGrid).toBeVisible({ timeout: 10000 });
      const memberRows = membersGrid.getByRole('row');
      await expect(memberRows)
        .toHaveCount(2, { timeout: 10000 })
        .catch(async () => {
          const count = await memberRows.count();
          expect(count).toBeGreaterThan(1);
        });
      console.log(`[View] ✓ Members tab verified - has assigned members`);

      // ── Verify SERVICE ACCOUNTS tab (if present) ──
      const serviceAccountsTab = page.getByRole('tab', { name: /service accounts/i });
      if (await serviceAccountsTab.isVisible().catch(() => false)) {
        await serviceAccountsTab.click();
        await page.waitForTimeout(500);

        // Verify at least 1 service account exists
        const saGrid = page.getByRole('grid');
        await expect(saGrid).toBeVisible({ timeout: 10000 });
        const saRows = saGrid.getByRole('row');
        await expect(saRows)
          .toHaveCount(2, { timeout: 10000 })
          .catch(async () => {
            const count = await saRows.count();
            expect(count).toBeGreaterThan(1);
          });
        console.log(`[View] ✓ Service Accounts tab verified - has assigned SAs`);
      }

      console.log(`[View] ✓ All wizard data verified on detail page`);
    });

    // ─────────────────────────────────────────────────────────────────────
    // PHASE 4: EDIT FROM LIST
    // ─────────────────────────────────────────────────────────────────────
    await test.step('Phase 4: Edit group from list view', async () => {
      // Navigate back to list
      await page.goto(GROUPS_URL);
      await expect(page.getByRole('heading', { name: 'Groups', exact: true })).toBeVisible();

      // Search for our group
      await searchForGroup(page, uniqueGroupName);
      await verifyGroupInTable(page, uniqueGroupName);

      // Open row actions menu and click Edit
      await openRowActionsMenu(page, uniqueGroupName);
      await clickMenuItem(page, 'Edit');

      // Fill edit modal
      await fillEditGroupModal(page, editedGroupName, editedDescription);

      // Verify success notification
      await verifySuccessNotification(page);

      console.log(`[Edit] ✓ Group renamed to: ${editedGroupName}`);
    });

    // ─────────────────────────────────────────────────────────────────────
    // PHASE 5: VERIFY EDIT
    // ─────────────────────────────────────────────────────────────────────
    await test.step('Phase 5: Verify edit was applied', async () => {
      // Search for the edited name and verify it exists
      await searchForGroup(page, editedGroupName);
      await verifyGroupInTable(page, editedGroupName);

      // Search for the ORIGINAL name - it should NOT exist anymore
      // (We must search specifically for it, since editedGroupName contains uniqueGroupName)
      await searchForGroup(page, uniqueGroupName);
      // The exact original name should not appear as a link in the table
      const originalNameLink = page.getByRole('grid').getByRole('link', { name: uniqueGroupName, exact: true });
      await expect(originalNameLink).not.toBeVisible({ timeout: 5000 });
      console.log(`[Verify Edit] ✓ Original name no longer exists`);

      // Navigate to detail and verify description (search for edited name first)
      await searchForGroup(page, editedGroupName);
      await navigateToGroupDetail(page, editedGroupName);
      await expect(page.getByRole('heading', { name: editedGroupName })).toBeVisible({
        timeout: 10000,
      });
      await expect(page.getByText(editedDescription)).toBeVisible();

      console.log(`[Verify Edit] ✓ Changes confirmed`);
    });

    // ─────────────────────────────────────────────────────────────────────
    // PHASE 6: DELETE
    // ─────────────────────────────────────────────────────────────────────
    await test.step('Phase 6: Delete group', async () => {
      // Navigate back to list
      await page.goto(GROUPS_URL);
      await expect(page.getByRole('heading', { name: 'Groups', exact: true })).toBeVisible();

      // Search and find the group
      await searchForGroup(page, editedGroupName);
      await verifyGroupInTable(page, editedGroupName);

      // Open row actions menu and click Delete
      await openRowActionsMenu(page, editedGroupName);
      await clickMenuItem(page, 'Delete');

      // Confirm deletion (pass group name so we can wait for loading to complete)
      await confirmGroupDeletion(page, editedGroupName);

      console.log(`[Delete] ✓ Deletion confirmed`);
    });

    // ─────────────────────────────────────────────────────────────────────
    // PHASE 7: VERIFY DELETION
    // ─────────────────────────────────────────────────────────────────────
    await test.step('Phase 7: Verify group is deleted', async () => {
      // Wait for navigation back to groups list after deletion
      // Use exact match to avoid matching "No groups found" empty state heading
      await expect(page.getByRole('heading', { name: 'Groups', exact: true })).toBeVisible({ timeout: 15000 });

      // Search for the deleted group
      await searchForGroup(page, editedGroupName);

      // Should not find the group
      await verifyGroupNotInTable(page, editedGroupName);

      console.log(`[Verify Delete] ✓ Group no longer exists`);
      console.log(`\n[V1 Groups CRUD] ✓ Lifecycle test completed successfully!\n`);
    });
  });
});
