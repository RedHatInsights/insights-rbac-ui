/**
 * Shared helper functions for Access Management user journey tests
 *
 * These helpers provide consistent selectors and operations for:
 * - User groups table interactions
 * - Drawer operations
 * - Roles table interactions
 * - Modal operations
 * - API spy verification
 */

import { expect, waitFor, within } from 'storybook/test';
import type { UserEvent } from '@testing-library/user-event';
import { TEST_TIMEOUTS } from '../../../test-utils/testUtils';
import { type ScopedQueries, clearAndType, waitForModal } from '../../../test-utils/interactionHelpers';

export { waitForModal };

// =============================================================================
// TABLE SELECTORS
// =============================================================================

/**
 * Gets the User Groups table element
 */
export const getUserGroupsTable = async (canvas: ScopedQueries): Promise<HTMLElement> => {
  return canvas.findByRole('grid', { name: /user groups table/i });
};

/**
 * Gets the Roles table element
 */
export const getRolesTable = async (canvas: ScopedQueries): Promise<HTMLElement> => {
  return canvas.findByRole('grid', { name: /roles/i });
};

// =============================================================================
// ROW OPERATIONS
// =============================================================================

/**
 * Finds a user group row by name and returns the row element
 * Uses findByText with a function matcher to handle text in table cells
 */
export const findGroupRow = async (canvas: ScopedQueries, groupName: string, options?: { timeout?: number }): Promise<HTMLTableRowElement> => {
  let groupText!: HTMLElement;
  await waitFor(
    () => {
      const table = canvas.getByRole('grid', { name: /user groups table/i });
      groupText = within(table).getByText(groupName);
    },
    { timeout: options?.timeout ?? TEST_TIMEOUTS.ELEMENT_WAIT },
  );
  const row = groupText.closest('tr');
  expect(row).not.toBeNull();
  return row as HTMLTableRowElement;
};

/**
 * Clicks on a group row to open the group details drawer
 */
export const openGroupDrawer = async (canvas: ScopedQueries, user: UserEvent, groupName: string, options?: { timeout?: number }): Promise<void> => {
  const row = await findGroupRow(canvas, groupName, options);
  await user.click(row);
};

// =============================================================================
// TAB NAVIGATION
// =============================================================================

/**
 * Verifies the User Groups tab is selected
 */
export const verifyUserGroupsTabSelected = async (canvas: ScopedQueries): Promise<void> => {
  const groupsTab = await canvas.findByRole('tab', { name: /user groups/i });
  expect(groupsTab).toHaveAttribute('aria-selected', 'true');
};

// =============================================================================
// BUTTON HELPERS
// =============================================================================

/**
 * Clicks the "Create user group" button
 */
export const clickCreateUserGroupButton = async (canvas: ScopedQueries, user: UserEvent): Promise<void> => {
  const button = await canvas.findByRole('button', { name: /create user group/i });
  await user.click(button);
};

/**
 * Clicks the form submit button
 */
export const clickSubmitButton = async (canvas: ScopedQueries, user: UserEvent): Promise<void> => {
  const button = await canvas.findByRole('button', { name: /submit|create|save/i });
  await user.click(button);
};

/**
 * Clicks the form cancel button
 */
export const clickCancelButton = async (canvas: ScopedQueries, user: UserEvent): Promise<void> => {
  const button = await canvas.findByRole('button', { name: /cancel/i });
  await user.click(button);
};

// =============================================================================
// FORM HELPERS
// =============================================================================

/**
 * Fills in the group name field
 */
export const fillGroupName = async (canvas: ScopedQueries, user: UserEvent, name: string): Promise<void> => {
  await clearAndType(user, () => canvas.getByRole('textbox', { name: /^name$/i }) as HTMLInputElement, name);
};

/**
 * Fills in the group description field
 */
export const fillGroupDescription = async (canvas: ScopedQueries, user: UserEvent, description: string): Promise<void> => {
  await clearAndType(user, () => canvas.getByLabelText(/description/i) as HTMLTextAreaElement, description);
};

// =============================================================================
// API SPY VERIFICATION
// =============================================================================

/**
 * Verifies no API calls were made to a spy
 */
export const verifyNoApiCalls = (spy: ReturnType<typeof import('storybook/test').fn>): void => {
  expect(spy).not.toHaveBeenCalled();
};

/**
 * Verifies a delete role API call was made with expected role ID
 */
export const verifyDeleteRoleApiCall = (spy: ReturnType<typeof import('storybook/test').fn>, expectedRoleId: string): void => {
  expect(spy).toHaveBeenCalledWith(expectedRoleId);
};

// =============================================================================
// ROLES TABLE HELPERS
// =============================================================================

/**
 * Verifies a role does NOT exist in the table
 */
export const verifyRoleNotExists = async (canvas: ScopedQueries, roleName: string): Promise<void> => {
  await waitFor(
    () => {
      const table = canvas.queryByRole('grid', { name: /roles/i });
      if (table) {
        const tableScope = within(table);
        expect(tableScope.queryByText(roleName)).not.toBeInTheDocument();
      }
    },
    { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
  );
};

// =============================================================================
// MODAL HELPERS
// =============================================================================

/**
 * Clicks the cancel button in a modal
 */
export const clickModalCancelButton = async (user: UserEvent): Promise<void> => {
  const modalScope = await waitForModal({ timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
  const cancelButton = await modalScope.findByRole('button', { name: /cancel/i });
  await user.click(cancelButton);
};
